import axios from "axios";
import querystring from "querystring";
import Order from "../models/orderModel.js";
import zlib from "zlib";
import redis from "../utils/redis.js";  // your redis client
import { UPSTOX_CONFIG } from "../utils/upstox.config.js";
import User from "../models/userModel.js";



// Upstox Instruments JSON (gzipped) - as per official docs
const UPSTOX_INSTRUMENT_URLS = {
  COMPLETE: "https://assets.upstox.com/market-quote/instruments/exchange/complete.json.gz",
  NSE: "https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz",
  BSE: "https://assets.upstox.com/market-quote/instruments/exchange/BSE.json.gz",
  MCX: "https://assets.upstox.com/market-quote/instruments/exchange/MCX.json.gz",
};

const TEN_HOURS_IN_SECONDS = 36000;

// helper: download + gunzip + parse json
async function fetchUpstoxJsonGz(url) {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 180000,
    headers: {
      // some CDNs behave better with these
      "Accept-Encoding": "gzip, deflate, br",
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0",
    },
  });

  const gzBuffer = Buffer.from(res.data);
  const jsonText = zlib.gunzipSync(gzBuffer).toString("utf-8");
  return JSON.parse(jsonText);
}

export const getUpstoxInstruments = async (req, res) => {
  const exch = String(req.query.exch || "NSE").toUpperCase();

  if (!UPSTOX_INSTRUMENT_URLS[exch]) {
    return res.status(400).json({
      status: false,
      message: `Invalid exch '${exch}'. Use COMPLETE, NSE, BSE, MCX`,
    });
  }

  const REDIS_KEY = `upstox_instruments_${exch}`;

  try {
    // 1) cache
    const cached = await redis.get(REDIS_KEY);
    if (cached) {
      return res.json({
        status: true,
        exch,
        cache: true,
        count: JSON.parse(cached)?.length || 0,
        data: JSON.parse(cached),
      });
    }

    // 2) fetch
    const url = UPSTOX_INSTRUMENT_URLS[exch];
    const data = await fetchUpstoxJsonGz(url);

    // 3) cache
    await redis.set(REDIS_KEY, JSON.stringify(data), "EX", TEN_HOURS_IN_SECONDS);

    return res.json({
      status: true,
      exch,
      cache: false,
      count: Array.isArray(data) ? data.length : 0,
      data,
    });
  } catch (err) {
    console.error("Upstox instruments error:", err?.message, err?.response?.status);

    return res.status(500).json({
      status: false,
      message: "Failed to fetch Upstox instruments",
      error: err?.message,
      statusCode: err?.response?.status,
    });
  }
};



export const generateUpstoxAuthUrl = (req, res) => {

  const UPSTOX_API_KEY = process.env.UPSTOX_API_KEY;
  
  const UPSTOX_REDIRECT_URI = process.env.UPSTOX_REDIRECT_URI;

  const authUrl = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${UPSTOX_API_KEY}&redirect_uri=${UPSTOX_REDIRECT_URI}`;

  // Send the URL to the frontend
  res.json({brokerName:'upstox', authUrl });
};


export const upStoxCallback = async (req, res) => {

  const code = req.query.code;
  const apiKey = process.env.UPSTOX_API_KEY;
  const apiSecret = process.env.UPSTOX_API_SECRET;
  const redirectUri = process.env.UPSTOX_REDIRECT_URI;

  try {
    const response = await axios.post(
      'https://api.upstox.com/v2/login/authorization/token',
      querystring.stringify({
        code,
        client_id: apiKey,
        client_secret: apiSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

     console.log(response.data,'response.data');

     const { email, access_token } = response.data;

     const user = await User.findOne({ where: { email } });

        if (!user) {
          
          return res.status(404).send("User does not exist");
        }

        await user.update({
          authToken: access_token,   // update token
          angelLoginUser:true,
          angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours
        });


    const accessToken = response.data.access_token;

      // Redirect and STOP loop by returning
      return res.redirect(
        `${process.env.FRONTEND_URL}/dashboard?access_token=${accessToken}`
      );
  } catch (error) {
    console.error('Error:', error.response.data);
    res.status(500).send('Authorization failed.');
  }
}

export const getUpstoxFunds = async (req, res) => {
  try {

    let accessToken =  req.headers.angelonetoken || UPSTOX_CONFIG.ACCESS_TOKEN;

    if (!accessToken) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Upstox access token missing",
      });
    }

    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    const baseURL = process.env.UPSTOX_URL;
    
    // 🔁 parallel calls
    const [fundsRes, ordersRes] = await Promise.all([
      axios.get(
        `${baseURL}/user/get-funds-and-margin?segment=SEC`,
        { headers }
      ),
      axios.get(
        `${baseURL}/order/retrieve-all`,
        { headers }
      ),
    ]);

    // console.log('==========UPSTOX fundsRes==========',fundsRes);
    // console.log('==========UPSTOX ordersRes==========',ordersRes);

    // 💰 Funds
    const equity = fundsRes.data?.data?.equity || {};
    const availableCash = equity.available_margin ?? 0;

      console.log('==========UPSTOX fundsRes==========',equity);


    // 📦 Orders
    let orders = Array.isArray(ordersRes.data)
      ? ordersRes.data
      : ordersRes.data?.data || [];

    orders.sort(
      (a, b) => new Date(b.order_timestamp) - new Date(a.order_timestamp)
    );

    const mappedOrders = orders.map((o) => ({
      tradingsymbol: o.tradingsymbol || o.trading_symbol,
      orderid: o.order_id,
      transactiontype: o.transaction_type,
      lotsize: o.quantity,
      averageprice: o.average_price,
      orderstatus: o.status,
      ordertime: o.order_timestamp,
    }));

    return res.json({
      status: true,
      statusCode: 200,
      message: "Upstox funds & orders fetched",
      environment: process.env.NODE_ENV, // 🔥 debugging ke liye
      data: {
        availablecash: availableCash,
      },
      totalOrders: mappedOrders,
      recentOrders: mappedOrders.slice(0, 5),
    });
  } catch (err) {
 
    return res.json({
      status: false,
      statusCode: 500,
      message: "Upstox API error",
      error: err?.response?.data || err.message,
    });
  }
};



export const getTradeDataForUpstoxDashboard = async function (req, res, next) {
  try {
    let totalBuyLength = 0;
    let newPnl = 0;

    // 🔐 1) Get Upstox access token from headers
    // Change header name if you prefer something else
    const upstoxToken = req.headers.upstoxaccesstoken;

    if (!upstoxToken) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Login in Broker Account (Upstox)",
        error: null,
      });
    }


    console.log(req.userId, "upstox trades");

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${upstoxToken}`,
    };

    // 2️⃣ Fetch trades for the day from Upstox
    const tradesRes = await axios.get(
      `${UPSTOX_TEST_BASE_URL}/order/trades/get-trades-for-day`,
      { headers }
    );

    // Upstox format: { status: "success", data: [ ...trades ] }
    let trades = tradesRes.data?.data || [];

    if (!Array.isArray(trades) || trades.length === 0) {
      return res.json({
        status: true,
        statusCode: 200,
        broker: "Upstox",
        message: "No Upstox trades found",
        data: [],
        pnl: 0,
        totalTraded: 0,
        totalOpen: 0,
      });
    }

    // ✅ Normalize fields so your existing PnL logic works as-is
    trades = trades.map((t) => ({
      ...t,
      tradingsymbol: t.tradingsymbol || t.trading_symbol,
      quantity: Number(t.quantity) || 0,
      average_price: Number(t.average_price) || 0,
    }));

    const toMoney = (n) => Math.round(n * 100) / 100;

    function calculatePnL(orders) {
      const grouped = {};

      for (const t of orders) {
        if (!grouped[t.tradingsymbol]) grouped[t.tradingsymbol] = [];
        grouped[t.tradingsymbol].push(t);
      }

      const results = [];

      for (const [symbol, list] of Object.entries(grouped)) {
        const buys = list.filter((o) => o.transaction_type === "BUY");
        const sells = list.filter((o) => o.transaction_type === "SELL");

        let totalBuyQty = 0,
          totalBuyValue = 0;
        buys.forEach((b) => {
          totalBuyQty += b.quantity;
          totalBuyValue += b.quantity * b.average_price;
        });

        let totalSellQty = 0,
          totalSellValue = 0;
        sells.forEach((s) => {
          totalSellQty += s.quantity;
          totalSellValue += s.quantity * s.average_price;
        });

        if (totalBuyQty > 0 && totalSellQty > 0) {
          const matchedQty = Math.min(totalBuyQty, totalSellQty);
          const buyAvg = totalBuyValue / totalBuyQty;
          const sellAvg = totalSellValue / totalSellQty;
          const pnl = (sellAvg - buyAvg) * matchedQty;
          newPnl = newPnl + pnl;

          results.push({
            label: symbol,
            win: toMoney(buyAvg),
            loss: toMoney(sellAvg),
            quantity: matchedQty,
            pnl: toMoney(pnl),
          });
        }
      }

      return results;
    }

    const pnlData = calculatePnL(trades);

    let totalBuy = 0,
      totalSell = 0;

    trades.forEach((t) => {
      if (t.transaction_type === "BUY") {
        totalBuy += t.quantity * t.average_price;
        totalBuyLength++;
      } else if (t.transaction_type === "SELL") {
        totalSell += t.quantity * t.average_price;
      }
    });

    // 🔢 Open positions from your own DB (same as Kite version)
    const openCount = await Order.count({
      where: {
        userId: req.userId,
        orderstatuslocaldb: "OPEN",
      },
    });

    console.log(newPnl, "Upstox pnl");

    return res.json({
      status: true,
      statusCode: 200,
      broker: "Upstox",
      message: "Upstox tradebook fetched",
      data: pnlData,
      onlineTrades: trades, // raw Upstox trades (normalized)
      // pnl: totalSell - totalBuy,
      pnl: newPnl,
      totalTraded: totalBuyLength,
      totalOpen: openCount,
    });
  } catch (error) {

    console.error(
      "Upstox Dashboard error:",
      error?.response?.data || error.message
    );
    return res.json({
      status: false,
      statusCode: 500,
      message: "Internal server error (Upstox)",
      error: error?.response?.data || error.message,
    });
  }
};


export const getUpstoxUserHolding = async (req, res) => {
  try {
    const token = req.headers.angelonetoken;

    if (!token) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Kite access token missing in header (angelonetoken)",
        error: null,
      });
    }

    return res.json({
      status: true,
      statusCode: 200,
      data: [], // ✅ only yesterday+old positions
      message: "No Holding Found",
    });

  } catch (error) {
    console.error("❌ getKiteHolding error:", error);
    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error.message,
    });
  }
};




// ==============OLD CODE===========================
export const getUpstoxFunds121 = async (req, res) => {
  try {
   
    const accessToken = req.headers.angelonetoken;

    if (!accessToken) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Upstox access token missing in header (upstoxaccesstoken)",
        error: null,
      });
    }

    console.log(req.userId, "upstox funds");

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    // 🔄 2) Hit both APIs in parallel
    const [fundsRes, ordersRes] = await Promise.all([
      axios.get("https://api.upstox.com/v2/user/get-funds-and-margin?segment=SEC", { headers }),
      axios.get("https://api.upstox.com/v2/order/retrieve-all", { headers }),
    ]);

    // 🎯 3) Parse funds
    // Response: { status: "success", data: { equity: { available_margin, ... }, commodity: {...} } }
    const fundsData = fundsRes.data?.data || {};
    const equity = fundsData.equity || {};

    // similar to Kite: funds?.equity?.net || 0
    const availableCash = equity.available_margin ?? 0;

    // 📚 4) Parse orders
    // retrieve-all returns an ARRAY directly
    let orders = Array.isArray(ordersRes.data)
      ? ordersRes.data
      : ordersRes.data?.data || [];

    // Sort → latest first (same as Kite)
    orders.sort(
      (a, b) => new Date(b.order_timestamp) - new Date(a.order_timestamp)
    );

    // 5️⃣ Map Upstox fields → same frontend structure as Kite
    const mappedOrders = orders.map((o) => ({
      tradingsymbol: o.tradingsymbol || o.trading_symbol,
      orderid: o.order_id,
      transactiontype: o.transaction_type,
      lotsize: o.quantity,
      averageprice: o.average_price,
      orderstatus: o.status,
      ordertime: o.order_timestamp,
    }));

    // 6️⃣ Last 5 for dashboard
    const recentFiveOrders = mappedOrders.slice(0, 5);

    // ✅ 7) Final response (same shape as getKiteFunds)
    return res.json({
      status: true,
      statusCode: 200,
      message: "Upstox funds & orders retrieved successfully",
      data: {
        raw: fundsRes.data,      // full raw funds response if you need
        availablecash: availableCash,
      },
      totalOrders: mappedOrders,
      recentOrders: recentFiveOrders,
    });
  } catch (error) {
    console.error("Error fetching upstox funds & orders:", error?.response?.data || error.message);

    return res.json({
      status: false,
      statusCode: 500,
      message: "Error fetching Upstox funds & orders",
      error: error?.response?.data || error.message,
    });
  }
};