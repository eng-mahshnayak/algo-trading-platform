
import axios from "axios";
import Order from "../models/orderModel.js";
import { logSuccess, logError } from "../utils/loggerr.js";

const UPSTOX_BASE = "https://api-hft.upstox.com/v3";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const upstoxHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  Accept: "application/json",
  "Content-Type": "application/json",
});

const getProduct = (p) => {
  switch ((p || "").toUpperCase()) {
    case "INTRADAY": return "I";
    case "DELIVERY": return "D";
    default: return "D";
  }
};

// ==========================================
// 📌 POLL ORDER STATUS
// ==========================================
async function pollUpstoxDetails(token, orderId) {
  for (let i = 0; i < 10; i++) {
    try {
      const r = await axios.get(
        `${UPSTOX_BASE}/order/details`,
        { headers: upstoxHeaders(token), params: { order_id: orderId } }
      );
      const st = r?.data?.data?.status;
      if (["complete", "rejected", "cancelled"].includes(st)) return r.data.data;
    } catch(err) {
        logError(req, err, {
        msg: "upstox pollUpstoxDetails failed",
        error:err
      });
    }
    await sleep(500);
  }
  return null;
}


// ==========================================
// 📌 GET TRADES WITH RETRY + QTY CHECK
// ==========================================
async function fetchUpstoxTrades(token, orderId, expectedQty) {
  for (let i = 0; i < 12; i++) {
    try {
      const r = await axios.get(
        `${UPSTOX_BASE}/order/trades`,
        { headers: upstoxHeaders(token), params: { order_id: orderId } }
      );

      let trades = r?.data?.data || [];
      let sumQty = trades.reduce((acc, t) => acc + Number(t.quantity), 0);

      // 🟢 RETURN only when qty fully matches
      if (sumQty >= expectedQty) return trades;

      console.log(
        `🔄 Waiting trades: got=${sumQty}, want=${expectedQty}, retry=${i + 1}`,
      );
    } catch (err) {
      logError(req, err, {
        msg: "upstox fetchUpstoxTrades failed",
        error:err
      });
      console.log("Trade fetch retry err:", err?.message);
    }

    await sleep(600);
  }

  console.log("⚠️ Trade polling timeout, returning whatever is found");
  try {
    const r = await axios.get(
      `${UPSTOX_BASE}/order/trades`,
      { headers: upstoxHeaders(token), params: { order_id: orderId } }
    );
    return r?.data?.data || [];
  } catch(err) {

        logError(req, err, {
        msg: "upstox fetchUpstoxTrades failed",
        error:err
      });

    return [];
  }
}



// ==========================================
// 📌 MAIN FUNCTION — BUY MERGE + PARTIAL SELL
// ==========================================
export const placeUpstoxOrder = async (user, reqInput, req) => {
  let tempOrder = null;
  let existingBuy = null;
  let buyOrder = null

  try {
    const product = getProduct(reqInput.productType);
    const instrumentToken = `${reqInput.exch_seg}|${reqInput.token}`;
    const isBuy = reqInput.transactiontype === "BUY";
    const isSell = !isBuy;

    if (isBuy) {
      existingBuy = await Order.findOne({
        where: {
          userId: user.id,
          tradingsymbol: reqInput.symbol,
          producttype:product,
          ordertype:reqInput.orderType,
          transactiontype: "BUY",
          orderstatuslocaldb: "OPEN",
          broker: "upstox",
        },
      });
    }

    // 1️⃣ Temp DB entry
    tempOrder = await Order.create({
      variety: reqInput.variety || "NORMAL",
      tradingsymbol: reqInput.symbol,
      symboltoken: reqInput.token,
      transactiontype: reqInput.transactiontype,
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: String(reqInput.quantity),
      producttype: product,
      duration: reqInput.duration,
      price: reqInput.price || "0",
      triggerprice: reqInput.triggerprice || 0,
      orderstatuslocaldb: "PENDING",
      userId: user.id,
      userNameId: user.username,
      broker: "upstox",
    });

    // 2️⃣ Place order
    const placeRes = await axios.post(
      `${UPSTOX_BASE}/order/place`,
      {
        instrument_token: instrumentToken,
        quantity: Number(reqInput.quantity),
        order_type: reqInput.orderType,
        transaction_type: reqInput.transactiontype,
        product,
        price: reqInput.price || 0,
        validity: "DAY",
        slice: false,
      },
      { headers: upstoxHeaders(user.accessToken) }
    );

    const orderIds = placeRes?.data?.data?.order_ids ||
                    [placeRes?.data?.data?.order_id];

    const mainOrderId = orderIds[0];
    await tempOrder.update({ orderid: mainOrderId });

    // 3️⃣ Poll status
    const details = await pollUpstoxDetails(user.accessToken, mainOrderId);

    // if (!details || ["rejected", "cancelled", "open", "pending",].includes(details.status)) {
    //   await tempOrder.update({
    //     orderstatuslocaldb: details?.status?.toUpperCase() || "FAILED",
    //     status: "FAILED",
    //   });
    //   return { result: "BROKER_REJECTED" };
    // }

      const rawStatus = details?.status || "";
      const statusNorm = rawStatus.toUpperCase();

      // SAFE DEFAULT
      if (!details) {
        await tempOrder.update({
          orderstatuslocaldb: "FAILED",
          positionStatus: "FAILED",
          status: "FAILED"
        });
        return { result: "FAILED" };
      }

      // 🔴 REJECTED
      if (["REJECT", "REJECTED"].includes(statusNorm)) {

      logError(req, null, {
        msg: "upstox order REJECTED",
        error:null
      });

        await tempOrder.update({
          orderstatuslocaldb: "REJECTED",
          positionStatus: "REJECTED",
          status: "REJECTED",
        });
        return { result: "BROKER_REJECTED" };
      }

      // 🟠 CANCELLED
      if (["CANCEL", "CANCELLED"].includes(statusNorm)) {

      logError(req, null, {
        msg: "upstox order CANCELLED",
        error:null
      });

        await tempOrder.update({
          orderstatuslocaldb: "CANCELLED",
          positionStatus: "CANCELLED",
          status: "CANCELLED",
        });
        return { result: "BROKER_CANCELLED" };
      }

      // 🟡 OPEN
      if (statusNorm === "OPEN") {

         logError(req, null, {
        msg: "upstox order OPEN",
        error:null
      });

        await tempOrder.update({
          orderstatuslocaldb: "OPEN",
          positionStatus: "OPEN",
          status: "OPEN",
        });
        return { result: "OPEN" };
      }

      // 🟢 PENDING
      if (statusNorm === "PENDING") {

     logError(req, null, {
        msg: "upstox order PENDING",
        error:null
      });

        await tempOrder.update({
          orderstatuslocaldb: "PENDING",
          positionStatus: "PENDING",
          status: "PENDING",
        });
        return { result: "PENDING" };
      }

    // 4️⃣ Fetch trades until qty matches
    let trades = [];
    for (const oid of orderIds) {
      const t = await fetchUpstoxTrades(
        user.accessToken,
        oid,
        Number(reqInput.quantity)
      );
      trades.push(...t);
    }

    let totalQty = trades.reduce((a, t) => a + Number(t.quantity), 0);
    let totalValue = trades.reduce(
      (a, t) => a + Number(t.quantity) * Number(t.average_price),
      0
    );

    const avgPrice = totalValue / totalQty;
    const fill = trades[0];

    // ==========================================================
    // 5️⃣ PARTIAL / FULL SELL & DB EDIT
    // ==========================================================
    let finalStatus = "OPEN";
    let positionStatus = "OPEN";

    if (isSell) {
       buyOrder = await Order.findOne({
        where: {
          userId: user.id,
          tradingsymbol: reqInput.symbol,
          transactiontype: "BUY",
          orderstatuslocaldb: "OPEN",
          broker: "upstox",
        },
      });

      if (buyOrder) {
        const oldQty = Number(buyOrder.fillsize);
        const soldQty = Number(totalQty);
        const leftQty = oldQty - soldQty;

        if (leftQty <= 0) {
          await buyOrder.update({
            orderstatuslocaldb: "COMPLETE",
            positionStatus: "COMPLETE",
          });
          finalStatus = "COMPLETE";
          positionStatus = "COMPLETE";
        } else {
          await buyOrder.update({
            fillsize: leftQty,
            quantity: leftQty,
            tradedValue: (buyOrder.tradedValue / oldQty) * leftQty,
          });
          finalStatus = "OPEN";
          positionStatus = "OPEN";
        }
      } else {
        finalStatus = "COMPLETE";
        positionStatus = "UNKNOWN";
      }
    }

    // ==========================================================
    // 6️⃣ Update this SELL/BUY fill
    // ==========================================================
    await tempOrder.update({
      tradedValue: totalValue,
      fillsize: totalQty,
      fillprice: avgPrice,
      price: avgPrice,
      fillid: fill.trade_id,
      filltime: fill.exchange_timestamp,
      pnl: isSell && existingBuy ? (totalValue - (existingBuy.totalQty*existingBuy.price)) : 0,
      status: "COMPLETE",
      orderstatuslocaldb: finalStatus,
      positionStatus,
      buyOrderId: buyOrder?.orderid || null,
      buyprice: buyOrder?.fillprice,
      buysize: totalQty,
      buyvalue: totalQty*buyOrder?.fillprice,
    });

    // ==========================================================
    // 7️⃣ BUY + MERGE logic
    // ==========================================================
    if (isBuy && existingBuy) {
      const mergedQty = existingBuy.fillsize + totalQty;
      const mergedValue = existingBuy.tradedValue + totalValue;
      const mergedAvg = mergedValue / mergedQty;

      await existingBuy.update({
        fillsize: mergedQty,
        quantity: mergedQty,
        tradedValue: mergedValue,
        price: mergedAvg,
        fillprice: mergedAvg,
      });

      await tempOrder.destroy();
      return { result: "SUCCESS", orderid: existingBuy.id };
    }

    return { result: "SUCCESS", orderid: tempOrder.id };

  } catch (err) {

     logError(req, err, {
        msg: "upstox main catch error",
        error:err
      });

    await tempOrder?.update({
      orderstatuslocaldb: "FAILED",
      status: "FAILED",
      text: err.message,
    });
    return { result: "ERROR", message: err.message };
  }
};



// =====================09 jan 2025========================


// import axios from "axios";
// import Order from "../models/orderModel.js";

// // =======================
// // UPSTOX CONSTANTS
// // =======================
// const UPSTOX_BASE = "https://api-hft.upstox.com/v3";

// // =======================
// // HELPERS
// // =======================
// const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// const upstoxHeaders = (token) => ({
//   Authorization: `Bearer ${token}`,
//   Accept: "application/json",
//   "Content-Type": "application/json",
// });

// const getProduct = (p) => {
//   switch ((p || "").toUpperCase()) {
//     case "INTRADAY":return "I";
//     case "DELIVERY":return "D";
//     case "I": return "I";
//     case "D": return "D";
//     default: return "D";
//   }
// };

// // =======================
// // POLL ORDER DETAILS
// // =======================
// async function pollUpstoxDetails(token, orderId) {
//   for (let i = 0; i < 6; i++) {
//     try {
//       const r = await axios.get(
//         `${UPSTOX_BASE}/order/details`,
//         { headers: upstoxHeaders(token), params: { order_id: orderId } }
//       );

//       const st = r?.data?.data?.status;
//       if (["complete", "rejected", "cancelled"].includes(st)) {
//         return r.data.data;
//       }
//       await sleep(400 + i * 200);
//     } catch (e) {
//       await sleep(500);
//     }
//   }
//   return null;
// }

// // =======================
// // FETCH TRADES
// // =======================
// async function fetchUpstoxTrades(token, orderId) {
//   const r = await axios.get(
//     `${UPSTOX_BASE}/order/trades`,
//     { headers: upstoxHeaders(token), params: { order_id: orderId } }
//   );
//   return r?.data?.data || [];
// }

// // =======================
// // MAIN FUNCTION
// // =======================
// export const placeUpstoxOrder = async (user, reqInput,req) => {
//   let tempOrder = null;
//   let existingBuy = null;

//    console.log('===============upstox incoming data==============',reqInput);
   

//   try {
//     const product = getProduct(reqInput.productType);
//     const instrumentToken = `${reqInput.exch_seg}|${reqInput.token}`;

//     // ====================================================
//     // 1️⃣ READ EXISTING BUY (MERGE CASE)
//     // ====================================================
//     if (reqInput.transactiontype === "BUY") {
//       existingBuy = await Order.findOne({
//         where: {
//           userId: user.id,
//           tradingsymbol: reqInput.symbol,
//           ordertype: reqInput.orderType,
//           producttype: product,
//           transactiontype: "BUY",
//           orderstatuslocaldb: "OPEN",
//           broker: "upstox",
//         },
//       });
//     }

//     // ====================================================
//     // 2️⃣ CREATE TEMP ORDER
//     // ====================================================
//     tempOrder = await Order.create({
//       variety: reqInput.variety || "NORMAL",
//       tradingsymbol: reqInput.symbol,
//       instrumenttype: reqInput.instrumenttype,
//       symboltoken: reqInput.token,
//       transactiontype: reqInput.transactiontype,
//       exchange: reqInput.exch_seg,
//       ordertype: reqInput.orderType,
//       quantity: String(reqInput.quantity),
//       producttype: product,
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
//     });

//     // ====================================================
//     // 3️⃣ PLACE UPSTOX ORDER
//     // ====================================================
//     const placeRes = await axios.post(
//       `${UPSTOX_BASE}/order/place`,
//       {
//         instrument_token: instrumentToken,
//         quantity: Number(reqInput.quantity),
//         order_type: reqInput.orderType,
//         transaction_type: reqInput.transactiontype,
//         product,
//         price: reqInput.price || 0,
//         validity: "DAY",
//         slice: false,
//       },
//       { headers: upstoxHeaders(user.accessToken) }
//     );

//     const orderId =
//       placeRes?.data?.data?.order_ids?.[0] ||
//       placeRes?.data?.data?.order_id;

//     const orderIds = placeRes?.data?.data?.order_ids||placeRes?.data?.data?.order_id;

//     if (!orderId) throw new Error("Upstox order_id missing");

//     await tempOrder.update({ orderid: orderId });

//     // ====================================================
//     // 4️⃣ DETAILS POLLING
//     // ====================================================
//     const details = await pollUpstoxDetails(user.accessToken, orderId);

//     if (!details || ["rejected", "cancelled"].includes(details.status)) {
//       await tempOrder.update({
//         orderstatuslocaldb: details?.status?.toUpperCase() || "FAILED",
//         status: "FAILED",
//       });
//       return { result: "BROKER_REJECTED" };
//     }

//     // ====================================================
//     // 5️⃣ FETCH TRADES
//     // ====================================================
//       let trades = [];
//       for (const oid of orderIds) {
//       const t = await fetchUpstoxTrades(user.accessToken, oid);
//       trades.push(...t);
//     }


//     if (!trades.length) {
//       await tempOrder.update({ orderstatuslocaldb: "OPEN" });
//       return { result: "PENDING" };
//     }

//     // ====================================================
//     // 6️⃣ AVG PRICE CALCULATION
//     // ====================================================
//     let totalQty = 0;
//     let totalValue = 0;

//     trades.forEach(t => {
//       totalQty += Number(t.quantity);
//       totalValue += Number(t.quantity) * Number(t.average_price);
//     });

//     const avgPrice = totalValue / totalQty;
//     const fill = trades[0];

//     // ====================================================
//     // 7️⃣ SELL PAIRING
//     // ====================================================
//     let finalStatus = "OPEN";
//     let buyOrder = null;
//     let positionStatus = "OPEN"

//     if (reqInput.transactiontype === "SELL") {
//       buyOrder = await Order.findOne({
//         where: { orderid: reqInput.buyOrderId },
//       });

//       if (buyOrder) {
//         await buyOrder.update({ 
//            positionStatus: "COMPLETE",
//           orderstatuslocaldb: "COMPLETE"
//          });
//       }
//       finalStatus = "COMPLETE";
//       positionStatus = "COMPLETE";
//     }

//     // ====================================================
//     // 8️⃣ FINAL UPDATE TEMP ORDER
//     // ====================================================
//     await tempOrder.update({
//       tradedValue: totalValue,
//       fillsize: totalQty,
//       fillprice: avgPrice,
//       price: avgPrice,
//       fillid: fill.trade_id,
//       filltime: fill.exchange_timestamp,
//       pnl:
//         reqInput.transactiontype === "SELL"
//           ? totalValue - Number(buyOrder?.tradedValue || 0)
//           : 0,
//       status: "COMPLETE",
//       orderstatuslocaldb: finalStatus,
//       positionStatus:positionStatus
//     });

//     // ====================================================
//     // 🔥 9️⃣ BUY MERGE (DELETE TEMP)
//     // ====================================================
//     if (reqInput.transactiontype === "BUY" && existingBuy) {
//       const mergedQty = existingBuy.fillsize + totalQty;
//       const mergedValue = existingBuy.tradedValue + totalValue;
//       const mergedAvg = mergedValue / mergedQty;

//       await existingBuy.update({
//         fillsize: mergedQty,
//         quantity: mergedQty,
//         tradedValue: mergedValue,
//         price: mergedAvg,
//         fillprice: mergedAvg,
//       });

//       await tempOrder.destroy();

//       return {
//         result: "SUCCESS",
//         broker: "Upstox",
//         orderid: existingBuy.id,
//       };
//     }

//     // ====================================================
//     // 10️⃣ NORMAL SUCCESS
//     // ====================================================
//     return {
//       result: "SUCCESS",
//       broker: "Upstox",
//       orderid: tempOrder.id,
//     };

//   } catch (err) {
//     if (tempOrder) {
//       await tempOrder.update({
//         orderstatuslocaldb: "FAILED",
//         status: "FAILED",
//         text: err.message,
//       });
//     }
//     return { result: "ERROR", message: err.message };
//   }
// };
