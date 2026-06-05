import axios from "axios";
import Order from "../models/orderModel.js";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(customParseFormat);
dayjs.extend(utc);


export const toISOStringUTC = (dateStr) => {
  return dayjs(dateStr, "DD-MM-YYYY HH:mm:ss").utc().toISOString();
};

const SHOONYA_BASE_URL = process.env.SHOONYA_BASE_URL;


// 🔁 Map your generic product type → Shoonya PRD code
function getShoonyaProductCode(type) {
  if (!type) return "I"; // default to intraday

  switch (type.toUpperCase()) {
    case "DELIVERY":
    case "CNC":
      return "C";      // CNC
    case "CARRYFORWARD":
    case "NRML":
      return "M";      // NRML
    case "INTRADAY":
    case "MIS":
      return "I";      // MIS
    case "BO":
      return "B";      // Bracket
    case "CO":
      return "H";      // Cover Order
    default:
      return "I";
  }
}

// 🔁 Map your orderType → Shoonya prctyp
function mapOrderTypeToShoonya(orderType) {
  if (!orderType) return "MKT";

  switch (orderType.toUpperCase()) {
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


const maskToken = (t) => (t ? `${String(t).slice(0, 6)}****${String(t).slice(-6)}` : null);



// ==============update logger code ==============================
export const placeFinavasiaOrder = async (user, reqInput, req) => {
  try {
    logSuccess(req, { msg: "Finvasia order flow started", userId: user?.id, reqInput });

    // ----------------------------------------
    // 1) Resolve mappings + validate session
    // ----------------------------------------
    const transactionType = (reqInput.transactiontype || "").toUpperCase(); // BUY / SELL
    const uid = user?.kite_client_id;
    const susertoken = user?.authToken;

    logSuccess(req, {
      msg: "Resolved user + transaction",
      transactionType,
      uid,
      susertoken: maskToken(susertoken),
    });

    if (!uid || !susertoken) {
      logSuccess(req, { msg: "Missing uid/token - login required", uid, token: !!susertoken });
      return {
        userId: user?.id,
        broker: "Finvasia",
        result: "ERROR",
        message: "Shoonya uid or token missing. Please login Shoonya first.",
      };
    }

    // ----------------------------------------
    // 2) CREATE LOCAL PENDING ORDER
    // ----------------------------------------
    const orderData = {
      symboltoken: reqInput.kiteToken || reqInput.token,
      variety: reqInput.variety || "NORMAL",
      tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
      instrumenttype: reqInput.instrumenttype,
      transactiontype: transactionType,
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: reqInput.quantity,
      producttype: reqInput.productType,
      price: reqInput.price,
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice,
      actualQuantity: reqInput.actualQuantity,
      userId: user.id,
      broker: "finvasia",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      userNameId: user.username,
    };

    logSuccess(req, { msg: "Prepared local pending order", orderData });

    const newOrder = await Order.create(orderData);
    logSuccess(req, { msg: "Local DB saved (PENDING)", localOrderId: newOrder.id });

    // ----------------------------------------
    // 3) BUILD SHOONYA PAYLOAD
    // ----------------------------------------
    const jData = {
      uid: String(uid),
      actid: String(uid),
      exch: String(reqInput.exch_seg),
      tsym: String(reqInput.symbol),
      qty: String(reqInput.quantity),
      prc: String(reqInput.orderType === "MARKET" ? 0 : reqInput.price),
      prd: getShoonyaProductCode(reqInput.productType),
      trantype: mapTransactionType(reqInput.transactiontype), // B / S
      prctyp: mapOrderTypeToShoonya(reqInput.orderType),      // MKT / LMT / SL-LMT / SL-MKT
      ret: "DAY",
    };

    logSuccess(req, { msg: "Prepared Shoonya jData", jData });

    // exact curl format
    const body = `jData=${JSON.stringify(jData)}&jKey=${susertoken}`;

    logSuccess(req, { msg: "Prepared Shoonya PlaceOrder body", bodyPreview: body.slice(0, 200) + "..." });

    // ----------------------------------------
    // 4) PLACE ORDER IN SHOONYA
    // ----------------------------------------
    let placeRes;
    try {
      const resp = await axios.post(`${SHOONYA_BASE_URL}/PlaceOrder`, body, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      placeRes = resp.data;

      logSuccess(req, { msg: "Shoonya PlaceOrder response", placeRes });

      // If rejected
      if (!placeRes || placeRes.stat !== "Ok") {
        const msg = placeRes?.emsg || "Shoonya order placement failed";

        await newOrder.update({
          orderstatuslocaldb: "FAILED",
          status: "FAILED",
          text: msg,
          buyTime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
        });

        logSuccess(req, { msg: "Local DB updated FAILED", localOrderId: newOrder.id, reason: msg });

        return {
          userId: user.id,
          broker: "Finvasia",
          result: "BROKER_REJECTED",
          message: msg,
          raw: placeRes,
        };
      }
    } catch (err) {
      logError(req, err, { msg: "Shoonya PlaceOrder API error", raw: err?.response?.data });

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: err?.message || "Shoonya PlaceOrder error",
        buyTime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
      });

      logSuccess(req, { msg: "Local DB updated FAILED (exception)", localOrderId: newOrder.id });

      return {
        userId: user.id,
        broker: "Finvasia",
        result: "BROKER_ERROR",
        message: err?.message || "Shoonya PlaceOrder error",
      };
    }

    // Shoonya order number
    const orderid = placeRes.norenordno;
    await newOrder.update({ orderid });

    logSuccess(req, { msg: "Saved Shoonya norenordno into local DB", orderid, localOrderId: newOrder.id });

    // ----------------------------------------
    // 5) FETCH ORDER DETAILS FROM SHOONYA (OrderBook)
    // ----------------------------------------
    let orderDetails = null;
    try {
      const obBody = `jKey=${susertoken}&jData=${JSON.stringify({ uid, actid: uid })}`;

      logSuccess(req, { msg: "OrderBook request prepared", obBodyPreview: obBody.slice(0, 150) + "..." });

      const obResp = await axios.post(`${SHOONYA_BASE_URL}/OrderBook`, obBody, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const obData = obResp.data;

      logSuccess(req, { msg: "OrderBook response", isArray: Array.isArray(obData), size: obData?.length });

      if (Array.isArray(obData)) {
        orderDetails = obData.find((o) => String(o.norenordno) === String(orderid));
      }

      logSuccess(req, { msg: "OrderBook matched orderDetails", orderDetails });
    } catch (e) {
      logError(req, e, { msg: "OrderBook fetch error (non-fatal)", raw: e?.response?.data });
    }

    // ----------------------------------------
    // 6) BUY / SELL LOGIC (your code currently not pairing)
    // ----------------------------------------
    let finalStatus = "OPEN";
    let buyOrder = null;

    // (Optional) You can add SELL pairing logic same as Kite here later
    logSuccess(req, { msg: "FinalStatus set", finalStatus });

    // ----------------------------------------
    // 7) UPDATE LOCAL ORDER WITH BASIC DETAILS (safe)
    // ----------------------------------------
    const avgPrice = Number(orderDetails?.avgprc) || 0;
    const filledQty = Number(orderDetails?.qty) || Number(reqInput.quantity) || 0;

    await newOrder.update({
      uniqueorderid: orderDetails?.exchordid || null,
      averageprice: avgPrice,
      lotsize: filledQty,
      symboltoken: reqInput.kiteToken || reqInput.token,
      price: avgPrice,
      orderstatuslocaldb: finalStatus,
      status: orderDetails?.status ? String(orderDetails.status).toUpperCase() : null,
    });

    logSuccess(req, {
      msg: "Local DB updated with OrderBook snapshot",
      avgPrice,
      filledQty,
      orderDetailsStatus: orderDetails?.status,
    });

    // ----------------------------------------
    // 8) FETCH TRADEBOOK FOR MORE DETAILS
    // ----------------------------------------
    try {
      const tbBody = `jKey=${susertoken}&jData=${JSON.stringify({ uid, actid: uid })}`;

      logSuccess(req, { msg: "TradeBook request prepared", tbBodyPreview: tbBody.slice(0, 150) + "..." });

      const tbResp = await axios.post(`${SHOONYA_BASE_URL}/TradeBook`, tbBody, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const tradeBook = tbResp.data;

      logSuccess(req, { msg: "TradeBook response", isArray: Array.isArray(tradeBook), size: tradeBook?.length });

      let t = null;
      if (Array.isArray(tradeBook)) {
        t = tradeBook.find((tr) => String(tr.norenordno) === String(orderid));
      }

      logSuccess(req, { msg: "Matched trade entry", trade: t });

      if (t) {
        const tradePrice = Number(t.flprc) || avgPrice;
        const tradeQty = Number(t.trdq) || Number(t.qty) || Number(reqInput.quantity) || 0;

        const buyPrice = buyOrder?.fillprice || 0;
        const buySize = buyOrder?.fillsize || 0;
        const buyValue = buyOrder?.tradedValue || 0;
        let buyTime = buyOrder?.filltime || "NA";

        let pnl = tradeQty * tradePrice - buyPrice * buySize;
        if (transactionType === "BUY") {
          pnl = 0;
          buyTime = "NA";
        }

        // ✅ IMPORTANT: toISOStringUTC should return string already
        const iso = await toISOStringUTC(t.fltm);

        const updateObj2 = await newOrder.update({
          tradedValue: tradePrice * tradeQty,
          fillprice: tradePrice,
          fillsize: tradeQty,
          fillid: t.flid,
          price: tradePrice,
          filltime: iso,
          status: "COMPLETE",
          pnl,
          buyTime,
          buyprice: buyPrice,
          buysize: buySize,
          buyvalue: buyValue,
        });

        logSuccess(req, {
          msg: "Local DB updated with TradeBook trade fill",
          orderid,
          tradePrice,
          tradeQty,
          pnl,
          filltime: iso,
          updateObj2,
        });
      } else {
        logSuccess(req, { msg: "No trade found yet for this order in TradeBook", orderid });
      }
    } catch (e) {
      logError(req, e, { msg: "TradeBook fetch error (non-fatal)", raw: e?.response?.data });
    }

    // ----------------------------------------
    // 9) RETURN
    // ----------------------------------------
    logSuccess(req, { msg: "Finvasia order flow finished", orderid });

    return {
      userId: user.id,
      broker: "Finvasia",
      result: "SUCCESS",
      orderid,
    };
  } catch (err) {
    logError(req, err, { msg: "Finvasia Order Error (catch)" });

    return {
      userId: user.id,
      broker: "Finvasia",
      result: "ERROR",
      message: err.message,
    };
  }
};


// ==============update logger code ==============================
export const placeFinavasiaOrderLocalDb = async (user, reqInput, startOfDay, endOfDay, req) => {
  try {
    logSuccess(req, { msg: "Finvasia LocalDb order flow started", reqInput, userId: user?.id });

    // ----------------------------------------
    // 1) Resolve Shoonya credentials
    // ----------------------------------------
    const uid = user?.kite_client_id;
    const susertoken = user?.authToken;

    logSuccess(req, {
      msg: "Resolved Finvasia credentials",
      uid,
      susertoken: maskToken(susertoken),
    });

    if (!uid || !susertoken) {
      logSuccess(req, { msg: "Missing uid or session token", uid, tokenPresent: !!susertoken });
      return {
        userId: user?.id,
        broker: "finvasia",
        result: "ERROR",
        message: "Shoonya uid or token missing. Please login Finvasia first.",
      };
    }

    // ----------------------------------------
    // 2) CREATE LOCAL PENDING ORDER
    // ----------------------------------------
    const orderData = {
      symboltoken: reqInput.kiteToken || reqInput.token,
      variety: reqInput.variety || "NORMAL",
      tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
      instrumenttype: reqInput.instrumenttype,
      transactiontype: reqInput.transactiontype,
      exchange: reqInput.exch_seg,
      ordertype: reqInput.orderType,
      quantity: reqInput.quantity,
      producttype: reqInput.productType,
      price: reqInput.price,
      orderstatuslocaldb: "PENDING",
      totalPrice: reqInput.totalPrice,
      actualQuantity: reqInput.actualQuantity,
      userId: user.id,
      broker: "finvasia",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      userNameId: user.username,
      buyOrderId: reqInput?.buyOrderId,
    };

    logSuccess(req, { msg: "Prepared local pending orderData", orderData });

    const newOrder = await Order.create(orderData);
    logSuccess(req, { msg: "Local DB saved (PENDING)", localOrderId: newOrder.id });

    // ----------------------------------------
    // 3) SHOONYA PLACE ORDER PAYLOAD
    // ----------------------------------------
    const trantype = (reqInput.transactiontype || "").toUpperCase();

    const qtyNum = Number(reqInput.quantity);

    const jData = {
      uid: String(uid),
      actid: String(uid),
      exch: String(reqInput.exch_seg),
      tsym: String(reqInput.symbol),
      qty: String(reqInput.quantity),
      prc: String(reqInput.orderType === "MARKET" ? 0 : reqInput.price),
      prd: getShoonyaProductCode(reqInput.productType),
      trantype: mapTransactionType(reqInput.transactiontype), // B / S
      prctyp: mapOrderTypeToShoonya(reqInput.orderType),
      ret: "DAY",
    };

    logSuccess(req, { msg: "Prepared Shoonya jData", jData });

    // Exact curl format
    const body = `jData=${JSON.stringify(jData)}&jKey=${susertoken}`;

    logSuccess(req, {
      msg: "Prepared Shoonya PlaceOrder body",
      bodyPreview: body.slice(0, 200) + "...",
      jKeyMasked: maskToken(susertoken),
    });

    // ----------------------------------------
    // 4) PLACE ORDER IN SHOONYA
    // ----------------------------------------
    let placeRes;
    try {
      const resp = await axios.post(`${SHOONYA_BASE_URL}/PlaceOrder`, body, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      placeRes = resp.data;

      logSuccess(req, { msg: "Shoonya PlaceOrder response", placeRes });

      if (!placeRes || placeRes.stat !== "Ok") {
        const msg = placeRes?.emsg || "Shoonya order placement failed";

        await newOrder.update({
          orderstatuslocaldb: "FAILED",
          status: "FAILED",
          text: msg,
          buyTime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
        });

        logSuccess(req, { msg: "Local DB updated FAILED (broker rejected)", localOrderId: newOrder.id, reason: msg });

        return {
          userId: user.id,
          broker: "finvasia",
          result: "BROKER_REJECTED",
          message: msg,
          raw: placeRes,
        };
      }
    } catch (err) {
      logError(req, err, { msg: "Shoonya PlaceOrder error", raw: err?.response?.data });

      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        text: err?.message || "Shoonya PlaceOrder error",
        buyTime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
      });

      logSuccess(req, { msg: "Local DB updated FAILED (exception)", localOrderId: newOrder.id });

      return {
        userId: user.id,
        broker: "finvasia",
        result: "BROKER_ERROR",
        message: err?.message || "Shoonya PlaceOrder error",
      };
    }

    const orderid = placeRes.norenordno;
    await newOrder.update({ orderid });

    logSuccess(req, { msg: "Saved Shoonya norenordno into local DB", orderid, localOrderId: newOrder.id });

    // ----------------------------------------
    // 5) FETCH ORDER DETAILS (ORDERBOOK)
    // ----------------------------------------
    let detailsData = {};
    try {
      const obBody = `jKey=${susertoken}&jData=${JSON.stringify({ uid, actid: uid })}`;

      logSuccess(req, { msg: "OrderBook request", obBodyPreview: obBody.slice(0, 150) + "..." });

      const obResp = await axios.post(`${SHOONYA_BASE_URL}/OrderBook`, obBody, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const obData = obResp.data;

      logSuccess(req, { msg: "OrderBook response", isArray: Array.isArray(obData), size: obData?.length });

      if (Array.isArray(obData)) {
        detailsData =
          obData.find((o) => String(o.norenordno) === String(orderid)) || {};
      }

      logSuccess(req, { msg: "OrderBook matched detailsData", detailsData });
    } catch (e) {
      logError(req, e, { msg: "OrderBook error (non-fatal)", raw: e?.response?.data });
    }

    // ----------------------------------------
    // 6) HANDLE BUY / SELL LOGIC
    // ----------------------------------------
    let finalStatus = "OPEN";
    let buyOrder = null;

    if (trantype === "SELL") {
      logSuccess(req, { msg: "SELL flow started", buyOrderId: reqInput?.buyOrderId });

      if (reqInput?.buyOrderId) {
        buyOrder = await Order.findOne({
          where: {
            userId: user.id,
            status: "COMPLETE",
            orderstatuslocaldb: "OPEN",
            orderid: String(reqInput.buyOrderId),
          },
          raw: true,
        });

        logSuccess(req, { msg: "Matched BUY order for SELL", buyOrder });

        if (buyOrder) {
          await Order.update(
            { orderstatuslocaldb: "COMPLETE" },
            { where: { orderid: reqInput.buyOrderId } }
          );

          logSuccess(req, { msg: "Closed BUY order in local DB", buyOrderId: reqInput.buyOrderId });
        }
      }

      finalStatus = "COMPLETE";
    }

    // ----------------------------------------
    // 7) BASIC LOCAL ORDER UPDATE
    // ----------------------------------------
    const avgPrice = Number(detailsData?.avgprc) || 0;
    const filledQty = Number(detailsData?.qty) || qtyNum;

    await newOrder.update({
      uniqueorderid: detailsData?.exchordid || null,
      averageprice: avgPrice,
      lotsize: filledQty,
      symboltoken: reqInput.kiteToken || reqInput.token,
      triggerprice: Number(detailsData?.trgprc) || 0,
      price: avgPrice,
      orderstatuslocaldb: finalStatus,
      status: detailsData?.status || finalStatus,
    });

    logSuccess(req, {
      msg: "Local DB updated with OrderBook snapshot",
      avgPrice,
      filledQty,
      finalStatus,
      brokerStatus: detailsData?.status,
    });

    // ----------------------------------------
    // 8) FETCH TRADEBOOK FOR PnL / filltime
    // ----------------------------------------
    try {
      const tbBody = `jKey=${susertoken}&jData=${JSON.stringify({ uid, actid: uid })}`;

      logSuccess(req, { msg: "TradeBook request", tbBodyPreview: tbBody.slice(0, 150) + "..." });

      const tbResp = await axios.post(`${SHOONYA_BASE_URL}/TradeBook`, tbBody, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const tradeBook = tbResp.data;

      logSuccess(req, { msg: "TradeBook response", isArray: Array.isArray(tradeBook), size: tradeBook?.length });

      let t = null;
      if (Array.isArray(tradeBook)) {
        t = tradeBook.find((tr) => String(tr.norenordno) === String(orderid));
      }

      logSuccess(req, { msg: "Matched trade row for this order", trade: t });

      if (t) {
        const tradePrice = Number(t.flprc) || 0;
        const tradeQty = Number(t.qty) || Number(t.trdq) || qtyNum;

        const buyPrice = buyOrder?.fillprice || 0;
        const buySize = buyOrder?.fillsize || 0;
        const buyValue = buyOrder?.tradedValue || 0;
        let buyTime = buyOrder?.filltime || "NA";

        let pnl = tradeQty * tradePrice - buyPrice * buySize;
        if (trantype === "BUY") {
          pnl = 0;
          buyTime = "NA";
        }

        const iso = await toISOStringUTC(t.fltm);

        await newOrder.update({
          tradedValue: tradePrice * tradeQty,
          fillprice: tradePrice,
          fillsize: tradeQty,
          fillid: t.flid || t.tradeid || null,
          filltime: iso,
          status: "COMPLETE",
          pnl,
          buyTime,
          buyprice: buyPrice,
          buysize: buySize,
          buyvalue: buyValue,
        });

        logSuccess(req, {
          msg: "Local DB updated with TradeBook fill",
          orderid,
          tradePrice,
          tradeQty,
          pnl,
          filltime: iso,
        });
      } else {
        logSuccess(req, { msg: "Trade not found yet in TradeBook (not fatal)", orderid });
      }
    } catch (e) {
      logError(req, e, { msg: "TradeBook error (non-fatal)", raw: e?.response?.data });
    }

    logSuccess(req, { msg: "Finvasia LocalDb order flow finished", orderid, localOrderId: newOrder.id });

    return {
      userId: user.id,
      broker: "finvasia",
      result: "SUCCESS",
      orderid,
    };
  } catch (err) {
    logError(req, err, { msg: "Finvasia LocalDb order error (catch)" });

    return {
      userId: user?.id,
      broker: "finvasia",
      result: "ERROR",
      message: err.message,
    };
  }
};




// export const placeFinavasiaOrder = async (user, reqInput, startOfDay, endOfDay) => {
//   try {
    
//     // ----------------------------------------
//     // 1) Resolve Shoonya-specific mappings
//     // ----------------------------------------
//     const transactionType = (reqInput.transactiontype || "").toUpperCase(); // BUY / SELL

//     // Shoonya identifiers
//     const uid = user?.kite_client_id;       // 🔹 You are using this for Shoonya login
//     const susertoken = user.authToken;  // 🔹 Make sure you save this after login

//     if (!uid || !susertoken) {
//       return {
//         userId: user.id,
//         broker: "Finvasia",
//         result: "ERROR",
//         message: "Shoonya uid or token missing. Please login Shoonya first.",
//       };
//     }

//     // ----------------------------------------
//     // 2) CREATE LOCAL PENDING ORDER
//     // ----------------------------------------
//     const orderData = {
//       symboltoken: reqInput.kiteToken || reqInput.token,
//       variety: reqInput.variety || "NORMAL", // just for local reference
//       tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
//       instrumenttype: reqInput.instrumenttype,
//       transactiontype: transactionType,
//       exchange: reqInput.exch_seg,           // e.g. NFO / NSE / BSE
//       ordertype: reqInput.orderType,
//       quantity: reqInput.quantity,
//       producttype: reqInput.productType,     // store original product type (INTRADAY / DELIVERY etc)
//       price: reqInput.price,
//       orderstatuslocaldb: "PENDING",
//       totalPrice: reqInput.totalPrice,
//       actualQuantity: reqInput.actualQuantity,
//       userId: user.id,
//       broker: "finvasia",
//       angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
//       angelOneToken: reqInput.angelOneToken || reqInput.token,
//       userNameId: user.username,
//     };

//     const newOrder = await Order.create(orderData);


//     console.log('local db save');
    
//     const jData = {
//           uid: String(uid),
//           actid: String(uid),
//           exch: String(reqInput.exch_seg),                 // BFO / NSE / NFO
//           tsym: String(reqInput.symbol),                   // EXACT Shoonya symbol
//           qty: String(reqInput.quantity),                  // MUST be string
//           prc: String(reqInput.orderType === "MARKET" ? 0 : reqInput.price),
//           prd: getShoonyaProductCode(reqInput.productType),
//           trantype: mapTransactionType(reqInput.transactiontype), // ✅ B / S
//           prctyp: mapOrderTypeToShoonya(reqInput.orderType),
//           ret: "DAY",
//         };


//  // ❗ EXACT FORM DATA (like curl)
//     const body =
//       `jData=${JSON.stringify(jData)}` +
//       `&jKey=${susertoken}`;

//     // ----------------------------------------
//     // 4) PLACE ORDER IN SHOONYA
//     // ----------------------------------------
//     let placeRes;


//     console.log(body,'finavasia body');
    

//     try {
//       const resp = await axios.post(
//         `${SHOONYA_BASE_URL}/PlaceOrder`,
//         body,
//         {
//           headers: {
//             "Content-Type": "application/x-www-form-urlencoded",
//           },
//         }
//       );

//       placeRes = resp.data;

//       console.log("Shoonya place order response:", placeRes);

//       if (!placeRes || placeRes.stat !== "Ok") {

//         const msg = placeRes?.emsg || "Shoonya order placement failed";

//         await newOrder.update({
//           orderstatuslocaldb: "FAILED",
//           status: "FAILED",
//           text: msg,
//           buyTime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
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
//       console.error("Shoonya place order error:", err?.response?.data || err);

//       await newOrder.update({
//         orderstatuslocaldb: "FAILED",
//         status: "FAILED",
//         text: err.message,
//         buyTime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
//       });

//       return {
//         userId: user.id,
//         broker: "Finvasia",
//         result: "BROKER_ERROR",
//         message: err.message,
//       };
//     }

//     // Shoonya order number
//     const orderid = placeRes.norenordno;

//     await newOrder.update({ orderid });

//     // ----------------------------------------
//     // 5) FETCH ORDER DETAILS FROM SHOONYA (OrderBook)
//     // ----------------------------------------
//     let orderDetails = null;

//     try {
//       const obBody = `jKey=${susertoken}&jData=${JSON.stringify({
//         uid,
//         actid: uid,
//       })}`;

//       const obResp = await axios.post(
//         `${SHOONYA_BASE_URL}/OrderBook`,
//         obBody,
//         {
//           headers: { "Content-Type": "application/x-www-form-urlencoded" },
//         }
//       );

//       const obData = obResp.data;

//       // Typically obData is array. Filter by norenordno (Shoonya orderid)
//       if (Array.isArray(obData)) {
//         orderDetails = obData.find(
//           (o) => String(o.norenordno) === String(orderid)
//         );
//       }

//       console.log("Shoonya orderDetails:", orderDetails);
//     } catch (e) {
//       console.error("Shoonya OrderBook fetch error:", e?.response?.data || e);
//       // optional, not fatal
//     }

//     // ----------------------------------------
//     // 6) HANDLE BUY / SELL LOGIC (PAIR WITH PREVIOUS BUY)
//     // ----------------------------------------
//     let finalStatus = "OPEN";
//     let buyOrder;

  
//     // ----------------------------------------
//     // 7) UPDATE LOCAL ORDER WITH BASIC DETAILS
//     // ----------------------------------------
//     const avgPrice =
//       Number(orderDetails?.avgprc) ||
//       0;

//     const filledQty =
//       Number(orderDetails?.qty) || Number(reqInput.quantity) || 0;

//     await newOrder.update({
//       uniqueorderid: orderDetails?.exchordid || null,
//       averageprice: avgPrice,
//       lotsize: filledQty,
//       symboltoken: reqInput.kiteToken || reqInput.token,
//       price: avgPrice,
//       orderstatuslocaldb: finalStatus,
//       status: orderDetails?.status.toUpperCase(),
//     });

//     // ----------------------------------------
//     // 8) FETCH TRADEBOOK FOR MORE DETAILS (PnL etc.)
//     // ----------------------------------------
//     try {
//       const tbBody = `jKey=${susertoken}&jData=${JSON.stringify({
//         uid,
//         actid: uid,
//       })}`;

//       const tbResp = await axios.post(
//         `${SHOONYA_BASE_URL}/TradeBook`,
//         tbBody,
//         {
//           headers: { "Content-Type": "application/x-www-form-urlencoded" },
//         }
//       );

//       const tradeBook = tbResp.data;
//       console.log("Shoonya TradeBook:", tradeBook);

//       let t = null;
//       if (Array.isArray(tradeBook)) {
//         t = tradeBook.find(
//           (tr) => String(tr.norenordno) === String(orderid)
//         );
//       }

//       if (t) {
//         // Shoonya trade fields (typical names, adjust if different)
//         const tradePrice =
//           Number(t.flprc) ||
//           avgPrice;
//         const tradeQty =
//           Number(t.trdq) || Number(t.qty) || Number(reqInput.quantity) || 0;

//         const buyPrice = buyOrder?.fillprice || 0;
//         const buySize = buyOrder?.fillsize || 0;
//         const buyValue = buyOrder?.tradedValue || 0;
//         let buyTime = buyOrder?.filltime || "NA";

//         // Calculate PnL
//         let pnl = tradeQty * tradePrice - buyPrice * buySize;

//         if (transactionType === "BUY") {
//           pnl = 0;
//           buyTime = "NA";
//         }

//         const iso = await toISOStringUTC(t.fltm);

//         const updateObj2 = await newOrder.update({
//           tradedValue: tradePrice * tradeQty,
//           fillprice: tradePrice,
//           fillsize: tradeQty,
//           fillid: t.flid ,
//           price: tradePrice,
//           filltime: iso,
//           status: "COMPLETE",
//           pnl,
//           buyTime,
//           buyprice: buyPrice,
//           buysize: buySize,
//           buyvalue: buyValue,
//         });

//         console.log("Shoonya local DB trade update:", updateObj2);
//       } else {
//         console.log("No specific trade entry found for Shoonya order", orderid);
//       }
//     } catch (e) {
//       console.error("Shoonya TradeBook fetch error:", e?.response?.data || e);
//     }

//     // ----------------------------------------
//     // 9) RETURN RESULT
//     // ----------------------------------------
//     return {
//       userId: user.id,
//       broker: "Finvasia",
//       result: "SUCCESS",
//       orderid,
//     };
//   } catch (err) {
//     console.error("Finvasia Order Error:", err);
//     return {
//       userId: user.id,
//       broker: "Finvasia",
//       result: "ERROR",
//       message: err.message,
//     };
//   }
// };


// export const placeFinavasiaOrderLocalDb = async (user, reqInput, startOfDay, endOfDay) => {
//   try {
//     // ----------------------------------------
//     // 1) Resolve Shoonya credentials
//     // ----------------------------------------
//     const uid = user.kite_client_id;          // you are using this for Shoonya login
//     const susertoken = user.authToken;    // 🔴 change according to your column name

//     if (!uid || !susertoken) {
//       return {
//         userId: user.id,
//         broker: "finvasia",
//         result: "ERROR",
//         message: "Shoonya uid or token missing. Please login Finvasia first.",
//       };
//     }

//     // ----------------------------------------
//     // 2) CREATE LOCAL PENDING ORDER
//     // ----------------------------------------
//     const orderData = {
//       symboltoken: reqInput.kiteToken || reqInput.token,
//       variety: reqInput.variety || "NORMAL", // for your info only
//       tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
//       instrumenttype: reqInput.instrumenttype,
//       transactiontype: reqInput.transactiontype,       // BUY / SELL
//       exchange: reqInput.exch_seg,
//       ordertype: reqInput.orderType,
//       quantity: reqInput.quantity,
//       producttype: reqInput.productType,
//       price: reqInput.price,
//       orderstatuslocaldb: "PENDING",
//       totalPrice: reqInput.totalPrice,
//       actualQuantity: reqInput.actualQuantity,
//       userId: user.id,
//       broker: "finvasia",
//       angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
//       angelOneToken: reqInput.angelOneToken || reqInput.token,
//       userNameId: user.username,
//       buyOrderId: reqInput?.buyOrderId,
//     };

//     console.log(orderData, "Finvasia orderData");

//     const newOrder = await Order.create(orderData);

//     // ----------------------------------------
//     // 3) SHOONYA PLACE ORDER PAYLOAD
//     // ----------------------------------------
//     const trantype = (reqInput.transactiontype || "").toUpperCase(); // BUY / SELL

//     // ⚠️ sometimes tsym must be URL encoded, uncomment if needed:
//     // const tsym = encodeURIComponent(reqInput.symbol);

//     const qty = Number(reqInput.quantity);

//     const jData = {
//           uid: String(uid),
//           actid: String(uid),
//           exch: String(reqInput.exch_seg),                 // BFO / NSE / NFO
//           tsym: String(reqInput.symbol),                   // EXACT Shoonya symbol
//           qty: String(reqInput.quantity),                  // MUST be string
//           prc: String(reqInput.orderType === "MARKET" ? 0 : reqInput.price),
//           prd: getShoonyaProductCode(reqInput.productType),
//           trantype: mapTransactionType(reqInput.transactiontype), // ✅ B / S
//           prctyp: mapOrderTypeToShoonya(reqInput.orderType),
//           ret: "DAY",
//         };


//  // ❗ EXACT FORM DATA (like curl)
//     const body =
//       `jData=${JSON.stringify(jData)}` +
//       `&jKey=${susertoken}`;

//     console.log("FINAL SHOONYA BODY =>", body);




//     console.log("Shoonya PlaceOrder jData:", jData);

//     // ----------------------------------------
//     // 4) PLACE ORDER IN SHOONYA
//     // ----------------------------------------
//     let placeRes;
//     try {
//       const resp = await axios.post(
//         `${SHOONYA_BASE_URL}/PlaceOrder`,
//         body,
//         {
//           headers: {
//             "Content-Type": "application/x-www-form-urlencoded",
//           },
//         }
//       );

//       placeRes = resp.data;
//       console.log("Shoonya place order response:", placeRes);

//       if (!placeRes || placeRes.stat !== "Ok") {
//         const msg = placeRes?.emsg || "Shoonya order placement failed";

//         await newOrder.update({
//           orderstatuslocaldb: "FAILED",
//           status: "FAILED",
//           text: msg,
//           buyTime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
//         });

//         return {
//           userId: user.id,
//           broker: "finvasia",
//           result: "BROKER_REJECTED",
//           message: msg,
//           raw: placeRes,
//         };
//       }
//     } catch (err) {
//       console.log(err?.response?.data || err, "Shoonya place order error");

//       await newOrder.update({
//         orderstatuslocaldb: "FAILED",
//         status: "FAILED",
//         text: err.message,
//         buyTime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
//       });

//       return {
//         userId: user.id,
//         broker: "finvasia",
//         result: "BROKER_ERROR",
//         message: err.message,
//       };
//     }

//     const orderid = placeRes.norenordno; // 🔹 Shoonya order id

//     await newOrder.update({ orderid });

//     // ----------------------------------------
//     // 5) FETCH ORDER DETAILS (ORDERBOOK)
//     // ----------------------------------------
//     let detailsData = {};
//     try {
//       const obBody = `jKey=${susertoken}&jData=${JSON.stringify({
//         uid,
//         actid: uid,
//       })}`;

//       const obResp = await axios.post(
//         `${SHOONYA_BASE_URL}/OrderBook`,
//         obBody,
//         {
//           headers: {
//             "Content-Type": "application/x-www-form-urlencoded",
//           },
//         }
//       );

//       const obData = obResp.data;
//       console.log("Shoonya OrderBook:", obData);

//       if (Array.isArray(obData)) {
//         detailsData = obData.find(
//           (o) => String(o.norenordno) === String(orderid)
//         ) || {};
//       }
//     } catch (e) {
//       console.log(e?.response?.data || e, "Shoonya OrderBook error");
//     }

//     // Shoonya common fields (check actual response once and adjust)
//     const avgPrice =
//       Number(detailsData.avgprc)
//     const filledQty =
//       Number(detailsData.qty) || qty;

//     // ----------------------------------------
//     // 6) HANDLE BUY / SELL LOGIC (pair with local BUY)
//     // ----------------------------------------
//     let finalStatus = "OPEN";
//     let buyOrder;

//     if (trantype === "SELL") {
//       // match by buyOrderId (like you did for Kite)
//       if (reqInput?.buyOrderId) {
//         buyOrder = await Order.findOne({
//           where: {
//             userId: user.id,
//             status: "COMPLETE",
//             orderstatuslocaldb: "OPEN",
//             orderid: String(reqInput.buyOrderId),
//           },
//           raw: true,
//         });

//         if (buyOrder) {
//           await Order.update(
//             { orderstatuslocaldb: "COMPLETE" },
//             { where: { orderid: reqInput.buyOrderId } }
//           );
//         }
//       }

//       finalStatus = "COMPLETE";
//     }

//     // ----------------------------------------
//     // 7) BASIC LOCAL ORDER UPDATE
//     // ----------------------------------------
//     await newOrder.update({
//       uniqueorderid: detailsData.exchordid || null, // or detailsData.exch_ord_id if different
//       averageprice: avgPrice,
//       lotsize: filledQty,
//       symboltoken: reqInput.kiteToken || reqInput.token,
//       triggerprice: Number(detailsData.trgprc) || 0,
//       price: avgPrice,
//       orderstatuslocaldb: finalStatus,
//       status: detailsData.status || finalStatus,
//     });

//     // ----------------------------------------
//     // 8) FETCH TRADEBOOK FOR PnL / filltime
//     // ----------------------------------------
//     try {
//       const tbBody = `jKey=${susertoken}&jData=${JSON.stringify({
//         uid,
//         actid: uid,
//       })}`;

//       const tbResp = await axios.post(
//         `${SHOONYA_BASE_URL}/TradeBook`,
//         tbBody,
//         {
//           headers: {
//             "Content-Type": "application/x-www-form-urlencoded",
//           },
//         }
//       );

//       const tradeBook = tbResp.data;
//       console.log("Shoonya TradeBook:", tradeBook);

//       let t = null;
//       if (Array.isArray(tradeBook)) {
//         t = tradeBook.find(
//           (tr) => String(tr.norenordno) === String(orderid)
//         );
//       }

//       if (t) {
//         // ⚠️ Adjust these keys according to real Shoonya tradebook response (once you log it)
//         const tradePrice = Number(t.flprc) 
         
//         const tradeQty = Number(t.qty) 
        
//         const buyPrice = buyOrder?.fillprice || 0;
//         const buySize = buyOrder?.fillsize || 0;
//         const buyValue = buyOrder?.tradedValue || 0;
//         let buyTime = buyOrder?.filltime || "NA";

//         let pnl = tradeQty * tradePrice - buyPrice * buySize;

//         if (trantype === "BUY") {
//           pnl = 0;
//           buyTime = "NA";
//         }

     

//         const iso = await toISOStringUTC(t.fltm);


//         await newOrder.update({
//           tradedValue: tradePrice * tradeQty,
//           fillprice: tradePrice,
//           fillsize: tradeQty,
//           fillid: t.tradeid || t.uid || null,
//           filltime: iso,
//           status: "COMPLETE",
//           pnl,
//           buyTime,
//           buyprice: buyPrice,
//           buysize: buySize,
//           buyvalue: buyValue,
//         });
//       } else {
//         console.log("No tradebook row found for Shoonya order", orderid);
//       }
//     } catch (e) {
//       console.log(e?.response?.data || e, "Shoonya TradeBook error");
//     }

//     // ----------------------------------------
//     // 9) RETURN RESULT
//     // ----------------------------------------
//     return {
//       userId: user.id,
//       broker: "finvasia",
//       result: "SUCCESS",
//       orderid,
//     };
//   } catch (err) {
//     console.log(err, "Finvasia local DB order error");
//     return {
//       userId: user.id,
//       broker: "finvasia",
//       result: "ERROR",
//       message: err.message,
//     };
//   }
// };