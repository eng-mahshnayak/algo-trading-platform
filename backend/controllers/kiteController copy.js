import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import { KiteAccess } from "../utils/kiteClient.js";
import axios from "axios";
import crypto from "crypto";
import { getKiteClientForUserId } from "../services/userKiteBrokerService.js";
import redis from "../utils/redis.js";  // your redis client



async function Abc () {
   // 1️⃣ Get all Kite users as RAW objects
    const kiteUsers = await User.findAll({
      where: { brokerName: "kite" },
      raw: true, // 👈 plain JS objects, no instance methods
      // attributes: ["id", "email", "kite_key", "kite_secret"]  // optional
    });

    console.log(kiteUsers);
    
}


// Abc()

export const getKiteAllInstruments = async (req, res) => {
  const REDIS_KEY = "kite_all_instruments";
  const TEN_HOURS_IN_SECONDS = 10 * 60 * 60; // 36000

  try {
    const startTime = Date.now();

    // ===========================================
    // 1️⃣ Try Redis Cache First
    // ===========================================
    const cachedData = await redis.get(REDIS_KEY);

    if (cachedData) {
      console.log("📦 KITE instruments served from Redis cache");

      return res.json({
        status: true,
        statusCode: 200,
        data: JSON.parse(cachedData),
        cache: true,
        message: "Kite instruments fetched from Redis cache",
      });
    }

    // ===========================================
    // 2️⃣ If not in cache → Call Kite API
    // ===========================================
    const apiKey = process.env.KITE_API_KEY;
    const kite = KiteAccess(apiKey);

    const instruments = await kite.getInstruments(); // heavy call

    // ===========================================
    // 3️⃣ Store in Redis (Expire in 10 hours)
    // ===========================================
    await redis.set(
      REDIS_KEY,
      JSON.stringify(instruments),
      "EX",
      TEN_HOURS_IN_SECONDS
    );

    const endTime = Date.now();
    console.log(
      `✅ KITE instruments fetched LIVE & cached. Time: ${(endTime - startTime) / 1000}s`
    );

    return res.json({
      status: true,
      statusCode: 200,
      data: instruments,
      cache: false,
      message: "Kite instruments fetched from API and cached in Redis",
    });
  } catch (error) {
    console.error("❌ getKiteAllInstruments error:", error);

    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error.message,
    });
  }
};




export const kiteAppCredential = async (req, res) => {
  try {

    const userId = req.userId; // set by auth middleware
    
    const { clientId, totpSecret,pin,apiKey } = req.body;

    // 1️⃣ Basic validation
    if (!userId) {
      return res.json({
        status: false,
        statusCode:400,
        message: "Unauthorized: userId is missing",
      });
    }

    if (!clientId || !totpSecret) {
      return res.json({
        status: false,
        statusCode:400,
        message: "clientId and totpSecret are required",
      });

    }

    // 2️⃣ Find user by id
    const user = await User.findByPk(userId);

    if (!user) {

      return res.json({
        status: false,
        statusCode:404,
        message: "User not found",
      });
      
    }

    // 3️⃣ Update fields in User table
    user.kite_pin = pin;
    user.kite_client_id = clientId;
    user.kite_key = apiKey;
    user.kite_secret = totpSecret; // if you want, you can encrypt this before saving

    await user.save();

    // 4️⃣ Response
    return res.json({
      status: true,
      statusCode:200,
      message: "Kite app credentials saved successfully",
      data: {
        id: user.id,
        clientId: user.clientId,
        // don't send totpSecret back in real apps if you want more security
      },
    });
  } catch (error) {
   
    return res.json({
      status: false,
      statusCode:500,
      message: "Failed to save kite app credentials",
      error: error.message,
    });
  }
};



// ===================== KITE LOGIN URL =====================
export const kiteLogin = async (req, res) => {
  try {
    // 👇 1) Get logged-in user's id (adjust according to your auth setup)
    const userId = req.userId; // or req.user.id / req.params.id

    if (!userId) {
      return res.status(401).json({
        status: false,
        message: "User not authenticated",
      });
    }

    // 👇 2) Fetch user from DB
    const user = await User.findOne({
      where: { id: userId },
      attributes: ["id", "kite_key", "kite_secret"],
    });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    if (!user.kite_key || !user.kite_secret) {
      return res.status(400).json({
        status: false,
        message: "Kite API key/secret not configured for this user",
      });
    }

    // 👇 3) Use user-specific api key
    const kite = KiteAccess(user.kite_key);

    const loginUrl = kite.getLoginURL();

    console.log(loginUrl, "loginUrl");

    return res.status(200).json({
      status: true,
      message: "Kite login URL generated successfully",
      data: {
        loginUrl,
      },
    });
  } catch (error) {
    console.error("Kite login URL generation error:", error);
    return res.status(500).json({
      status: false,
      message: "Failed to generate login URL",
      error: error.message,
    });
  }
};




  const generateKiteChecksum = (apiKey, requestToken, apiSecret) => {

    const str = apiKey + requestToken + apiSecret;

    return crypto.createHash("sha256").update(str).digest("hex");

  };

// ===================== KITE CALLBACK =====================
export const kiteCallback = async (req, res) => {
  
  const { request_token } = req.query;

  console.log(req.query, "request_token kiteCallback");

  if (!request_token) {
    return res.status(400).json({
      status: false,
      message: "Missing request_token",
    });
  }

  try {
    // 1️⃣ Get all Kite users as RAW objects
    const kiteUsers = await User.findAll({
      where: { brokerName: "kite" },
      raw: true, // 👈 plain JS objects, no instance methods
      // attributes: ["id", "email", "kite_key", "kite_secret"]  // optional
    });


    console.log(kiteUsers,'kiteUsers');
    

    if (!kiteUsers || kiteUsers.length === 0) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/kite-login-failed?error=${encodeURIComponent(
          "No Kite users configured"
        )}`
      );
    }

      console.log('kiteUsers done');


    // 2️⃣ Try each user one by one until session/token returns success
    for (const user of kiteUsers) {
      const apiKey = user.kite_key;
      const apiSecret = user.kite_secret;

      if (!apiKey || !apiSecret) continue;

      try {
        // Compute checksum = sha256(api_key + request_token + api_secret)
        const checksum = generateKiteChecksum(apiKey, request_token, apiSecret);

        // Call Kite session/token API
        const response = await axios.post(
          "https://api.kite.trade/session/token",
          new URLSearchParams({
            api_key: apiKey,
            request_token,
            checksum,
          }).toString(),
          {
            headers: {
              "X-Kite-Version": "3",
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        console.log(
          `Kite session response for user ${user.id}:`,
          response.data
        );

        if (response.data?.status === "success") {
          const session = response.data.data;

          // 3️⃣ Update this user with tokens (use Model.update because raw: true)
          await User.update(
            {
              authToken: session.access_token,
              angelLoginUser:true,
              angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours
              feedToken: session.public_token,
              refreshToken: session.enctoken, // may be undefined, that's fine
            },
            {
              where: { id: user.id },
            }
          );

          console.log(
            "✅ Kite session matched & tokens updated for user:",
            user.id
          );

          // 4️⃣ Redirect and STOP loop by returning
          return res.redirect(
            `${process.env.FRONTEND_URL}/dashboard?access_token=${session.access_token}`
          );
        }

        // if status !== 'success', just try next user
      } catch (innerErr) {
        console.warn(
          `Kite session failed for user ${user.id}:`,
          innerErr.response?.data || innerErr.message
        );
        // continue to next user
      }
    }

    // 3️⃣ If we reach here, NO user succeeded
    return res.redirect(
      `${process.env.FRONTEND_URL}/kite-login-failed?error=${encodeURIComponent(
        "Unable to create session for any Kite user"
      )}`
    );
  } catch (err) {
    console.error("❌ Zerodha Auth Error (outer):", err);
    return res.redirect(
      `${process.env.FRONTEND_URL}/kite-login-failed?error=${encodeURIComponent(
        err.message
      )}`
    );
  }
};




// ===================== FUNDS + ORDERS =====================
export const getKiteFunds = async (req, res) => {
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

    console.log(req.userId,'fund');
    

    const  kite  = await getKiteClientForUserId(req.userId)

    // 1️⃣ Get Funds
    const funds = await kite.getMargins();

    const availableCash = funds?.equity?.net || 0;

    // 2️⃣ Get all orders
    let orders = await kite.getOrders();

    // Sort → latest first
    orders.sort(
      (a, b) => new Date(b.order_timestamp) - new Date(a.order_timestamp)
    );

    // 3️⃣ Map Zerodha fields → your frontend structure
    const mappedOrders = orders.map((o) => ({
      tradingsymbol: o.tradingsymbol,
      orderid: o.order_id,
      transactiontype: o.transaction_type,
      lotsize: o.quantity,
      averageprice: o.average_price,
      orderstatus: o.status,
      ordertime: o.order_timestamp,
    }));

    // 4️⃣ Get last 5 for dashboard
    const recentFiveOrders = mappedOrders.slice(0, 5);

    return res.json({
      status: true,
      statusCode: 200,
      message: "Funds & orders retrieved successfully",
      data: {
        raw: funds,
        availablecash: availableCash,
      },
      totalOrders: mappedOrders,
      recentOrders: recentFiveOrders,
    });
  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: "Error fetching kite funds & orders",
      error: error.message,
    });
  }
};

// ===================== DASHBOARD P&L =====================

export const getTradeDataForKiteDeshboard = async function (req, res, next) {
  try {

    let totalBuyLength = 0;
    let newPnl = 0

    const kiteToken = req.headers.angelonetoken;

    if (!kiteToken) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Login in Broker Account (AngelOne or Kite)",
        error: null,
      });
    }

    const  kite  = await getKiteClientForUserId(req.userId)

    const trades = await kite.getTrades();

    if (!Array.isArray(trades) || trades.length === 0) {
      return res.json({
        status: true,
        statusCode: 200,
        message: "No Kite trades found",
        data: [],
        pnl: 0,
        totalTraded: 0,
        totalOpen: 0,
      });
    }

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
          newPnl= newPnl+pnl

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

    const openCount = await Order.count({
      where: {
        userId: req.userId,
        orderstatuslocaldb: "OPEN",
      },
    });


    console.log(newPnl,'pnlData');
    

    return res.json({
      status: true,
      statusCode: 200,
      broker: "Kite",
      message: "Kite tradebook fetched",
      data: pnlData,
      onlineTrades:trades,
      // pnl: totalSell - totalBuy,
      pnl:newPnl,
      totalTraded: totalBuyLength,
      totalOpen: openCount,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.json({
      status: false,
      statusCode: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};











// ===================== ALL ORDERS (RAW) =====================
export const getKiteAllOrders = async (req, res) => {
  try {
    // 

      const token = req.headers.angelonetoken;

    if (!token) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Kite access token missing in header (angelonetoken)",
        error: null,
      });
    }

    const  kite  = await getKiteClientForUserId(req.userId)

    const orders = await kite.getOrders();

    return res.json({
      status: true,
      statusCode: 200,
      data: orders,
      message: "successfully fetch data",
    });
  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error.message,
    });
  }
};

// ===================== PROFILE (SDK) =====================
export const getKiteProfile = async (req, res) => {
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

    const  kite  = await getKiteClientForUserId(req.userId)

    const profile = await kite.getProfile();

    return res.json({
      status: true,
      statusCode: 200,
      message: "Profile retrieved successfully",
      data: profile,
    });
  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: "Error fetching profile",
      error: error.message,
    });
  }
};

// ===================== PROFILE (RAW REST API) =====================
export const getKiteProfile2 = async function (req, res, next) {
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

    const apiKey = process.env.KITE_API_KEY; // or hardcoded if you want

    const response = await axios.get("https://api.kite.trade/user/profile", {
      headers: {
        "X-Kite-Version": "3",
        Authorization: `token ${apiKey}:${token}`,
      },
    });

    return res.json({
      status: true,
      statusCode: 200,
      message: "Profile retrieved successfully",
      data: response.data.data,
    });
  } catch (error) {
    console.error(
      "Error fetching profile:",
      error.response?.data || error.message
    );
    return res.json({
      status: false,
      statusCode: 500,
      message: "Error fetching profile",
      error: error.message,
    });
  }
};

// ===================== ORDERS + TRADES MAPPED =====================
export const getKiteTradesData = async (req, res) => {
  try {

    const token = req.headers.angelonetoken;
      // const token = 'dWy5IAlNGHxPTq5mwcGWBNbCQfX6t3YZ';

    if (!token) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Kite access token missing in header (angelonetoken)",
        error: null,
      });
    }

    const  kite  = await getKiteClientForUserId(req.userId)
    //  const  kite  = await getKiteClientForUserId(13)

    const orders = await kite.getOrders();

    const ordersWithTrades = await Promise.all(
      orders.map(async (order) => {
        let trades = [];
        try {
          trades = await kite.getOrderTrades(order.order_id);
        } catch (err) {
          console.log(
            `Failed to fetch trades for ${order.order_id}`,
            err.message
          );
        }
        return { ...order, trades };
      })
    );

    return res.json({
      status: true,
      statusCode: 200,
      data: ordersWithTrades,
      message: "Successfully fetched orders with trades",
    });
  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error.message,
    });
  }
};

// ===================== PLACE ORDER =====================
export const placeKiteAllOrders = async (req, res) => {
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

     const  kite  = await getKiteClientForUserId(req.userId)

    const {
      exchange = "NSE",
      tradingsymbol, // e.g. "SBIN"
      transaction_type, // "BUY" | "SELL"
      quantity, // e.g. 1, 10, etc.
      product = "CNC", // CNC / MIS / NRML
      order_type = "MARKET", // MARKET / LIMIT / SL / SL-M
      price = 0, // required for LIMIT
      validity = "DAY", // DAY / IOC
      disclosed_quantity = 0,
      trigger_price = 0,
      squareoff = 0,
      stoploss = 0,
      trailing_stoploss = 0,
      variety = "regular", // regular / amo / bo / co (if enabled)
    } = req.body;

    if (!tradingsymbol || !transaction_type || !quantity) {
      return res.status(400).json({
        status: false,
        message:
          "tradingsymbol, transaction_type and quantity are required",
      });
    }

    const orderParams = {
      exchange,
      tradingsymbol,
      transaction_type,
      quantity,
      product,
      order_type,
      price,
      validity,
      disclosed_quantity,
      trigger_price,
      squareoff,
      stoploss,
      trailing_stoploss,
    };

    console.log("🔹 Placing Zerodha order:", { variety, orderParams });

    const response = await kite.placeOrder(variety, orderParams);

    return res.json({
      statusCode: 200,
      status: true,
      message: "Order placed successfully",
      data: response,
    });
  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error.message,
    });
  }
};





// ===================== Holding ORDER =====================
export const getKiteHolding = async (req, res) => {
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

    const  kite  = await getKiteClientForUserId(req.userId)

    const orders = await kite.getHoldings();

    console.log(orders);
    

    
    return res.json({
      status: true,
      statusCode: 200,
      data: orders,
      message: "Successfully fetched orders with trades",
    });
  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error.message,
    });
  }
};


export const getKiteTrades = async (req, res) => {
  try {

   
      const token = "UJpnO6tIPu9GqtuBltC9isIdHieGpiaS";

    if (!token) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Kite access token missing in header (angelonetoken)",
        error: null,
      });
    }

    const  kite  = await getKiteClientForUserId(15)
    //  const  kite  = await getKiteClientForUserId(13)

    const orders = await kite.getOrderTrades("1996800237145972736");

    // const orders = await kite.getHoldings();


  


    console.log(orders);
    

    // const ordersWithTrades = await Promise.all(
    //   orders.map(async (order) => {
    //     let trades = [];
    //     try {
    //       trades = await kite.getOrderTrades(order.order_id);
    //     } catch (err) {
    //       console.log(
    //         `Failed to fetch trades for ${order.order_id}`,
    //         err.message
    //       );
    //     }
    //     return { ...order, trades };
    //   })
    // );

    return res.json({
      status: true,
      statusCode: 200,
      data: orders,
      message: "Successfully fetched orders with trades",
    });
  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error.message,
    });
  }
};

export const getKiteOrders = async (req, res) => {
  try {

   
       const token = 'QFZdHvA3A8od33HbWIdogv0EHsXbHKrY';

    if (!token) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Kite access token missing in header (angelonetoken)",
        error: null,
      });
    }

    const  kite  = await getKiteClientForUserId(3)

   const orders = await kite.getOrders();

    // const orders = await kite.getOrderTrades("251203220916351");

    console.log(orders);
    

    // const ordersWithTrades = await Promise.all(
    //   orders.map(async (order) => {
    //     let trades = [];
    //     try {
    //       trades = await kite.getOrderTrades(order.order_id);
    //     } catch (err) {
    //       console.log(
    //         `Failed to fetch trades for ${order.order_id}`,
    //         err.message
    //       );
    //     }
    //     return { ...order, trades };
    //   })
    // );

    return res.json({
      status: true,
      statusCode: 200,
      data: orders,
      message: "Successfully fetched orders with trades",
    });
  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error.message,
    });
  }
};


export const getKitePlacesManual = async (req, res) => {
  try {

    const orderParams = {
      exchange: '',
      tradingsymbol: '',
      transaction_type: 'SELL',
      quantity:'',
      product:'MIS',  // DELIVERY.                // mistake in fields 
      order_type: 'MARKET',
      price: 0,
    };
   
      const token = '"UJpnO6tIPu9GqtuBltC9isIdHieGpiaS"';

    if (!token) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Kite access token missing in header (angelonetoken)",
        error: null,
      });
    }

    const  kite  = await getKiteClientForUserId(15)
   
        placeRes = await kite.placeOrder('regular', orderParams);

    console.log(placeRes,'kite place order');

    const orders = await kite.getOrderTrades("1996789388108914688");




  


    console.log(orders);
    

    // const ordersWithTrades = await Promise.all(
    //   orders.map(async (order) => {
    //     let trades = [];
    //     try {
    //       trades = await kite.getOrderTrades(order.order_id);
    //     } catch (err) {
    //       console.log(
    //         `Failed to fetch trades for ${order.order_id}`,
    //         err.message
    //       );
    //     }
    //     return { ...order, trades };
    //   })
    // );

    return res.json({
      status: true,
      statusCode: 200,
      data: orders,
      message: "Successfully fetched orders with trades",
    });
  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error.message,
    });
  }
};




















// import Order from "../models/orderModel.js"
// import User from "../models/userModel.js"
// import { kite, setKiteAccessToken } from "../utils/kiteClient.js";
// import crypto from "crypto";





// export const kiteLogin = (req, res) => {
//   try {

//     const loginUrl = kite.getLoginURL();

//     console.log(loginUrl,'loginUrl');
    

//     // Return JSON response instead of redirect
//     return res.status(200).json({
//       status: true,
//       message: "Kite login URL generated successfully",
//       data: {
//         loginUrl: loginUrl
//       }
//     });
    
//   } catch (error) {
//     console.error('Kite login URL generation error:', error);
//     return res.status(500).json({
//       status: false,
//       message: "Failed to generate login URL",
//       error: error.message
//     });
//   }
// };

// // helper to compute kite checksum
// const generateKiteChecksum = (apiKey, requestToken, apiSecret) => {
//   const str = apiKey + requestToken + apiSecret;
//   return crypto.createHash("sha256").update(str).digest("hex");
// };

// export const kiteCallback = async (req, res) => {
//   const { request_token } = req.query;

//   console.log(req.query, "request_token kiteCallback");

//   if (!request_token) {
//     return res.status(400).json({
//       status: false,
//       message: "Missing request_token",
//     });
//   }

//   try {
//     // 1️⃣ Read API key/secret (for now from env; can be per-user later)
//     const apiKey = process.env.KITE_API_KEY;
//     const apiSecret = process.env.KITE_API_SECRET;

//     if (!apiKey || !apiSecret) {
//       throw new Error("Kite API key/secret not configured in env");
//     }

//     // 2️⃣ Compute checksum = sha256(api_key + request_token + api_secret)
//     const checksum = generateKiteChecksum(apiKey, request_token, apiSecret);

//     // 3️⃣ Call Kite session/token API (same as your curl)
//     const response = await axios.post(
//       "https://api.kite.trade/session/token",
//       new URLSearchParams({
//         api_key: apiKey,
//         request_token: request_token,
//         checksum: checksum,
//       }).toString(),
//       {
//         headers: {
//           "X-Kite-Version": "3",
//           "Content-Type": "application/x-www-form-urlencoded",
//         },
//       }
//     );

//     console.log("Kite session/token response:", response.data);

//     // Expected structure: { status: 'success', data: {...} }
//     const session = response.data.data;

//     console.log(session, "kite user login session");

//     // 4️⃣ Find user by email from session
//     const user = await User.findOne({
//       where: { email: session.email },
//     });

//     if (!user) {
//       return res.redirect(
//         `${process.env.FRONTEND_URL}/kite-login-failed?error=User not found`
//       );
//     }

//     // 5️⃣ Update tokens in DB
//     await user.update({
//       authToken: session.access_token,
//       feedToken: session.public_token,
//       refreshToken: session.enctoken, // only if present in response
//     });

//     // 6️⃣ Redirect to frontend success page
//     return res.redirect(
//       `${process.env.FRONTEND_URL}/dashboard?access_token=${session.access_token}`
//     );
//   } catch (err) {
//     console.error(
//       "❌ Zerodha Auth Error:",
//       err.response?.data || err.message
//     );

//     const msg =
//       err.response?.data?.message ||
//       err.response?.data?.error ||
//       err.message;

//     return res.redirect(
//       `${process.env.FRONTEND_URL}/kite-login-failed?error=${encodeURIComponent(
//         msg
//       )}`
//     );
//   }
// };
// // export const kiteCallback = async (req, res) => {
  
// //   const { request_token } = req.query;

// //   console.log(req.query,'request_token kiteCallback');
  

// //   if (!request_token) {

// //     return res.status(400).json({ 
// //       status: false,
// //       message: "Missing request_token" 
// //     });
// //   }

// //   try {
    
// //     const session = await kite.generateSession(
// //       request_token,
// //       process.env.KITE_API_SECRET
// //     );


// //     console.log(session,'kite user login session');
    

   
// //     // 1️⃣ Find user by email
// //     const user = await User.findOne({
// //       where: { email:session.email }
// //     });

// //      if (!user) {

// //        return res.redirect(
// //       `${process.env.FRONTEND_URL}/kite-login-failed?error : User not found`
// //     );
// //     }

// //     // 2️⃣ Update tokens
// //     await user.update({
// //       authToken:session.access_token,
// //       feedToken:session.public_token,
// //       refreshToken:session.enctoken
// //     });
    
// //     // Redirect to frontend success page
// //     return res.redirect(
// //       `${process.env.FRONTEND_URL}/dashboard?access_token=${session.access_token}`
// //     );
    
// //   } catch (err) {
// //     console.error("❌ Zerodha Auth Error:", err);
// //     return res.redirect(
// //       `${process.env.FRONTEND_URL}/kite-login-failed?error=${err.message}`
// //     );
// //   }
// // };

// export const getKiteAllInstruments = async (req, res) => {
//     try {
   
//     const instruments = await kite.getInstruments();

//         return res.json({
//             status: true,
//             statusCode:200,
//             data: instruments,
//             message:'successfully fetch data'
//         });

//     } catch (error) {
        
//       return res.json({
//             status: false,
//             statusCode:500,
//             message: "Unexpected error occurred. Please try again.",
//             data:null,
//             error: error.message,
//         });
//     }
// };


// export const getKiteFunds = async (req, res) => {
//   try {
    
//     let token = req.headers.angelonetoken;

//     //  let token = 'B9XoC71zzoJ3J56xVPSUEHUWLGlUugMU'

//     await setKiteAccessToken(token);

//     // 1️⃣ Get Funds
//     const funds = await kite.getMargins();


//     const availableCash =
//       (funds?.equity?.net || 0) 

//     // 2️⃣ Get all orders
//     let orders = await kite.getOrders();

//     // Sort → latest first
//     orders.sort(
//       (a, b) => new Date(b.order_timestamp) - new Date(a.order_timestamp)
//     );

//     // 3️⃣ Map Zerodha fields → your frontend structure
//     const mappedOrders = orders.map((o) => ({
//       tradingsymbol: o.tradingsymbol,
//       orderid: o.order_id,
//       transactiontype: o.transaction_type,
//       lotsize: o.quantity,
//       averageprice: o.average_price,
//       orderstatus: o.status,
//       ordertime: o.order_timestamp,
//     }));

//     // 4️⃣ Get last 5 for dashboard
//     const recentFiveOrders = mappedOrders.slice(0, 5);

//     // 5️⃣ Final response
//     return res.json({
//       status: true,
//       statusCode: 200,
//       message: "Funds & orders retrieved successfully",
//       data: {
//         raw: funds,
//         availablecash: availableCash,
//       },
//       totalOrders: mappedOrders,   // full order list
//       recentOrders: recentFiveOrders, // last 5
//     });

//   } catch (error) {

//     return res.json({
//       status: false,
//       statusCode: 500,
//       message: "Error fetching kite funds & orders",
//       error: error.message,
//     });
//   }
// };

// export const getTradeDataForKiteDeshboard = async function (req, res, next) {
//   try {

//     let totalBuyLength = 0;

//     const kiteToken = req.headers.angelonetoken;
    
//     if (!kiteToken) {
//       return res.json({
//         status: false,
//         statusCode: 401,
//         message: "Login in Broker Account (AngelOne or Kite)",
//         error: null,
//       });
//     }

   
//       await setKiteAccessToken(kiteToken);

//       const trades = await kite.getTrades();

//       if (!Array.isArray(trades) || trades.length === 0) {
//         return res.json({
//           status: true,
//           statusCode: 200,
//           message: "No Kite trades found",
//           data: [],
//           pnl: 0,
//           totalTraded: 0,
//           totalOpen: 0,
//         });
//       }

//       const toMoney = (n) => Math.round(n * 100) / 100;

//       function calculatePnL(orders) {
//         const grouped = {};

//         for (const t of orders) {
//           if (!grouped[t.tradingsymbol]) grouped[t.tradingsymbol] = [];
//           grouped[t.tradingsymbol].push(t);
//         }

//         const results = [];

//         for (const [symbol, list] of Object.entries(grouped)) {
//           const buys = list.filter((o) => o.transaction_type === "BUY");
//           const sells = list.filter((o) => o.transaction_type === "SELL");

//           let totalBuyQty = 0,
//             totalBuyValue = 0;
//           buys.forEach((b) => {
//             totalBuyQty += b.quantity;
//             totalBuyValue += b.quantity * b.average_price;
//           });

//           let totalSellQty = 0,
//             totalSellValue = 0;
//           sells.forEach((s) => {
//             totalSellQty += s.quantity;
//             totalSellValue += s.quantity * s.average_price;
//           });

//           if (totalBuyQty > 0 && totalSellQty > 0) {
//             const matchedQty = Math.min(totalBuyQty, totalSellQty);
//             const buyAvg = totalBuyValue / totalBuyQty;
//             const sellAvg = totalSellValue / totalSellQty;
//             const pnl = (sellAvg - buyAvg) * matchedQty;

//             results.push({
//               label: symbol,
//               win: toMoney(buyAvg),
//               loss: toMoney(sellAvg),
//               quantity: matchedQty,
//               pnl: toMoney(pnl),
//             });
//           }
//         }

//         return results;
//       }

//       const pnlData = calculatePnL(trades);

//       let totalBuy = 0,
//         totalSell = 0;

//       trades.forEach((t) => {
//         if (t.transaction_type === "BUY") {
//           totalBuy += t.quantity * t.average_price;
//           totalBuyLength++;
//         } else if (t.transaction_type === "SELL") {
//           totalSell += t.quantity * t.average_price;
//         }
//       });

//       const openCount = await Order.count({
//         where: {
//           userId: req.userId,
//           orderstatuslocaldb: "OPEN",
//         },
//       });

//       return res.json({
//         status: true,
//         statusCode: 200,
//         broker: "Kite",
//         message: "Kite tradebook fetched",
//         data: pnlData,
//         pnl: totalSell - totalBuy,
//         totalTraded: totalBuyLength,
//         totalOpen: openCount,
//       });
    

//   } catch (error) {
//     console.error("Dashboard error:", error);
//     return res.json({
//       status: false,
//       statusCode: 500,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// export const getKiteAllOrders = async (req, res) => {
//     try {

//        const token = req.headers.angelonetoken;
   
//         await setKiteAccessToken(token);

//         const orders = await kite.getOrders();

//         return res.json({
//             status: true,
//             statusCode:200,
//             data: orders,
//             message:'successfully fetch data'
//         });

//     } catch (error) {
        
//       return res.json({
//             status: false,
//             statusCode:500,
//             message: "Unexpected error occurred. Please try again.",
//             data:null,
//             error: error.message,
//         });
//     }
// };

// export const getKiteProfile = async (req, res) => {
//   try {

//     const token = req.headers.angelonetoken;

//     await setKiteAccessToken(token);

//     // Get funds / margin details
//     const profile = await kite.getProfile(); // or getMargins("equity")  

//     return res.json({
//       status: true,
//       statusCode: 200,
//       message: "Profile retrieved successfully",
//       data: profile,
//     });

//   } catch (error) {
//     return res.json({
//       status: false,
//       statusCode: 500,
//       message: "Error fetching funds",
//       error: error.message,
//     });
//   }
// };

// export const getKiteProfile2 = async function (req,res,next) {
//     try {

//     const token = req.headers.angelonetoken;

//       let apiKey = 'veh80gz86tmw4e9v'

//         const response = await axios.get('https://api.kite.trade/user/profile', {
//             headers: {
//                 'X-Kite-Version': '3',
//                 'Authorization': `token ${apiKey}:${token}`
//             }
//         });

//   return res.json({
//       status: true,
//       statusCode: 200,
//       message: "Profile retrieved successfully",
//       data: response.data.data,
//     });


//     } catch (error) {
//         console.error('Error fetching profile:', error.response?.data || error.message);
//         throw error;
//     }
// }

// export const getKiteTradesData = async (req, res) => {
//   try {

//       const token = req.headers.angelonetoken;

//     await setKiteAccessToken(token);

//     const orders = await kite.getOrders();

//     // Fetch trades for each order
//     const ordersWithTrades = await Promise.all(
//       orders.map(async (order) => {
//         let trades = [];
//         try {
//           trades = await kite.getOrderTrades(order.order_id); // fetch trade data
//         } catch (err) {
//           console.log(`Failed to fetch trades for ${order.order_id}`, err.message);
//         }
//         return { ...order, trades };
//       })
//     );

//     return res.json({
//       status: true,
//       statusCode: 200,
//       data: ordersWithTrades,
//       message: 'Successfully fetched orders with trades',
//     });

//   } catch (error) {
//     return res.json({
//       status: false,
//       statusCode: 500,
//       message: "Unexpected error occurred. Please try again.",
//       data: null,
//       error: error.message,
//     });
//   }
// };

// export const placeKiteAllOrders = async (req, res) => {
//     try {

//        const token = req.headers.angelonetoken;
   
//         await setKiteAccessToken(token);

//         const {
//           exchange = "NSE",
//           tradingsymbol,          // e.g. "SBIN"
//           transaction_type,       // "BUY" | "SELL"
//           quantity,               // e.g. 1, 10, etc.
//           product = "CNC",        // CNC / MIS / NRML
//           order_type = "MARKET",  // MARKET / LIMIT / SL / SL-M
//           price = 0,              // required for LIMIT
//           validity = "DAY",       // DAY / IOC
//           disclosed_quantity = 0,
//           trigger_price = 0,
//           squareoff = 0,
//           stoploss = 0,
//           trailing_stoploss = 0,
//           variety = "regular",    // regular / amo / bo / co (if enabled)
//         } = req.body;

//         if (!tradingsymbol || !transaction_type || !quantity) {
//       return res.status(400).json({
//         status: false,
//         message: "tradingsymbol, transaction_type and quantity are required",
//       });
//     }

//     const orderParams = {
//       exchange,
//       tradingsymbol,
//       transaction_type,
//       quantity,
//       product,
//       order_type,
//       price,
//       validity,
//       disclosed_quantity,
//       trigger_price,
//       squareoff,
//       stoploss,
//       trailing_stoploss,
//     };

//     console.log("🔹 Placing Zerodha order:", { variety, orderParams });

//     const response = await kite.placeOrder(variety, orderParams);

  
//     return res.json({
//       statusCode:200,
//       status: true,
//       message: "Order placed successfully",
//       data: response, // contains order_id, etc.
//     });

//     } catch (error) {
        
//       return res.json({
//             status: false,
//             statusCode:500,
//             message: "Unexpected error occurred. Please try again.",
//             data:null,
//             error: error.message,
//         });
//     }
// };