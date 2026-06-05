import { logSuccess, logError } from "../../../utils/loggerr.js";
import Order from "../../../models/orderModel.js"
import axios from "axios";


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


const ANGEL_HOLDINGS_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/portfolio/v1/getAllHolding";

const fetchAngelHoldings = async (token) => {
  const response = await axios.get(
    ANGEL_HOLDINGS_URL,
    { headers: angelHeaders(token) }
  );
  return response.data?.data || [];
};

const ANGEL_ORDERBOOK_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getOrderBook";

const fetchAngelOrderBook = async (token) => {
  const response = await axios.get(
    ANGEL_ORDERBOOK_URL,
    { headers: angelHeaders(token) }
  );

  return response.data?.data || [];
};

const calculatePNL = ({ buyPrice, sellPrice, qty }) => {
  return (sellPrice - buyPrice) * qty;
};


export const angelTradeWebhookController = async (req, res) => {
  try {

    logSuccess("Angel SELL Webhook Hit", req.body);

    const {
      transactiontype,
      tradingsymbol,
      status,
      orderstatus,
      clientcode,
      averageprice,
      filledshares,
      ordertag
    } = req.body;

    // Ignore anything other than COMPLETE SELL
    if (transactiontype !== "SELL" || (status !== "complete" && orderstatus !== "complete")) {
      logSuccess("Ignoring non-complete SELL webhook", { tradingsymbol, ordertag });
      return res.json({ success: true });
    }

    // STEP 1: Find OPEN BUY from our software
    const openBuys = await Order.findAll({
      broker: "angelone",
      tradingsymbol,
      clientcode,
      transactiontype: "BUY",
      status: "OPEN",
      ordertag: "softwaresetu",
    });

    const accessToken = openBuys[0]?.accessToken || req.body.accessToken;

    // STEP 2: Fetch Broker data
    const [orderBook, holdings] = await Promise.all([
      fetchAngelOrderBook(accessToken),
      fetchAngelHoldings(accessToken),
    ]);

    // STEP 3: Calculate Broker BUY/SELL qty
    let todayBuyQty = 0;
    let todaySellQty = 0;

    orderBook.forEach((o) => {
      if (o.tradingsymbol === tradingsymbol && o.status === "complete") {
        if (o.transactiontype === "BUY" && o.ordertag === "softwaresetu") todayBuyQty += Number(o.filledshares || 0);
        if (o.transactiontype === "SELL" && o.ordertag === "softwaresetu") todaySellQty += Number(o.filledshares || 0);
      }
    });

    // STEP 4: Check holdings for previous positions
    const holding = holdings.find(h => h.tradingsymbol === tradingsymbol);
    const holdingQty = holding ? Number(holding.quantity || 0) : 0;

    logSuccess("Position Snapshot", { todayBuyQty, todaySellQty, holdingQty, ordertag });

    // STEP 5: Decide if SELL is our software or user holding
    let isOurSell = false;

    if (ordertag === "softwaresetu") {
      // Our software sell (auto / manual)
      isOurSell = true;
    } else if (openBuys.length > 0 && todaySellQty >= todayBuyQty) {
      // SELL matches today's BUY → treat as our software closing
      isOurSell = true;
    } else if (!openBuys.length && holdingQty === 0) {
      // SELL matches old holding → treat as user's closing
      isOurSell = true;
    }

    if (!isOurSell) {
      logSuccess("SELL webhook ignored, not our order", { tradingsymbol, ordertag });
      return res.json({ success: true });
    }

    // STEP 6: Update DB
    if (openBuys.length) {
      for (const buy of openBuys) {

        const pnl = calculatePNL({ buyPrice: buy.price, sellPrice: averageprice, qty: filledshares });

        await Order.update({ status: "COMPLETE" }, { where: { id: buy.id } });

        await Order.create({
          broker: "angelone",
          tradingsymbol,
          transactiontype: "SELL",
          status: "COMPLETE",
          qty: filledshares,
          price: averageprice,
          pnl,
          clientcode,
          ordertag: "softwaresetu",
          source: "manual/sell/webhook",
        });
      }
      logSuccess("Today BUY closed, DB updated", { tradingsymbol });
    } else {
        
      await Order.create({
        broker: "angelone",
        tradingsymbol,
        transactiontype: "SELL",
        status: "COMPLETE",
        qty: filledshares,
        price: averageprice,
        pnl: 0,
        clientcode,
        ordertag: "manual-holding-sell",
        source: "holding",
      });
      logSuccess("Yesterday holding sold, DB updated", { tradingsymbol });
    }

    return res.json({ success: true });

  } catch (error) {
    logError("Angel webhook failed", error);
    return res.status(500).json({ success: false });
  }
};





export const kiteTradeWebhookController = async (req, res) => {
  try {

    logSuccess("Kite Webhook hit", {
      headers: req.headers
    });

    const payload = req.body;
    logSuccess("Kite webhook payload received", payload);

    
  } catch (error) {
    logError("Error in Kite webhook controller", {
      error: error.message,
      stack: error.stack
    });

    return res.status(500).json({ success: false });
  }
};


export const angelTradeWebhookController121 = async (req, res) => {
  try {

    logSuccess("Angel SELL Webhook Hit", req.body);

    const {
      transactiontype,
      tradingsymbol,
      status,
      orderstatus,
      clientcode,
      averageprice,
      filledshares,
    } = req.body;

    if (
      transactiontype !== "SELL" ||
      (status !== "complete" && orderstatus !== "complete"&&ordertag!=="softwaresetu")
    ) {
      return res.json({ success: true });
    }

    /* ================== STEP 1: Find OPEN BUY (Software Orders) ================== */
    const openBuys = await Order.findAll({
      broker: "angelone",
      tradingsymbol,
      clientcode,
      transactiontype: "BUY",
      status: "OPEN",
      ordertag: "softwaresetu",
    });

    const accessToken =
      openBuys[0]?.accessToken || req.body.accessToken;

    /* ================== STEP 2: Fetch Broker Data ================== */
    const [orderBook, holdings] = await Promise.all([
      fetchAngelOrderBook(accessToken),
      fetchAngelHoldings(accessToken),
    ]);

    /* ================== STEP 3: Calculate Today's Broker Qty ================== */
    let todayBuyQty = 0;
    let todaySellQty = 0;

    orderBook.forEach((o) => {
      if (
        o.tradingsymbol === tradingsymbol &&
        o.status === "complete"
      ) {
        if (o.transactiontype === "BUY") {
          todayBuyQty += Number(o.filledshares || 0);
        }
        if (o.transactiontype === "SELL") {
          todaySellQty += Number(o.filledshares || 0);
        }
      }
    });

    /* ================== STEP 4: Holdings Qty ================== */
    const holding = holdings.find(
      (h) => h.tradingsymbol === tradingsymbol
    );

    const holdingQty = holding ? Number(holding.quantity || 0) : 0;

    logSuccess("Position Snapshot", {
      todayBuyQty,
      todaySellQty,
      holdingQty,
    });

    /* ================== SCENARIO DECISION ================== */

    /* ---------- SCENARIO 1: Today BUY → SELL ---------- */
    if (openBuys.length && todaySellQty >= todayBuyQty) {

      for (const buy of openBuys) {

        const pnl = calculatePNL({
          buyPrice: buy.price,
          sellPrice: averageprice,
          qty: filledshares,
        });

        await Order.update(
          { status: "COMPLETE" },
          { where: { id: buy.id } }
        );

        await Order.create({
          broker: "angelone",
          tradingsymbol,
          transactiontype: "SELL",
          status: "COMPLETE",
          qty: filledshares,
          price: averageprice,
          pnl,
          clientcode,
          ordertag: "softwaresetu",
          source: "manual/sell/webhook",
        });
      }

      logSuccess("Scenario-1 handled (Today BUY closed)");
      return res.json({ success: true });
    }

    /* ---------- SCENARIO 2: Yesterday Holding SELL ---------- */
    if (!openBuys.length && holdingQty === 0) {

      await Order.create({
        broker: "angelone",
        tradingsymbol,
        transactiontype: "SELL",
        status: "COMPLETE",
        qty: filledshares,
        price: averageprice,
        pnl: 0, // buy price unknown (yesterday)
        clientcode,
        ordertag: "manual-holding-sell",
        source: "holding",
      });

      logSuccess("Scenario-2 handled (Holding exited)");

      return res.json({ success: true });
    }

    logSuccess("Position still open, no DB sync needed");

    return res.json({ success: true });

  } catch (error) {

    logError("Angel webhook failed", error);

    return res.status(500).json({ success: false });
  }
};