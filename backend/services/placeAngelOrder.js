

import axios from "axios";
import Order from "../models/orderModel.js";
import { logSuccess, logError } from "../utils/loggerr.js";



// -----------------------
// API ENDPOINTS
// -----------------------
const ANGEL_ONE_PLACE_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/placeOrder";

const ANGEL_ONE_DETAILS_URL = (uniqueId) =>
  `https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/details/${uniqueId}`;

const ANGEL_ONE_TRADE_BOOK_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook";

const ANGEL_ONE_POSITION_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getPosition";  

const ANGEL_ONE_ORDER_BOOK_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getOrderBook";










// -----------------------
// HEADERS
// -----------------------
const angelHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  "Accept": "application/json",
  "X-UserType": "USER",
  "X-SourceID": "WEB",
  'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
  'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
  'X-MACAddress': process.env.MAC_Address, 
  'X-PrivateKey': process.env.PRIVATE_KEY, 
});



// -----------------------
// HELPERS
// -----------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function extractBrokerError(err) {

  if (!err) return { status: null, msg: "Unknown error", data: null };

  const status = err?.response?.status || null;
  const data = err?.response?.data;

  const msg =
    (typeof data === "string" && data) ||
    data?.message ||
    data?.emsg ||
    err?.message ||
    "Unknown error";

  return { status, msg, data };
}



const getAngelPositions = async (user,req,retries = 3) => {
  try {
    const res = await axios.get(ANGEL_ONE_POSITION_URL, {
      headers: angelHeaders(user.authToken),
    });

    return res.data;
  } catch (err) {

    const errorMsg =
      err.response?.data?.message ||
      err.response?.data ||
      err.message;

    logError(req,err, {
        msg: "AngelOne get Position",
        brokerMessage:  errorMsg,
      });

    
    console.error(
      "❌ Angel One Position GET API Error:",
      errorMsg
    );

     // ⭐ Retry ONLY if rate limit
    if (
      retries > 0 &&
      typeof errorMsg === "string" &&
      errorMsg.toLowerCase().includes("access rate")
    ) {

      console.warn(`⚠️ Rate limit hit. Retrying after 1.2 sec... (${retries} left)`);

      await sleep(1200); // ⭐ IMPORTANT (>1 sec)

      return getAngelPositions(user,req, retries - 1);
    }

    throw err;
  }
};



const hasAngelOpenPosition = (positionData, tradingSymbol) => {
  if (!positionData?.data) return false;

  return positionData.data.some(
    (pos) =>
      pos.tradingsymbol === tradingSymbol &&
      Number(pos.netqty) !== 0
  );
};


async function getDetailsWithPolling(user, uniqueOrderId, req) {
  const maxPolls = 6;

  for (let i = 0; i < maxPolls; i++) {
    try {
      const det = await axios.get(ANGEL_ONE_DETAILS_URL(uniqueOrderId), {
        headers: angelHeaders(user.authToken),
      });

      const st = det?.data?.data?.status;

      logSuccess(req, {
        msg: "AngelOne details poll",
        uniqueOrderId,
        poll: i + 1,
        status: st,
      });

      if (st === "complete" || st === "rejected" || st === "cancelled") {
        return det.data;
      }

      // open/pending/transit etc -> wait then retry
      await sleep(400 + i * 200);
    } catch (err) {
      const e = extractBrokerError(err);
      logError(req, err, { msg: "AngelOne details poll failed", extracted: e });

      // If rate limited, wait and retry
      if (e.status === 403 && String(e.msg).includes("exceeding access rate")) {
        await sleep(600 + i * 400);
        continue;
      }

      if (i === maxPolls - 1) throw err;
      await sleep(500 + i * 300);
    }
  }

  return null;
}


async function getTradebookWithRetry(
  user,
  orderid,
  expectedQty,
  req,
  maxTry = 5
) {
  let lastTradebook = null;

  for (let i = 0; i < maxTry; i++) {
    try {
      const tradeRes = await axios.get(ANGEL_ONE_TRADE_BOOK_URL, {
        headers: angelHeaders(user.authToken),
      });

      const trades = tradeRes?.data?.data || [];

      const orderTrades = trades.filter(t => String(t.orderid) === String(orderid));

      const totalQty = orderTrades.reduce((sum, t) => sum + Number(t?.fillsize || t?.quantity || 0), 0);

      logSuccess(req, {
        msg: "AngelOne tradebook retry",
        attempt: i + 1,
        tradesCount: trades.length,
        totalQty,
        expectedQty,
      });

      // ✅ FULL FILL CONFIRMED
      if (totalQty >= expectedQty) {
        return tradeRes.data;
      }

      lastTradebook = tradeRes.data;
    } catch (err) {
      const e = extractBrokerError(err);

      logError(req, err, {
        msg: "AngelOne tradebook retry failed",
        attempt: i + 1,
        extracted: e,
      });

      // rate limit
      if (e.status === 403 && String(e.msg).includes("exceeding access rate")) {
        await sleep(800 * Math.pow(2, i));
        continue;
      }

      // network error
      if (!e.status) {
        await sleep(600 * Math.pow(2, i));
        continue;
      }

      throw err;
    }

    // wait before next poll
    await sleep(500);
  }

  // ❗ retries exhausted → return best available snapshot
  return lastTradebook;
}

// ======================= codde auto sell fetch code start  =======================


function angelTimeToISO(dateStr) {
  return dateStr
    ? new Date(dateStr + " GMT+0530").toISOString()
    : null;
}


async function angelOneFIFOWithAPI(headers, symbol,user,req) {

  try {

    const ORDER_BOOK_URL =
    "https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/getOrderBook";

  const TRADE_BOOK_URL =
    "https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/getTradeBook";

  const normalize = v => v?.trim().toUpperCase();

  // 1️⃣ Fetch OrderBook & TradeBook
  const [orderRes, tradeRes] = await Promise.all([
    axios.get(ORDER_BOOK_URL, { headers }),
    axios.get(TRADE_BOOK_URL, { headers })
  ]);

  const orderBook = orderRes?.data?.data || [];
  const tradeBook = tradeRes?.data?.data || [];

  // 2️⃣ Group TradeBook by orderid
  const tradeMap = new Map();
  for (const t of tradeBook) {
    const key = String(t.orderid);
    if (!tradeMap.has(key)) tradeMap.set(key, []);
    tradeMap.get(key).push(t);
  }

  // 3️⃣ Filter completed orders for symbol (FIFO)
  const orders = orderBook
    .filter(o =>
      normalize(o.tradingsymbol) === normalize(symbol) &&
      o.status === "complete"
    )
    .sort((a, b) => new Date(a.updatetime) - new Date(b.updatetime));

  const buyQueue = [];
  const results = [];

  // 4️⃣ FIFO Matching
  for (const o of orders) {

    const orderQty = Number(o.quantity);

    // ===== BUY =====
    if (o.transactiontype === "BUY") {
      buyQueue.push({
        qty: orderQty,
        price: Number(o.averageprice || o.price),
        orderid: o.orderid,
        uniqueorderid: o.uniqueorderid,
        fillid: tradeMap.get(String(o.orderid))?.[0]?.fillid || null,
        tradeid: tradeMap.get(String(o.orderid))?.[0]?.tradeid || null,
        time: o.updatetime
      });
    }

    // ===== SELL =====
    if (o.transactiontype === "SELL") {

      const sellTrades = tradeMap.get(String(o.orderid)) || [];
      if (!sellTrades.length) continue;

      // 🔥 Merge SELL fills
      let totalSellQty = 0;
      let totalSellValue = 0;

      for (const t of sellTrades) {
        const q = Number(t.fillsize);
        const p = Number(t.fillprice);
        totalSellQty += q;
        totalSellValue += q * p;
      }

      const avgSellPrice = totalSellValue / totalSellQty;

      let remainingQty = totalSellQty;
      let totalPnl = 0;
      let buyOrderIds = [];

      // FIFO consume BUYs
      while (remainingQty > 0 && buyQueue.length) {
        const buy = buyQueue[0];
        const matchedQty = Math.min(buy.qty, remainingQty);

        totalPnl += (avgSellPrice - buy.price) * matchedQty;
        remainingQty -= matchedQty;
        buy.qty -= matchedQty;

        buyOrderIds.push(buy.orderid);

        if (buy.qty === 0) buyQueue.shift();
      }

      // ✅ PUSH SINGLE OBJECT
      results.push({
        symbol: o.tradingsymbol,

        buyOrderIds, // multiple BUYs possible
        sellOrderId: o.orderid,
        ordertag: o?.ordertag,
        sellUniqueOrderId: o.uniqueorderid,

        buyPriceAvg: null, // optional if you want
        sellPriceAvg: Number(avgSellPrice.toFixed(2)),

        quantity: totalSellQty,
        pnl: Number(totalPnl.toFixed(2)),

        sellFillIds: sellTrades.map(t => t.fillid),
        sellTradeIds: sellTrades.map(t => t.tradeid || null),

        buyTime: buyOrderIds.length ? buyQueue[0]?.time : null,
        sellTime: o.updatetime,

        broker: "ANGELONE"
      });
    }
  }

      let orderBuyFind = await Order.findOne({
        where: {
          orderid: results[0]?.buyOrderIds,
          transactiontype: "BUY"
        },
        order: [["createdAt", "ASC"]],
        raw:true
      });

       const sellPayload = {
      userId:orderBuyFind?.userId||"",
      userNameId:orderBuyFind?.userNameId||"",
      tradingsymbol:orderBuyFind?.tradingsymbol||"",
      variety:orderBuyFind?.variety||"",
      ordertype:orderBuyFind?.ordertype||"",
      producttype:orderBuyFind?.producttype||"",
      duration:orderBuyFind?.duration||"",
      exchange:orderBuyFind?.exchange||"",
      symboltoken:orderBuyFind?.symboltoken||"",
      instrumenttype:orderBuyFind?.instrumenttype||"",
      optiontype:orderBuyFind?.optiontype||"",
      text:"User Manual Sell",
      ordertag:"User Manual Sell",
      angelOneToken:orderBuyFind?.angelOneToken||"",
      angelOneSymbol:orderBuyFind?.angelOneSymbol||"",
      strategyName:orderBuyFind?.strategyName||"",
      strategyUniqueId:orderBuyFind?.strategyUniqueId||"",
      transactiontype: "SELL",
      orderid: results[0]?.sellOrderId||"",
      uniqueorderid: results[0]?.sellUniqueOrderId||"",
      quantity: orderBuyFind?.fillsize||results[0]?.quantity||0,
      actualQuantity: results[0]?.quantity||0,
      buyOrderId:orderBuyFind?.orderid||"",
      buyTime:orderBuyFind?.filltime||"",
      buysize:orderBuyFind?.fillsize||"",
      buyprice: orderBuyFind?.fillprice||"",
      buyvalue:  orderBuyFind?.tradedValue||"",
      price: results[0]?.sellPriceAvg||"",
      fillprice:results[0]?.sellPriceAvg||0,
      fillid:results[0]?.sellFillIds[0]||0,
      tradedValue:results[0]?.sellPriceAvg*results[0]?.quantity||0,
      fillsize:orderBuyFind?.fillsize||results[0]?.quantity||0,
      pnl: Number(results[0]?.pnl.toFixed(5))||0,
      status: "COMPLETE",
      orderstatus: "COMPLETE",
      positionStatus:"COMPLETE",
      orderstatuslocaldb:"COMPLETE",
      filltime: angelTimeToISO(results[0]?.sellTime),
      broker:orderBuyFind?.broker||"",
    };

     await Order.create(sellPayload);

     await Order.update(
      {
        orderstatus: "COMPLETE",
        orderstatuslocaldb: "COMPLETE",
        positionStatus: "COMPLETE",
      },
      {
        where: {
          id: orderBuyFind?.id   // ✅ safest (primary key)
        }
      }
    );

  return results;
    
  } catch (err) {

    console.log(err);
    

     logError(req, {
        msg: "angelOneFIFOWithAPI",
        error:err?.message||err,
        userId:user?.id
      });

       return [];
    
  }

  
}

// ======================= codde auto sell fetch code start  =======================

// =======================
// SINGLE placeAngelOrder (FULL UPDATED)
// =======================
export const placeAngelOrder = async (user, reqInput, req, sellQuantityPartial = 0) => {
  
  let tempOrder = null;          // NEW TEMP ORDER (BUY/SELL)
  let existingBuyOrder = null;   // OLD OPEN BUY
  const nowISOError = new Date().toISOString();

   logSuccess(req, {
      msg: `incoming data`,
      body:reqInput
    });

  try {
    
    // ====================================================
    // 1️⃣ READ existing BUY (NO UPDATE HERE)
    // ====================================================
    if ((reqInput.transactiontype || "").toUpperCase() === "BUY") {
      existingBuyOrder = await Order.findOne({
        where: {
          userId: user.id,
          ordertype: reqInput.orderType,
          producttype: reqInput.productType,
          tradingsymbol: reqInput.symbol,
          transactiontype: "BUY",
          orderstatuslocaldb: "OPEN",
          status:"COMPLETE",
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

    // ====================================================
    // 2️⃣ ALWAYS CREATE NEW TEMP ORDER
    // ====================================================
    const orderData = {
      variety: reqInput.variety || "NORMAL",
      tradingsymbol: reqInput.symbol,
      instrumenttype: reqInput.instrumenttype,
      symboltoken: reqInput.token,
      transactiontype: reqInput.transactiontype,
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: String(reqInput.quantity),
      fillsize: String(reqInput.quantity),
      producttype: reqInput.productType,
      duration: reqInput.duration,
      price: reqInput.price || "0",
      triggerprice: reqInput.triggerprice || 0,
      squareoff: reqInput.squareoff || 0,
      stoploss: reqInput.stoploss || 0,
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice ?? null,
      actualQuantity: reqInput.actualQuantity ?? null,
      userId: user.id,
      userNameId: user.username,
      ordertag: "softwaresetu",
      broker: "angelone",
      buyOrderId: reqInput?.buyOrderId || null,
      strategyName: reqInput?.groupName || "",
      strategyUniqueId: reqInput?.strategyUniqueId || "",
      text: reqInput?.text||"",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
    };

    if(reqInput.transactiontype==='SELL') {

       logSuccess(req, {
        msg: "Before Check User Position for SELL order ",
      });

      const positions = await getAngelPositions(user,req,);

     logSuccess(req, {
        msg: "After Check User Position for SELL order ",
      });


    if (
      !hasAngelOpenPosition(positions, reqInput.symbol)
      )  {

      await angelOneFIFOWithAPI(angelHeaders(user?.authToken),reqInput?.symbol,user,req)
  
      return { result: "BROKER_REJECTED", orderid: "" };
     
    }
      
    }
   

    tempOrder = await Order.create(orderData);
    
    logSuccess(req, {
      msg: `Temp ${reqInput.transactiontype} order created in DB`,
      tempOrderId: tempOrder.id,
      quantity: tempOrder.quantity,
    });

    // ====================================================
    // 3️⃣ PLACE BROKER ORDER
    // ====================================================
    let placeRes;
    try {
      placeRes = await axios.post(
        ANGEL_ONE_PLACE_URL,
        {
          variety: (reqInput.variety || "NORMAL").toUpperCase(),
          tradingsymbol: reqInput.symbol,
          symboltoken: String(reqInput.token),
          transactiontype: reqInput.transactiontype.toUpperCase(),
          exchange: reqInput.exch_seg,
          ordertype: reqInput.orderType.toUpperCase(),
          producttype: reqInput.productType.toUpperCase(),
          duration: "DAY",
          ordertag:"softwareetu",
          price: reqInput.price || 0,
          triggerprice: reqInput.triggerprice || 0,
          squareoff: reqInput.squareoff || 0,
          stoploss: reqInput.stoploss || 0,
          quantity: Number(reqInput.quantity),
        },
        { headers: angelHeaders(user.authToken) }
      );
      logSuccess(req, {
        msg: "AngelOne API call success: order placed",
        orderType: reqInput.transactiontype,
        tempOrderId: tempOrder.id,
      });
    } catch (err) {
      await tempOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        positionStatus: "FAILED",
        text: extractBrokerError(err).msg,
      });
      logError(req, {
        msg: "AngelOne API call failed: order rejected",
        error: extractBrokerError(err).msg,
        tempOrderId: tempOrder.id,
      });
      return { result: "BROKER_REJECTED" };
    }

    if (!placeRes.data?.status) {
      await tempOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        positionStatus: "FAILED",
        text: placeRes.data?.message,
      });
      logError(req, {
        msg: "AngelOne order rejected by broker",
        brokerMessage: placeRes.data?.message,
        tempOrderId: tempOrder.id,
      });
      return { result: "BROKER_REJECTED" };
    }

    const orderid = placeRes.data.data.orderid;
    const uniqueOrderId = placeRes.data.data.uniqueorderid;

    await tempOrder.update({ orderid, uniqueorderid: uniqueOrderId });
    logSuccess(req, {
      msg: "AngelOne order successfully registered in DB",
      orderid,
      uniqueOrderId,
    });

    // ====================================================
    // 4️⃣ DETAILS POLLING
    // ====================================================
    const detData = await getDetailsWithPolling(user, uniqueOrderId, req);
    const detailsStatus = detData?.data?.status;
    const detailsText = detData?.data?.text || "";

    if ([ 
        "open",
        "trigger pending",
        "rejected",
        "cancelled",
        "pending",
      ].includes(detailsStatus)) {
      await tempOrder.update({
        orderstatuslocaldb: detailsStatus.toUpperCase(),
        status: detailsStatus.toUpperCase(),
        positionStatus: detailsStatus.toUpperCase(),
        text: detailsText,
      });
      logSuccess(req, {
        msg: `AngelOne order ${detailsStatus.toUpperCase()}`,
        orderid,
        tempOrderId: tempOrder.id,
        brokerMessage: detailsText,
      });


      if(reqInput.transactiontype.toUpperCase()==='SELL'&& detailsStatus.toUpperCase()==='REJECTED') {

         await angelOneFIFOWithAPI(angelHeaders(user?.authToken),reqInput?.symbol,user,req)
           
      }

      return { result: detailsStatus.toUpperCase() };
    }

    // ====================================================
    // 5️⃣ TRADEBOOK
    // ====================================================
    const tradeData = await getTradebookWithRetry(user, orderid,reqInput.quantity, req);
    const fills = tradeData?.data?.filter(t => String(t.orderid) === String(orderid));

    if (!fills?.length) {
      await tempOrder.update({
        orderstatuslocaldb: "OPEN",
        positionStatus: "OPEN",
        status: detailsStatus === "complete" ? "COMPLETE" : "OPEN",
        text: "TRADE_NOT_FOUND_YET ,MAYBE ORDER IS REJECTED !",
      });
      logSuccess(req, {
        msg: "Trade not found yet in AngelOne tradebook",
        tempOrderId: tempOrder.id,
      });
      return { result: "PENDING" };
    }

    let totalQty = 0;
    let totalValue = 0;
    fills.forEach(f => {
      totalQty += Number(f.fillsize);
      totalValue += Number(f.fillsize) * Number(f.fillprice);
    });

    const avgPrice = totalValue / totalQty;
    const matched = fills[0];

    // ====================================================
    // 6️⃣ SELL PAIRING + PARTIAL (SAFE)
    // ====================================================
    let finalStatus = "OPEN";
    let positionStatus = "OPEN";
    let buyOrder = null;

    if ((reqInput.transactiontype || "").toUpperCase() === "SELL") {
      buyOrder = await Order.findOne({
        where: { userId: user.id, orderid: reqInput.buyOrderId,orderstatuslocaldb:"OPEN",status: "COMPLETE" },
      });

        const originalQty = Number(buyOrder.fillsize || buyOrder.quantity);
        const usedQty = totalQty;
        const remainingBuyQty = originalQty - usedQty;

      // SELL success → finalize temp SELL
      finalStatus = "COMPLETE";
      positionStatus = "COMPLETE";

      await tempOrder.update({
        fillsize: totalQty,
        quantity: totalQty,
        tradedValue: avgPrice * totalQty,
        price: avgPrice,
        fillprice: avgPrice,
        filltime: nowISOError,
        fillid: matched.fillid,
        pnl: (avgPrice - Number(buyOrder?.fillprice || 0)) * totalQty||0,
        buyOrderId: reqInput?.buyOrderId||buyOrder.orderid,
        buyTime: buyOrder?.filltime,
        buyprice: buyOrder?.fillprice,
        buysize:totalQty|| buyOrder?.quantity,
        buyvalue: buyOrder?.tradedValue,
        positionStatus,
        status: "COMPLETE",
        orderstatuslocaldb: finalStatus,
      });


      logSuccess(req, {
        msg: "SELL order executed successfully, temp SELL updated",
        tempOrderId: tempOrder.id,
        sellQty: totalQty,
      });

      // PARTIAL SELL → update original BUY + insert BUY clone
      if (remainingBuyQty > 0) {
        const remainingQty = Number(buyOrder.fillsize || buyOrder.quantity) - totalQty;

        // UPDATE ORIGINAL BUY
        await buyOrder.update({
          fillsize: remainingQty,
          quantity: remainingQty,
          tradedValue: Number(buyOrder.tradedValue || 0) - Number(buyOrder.fillprice || buyOrder.price) * totalQty,
        });
        logSuccess(req, {
          msg: "Original BUY order reduced after partial SELL",
          originalBuyId: buyOrder.id,
          remainingQty,
        });

        // Compute used qty & remaining qty
        const usedQty = totalQty;
        const buyFillPrice = Number(buyOrder.fillprice || buyOrder.price);

          // INSERT BUY CLONE FOR PARTIAL SELL
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

          // qty split		
          quantity: usedQty,
          fillsize: usedQty,
          price: buyFillPrice,
          fillprice: buyFillPrice,

          // recompute values
          tradedValue: buyFillPrice * usedQty,
          buyvalue: 0,

          // meta copy		
          userId: buyOrder.userId,
          userNameId: buyOrder.userNameId,
          broker: buyOrder.broker,
          angelOneSymbol: buyOrder.angelOneSymbol,
          angelOneToken: buyOrder.angelOneToken,
          strategyName: buyOrder.strategyName,
          strategyUniqueId: buyOrder.strategyUniqueId,
          filltime: buyOrder.filltime,
          uniqueorderid: buyOrder.uniqueorderid,
          orderid: buyOrder.orderid,
          fillid: buyOrder.fillid,
          ordertag:buyOrder.ordertag,

          // status		
          orderstatuslocaldb: "COMPLETE",
          status: "COMPLETE",
          positionStatus: "COMPLETE",
          text: "BUY_SPLIT_FOR_SELL",
      });

        logSuccess(req, {
          msg: "BUY clone inserted for corresponding partial SELL",
          cloneQty: totalQty,
          id:buyOrder?.id
        });
        
    return {
        result: "SUCCESS",
        orderid: "",
        uniqueOrderId: "",
        userId: user.id,
        broker: "AngelOne",
      };
      }else{

         logSuccess(req, {
          msg: "Updating Full BUY Quantity with !",
          orderstatuslocaldb: "COMPLETE",
          positionStatus: "COMPLETE",
        });

          // =================================
           // Uodate Full Quantity 
           // =================================
         await buyOrder.update({
          orderstatuslocaldb: "COMPLETE",
          positionStatus: "COMPLETE",
          
        });

         logSuccess(req, {
          msg: "Updated Full BUY Quantity with !",
          orderstatuslocaldb: "COMPLETE",
          positionStatus: "COMPLETE",
        });

    return {
        result: "SUCCESS",
        orderid: "",
        uniqueOrderId: "",
        userId: user.id,
        broker: "AngelOne",
      };
      }
    }

    // ====================================================
    // 7️⃣ SAFE BUY MERGE (LAST STEP)
    // ====================================================
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
        uniqueOrderId: existingBuyOrder.uniqueorderid,
        userId: user.id,
        broker: "AngelOne",
      };
    }


     const pnl =
      tempOrder.transactiontype === "SELL" && buyOrder
        ? avgPrice * totalQty - Number(buyOrder?.fillprice) * totalQty
        : 0;

     // =================== FINAL UPDATE FOR THIS ORDER ==================
    await tempOrder.update({
      tradedValue: avgPrice * totalQty,
      fillprice: avgPrice,
      price: avgPrice,
      fillsize: totalQty,
      quantity: totalQty,
      filltime: matched?.fill_timestamp
        ? new Date(matched.fill_timestamp).toISOString()
        : nowISOError,

      fillid: matched?.fillid,
      pnl,
      buyOrderId: buyOrder?.orderid || 0,
      buyprice: buyOrder?.fillprice||0,
      buyTime: buyOrder?.filltime||null,
      buysize: tempOrder?.transactiontype === "SELL" ? totalQty :0,
      buyvalue: totalQty*buyOrder?.fillprice||0,
      positionStatus,
      status: "COMPLETE",
      orderstatuslocaldb: finalStatus,
    });

    // ====================================================
    // 8️⃣ NORMAL SUCCESS
    // ====================================================
    return {
      userId: user.id,
      broker: "AngelOne",
      result: "SUCCESS",
      orderid,
      uniqueOrderId,
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
      msg: "placeAngelOrder failed with error",
      error: err.message,
      tempOrderId: tempOrder?.id,
    });

    return {
      broker: "AngelOne",
      result: "ERROR",
      message: err.message,
    };
  }
};




// =======================test codde auto sell fetch code start  =======================


function angelTimeToISO1(dateStr) {
  return dateStr
    ? new Date(dateStr + " GMT+0530").toISOString()
    : null;
}


async function angelOneFIFOWithAPI1(headers, symbol) {

  const ORDER_BOOK_URL =
    "https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/getOrderBook";

  const TRADE_BOOK_URL =
    "https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/getTradeBook";

  const normalize = v => v?.trim().toUpperCase();

  // 1️⃣ Fetch OrderBook & TradeBook
  const [orderRes, tradeRes] = await Promise.all([
    axios.get(ORDER_BOOK_URL, { headers }),
    axios.get(TRADE_BOOK_URL, { headers })
  ]);

  const orderBook = orderRes?.data?.data || [];
  const tradeBook = tradeRes?.data?.data || [];

  // 2️⃣ Group TradeBook by orderid
  const tradeMap = new Map();
  for (const t of tradeBook) {
    const key = String(t.orderid);
    if (!tradeMap.has(key)) tradeMap.set(key, []);
    tradeMap.get(key).push(t);
  }

  // 3️⃣ Filter completed orders for symbol (FIFO)
  const orders = orderBook
    .filter(o =>
      normalize(o.tradingsymbol) === normalize(symbol) &&
      o.status === "complete"
    )
    .sort((a, b) => new Date(a.updatetime) - new Date(b.updatetime));

  const buyQueue = [];
  const results = [];

  // 4️⃣ FIFO Matching
  for (const o of orders) {

    const orderQty = Number(o.quantity);

    // ===== BUY =====
    if (o.transactiontype === "BUY") {
      buyQueue.push({
        qty: orderQty,
        price: Number(o.averageprice || o.price),
        orderid: o.orderid,
        uniqueorderid: o.uniqueorderid,
        fillid: tradeMap.get(String(o.orderid))?.[0]?.fillid || null,
        tradeid: tradeMap.get(String(o.orderid))?.[0]?.tradeid || null,
        time: o.updatetime
      });
    }

    // ===== SELL =====
    if (o.transactiontype === "SELL") {

      const sellTrades = tradeMap.get(String(o.orderid)) || [];
      if (!sellTrades.length) continue;

      // 🔥 Merge SELL fills
      let totalSellQty = 0;
      let totalSellValue = 0;

      for (const t of sellTrades) {
        const q = Number(t.fillsize);
        const p = Number(t.fillprice);
        totalSellQty += q;
        totalSellValue += q * p;
      }

      const avgSellPrice = totalSellValue / totalSellQty;

      let remainingQty = totalSellQty;
      let totalPnl = 0;
      let buyOrderIds = [];

      // FIFO consume BUYs
      while (remainingQty > 0 && buyQueue.length) {
        const buy = buyQueue[0];
        const matchedQty = Math.min(buy.qty, remainingQty);

        totalPnl += (avgSellPrice - buy.price) * matchedQty;
        remainingQty -= matchedQty;
        buy.qty -= matchedQty;

        buyOrderIds.push(buy.orderid);

        if (buy.qty === 0) buyQueue.shift();
      }

      // ✅ PUSH SINGLE OBJECT
      results.push({
        symbol: o.tradingsymbol,

        buyOrderIds, // multiple BUYs possible
        sellOrderId: o.orderid,
        ordertag: o?.ordertag,
        sellUniqueOrderId: o.uniqueorderid,

        buyPriceAvg: null, // optional if you want
        sellPriceAvg: Number(avgSellPrice.toFixed(2)),

        quantity: totalSellQty,
        pnl: Number(totalPnl.toFixed(2)),

        sellFillIds: sellTrades.map(t => t.fillid),
        sellTradeIds: sellTrades.map(t => t.tradeid || null),

        buyTime: buyOrderIds.length ? buyQueue[0]?.time : null,
        sellTime: o.updatetime,

        broker: "ANGELONE"
      });
    }
  }

      let orderBuyFind = await Order.findOne({
        where: {
          orderid: results[0]?.buyOrderIds,
          transactiontype: "BUY"
        },
        order: [["createdAt", "ASC"]],
        raw:true
      });

      console.log(orderBuyFind,'================orderBuyFind=============');
      


       const sellPayload = {

      userId:orderBuyFind?.userId||"",
      userNameId:orderBuyFind?.userNameId||"",
      tradingsymbol:orderBuyFind?.tradingsymbol||"",
      variety:orderBuyFind?.variety||"",
      ordertype:orderBuyFind?.ordertype||"",
      producttype:orderBuyFind?.producttype||"",
      duration:orderBuyFind?.duration||"",
      exchange:orderBuyFind?.exchange||"",
      symboltoken:orderBuyFind?.symboltoken||"",
      instrumenttype:orderBuyFind?.instrumenttype||"",
      optiontype:orderBuyFind?.optiontype||"",
      text:"User Manual Sell",
      ordertag:"User Manual Sell",
      angelOneToken:orderBuyFind?.angelOneToken||"",
      angelOneSymbol:orderBuyFind?.angelOneSymbol||"",
      strategyName:orderBuyFind?.strategyName||"",
      strategyUniqueId:orderBuyFind?.strategyUniqueId||"",
      transactiontype: "SELL",
      orderid: results[0]?.sellOrderId||"",
      uniqueorderid: results[0]?.sellUniqueOrderId||"",
      quantity: results[0]?.quantity||0,
      actualQuantity: results[0]?.quantity||0,
      buyOrderId:orderBuyFind?.orderid||"",
      buyTime:orderBuyFind?.filltime||"",
      buysize:orderBuyFind?.fillsize||"",
      buyprice: orderBuyFind?.fillprice||"",
      buyvalue:  orderBuyFind?.tradedValue||"",
      price: results[0]?.sellPriceAvg||"",
      fillprice:results[0]?.sellPriceAvg||0,
      fillid:results[0]?.sellFillIds[0]||0,
      tradedValue:results[0]?.sellPriceAvg*results[0]?.quantity||0,
      fillsize:results[0]?.quantity||0,
      pnl: Number(results[0]?.pnl.toFixed(5))||0,
      status: "COMPLETE",
      orderstatus: "COMPLETE",
      positionStatus:"COMPLETE",
      orderstatuslocaldb:"COMPLETE",
      filltime: angelTimeToISO(results[0]?.sellTime),
      broker:orderBuyFind?.broker||"",
    };

     await Order.create(sellPayload);

     await Order.update(
  {
    orderstatus: "COMPLETE",
    orderstatuslocaldb: "COMPLETE",
    positionStatus: "COMPLETE",
  },
  {
    where: {
      id: orderBuyFind?.id   // ✅ safest (primary key)
    }
  }
);

     
      
console.log(results,'===========results=========');

  

  return results;
}



// const trades = await angelOneFIFOWithAPI(
//   //angelHeaders("eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6Ikc0MDQ2ODMiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pFd01pd2ljMjkxY21ObElqb2lNeUlzSW1SbGRtbGpaVjlwWkNJNklqRmxNMlEzWmpsaExUUTBOV0l0TTJSak5TMDVNVEZoTFRZMFpXWTVOamcyTURWaVpDSXNJbXRwWkNJNkluUnlZV1JsWDJ0bGVWOTJNaUlzSW05dGJtVnRZVzVoWjJWeWFXUWlPakV3TWl3aWNISnZaSFZqZEhNaU9uc2laR1Z0WVhRaU9uc2ljM1JoZEhWeklqb2lZV04wYVhabEluMHNJbTFtSWpwN0luTjBZWFIxY3lJNkltRmpkR2wyWlNKOWZTd2lhWE56SWpvaWRISmhaR1ZmYkc5bmFXNWZjMlZ5ZG1salpTSXNJbk4xWWlJNklrYzBNRFEyT0RNaUxDSmxlSEFpT2pFM05qa3lNamMyTkRFc0ltNWlaaUk2TVRjMk9URTBNVEEyTVN3aWFXRjBJam94TnpZNU1UUXhNRFl4TENKcWRHa2lPaUl4T0RBeVkyRmtNQzAwWkRWbExUUmhOVEF0WVRrek1pMWlOalJtT1RjNFlqa3dObVlpTENKVWIydGxiaUk2SWlKOS5STHdUa0JDeENkYldDRlQ5QXBGSjA2Um5IeV9VYmhUMmw3M0I5ZHY3TEFYbTk2aTdxclg1cGMyaVVYeERBNEN0WTl1NkhpRU0yaFdreTM5SWhxNHA4MnczYmlhQ1VWSlVIa3JUbW1ZZDlYLUh1OTluUk5qQ1RGWDRGaWhZa29GQjFWMjk2a1R4RE93cGFyZlFkd3lOdk1JZnV1LUI5em5QNHAwVVBVRnRHYzQiLCJBUEktS0VZIjoieUpicm5ua3giLCJYLU9MRC1BUEktS0VZIjp0cnVlLCJpYXQiOjE3NjkxNDEyNDEsImV4cCI6MTc2OTE5MzAwMH0.1iEaDDAWlgtTBFNH4Hp1sepe1V9Nl6DKVy3VeM7WpPOPWAudEimVpEG-3ETqbZP1mFCU04wLAUqXRyPJOvmm2A"),
//   angelHeaders('eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6IkMxOTEzMzEiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pFd01pd2ljMjkxY21ObElqb2lNeUlzSW1SbGRtbGpaVjlwWkNJNklqRmxNMlEzWmpsaExUUTBOV0l0TTJSak5TMDVNVEZoTFRZMFpXWTVOamcyTURWaVpDSXNJbXRwWkNJNkluUnlZV1JsWDJ0bGVWOTJNaUlzSW05dGJtVnRZVzVoWjJWeWFXUWlPakV3TWl3aWNISnZaSFZqZEhNaU9uc2laR1Z0WVhRaU9uc2ljM1JoZEhWeklqb2lZV04wYVhabEluMHNJbTFtSWpwN0luTjBZWFIxY3lJNkltRmpkR2wyWlNKOWZTd2lhWE56SWpvaWRISmhaR1ZmYkc5bmFXNWZjMlZ5ZG1salpTSXNJbk4xWWlJNklrTXhPVEV6TXpFaUxDSmxlSEFpT2pFM05qa3lNemcyTkRjc0ltNWlaaUk2TVRjMk9URTFNakEyTnl3aWFXRjBJam94TnpZNU1UVXlNRFkzTENKcWRHa2lPaUkwWmpobU1qVmtNUzB6TnpNd0xUUmxORFV0WWpZNU1pMDNZV05pWWpsaU1UQTJORGtpTENKVWIydGxiaUk2SWlKOS5McjFvQ0VWNkFKeGtnTVVxY2JGbEZNZktEb05UaHRlUnNETG01Z2N2TmRRTkFQYVVvakFzUDhTbEw2ekEzT1NnVm1ncWFkLUJLTF9ZOGxaekczaXR2TE5mNlU5MVYtYlpaQ24yWGNxSi1FemZON3E1WVhxQjZjRHhLRVVtV0xBSmhyT1QzdHh6ckZRaTV2dXU5a1FkY2RTamZ2YkpWVjRGTFpTSmxxeFAwd1EiLCJBUEktS0VZIjoieUpicm5ua3giLCJYLU9MRC1BUEktS0VZIjp0cnVlLCJpYXQiOjE3NjkxNTIyNDcsImV4cCI6MTc2OTE5MzAwMH0.PNRSEOGVTPSJpTX3SB5vdtWoZzK5FrDOPrhpBdXkV1tIb0xxXoWe7RUFuSYHlJMizxHPigMDBb06cRB899HEgg'),
//   "NIFTY27JAN2625300CE"
// );


// console.log(trades,'trades check');


// =======================test codde auto sell fetch code end   =======================

// ======================== 08 jan 2025 ======================



// import axios from "axios";
// import Order from "../models/orderModel.js";
// import { logSuccess, logError } from "../utils/loggerr.js";


// // -----------------------
// // API ENDPOINTS
// // -----------------------
// const ANGEL_ONE_PLACE_URL =
//   "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/placeOrder";

// const ANGEL_ONE_DETAILS_URL = (uniqueId) =>
//   `https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/details/${uniqueId}`;

// const ANGEL_ONE_TRADE_BOOK_URL =
//   "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook";




// // -----------------------
// // HEADERS
// // -----------------------



// const angelHeaders = (token) => ({
//   Authorization: `Bearer ${token}`,
//   "Content-Type": "application/json",
//   "Accept": "application/json",
//   "X-UserType": "USER",
//   "X-SourceID": "WEB",
//   'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
//   'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
//   'X-MACAddress': process.env.MAC_Address, 
//   'X-PrivateKey': process.env.PRIVATE_KEY, 
// });

// const safeErr = (e) => ({
//   message: e?.message,
//   status: e?.response?.status,
//   data: e?.response?.data,
// });

// // -----------------------
// // HELPERS
// // -----------------------
// const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// function extractBrokerError(err) {
//   const status = err?.response?.status || null;
//   const data = err?.response?.data;

//   const msg =
//     (typeof data === "string" && data) ||
//     data?.message ||
//     data?.emsg ||
//     err?.message ||
//     "Unknown error";

//   return { status, msg, data };
// }

// async function getDetailsWithPolling(user, uniqueOrderId, req) {
//   const maxPolls = 6;

//   for (let i = 0; i < maxPolls; i++) {
//     try {
//       const det = await axios.get(ANGEL_ONE_DETAILS_URL(uniqueOrderId), {
//         headers: angelHeaders(user.authToken),
//       });

//       const st = det?.data?.data?.status;

//       logSuccess(req, {
//         msg: "AngelOne details poll",
//         uniqueOrderId,
//         poll: i + 1,
//         status: st,
//       });

//       if (st === "complete" || st === "rejected" || st === "cancelled") {
//         return det.data;
//       }

//       // open/pending/transit etc -> wait then retry
//       await sleep(400 + i * 200);
//     } catch (err) {
//       const e = extractBrokerError(err);
//       logError(req, err, { msg: "AngelOne details poll failed", extracted: e });

//       // If rate limited, wait and retry
//       if (e.status === 403 && String(e.msg).includes("exceeding access rate")) {
//         await sleep(600 + i * 400);
//         continue;
//       }

//       if (i === maxPolls - 1) throw err;
//       await sleep(500 + i * 300);
//     }
//   }

//   return null;
// }



// async function getTradebookWithRetry(
//   user,
//   expectedQty,
//   req,
//   maxTry = 5
// ) {
//   let lastTradebook = null;

//   for (let i = 0; i < maxTry; i++) {
//     try {
//       const tradeRes = await axios.get(ANGEL_ONE_TRADE_BOOK_URL, {
//         headers: angelHeaders(user.authToken),
//       });

//       const trades = tradeRes?.data?.data || [];

//       const totalQty = Array.isArray(trades)
//         ? trades.reduce((sum, t) => sum + Number(t?.fillsize||t?.quantity||0), 0)
//         : 0;

//       logSuccess(req, {
//         msg: "AngelOne tradebook retry",
//         attempt: i + 1,
//         tradesCount: trades.length,
//         totalQty,
//         expectedQty,
//       });

//       // ✅ FULL FILL CONFIRMED
//       if (totalQty >= expectedQty) {
//         return tradeRes.data;
//       }

//       lastTradebook = tradeRes.data;
//     } catch (err) {
//       const e = extractBrokerError(err);

//       logError(req, err, {
//         msg: "AngelOne tradebook retry failed",
//         attempt: i + 1,
//         extracted: e,
//       });

//       // rate limit
//       if (e.status === 403 && String(e.msg).includes("exceeding access rate")) {
//         await sleep(800 * Math.pow(2, i));
//         continue;
//       }

//       // network error
//       if (!e.status) {
//         await sleep(600 * Math.pow(2, i));
//         continue;
//       }

//       throw err;
//     }

//     // wait before next poll
//     await sleep(500);
//   }

//   // ❗ retries exhausted → return best available snapshot
//   return lastTradebook;
// }



// // =======================
// // SINGLE placeAngelOrder (FULL UPDATED)
// // =======================
 

// // ======================= updated placeAngelOrder with partial SELL & logs ===============================
// export const placeAngelOrder = async (user, reqInput, req, sellQuantityPartial = 0) => {
//   let tempOrder = null;          // NEW TEMP ORDER (BUY/SELL)
//   let existingBuyOrder = null;   // OLD OPEN BUY
//   const nowISOError = new Date().toISOString();

//   try {
//     // ====================================================
//     // 1️⃣ READ existing BUY (NO UPDATE HERE)
//     // ====================================================
//     if ((reqInput.transactiontype || "").toUpperCase() === "BUY") {
//       existingBuyOrder = await Order.findOne({
//         where: {
//           userId: user.id,
//           ordertype: reqInput.orderType,
//           producttype: reqInput.productType,
//           tradingsymbol: reqInput.symbol,
//           transactiontype: "BUY",
//           orderstatuslocaldb: "OPEN",
//           status:"COMPLETE"
//         },
//       });

//       if (existingBuyOrder) {
//         logSuccess(req, {
//           msg: "Found existing OPEN BUY order for potential merge",
//           orderid: existingBuyOrder.id,
//         });
//       }
//     }

//     // ====================================================
//     // 2️⃣ ALWAYS CREATE NEW TEMP ORDER
//     // ====================================================
//     const orderData = {
//       variety: reqInput.variety || "NORMAL",
//       tradingsymbol: reqInput.symbol,
//       instrumenttype: reqInput.instrumenttype,
//       symboltoken: reqInput.token,
//       transactiontype: reqInput.transactiontype,
//       exchange: reqInput.exch_seg,
//       ordertype: reqInput.orderType,
//       quantity: String(reqInput.quantity),
//       producttype: reqInput.productType,
//       duration: reqInput.duration,
//       price: reqInput.price || "0",
//       triggerprice: reqInput.triggerprice || 0,
//       squareoff: reqInput.squareoff || 0,
//       stoploss: reqInput.stoploss || 0,
//       orderstatuslocaldb: "PENDING",
//       totalPrice: reqInput.totalPrice ?? null,
//       actualQuantity: reqInput.actualQuantity ?? null,
//       userId: user.id,
//       userNameId: user.username,
//       ordertag: "softwaresetu",
//       broker: "angelone",
//       buyOrderId: reqInput?.buyOrderId || null,
//       strategyName: reqInput?.groupName || "",
//       strategyUniqueId: reqInput?.strategyUniqueId || "",
//       text: "",
//       angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
//       angelOneToken: reqInput.angelOneToken || reqInput.token,
//     };

//     tempOrder = await Order.create(orderData);
//     logSuccess(req, {
//       msg: `Temp ${reqInput.transactiontype} order created in DB`,
//       tempOrderId: tempOrder.id,
//       quantity: tempOrder.quantity,
//     });

//      logSuccess(req, {
//       msg: `incoming data`,
//       body:reqInput
//     });

//     // ====================================================
//     // 3️⃣ PLACE BROKER ORDER
//     // ====================================================
//     let placeRes;
//     try {
//       placeRes = await axios.post(
//         ANGEL_ONE_PLACE_URL,
//         {
//           variety: (reqInput.variety || "NORMAL").toUpperCase(),
//           tradingsymbol: reqInput.symbol,
//           symboltoken: String(reqInput.token),
//           transactiontype: reqInput.transactiontype.toUpperCase(),
//           exchange: reqInput.exch_seg,
//           ordertype: reqInput.orderType.toUpperCase(),
//           producttype: reqInput.productType.toUpperCase(),
//           duration: "DAY",
//           ordertag:"softwareetu",
//           price: reqInput.price || 0,
//           triggerprice: reqInput.triggerprice || 0,
//           squareoff: reqInput.squareoff || 0,
//           stoploss: reqInput.stoploss || 0,
//           quantity: Number(reqInput.quantity),
//         },
//         { headers: angelHeaders(user.authToken) }
//       );
//       logSuccess(req, {
//         msg: "AngelOne API call success: order placed",
//         orderType: reqInput.transactiontype,
//         tempOrderId: tempOrder.id,
//       });
//     } catch (err) {
//       await tempOrder.update({
//         orderstatuslocaldb: "FAILED",
//         status: "FAILED",
//         positionStatus: "FAILED",
//         text: extractBrokerError(err).msg,
//       });
//       logSuccess(req, {
//         msg: "AngelOne API call failed: order rejected",
//         error: extractBrokerError(err).msg,
//         tempOrderId: tempOrder.id,
//       });
//       return { result: "BROKER_REJECTED" };
//     }

//     if (!placeRes.data?.status) {
//       await tempOrder.update({
//         orderstatuslocaldb: "FAILED",
//         status: "FAILED",
//         positionStatus: "FAILED",
//         text: placeRes.data?.message,
//       });
//       logSuccess(req, {
//         msg: "AngelOne order rejected by broker",
//         brokerMessage: placeRes.data?.message,
//         tempOrderId: tempOrder.id,
//       });
//       return { result: "BROKER_REJECTED" };
//     }

//     const orderid = placeRes.data.data.orderid;
//     const uniqueOrderId = placeRes.data.data.uniqueorderid;

//     await tempOrder.update({ orderid, uniqueorderid: uniqueOrderId });
//     logSuccess(req, {
//       msg: "AngelOne order successfully registered in DB",
//       orderid,
//       uniqueOrderId,
//     });

//     // ====================================================
//     // 4️⃣ DETAILS POLLING
//     // ====================================================
//     const detData = await getDetailsWithPolling(user, uniqueOrderId, req);
//     const detailsStatus = detData?.data?.status;
//     const detailsText = detData?.data?.text || "";

//     if (["rejected", "cancelled"].includes(detailsStatus)) {
//       await tempOrder.update({
//         orderstatuslocaldb: detailsStatus.toUpperCase(),
//         status: detailsStatus.toUpperCase(),
//         positionStatus: detailsStatus.toUpperCase(),
//         text: detailsText,
//       });
//       logSuccess(req, {
//         msg: `AngelOne order ${detailsStatus.toUpperCase()}`,
//         orderid,
//         tempOrderId: tempOrder.id,
//         brokerMessage: detailsText,
//       });
//       return { result: detailsStatus.toUpperCase() };
//     }

//     // ====================================================
//     // 5️⃣ TRADEBOOK
//     // ====================================================
//     const tradeData = await getTradebookWithRetry(user, reqInput.quantity, req);
//     const fills = tradeData?.data?.filter(t => String(t.orderid) === String(orderid));

//     if (!fills?.length) {
//       await tempOrder.update({
//         orderstatuslocaldb: "PENDING",
//         status: detailsStatus === "complete" ? "COMPLETE" : "OPEN",
//         text: "TRADE_NOT_FOUND_YET",
//       });
//       logSuccess(req, {
//         msg: "Trade not found yet in AngelOne tradebook",
//         tempOrderId: tempOrder.id,
//       });
//       return { result: "PENDING" };
//     }

//     let totalQty = 0;
//     let totalValue = 0;
//     fills.forEach(f => {
//       totalQty += Number(f.fillsize);
//       totalValue += Number(f.fillsize) * Number(f.fillprice);
//     });

//     const avgPrice = totalValue / totalQty;
//     const matched = fills[0];

//     // ====================================================
//     // 6️⃣ SELL PAIRING + PARTIAL (SAFE)
//     // ====================================================
//     let finalStatus = "OPEN";
//     let positionStatus = "OPEN";
//     let buyOrder = null;

//     if ((reqInput.transactiontype || "").toUpperCase() === "SELL") {
//       buyOrder = await Order.findOne({
//         where: { userId: user.id, orderid: reqInput.buyOrderId },
//       });

//       // SELL success → finalize temp SELL
//       finalStatus = "COMPLETE";
//       positionStatus = "COMPLETE";

//       await tempOrder.update({
//         fillsize: totalQty,
//         quantity: totalQty,
//         tradedValue: avgPrice * totalQty,
//         price: avgPrice,
//         fillprice: avgPrice,
//         filltime: nowISOError,
//         fillid: matched.fillid,
//         pnl: (avgPrice - Number(buyOrder?.fillprice || 0)) * totalQty||0,
//         buyOrderId: reqInput?.buyOrderId,
//         buyTime: buyOrder?.filltime,
//         buyprice: buyOrder?.fillprice,
//         buysize: buyOrder?.quantity,
//         buyvalue: buyOrder?.tradedValue,
//         positionStatus,
//         status: "COMPLETE",
//         orderstatuslocaldb: finalStatus,
//       });

//       logSuccess(req, {
//         msg: "SELL order executed successfully, temp SELL updated",
//         tempOrderId: tempOrder.id,
//         sellQty: totalQty,
//       });

//       // PARTIAL SELL → update original BUY + insert BUY clone
//       if (sellQuantityPartial > 0 && buyOrder) {
//         const remainingQty = Number(buyOrder.fillsize || buyOrder.quantity) - totalQty;

//         // UPDATE ORIGINAL BUY
//         await buyOrder.update({
//           fillsize: remainingQty,
//           quantity: remainingQty,
//           tradedValue: Number(buyOrder.tradedValue || 0) - Number(buyOrder.fillprice || buyOrder.price) * totalQty,
//         });
//         logSuccess(req, {
//           msg: "Original BUY order reduced after partial SELL",
//           originalBuyId: buyOrder.id,
//           remainingQty,
//         });

//         // Compute used qty & remaining qty
//         const usedQty = totalQty;
//         const buyFillPrice = Number(buyOrder.fillprice || buyOrder.price);

//           // INSERT BUY CLONE FOR PARTIAL SELL
//           await Order.create({
//           variety: buyOrder.variety,
//           tradingsymbol: buyOrder.tradingsymbol,
//           instrumenttype: buyOrder.instrumenttype,
//           symboltoken: buyOrder.symboltoken,
//           transactiontype: "BUY",
//           exchange: buyOrder.exchange,
//           ordertype: buyOrder.ordertype,
//           producttype: buyOrder.producttype,
//           duration: buyOrder.duration,

//           // qty split		
//           quantity: usedQty,
//           fillsize: usedQty,
//           price: buyFillPrice,
//           fillprice: buyFillPrice,

//           // recompute values
//           tradedValue: buyFillPrice * usedQty,
//           buyvalue: 0,

//           // meta copy		
//           userId: buyOrder.userId,
//           userNameId: buyOrder.userNameId,
//           broker: buyOrder.broker,
//           angelOneSymbol: buyOrder.angelOneSymbol,
//           angelOneToken: buyOrder.angelOneToken,
//           strategyName: buyOrder.strategyName,
//           strategyUniqueId: buyOrder.strategyUniqueId,
//           filltime: buyOrder.filltime,
//           uniqueorderid: buyOrder.uniqueorderid,

//           // status		
//           orderstatuslocaldb: "COMPLETE",
//           status: "COMPLETE",
//           positionStatus: "COMPLETE",
//           text: "BUY_SPLIT_FOR_SELL",
//       });

//         logSuccess(req, {
//           msg: "BUY clone inserted for corresponding partial SELL",
//           cloneQty: totalQty,
//         });
//       }else{
          
//          await buyOrder.update({
//           orderstatuslocaldb: "COMPLETE",
//           positionStatus: "COMPLETE",
          
//         });
//       }
//     }

//     // ====================================================
//     // 7️⃣ SAFE BUY MERGE (LAST STEP)
//     // ====================================================
//     if ((reqInput.transactiontype || "").toUpperCase() === "BUY" && existingBuyOrder) {
//       const mergedQty = Number(existingBuyOrder.fillsize || 0) + totalQty;
//       const mergedValue = Number(existingBuyOrder.tradedValue || 0) + avgPrice * totalQty;
//       const mergedAvg = mergedValue / mergedQty;

//       await existingBuyOrder.update({
//         fillsize: mergedQty,
//         quantity: mergedQty,
//         tradedValue: mergedValue,
//         price: mergedAvg,
//         fillprice: mergedAvg,
//       });

//       await tempOrder.destroy();
//       logSuccess(req, {
//         msg: "Existing BUY merged with new BUY",
//         existingBuyId: existingBuyOrder.id,
//         mergedQty,
//       });

//       return {
//         result: "SUCCESS",
//         orderid: existingBuyOrder.id,
//         uniqueOrderId: existingBuyOrder.uniqueorderid,
//         userId: user.id,
//         broker: "AngelOne",
//       };
//     }

//     // ====================================================
//     // 8️⃣ NORMAL SUCCESS
//     // ====================================================
//     return {
//       userId: user.id,
//       broker: "AngelOne",
//       result: "SUCCESS",
//       orderid,
//       uniqueOrderId,
//     };
//   } catch (err) {
//     if (tempOrder?.id) {
//       await tempOrder.update({
//         orderstatuslocaldb: "FAILED",
//         positionStatus: "FAILED",
//         status: "FAILED",
//         text: err.message,
//       });
//     }
//     logSuccess(req, {
//       msg: "placeAngelOrder failed with error",
//       error: err.message,
//       tempOrderId: tempOrder?.id,
//     });

//     return {
//       broker: "AngelOne",
//       result: "ERROR",
//       message: err.message,
//     };
//   }
// };




















