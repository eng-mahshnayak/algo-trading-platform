

import axios from "axios";
import Order from "../models/orderModel.js";
import { logSuccess, logError } from "../utils/loggerr.js";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(customParseFormat);
dayjs.extend(utc);

export const toISOStringUTC = (dateStr) => {
  return dayjs(dateStr, "DD-MM-YYYY HH:mm:ss").utc().toISOString();
};

const SHOONYA_BASE_URL = process.env.SHOONYA_BASE_URL;

// --- MAPPERS ---
function getShoonyaProductCode(type) {
  if (!type) return "I";
  const upperType = type.toUpperCase();
  switch (upperType) {
    case "DELIVERY":
    case "CNC":
      return "C";
    case "CARRYFORWARD":
    case "NRML":
      return "M";
    case "INTRADAY":
    case "MIS":
      return "I";
    case "BO":
      return "B";
    case "CO":
      return "H";
    default:
      return "I";
  }
}

function mapOrderTypeToShoonya(orderType) {
  if (!orderType) return "MKT";
  const upperType = orderType.toUpperCase();
  switch (upperType) {
    case "MARKET":
    case "MKT":
      return "MKT";
    case "LIMIT":
    case "LMT":
      return "LMT";
    case "SL":
    case "SL-LMT":
      return "SL-LMT";
    case "SLM":
    case "SL-MKT":
      return "SL-MKT";
    default:
      return "MKT";
  }
}

function mapTransactionType(type) {
  if (!type) return "B";
  return type.toUpperCase() === "SELL" ? "S" : "B";
}

// --- HELPERS ---
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const normalizeStatus = (st) =>
  String(st ?? "").trim().toUpperCase().replace(/\s+/g, " ");

const isFinalStatus = (statusNorm) =>
  statusNorm.includes("COMPLETE") ||
  statusNorm.includes("FILLED") ||
  statusNorm.includes("REJECT") ||
  statusNorm.includes("CANCEL")||
  statusNorm.includes("CANCELLED")||
  statusNorm.includes("REJECTED");
  

const isRetryableStatus = (statusNorm) => {
  const retryables = [
    "OPEN", "PENDING", "TRIGGER PENDING", "TRIG PENDING",
    "PARTIAL", "PARTIALLY FILLED", "AMO"
  ];
  return retryables.some((x) => statusNorm === x || statusNorm.includes(x));
};


const getFinvasiaPositions = async ({ uid, susertoken }) => {
  const body = `jKey=${susertoken}&jData=${JSON.stringify({
    uid,
    actid: uid,
  })}`;

  const res = await axios.post(
    `${SHOONYA_BASE_URL}/PositionBook`,
    body,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return res.data;
};


const hasFinvasiaOpenPosition = (positionData, tradingSymbol) => {
  if (!Array.isArray(positionData)) return false;

  return positionData.some(
    (pos) =>
      pos.tsym === tradingSymbol &&
      Number(pos.netqty) !== 0
  );
};


const finvasiaFIFOWithAPI = async (buyOrderId, finavasiaSymbol, user) => {

    const nowISOError = new Date().toISOString();

  const uid = user?.kite_client_id;
  const susertoken = user?.authToken;

  const body = `jKey=${susertoken}&jData=${JSON.stringify({
    uid,
    actid: uid,
  })}`;

  const res = await axios.post(
    `${SHOONYA_BASE_URL}/TradeBook`,
    body,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );

  const tradeBook = res.data;

  if (!Array.isArray(tradeBook)) return null;

  // 🔹 SELL trades for given symbol
  let sellTradesData = tradeBook
    .filter(
      (t) =>
        t.tsym === finavasiaSymbol &&
        t.trantype === "S" &&               // SELL
        Number(t.flqty) > 0
    )
    // FIFO → Oldest first
    .sort(
      (a, b) =>
        new Date(a.norexchtime).getTime() -
        new Date(b.norexchtime).getTime()
    );

  if (!sellTradesData.length) return null;

  // 🔥 FIFO SELL trade
    const sellOrderId = sellTradesData[0].norenordno;

    let sellTrade = sellTradesData[0]

    const sameOrderFills = sellTradesData.filter(
      (t) => t.norenordno === sellOrderId
    );

    const sellQty = sameOrderFills.reduce(
  (sum, f) => sum + Number(f.flqty || 0),
  0
);

const sellValue = sameOrderFills.reduce(
  (sum, f) =>
    sum + Number(f.flqty || 0) * Number(f.flprc || f.avgprc || 0),
  0
);

const sellAvgPrice = sellQty ? sellValue / sellQty : 0;



  let ordersData = await Order.findOne({
     where: {
          orderid: buyOrderId,
          transactiontype: "BUY"
        },
        raw:true
  })

   if (!ordersData) return null;

const buyValue = Number(ordersData.tradedValue);

const pnl = sellValue - buyValue;

   // 4️⃣ Prepare SELL order object
  const sellOrderPayload = {
    ...ordersData,
    id: undefined, // important (auto increment)
    orderid: sellTrade.norenordno,
    uniqueorderid: `${sellTrade.exchordid}`,
    fillid:sellTrade?.flid,
    transactiontype: "SELL",
    price: sellAvgPrice||Number(sellTrade.flprc || sellTrade.avgprc || 0),
    fillprice:sellAvgPrice||Number(sellTrade.flprc || sellTrade.avgprc || 0),
    quantity:sellQty|| Number(sellTrade.flqty),
    fillsize:sellQty||Number(sellTrade.flqty),
    tradedValue:sellValue,
    exchangeorderid: sellTrade.exchordid,
    brokerorderid: sellTrade.norenordno,
    buyvalue:ordersData.tradedValue,
    buyprice:ordersData.fillprice,
    buyOrderId:ordersData.orderid,
    buysize:ordersData.fillsize,
    buyTime:ordersData.filltime,
    filltime:sellTrade?.fltm ? await toISOStringUTC(sellTrade.fltm) : nowISOError,
    pnl:pnl,
    text: "User Manual Sell",
    ordertag: "User Manual Sell",
    status: "COMPLETE",
    orderstatus:"COMPLETE",
    orderstatuslocaldb:"COMPLETE",
    positionStatus:"COMPLETE",
    broker: "FINVASIA",
    created_at: new Date(),
    updated_at: new Date(),
  };

  // 5️⃣ Insert SELL order
  const insertedSellOrder = await Order.create(sellOrderPayload);

  await Order.update(
  {
    status: "COMPLETE",
    orderstatus: "COMPLETE",
    orderstatuslocaldb: "COMPLETE",
    positionStatus: "COMPLETE",
  },
  {
    where: {
      id: ordersData.id,   // 🔥 primary key
    },
  }
);

  return {
    orderid: sellTrade.norenordno,
    tradeid: sellTrade.tradeid || sellTrade.exchordid,
    symbol: sellTrade.tsym,
    qty: Number(sellTrade.flqty),
    price: Number(sellTrade.prc),
    exch: sellTrade.exch,
    product: sellTrade.prd,
    raw: sellTrade,
  };
};



// --- RETRY LOGIC FOR ORDERBOOK ---
const fetchOrderDetailsWithRetry = async ({ uid, susertoken, orderid, req }) => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 1500;
  let lastOrderDetails = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {

      const obBody = `jKey=${susertoken}&jData=${JSON.stringify({ uid, actid: uid })}`;
      
      const obResp = await axios.post(`${SHOONYA_BASE_URL}/OrderBook`, obBody, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const obData = obResp.data;

      if (!Array.isArray(obData)) {
        logError(req, null, {
          msg: "OrderBook response is not an array",
          attempt,
          orderid,
          response: obData,
        });
        if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
        continue;
      }

      const orderDetails = obData.find((o) => String(o.norenordno) === String(orderid));
      lastOrderDetails = orderDetails || lastOrderDetails;

      if (!orderDetails) {
        logSuccess(req, {
          msg: "Order not found in OrderBook",
          attempt,
          orderid,
        });
        if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
        continue;
      }

      const statusNorm = normalizeStatus(orderDetails?.status);
      logSuccess(req, {
        msg: "OrderBook poll successful",
        attempt,
        orderid,
        statusNorm,
      });

      if (isFinalStatus(statusNorm)) {
        logSuccess(req, {
          msg: "Order final status confirmed",
          orderid,
          statusNorm,
        });
        return orderDetails;
      }
      if (isRetryableStatus(statusNorm) && attempt < MAX_RETRIES) {
        logSuccess(req, {
          msg: "Order status retryable, retrying...",
          orderid,
          statusNorm,
          attempt,
        });
        await sleep(RETRY_DELAY_MS);
      }
    } catch (e) {
      logError(req, e, {
        msg: "OrderBook fetch error",
        attempt,
        orderid,
        raw: e?.response?.data,
      });
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
    }
  }
  return lastOrderDetails;
};

// --- RETRY LOGIC FOR TRADEBOOK (WITH QUANTITY MATCHING) ---
const fetchTradeBookWithRetry = async ({ uid, susertoken, orderid, expectedQty, req }) => {
  const MAX_TRY = 3;
  const DELAY = 1200;
  let lastFills = [];

  for (let attempt = 1; attempt <= MAX_TRY; attempt++) {
    try {
      const tbBody = `jKey=${susertoken}&jData=${JSON.stringify({ uid, actid: uid })}`;
      logSuccess(req, {
        msg: "Fetching TradeBook details",
        attempt,
        orderid,
        uid,
      });
      const tbResp = await axios.post(`${SHOONYA_BASE_URL}/TradeBook`, tbBody, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      logSuccess(req, {
        msg: "TradeBook API response received",
        attempt,
        orderid,
        response: tbResp.data,
      });
      const tradeBook = tbResp.data;

      if (!Array.isArray(tradeBook)) {
        logError(req, null, {
          msg: "TradeBook response is not an array",
          attempt,
          orderid,
          response: tradeBook,
        });
        if (attempt < MAX_TRY) await sleep(DELAY);
        continue;
      }

      const fills = tradeBook.filter((t) => String(t.norenordno) === String(orderid));

      let totalQty = fills.reduce((sum, fill) => sum + (Number(fill.flqty) || 0), 0);

      logSuccess(req, {
        msg: "TradeBook attempt details",
        attempt,
        orderid,
        totalQty,
        expectedQty,
      });

      if (totalQty >= expectedQty) {
        logSuccess(req, {
          msg: "Full fill quantity confirmed",
          orderid,
          totalQty,
          expectedQty,
        });
        return fills;
      }
      lastFills = fills;
    } catch (e) {
      logError(req, e, {
        msg: "TradeBook fetch error",
        attempt,
        orderid,
        raw: e?.response?.data,
      });
    }
    if (attempt < MAX_TRY) await sleep(DELAY);
  }
  return lastFills;
};

// ======================================================================
//  PLACE ORDER FINVASIA 
// ======================================================================
export const placeFinavasiaOrder = async (user, reqInput, req, isLocalDbFlow = true) => {

  let  newOrder = null
  const nowISOError = new Date().toISOString();

  try {
  const transactionType = (reqInput.transactiontype || "").toUpperCase();
  const uid = user?.kite_client_id;
  const susertoken = user?.authToken;

  if (!uid || !susertoken) {
    logError(req, null, {
      msg: "Shoonya uid or token missing",
      userId: user?.id,
    });
    return {
      userId: user?.id,
      broker: "Finvasia",
      result: "ERROR",
      message: "Shoonya uid or token missing. Please login first.",
    };
  }

  // --- 1. CHECK FOR EXISTING BUY ORDER (FOR MERGE) ---
  let existingBuyOrder = null;
  if (transactionType === "BUY") {
   
    existingBuyOrder = await Order.findOne({
      where: {
        userId: user.id,
        ordertype: reqInput.orderType,
        producttype: reqInput.productType,
        tradingsymbol: reqInput.finavasiaSymbol || reqInput.symbol,
        transactiontype: "BUY",
        orderstatuslocaldb: "OPEN",
      },
    });
    if (existingBuyOrder) {
      logSuccess(req, {
        msg: "Existing BUY order found for merge",
        existingBuyOrderId: existingBuyOrder?.id||0,
      });
    }
  }

  // --- 2. CREATE PENDING ORDER ---
  
  const orderData = {
    symboltoken: reqInput.finavasiaToken || reqInput.token,
    variety: reqInput.variety || "NORMAL",
    tradingsymbol: reqInput.finavasiaSymbol || reqInput.symbol,
    instrumenttype: reqInput.instrumenttype,
    transactiontype: transactionType,
    exchange: reqInput.exch_seg,
    ordertype: reqInput.orderType,
    quantity: reqInput.quantity,
    fillsize: reqInput.quantity,
    producttype: reqInput.productType,
    price: reqInput.price,
    orderstatuslocaldb: "PENDING",
    ordertag: "softwaresetu",
    userId: user.id,
    broker: "finvasia",
    userNameId: user.username,
    strategyName: reqInput.groupName || "",
    strategyUniqueId: reqInput.strategyUniqueId || "",
    buyOrderId: reqInput.buyOrderId || null,
    angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
    angelOneToken: reqInput.angelOneToken || reqInput.token,
  };

   if(reqInput.transactiontype.toUpperCase() === "SELL") {

     logSuccess(req, {
        msg: "Before Check User Position for SELL order ",
      });

    const positions = await getFinvasiaPositions({
      uid: String(uid),
      susertoken: user.authToken,
    });

     logSuccess(req, {
        msg: "After Check User Position for SELL order ",
      });

    if (
      !hasFinvasiaOpenPosition(positions, reqInput.finavasiaSymbol)
    ) {

    await finvasiaFIFOWithAPI(reqInput.buyOrderId ,reqInput.finavasiaSymbol, user);

    return { result: "DONE" };
    }


   }
    

   newOrder = await Order.create(orderData);
 
  // --- 3. PLACE ORDER IN SHOONYA ---
  const shoonyaProductType = isLocalDbFlow
    ? getShoonyaProductCode(reqInput.productType)
    : reqInput.productType;
  const shoonyaOrderType = isLocalDbFlow
    ? mapOrderTypeToShoonya(reqInput.orderType)
    : reqInput.orderType;

  const jData = {
    uid: String(uid),
    actid: String(uid),
    exch: String(reqInput.exch_seg),
    tsym: String(reqInput.finavasiaSymbol || reqInput.symbol),
    qty: String(reqInput.quantity),
    prc: String(reqInput.orderType === "MARKET" ? 0 : reqInput.price),
    prd: shoonyaProductType,
    prctyp: shoonyaOrderType,
    remarks: "softwaresetu",
    trantype: mapTransactionType(reqInput.transactiontype),
    ret: "DAY",
  };

  const body = `jData=${JSON.stringify(jData)}&jKey=${susertoken}`;

  let placeRes;
  try {
    
    const resp = await axios.post(`${SHOONYA_BASE_URL}/PlaceOrder`, body, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    placeRes = resp.data;
    
    if (!placeRes || placeRes.stat !== "Ok") {
      const msg = placeRes?.emsg || "Order placement failed";
      logError(req, null, {
        msg: "Order placement failed",
        response: placeRes,
      });
      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        positionStatus: "FAILED",
        text: msg,
        buyTime: nowISOError,
        filltime: nowISOError,
      });
      return { userId: user.id, broker: "Finvasia", result: "BROKER_REJECTED", message: msg };
    }
  } catch (err) {
    logError(req, err, {
      msg: "PlaceOrder API error",
      raw: err?.response?.data,
    });
    await newOrder.update({
      orderstatuslocaldb: "FAILED",
      status: "FAILED",
      positionStatus: "FAILED",
      text: err?.response?.data?.emsg || err?.message||'Order cancelled',
      buyTime: nowISOError,
      filltime: nowISOError,
    });
    return { userId: user.id, broker: "Finvasia", result: "BROKER_ERROR", message: err?.message||'Order cancelled' };
  }

  const orderid = placeRes.norenordno;
 
  await newOrder.update({ orderid });

  // --- 4. FETCH ORDER DETAILS (WITH RETRY) ---

  let orderDetails = await fetchOrderDetailsWithRetry({ uid, susertoken, orderid, req });

  if (orderDetails) {

    const statusNorm = normalizeStatus(orderDetails.status);

     if (statusNorm==="COMPLETE") {

      await newOrder.update({

      uniqueorderid:orderDetails?.exchordid||orderDetails[0]?.exchordid

      });

    }

    if (statusNorm==="REJECT"||statusNorm==="REJECTED") {

      logError(req, {
        msg: "Order rejected",
        orderid:orderid,
        rejreason: orderDetails?.rejreason,
      });

      await newOrder.update({
        status: "REJECTED",
        positionStatus: "REJECTED",
        orderstatuslocaldb: "REJECTED",
        text: orderDetails.rejreason || "Order rejected",
        buyTime: nowISOError,
        filltime: nowISOError,
      });
      return { userId: user.id, broker: "Finvasia", result: "BROKER_REJECTED", message: "Order rejected" };
    }
    if (statusNorm.includes("CANCEL")||statusNorm.includes("CANCELLED")) {
      logError(req, {
        msg: "Order cancelled",
        orderid,
        rejreason: orderDetails.rejreason,
      });
      await newOrder.update({
        status: "CANCELLED",
        positionStatus: "CANCELLED",
        orderstatuslocaldb: "CANCELLED",
        text: orderDetails.rejreason || "Order cancelled",
        buyTime: nowISOError,
        filltime: nowISOError,
      });
      return { userId: user.id, broker: "Finvasia", result: "CANCELLED", message: "Order cancelled" };
    }
     if (statusNorm.includes("OPEN")||statusNorm.includes("PENDING")) {
      logError(req, {
        msg: "Order OPEN OR PENDING",
        orderid,
        rejreason: orderDetails.rejreason,
      });
      await newOrder.update({
        status: "OPEN",
        positionStatus: "OPEN",
        orderstatuslocaldb: "OPEN",
        text: orderDetails.rejreason || "Order OPEN OR PENDING",
        buyTime: nowISOError,
        filltime: nowISOError,
      });
      return { userId: user.id, broker: "Finvasia", result: "CANCELLED", message: "Order cancelled" };
    }
  }

  // --- 5. FETCH TRADEBOOK (WITH QUANTITY MATCHING) ---
  
  const tradeBook = await fetchTradeBookWithRetry({
    uid,
    susertoken,
    orderid,
    expectedQty: reqInput.quantity,
    req,
  });

  if (!tradeBook?.length) {
    logSuccess(req, {
      msg: "Trade not found in TradeBook yet",
      orderid,
    });
    await newOrder.update({ status: "OPEN", orderstatuslocaldb: "OPEN", positionStatus: "OPEN", text: "Trade not found yet OR ORDER IS REJECTED !" });
    return { userId: user.id, broker: "Finvasia", result: "OPEN", orderid };
  }

  // --- 6. CALCULATE TRADE DETAILS ---
  let totalQty = 0;
  let totalValue = 0;
  tradeBook.forEach((fill) => {
    totalQty += Number(fill.flqty || 0);
    totalValue += Number(fill.flqty || 0) * Number(fill.flprc || 0);
  });
  const avgPrice = totalQty > 0 ? totalValue / totalQty : 0;
  const firstFill = tradeBook[0];
  

  let buyOrder = null;;

  // --- 7. HANDLE SELL LOGIC (PARTIAL/FULL) ---
  if (transactionType === "SELL" && reqInput.buyOrderId) {
    
     buyOrder = await Order.findOne({
      where: {
        userId: user.id,
        orderid: reqInput?.buyOrderId,
        status: "COMPLETE",
        orderstatuslocaldb: "OPEN",
      },
    });

    if (buyOrder) {
      const originalQty = Number(buyOrder.fillsize || buyOrder.quantity);
      const usedQty = totalQty;
      const remainingQty = originalQty - usedQty;

      if (remainingQty > 0) {
        
        // --- PARTIAL SELL: SPLIT BUY ORDER ---
        await buyOrder.update({
          fillsize: remainingQty,
          quantity: remainingQty,
          tradedValue: (Number(buyOrder.tradedValue || 0) - (Number(buyOrder.fillprice || 0) * usedQty)),
        });
         await Order.create({
          ...buyOrder.toJSON(),
          id: undefined,
          status: "COMPLETE",
          orderstatuslocaldb: "COMPLETE",
          positionStatus:"COMPLETE" ,
          fillsize: usedQty,
          quantity: usedQty,
          tradedValue: Number(buyOrder.fillprice || 0) * usedQty,
          text: "BUY_SPLIT_FOR_SELL",
        });
        

         logSuccess(req, {
          msg: "BUY clone inserted for corresponding partial SELL",
          cloneQty: usedQty,
          id:buyOrder?.id
        });

      } else {
        
        // --- FULL SELL: CLOSE BUY ORDER ---
        await buyOrder.update({ orderstatuslocaldb: "COMPLETE", positionStatus: "COMPLETE" });
      }
    }
  }

  // --- 8. UPDATE FINAL ORDER STATUS ---
  const pnl = transactionType === "SELL" && buyOrder
    ? (avgPrice * totalQty) - (Number(buyOrder.fillprice || 0) * totalQty)
    : 0;

   const buyTotalQty = transactionType === "SELL" 
    ? totalQty
    : 0;

  
  await newOrder.update({
    tradedValue: avgPrice * totalQty,
    fillprice: avgPrice,
    price: avgPrice,
    fillsize: totalQty,
    fillid: firstFill?.flid,
    filltime: firstFill?.fltm ? await toISOStringUTC(firstFill.fltm) : nowISOError,
    status: "COMPLETE",
    orderstatuslocaldb: transactionType === "SELL" ? "COMPLETE" : "OPEN",
    positionStatus: transactionType === "SELL" ? "COMPLETE" : "OPEN",
    pnl,
    buyOrderId: buyOrder?.orderid || null,
    buyTime: buyOrder?.filltime || null,
    buyprice: buyOrder?.fillprice||0,
    buysize: buyTotalQty||buyOrder?.fillsize||0,
    buyvalue: buyOrder?.tradedValue||0,
  });

  // --- 9. MERGE BUY ORDERS IF NEEDED ---
  if (transactionType === "BUY" && existingBuyOrder) {
    
    const mergedQty = Number(existingBuyOrder.fillsize || 0) + totalQty;
    const mergedValue = Number(existingBuyOrder.tradedValue || 0) + (avgPrice * totalQty);
    await existingBuyOrder.update({
      fillsize: mergedQty,
      quantity: mergedQty,
      tradedValue: mergedValue,
      price: mergedValue / mergedQty,
      fillprice: mergedValue / mergedQty,
    });
    await newOrder.destroy();
    
    return { result: "SUCCESS", mergedInto: existingBuyOrder.id };
  }

 
  return { userId: user.id, broker: "Finvasia", result: "SUCCESS", orderid };
  
  } catch (err) {

    console.log('===============error==============',err);

     logError(req, err, {
      msg: "last catch with getting API error",
      raw: err?.message,
    });

    await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        positionStatus: "FAILED",
        text: err.message,
        buyTime: nowISOError,
        filltime: nowISOError,
      });
    
    return { userId: user.id, broker: "Finvasia", result: "BROKER_ERROR", message: err.message };
    
    
  }

  
};




// ============new code but with out logger 09 jan  2025 ==========================

// import axios from "axios";
// import Order from "../models/orderModel.js";
// import { logSuccess, logError } from "../utils/loggerr.js";
// import dayjs from "dayjs";
// import customParseFormat from "dayjs/plugin/customParseFormat.js";
// import utc from "dayjs/plugin/utc.js";

// dayjs.extend(customParseFormat);
// dayjs.extend(utc);

// export const toISOStringUTC = (dateStr) => {
//   return dayjs(dateStr, "DD-MM-YYYY HH:mm:ss").utc().toISOString();
// };

// const SHOONYA_BASE_URL = process.env.SHOONYA_BASE_URL;

// // --- MAPPERS ---
// function getShoonyaProductCode(type) {
//   if (!type) return "I";
//   const upperType = type.toUpperCase();
//   switch (upperType) {
//     case "DELIVERY":
//     case "CNC":
//       return "C";
//     case "CARRYFORWARD":
//     case "NRML":
//       return "M";
//     case "INTRADAY":
//     case "MIS":
//       return "I";
//     case "BO":
//       return "B";
//     case "CO":
//       return "H";
//     default:
//       return "I";
//   }
// }

// function mapOrderTypeToShoonya(orderType) {
//   if (!orderType) return "MKT";
//   const upperType = orderType.toUpperCase();
//   switch (upperType) {
//     case "MARKET":
//     case "MKT":
//       return "MKT";
//     case "LIMIT":
//     case "LMT":
//       return "LMT";
//     case "SL":
//     case "SL-LMT":
//       return "SL-LMT";
//     case "SLM":
//     case "SL-MKT":
//       return "SL-MKT";
//     default:
//       return "MKT";
//   }
// }

// function mapTransactionType(type) {
//   if (!type) return "B";
//   return type.toUpperCase() === "SELL" ? "S" : "B";
// }

// // --- HELPERS ---
// const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// const normalizeStatus = (st) =>
//   String(st ?? "").trim().toUpperCase().replace(/\s+/g, " ");

// const isFinalStatus = (statusNorm) =>
//   statusNorm.includes("COMPLETE") ||
//   statusNorm.includes("FILLED") ||
//   statusNorm.includes("REJECT") ||
//   statusNorm.includes("CANCEL");

// const isRetryableStatus = (statusNorm) => {
//   const retryables = [
//     "OPEN", "PENDING", "TRIGGER PENDING", "TRIG PENDING",
//     "PARTIAL", "PARTIALLY FILLED", "AMO"
//   ];
//   return retryables.some((x) => statusNorm === x || statusNorm.includes(x));
// };

// // --- RETRY LOGIC FOR ORDERBOOK ---
// const fetchOrderDetailsWithRetry = async ({ uid, susertoken, orderid, req }) => {
//   const MAX_RETRIES = 3;
//   const RETRY_DELAY_MS = 1500;
//   let lastOrderDetails = null;

//   for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
//     try {
//       const obBody = `jKey=${susertoken}&jData=${JSON.stringify({ uid, actid: uid })}`;
//       const obResp = await axios.post(`${SHOONYA_BASE_URL}/OrderBook`, obBody, {
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       });
//       const obData = obResp.data;

//       if (!Array.isArray(obData)) {
//         if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
//         continue;
//       }

//       const orderDetails = obData.find((o) => String(o.norenordno) === String(orderid));
//       lastOrderDetails = orderDetails || lastOrderDetails;

//       if (!orderDetails) {
//         logSuccess(req, { msg: "Order not found in OrderBook", attempt, orderid });
//         if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
//         continue;
//       }

//       const statusNorm = normalizeStatus(orderDetails?.status);
//       logSuccess(req, { msg: "OrderBook poll", attempt, orderid, statusNorm });

//       if (isFinalStatus(statusNorm)) return orderDetails;
//       if (isRetryableStatus(statusNorm) && attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
//     } catch (e) {
//       logError(req, e, { msg: "OrderBook fetch error", attempt, raw: e?.response?.data });
//       if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
//     }
//   }
//   return lastOrderDetails;
// };

// // --- RETRY LOGIC FOR TRADEBOOK (WITH QUANTITY MATCHING) ---
// const fetchTradeBookWithRetry = async ({ uid, susertoken, orderid, expectedQty, req }) => {
//   const MAX_TRY = 3;
//   const DELAY = 1200;
//   let lastFills = [];

//   for (let attempt = 1; attempt <= MAX_TRY; attempt++) {
//     try {
//       const tbBody = `jKey=${susertoken}&jData=${JSON.stringify({ uid, actid: uid })}`;
//       const tbResp = await axios.post(`${SHOONYA_BASE_URL}/TradeBook`, tbBody, {
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       });
//       const tradeBook = tbResp.data;

//       if (!Array.isArray(tradeBook)) {
//         logSuccess(req, { msg: "TradeBook not an array, retrying...", attempt });
//         if (attempt < MAX_TRY) await sleep(DELAY);
//         continue;
//       }

//       const fills = tradeBook.filter((t) => String(t.norenordno) === String(orderid));
//       let totalQty = fills.reduce((sum, fill) => sum + (Number(fill.trdq) || 0), 0);

//       logSuccess(req, {
//         msg: "TradeBook attempt",
//         attempt,
//         orderid,
//         totalQty,
//         expectedQty,
//       });

//       if (totalQty >= expectedQty) return fills; // ✅ FULL FILL CONFIRMATION
//       lastFills = fills;
//     } catch (e) {
//       logError(req, e, { msg: "TradeBook fetch error", attempt, raw: e?.response?.data });
//     }
//     if (attempt < MAX_TRY) await sleep(DELAY);
//   }
//   return lastFills;
// };

// // --- MAIN FUNCTION ---
// export const placeFinavasiaOrder = async (user, reqInput, req, isLocalDbFlow = true) => {
//   const nowISOError = new Date().toISOString();
//   const transactionType = (reqInput.transactiontype || "").toUpperCase();
//   const uid = user?.kite_client_id;
//   const susertoken = user?.authToken;

//   if (!uid || !susertoken) {
//     return {
//       userId: user?.id,
//       broker: "Finvasia",
//       result: "ERROR",
//       message: "Shoonya uid or token missing. Please login first.",
//     };
//   }

//   // --- 1. CHECK FOR EXISTING BUY ORDER (FOR MERGE) ---
//   let existingBuyOrder = null;
//   if (transactionType === "BUY") {
//     existingBuyOrder = await Order.findOne({
//       where: {
//         userId: user.id,
//         ordertype: reqInput.orderType,
//         producttype: reqInput.productType,
//         tradingsymbol: reqInput.finavasiaSymbol || reqInput.symbol,
//         transactiontype: "BUY",
//         orderstatuslocaldb: "OPEN",
//       },
//     });
//   }

//   // --- 2. CREATE PENDING ORDER ---
//   const orderData = {
//     symboltoken: reqInput.finavasiaToken || reqInput.token,
//     variety: reqInput.variety || "NORMAL",
//     tradingsymbol: reqInput.finavasiaSymbol || reqInput.symbol,
//     instrumenttype: reqInput.instrumenttype,
//     transactiontype: transactionType,
//     exchange: reqInput.exch_seg,
//     ordertype: reqInput.orderType,
//     quantity: reqInput.quantity,
//     producttype: reqInput.productType,
//     price: reqInput.price,
//     orderstatuslocaldb: "PENDING",
//     ordertag: "softwaresetu",
//     userId: user.id,
//     broker: "finvasia",
//     userNameId: user.username,
//     strategyName: reqInput.groupName || "",
//     strategyUniqueId: reqInput.strategyUniqueId || "",
//     buyOrderId: reqInput.buyOrderId || null,
//     angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
//     angelOneToken: reqInput.angelOneToken || reqInput.token,
//   };
//   const newOrder = await Order.create(orderData);

//   // --- 3. PLACE ORDER IN SHOONYA ---
//   const shoonyaProductType = isLocalDbFlow
//     ? getShoonyaProductCode(reqInput.productType)
//     : reqInput.productType;
//   const shoonyaOrderType = isLocalDbFlow
//     ? mapOrderTypeToShoonya(reqInput.orderType)
//     : reqInput.orderType;

//   const jData = {
//     uid: String(uid),
//     actid: String(uid),
//     exch: String(reqInput.exch_seg),
//     tsym: String(reqInput.finavasiaSymbol || reqInput.symbol),
//     qty: String(reqInput.quantity),
//     prc: String(reqInput.orderType === "MARKET" ? 0 : reqInput.price),
//     prd: shoonyaProductType,
//     prctyp: shoonyaOrderType,
//     remarks: "softwaresetu",
//     trantype: mapTransactionType(reqInput.transactiontype),
//     ret: "DAY",
//   };
//   const body = `jData=${JSON.stringify(jData)}&jKey=${susertoken}`;

//   let placeRes;
//   try {
//     const resp = await axios.post(`${SHOONYA_BASE_URL}/PlaceOrder`, body, {
//       headers: { "Content-Type": "application/x-www-form-urlencoded" },
//     });
//     placeRes = resp.data;
//     if (!placeRes || placeRes.stat !== "Ok") {
//       const msg = placeRes?.emsg || "Order placement failed";
//       await newOrder.update({
//         orderstatuslocaldb: "FAILED",
//         status: "FAILED",
//         text: msg,
//         buyTime: nowISOError,
//         filltime: nowISOError,
//       });
//       return { userId: user.id, broker: "Finvasia", result: "BROKER_REJECTED", message: msg };
//     }
//   } catch (err) {
//     await newOrder.update({
//       orderstatuslocaldb: "FAILED",
//       status: "FAILED",
//       text: err?.response?.data?.emsg || err.message,
//       buyTime: nowISOError,
//       filltime: nowISOError,
//     });
//     return { userId: user.id, broker: "Finvasia", result: "BROKER_ERROR", message: err.message };
//   }

//   const orderid = placeRes.norenordno;
//   await newOrder.update({ orderid });

//   // --- 4. FETCH ORDER DETAILS (WITH RETRY) ---
//   let orderDetails = await fetchOrderDetailsWithRetry({ uid, susertoken, orderid, req });
//   if (orderDetails) {
//     const statusNorm = normalizeStatus(orderDetails.status);
//     if (statusNorm.includes("REJECT")) {
//       await newOrder.update({
//         status: "REJECTED",
//         orderstatuslocaldb: "REJECTED",
//         text: orderDetails.rejreason || "Order rejected",
//         buyTime: nowISOError,
//         filltime: nowISOError,
//       });
//       return { userId: user.id, broker: "Finvasia", result: "BROKER_REJECTED", message: "Order rejected" };
//     }
//     if (statusNorm.includes("CANCEL")) {
//       await newOrder.update({
//         status: "CANCELLED",
//         orderstatuslocaldb: "CANCELLED",
//         text: orderDetails.rejreason || "Order cancelled",
//         buyTime: nowISOError,
//         filltime: nowISOError,
//       });
//       return { userId: user.id, broker: "Finvasia", result: "CANCELLED", message: "Order cancelled" };
//     }
//   }

//   // --- 5. FETCH TRADEBOOK (WITH QUANTITY MATCHING) ---
//   const tradeBook = await fetchTradeBookWithRetry({
//     uid,
//     susertoken,
//     orderid,
//     expectedQty: reqInput.quantity,
//     req,
//   });

//   if (!tradeBook?.length) {
//     await newOrder.update({ orderstatuslocaldb: "PENDING", text: "Trade not found yet" });
//     return { userId: user.id, broker: "Finvasia", result: "PENDING", orderid };
//   }

//   // --- 6. CALCULATE TRADE DETAILS ---
//   let totalQty = 0;
//   let totalValue = 0;
//   tradeBook.forEach((fill) => {
//     totalQty += Number(fill.trdq || 0);
//     totalValue += Number(fill.trdq || 0) * Number(fill.flprc || 0);
//   });
//   const avgPrice = totalQty > 0 ? totalValue / totalQty : 0;
//   const firstFill = tradeBook[0];

//   // --- 7. HANDLE SELL LOGIC (PARTIAL/FULL) ---
//   if (transactionType === "SELL" && reqInput.buyOrderId) {
//     const buyOrder = await Order.findOne({
//       where: {
//         userId: user.id,
//         orderid: reqInput.buyOrderId,
//         status: "COMPLETE",
//         orderstatuslocaldb: "OPEN",
//       },
//     });

//     if (buyOrder) {
//       const originalQty = Number(buyOrder.fillsize || buyOrder.quantity);
//       const usedQty = totalQty;
//       const remainingQty = originalQty - usedQty;

//       if (remainingQty > 0) {
//         // --- PARTIAL SELL: SPLIT BUY ORDER ---
//         await buyOrder.update({
//           fillsize: remainingQty,
//           quantity: remainingQty,
//           tradedValue: (Number(buyOrder.tradedValue || 0) - (Number(buyOrder.fillprice || 0) * usedQty)),
//         });
//         await Order.create({
//           ...buyOrder.toJSON(),
//           id: undefined,
//           fillsize: usedQty,
//           quantity: usedQty,
//           tradedValue: Number(buyOrder.fillprice || 0) * usedQty,
//           text: "BUY_SPLIT_FOR_SELL",
//         });
//       } else {
//         // --- FULL SELL: CLOSE BUY ORDER ---
//         await buyOrder.update({ orderstatuslocaldb: "COMPLETE", positionStatus: "COMPLETE" });
//       }
//     }
//   }

//   // --- 8. UPDATE FINAL ORDER STATUS ---
//   const pnl = transactionType === "SELL" && buyOrder
//     ? (avgPrice * totalQty) - (Number(buyOrder.fillprice || 0) * totalQty)
//     : 0;

//   await newOrder.update({
//     tradedValue: avgPrice * totalQty,
//     fillprice: avgPrice,
//     fillsize: totalQty,
//     fillid: firstFill?.flid,
//     filltime: firstFill?.fltm ? await toISOStringUTC(firstFill.fltm) : nowISOError,
//     status: "COMPLETE",
//     orderstatuslocaldb: transactionType === "SELL" ? "COMPLETE" : "OPEN",
//     pnl,
//   });

//   // --- 9. MERGE BUY ORDERS IF NEEDED ---
//   if (transactionType === "BUY" && existingBuyOrder) {
//     const mergedQty = Number(existingBuyOrder.fillsize || 0) + totalQty;
//     const mergedValue = Number(existingBuyOrder.tradedValue || 0) + (avgPrice * totalQty);
//     await existingBuyOrder.update({
//       fillsize: mergedQty,
//       quantity: mergedQty,
//       tradedValue: mergedValue,
//       price: mergedValue / mergedQty,
//       fillprice: mergedValue / mergedQty,
//     });
//     await newOrder.destroy();
//     return { result: "SUCCESS", mergedInto: existingBuyOrder.id };
//   }

//   return { userId: user.id, broker: "Finvasia", result: "SUCCESS", orderid };
// };







// import axios from "axios";
// import Order from "../models/orderModel.js";
// import { logSuccess, logError } from "../utils/loggerr.js";
// import dayjs from "dayjs";
// import customParseFormat from "dayjs/plugin/customParseFormat.js";
// import utc from "dayjs/plugin/utc.js";


// dayjs.extend(customParseFormat);
// dayjs.extend(utc);

// export const toISOStringUTC = (dateStr) => {
//   return dayjs(dateStr, "DD-MM-YYYY HH:mm:ss").utc().toISOString();
// };

// const SHOONYA_BASE_URL = process.env.SHOONYA_BASE_URL;

// // 🔁 Map your generic product type → Shoonya PRD code
// function getShoonyaProductCode(type) {
//   if (!type) return "I";
//   switch (type.toUpperCase()) {
//     case "DELIVERY":
//     case "CNC":
//       return "C";
//     case "CARRYFORWARD":
//     case "NRML":
//       return "M";
//     case "INTRADAY":
//     case "MIS":
//       return "I";
//     case "BO":
//       return "B";
//     case "CO":
//       return "H";
//     default:
//       return "I";
//   }
// }

// // 🔁 Map your orderType → Shoonya prctyp
// function mapOrderTypeToShoonya(orderType) {
//   if (!orderType) return "MKT";
//   switch (orderType.toUpperCase()) {
//     case "MARKET":
//     case "MKT":
//       return "MKT";
//     case "LIMIT":
//     case "LMT":
//       return "LMT";
//     case "SL":
//     case "SL-LMT":
//       return "SL-LMT";
//     case "SLM":
//     case "SL-MKT":
//       return "SL-MKT";
//     default:
//       return "MKT";
//   }
// }

// function mapTransactionType(type) {
//   if (!type) return "B";
//   return type.toUpperCase() === "SELL" ? "S" : "B";
// }

// //  new code start 

// export const placeFinavasiaOrder = async (
//   user,
//   reqInput,
//   req,
//   isLocalDbFlow = true
// ) => {

//   try {
//     const nowISOError = new Date().toISOString();

//     // ✅ helpers
//     const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

//     const normalizeStatus = (st) =>
//       String(st ?? "")
//         .trim()
//         .toUpperCase()
//         .replace(/\s+/g, " ");

//     const isFinalStatus = (statusNorm) => {
//       if (statusNorm.includes("COMPLETE") || statusNorm.includes("FILLED")) return true;
//       if (statusNorm.includes("REJECT")) return true;
//       if (statusNorm.includes("CANCEL")) return true;
//       return false;
//     };

//     const isRetryableStatus = (statusNorm) => {
//       const retryables = [
//         "OPEN",
//         "PENDING",
//         "TRIGGER PENDING",
//         "TRIG PENDING",
//         "PARTIAL",
//         "PARTIALLY FILLED",
//         "AMO",
//       ];
//       return retryables.some((x) => statusNorm === x || statusNorm.includes(x));
//     };

//     // ✅ OrderBook with retries (only for OPEN/PENDING type)
//     const fetchOrderDetailsWithRetry = async ({ uid, susertoken, orderid }) => {
//       const MAX_RETRIES = 3;
//       const RETRY_DELAY_MS = 1500;

//       let lastOrderDetails = null;

//       for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
//         try {
//           const obBody = `jKey=${susertoken}&jData=${JSON.stringify({
//             uid,
//             actid: uid,
//           })}`;

//           const obResp = await axios.post(`${SHOONYA_BASE_URL}/OrderBook`, obBody, {
//             headers: { "Content-Type": "application/x-www-form-urlencoded" },
//           });

//           const obData = obResp.data;

//           if (!Array.isArray(obData)) {
//             if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
//             continue;
//           }

//           const orderDetails = obData.find(
//             (o) => String(o.norenordno) === String(orderid)
//           );

//           lastOrderDetails = orderDetails || lastOrderDetails;

//           if (!orderDetails) {
//             logSuccess(req, {
//               msg: "Order not found in OrderBook yet",
//               attempt,
//               orderid,
//             });
//             if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS);
//             continue;
//           }

//           const statusNorm = normalizeStatus(orderDetails?.status);

//           logSuccess(req, {
//             msg: "OrderBook matched orderDetails (poll)",
//             attempt,
//             orderid,
//             statusNorm,
//           });

//           if (isFinalStatus(statusNorm)) return orderDetails;

//           if (isRetryableStatus(statusNorm)) {
//             if (attempt < MAX_RETRIES) {
//               await sleep(RETRY_DELAY_MS);
//               continue;
//             }
//             return orderDetails; // retries exhausted
//           }

//           // unknown status -> return
//           return orderDetails;
//         } catch (e) {
//           logError(req, e, {
//             msg: "OrderBook fetch error (attempt)",
//             attempt,
//             raw: e?.response?.data,
//           });

//           if (attempt < MAX_RETRIES) {
//             await sleep(RETRY_DELAY_MS);
//             continue;
//           }
//         }
//       }

//       return lastOrderDetails;
//     };

//     // ✅ TradeBook (small retry) because sometimes trade shows late
//     const fetchTradeBookWithRetry = async ({ uid, susertoken }) => {
//       const MAX_TRY = 3;
//       const DELAY = 1200;

//       for (let i = 1; i <= MAX_TRY; i++) {
//         try {
//           const tbBody = `jKey=${susertoken}&jData=${JSON.stringify({
//             uid,
//             actid: uid,
//           })}`;

//           const tbResp = await axios.post(`${SHOONYA_BASE_URL}/TradeBook`, tbBody, {
//             headers: { "Content-Type": "application/x-www-form-urlencoded" },
//           });

//           return tbResp.data;
//         } catch (e) {
//           logError(req, e, {
//             msg: "TradeBook fetch retry",
//             attempt: i,
//             raw: e?.response?.data,
//           });
//           if (i < MAX_TRY) await sleep(DELAY);
//         }
//       }
//       return null;
//     };

//      let existingBuyOrder = null;  // OLD OPEN BUY

//      // ====================================================
//     // 1️⃣ READ existing BUY (NO UPDATE HERE)
//     // ====================================================
//     if ((reqInput.transactiontype || "").toUpperCase() === "BUY") {
//       existingBuyOrder = await Order.findOne({
//         where: {
//           userId: user.id,
//           ordertype: reqInput.orderType,
//           producttype: reqInput.productType,
//           tradingsymbol:  reqInput?.finavasiaSymbol || reqInput?.symbol,
//           transactiontype: "BUY",
//           orderstatuslocaldb: "OPEN",
//         },
//       });
//     }

//     // 1) Resolve mappings + validate session
//     const transactionType = (reqInput.transactiontype || "").toUpperCase();
//     const uid = user?.kite_client_id;
//     const susertoken = user?.authToken;


//     if (!uid || !susertoken) {
//       return {
//         userId: user?.id,
//         broker: "Finvasia",
//         result: "ERROR",
//         message: "Shoonya uid or token missing. Please login Shoonya first.",
//       };
//     }



//     // 2) CREATE LOCAL PENDING ORDER
//     const orderData = {
//       symboltoken: reqInput.finavasiaToken || reqInput.token,
//       variety: reqInput.variety || "NORMAL",
//       tradingsymbol: reqInput?.finavasiaSymbol || reqInput?.symbol,
//       instrumenttype: reqInput.instrumenttype,
//       transactiontype: transactionType,
//       exchange: reqInput.exch_seg,
//       ordertype: reqInput.orderType,
//       quantity: reqInput.quantity,
//       producttype: reqInput.productType,
//       price: reqInput.price,
//       orderstatuslocaldb: "PENDING",
//        ordertag:"softwaresetu",
//       totalPrice: reqInput.totalPrice,
//       actualQuantity: reqInput.actualQuantity,
//       userId: user.id,
//       broker: "finvasia",
//       angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
//       angelOneToken: reqInput.angelOneToken || reqInput.token,
//       userNameId: user.username,
//       strategyName: reqInput?.groupName || "",
//       strategyUniqueId: reqInput?.strategyUniqueId || "",
//       buyOrderId: reqInput?.buyOrderId || null,
//     };

//     const newOrder = await Order.create(orderData);

//     // 3) Mappings
//     const shoonyaProductType = isLocalDbFlow
//       ? getShoonyaProductCode(reqInput.productType)
//       : reqInput.productType;

//     const shoonyaOrderType = isLocalDbFlow
//       ? mapOrderTypeToShoonya(reqInput.orderType)
//       : reqInput.orderType;

//     // 4) BUILD SHOONYA PAYLOAD
//     const jData = {
//       uid: String(uid),
//       actid: String(uid),
//       exch: String(reqInput.exch_seg),
//       tsym: String(reqInput?.finavasiaSymbol || reqInput?.symbol),
//       qty: String(reqInput.quantity),
//       prc: String(reqInput.orderType === "MARKET" ? 0 : reqInput.price),
//       prd: shoonyaProductType,
//       prctyp: shoonyaOrderType,
//       remarks:"softwaresetu",
//       trantype: mapTransactionType(reqInput.transactiontype),
//       ret: "DAY",
//     };

//     const body = `jData=${JSON.stringify(jData)}&jKey=${susertoken}`;

//     // 5) PLACE ORDER IN SHOONYA
//     let placeRes;
//     try {
//       const resp = await axios.post(`${SHOONYA_BASE_URL}/PlaceOrder`, body, {
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       });
//       placeRes = resp.data;

//       logSuccess(req, { msg: "Shoonya PlaceOrder response", placeRes });

//       if (!placeRes || placeRes.stat !== "Ok") {
//         const msg = placeRes?.emsg || "Shoonya order placement failed";
//         await newOrder.update({
//           orderstatuslocaldb: "FAILED",
//           status: "FAILED",
//           text: msg,
//           buyTime: nowISOError,
//           filltime: nowISOError,
//         });
//         return {
//           userId: user.id,
//           broker: "Finvasia",
//           result: "BROKER_REJECTED",
//           message: msg,
//           raw: placeRes,
//         };
//       }
//     } catch (err) {
//       logError(req, err, { msg: "Shoonya PlaceOrder API error", raw: err?.response?.data });

//       await newOrder.update({
//         orderstatuslocaldb: "FAILED",
//         status: "FAILED",
//         text: err?.response?.data?.emsg || err?.message || "Shoonya PlaceOrder error",
//         buyTime: nowISOError,
//         filltime: nowISOError,
//       });

//       return {
//         userId: user.id,
//         broker: "Finvasia",
//         result: "BROKER_ERROR",
//         message: err?.message || "Shoonya PlaceOrder error",
//       };
//     }

//     const orderid = placeRes.norenordno;
//     await newOrder.update({ orderid });

   
//     // 6) FETCH ORDER DETAILS (OrderBook) with retry
//     let orderDetails = null;
//     try {
//       orderDetails = await fetchOrderDetailsWithRetry({ uid, susertoken, orderid });

//       if (orderDetails) {

//         const statusNorm = normalizeStatus(orderDetails?.status);

//         const rej = orderDetails?.rejreason || "";

//         if (statusNorm.includes("REJECT")) {
//           await newOrder.update({
//             status: "REJECTED",
//             orderstatuslocaldb: "REJECTED",
//             text: rej,
//             buyTime: nowISOError,
//             filltime: nowISOError,
//           });
//           return {
//             userId: user.id,
//             broker: "Finvasia",
//             result: "BROKER_REJECTED",
//             message: rej || "Order rejected",
//             orderid,
//           };
//         }

//         if (statusNorm.includes("CANCEL")) {
//           await newOrder.update({
//             status: "CANCELLED",
//             orderstatuslocaldb: "CANCELLED",
//             text: rej,
//             buyTime: nowISOError,
//             filltime: nowISOError,
//           });
//           return {
//             userId: user.id,
//             broker: "Finvasia",
//             result: "CANCELLED",
//             message: rej || "Order cancelled",
//             orderid,
//           };
//         }

//         if (statusNorm.includes("COMPLETE") || statusNorm.includes("FILLED")) {
//           await newOrder.update({
//             status: "COMPLETE",
//             orderstatuslocaldb: "OPEN", // your style: keep OPEN position
//             text: "",
//           });
//         } else if (isRetryableStatus(statusNorm)) {
//           await newOrder.update({
//             status: "OPEN",
//             orderstatuslocaldb: "OPEN",
//             text: rej,
//             buyTime: nowISOError,
//             filltime: nowISOError,
//           });
//         }
//       }
//     } catch (e) {
//       logError(req, e, { msg: "OrderBook fetch error (non-fatal)", raw: e?.response?.data });
//     }

//     // 7) UPDATE LOCAL ORDER basic snapshot (optional)
//     const avgPrice = Number(orderDetails?.avgprc) || 0;
//     const filledQty = Number(orderDetails?.qty) || Number(reqInput.quantity) || 0;

//     await newOrder.update({
//       uniqueorderid: orderDetails?.exchordid || null,
//       averageprice: avgPrice,
//       lotsize: filledQty,
//       price: avgPrice,
//       status: orderDetails?.status ? String(orderDetails.status).toUpperCase() : null,
//     });

//     // 8) FETCH TRADEBOOK FOR FILL + THEN SELL PAIRING
//     try {
//       const tradeBook = await fetchTradeBookWithRetry({ uid, susertoken });

//       logSuccess(req, {
//         msg: "TradeBook response",
//         isArray: Array.isArray(tradeBook),
//         size: tradeBook?.length,
//       });

//       let t = null;

//       let totalQty = 0;
//       let totalValue = 0;

//       if (Array.isArray(tradeBook)) {

//         const fills = tradeBook.filter(
//             t => String(t.norenordno) === String(orderid)
//           );

//           fills.forEach(fill => {
//               const qty = Number(fill.trdq);
//               const price = Number(fill.flprc);

//               totalQty += qty;
//               totalValue += qty * price;
//             });
//       }

//       const avgPrice = totalQty > 0 ? (totalValue / totalQty) : 0;

//        t = fills[0]

//       if (!t) {
//         // trade not found yet -> keep PENDING/OPEN (do not close BUY)
//         await newOrder.update({
//           orderstatuslocaldb: "PENDING",
//           text: "TRADE_NOT_FOUND_YET",
//         });

//         return {
//           userId: user.id,
//           broker: "Finvasia",
//           result: "SUCCESS",
//           orderid,
//           note: "Trade not found yet in TradeBook",
//         };
//       }

//       // ✅ NOW trade is confirmed → do SELL pairing safely
//       let finalStatus = "OPEN";
//       let positionStatus =  "OPEN";
//       let buyOrderId = "NA";
//       let buyOrder = null;

//       if (transactionType === "SELL") {
//         buyOrderId = String(reqInput.buyOrderId || "NA");

//         // find your BUY position to close
//         buyOrder = await Order.findOne({
//           where: {
//             userId: user.id,
//             orderid: buyOrderId,
//             status: "COMPLETE",
//             orderstatuslocaldb: "OPEN",
//           },
//           raw: true,
//         });

       

//         if (buyOrder) {
//           await Order.update(
//             { orderstatuslocaldb: "COMPLETE",positionStatus:"COMPLETE" },
//             { where: { id: buyOrder.id } }
//           );
//           finalStatus = "COMPLETE";
//         } 
//       }

//       const tradePrice = avgPrice
//       const tradeQty = totalQty

//       const buyPrice = Number(buyOrder?.fillprice || 0);
//       const buySize = Number(buyOrder?.fillsize || 0);
//       const buyValue = Number(buyOrder?.tradedValue || 0);
//       let buyTime = buyOrder?.filltime || "NA";

//       let pnl = tradeQty * tradePrice - buyPrice * buySize;
//       if (transactionType === "BUY") {
//         pnl = 0;
//         buyTime = "NA";
//       }

//       const iso = await toISOStringUTC(t.fltm);

//       await newOrder.update({
//         tradedValue: tradePrice * tradeQty,
//         fillprice: tradePrice,
//         fillsize: tradeQty,
//         fillid: t.flid,
//         price: tradePrice,
//         filltime: iso,
//         status: "COMPLETE",
//         orderstatuslocaldb: finalStatus,
//         positionStatus:positionStatus,
//         buyOrderId: buyOrderId,
//         pnl,
//         buyTime,
//         buyprice: buyPrice,
//         buysize: buySize,
//         buyvalue: buyValue,
//       });

//     // ====================================================
//     // 🔥 8️⃣ SAFE BUY MERGE (LAST STEP)
//     // ====================================================
//     if (
//       (reqInput.transactiontype || "").toUpperCase() === "BUY" &&
//       existingBuyOrder
//     ) {
//       const mergedQty =
//         Number(existingBuyOrder.fillsize || 0) + totalQty;

//       const mergedValue =
//         Number(existingBuyOrder.tradedValue || 0) +
//         avgPrice * totalQty;

//       const mergedAvg = mergedValue / mergedQty;

//       await existingBuyOrder.update({
//         fillsize: mergedQty,
//         quantity: mergedQty,
//         tradedValue: mergedValue,
//         price: mergedAvg,
//         fillprice: mergedAvg,
//       });

//       await newOrder.destroy();

//       return {
//         result: "SUCCESS",
//         mergedInto: existingBuyOrder.id,
//       };
//     }


//     } catch (e) {
//       logError(req, e, { msg: "TradeBook fetch error (non-fatal)", raw: e?.response?.data });

//       // tradebook fail -> don't close BUY; keep pending
//       await newOrder.update({
//         orderstatuslocaldb: "PENDING",
//         text: "TRADEBOOK_ERROR",
//       });
//     }

//     return {
//       userId: user.id,
//       broker: "Finvasia",
//       result: "SUCCESS",
//       orderid,
//     };

//   } catch (err) {
//     logError(req, err, { msg: "Finvasia Order Error (catch)" });
//     return {
//       userId: user?.id,
//       broker: "Finvasia",
//       result: "ERROR",
//       message: err.message,
//     };
//   }
// };


















