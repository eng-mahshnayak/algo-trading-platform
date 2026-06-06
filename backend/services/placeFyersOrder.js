import axios from "axios";
import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import { logSuccess, logError } from "../utils/loggerr.js";
import { setFyersAccessToken } from "../utils/fyersClient.js";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import utc from "dayjs/plugin/utc.js";


dayjs.extend(customParseFormat);
dayjs.extend(utc);

// ====================================================
// 🌐 Helpers Inline
// ====================================================

function getFyersProductCode(type) {
  if (!type) return "INTRADAY"; // default Fyers product

  switch (type.toUpperCase()) {
    case "DELIVERY":
      return "CNC";        // Delivery (Cash & Carry)

    case "CARRYFORWARD":
      return "MARGIN";     // Carryforward F&O

    case "MARGIN":
      return "MTF";        // Margin Trading Facility

    case "INTRADAY":
      return "INTRADAY";   // Intraday

    case "BO":
      return "BO";         // Bracket Order

    default:
      return type.toUpperCase(); // fallback
  }
}

const normalizeStatus = (status = "") =>
  status.toUpperCase().replace(/\s+/g, "").trim();

const fetchFyersOrderDetailsWithRetry = async ({ orderid, attempts = 3 },req,fyers) => {
  for (let i = 0; i < attempts; i++) {
    try {
      const resp = await fyers.get_orders({});
      const found = resp?.orderBook?.find(o => o.id === orderid);
      if (found) return found;
    } catch(err) { 
       logError(req, { msg: " fetchFyersOrderDetailsWithRetry error",error:err });
    }
    await new Promise(r => setTimeout(r, 300));
  }
  return null;
};

const fetchFyersTradebookWithRetry = async ({ orderid, expectedQty, attempts = 3 },req,fyers) => {
  let lastTrades = []; // store whatever we got in each attempt

  for (let i = 0; i < attempts; i++) {
    try {
      const resp = await fyers.get_tradebook({});
      
      let trades = resp?.tradeBook?.filter(t => t.orderNumber === orderid) || [];

      // store the trades found in this attempt
      lastTrades = trades;

      if (expectedQty) {
        // check for trades matching the expected quantity
        const matchingTrades = trades.filter(t => t.tradedQty||t.quantity === expectedQty);

        if (matchingTrades.length) return matchingTrades; // exact match found
      }
    } catch (err) {

      logError(req, { msg: " fetchFyersTradebookWithRetry error",error:err });
      console.error("Error fetching trades:", err);
    }

    // wait 300ms before next retry
    await new Promise(r => setTimeout(r, 300));
  }

  // after all retries, return whatever trades we got (partial or empty)
  return lastTrades;
};




const testFunction = async function () {

     let token = 
     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiZDoxIiwiZDoyIiwieDowIiwieDoxIiwieDoyIl0sImF0X2hhc2giOiJnQUFBQUFCcHBSRHlRNDRLQnhzdjVFRDlFTU9lOEU4YjhCZWZuY1YxcXFIRXBSZktNVUNYT1Ztc3AtMnlsYXRHMjJUREVTSThDNlE4Q3ZtaWFub0V4X1pXNmdsdE5mbl8xbmU2TTFmb2FKbWFhdlZHQUJKVkdOOD0iLCJkaXNwbGF5X25hbWUiOiIiLCJvbXMiOiJLMSIsImhzbV9rZXkiOiI2ZTVlNzIyNGNlNDdjZmZlZGZjN2VkNjFjY2I4NDI2NTQ3OGMwMGEzYWQ3YjkxYzZlN2ZiYTc1MSIsImlzRGRwaUVuYWJsZWQiOiJOIiwiaXNNdGZFbmFibGVkIjoiTiIsImZ5X2lkIjoiWEIxNTMwNyIsImFwcFR5cGUiOjEwMCwiZXhwIjoxNzcyNDk3ODAwLCJpYXQiOjE3NzI0MjU0NTgsImlzcyI6ImFwaS5meWVycy5pbiIsIm5iZiI6MTc3MjQyNTQ1OCwic3ViIjoiYWNjZXNzX3Rva2VuIn0.VVPy24Njv3NAqOKlyRv8PRQ33X70p1HFmarllwC33Lo'

      let user = await User.findOne({
        where:{
          username:"06666"
        }
      })
      let fyers =   await setFyersAccessToken(user.authToken,user);

      let ordersFetch = await fetchFyersTradebookWithRetry({orderid:"26030200269804",expectedQty:200},null,fyers)

         console.log(ordersFetch,'ordersFetch');
     
}

// testFunction()



// ====================================================
// 🚀 Main Function
// ====================================================
export const placeFyersOrder = async (user, reqInput, req, isLocalDbFlow = true) => {
 
  let newOrder = null;

  const nowISOError = new Date().toISOString();

  try {
    const transactionType = (reqInput.transactiontype || "").toUpperCase();
    const fyersProductType = getFyersProductCode(reqInput.productType);

    if (!user?.authToken) {
      logError(req, { msg: "FYERS token missing", error: null });
      return { result: "ERROR", message: "FYERS token missing" };
    }

    // ------------------------------------
    // 0️⃣ Apply Token
    // ------------------------------------
    let fyers = await setFyersAccessToken(user.authToken, user);

    // ------------------------------------
    // 1️⃣ Detect Same Order (BUY only)
    // ------------------------------------
    let existingBuyOrder = null;
    if (transactionType === "BUY") {
      existingBuyOrder = await Order.findOne({
        where: {
          userId: user.id,
          ordertype: reqInput.orderType,
          producttype: fyersProductType,
          tradingsymbol: reqInput.fyersSymbol || reqInput.symbol,
          transactiontype: "BUY",
          orderstatuslocaldb: "OPEN",
          positionStatus: "OPEN",
        },
      });
    }

    // ------------------------------------
    // 2️⃣ Create Pending Order Locally
    // ------------------------------------
    const orderData = {
      variety: reqInput.variety || "NORMAL",
      tradingsymbol: reqInput.fyersSymbol || reqInput.symbol,
      transactiontype: transactionType,
      exchange: reqInput.exchange || reqInput.exch_seg || "NSE",
      ordertype: reqInput.orderType,
      quantity: reqInput.quantity,
      producttype: fyersProductType,
      price: reqInput.price,
      orderstatuslocaldb: "PENDING",
      userId: user.id,
      broker: "fyers",
      userNameId: user.username,
      strategyName: reqInput.groupName || "",
      strategyUniqueId: reqInput.strategyUniqueId || "",
      buyOrderId: reqInput.buyOrderId || null,
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
    };

    console.log('=============save fyers qaz==============');
    newOrder = await Order.create(orderData);
    console.log('=============save fyers 121==============');

    // ------------------------------------
    // 3️⃣ FYERS API Payload
    // ------------------------------------
    const fyersTypeMap = { LIMIT: 1, MARKET: 2, SL: 3, "SL-M": 4 };

    const payload = {
      symbol: reqInput.fyersSymbol || reqInput.symbol,
      qty: Number(reqInput.quantity),
      type: fyersTypeMap[reqInput.orderType] || 2,
      side: transactionType === "BUY" ? 1 : -1,
      productType: fyersProductType,
      limitPrice: reqInput.orderType === "MARKET" ? 0 : Number(reqInput.price || 0),
      stopPrice: reqInput.triggerPrice || 0,
      validity: reqInput.duration || "DAY",
      disclosedQty: 0,
      orderTag: "aitrading",
      offlineOrder: false,
    };

    // ------------------------------------
    // 4️⃣ Place Fyers Order
    // ------------------------------------
    let placeRes;
    try {
      placeRes = await fyers.place_order(payload);
      console.log(placeRes, '=============save fyers 2==============');
    } catch (err) {
      console.log(err, '=========err===========');
      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        positionStatus: "FAILED",
        status: "FAILED",
        text: err.message,
        filltime: nowISOError,
      });
      return { result: "BROKER_ERROR", message: err.message };
    }

    if (!placeRes || placeRes.s !== "ok" || !placeRes.id) {
      await newOrder.update({ 
        orderstatuslocaldb: "FAILED", 
        positionStatus: "FAILED", 
        status: "FAILED",
        filltime: nowISOError,
        text: placeRes?.message || "Order placement failed"
      });
      return { result: "BROKER_REJECTED" };
    }

    const orderid = placeRes.id;
    await newOrder.update({ orderid });

    // ------------------------------------
    // 5️⃣ OrderBook Status Check
    // ------------------------------------
    const orderDetails = await fetchFyersOrderDetailsWithRetry({ orderid }, req, fyers);
    
    if (orderDetails) {
      // Fyers status codes:
      // 1 = Cancelled
      // 2 = Traded / Filled (EXECUTED)
      // 4 = Transit (Processing)
      // 5 = Rejected
      // 6 = Pending
      
      const statusCode = orderDetails?.status;
      let statusText = '';

      // Convert status code to text
      switch(statusCode) {
        case 1:
          statusText = 'CANCELLED';
          break;
        case 2:
          statusText = 'EXECUTED';
          break;
        case 4:
          statusText = 'PROCESSING';
          break;
        case 5:
          statusText = 'REJECTED';
          break;
        case 6:
          statusText = 'PENDING';
          break;
        default:
          statusText = orderDetails?.report_type || 'UNKNOWN';
      }

      console.log('Order Status Check:', { statusCode, statusText });

      // REJECTED check (status code 5)
      if (statusCode === 5 || statusText.includes("REJECT")) {
        await newOrder.update({ 
          orderstatuslocaldb: "REJECTED", 
          positionStatus: "REJECTED",
          status: "REJECTED",  
          filltime: nowISOError,
          text: orderDetails?.message || orderDetails?.oms_msg || "Order rejected"
        });
        return { result: "BROKER_REJECTED" };
      }
      
      // CANCELLED check (status code 1)
      if (statusCode === 1 || statusText === "CANCELLED") {
        await newOrder.update({ 
          orderstatuslocaldb: "CANCELLED",
          positionStatus: "CANCELLED",
          status: "CANCELLED",  
          filltime: nowISOError,
          text: orderDetails?.message || orderDetails?.oms_msg || "Order cancelled"
        });
        return { result: "CANCELLED" };
      }
      
      // EXECUTED check (status code 2) - Skip to tradebook
      if (statusCode === 2 || statusText === "EXECUTED") {
        console.log('Order already executed, fetching tradebook...');
        // Continue to tradebook fetch
      }
      
      // PROCESSING check (status code 4)
      else if (statusCode === 4 || statusText === "PROCESSING") {
        await newOrder.update({ 
          orderstatuslocaldb: "PROCESSING",
          positionStatus: "PROCESSING",
          status: "PROCESSING",  
          filltime: nowISOError,
          text: orderDetails?.message || orderDetails?.oms_msg || "Order in transit/processing"
        });
        return { result: "PROCESSING" };
      }
      
      // PENDING/OPEN check (status code 6)
      else if (statusCode === 6 || ["OPEN", "PENDING"].includes(statusText)) {
        await newOrder.update({ 
          orderstatuslocaldb: "PENDING",
          positionStatus: "PENDING",
          status: "PENDING",  
          filltime: nowISOError,
          text: orderDetails?.message || orderDetails?.oms_msg || "Order pending"
        });
        return { result: "PENDING" };
      }
    }

    // ------------------------------------
    // 6️⃣ Tradebook Final Fill
    // ------------------------------------
    const trades = await fetchFyersTradebookWithRetry({
      orderid,
      expectedQty: reqInput.quantity,
    }, req, fyers);

    if (!trades || trades.length === 0) {
      await newOrder.update({ 
        orderstatuslocaldb: "OPEN", 
        positionStatus: "OPEN", 
        status: "OPEN",  
        filltime: nowISOError,
        text: "No trades found - order open"
      });
      return { result: "OPEN" };
    }

    // Calculate trade summary
    let totalQty = 0;
    let totalValue = 0;
    
    trades.forEach(t => {
      const tradedQty = Number(t?.tradedQty || t?.qty || 0);
      const tradePrice = Number(t?.tradePrice || t?.price || 0);
      
      totalQty += tradedQty;
      totalValue += tradedQty * tradePrice;
    });
    
    const avgPrice = totalQty > 0 ? totalValue / totalQty : 0;

    // ------------------------------------
    // 7️⃣ SELL PNL / BUY MERGE
    // ------------------------------------
    let buyOrder = null;
    let positionStatus = "OPEN";

    if (transactionType === "SELL" && reqInput.buyOrderId) {
      buyOrder = await Order.findOne({
        where: { userId: user.id, orderid: reqInput.buyOrderId, status: "COMPLETE",orderstatuslocaldb: "OPEN" },
      });
      
      if (buyOrder) {
        const originalQty = Number(buyOrder?.fillsize || buyOrder?.quantity || 0);
        const remaining = originalQty - totalQty;
        
        if (remaining > 0) {
          // Partial sell - update buy order
          await buyOrder.update({ 
            fillsize: remaining, 
            quantity: remaining,
            tradedValue: remaining * (buyOrder.fillprice || 0)
          });

          // Create completed sell record
          await Order.create({
            ...buyOrder.toJSON(),
            id: undefined,
            fillsize: totalQty,
            quantity: totalQty,
            tradedValue: totalQty * (buyOrder.fillprice || 0),
            orderstatuslocaldb: "COMPLETE",
            status: "COMPLETE",
            positionStatus: "COMPLETE"
          });
        } else {
          // Full sell
          await buyOrder.update({ 
            orderstatuslocaldb: "COMPLETE", 
            positionStatus: "COMPLETE" 
          });
        }
        positionStatus = "COMPLETE";
      }
    }

    const pnl = transactionType === "SELL" && buyOrder
      ? (avgPrice - Number(buyOrder.fillprice || 0)) * totalQty
      : 0;

    // ------------------------------------
    // 8️⃣ Update Order with Trade Details
    // ------------------------------------
    await newOrder.update({
      fillprice: avgPrice,
      price: avgPrice,
      quantity: totalQty,
      fillsize: totalQty,
      tradedValue: totalValue,
      fillid: trades[0]?.tradeNumber || trades[0]?.row || "",
      uniqueorderid: trades[0]?.exchangeOrderNo || trades[0]?.exchOrdId || "",
      status: "COMPLETE",
      orderstatuslocaldb: transactionType === "SELL" ? "COMPLETE" : "OPEN",
      positionStatus: positionStatus,
      pnl: pnl,
      buyOrderId: buyOrder?.orderid || null,
      buyprice: buyOrder?.fillprice || 0,
      buyTime: buyOrder?.filltime || null,
      buysize: buyOrder ? totalQty : 0,
      buyvalue: buyOrder ? (totalQty * (buyOrder?.fillprice || 0)) : 0,
      text: `Executed with ${trades.length} trade(s) at avg price ${avgPrice}`,
      filltime: trades[0]?.orderDateTime || nowISOError
    });

    // ------------------------------------
    // 9️⃣ MERGE BUY (Same Order Found)
    // ------------------------------------
    if (transactionType === "BUY" && existingBuyOrder) {
      const existingQty = Number(existingBuyOrder.fillsize || 0);
      const existingVal = Number(existingBuyOrder.tradedValue || 0);
      
      const mergedQty = existingQty + totalQty;
      const mergedVal = existingVal + totalValue;
      const mergedAvgPrice = mergedVal / mergedQty;
      
      await existingBuyOrder.update({
        fillsize: mergedQty,
        quantity: mergedQty,
        tradedValue: mergedVal,
        fillprice: mergedAvgPrice,
        price: mergedAvgPrice,
        text: `Merged with order ${newOrder.orderid}`
      });

      // Delete the new order since it's merged
      await newOrder.destroy();

      return { 
        result: "SUCCESS", 
        mergedInto: existingBuyOrder.id,
        message: `Order merged with existing buy order. Total Qty: ${mergedQty}`
      };
    }

    return { 
      result: "SUCCESS", 
      orderid,
      filledQty: totalQty,
      avgPrice: avgPrice
    };

  } catch (err) {
    console.log(err, '==============err================');
    
    logError(req, err, { 
      msg: "Fyers order placement failed", 
      error: err.message,
      stack: err.stack 
    });

    await newOrder?.update({
      orderstatuslocaldb: "FAILED",
      status: "FAILED",
      positionStatus: "FAILED",
      filltime: nowISOError,
      text: err.message,
    });
    
    return { result: "BROKER_ERROR", message: err.message };
  }
};



// ====================================================
// 🚀 Main Function
// ====================================================
export const placeFyersOrder121 = async (user, reqInput, req, isLocalDbFlow = true) => {
  let newOrder = null;

  const nowISOError = new Date().toISOString();

  try {
    const transactionType = (reqInput.transactiontype || "").toUpperCase();

     const fyersProductType = getFyersProductCode(reqInput.productType);

    if (!user?.authToken) {

      logError(req, { msg: "FYERS token missing",error:null });

      return { result: "ERROR", message: "FYERS token missing" };
    }

    // ------------------------------------
    // 0️⃣ Apply Token
    // ------------------------------------
   let fyers =   await setFyersAccessToken(user.authToken,user);

    // ------------------------------------
    // 1️⃣ Detect Same Order (BUY only)
    // ------------------------------------
    let existingBuyOrder = null;
    if (transactionType === "BUY") {
      existingBuyOrder = await Order.findOne({
        where: {
          userId: user.id,
          ordertype: reqInput.orderType,
          producttype: fyersProductType,
          tradingsymbol: reqInput.fyersSymbol||reqInput.symbol,
          transactiontype: "BUY",
          orderstatuslocaldb: "OPEN",
          positionStatus: "OPEN",
        },
      });
    }

    

    // ------------------------------------
    // 2️⃣ Create Pending Order Locally
    // ------------------------------------
    const orderData = {
      variety: reqInput.variety || "NORMAL",
      tradingsymbol: reqInput.fyersSymbol||reqInput.symbol,
      transactiontype: transactionType,
      exchange: reqInput.exchange || reqInput.exch_seg || "NSE",
      ordertype: reqInput.orderType,
      quantity: reqInput.quantity,
      producttype: fyersProductType,
      price: reqInput.price,
      orderstatuslocaldb: "PENDING",
      userId: user.id,
      broker: "fyers",
      userNameId: user.username,
      strategyName: reqInput.groupName || "",
      strategyUniqueId: reqInput.strategyUniqueId || "",
      buyOrderId: reqInput.buyOrderId || null,
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
    };

     console.log('=============save fyers qaz==============');

    newOrder = await Order.create(orderData);

    console.log('=============save fyers 121==============');
    

    // ------------------------------------
    // 3️⃣ FYERS API Payload
    // ------------------------------------
   
    const fyersTypeMap = { LIMIT: 1, MARKET: 2, SL: 3, "SL-M": 4 };

    const payload = {
      symbol:reqInput.fyersSymbol||reqInput.symbol,
      qty: Number(reqInput.quantity),
      type: fyersTypeMap[reqInput.orderType] || 2,
      side: transactionType === "BUY" ? 1 : -1,
      productType: fyersProductType,
      limitPrice: reqInput.orderType === "MARKET" ? 0 : Number(reqInput.price || 0),
      stopPrice: reqInput.triggerPrice || 0,
      validity: reqInput.duration || "DAY",
      disclosedQty: 0,
      orderTag:"aitrading",
      offlineOrder: false,
    };

    // ------------------------------------
    // 4️⃣ Place Fyers Order
    // ------------------------------------
    let placeRes;
    try {
      placeRes = await fyers.place_order(payload);


       console.log(placeRes,'=============save fyers 2==============');
    } catch (err) {

      console.log(err,'=========err===========');
      
      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        positionStatus: "FAILED",
        status: "FAILED",
        text: err.message,
        filltime: nowISOError,
      });
      return { result: "BROKER_ERROR", message: err.message };
    }

    if (!placeRes || placeRes.s !== "ok" || !placeRes.id) {
      await newOrder.update({ orderstatuslocaldb: "FAILED", positionStatus: "FAILED", status: "FAILED",filltime: nowISOError, });
      return { result: "BROKER_REJECTED" };
    }

    const orderid = placeRes.id;
    await newOrder.update({ orderid });

    // ------------------------------------
    // 5️⃣ OrderBook Status Check
    // ------------------------------------
    const orderDetails = await fetchFyersOrderDetailsWithRetry({ orderid },req,fyers);
    if (orderDetails) {
      const stat = orderDetails?.status

      if (stat.includes("REJECT")||stat.includes("REJECTED")) {
        await newOrder.update({ 
          orderstatuslocaldb: "REJECTED", positionStatus: "REJECTED",
          status: "REJECTED",  filltime: nowISOError,
          text:orderDetails?.oms_msg||""
           });
        return { result: "BROKER_REJECTED" };
      }
      if (["CANCEL", "CANCELLED"].includes(stat)) {
        await newOrder.update({ 
           orderstatuslocaldb: "CANCELLED",positionStatus: "CANCELLED",
           status: "CANCELLED",  filltime: nowISOError,
           text:orderDetails?.oms_msg||""
           });
        return { result: "OPEN" };
      }
      if (["OPEN", "PENDING"].includes(stat)) {
        await newOrder.update({ 
           orderstatuslocaldb: "OPEN",positionStatus: "OPEN",
           status: "OPEN",  filltime: nowISOError,
           text:orderDetails?.oms_msg||""
           });
        return { result: "OPEN" };
      }
    }

    // ------------------------------------
    // 6️⃣ Tradebook Final Fill
    // ------------------------------------
    const trades = await fetchFyersTradebookWithRetry({
      orderid,
      expectedQty: reqInput.quantity,
    },req,fyers);

    if (!trades.length) {
      await newOrder.update({ orderstatuslocaldb: "OPEN",positionStatus: "OPEN", status: "OPEN",  filltime: nowISOError, });
      return { result: "OPEN" };
    }

    let totalQty = 0;
    let totalValue = 0;
    trades.forEach(t => {
      totalQty += Number(t.tradedQty||t.qty);
      totalValue += Number(t.tradedQty||t.qty) * Number(t.tradePrice||t.price);
    });
    const avgPrice = totalValue / totalQty;

    // ------------------------------------
    // 7️⃣ SELL PNL / BUY MERGE
    // ------------------------------------
    let buyOrder = null;

    if (transactionType === "SELL" && reqInput.buyOrderId) {
      buyOrder = await Order.findOne({
        where: { userId: user.id, orderid: reqInput.buyOrderId, status: "COMPLETE" },
      });
      const originalQty = Number(buyOrder?.fillsize || buyOrder?.quantity);
      const remaining = originalQty - totalQty;
      if (buyOrder) {
        if (remaining > 0) {
          await buyOrder.update({ fillsize: remaining, quantity: remaining,tradedValue:remaining*buyOrder.fillprice });

          await Order.create({
             ...buyOrder.toJSON(),
              id: undefined,
              fillsize: totalQty,
              quantity: totalQty,
              tradedValue:totalQty*buyOrder.fillprice,
              orderstatuslocaldb: "COMPLETE",
              status: "COMPLETE",
              postionStauts: "COMPLETE"
              });
        } else {
          await buyOrder.update({ orderstatuslocaldb: "COMPLETE", postionStauts: "COMPLETE" });
        }
      }
    }

    const pnl = transactionType === "SELL" && buyOrder
      ? (avgPrice - Number(buyOrder.fillprice || 0)) * totalQty
      : 0;

    await newOrder.update({
      fillprice: avgPrice,
      price: avgPrice,
      quantity:totalQty,
      fillsize: totalQty,
      tradedValue: totalValue,
      fillid: trades[0]?.row||"",
      uniqueorderid: trades[0]?.exchangeOrderNo||"",
      status: "COMPLETE",
      orderstatuslocaldb: transactionType === "SELL" ? "COMPLETE" : "OPEN",
      postionStauts: transactionType === "SELL" ? "COMPLETE" : "OPEN",
      pnl,
      buyOrderId: buyOrder?.orderid || null,
      buyprice: buyOrder?.fillprice||0,
      buyTime: buyOrder?.filltime||0,
      buysize: buyOrder ? totalQty : 0,
      buyvalue: totalQty*buyOrder?.fillprice||0,
      positionStatus,


    });

    // ------------------------------------
    // 8️⃣ MERGE BUY (Same Order Found)
    // ------------------------------------
    if (transactionType === "BUY" && existingBuyOrder) {
      const mergedQty = Number(existingBuyOrder.fillsize || 0) + totalQty;
      const mergedVal = Number(existingBuyOrder.tradedValue || 0) + totalValue;
      await existingBuyOrder.update({
        fillsize: mergedQty,
        quantity: mergedQty,
        tradedValue: mergedVal,
        fillprice: mergedVal / mergedQty,
        price: mergedVal / mergedQty
      });

      await newOrder.destroy();

      return { result: "SUCCESS", mergedInto: existingBuyOrder.id };
    }

    return { result: "SUCCESS", orderid };

  } catch (err) {

    console.log(err,'==============err================');
    
    logError(req,err, { msg: "FYERS token missing",error:err });

    await newOrder?.update({
      orderstatuslocaldb: "FAILED",
      status: "FAILED",
      positionStatus: "FAILED",
      filltime: nowISOError,
      text: err.message,
    });
    return { result: "BROKER_ERROR", message: err.message };
  }
};























// // services/fyers/placeFyersOrder.js

// import { setFyersAccessToken, fyers } from "../utils/fyersClient.js";
// import Order from "../models/orderModel.js";
// import { logSuccess, logError } from "../utils/loggerr.js";


// function getFyersProductCode(type) {
//   if (!type) return "INTRADAY"; // default Fyers product

//   switch (type.toUpperCase()) {
//     case "DELIVERY":
//       return "CNC";        // Delivery (Cash & Carry)

//     case "CARRYFORWARD":
//       return "MARGIN";     // Carryforward F&O

//     case "MARGIN":
//       return "MTF";        // Margin Trading Facility

//     case "INTRADAY":
//       return "INTRADAY";   // Intraday

//     case "BO":
//       return "BO";         // Bracket Order

//     default:
//       return type.toUpperCase(); // fallback
//   }
// }


// function mapFyersOrderType(orderType) {
//   if (!orderType) return 1; // default LIMIT

//   switch (orderType.toUpperCase()) {
//     case "LIMIT":
//       return 1;      // LIMIT

//     case "MARKET":
//       return 2;      // MARKET

//     case "STOPLOSS_LIMIT":
//     case "SL":
//       return 3;      // Stoploss LIMIT

//     case "STOPLOSS_MARKET":
//     case "SL-M":
//       return 4;      // Stoploss MARKET

//     default:
//       return 1;      // fallback LIMIT
//   }
// }


// // ===========old workig code =============================
// export const placeFyersOrder = async (user, reqInput, startOfDay, endOfDay) => {
//   try {
//     // 1) Set Fyers access token (per user)
//     await setFyersAccessToken(user.authToken);

//     const fyersProductType = getFyersProductCode(reqInput.productType);

//     const fyersOrderType = mapFyersOrderType(reqInput.orderType);

//     const isLimitType  = fyersOrderType === 1 || fyersOrderType === 3; // LIMIT, SL
//     const isMarketType = fyersOrderType === 2 || fyersOrderType === 4; // MARKET, SL-M

//     // Fyers rules:
//     const limitPrice =
//       isLimitType ? Number(reqInput.price || 0) : 0;   // LIMIT/SL need limitPrice, MARKET/SL-M must be 0

//     const stopPrice =
//       (fyersOrderType === 3 || fyersOrderType === 4)
//         ? Number(reqInput.triggerPrice || 0)          // SL / SL-M must have stopPrice
//         : 0;


//     // Build Fyers symbol: "NSE:SBIN-EQ"
//      // Build Fyers symbol: "NSE:SBIN-EQ"
//     const fyersSymbol =
//        `${reqInput.exch_seg}:${reqInput.symbol}`;


//     // ----------------------------------------
//     // 2) CREATE LOCAL PENDING ORDER (similar to Kite)
//     // ----------------------------------------
//     const orderData = {
//       symboltoken: reqInput.token,
//       variety: reqInput.variety || "NORMAL",
//       tradingsymbol: reqInput.symbol,
//       duration:reqInput?.duration,
//       instrumenttype: reqInput.instrumenttype,
//       transactiontype: reqInput.transactiontype, // BUY / SELL
//       exchange: reqInput.exch_seg,              // NSE / NFO etc.
//       ordertype: reqInput.orderType,            // LIMIT / MARKET / SL / SL-M
//       quantity: reqInput.quantity,
//       product: fyersProductType,                // INTRADAY / CNC / MTF
//       price: reqInput.price,
//       orderstatuslocaldb: "PENDING",
//       totalPrice: reqInput.totalPrice,
//       actualQuantity: reqInput.actualQuantity,
//       userId: user.id,
//       userNameId: user.username,
//       angelOneSymbol:reqInput.angelOneSymbol||reqInput.symbol,
//       angelOneToken:reqInput.angelOneToken||reqInput.token,
//       broker: "fyers",
//       buyOrderId:reqInput?.buyOrderId
//     };


    

//     const newOrder = await Order.create(orderData);

//     // ----------------------------------------
//     // 3) FYERS ORDER PAYLOAD
//     // ----------------------------------------
//     const fyersReqBody = {
//       symbol: fyersSymbol,                       // "NSE:SBIN-EQ"
//       qty: Number(reqInput.quantity),
//       type: fyersOrderType,                      // 1,2,3,4
//       side: reqInput.transactiontype === "BUY" ? 1 : -1,     // 1 = BUY, -1 = SELL
//       productType: fyersProductType,             // "INTRADAY", "CNC", ...
//       limitPrice,                              // ✅ now correct per order type
//       stopPrice,                               // ✅ only non-zero for SL / SL-M
//       disclosedQty: 0,
//       validity: reqInput?.duration,                           // or IOC, GTC etc.
//       offlineOrder: false,
//       stopLoss: 0,
//       takeProfit: 0,
//       orderTag: reqInput.orderTag || `U${user.id}`, // you can customize
//     };

//     // ----------------------------------------
//     // 4) PLACE ORDER IN FYERS
//     // ----------------------------------------
//     let placeRes;
//     try {

//       console.log(fyersReqBody,'fyersReqBody');
      
//       placeRes = await fyers.place_order(fyersReqBody);

//       if (!placeRes || placeRes.s !== "ok") {
//         const msg = placeRes?.message || "Fyers order placement failed";

//         await newOrder.update({
//           orderstatuslocaldb: "FAILED",
//           status: "FAILED",
//           text: msg,
//           //  filltime: new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
//             buyTime:new Date().toISOString().replace(/\.\d+Z$/, ".000Z"),
//         });

//         return {
//           userId: user.id,
//           broker: "Fyers",
//           result: "BROKER_REJECTED",
//           message: msg,
//         };
//       }
//     } catch (err) {
//       console.log("Fyers place_order error:", err);

//       await newOrder.update({
//         orderstatuslocaldb: "FAILED",
//         status: "FAILED",
//         text: err.message,
//       });

//       return {
//         userId: user.id,
//         broker: "Fyers",
//         result: "BROKER_REJECTED",
//         message: err.message,
//       };
//     }

//     const orderid = placeRes.id; // e.g. "52104097616"

//     // Save order id
//     await newOrder.update({ orderid });

//     // ----------------------------------------
//     // 5) HANDLE BUY / SELL LOGIC (same as Kite)
//     // ----------------------------------------
//     let finalStatus = "OPEN";
//     let buyOrder;

//     if (reqInput.transactiontype === "SELL") {
//       // find today's OPEN BUY to close
//       buyOrder = await Order.findOne({
//         where: {


//            userId: user.id,
//             status:"COMPLETE",
//             orderstatuslocaldb: "OPEN",
//             orderid:String(reqInput?.buyOrderId)
//         },
//         raw: true,
//       });

//       if (buyOrder) {
//         await Order.update(
//           { orderstatuslocaldb: "COMPLETE" },
//           { where: { id: buyOrder.id } }
//         );
//       }

//       finalStatus = "COMPLETE";
//     }

//     // ----------------------------------------
//     // 6) GET TRADEBOOK (DETAILS + PNL)
//     // ----------------------------------------
//     let tradeForThisOrder = null;

//     try {
//       const tradeRes = await fyers.get_tradebook(); // full tradebook

//       if (tradeRes && tradeRes.s === "ok" && Array.isArray(tradeRes.tradeBook)) {
//         // Filter trades for this orderNumber (same as placeRes.id)
//         const tradesForOrder = tradeRes.tradeBook.filter(
//           (t) => t.orderNumber === orderid
//         );

//         if (tradesForOrder.length > 0) {
//           // Take the last trade for details
//           tradeForThisOrder = tradesForOrder[tradesForOrder.length - 1];
//         }
//       }
//     } catch (err) {
//       console.log("Fyers get_tradebook error:", err);
//     }

//     // Default details (if no trade yet)
//     let detailsData = {};
//     let tradedQty = 0;
//     let tradedPrice = 0;
//     let tradedValue = 0;

//     if (tradeForThisOrder) {
//       tradedQty = tradeForThisOrder.tradedQty || 0;
//       tradedPrice = tradeForThisOrder.tradePrice || 0;
//       tradedValue = tradeForThisOrder.tradeValue || tradedQty * tradedPrice;

//       detailsData = {
//         exchangeOrderNo: tradeForThisOrder.exchangeOrderNo,
//         orderDateTime: tradeForThisOrder.orderDateTime,
//         productType: tradeForThisOrder.productType,
//         tradedQty,
//         tradedPrice,
//         tradedValue,
//       };
//     }

//     // ----------------------------------------
//     // 7) CALCULATE PNL (if we have trade + previous BUY)
//     // ----------------------------------------
//     let buyPrice = 0;
//     let buySize = 0;
//     let buyValue = 0;
//      let buyTime  = 'NA'
//     let pnl = 0;

//     if (buyOrder) {
//       buyPrice = buyOrder?.fillprice || 0;
//       buySize = buyOrder?.fillsize || 0;
//       buyValue = buyOrder?.tradedValue || 0;
//       buyTime = buyOrder?.filltime ||0
//     }

//     if (tradeForThisOrder) {
//       pnl = tradedQty * tradedPrice - buyPrice * buySize;

//       // For BUY leg, keep PNL 0 until SELL happens
//       if (reqInput.transactiontype === "BUY") {
//         pnl = 0;
//         buyTime  = 'NA';
//       }
//     }

//     // ----------------------------------------
//     // 8) UPDATE LOCAL ORDER WITH FINAL STATUS + DETAILS
//     // ----------------------------------------
//     await newOrder.update({
//       // Map to your DB columns similar to Kite
//       uniqueorderid: detailsData.exchangeOrderNo || orderid,
//       exchorderupdatetime: detailsData.orderDateTime || null,
//       exchtime: detailsData.orderDateTime || null,
//       updatetime: detailsData.orderDateTime || null,
//       text: placeRes.message || "",
//       averageprice: tradedPrice || reqInput.price || 0,
//       lotsize: tradedQty || reqInput.quantity,
//       symboltoken: reqInput.token,
//       disclosedquantity: 0,
//       triggerprice: Number(reqInput.triggerPrice || 0),
//       price: reqInput.price,
//       duration: "DAY",
//       producttype: detailsData.productType || fyersProductType,
//       orderstatuslocaldb: finalStatus,
//       status:"COMPLETE",
//       // Trade / PNL fields
//       tradedValue: tradedValue,
//       fillprice: tradedPrice,
//       fillsize: tradedQty,
//       fillid: tradeForThisOrder?.tradeNumber || null,
//       pnl,
//       buyTime:buyTime,
//       buyprice: buyPrice,
//       buysize: buySize,
//       buyvalue: buyValue,
//     });

//     return {
//       userId: user.id,
//       broker: "Fyers",
//       result: "SUCCESS",
//       orderid,
//     };
//   } catch (err) {
//     console.log("placeFyersOrder ERROR:", err);

//     return {
//       userId: user.id,
//       broker: "Fyers",
//       result: "ERROR",
//       message: err.message,
//     };
//   }
// };
