import { getKiteClientForUserId } from "./userKiteBrokerService.js";
import axios from "axios";
import Order from "../models/orderModel.js";
import { logSuccess, logError } from "../utils/loggerr.js";

const calculateTradeSummary = (trades = []) => {
  let totalQty = 0;
  let totalValue = 0;

  for (const t of trades) {
    const qty = Number(t.quantity || t.traded_quantity || 0);
    const price = Number(t.price || t.average_price || 0);

    totalQty += qty;
    totalValue += qty * price;
  }

  const avgPrice = totalQty > 0 ? totalValue / totalQty : 0;

  return {
    totalQty,
    avgPrice,
    totalValue,
  };
};

const pickCompletedOrder = (orders, orderId, idKey, statusKey) => {
  const matched = orders.filter(
    (o) => String(o[idKey]) === String(orderId)
  );

  if (!matched.length) return null;

  // COMPLETE ko priority
  const completed = matched.find(o =>
    ["complete", "COMPLETE", "EXECUTED"].includes(o[statusKey])
  );

  return completed || null;
};

const updateBuyAndSellOrders = async (
  buyOrderId,
  sellOrderId,
  summary,
  cancelledOrderId,
  tradeObj,
  orderObj
) => {
  const nowISO = new Date().toISOString();

  try {
    console.log(`[UPDATE] Starting updateBuyAndSellOrders at ${nowISO}`);
    console.log(`[UPDATE] BUY_ORDER_ID: ${buyOrderId}, SELL_ORDER_ID: ${sellOrderId}, CANCELLED_ORDER_ID: ${cancelledOrderId}`);

    // ================= BUY ORDER UPDATE =================
    console.log(`[BUY] Updating buy order ${buyOrderId} to COMPLETE`);
    await Order.update(
      {
        orderstatuslocaldb: "COMPLETE",
        positionStatus: "COMPLETE",
      },
      {
        where: { orderId: buyOrderId },
      }
    );

    const buyOrder = await Order.findOne({ where: { orderId: buyOrderId } });

    if (!buyOrder) {
      console.error(`[ERROR] BUY_ORDER_NOT_FOUND: ${buyOrderId}`);
      throw new Error(`BUY_ORDER_NOT_FOUND: ${buyOrderId}`);
    }

    console.log(`[BUY] Successfully updated buy order: ${buyOrderId}`);

    // ================= SELL ORDER UPDATE =================
    console.log(`[SELL] Updating sell order ${sellOrderId} with trade summary and linking buy order`);
    await Order.update(
      {
        orderstatuslocaldb: "COMPLETE",
        positionStatus: "COMPLETE",
        buyOrderId: buyOrderId,
        buyprice: buyOrder.fillprice,
        buysize: buyOrder.fillsize,
        buyvalue: buyOrder.tradedValue,
        buyTime: buyOrder.filltime,
        fillsize: summary.totalQty,
        fillprice: summary.avgPrice,
        tradedValue: summary.totalValue,
        pnl: Number((summary.totalValue - (buyOrder.tradedValue || 0)).toFixed(2)),
        uniqueorderid: orderObj?.uniqueorderid || orderObj?.exchange_order_id || "",
        fillid: tradeObj?.fillid || tradeObj?.trade_id || "",
        filltime: tradeObj?.fill_timestamp || tradeObj?.exchange_time || nowISO,
      },
      { where: { orderId: sellOrderId } }
    );

    console.log(`[SELL] Successfully updated sell order: ${sellOrderId}`);

    // ================= CANCELLED ORDER UPDATE =================
    if (cancelledOrderId) {
      console.log(`[CANCELLED] Cancelling order ${cancelledOrderId}`);
      await Order.update(
        {
          orderstatuslocaldb: "CANCELLED",
          positionStatus: "CANCELLED",
          status: "CANCELLED",
        },
        { where: { orderId: cancelledOrderId } }
      );
      console.log(`[CANCELLED] Successfully cancelled order: ${cancelledOrderId}`);
    }

    console.log(`[UPDATE] updateBuyAndSellOrders completed successfully`);

    return {
      success: true,
      buyOrderId,
      sellOrderId,
      cancelledOrderId,
    };
  } catch (err) {
    console.error(`[ERROR] updateBuyAndSellOrders failed: ${err.message}`);
    throw err;
  }
};





const sleep = (ms) => new Promise(res => setTimeout(res, ms));

const retry = async ( fn, {
    retries = 5,
    delay = 500,
    backoff = 1.5,
    shouldRetry = () => true,
  } = {}

) => {
  let attempt = 0;
  let lastError;

  while (attempt < retries) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      attempt++;

      if (attempt >= retries || !shouldRetry(err)) {
        break;
      }

      const wait = Math.floor(delay * Math.pow(backoff, attempt));
      await sleep(wait);
    }
  }

  throw lastError;
};



// =======================Angelone Function Start  ====================

// -----------------------
// API ENDPOINTS
// -----------------------

const ANGEL_ONE_ORDER =
  `https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getOrderBook`;

const ANGEL_ONE_TRADE_BOOK_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook";

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


const cancelAngelOrder = async (
  user,
  cancelledOrderId,
  variety = "NORMAL"
) => {
  const logCtx = {
    broker: "ANGEL",
    cancelledOrderId,
    variety,
  };

  try {
    const response = await axios.post(
      "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/cancelOrder",
      {
        variety,
        orderid: cancelledOrderId,
      },
      { headers: angelHeaders(user.authToken) }
    );

    /**
     * Angel success response format:
     * {
     *   status: true,
     *   message: "SUCCESS",
     *   data: { orderid: "123456" }
     * }
     */

    if (response?.data?.status === true||response.status===true||response.status==='true') {
      logSuccess("🟢 ANGEL_ORDER_CANCELLED", {
        ...logCtx,
        response: response.data,
      });

      return {
        status: true,
        cancelledOrderId,
      };
    }

    logSuccess("🟡 ANGEL_ORDER_CANCEL_FAILED_RESPONSE", {
      ...logCtx,
      response: response.data,
    });

    return {
      status: false,
      cancelledOrderId,
      reason: response?.data?.message || "CANCEL_FAILED",
    };

  } catch (err) {
    logError("🔴 ANGEL_ORDER_CANCEL_ERROR", {
      ...logCtx,
      error: err.message,
      response: err?.response?.data,
    });

    return {
      status: false,
      cancelledOrderId,
      error: err.message,
    };
  }
};


export const checkTargetAndStoplossAngelOrder = async (
  user,
  orderId,          // SELL order
  buyOrderId,       // BUY order
  cancellOrderId    // Cancell order
) => {
  const logCtx = {
    broker: "ANGEL",
    sellOrderId: orderId,
    buyOrderId,
    cancelOrderId: cancellOrderId,
    userId: user.id,
  };

  try {
    logSuccess("ANGEL_TARGET_CHECK_START", {
      ...logCtx,
      message: "Starting Angel target/stoploss validation",
    });

    // ===================== 1️⃣ ORDER BOOK =====================
    const orders = await retry(async () => {
      const res = await axios.get(
        ANGEL_ONE_ORDER,
        { headers: angelHeaders(user.authToken) }
      );
      return res?.data?.data || [];
    }, { retries: 3, delay: 700 });

    const order = pickCompletedOrder(
      orders,
      orderId,
      "orderid",
      "status"
    );

    if (!order) {
      logSuccess("ANGEL_ORDER_NOT_COMPLETED", {
        ...logCtx,
        message: "Sell order not completed yet",
      });
      return null;
    }

    logSuccess("ANGEL_ORDER_COMPLETED", {
      ...logCtx,
      orderStatus: order.status,
      symbol: order.tradingsymbol,
    });

    // ===================== 2️⃣ TRADE BOOK =====================
    const trades = await retry(async () => {
      const res = await axios.get(
        ANGEL_ONE_TRADE_BOOK_URL,
        { headers: angelHeaders(user.authToken) }
      );
      const allTrades = res?.data?.data || [];
      return allTrades.filter(
        (t) => String(t.orderid) === String(orderId)
      );
    }, {
      retries: 3,
      delay: 700,
    });

    if (!trades.length) {
      logSuccess("ANGEL_TRADE_NOT_FOUND", {
        ...logCtx,
        message: "Order completed but trade not available yet",
      });
      return null;
    }

    logSuccess("ANGEL_TRADE_FETCHED", {
      ...logCtx,
      tradeCount: trades.length,
    });

    // ===================== 3️⃣ CALCULATE SUMMARY =====================
    const summary = calculateTradeSummary(trades);

    logSuccess("ANGEL_TRADE_SUMMARY", {
      ...logCtx,
      avgPrice: summary.avgPrice,
      totalQty: summary.totalQty,
      totalValue: summary.totalValue,
    });

    // ===================== 4️⃣ CANCEL SL ORDER =====================
    const cancelRes = await cancelAngelOrder(user, cancellOrderId);

    logSuccess("ANGEL_SL_CANCELLED", {
      ...logCtx,
      cancelStatus: cancelRes?.status ?? false,
    });

    // ===================== 5️⃣ UPDATE DB =====================
    await updateBuyAndSellOrders(
      buyOrderId,
      summary,
      cancellOrderId,
      trades[0],
      order
    );

    logSuccess("ANGEL_DB_UPDATED", {
      ...logCtx,
      message: "Buy & Sell orders updated successfully in DB",
    });

    // ===================== FINAL =====================
    logSuccess("ANGEL_TARGET_HIT_SUCCESS", {
      ...logCtx,
      pnl: summary.totalValue,
    });

    return {
      executed: true,
      broker: "ANGEL",
      orderId,
      symbol: order.tradingsymbol,
      transactionType: order.transactiontype,
      ...summary,
      trades,
    };

  } catch (err) {
    logError("ANGEL_TARGET_CHECK_FAILED", {
      ...logCtx,
      error: err.message,
      stack: err.stack,
    });

    throw err;
  }
};




// =======================Angelone Function End ====================





// =======================Kite Function Start ====================



const cancelKiteOrder = async (
  kite,
  cancelledOrderId,
  variety = "regular"
) => {
  const logCtx = {
    broker: "KITE",
    cancelledOrderId,
    variety,
  };

  try {
    const response = await kite.cancelOrder(variety, cancelledOrderId);

    /**
     * Zerodha success response:
     * { order_id: "230912345678" }
     */

    if (response?.order_id) {
      logSuccess("🟢 KITE_ORDER_CANCELLED", {
        ...logCtx,
        response,
      });

      return {
        status: true,
        cancelledOrderId: response.order_id,
      };
    }

    logSuccess("🟡 KITE_ORDER_CANCEL_UNKNOWN_RESPONSE", {
      ...logCtx,
      response,
    });

    return {
      status: false,
      cancelledOrderId,
      reason: "UNKNOWN_RESPONSE",
    };

  } catch (err) {
    logError("🔴 KITE_ORDER_CANCEL_FAILED", {
      ...logCtx,
      error: err.message,
      stack: err.stack,
    });

    return {
      status: false,
      cancelledOrderId,
      error: err.message,
    };
  }
};


export const checkTargetAndStoplossKiteOrder = async (
  user,
  orderId,          // SELL order
  buyOrderId,       // BUY order
  cancellOrderId    // Cancell order
) => {


  const logCtx = {
    broker: "KITE",
    sellOrderId: orderId,
    buyOrderId,
    cancelOrderId: cancellOrderId,
    userId: user.id,
  };

  try {
    logSuccess("KITE_TARGET_CHECK_START", {
      ...logCtx,
      message: "Starting Kite target/stoploss validation",
    });

    const kite = await getKiteClientForUserId(user.id);

    // ===================== 1️⃣ ORDER BOOK =====================
    const orders = await retry(
      () => kite.getOrders(),
      { retries: 3, delay: 500 }
    );

    const order = pickCompletedOrder(
      orders,
      orderId,
      "order_id",
      "status"
    );

    if (!order) {
      logSuccess("KITE_ORDER_NOT_COMPLETED", {
        orders,
        message: "Sell order not completed yet",
      });
      return null;
    }

    logSuccess("KITE_ORDER_COMPLETED", {
      ...logCtx,
      orderStatus: order.status,
      symbol: order.tradingsymbol,
    });

    // ===================== 2️⃣ TRADE BOOK =====================
    const trades = await retry(async () => {
      const allTrades = await kite.getTrades();
      return allTrades.filter(
        (t) => String(t.order_id) === String(orderId)
      );
    }, { retries: 3, delay: 600 });

    if (!trades.length) {
      logSuccess("KITE_TRADE_NOT_FOUND", {
        ...logCtx,
        message: "Order completed but trade not available yet",
      });
      return null;
    }

    logSuccess("KITE_TRADE_FETCHED", {
      trades,
      tradeCount: trades.length,
    });

    // ===================== 3️⃣ CALCULATE SUMMARY =====================
    const summary = calculateTradeSummary(trades);

    logSuccess("KITE_TRADE_SUMMARY", {
      ...logCtx,
      avgPrice: summary.avgPrice,
      totalQty: summary.totalQty,
      totalValue: summary.totalValue,
    });

    // ===================== 4️⃣ CANCEL SL ORDER =====================
    const cancelRes = await cancelKiteOrder(kite, cancellOrderId);

    logSuccess("KITE_SL_CANCELLED", {
      ...logCtx,
      cancelStatus: cancelRes ?? true,
    });

    // ===================== 5️⃣ UPDATE DB =====================
    await updateBuyAndSellOrders(
      buyOrderId,
      summary,
      cancellOrderId,
      trades[0],
      order
    );

    logSuccess("KITE_DB_UPDATED", {
      ...logCtx,
      message: "Buy & Sell orders updated successfully in DB",
    });

    // ===================== FINAL =====================
    logSuccess("KITE_TARGET_HIT_SUCCESS", {
      ...logCtx,
      pnl: summary.totalValue,
    });

    return {
      executed: true,
      broker: "KITE",
      orderId,
      symbol: order.tradingsymbol,
      transactionType: order.transaction_type,
      ...summary,
      trades,
    };

  } catch (err) {
    logError("KITE_TARGET_CHECK_FAILED", {
      ...logCtx,
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
};



// =======================Kite Function End ====================







const updateBuyAndSellOrders1 = async (buyOrderId,summary,calcelledOrderId,tradeObj,orderObj)=> {

        // ---------- BUY ORDER UPDATE ----------
        const [affectedRows, updatedOrders] = await Order.update(
        {
            orderstatuslocaldb: "COMPLETE",
            positionStatus: "COMPLETE",
        },
        {
            where: {
            orderId: buyOrderId,
            },
            returning: true, // 🔥 IMPORTANT
        }
        );

        // updatedOrders array hota hai
        const buyOrder = updatedOrders[0];


        const nowISOError = new Date().toISOString();

  // ---------- SELL ORDER UPDATE ----------
  const [affectedSellRows, updatedSellOrders] = await Order.update(
    {
      orderstatuslocaldb: "COMPLETE",
      positionStatus: "COMPLETE",
      buyOrderId:buyOrderId,
      buyprice: buyOrder?.fillprice,
      buysize: buyOrder?.fillsize,
      buyvalue: buyOrder?.tradedValue,
      buyTime: buyOrder?.filltime,
      pnl:summary.totalValue-buyOrder?.tradedValue,
      fillsize:summary.totalQty,
      fillprice:summary.avgPrice,
      tradedValue:summary.totalValue,
      uniqueorderid:orderObj?.uniqueorderid||orderObj?.exchange_order_id||"",
      fillid: tradeObj?.fillid||tradeObj.trade_id||"",
      filltime: tradeObj.fill_timestamp||nowISOError,
    },
    {
      where: {
        orderId: sellOrderId,
      },
       returning: true, // 🔥 IMPORTANT
    }
  );

   // ---------- Cancell ORDER UPDATE ----------
  await Order.update(
    {
      orderstatuslocaldb: "CANCELLED",
      positionStatus: "CANCELLED",
      status:"CANCELLED"
    },
    {
      where: {
        orderId: calcelledOrderId,
      },
    }
  );

  return true;
};

const cancelAngelOrder1 = async (user, cancelledOrderId,variety="NORMAL") => {

    try {

    let response =  await axios.post(
        "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/cancelOrder",
        { 
            variety: variety,
            orderid: cancelledOrderId
        },
        { headers: angelHeaders(user.authToken) }
    );

        if(response.status==='true'||response.status===true) {

            return {
                status:true,
                cancelledOrderId:cancelledOrderId
            }
        }else{

            return {
                status:false,
                cancelledOrderId:cancelledOrderId
            }
        }
        
    } catch (err) {

    return {
      status: false,
      cancelledOrderId,
      error: err.message,
    };
        
    }
};
export const checkTargetAndStoplossAngelOrder1 = async (user, orderId,buyOrderId,cancellOrderId) => {
  try {

    // 1️⃣ ORDER BOOK (with retry)
    const orders = await retry(async () => {
      const res = await axios.get(
        ANGEL_ONE_ORDER,
        { headers: angelHeaders(user.authToken) }
      );
      return res?.data?.data || [];
    }, { retries: 6, delay: 700 });

    const order = pickCompletedOrder(
      orders,
      orderId,
      "orderid",
      "status"
    );

    if (!order) return null;

    // 2️⃣ TRADE BOOK (with retry)
    const trades = await retry(async () => {
      const res = await axios.get(
        ANGEL_ONE_TRADE_BOOK_URL,
        { headers: angelHeaders(user.authToken) }
      );
      const allTrades = res?.data?.data || [];
      return allTrades.filter(
        (t) => String(t.orderid) === String(orderId)
      );
    }, {
      retries: 3,
      delay: 700,
      shouldRetry: (err) => true
    });

    if (!trades.length) return null;

    // 3️⃣ Qty + Avg Price
    const summary = calculateTradeSummary(trades);

    //  Cancel Order
    await cancelAngelOrder(user, cancellOrderId);

    await updateBuyAndSellOrders(buyOrderId,summary,cancellOrderId,trades[0],order)

    return {
      executed: true,
      broker: "ANGEL",
      orderId,
      symbol: order.tradingsymbol,
      transactionType: order.transactiontype,
      ...summary,
      trades,
    };

  } catch (err) {
    console.error("Angel check error", err);
    throw err;
  }
};


const cancelKiteOrder1 = async (kite, cancelledOrderId, variety = "regular") => {
  try {
    const response = await kite.cancelOrder(variety, cancelledOrderId);

    console.log(response, "cancel order in kite");

    // Zerodha success case:
    // response = { order_id: 'XXXXXX' }

    if (response && response.order_id) {
      return {
        status: true,
        cancelledOrderId: response.order_id,
      };
    }

    return {
      status: false,
      cancelledOrderId,
    };

  } catch (err) {
    console.error("Kite cancel error:", err.message);

    return {
      status: false,
      cancelledOrderId,
      error: err.message,
    };
  }
};
export const checkTargetAndStoplossKiteOrder1 = async (user, orderId,buyOrderId,cancellOrderId) => {
  try {

    const kite = await getKiteClientForUserId(user.id);

    // 1️⃣ Orders (retry)
    const orders = await retry(
      () => kite.getOrders(),
      { retries: 3, delay: 500 }
    );

    const order = pickCompletedOrder(
      orders,
      orderId,
      "order_id",
      "status"
    );

    if (!order) return null;

    // 2️⃣ Trades (retry)
    const trades = await retry(async () => {
      const allTrades = await kite.getTrades();
      return allTrades.filter(
        (t) => String(t.order_id) === String(orderId)
      );
    }, { retries: 5, delay: 600 });

    if (!trades.length) return null;

    const summary = calculateTradeSummary(trades);

    // Cancel Order
    await cancelKiteOrder(user, cancellOrderId);

    await updateBuyAndSellOrders(buyOrderId,summary,cancellOrderId,trades[0],order)

    return {
      executed: true,
      broker: "KITE",
      orderId,
      symbol: order.tradingsymbol,
      transactionType: order.transaction_type,
      ...summary,
      trades,
    };

  } catch (err) {
    console.error("Kite check error", err);
    throw err;
  }
};