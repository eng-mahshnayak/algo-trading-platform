



import axios from "axios";
import Order from "../models/orderModel.js";
import { logSuccess, logError } from "../utils/loggerr.js";
import querystring from 'querystring';

// -----------------------
// API ENDPOINTS - KOTAK NEO
// -----------------------
const KOTAK_BASE_URL = process.env.KOTAK_BASE_URL || "https://neotradeapi.kotaksecurities.com";



const KOTAK_ORDER_BOOK_URL = `${KOTAK_BASE_URL}/quick/user/orders`;


// -----------------------
// HEADERS - KOTAK NEO
// -----------------------
const kotakHeaders = (user) => ({
  "Auth": user.authToken,
  "Sid": user.feedToken, // Kotak uses Sid for session
  "neo-fin-key": "neotradeapi",
  "Content-Type": "application/x-www-form-urlencoded",
  "Accept": "application/json"
});

// -----------------------
// HELPERS
// -----------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function extractBrokerError(err) {
  if (!err) return { status: null, msg: "Unknown error", data: null };

  const status = err?.response?.status || null;
  const data = err?.response?.data;

  let msg = "Unknown error";
  
  if (typeof data === "string") {
    msg = data;
  } else if (data?.emsg) {
    msg = data.emsg;
  } else if (data?.message) {
    msg = data.message;
  } else if (err?.message) {
    msg = err.message;
  }

  return { status, msg, data };
}

// -----------------------
// KOTAK POSITIONS FETCH
// -----------------------
const getKotakPositions = async (user, req, retries = 3) => {
  try {
    // Kotak mein positions fetch karne ke liye order book use kar sakte hain
    const res = await axios.get(KOTAK_ORDER_BOOK_URL, {
      headers: kotakHeaders(user)
    });

    return res.data;
  } catch (err) {
    const errorMsg = extractBrokerError(err).msg;

    logError(req, err, {
      msg: "Kotak get Positions",
      brokerMessage: errorMsg,
    });

    console.error("❌ Kotak Positions GET API Error:", errorMsg);

    // Rate limit retry
    if (retries > 0 && errorMsg.toLowerCase().includes("rate")) {
      console.warn(`⚠️ Rate limit hit. Retrying after 1.2 sec... (${retries} left)`);
      await sleep(1200);
      return getKotakPositions(user, req, retries - 1);
    }

    throw err;
  }
};


const hasKotakOpenPosition = (positionData, tradingSymbol) => {
  if (!positionData?.data) return false;

  // Kotak ke response structure ke according filter
  return positionData.data.some(
    (pos) =>
      pos.trdSym === tradingSymbol &&
      parseInt(pos.qty) !== 0
  );
};

// -----------------------
// KOTAK ORDER DETAILS POLLING (via Order History API)
// -----------------------
async function getKotakOrderDetailsWithPolling(user, orderNumber, req) {
  
  const maxPolls = 6;

  for (let i = 0; i < maxPolls; i++) {
    try {

    const KOTAK_ORDER_HISTORY_URL = `${user.refreshToken}/quick/user/orders`;

    const det = await axios.get(KOTAK_ORDER_HISTORY_URL, {
        headers: {
          ...kotakHeaders(user),
          "neo-fin-key": "neotradeapi"
        },
       
    });

    const history = det?.data?.data || [];

    const order = history.find(item => item.nOrdNo === orderNumber);

    console.log(order,'==========Kotak order history poll==========');
    

    const latestStatus = order?.ordSt || "";

      logSuccess(req, {
        msg: "Kotak order history poll",
        orderNumber,
        poll: i + 1,
        status: latestStatus,
      });

      // Status check - Kotak ke status codes
      if (["complete", "rejected", "cancelled", "after market order req received"].includes(latestStatus.toLowerCase())) {
        return order
      }

      await sleep(400 + i * 200);
    } catch (err) {
      const e = extractBrokerError(err);
      logError(req, err, { msg: "Kotak order history poll failed", extracted: e });

      if (e.status === 429 && String(e.msg).includes("rate")) {
        await sleep(600 + i * 400);
        continue;
      }

      if (i === maxPolls - 1) throw err;
      await sleep(500 + i * 300);
    }
  }

  return null;
}



let user = {
  authToken:"eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6WyJUcmFkZSJdLCJleHAiOjE3NzQwMzE0MDAsImp0aSI6ImZmNGIxNjZjLTI1YmUtNDRhNy05OGVlLTZiOTZhOTliZTViOCIsImlhdCI6MTc3Mzk4NzQ5MSwiaXNzIjoibG9naW4tc2VydmljZSIsInN1YiI6IjFjMGZmMjU0LTg4ZDgtNDhiOS1hYzM1LWY2MTM0YTVhY2QzNiIsInVjYyI6IlYyVVRMIiwibmFwIjoiIiwieWNlIjoiZVlcXDZcdTAwMjYkPzVcInVcdFx1MDAwZlx1MDAwN3RcdTAwMDBcdTAwMTBiIiwiZmV0Y2hjYWNoaW5ncnVsZSI6MCwiY2F0ZWdvcmlzYXRpb24iOiIifQ.MrjzBaHUjeurRR3wguj_SzmebUpXgOVHzURnBXDG50zbCtUp5xbOvrv2d5NbpNwIxXADE-xMZElr-L1_Ye4YPhy6W59fFLDvPybPEwy5LESFhe2liYU_A6Ds8Fbs6ycgS3F3f8IOs8MicjiZxlZpGugBpk0aypo_nTj5i54bQVa-Oqla2zrCad7snfOACksCLFbsSv2WyzQAiUVIPBC0JGQEWkbKTs3tDGejWHlHtRHM3Wb6zInN5XR0KcaiNk_sPQz9Sc7zS8PdoTmiK8xZRVaPEH_wWarXwNFj6boie7ixLTjtCPFg8O5Khn67fv98AwUityiX7sasBudooraVbA",
  feedToken:"143729c2-9beb-40cd-8181-3e90c4fb62dc",
  refreshToken:"https://e22.kotaksecurities.com"
}

// getKotakOrderDetailsWithPolling(user,'260320000629390',null)



// -----------------------
// KOTAK TRADE BOOK WITH RETRY
// -----------------------
async function getKotakTradebookWithRetry(
  user,
  orderNumber,
  expectedQty,
  req,
  maxTry = 5
) {
  let lastTradebook = null;

  const KOTAK_TRADE_BOOK_URL = `${user.refreshToken}/quick/user/trades`;

  for (let i = 0; i < maxTry; i++) {
    try {
      const tradeRes = await axios.get(KOTAK_TRADE_BOOK_URL, {
        headers: kotakHeaders(user)
      });

      const trades = tradeRes?.data?.data || [];

      // Kotak mein order number "nOrdNo" field mein hota hai
      const orderTrades = trades.filter(t => String(t.nOrdNo) === String(orderNumber));

      const totalQty = orderTrades.reduce((sum, t) => sum + Number(t.fldQty || 0), 0);

       console.log(orderTrades,'==============totalQty========');

      logSuccess(req, {
        msg: "Kotak tradebook retry",
        attempt: i + 1,
        tradesCount: trades.length,
        totalQty,
        expectedQty,
      });

      if (totalQty >= expectedQty) {
        return orderTrades;
      }

      lastTradebook = tradeRes.data;
    } catch (err) {
      const e = extractBrokerError(err);

      logError(req, err, {
        msg: "Kotak tradebook retry failed",
        attempt: i + 1,
        extracted: e,
      });

      if (e.status === 429 && String(e.msg).includes("rate")) {
        await sleep(800 * Math.pow(2, i));
        continue;
      }

      if (!e.status) {
        await sleep(600 * Math.pow(2, i));
        continue;
      }

      throw err;
    }

    await sleep(500);
  }

  return lastTradebook;
}

// getKotakTradebookWithRetry(user,"260320000629390",'1',null)







const mapProductType = (type) => {
  const mapping = {
    INTRADAY: "MIS",
    DELIVERY: "CNC",
    CARRYFORWARD: "NRML",
    BO: "BO",
    MARGIN: "MTF",
  };

  return mapping[type] || "";
};



// -----------------------
// MAIN KOTAK PLACE ORDER FUNCTION
// -----------------------
export const placeKotakOrder = async (user, reqInput, req, sellQuantityPartial = 0) => {
  
  let tempOrder = null;
  let existingBuyOrder = null;
  const nowISOError = new Date().toISOString();

  try {

     let symbol =
  reqInput?.transactiontype === "BUY"
    ? reqInput?.kotakSymobol
    : reqInput?.symbol;

     let symbolExchange =
  reqInput?.transactiontype === "BUY"
    ? reqInput.kotakExchange
    : reqInput?.exch_seg;
    
    // Check existing OPEN BUY order
    if ((reqInput.transactiontype || "").toUpperCase() === "BUY") {
      existingBuyOrder = await Order.findOne({
        where: {
          userId: user.id,
          tradingsymbol: symbol,
          transactiontype: "BUY",
          orderstatuslocaldb: "OPEN",
          status: "COMPLETE",
        },
      });

      if (existingBuyOrder) {
        logSuccess(req, {
          msg: "Found existing OPEN BUY order for potential merge",
          orderid: existingBuyOrder.orderid,
          id: existingBuyOrder?.id,
        });
      }
    }

   const pc =
  reqInput?.transactiontype === "BUY"
    ? mapProductType(reqInput.productType)
    : reqInput.productType;

    // Create temp order in DB
    const orderData = {
      variety: reqInput.variety || "NORMAL",
      tradingsymbol: symbol,
      instrumenttype: reqInput.instrumenttype || "",
      symboltoken: reqInput.token || "",
      transactiontype: reqInput.transactiontype,
      exchange: symbolExchange || "nse_cm",
      ordertype: reqInput.orderType || reqInput.pt || "MKT",
      quantity: String(reqInput.quantity),
      fillsize: String(reqInput.quantity),
      producttype: pc || "CNC",
      duration: reqInput.duration || reqInput.rt || "DAY",
      price: reqInput.price || reqInput.pr || "0",
      triggerprice: reqInput.triggerprice || reqInput.tp || "0",
      squareoff: reqInput.squareoff || reqInput.sov || "0",
      stoploss: reqInput.stoploss || reqInput.slv || "0",
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice ?? null,
      actualQuantity: reqInput.actualQuantity ?? null,
      userId: user.id,
      userNameId: user.username,
      ordertag: reqInput.ordertag || "softwaresetu",
      broker: "kotak",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      buyOrderId: reqInput?.buyOrderId || null,
      strategyName: reqInput?.groupName || reqInput?.strategyName || "",
      strategyUniqueId: reqInput?.strategyUniqueId || "",
      text: reqInput?.text || "",
    };

    // For SELL orders, check if position exists

    // if (reqInput.transactiontype === 'SELL') {
    //   logSuccess(req, { msg: "Before Check User Position for SELL order" });

    //   const positions = await getKotakPositions(user, req);

    //   logSuccess(req, { msg: "After Check User Position for SELL order" });

    //   if (!hasKotakOpenPosition(positions, reqInput.kotakSymobol)) {
    //     await kotakFIFOWithAPI(user, reqInput?.kotakSymobol, req);
    //     return { result: "BROKER_REJECTED", orderid: "" };
    //   }
    // }

    tempOrder = await Order.create(orderData);

    logSuccess(req, {
      msg: `Kotak Temp ${reqInput.transactiontype} order created in DB`,
      tempOrderId: tempOrder.id,
      quantity: tempOrder.quantity,
    });

    // Prepare Kotak order payload
    const kotakOrderPayload = {
      am: "NO",
      dq: "0",
      es: symbolExchange || "nse_cm",
      mp:  "0",
      pc: pc || "CNC",
      pf:  "N",
      pr:  "0",
      pt:  "MKT",
      qt: String(reqInput.quantity),
      rt:  "DAY",
      tp:"0",
      ts: symbol,
      tt: reqInput.transactiontype === "BUY" ? "B" : "S",
    };

   

    // Place order with Kotak
    let placeRes;
    try {
      const formData = querystring.stringify({
        jData: JSON.stringify(kotakOrderPayload)
      });

      const KOTAK_PLACE_ORDER_URL = `${user.refreshToken}/quick/order/rule/ms/place`;

      placeRes = await axios.post(KOTAK_PLACE_ORDER_URL, formData, {
        headers: kotakHeaders(user)
      });


      console.log(placeRes,'================placeRes============');
      

      logSuccess(req, {
        msg: "Kotak API call success: order placed",
        orderType: reqInput.transactiontype,
        tempOrderId: tempOrder.id,
      });
    } catch (err) {
       console.log(err.response.data.errMsg,'================err============');
      await tempOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        positionStatus: "FAILED",
        text:err?.response?.data?.errMsg,
      });
      logError(req, {
        msg: "Kotak API call failed: order rejected",
        error: extractBrokerError(err).msg,
        tempOrderId: tempOrder.id,
      });
      return { result: "BROKER_REJECTED" };
    }

    if (placeRes.data.stat !== "Ok") {
      await tempOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        positionStatus: "FAILED",
        text: placeRes.data?.emsg || "Unknown error",
      });
      logError(req, {
        msg: "Kotak order rejected by broker",
        brokerMessage: placeRes.data?.emsg,
        tempOrderId: tempOrder.id,
      });
      return { result: "BROKER_REJECTED" };
    }

    const orderNumber = placeRes.data.nOrdNo;
    await tempOrder.update({ orderid: orderNumber });

    logSuccess(req, {
      msg: "Kotak order successfully registered in DB",
      orderNumber,
    });

    // Poll order history for status
    const historyData = await getKotakOrderDetailsWithPolling(user, orderNumber, req);
    const historyStatus = historyData.ordSt || "";
    const historyMsg = historyData?.rejRsn || "";

     console.log(historyData,'=============historyData=================');
    

    if (["rejected", "cancelled"].includes(historyStatus.toLowerCase())) {
      await tempOrder.update({
        orderstatuslocaldb: historyStatus.toUpperCase(),
        status: historyStatus.toUpperCase(),
        positionStatus: historyStatus.toUpperCase(),
        text: historyMsg,
      });
      logSuccess(req, {
        msg: `Kotak order ${historyStatus.toUpperCase()}`,
        orderNumber,
        tempOrderId: tempOrder.id,
      });

      return { result: historyStatus.toUpperCase() };
    }

    // Fetch trade book
    const trades = await getKotakTradebookWithRetry(user, orderNumber, reqInput.quantity, req);
   

    if (!trades?.length) {
      await tempOrder.update({
        orderstatuslocaldb: "OPEN",
        positionStatus: "OPEN",
        status: historyStatus === "complete" ? "COMPLETE" : "OPEN",
        text: "TRADE_NOT_FOUND_YET",
      });
      logSuccess(req, {
        msg: "Trade not found yet in Kotak tradebook",
        tempOrderId: tempOrder.id,
      });
      return { result: "PENDING" };
    }

    let totalQty = 0;
    let totalValue = 0;
    trades.forEach(t => {
      totalQty += Number(t.fldQty);
      totalValue += Number(t.fldQty) * Number(t.avgPrc);
    });


    console.log(trades,'=============trades=================');
    

    const avgPrice = totalValue / totalQty;
    const matched = trades[0];

    // Handle SELL pairing
    let finalStatus = "OPEN";
    let positionStatus = "OPEN";
    let buyOrder = null;

    if ((reqInput.transactiontype || "").toUpperCase() === "SELL") {

      finalStatus = "COMPLETE";
      positionStatus = "COMPLETE";

      buyOrder = await Order.findOne({
        where: { 
          userId: user.id, 
          orderid: reqInput.buyOrderId,
          orderstatuslocaldb: "OPEN",
          status: "COMPLETE",
        },
      });

      const originalQty = Number(buyOrder?.fillsize || buyOrder?.quantity || 0);
      const usedQty = totalQty;
      const remainingBuyQty = originalQty - usedQty;

   
      console.log(matched,'==============matched==============');
      

      await tempOrder.update({
        uniqueorderid:matched.exOrdId,
        fillid:matched.locId,
        fillsize: totalQty,
        quantity: totalQty,
        tradedValue: avgPrice * totalQty,
        price: avgPrice,
        fillprice: avgPrice,
        filltime: nowISOError,
        pnl: (avgPrice - Number(buyOrder?.fillprice || 0)) * totalQty || 0,
        buyOrderId: reqInput?.buyOrderId || buyOrder?.orderid,
        buyTime: buyOrder?.filltime,
        buyprice: buyOrder?.fillprice,
        buysize: totalQty,
        buyvalue: buyOrder?.tradedValue,
        positionStatus:"COMPLETE",
        status: "COMPLETE",
        orderstatuslocaldb: "COMPLETE",
      });

      logSuccess(req, {
        msg: "Kotak SELL order executed successfully",
        tempOrderId: tempOrder.id,
        sellQty: totalQty,
      });

      // Handle partial SELL
      if (remainingBuyQty > 0 && buyOrder) {
        await buyOrder.update({
          fillsize: remainingBuyQty,
          quantity: remainingBuyQty,
          tradedValue: Number(buyOrder.tradedValue || 0) - ( Number(buyOrder.fillprice || buyOrder.price) * totalQty),
        });

        const buyFillPrice = Number(buyOrder.fillprice || buyOrder.price);

        await Order.create({
          variety: buyOrder.variety,
          tradingsymbol: buyOrder.tradingsymbol,
          instrumenttype: buyOrder.instrumenttype,
          symboltoken: buyOrder.symboltoken,
          transactiontype: "BUY",
          exchange: buyOrder.exchange,
          ordertype: buyOrder.ordertype,
          producttype: buyOrder.producttype,
          duration: buyOrder.duration,
          quantity: usedQty,
          fillsize: usedQty,
          price: buyFillPrice,
          fillprice: buyFillPrice,
          tradedValue: buyFillPrice * usedQty,
          buyvalue: 0,
          userId: buyOrder.userId,
          userNameId: buyOrder.userNameId,
          broker: buyOrder.broker,
          strategyName: buyOrder.strategyName,
          strategyUniqueId: buyOrder.strategyUniqueId,
          filltime: buyOrder.filltime,
          orderid: buyOrder.orderid,
          uniqueorderid: buyOrder.uniqueorderid,
          fillprice: buyOrder.fillprice,
          orderstatuslocaldb: "COMPLETE",
          status: "COMPLETE",
          positionStatus: "COMPLETE",
          text: "BUY_SPLIT_FOR_SELL",
        });

        logSuccess(req, {
          msg: "BUY clone inserted for partial SELL",
          cloneQty: usedQty,
        });

        return {
          result: "SUCCESS",
          orderid: "",
          userId: user.id,
          broker: "Kotak",
        };
      } else if (buyOrder) {
        await buyOrder.update({
          orderstatuslocaldb: "COMPLETE",
          positionStatus: "COMPLETE",
        });

     

        logSuccess(req, {
          msg: "Updated Full BUY Quantity to COMPLETE",
        });

        return {
          result: "SUCCESS",
          orderid: "",
          userId: user.id,
          broker: "Kotak",
        };
      }
    }

    // Handle BUY merge
    if ((reqInput.transactiontype || "").toUpperCase() === "BUY" && existingBuyOrder) {
      const mergedQty = Number(existingBuyOrder.fillsize || 0) + totalQty;
      const mergedValue = Number(existingBuyOrder.tradedValue || 0) + avgPrice * totalQty;
      const mergedAvg = mergedValue / mergedQty;

      await existingBuyOrder.update({
        fillsize: mergedQty,
        quantity: mergedQty,
        tradedValue: mergedValue,
        price: mergedAvg,
        fillprice: mergedAvg,
      });

      await tempOrder.destroy();
      logSuccess(req, {
        msg: "Existing BUY merged with new BUY",
        existingBuyId: existingBuyOrder.id,
        mergedQty,
      });

      return {
        result: "SUCCESS",
        orderid: existingBuyOrder.id,
        userId: user.id,
        broker: "Kotak",
      };
    }

    // Final update for this order
    const pnl = tempOrder.transactiontype === "SELL" && buyOrder
      ? avgPrice * totalQty - Number(buyOrder?.fillprice) * totalQty
      : 0;

    await tempOrder.update({
      tradedValue: avgPrice * totalQty,
      uniqueorderid:matched.exOrdId,
      fillid:matched.locId,
      fillprice: avgPrice,
      price: avgPrice,
      fillsize: totalQty,
      quantity: totalQty,
      filltime: nowISOError,
      pnl,
      buyOrderId: buyOrder?.orderid || 0,
      buyprice: buyOrder?.fillprice || 0,
      buyTime: buyOrder?.filltime || null,
      buysize: tempOrder?.transactiontype === "SELL" ? totalQty : 0,
      buyvalue: totalQty * (buyOrder?.fillprice || 0),
      positionStatus:positionStatus ,
      status: "COMPLETE",
      orderstatuslocaldb: finalStatus,
    });

    return {
      userId: user.id,
      broker: "Kotak",
      result: "SUCCESS",
      orderid: orderNumber,
    };

  } catch (err) {
    if (tempOrder?.id) {
      await tempOrder.update({
        orderstatuslocaldb: "FAILED",
        positionStatus: "FAILED",
        status: "FAILED",
        text: err.message,
      });
    }
    logError(req, {
      msg: "placeKotakOrder failed with error",
      error: err.message,
      tempOrderId: tempOrder?.id,
    });

    return {
      broker: "Kotak",
      result: "ERROR",
      message: err.message,
    };
  }
};