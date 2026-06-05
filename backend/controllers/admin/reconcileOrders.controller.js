


import axios from "axios";
import { Op } from "sequelize";
import Order from "../../models/orderModel.js";
import User from "../../models/userModel.js";
import { logSuccess, logError } from "../../utils/loggerr.js";
import { getKiteClientForUserId } from "../../services/userKiteBrokerService.js";

logSuccess(null, { msg: "reconcileOrders module loaded" });

const safeErr = (e) => ({
  message: e?.message,
  status: e?.response?.status,
  data: e?.response?.data,
});

const normSym = (s) => String(s || "").toUpperCase().trim();

const toIso = (val) => {
  if (!val) return null;
  try {
    return new Date(val).toISOString();
  } catch {
    return null;
  }
};

const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const str = (v, d = "") => {
  if (v === null || v === undefined) return d;
  return String(v);
};

const isComplete = (s) => ["COMPLETE", "FILLED", "SUCCESS"].includes(String(s || "").toUpperCase());
const isPending = (s) => ["OPEN", "PENDING"].includes(String(s || "").toUpperCase());

const isStoplossVariety = (v) => String(v || "").toUpperCase() === "STOPLOSS";
const isRoboVariety = (v) => String(v || "").toUpperCase() === "ROBO";

// =======================================================
// Broker endpoints (AngelOne)
// =======================================================
const ANGEL_TRADEBOOK_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook";

// Optional (if you want signals); not required for SELL creation because trades are source of truth
const ANGEL_POSITION_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getPosition";

const angelHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-UserType": "USER",
  "X-SourceID": "WEB",
  "X-ClientLocalIP": process.env.CLIENT_LOCAL_IP || "127.0.0.1",
  "X-ClientPublicIP": process.env.CLIENT_PUBLIC_IP || "127.0.0.1",
  "X-MACAddress": process.env.MAC_Address || "00:00:00:00:00:00",
  "X-PrivateKey": process.env.PRIVATE_KEY,
});

// =======================================================
// Broker fetchers (raw)
// =======================================================
async function fetchAngelTradebook(user) {
  logSuccess(null, { msg: "Fetching AngelOne tradebook", userId: user?.id });

  const r = await axios.get(ANGEL_TRADEBOOK_URL, { headers: angelHeaders(user.authToken) });

  logSuccess(null, {
    msg: "AngelOne tradebook response received",
    userId: user?.id,
    status: r?.data?.status,
    hasData: Array.isArray(r?.data?.data),
    count: Array.isArray(r?.data?.data) ? r.data.data.length : 0,
  });

  const arr = r?.data?.data;
  if (r?.data?.status !== true || !Array.isArray(arr)) return [];
  return arr;
}

async function fetchAngelPositions(user) {
  logSuccess(null, { msg: "Fetching AngelOne positions", userId: user?.id });

  const r = await axios.get(ANGEL_POSITION_URL, { headers: angelHeaders(user.authToken) });

  logSuccess(null, {
    msg: "AngelOne positions response received",
    userId: user?.id,
    status: r?.data?.status,
    hasData: Array.isArray(r?.data?.data),
    count: Array.isArray(r?.data?.data) ? r.data.data.length : 0,
  });

  const arr = r?.data?.data;
  if (r?.data?.status !== true || !Array.isArray(arr)) return [];
  return arr;
}

async function fetchKiteTrades(userId) {
  logSuccess(null, { msg: "Fetching Kite trades", userId });

  const kite = await getKiteClientForUserId(userId);
  logSuccess(null, { msg: "Kite client ready for trades", userId });

  const trades = await kite.getTrades();

  logSuccess(null, {
    msg: "Kite trades fetched",
    userId,
    count: Array.isArray(trades) ? trades.length : 0,
  });

  return Array.isArray(trades) ? trades : [];
}

async function fetchKitePositions(userId) {
  logSuccess(null, { msg: "Fetching Kite positions", userId });

  const kite = await getKiteClientForUserId(userId);
  logSuccess(null, { msg: "Kite client ready for positions", userId });

  const pos = await kite.getPositions();

  logSuccess(null, {
    msg: "Kite positions fetched",
    userId,
    hasNet: Array.isArray(pos?.net),
    count: Array.isArray(pos?.net) ? pos.net.length : 0,
  });

  return Array.isArray(pos?.net) ? pos.net : [];
}

// =======================================================
// Normalize broker trades to one format
// =======================================================
function normalizeAngelTrade(t) {
  return {
    broker: "angelone",
    orderId: str(t.orderid),
    uniqueOrderId: str(t?.uniqueorderid || ""),
    tradeId: t?.fillid ? str(t?.fillid) : null,
    symbol: normSym(t.tradingsymbol || t.symbolname),
    side: normSym(t.transactiontype), // BUY/SELL
    qty: num(t.fillsize),
    price: num(t.fillprice),
    time: toIso(t.filltime),
    status: normSym(t.status || "COMPLETE"),
    exchange: str(t.exchange || ""),
    producttype: str(t.producttype || t.product || ""),
    ordertype: str(t.ordertype || ""),
    raw: t,
  };
}

function normalizeKiteTrade(t) {
  return {
    broker: "kite",
    orderId: str(t.order_id),
    uniqueOrderId: str(t.exchange_order_id || ""),
    tradeId: t.trade_id ? str(t.trade_id) : null,
    symbol: normSym(t.tradingsymbol),
    side: normSym(t.transaction_type),
    qty: num(t.quantity),
    price: num(t.average_price || t.price),
    time: toIso(t.fill_timestamp || t.exchange_timestamp),
    status: normSym(t.status || "COMPLETE"),
    exchange: str(t.exchange || ""),
    producttype: str(t.product || ""),
    raw: t,
  };
}

// Optional normalized positions (signals)
function normalizeAngelPosition(p) {
  return {
    broker: "angelone",
    symbol: normSym(p.tradingsymbol || p.symbolname),
    netQty: num(p.netqty ?? p.netQty ?? p.quantity ?? p.qty ?? 0),
  };
}
function normalizeKitePosition(p) {
  return {
    broker: "kite",
    symbol: normSym(p.tradingsymbol),
    netQty: num(p.quantity ?? 0),
  };
}

// =======================================================
// Aggregation helpers (partial fills -> weighted avg)
// =======================================================
function groupTradesByOrderId(trades) {
  logSuccess(null, { msg: "Grouping trades by orderId", tradesCount: Array.isArray(trades) ? trades.length : 0 });

  const map = new Map();
  for (const t of trades) {
    if (!t.orderId) continue;
    if (!map.has(t.orderId)) map.set(t.orderId, []);
    map.get(t.orderId).push(t);
  }

  logSuccess(null, { msg: "Trades grouped by orderId", groups: map.size });
  return map;
}

function aggregateTradeArray(arr) {
  const totalQty = arr.reduce((s, x) => s + num(x.qty), 0);
  const totalValue = arr.reduce((s, x) => s + num(x.price) * num(x.qty), 0);
  const avgPrice = totalQty ? totalValue / totalQty : 0;
  const first = arr[0];
  return { totalQty, totalValue, avgPrice, first };
}

// =======================================================
// Local BUY matcher (baseline)
// - For ROBO/manual sells: link SELL to this BUY
// - Later you can replace with FIFO/remainingQty
// =======================================================
async function findBestOpenBuy({ userId, symbol }) {
  logSuccess(null, { msg: "Finding best OPEN BUY", userId, symbol });

  const buy = await Order.findOne({
    where: {
      userId,
      transactiontype: "BUY",
      orderstatuslocaldb: "OPEN",
      status: "COMPLETE",
      positionStatus: "OPEN",
      tradingsymbol: symbol,
    },
    order: [["createdAt", "DESC"]],
    raw: true,
  });

  logSuccess(null, {
    msg: "Best OPEN BUY lookup done",
    userId,
    symbol,
    found: !!buy,
    buyOrderId: buy?.orderid || null,
    buyDbId: buy?.id || null,
  });

  return buy;
}

// =======================================================
// Scenario 1: Update existing local SELL (STOPLOSS / SL-M) when executed
// - Works for any local order (BUY/SELL) whose orderid exists in broker trades
// - You will call this primarily for STOPLOSS SELL orders
// =======================================================
async function updateExistingLocalOrdersFromTrades({
  userId,
  localOrdersToUpdate, // usually pending sells in STOPLOSS flow
  tradesByOrderId,
}) {
  try {
    logSuccess(null, {
      msg: "updateExistingLocalOrdersFromTrades started",
      userId,
      localOrdersCount: Array.isArray(localOrdersToUpdate) ? localOrdersToUpdate.length : 0,
      tradeGroups: tradesByOrderId?.size || 0,
    });

    let updated = 0;
    let skipped = 0;
    const rows = [];

    for (const o of localOrdersToUpdate) {
      logSuccess(null, {
        msg: "Evaluating local order for trade match",
        userId,
        localOrderDbId: o?.id,
        localOrderid: o?.orderid,
        transactiontype: o?.transactiontype,
        status: o?.status,
      });

      const oid = str(o.orderid || "");
      if (!oid) {
        skipped++;
        rows.push({ orderDbId: o.id, result: "SKIP_NO_ORDERID" });
        logSuccess(null, { msg: "Skipped: local order has no orderid", userId, localOrderDbId: o?.id });
        continue;
      }

      const matched = tradesByOrderId.get(oid) || [];
      if (!matched.length) {
        skipped++;
        rows.push({ orderDbId: o.id, orderid: oid, result: "NOT_EXECUTED_YET" });
        logSuccess(null, { msg: "Not executed yet: no trades found for orderid", userId, orderid: oid, localOrderDbId: o?.id });
        continue;
      }

      logSuccess(null, { msg: "Broker trades matched with local order", userId, orderid: oid, matchedTrades: matched.length });

      const { totalQty, totalValue, avgPrice, first } = aggregateTradeArray(matched);

      logSuccess(null, { msg: "Aggregated trades computed", userId, orderid: oid, totalQty, totalValue, avgPrice });

      // pnl if linked BUY exists
      let pnl = null;
      let buyOrder = null;

      if (normSym(o.transactiontype) === "SELL") {
        const buyOrderId = o.buyOrderId || o.buyorderid || null;

        logSuccess(null, { msg: "SELL order detected, trying to find linked BUY order", userId, orderid: oid, buyOrderId });

        if (buyOrderId) {
          buyOrder = await Order.findOne({ where: { userId, orderid: buyOrderId }, raw: true });
        }

        logSuccess(null, {
          msg: "Linked BUY lookup done for SELL",
          userId,
          orderid: oid,
          buyOrderFound: !!buyOrder,
          buyDbId: buyOrder?.id || null,
        });

        if (buyOrder) {
          const buyPrice = num(buyOrder.fillprice || buyOrder.price || 0);
          pnl = avgPrice * totalQty - buyPrice * totalQty;

          logSuccess(null, {
            msg: "PNL computed for SELL",
            userId,
            orderid: oid,
            buyPrice,
            sellAvgPrice: avgPrice,
            qty: totalQty,
            pnl,
          });
        }
      }

      let fillTimeISO;

      if (buyOrder.broker === "kite") {
        fillTimeISO = first.raw.fill_timestamp || first.fill_timestamp || null;
        logSuccess(null, { msg: "Fill time derived for KITE", userId, orderid: oid, fillTimeISO });
      } else if (buyOrder.broker === "angelone") {
        const createdAtDate = new Date(buyOrder.createdAt);
        const [h, m, s] = String(first.raw.filltime).split(":");
        createdAtDate.setHours(Number(h), Number(m), Number(s), 0);
        fillTimeISO = createdAtDate.toISOString();

        logSuccess(null, { msg: "Fill time derived for ANGELONE", userId, orderid: oid, fillTimeISO });
      } else {
        fillTimeISO = null;
        logSuccess(null, { msg: "Fill time not derived (unknown broker)", userId, orderid: oid, broker: buyOrder?.broker });
      }

      logSuccess(null, { msg: "Updating local Order row from trade aggregation", userId, localOrderDbId: o?.id, orderid: oid });

      await Order.update(
        {
          fillid: first.tradeId || o.fillid || null,
          filltime: fillTimeISO || o.filltime || null,
          fillprice: avgPrice,
          fillsize: totalQty,
          tradedValue: totalValue,
          price: avgPrice,
          status: "COMPLETE",
          orderstatus: "COMPLETE",
          positionStatus: "COMPLETE",
          buyTime: buyOrder.filltime,
          buyprice: buyOrder.fillprice,
          buysize: buyOrder.fillsize,
          buyvalue: buyOrder.tradedValue,
          text: "UPDATE DONE",
          orderstatuslocaldb: normSym(o.transactiontype) === "SELL" ? "COMPLETE" : "OPEN",
          pnl: pnl ?? o.pnl,
        },
        { where: { id: o.id } }
      );

      logSuccess(null, { msg: "Local order updated successfully", userId, localOrderDbId: o?.id, orderid: oid });

      // If SELL completed, close BUY
      if (normSym(o.transactiontype) === "SELL" && buyOrder) {
        logSuccess(null, { msg: "Closing linked BUY because SELL completed", userId, buyDbId: buyOrder?.id, buyOrderId: buyOrder?.orderid });

        await Order.update(
          {
            orderstatuslocaldb: "COMPLETE",
            positionStatus: "COMPLETE",
          },
          { where: { id: buyOrder.id } }
        );

        logSuccess(null, { msg: "Linked BUY closed", userId, buyDbId: buyOrder?.id, buyOrderId: buyOrder?.orderid });
      }

      updated++;
      rows.push({
        orderDbId: o.id,
        orderid: oid,
        result: "UPDATED_FROM_TRADES",
        avgPrice,
        totalQty,
        pnl,
      });

      logSuccess(null, { msg: "Row processed in updateExistingLocalOrdersFromTrades", userId, localOrderDbId: o?.id, updated, skipped });
    }

    logSuccess(null, {
      msg: "updateExistingLocalOrdersFromTrades completed",
      userId,
      updated,
      skipped,
      rowsCount: rows.length,
    });

    return { updated, skipped, rows };
  } catch (err) {
    console.log(err, "===========updateExistingLocalOrdersFromTrades=======");
    logError(null, err, {
      msg: "updateExistingLocalOrdersFromTrades crashed",
      userId,
      error: safeErr(err),
    });
  }
}

// =======================================================
async function createNewSellOrdersFromBrokerTrades({
  user,
  normalizedTrades,
  mode, // "ROBO" | "MANUAL" | "AUTO"
}) {


  logSuccess(null, {
    msg: "createNewSellOrdersFromBrokerTrades started",
    userId: user?.id,
    broker: user?.brokerName,
    mode,
    tradesCount: Array.isArray(normalizedTrades) ? normalizedTrades.length : 0,
  });


   console.log('=================normalizedTrades==================',normalizedTrades);
   

  const completeSells = normalizedTrades.filter(
    (t) => t.side === "SELL" && t.orderId && isComplete(t.status)
  );

  logSuccess(null, {
    msg: "Filtered complete SELL trades",
    userId: user?.id,
    mode,
    completeSellsCount: Array.isArray(completeSells) ? completeSells.length : 0,
  });

  if (!completeSells.length) {
    logSuccess(null, { msg: "No complete SELL trades found, exiting", userId: user?.id, mode });
    return { inserted: 0, skipped: 0, closedBuys: 0, rows: [] };
  }

  // aggregate sells by orderId
  const byOrder = groupTradesByOrderId(completeSells);

  logSuccess(null, { msg: "Aggregating SELL trades by orderId", userId: user?.id, orders: byOrder.size });


  console.log('=======================completeSells============',completeSells);
  

  const aggregated = [];
  for (const [orderId, arr] of byOrder.entries()) {
    const { totalQty, totalValue, avgPrice, first } = aggregateTradeArray(arr);
    aggregated.push({
      ...first,
      orderId,
      qty: totalQty,
      tradedValue: totalValue,
      price: avgPrice,
      trades: arr,
    });
  }

  logSuccess(null, { msg: "Aggregation complete", userId: user?.id, aggregatedCount: aggregated.length });

  // existing SELL orderids in localdb
  const orderIds = aggregated.map((x) => x.orderId);

  logSuccess(null, { msg: "Checking existing SELLs in local DB", userId: user?.id, orderIdsCount: orderIds.length });

  const existing = await Order.findAll({
    where: {
      userId: user.id,
      transactiontype: "SELL",
      orderid: { [Op.in]: orderIds },
    },
    attributes: ["orderid"],
    raw: true,
  });

  const existsSet = new Set(existing.map((e) => str(e.orderid)));

  logSuccess(null, { msg: "Existing SELL check done", userId: user?.id, existingCount: existing.length });

  let inserted = 0;
  let skipped = 0;
  let closedBuys = 0;
  const rows = [];

  for (const s of aggregated) {
    logSuccess(null, { msg: "Processing aggregated SELL", userId: user?.id, orderid: s?.orderId, symbol: s?.symbol, qty: s?.qty });

    if (existsSet.has(str(s.orderId))) {
      skipped++;
      rows.push({ orderid: s.orderId, symbol: s.symbol, result: "ALREADY_EXISTS" });
      logSuccess(null, { msg: "Skipped SELL: already exists", userId: user?.id, orderid: s?.orderId });
      continue;
    }

    // Link to best open BUY
    const buy = await findBestOpenBuy({ userId: user.id, symbol: s.symbol });

    const buyPrice = num(buy?.fillprice || buy?.price || 0);
    const pnl = buy ? num(s.price) * num(s.qty) - buyPrice * num(s.qty) : null;

    logSuccess(null, {
      msg: "BUY link + PNL prepared for SELL insert",
      userId: user?.id,
      orderid: s?.orderId,
      buyFound: !!buy,
      buyOrderId: buy?.orderid || null,
      buyPrice,
      sellPrice: s?.price,
      qty: s?.qty,
      pnl,
    });

    let fillTimeISO;

    if (buy?.broker === "kite") {
      fillTimeISO = first.raw.fill_timestamp || first.fill_timestamp || null;
      logSuccess(null, { msg: "Fill time derived for KITE (manual sell)", userId: user?.id, orderid: s?.orderId, fillTimeISO });
    } else if (buy?.broker === "angelone") {
      const createdAtDate = new Date(buy.createdAt);
      const [h, m, s2] = String(first.raw.filltime).split(":");
      createdAtDate.setHours(Number(h), Number(m), Number(s2), 0);
      fillTimeISO = createdAtDate.toISOString();
      logSuccess(null, { msg: "Fill time derived for ANGELONE (manual sell)", userId: user?.id, orderid: s?.orderId, fillTimeISO });
    } else {
      fillTimeISO = null;
      logSuccess(null, { msg: "Fill time not derived (manual sell)", userId: user?.id, orderid: s?.orderId, broker: buy?.broker });
    }

    logSuccess(null, { msg: "Creating local SELL order", userId: user?.id, orderid: s?.orderId });

    const created = await Order.create({
      userId: user.id,
      userNameId: user.username,
      broker: user.brokerName || s.broker,
      transactiontype: "SELL",
      tradingsymbol: s.symbol,
      symboltoken: buy.symboltoken,
      instrumenttype: buy.instrumenttype,
      angelOneToken: buy.symboltoken,
      angelOneSymbol: buy.angelOneSymbol,
      strategyName: buy.strategyName,
      strategyUniqueId: buy.strategyUniqueId,
      strategyName: buy.strategyName,
      orderid: s.orderId,
      uniqueorderid: s.uniqueOrderId || null,
      exchangeorderid: s.exchangeOrderId || null,
      fillid: s.tradeId || null,

      // fills
      filltime: fillTimeISO || null,
      fillprice: num(s.price),
      fillsize: String(s.qty),
      tradedValue: num(s.tradedValue),
      price: num(s.price),
      variety: buy?.variety || null,
      producttype: s.producttype || buy?.producttype || null,
      ordertype: s.ordertype || buy?.ordertype || null,
      exchange: s.exchange || buy?.exchange || null,
      status: "COMPLETE",
      positionStatus: "COMPLETE",
      orderstatuslocaldb: "COMPLETE",
      text: "MANUAL SELL detected from broker",
      buyOrderId: buy?.orderid || null,
      buyTime: buy?.filltime || null,
      buyprice: buy ? buyPrice : null,
      buysize: buy ? String(s.qty) : null,
      buyvalue: buy ? buyPrice * num(s.qty) : null,
      pnl: pnl ?? null,
    });

    inserted++;
    rows.push({
      sellDbId: created.id,
      orderid: s.orderId,
      symbol: s.symbol,
      qty: s.qty,
      sellPrice: s.price,
      pnl,
      linkedBuyOrderId: buy?.orderid || null,
      mode,
    });

    logSuccess(null, {
      msg: "Local SELL created successfully",
      userId: user?.id,
      sellDbId: created?.id,
      orderid: s?.orderId,
      inserted,
      skipped,
    });

    // Close BUY (baseline). Replace with remaining qty if you support partial exits.
    if (buy) {
      logSuccess(null, { msg: "Closing linked BUY after manual SELL insert", userId: user?.id, buyDbId: buy?.id, buyOrderId: buy?.orderid });

      await Order.update({ orderstatuslocaldb: "COMPLETE", positionStatus: "COMPLETE" }, { where: { id: buy.id } });
      closedBuys++;

      logSuccess(null, { msg: "Linked BUY closed after manual SELL insert", userId: user?.id, buyDbId: buy?.id, closedBuys });
    }
  }

  logSuccess(null, { msg: "createNewSellOrdersFromBrokerTrades completed", userId: user?.id, mode, inserted, skipped, closedBuys });

  return { inserted, skipped, closedBuys, rows };
}

// =======================================================
// Fetch + normalize broker data for a user (once)
// =======================================================
async function fetchNormalizedBrokerData(user) {
  
  const brokerName = String(user.brokerName || "").toLowerCase();

  logSuccess(null, { msg: "fetchNormalizedBrokerData started", userId: user?.id, brokerName });

  if (brokerName === "angelone") {
    if (!user.authToken) throw new Error("AngelOne authToken missing");

    logSuccess(null, { msg: "AngelOne broker selected, fetching tradebook+positions", userId: user?.id });

    const [rawTrades, rawPos] = await Promise.all([
      fetchAngelTradebook(user),
      fetchAngelPositions(user).catch(() => []), // optional
    ]);

    logSuccess(null, {
      msg: "AngelOne raw data fetched",
      userId: user?.id,
      tradesCount: Array.isArray(rawTrades) ? rawTrades.length : 0,
      positionsCount: Array.isArray(rawPos) ? rawPos.length : 0,
    });

    const trades = rawTrades.map(normalizeAngelTrade);
    const positions = rawPos.map(normalizeAngelPosition);

    logSuccess(null, {
      msg: "AngelOne data normalized",
      userId: user?.id,
      tradesCount: trades.length,
      positionsCount: positions.length,
    });

    return {
      brokerName,
      trades,
      positions,
    };
  }

  if (brokerName === "kite") {
    logSuccess(null, { msg: "Kite broker selected, fetching trades+positions", userId: user?.id });

    const [rawTrades, rawPos] = await Promise.all([
      fetchKiteTrades(user.id),
      fetchKitePositions(user.id).catch(() => []),
    ]);

    logSuccess(null, {
      msg: "Kite raw data fetched",
      userId: user?.id,
      tradesCount: Array.isArray(rawTrades) ? rawTrades.length : 0,
      positionsCount: Array.isArray(rawPos) ? rawPos.length : 0,
    });

    const trades = rawTrades.map(normalizeKiteTrade);
    const positions = rawPos.map(normalizeKitePosition);

    logSuccess(null, {
      msg: "Kite data normalized",
      userId: user?.id,
      tradesCount: trades.length,
      positionsCount: positions.length,
    });

    return {
      brokerName,
      trades,
      positions,
    };
  }

  logError(null, new Error(`Unsupported broker: ${brokerName}`), { msg: "fetchNormalizedBrokerData unsupported broker", userId: user?.id, brokerName });
  throw new Error(`Unsupported broker: ${brokerName}`);
}

// =======================================================
// MAIN API: one call handles all three scenarios
// =======================================================
export const reconcileOrdersAllScenarios = async (req, res) => {
  try {
    logSuccess(req, { msg: "Reconcile started" });
    logSuccess(req, { msg: "Loading local candidate orders from DB" });

    const localOpen = await Order.findAll({
      where: {
        orderstatuslocaldb: { [Op.in]: ["OPEN", "PENDING"] },
        [Op.or]: [
          // Pending sells need updates
          { transactiontype: "SELL", status: { [Op.in]: ["OPEN", "PENDING"] } },
          // Open buys (for ROBO/manual detection)
          { transactiontype: "BUY", status: { [Op.in]: ["OPEN", "PENDING", "COMPLETE"] } },

          // Pending buy need updates
          // { transactiontype: "BUY", status: { [Op.in]: ["OPEN", "PENDING",] } },
        ],
      },
      raw: true,
    });



    console.log('===========================localDB============',localOpen);
    
    logSuccess(req, { msg: "Local candidate orders fetched", count: localOpen.length });

    if (!localOpen.length) {
      logSuccess(req, { msg: "No candidate local orders found - exiting" });

      return res.json({
        status: true,
        message: "No candidate local orders found",
        summary: { users: 0, stoplossUpdated: 0, roboSellInserted: 0, manualSellInserted: 0, skipped: 0, failed: 0 },
        data: [],
      });
    }

    const userIds = [...new Set(localOpen.map((o) => o.userId))];

    logSuccess(req, { msg: "Distinct userIds collected from candidates", usersCount: userIds.length, userIds });

    const users = await User.findAll({ where: { id: userIds }, raw: true });

    logSuccess(req, { msg: "Users fetched for reconciliation", fetchedUsers: users.length });

    const userMap = new Map(users.map((u) => [u.id, u]));

    logSuccess(req, { msg: "User map created", mapSize: userMap.size });

    // Result counters
    let stoplossUpdated = 0;
    let manualSellInserted = 0;
    let failed = 0;

    const data = [];

    // caches broker data
    const brokerCache = new Map(); // userId -> {brokerName,trades,positions}
    logSuccess(req, { msg: "Broker cache initialized" });

    for (const userId of userIds) {
      logSuccess(req, { msg: "Reconciling user started", userId });

      const user = userMap.get(userId);
      logSuccess(req, { msg: "User resolved from map", userId, userFound: !!user });

      // user local orders
      const userLocal = localOpen.filter((x) => x.userId === userId);
      logSuccess(req, { msg: "User local candidate orders prepared", userId, userLocalCount: userLocal.length });

      // fetch broker data once
      let brokerData;
      try {
        brokerData = brokerCache.get(userId);
        logSuccess(req, { msg: "Broker cache lookup", userId, cacheHit: !!brokerData });

        if (!brokerData) {
          logSuccess(req, { msg: "Fetching broker data (cache miss)", userId, brokerName: user?.brokerName });

          brokerData = await fetchNormalizedBrokerData(user);

          console.log('===========================brokerData============',brokerData);


          brokerCache.set(userId, brokerData);

          logSuccess(req, {
            msg: "Broker data cached",
            userId,
            broker: brokerData?.brokerName,
            tradesCount: brokerData?.trades?.length || 0,
            positionsCount: brokerData?.positions?.length || 0,
          });
        }
      } catch (e) {
        failed++;
        logError(req, e, { msg: "FAILED_FETCH_BROKER_DATA", userId, error: safeErr(e) });
        data.push({ userId, result: "FAILED_FETCH_BROKER_DATA", error: safeErr(e) });
        continue;
      }

      const tradesByOrderId = await groupTradesByOrderId(brokerData.trades);


      console.log('===================tradesByOrderId===================',tradesByOrderId);
      

      logSuccess(req, {
        msg: "Trades grouped for user",
        userId,
        broker: brokerData?.brokerName,
        tradeGroups: tradesByOrderId?.size || 0,
        tradesCount: brokerData?.trades?.length || 0,
      });

      // ---------------------------------------------------
      // A) STOPLOSS updates: existing pending SELL with variety STOPLOSS OR any pending SELL
      //    You asked specifically: variety STOPLOSS -> update fill + pnl by orderid.
      // ---------------------------------------------------
      const stoplossSells = userLocal.filter(
        (o) =>
          normSym(o.transactiontype) === "SELL" &&
          isPending(o.status) &&
          (isStoplossVariety(o.variety) || true) // keep true so it updates any pending SELL too
      );

      logSuccess(req, { msg: "Stoploss/pending SELL candidates prepared", userId, count: stoplossSells.length });

      try {
        const upd = await updateExistingLocalOrdersFromTrades({
          userId,
          localOrdersToUpdate: stoplossSells,
          tradesByOrderId,
        });

        // console.log("===========================updated=====================", upd);

        logSuccess(req, {
          msg: "STOPLOSS_OR_PENDING_SELL_UPDATED",
          userId,
          broker: brokerData?.brokerName,
          updated: upd?.updated,
          skipped: upd?.skipped,
          rowsCount: upd?.rows?.length || 0,
        });

        stoplossUpdated += upd.updated;
        data.push({ userId, broker: brokerData.brokerName, result: "STOPLOSS_OR_PENDING_SELL_UPDATED", ...upd });
      } catch (e) {
        failed++;
        logError(req, e, { msg: "FAILED_STOPLOSS_UPDATE", userId, error: safeErr(e) });
        data.push({ userId, result: "FAILED_STOPLOSS_UPDATE", error: safeErr(e) });
      }


      console.log('=====================userLocal================',userLocal);
      

      // ---------------------------------------------------
      // B) MANUAL/DEMAT SELL: user sold from broker app
      //    Rule: if user has ANY open BUY complete (normal), create missing SELL(s) from broker trades
      // ---------------------------------------------------
      const normalOpenBuys = userLocal.filter(
        (o) =>
          normSym(o.transactiontype) === "BUY" &&
          isComplete(o.status) &&
          !isRoboVariety(o.variety) // normal/stoploss buy etc
      );



      // console.log('======================normalOpenBuys===================',normalOpenBuys);
      

      logSuccess(req, { msg: "Normal OPEN BUY candidates checked for manual SELL detection", userId, count: normalOpenBuys.length });

      if (normalOpenBuys.length) {
        try {
          logSuccess(req, { msg: "Starting manual SELL creation from broker trades", userId, broker: brokerData?.brokerName });

          const createdManual = await createNewSellOrdersFromBrokerTrades({
            user,
            normalizedTrades: brokerData.trades,
            mode: "MANUAL",
          });

          manualSellInserted += createdManual.inserted;

          logSuccess(req, {
            msg: "MANUAL_SELL_CREATED",
            userId,
            broker: brokerData?.brokerName,
            inserted: createdManual?.inserted,
            skipped: createdManual?.skipped,
            closedBuys: createdManual?.closedBuys,
            rowsCount: createdManual?.rows?.length || 0,
          });

          data.push({ userId, broker: brokerData.brokerName, result: "MANUAL_SELL_CREATED", ...createdManual });
        } catch (e) {
          failed++;
          logError(req, e, { msg: "FAILED_MANUAL_SELL_CREATE", userId, error: safeErr(e) });
          data.push({ userId, result: "FAILED_MANUAL_SELL_CREATE", error: safeErr(e) });
        }
      }

      logSuccess(req, { msg: "Reconciling user completed", userId });
    }

    logSuccess(req, {
      msg: "Reconcile completed (summary)",
      users: userIds.length,
      stoplossUpdated,
      manualSellInserted,
      failed,
    });

    return res.json({
      status: true,
      message: "Reconcile completed",
    });
  } catch (e) {
    logError(req, e, { msg: "reconcileOrdersAllScenarios failed" });
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: safeErr(e),
    });
  }
};


