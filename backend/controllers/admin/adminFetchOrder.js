import axios from "axios";
import Order from "../../models/orderModel.js";
import User from "../../models/userModel.js";
import { logSuccess, logError } from "../../utils/loggerr.js";
import { getKiteClientForUserId } from "../../services/userKiteBrokerService.js";
import { Op } from "sequelize";


// -----------------------
// ANGEL ONE URL + HEADERS (use same as your placeAngelOrder)
// -----------------------
const ANGEL_ONE_TRADE_BOOK_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook";

const angelHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-UserType": "USER",
  "X-SourceID": "WEB",
  "X-ClientLocalIP": "127.0.0.1",
  "X-ClientPublicIP": "127.0.0.1",
  "X-MACAddress": "00:00:00:00:00:00",
});

const safeErr = (e) => ({
  message: e?.message,
  status: e?.response?.status,
  data: e?.response?.data,
});

const toIso = (val) => {
  if (!val) return null;
  try {
    return new Date(val).toISOString();
  } catch {
    return null;
  }
};

// -----------------------
// BROKER TRADE FETCHERS
// -----------------------
async function fetchAngelTradebook(user, req) {

  logSuccess(req, { msg: "AngelOne: fetching tradebook", userId: user.id });

  const tradeRes = await axios.get(ANGEL_ONE_TRADE_BOOK_URL, {
    headers: angelHeaders(user.authToken),
  });

  if (tradeRes.data?.status !== true || !Array.isArray(tradeRes.data?.data)) {
    logSuccess(req, {
      msg: "AngelOne: tradebook invalid/empty",
      userId: user.id,
      status: tradeRes.data?.status,
    });
    return [];
  }

  logSuccess(req, {
    msg: "AngelOne: tradebook fetched",
    userId: user.id,
    count: tradeRes.data.data.length,
  });

  return tradeRes.data.data; // raw array
}

async function fetchKiteTrades(user, req) {
  logSuccess(req, { msg: "Kite: fetching trades", userId: user.id });

  const kite = await getKiteClientForUserId(user.id);
  const trades = await kite.getTrades(); // Zerodha method

  if (!Array.isArray(trades)) {
    logSuccess(req, { msg: "Kite: trades invalid/empty", userId: user.id });
    return [];
  }

  logSuccess(req, { msg: "Kite: trades fetched", userId: user.id, count: trades.length });
  return trades;
}

// -----------------------
// MAIN CONTROLLER
// -----------------------
export const adminFetchBuyOrdersAndUpdateManual = async (req, res) => {
  try {

    logSuccess(req, { msg: "Admin fetch & update manual started" });

    // 1️⃣ Fetch OPEN BUY orders
    const openOrders = await Order.findAll({
      where: {
        orderstatuslocaldb: "OPEN",
        transactiontype: "BUY",
        status:"COMPLETE",
      },
      raw: true,
    });

    logSuccess(req, { msg: "Fetched OPEN BUY orders", count: openOrders.length });

    if (!openOrders.length) {
      return res.json({
        status: false,
        message: "No OPEN BUY orders found",
        data: [],
      });
    }

    // 2️⃣ Cache for performance (avoid calling tradebook many times per same user)
    const userCache = new Map();      // userId -> user
    const angelTradeCache = new Map(); // userId -> tradebook[]
    const kiteTradeCache = new Map();  // userId -> trades[]

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    const results = await Promise.allSettled(
      openOrders.map(async (o) => {
        try {
          logSuccess(req, {
            msg: "Processing order",
            localDbId: o.id,
            userId: o.userId,
            broker: o.broker,
            orderid: o.orderid,
          });

          // 3️⃣ Fetch user
          let user = userCache.get(o.userId);
          if (!user) {
            user = await User.findOne({ where: { id: o.userId }, raw: true });
            userCache.set(o.userId, user);
          }

          if (!user) {
            skipped++;
            logSuccess(req, { msg: "Skipped: user not found", userId: o.userId, localDbId: o.id });
            return { orderDbId: o.id, result: "NO_USER" };
          }

          const brokerName = String(user.brokerName || o.broker || "").toLowerCase();

       if (brokerName === "angelone") {

        if (!user.authToken) {
            skipped++;
            logSuccess(req, { msg: "Skipped: AngelOne user missing authToken", userId: user.id, localDbId: o.id });
            return { orderDbId: o.id, result: "NO_TOKEN" };
        }

  let tradebook = angelTradeCache.get(user.id);
  if (!tradebook) {

    tradebook = await fetchAngelTradebook(user, req);

  logSuccess(req, {
    msg: "AngelOne trade  result",
    userId: user.id,
    localDbId: o.id,
    orderid: o.orderid,
    tradebookCount: tradebook.length,
     tradebooks: tradebook,
  });

    if (!tradebook.length) {
    skipped++;
    return { orderDbId: o.id, result: "NO_TRADE_FOUND" };
  }

    console.log('==============tradebook===============',tradebook);
    
    angelTradeCache.set(user.id, tradebook);
  }

  // Find all trades matching the orderid
  const matchedTrades = tradebook.filter((t) => String(t.orderid) === String(o.orderid));

  logSuccess(req, {
    msg: "AngelOne trade match result",
    userId: user.id,
    localDbId: o.id,
    orderid: o.orderid,
    matchedCount: matchedTrades.length,
  });

  if (!matchedTrades.length) {
    skipped++;
    return { orderDbId: o.id, result: "NO_TRADE_FOUND" };
  }

  // Calculate total quantity and total value
  const totalQty = matchedTrades.reduce((sum, t) => sum + Number(t.quantity || 0), 0);
  const totalValue = matchedTrades.reduce((sum, t) => sum + Number(t.fillprice || 0) * Number(t.quantity || 0), 0);
  const avgPrice = totalValue / totalQty;

  // Use the first trade's timestamps and IDs for reference
  const firstTrade = matchedTrades[0];

  console.log('=================firstTrade===============',firstTrade);
  

  await Order.update(
    {
      fillid: firstTrade.fillid ? String(firstTrade.fillid) : null,
      filltime: toIso(firstTrade.filltime),
      fillprice: avgPrice,
      fillsize: totalQty,
      tradedValue: totalValue,
      price: avgPrice,
      status: "COMPLETE",
      orderstatuslocaldb: "OPEN", // because BUY leg stays OPEN until squareoff
    },
    { where: { id: o.id } }
  );

  updated++;
  logSuccess(req, {
    msg: "Local order updated from AngelOne trades (aggregated)",
    localDbId: o.id,
    orderid: o.orderid,
    avgPrice,
    totalQty,
    totalValue,
  });

  return { orderDbId: o.id, broker: "angelone", result: "UPDATED" };
} if (brokerName === "kite") {
  let trades = kiteTradeCache.get(user.id);
  if (!trades) {
    trades = await fetchKiteTrades(user, req);
    kiteTradeCache.set(user.id, trades);
  }

  const matchedTrades = trades.filter((t) => String(t.order_id) === String(o.orderid));

  logSuccess(req, {
    msg: "Kite trade match result",
    userId: user.id,
    localDbId: o.id,
    orderid: o.orderid,
    matchedCount: matchedTrades.length,
  });

  if (!matchedTrades.length) {
    skipped++;
    return { orderDbId: o.id, result: "NO_TRADE_FOUND" };
  }

  const totalQty = matchedTrades.reduce((sum, t) => sum + t.quantity, 0);
  const totalValue = matchedTrades.reduce((sum, t) => sum + (t.average_price || t.price || 0) * t.quantity, 0);
  const avgPrice = totalValue / totalQty;
  const firstTrade = matchedTrades[0];

  await Order.update(
    {
      fillid: firstTrade.trade_id ? String(firstTrade.trade_id) : null,
      filltime: toIso(firstTrade.fill_timestamp || firstTrade.exchange_timestamp),
      fillprice: avgPrice,
      fillsize: totalQty,
      tradedValue: totalValue,
      price: avgPrice,
      uniqueorderid: firstTrade.exchange_order_id ? String(firstTrade.exchange_order_id) : null,
      status: "COMPLETE",
      orderstatuslocaldb: "OPEN",
    },
    { where: { id: o.id } }
  );

  updated++;
  logSuccess(req, {
    msg: "Local order updated from Kite trades (aggregated)",
    localDbId: o.id,
    orderid: o.orderid,
    avgPrice,
    totalQty,
    totalValue,
  });

  return { orderDbId: o.id, broker: "kite", result: "UPDATED" };
}


          // other brokers not handled here
          skipped++;
          logSuccess(req, {
            msg: "Skipped: broker not supported for manual update",
            localDbId: o.id,
            brokerName,
          });

          return { orderDbId: o.id, result: "UNSUPPORTED_BROKER", brokerName };
        } catch (e) {
          failed++;
          logError(req, e, { msg: "Failed processing order in manual fetch", orderDbId: o?.id, userId: o?.userId });
          return { orderDbId: o?.id, result: "FAILED", error: safeErr(e) };
        }
      })
    );

    const final = results.map((r) => (r.status === "fulfilled" ? r.value : { result: "PROMISE_REJECTED" }));

    logSuccess(req, {
      msg: "Admin fetch & update manual completed",
      updated,
      skipped,
      failed,
    });

    return res.json({
      status: true,
      message: "Manual trade fetch + local update done",
      summary: { updated, skipped, failed },
      data: final,
    });
  } catch (err) {
    logError(req, err, { msg: "adminFetchOrdersAndUpdateManual failed" });

    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: safeErr(err),
    });
  }
};


export const adminFetchSellOrdersAndUpdateManual = async (req, res) => {
  try {
    // 🔹 Today range in UTC
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setUTCHours(23, 59, 59, 999);

    logSuccess(req, { msg: "Admin fetch & update SELL orders started" });

    // 1️⃣ Fetch OPEN SELL orders
    const openSellOrders = await Order.findAll({
      where: {
        orderstatuslocaldb: "OPEN",
        transactiontype: "SELL",
        status: { [Op.in]: ["OPEN", "PENDING"] },
        createdAt: { [Op.between]: [startOfDay, endOfDay] },
      },
      raw: true,
    });

    logSuccess(req, { msg: "Fetched OPEN SELL orders", count: openSellOrders.length });

    if (!openSellOrders.length) {
      return res.json({
        status: false,
        message: "No OPEN SELL orders found",
        data: [],
      });
    }

    // 2️⃣ Cache for performance
    const userCache = new Map();
    const angelTradeCache = new Map();
    const kiteTradeCache = new Map();

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    const results = await Promise.allSettled(
      openSellOrders.map(async (sellOrder) => {
        try {
          logSuccess(req, {
            msg: "Processing SELL order",
            localDbId: sellOrder.id,
            userId: sellOrder.userId,
            broker: sellOrder.broker,
            orderid: sellOrder.orderid,
          });

          // 3️⃣ Fetch user
          let user = userCache.get(sellOrder.userId);
          if (!user) {
            user = await User.findOne({ where: { id: sellOrder.userId }, raw: true });
            userCache.set(sellOrder.userId, user);
          }

          if (!user) {
            skipped++;
            logSuccess(req, { msg: "Skipped: user not found", userId: sellOrder.userId, localDbId: sellOrder.id });
            return { orderDbId: sellOrder.id, result: "NO_USER" };
          }

          const brokerName = String(user.brokerName || sellOrder.broker || "").toLowerCase();

          // 4️⃣ Fetch BUY order for this SELL order
          const buyOrder = await Order.findOne({
            where: {
              userId: sellOrder.userId,
              orderstatuslocaldb: "OPEN",
              transactiontype: "BUY",
              status: "COMPLETE",
              orderid: sellOrder.buyOrderId,
            },
            raw: true,
          });

          if (!buyOrder) {
            skipped++;
            logSuccess(req, { msg: "Skipped: BUY order not found", sellOrderId: sellOrder.id, buyOrderId: sellOrder.buyOrderId });
            return { orderDbId: sellOrder.id, result: "NO_BUY_ORDER" };
          }

          // 5️⃣ Fetch trades for SELL order (AngelOne/Kite)
          let matchedTrades = [];
          if (brokerName === "angelone") {
            if (!user.authToken) {
              skipped++;
              logSuccess(req, { msg: "Skipped: AngelOne user missing authToken", userId: user.id, localDbId: sellOrder.id });
              return { orderDbId: sellOrder.id, result: "NO_TOKEN" };
            }

            let tradebook = angelTradeCache.get(user.id);
            if (!tradebook) {
              tradebook = await fetchAngelTradebook(user, req);
              angelTradeCache.set(user.id, tradebook);
            }

            matchedTrades = tradebook.filter((t) => String(t.orderid) === String(sellOrder.orderid));
          } else if (brokerName === "kite") {
            let trades = kiteTradeCache.get(user.id);
            if (!trades) {
              trades = await fetchKiteTrades(user, req);
              kiteTradeCache.set(user.id, trades);
            }

            matchedTrades = trades.filter((t) => String(t.order_id) === String(sellOrder.orderid));
          } else {
            skipped++;
            logSuccess(req, { msg: "Skipped: broker not supported", localDbId: sellOrder.id, brokerName });
            return { orderDbId: sellOrder.id, result: "UNSUPPORTED_BROKER", brokerName };
          }

          if (!matchedTrades.length) {
            skipped++;
            logSuccess(req, { msg: "Skipped: no trades found for SELL order", localDbId: sellOrder.id });
            return { orderDbId: sellOrder.id, result: "NO_TRADE_FOUND" };
          }

          // 6️⃣ Calculate weighted average price and total filled quantity
          const totalFilledQty = matchedTrades.reduce((sum, t) => sum + Number(t.quantity || 0), 0);
          const totalValue = matchedTrades.reduce((sum, t) => sum + Number(t.fillprice || t.average_price || 0) * Number(t.quantity || 0), 0);
          const weightedAvgPrice = totalValue / totalFilledQty;

          // 7️⃣ Calculate PnL
          const buyPrice = Number(buyOrder.fillprice || 0);
          const buyQty = Number(buyOrder.fillsize || 0);
          const pnl = (weightedAvgPrice * totalFilledQty) - (buyPrice * buyQty);

          // 8️⃣ Update SELL order in DB
          await Order.update(
            {
              fillid: matchedTrades[0].trade_id || matchedTrades[0].fillid || null,
              filltime: toIso(matchedTrades[0].fill_timestamp || matchedTrades[0].filltime),
              fillprice: weightedAvgPrice,
              fillsize: totalFilledQty,
              tradedValue: totalValue,
              price: weightedAvgPrice,
              uniqueorderid: matchedTrades[0].exchange_order_id || null,
              status: "COMPLETE",
              orderstatuslocaldb: "COMPLETE",
              pnl,
              buyTime: buyOrder.filltime,
              buyprice: buyPrice,
              buysize: buyQty,
              buyvalue: buyPrice * buyQty,
              buyOrderId: buyOrder.orderid,
            },
            { where: { id: sellOrder.id } }
          );

          // 9️⃣ Update BUY order status to COMPLETE
          await Order.update(
            { orderstatuslocaldb: "COMPLETE" },
            { where: { id: buyOrder.id } }
          );

          updated++;
          logSuccess(req, {
            msg: "SELL order and BUY order updated",
            sellOrderId: sellOrder.id,
            buyOrderId: buyOrder.id,
            pnl,
            weightedAvgPrice,
            totalFilledQty,
          });

          return { orderDbId: sellOrder.id, broker: brokerName, result: "UPDATED" };
        } catch (e) {
          failed++;
          logError(req, e, { msg: "Failed processing SELL order", orderDbId: sellOrder?.id, userId: sellOrder?.userId });
          return { orderDbId: sellOrder?.id, result: "FAILED", error: safeErr(e) };
        }
      })
    );

    const final = results.map((r) => (r.status === "fulfilled" ? r.value : { result: "PROMISE_REJECTED" }));

    logSuccess(req, {
      msg: "Admin fetch & update SELL orders completed",
      updated,
      skipped,
      failed,
    });

    return res.json({
      status: true,
      message: "Manual SELL trade fetch + local update done",
      summary: { updated, skipped, failed },
      data: final,
    });
  } catch (err) {
    logError(req, err, { msg: "adminFetchSellOrdersAndUpdateManual failed" });
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: safeErr(err),
    });
  }
};


/**
 * ✅ Refresh button API
 * It updates only those SELL orders which were placed as SL/SL-M/squareoff and now executed.
 */
export const refreshTriggeredSellExecutions = async (req, res) => {
  try {

    logSuccess(req, { msg: "Refresh Triggered SELL executions started" });

    // 1) Find OPEN SELL orders which are trigger based (triggerprice/stoploss/squareoff)
    // ✅ IMPORTANT: This is the pool you want to refresh.
    const pendingSellOrders = await Order.findAll({
      where: {
        orderstatuslocaldb: "OPEN",
        transactiontype: "SELL",
        status: { [Op.in]: ["OPEN", "PENDING"] }, // keep based on your stored values
      },
      raw: true,
    });

    if (!pendingSellOrders.length) {
      return res.json({
        status: true,
        message: "No pending trigger-based SELL orders found",
        summary: { updated: 0, skipped: 0, failed: 0 },
        data: [],
      });
    }

    // caches
    const userCache = new Map();       // userId -> user
    const angelTradeCache = new Map(); // userId -> tradebook[]
    const kiteTradeCache = new Map();  // userId -> trades[]

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    const results = await Promise.allSettled(
      pendingSellOrders.map(async (sellOrder) => {
        try {
          // 2) user fetch
          let user = userCache.get(sellOrder.userId);
          if (!user) {
            user = await User.findOne({ where: { id: sellOrder.userId }, raw: true });
            userCache.set(sellOrder.userId, user);
          }
          if (!user) {
            skipped++;
            return { orderDbId: sellOrder.id, result: "NO_USER" };
          }

          const brokerName = String(user.brokerName || sellOrder.broker || "").toLowerCase();

          // 3) Find linked BUY order (for pnl & closing)
          // ✅ You already use sellOrder.buyOrderId in your code, keep same
          const buyOrder = sellOrder.buyOrderId
            ? await Order.findOne({
                where: {
                  userId: sellOrder.userId,
                  transactiontype: "BUY",
                  orderid: sellOrder.buyOrderId,
                },
                raw: true,
              })
            : null;

          // 4) Broker trade match
          let matchedTrades = [];

          if (brokerName === "angelone") {
            if (!user.authToken) {
              skipped++;
              return { orderDbId: sellOrder.id, result: "NO_TOKEN" };
            }

            let tradebook = angelTradeCache.get(user.id);
            if (!tradebook) {
              tradebook = await fetchAngelTradebook(user, req);
              angelTradeCache.set(user.id, tradebook);
            }

            matchedTrades = tradebook.filter(
              (t) => String(t.orderid) === String(sellOrder.orderid)
            );

          } else if (brokerName === "kite") {
            let trades = kiteTradeCache.get(user.id);
            if (!trades) {
              trades = await fetchKiteTrades(user.id);
              kiteTradeCache.set(user.id, trades);
            }

            matchedTrades = trades.filter(
              (t) => String(t.order_id) === String(sellOrder.orderid)
            );
          } else {
            skipped++;
            return { orderDbId: sellOrder.id, result: "UNSUPPORTED_BROKER", brokerName };
          }

          // ✅ If trigger not hit yet OR not executed yet -> no trades
          if (!matchedTrades.length) {
            skipped++;
            return { orderDbId: sellOrder.id, result: "NOT_EXECUTED_YET" };
          }

          // 5) Aggregate fills -> weighted avg
          const totalQty = matchedTrades.reduce((sum, t) => {
            const q = Number(t.quantity || 0);
            return sum + q;
          }, 0);

          const totalValue = matchedTrades.reduce((sum, t) => {
            // Angel: fillprice, Kite: average_price / price
            const price = Number(t.fillprice || t.average_price || t.price || 0);
            const q = Number(t.quantity || 0);
            return sum + price * q;
          }, 0);

          const avgPrice = totalQty ? totalValue / totalQty : 0;
          const firstTrade = matchedTrades[0];

          // 6) pnl if buyOrder exists
          const buyPrice = Number(buyOrder?.fillprice || buyOrder?.price || 0);
          const pnl = buyOrder ? (avgPrice * totalQty) - (buyPrice * totalQty) : null;

          // 7) Update SELL order
          await Order.update(
            {
              fillid: String(firstTrade.trade_id || firstTrade.fillid || ""),
              filltime: toIso(firstTrade.fill_timestamp || firstTrade.exchange_timestamp || firstTrade.filltime),
              fillprice: avgPrice,
              fillsize: totalQty,
              tradedValue: totalValue,
              price: avgPrice,
              status: "COMPLETE",
              orderstatuslocaldb: "COMPLETE",
              pnl: pnl ?? sellOrder.pnl,
              buyOrderId: buyOrder?.orderid || sellOrder.buyOrderId || null,
              buyprice: buyOrder ? buyPrice : sellOrder.buyprice,
              buysize: buyOrder ? totalQty : sellOrder.buysize,
              buyvalue: buyOrder ? buyPrice * totalQty : sellOrder.buyvalue,
              buyTime: buyOrder?.filltime || sellOrder.buyTime || null,
            },
            { where: { id: sellOrder.id } }
          );

          // 8) Close BUY order (if exists)
          if (buyOrder) {
            await Order.update(
              { orderstatuslocaldb: "COMPLETE" },
              { where: { id: buyOrder.id } }
            );
          }

          updated++;
          return {
            orderDbId: sellOrder.id,
            orderid: sellOrder.orderid,
            broker: brokerName,
            result: "UPDATED",
            avgPrice,
            totalQty,
            pnl,
          };
        } catch (e) {
          failed++;
          logError(req, e, { msg: "refreshTriggeredSellExecutions failed order", orderDbId: sellOrder?.id });
          return { orderDbId: sellOrder?.id, result: "FAILED", error: safeErr(e) };
        }
      })
    );

    const final = results.map((r) =>
      r.status === "fulfilled" ? r.value : { result: "PROMISE_REJECTED" }
    );

    return res.json({
      status: true,
      message: "Refresh Triggered SELL executions done",
      summary: { updated, skipped, failed },
      data: final,
    });
  } catch (err) {
    logError(req, err, { msg: "refreshTriggeredSellExecutions main failed" });
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: safeErr(err),
    });
  }
};


// Helper function to format date as "11 December 2025"
const formatDate = (date) => {
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return new Date(date).toLocaleDateString('en-GB', options);
};



export const getUsersPnlData = async (req, res) => {
  try {
    // Check if date range is provided in req.body
    const dateRange = req.body;
    let startOfDay, endOfDay;

    // If date range is provided and valid, use it
    if (Array.isArray(dateRange) && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      startOfDay = new Date(dateRange[0]);
      endOfDay = new Date(dateRange[1]);
    }
    // Otherwise, default to today's date
    else {
      startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);

      endOfDay = new Date();
      endOfDay.setUTCHours(23, 59, 59, 999);
    }

    // Convert to ISO strings for database query
    const startISO = startOfDay.toISOString();
    const endISO = endOfDay.toISOString();

    console.log("Using date range:", { from: startISO, to: endISO });

    // 1️⃣ Fetch all orders within the date range
    const orders = await Order.findAll({
      where: {
        filltime: {
          [Op.between]: [startISO, endISO],
        },
      },
      raw: true,
    });

    if (!orders.length) {
      return res.json({
        status: false,
        message: `No orders found for the selected date range`,
        data: [],
      });
    }

    // 2️⃣ Group orders by userId and date
    const userDatePnlMap = new Map(); // Key: "userId_date", Value: { totalPnl, orderCount, userId, date }

    for (const order of orders) {
      if (!order.filltime) continue;

      const fillDate = new Date(order.filltime);
      const formattedDate = formatDate(fillDate);
      const userId = order.userId;
      const key = `${userId}_${formattedDate}`;
      const pnl = order.pnl || 0;

      if (!userDatePnlMap.has(key)) {
        userDatePnlMap.set(key, {
          userId,
          totalPnl: 0,
          orderCount: 0,
          date: formattedDate,
        });
      }

      const userDateData = userDatePnlMap.get(key);
      userDateData.totalPnl += pnl;
      userDateData.orderCount += 1;
    }

    // 3️⃣ Fetch user details for each userId
    const userIds = [...new Set(orders.map(order => order.userId))];
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ["id", "firstName", "lastName"],
      raw: true,
    });

    // Create a map for user details
    const userDetailsMap = new Map();
    users.forEach(user => {
      userDetailsMap.set(user.id, {
        firstname: user.firstName,
        lastname: user.lastName,
      });
    });

    // 4️⃣ Prepare response data
    const responseData = [];
    userDatePnlMap.forEach((value) => {
      const userDetails = userDetailsMap.get(value.userId);
      if (userDetails) {
        responseData.push({
          userId: value.userId,
          firstname: userDetails.firstname,
          lastname: userDetails.lastname,
          date: value.date,
          totalPnl: value.totalPnl,
        });
      }
    });

    // 5️⃣ Sort by date in descending order
    responseData.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA; // Sort in descending order
    });

    logSuccess(req, {
      msg: "PnL for all users fetched by date",
      dataCount: responseData.length,
    });

    return res.json({
      status: true,
      message: "PnL for all users by date fetched successfully",
      data: responseData,
    });
  } catch (err) {
    logError(req, err, { msg: "getUsersPnlData failed" });
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};


