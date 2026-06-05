import { fyersModel } from "fyers-api-v3";
import Order from "../models/orderModel.js"; // update your model path
import User from "../models/userModel.js"; // update your model path
import redis from "../utils/redis.js";  // your redis client
import axios from "axios";
import { Op } from "sequelize";



// FYERS Symbol Master CSV URLs (public)
const FYERS_SYMBOL_MASTER_URLS = {
  NSE_CM: "https://public.fyers.in/sym_details/NSE_CM.csv",
  BSE_CM: "https://public.fyers.in/sym_details/BSE_CM.csv",
  NSE_FO: "https://public.fyers.in/sym_details/NSE_FO.csv",
  BSE_FO: "https://public.fyers.in/sym_details/BSE_FO.csv",
  NSE_CD: "https://public.fyers.in/sym_details/NSE_CD.csv",
  MCX_COM: "https://public.fyers.in/sym_details/MCX_COM.csv",
};

const TEN_HOURS_IN_SECONDS = 36000;

/**
 * Robust CSV split (handles quoted commas too)
 */
function splitCSVLine(line) {
  
  const out = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((x) => x.trim());
}

/**
 * FYERS file may/may-not include a header.
 * We'll parse each row and also expose "raw" for safety.
 * We'll extract best-known fields using heuristics.
 */
function parseFyersCSV(text, segment) {
  const lines = String(text)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (!lines.length) return [];

  // If header present
  const first = lines[0].toLowerCase();
  const hasHeader = first.includes("fytoken") || first.includes("symbol") || first.includes("exchange");

  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const cols = splitCSVLine(line);

    // heuristics:
    const fytoken = cols[0] ?? "";
    const name = cols[1] ?? "";

    // tick is often near index 4 in many rows (as per sample)
    const tick_size = cols[4] !== undefined && cols[4] !== "" && !isNaN(cols[4]) ? Number(cols[4]) : null;

    // isin often near index 5 for CM
    const isin = cols[5] ?? "";

    // symbol column contains "NSE:XXXX", "BSE:XXXX" etc - find first match
    const symbolCol = cols.find((c) => typeof c === "string" && /^[A-Z]+:/.test(c)) || "";
    const exchange = symbolCol.includes(":") ? symbolCol.split(":")[0] : "";

    return {
      segment,          // NSE_CM / NSE_FO etc
      fytoken,          // FYERS token
      name,             // company / contract name
      symbol: symbolCol, // e.g. NSE:TATAMOTORS-EQ
      exchange,         // NSE/BSE/MCX...
      tick_size,        // number or null
      isin,             // string (may be empty for FO)
      raw: cols,        // keep full row always (format can differ by segment)
    };
  });
}

async function fetchFyersSegment(segment) {
  const url = FYERS_SYMBOL_MASTER_URLS[segment];
  if (!url) throw new Error(`Invalid segment '${segment}'. Use one of: ${Object.keys(FYERS_SYMBOL_MASTER_URLS).join(", ")}`);

  const res = await axios.get(url, {
    responseType: "text",
    timeout: 180000,
    headers: { Accept: "text/csv,*/*" },
  });

  return parseFyersCSV(res.data, segment);
}

export const getFyersInstruments = async (req, res) => {

  const segment = String(req.query.segment || "NSE_CM").toUpperCase(); // NSE_CM / ALL
  const REDIS_KEY = `fyers_instruments_${segment}`;

  try {
    // 1) cache
    const cached = await redis.get(REDIS_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      return res.json({
        status: true,
        cache: true,
        segment,
        count: data.length,
        data,
      });
    }

    // 2) fetch
    let data = [];
    if (segment === "ALL") {
      const results = await Promise.all(Object.keys(FYERS_SYMBOL_MASTER_URLS).map(fetchFyersSegment));
      data = results.flat();
    } else {
      data = await fetchFyersSegment(segment);
    }

    // 3) cache
    await redis.set(REDIS_KEY, JSON.stringify(data), "EX", TEN_HOURS_IN_SECONDS);

    return res.json({
      status: true,
      cache: false,
      segment,
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("FYERS instrument error:", err?.message);
    return res.status(500).json({
      status: false,
      message: err?.message || "Failed to fetch FYERS instruments",
    });
  }
};


export const updateFyersToken = async (req, res) => {
  try {
    const { userId, angelToken } = req.body;

    if (!userId || !angelToken) {
      return res.status(400).json({
        status: false,
        message: "userId and angelToken are required",
      });
    }

    // 1️⃣ Find user by ID
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // 2️⃣ Update required fields
    user.authToken = angelToken;
    user.angelLoginUser = true;

    // 3️⃣ Save changes
    await user.save();

    return res.status(200).json({
      status: true,
      message: "Angel token updated successfully",
      data: user,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const fyersLogin = async (req, res) => {
  try {

    let user = await User.findOne({ where: { id: req.userId } });

    console.log(user.kite_key ,'user.kite_key ');

    // const client_id = 'QJYEYUT02Z-100'

    const client_id =user.kite_key
    
    const redirect_uri = process.env.fyers_redirect_uri;

    const fyers = new fyersModel({
            path: "logs/",
            enableLogging: true,
            });


    // Set app config
    fyers.setAppId(client_id);
    fyers.setRedirectUrl(redirect_uri);

     const url = fyers.generateAuthCode();

     console.log(url,'fyers url');
     
    // Return JSON response instead of redirect
    return res.status(200).json({
      status: true,
      message: "Fyers login URL generated successfully",
      data: {
        loginUrl: url
      }
    });
  } catch (e) {
    console.log("Fyers error:", e);
    return res.status(500).json({ error: e.message });
  }
};


export const callbackFyers = async (req, res, next) => {
  try {
    // ✅ पूरा query object log करें
    console.log('Complete Query Object:', req.query);
    console.log('All Query Keys:', Object.keys(req.query));
    console.log('Request URL:', req.protocol + '://' + req.get('host') + req.originalUrl);

    // ✅ Auth code get karein
    const auth_code = req.query.auth_code || req.query.code || req.query.authorization_code;

    if (!auth_code) {
      return res.status(400).json({ 
        status: false,
        message: "Missing auth_code" 
      });
    }

    // 1️⃣ Get all Fyers users as RAW objects
    const fyersUsers = await User.findAll({
      where: { brokerName: "fyers" },
      raw: true, // 👈 plain JS objects, no instance methods
    });

    console.log(fyersUsers, 'fyersUsers');

    if (!fyersUsers || fyersUsers.length === 0) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/fyers-login-failed?error=${encodeURIComponent(
          "No Fyers users configured"
        )}`
      );
    }

    // 2️⃣ Try each user one by one until token generation returns success
    for (const user of fyersUsers) {
      const client_id = user.kite_key; // Note: aapke DB mein kite_key hi Fyers client ID hai
      const secret_key = user.kite_secret;

      if (!client_id || !secret_key) continue;

      try {
        const fyers = new fyersModel({
          path: "logs/",
          enableLogging: true,
        });

        fyers.setAppId(client_id);

        const response = await fyers.generate_access_token({
          client_id: client_id,
          secret_key: secret_key,
          auth_code: auth_code,
        });

        console.log(
          `Fyers token response for user ${user.id}:`,
          response
        );

        if (response.s === "ok") {
          const accessToken = response.access_token;

          // 3️⃣ Update this user with tokens (use Model.update because raw: true)
          await User.update(
            {
              authToken: accessToken,
              angelLoginUser: true,
              angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours
              // Agar Fyers mein koi extra fields ho toh add karein
            },
            {
              where: { id: user.id },
            }
          );

          console.log(
            "✅ Fyers token generated & updated for user:",
            user.id
          );

          // 4️⃣ Redirect and STOP loop by returning
          return res.redirect(
            `${process.env.FRONTEND_URL}/dashboard?access_token=${accessToken}`
          );
        }

        // if response.s !== 'ok', just try next user
      } catch (innerErr) {
        console.warn(
          `Fyers token generation failed for user ${user.id}:`,
          innerErr.response?.data || innerErr.message
        );
        // continue to next user
      }
    }

    // 3️⃣ If we reach here, NO user succeeded
    return res.redirect(
      `${process.env.FRONTEND_URL}/fyers-login-failed?error=${encodeURIComponent(
        "Unable to generate token for any Fyers user"
      )}`
    );

  } catch (error) {
    console.error("❌ Fyers Auth Error (outer):", error);
    return res.redirect(
      `${process.env.FRONTEND_URL}/fyers-login-failed?error=${encodeURIComponent(
        error.message
      )}`
    );
  }
};

export const FyersAppCredentialGet = async (req, res) => {
  try {
    const userId = req.userId; // set by auth middleware

    if (!userId) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "Unauthorized: userId is missing",
      });
    }

    // Find user
    const user = await User.findByPk(userId);

    console.log(user,'useruseruseruser');
    

    if (!user) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    return res.json({
      status: true,
      statusCode: 200,
      message: "Fyers App Credentials fetched",
      data: {
        clientId: user.kite_client_id || "",
        pin: user.kite_pin || "",
        apiKey: user.kite_key || "",
        totpSecret: user.kite_secret || "",
      },
    });

  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: "Failed to fetch Fyers app credentials",
      error: error.message,
    });
  }
};

export const FyersAppCredential = async (req, res) => {
  try {

    const userId = req.userId; // set by auth middleware
    
    const { totpSecret,apiKey } = req.body;

    console.log(req.body,'hhy');
    

    // 1️⃣ Basic validation
    if (!userId) {
      return res.json({
        status: false,
        statusCode:400,
        message: "Unauthorized: userId is missing",
      });
    }


    console.log('hello check point 1');
    

    if (!apiKey || !totpSecret) {
      return res.json({
        status: false,
        statusCode:400,
        message: "AppKey and Secret are required",
      });

    }

     console.log('hello check point 2');

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

    console.log(error,'dvdfv');
    
   
    return res.json({
      status: false,
      statusCode:500,
      message: "Failed to save kite app credentials",
      error: error.message,
    });
  }
};



export const callbackFyersWorkingCode = async (req, res, next) => {
  try {


      // ✅ पूरा query object log करें
    console.log('Complete Query Object:', req.query);
    console.log('All Query Keys:', Object.keys(req.query));
    console.log('Request URL:', req.protocol + '://' + req.get('host') + req.originalUrl);

    let user = await User.findOne({ where: { id: 27 } });
    

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const client_id = user.kite_key
    const secret_key = user.kite_secret

    
   const auth_code = req.query.auth_code || req.query.code || req.query.authorization_code;

    if (!auth_code) {
      return res.status(400).json({ message: "auth_code missing" });
    }

    const fyers = new fyersModel({
      path: "logs/",
      enableLogging: true,
    });

    fyers.setAppId(client_id);

    const response = await fyers.generate_access_token({
      client_id: client_id,
      secret_key: secret_key,
      auth_code: auth_code,
    });

    if (response.s === "ok") {

      const accessToken = response.access_token;

      // ✅ SAVE TOKEN IN DATABASE
      await user.update({
        authToken: accessToken,
      });

      console.log(accessToken, "Saved in DB");

      return res.redirect(
        `${process.env.FRONTEND_URL}/dashboard?access_token=${accessToken}`
      );

    } else {
      return res.status(400).json({
        status: false,
        message: "Failed to generate access token",
        error: response,
      });
    }

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const callbackFyers1 = async (req, res, next) => {
  try {


    let user = await User.findOne({ where: { id: 75 } });

    const client_id = user.kite_key
    const secret_key = user.kite_secret

    const { auth_code } = req.query;


    console.log(req.query,'req.queryreq.queryreq.queryreq.query');
    

    if (!auth_code) {

      return res.status(400).json({ message: "auth_code missing" });
    }

    // Initialize
    const fyers = new fyersModel({
      path: "logs/",
      enableLogging: true,
    });

    // REQUIRED — Set APP ID & Redirect URI
    fyers.setAppId(client_id);
    // fyers.setRedirectUrl(redirect_uri);

    // Now call access token API
    const response = await fyers.generate_access_token({
      client_id: client_id,
      secret_key: secret_key,
      auth_code: auth_code,
    });

    if (response.s === "ok") {
      // Set token in SDK
      fyers.setAccessToken(response.access_token);

      console.log(response.access_token,'response.access');
      

       return res.redirect(
      `${process.env.FRONTEND_URL}/dashboard?access_token=${response.access_token}`
    );

    } else {
      return res.status(400).json({
        status: false,
        message: "Failed to generate access token",
        error: response,
      });
    }
  } catch (error) {
    
    return res.status(500).json({ error: error.message });
  }
};





export const fyersProfile = async (req, res) => {
  try {

    const accessToken = req.headers.angelonetoken
    
    if (!accessToken) {
      return res.status(400).json({ error: "Access token missing" });
    }

    const fyers = new fyersModel({
      path: "logs/",
      enableLogging: true,
    });

    fyers.setAppId(process.env.fyers_app_id);
    fyers.setAccessToken(accessToken);

    const profile = await fyers.get_profile();

    console.log(profile,'fyers profile');

    return res.status(200).json({
      status: true,
      message: "Fyers profile fetched successfully",
      data: profile,
    });

  } catch (e) {
    console.log("Fyers error:", e);
    return res.status(500).json({ error: e.message });
  }
};


export const fyersFunds = async (req, res) => {
  try {

      const accessToken = req.headers.angelonetoken

      // const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiZDoxIiwiZDoyIiwieDowIiwieDoxIiwieDoyIl0sImF0X2hhc2giOiJnQUFBQUFCcEpWR0hXY3ZhRmluVlVNOHVJMUw0b0xuNVduNzNLckRfY2EyLXlUR1lGbnpMYkdDRnZpUV9XZVd4aDFYS0E4R0pqaWZxNEtWN3dqU2FrbHVEeWRDM2Y0SFJBNlVwSWNmMWxiWVhUM21ESS0xdzdJVT0iLCJkaXNwbGF5X25hbWUiOiIiLCJvbXMiOiJLMSIsImhzbV9rZXkiOiIwNDQ2OWY0NWUwZmRiMDExODdiMTIxNzMzOTgxMjk5ZWE2YzMxYTBkN2YzZjRiMjllNzBjYjNmZiIsImlzRGRwaUVuYWJsZWQiOiJOIiwiaXNNdGZFbmFibGVkIjoiTiIsImZ5X2lkIjoiWU0yNDMwMCIsImFwcFR5cGUiOjEwMCwiZXhwIjoxNzY0MTE3MDAwLCJpYXQiOjE3NjQwNTMzODMsImlzcyI6ImFwaS5meWVycy5pbiIsIm5iZiI6MTc2NDA1MzM4Mywic3ViIjoiYWNjZXNzX3Rva2VuIn0.tSyq_90UnlnP3sRRxFYNw9mw1MSNuCRGKLHzKCQU5D4'

    if (!accessToken) {
      return res.status(400).json({ error: "Access token missing" });
    }

    const fyers = new fyersModel({
      path: "logs/",
      enableLogging: true,
    });

    fyers.setAppId(process.env.fyers_app_id);
    fyers.setAccessToken(accessToken);

    const funds = await fyers.get_funds();


    console.log(funds,'==============funds=================');
    
     // 5️⃣ Final response
    return res.json({
      status: true,
      statusCode: 200,
      message: "Funds & orders retrieved successfully",
      data: {
        raw: funds,
        availablecash: funds.fund_limit[0].equityAmount,
      },
      totalOrders: [],   // full order list
      recentOrders: [], // last 5
    });

  } catch (error) {

    console.log("FYERS FUND ERROR:", error);

    return res.status(500).json({ error: error.message });
  }
};


export const getTradeDataForFyersDashboard = async (req, res) => {
  try {
    
    let totalBuyLength = 0;

    const fyersToken = req.headers.angelonetoken

    if (!fyersToken) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Login in Broker Account (FYERS)",
        error: null,
      });
    }

    // INIT FYERS
    const fyers = new fyersModel({
      path: "logs/",
      enableLogging: true,
    });

    fyers.setAppId(process.env.fyers_app_id);
    fyers.setAccessToken(fyersToken);

    // 📌 GET FYERS TRADEBOOK (Completed orders)
    const tradeRes = await fyers.get_tradebook();

    if (tradeRes.s !== "ok" || !tradeRes.data) {
      return res.json({
        status: true,
        statusCode: 200,
        message: "No FYERS trades found",
        data: [],
        pnl: 0,
        totalTraded: 0,
        totalOpen: 0,
      });
    }

    const trades = tradeRes.data;

    // If no trades
    if (!Array.isArray(trades) || trades.length === 0) {
      return res.json({
        status: true,
        statusCode: 200,
        message: "No FYERS trades found",
        data: [],
        pnl: 0,
        totalTraded: 0,
        totalOpen: 0,
      });
    }

    // UTILITY
    const toMoney = (n) => Math.round(n * 100) / 100;

    // ----------------------------------------------
    // 💹 PNL CALCULATION EXACT LIKE KITE
    // ----------------------------------------------
    function calculatePnL(orders) {
      const grouped = {};

      for (const t of orders) {
        if (!grouped[t.symbol]) grouped[t.symbol] = [];
        grouped[t.symbol].push(t);
      }

      const results = [];

      for (const [symbol, list] of Object.entries(grouped)) {
        const buys = list.filter((o) => o.side === 1);  // BUY
        const sells = list.filter((o) => o.side === -1); // SELL

        let totalBuyQty = 0,
          totalBuyValue = 0;
        buys.forEach((b) => {
          totalBuyQty += b.qty;
          totalBuyValue += b.qty * b.tradedPrice;
        });

        let totalSellQty = 0,
          totalSellValue = 0;
        sells.forEach((s) => {
          totalSellQty += s.qty;
          totalSellValue += s.qty * s.tradedPrice;
        });

        if (totalBuyQty > 0 && totalSellQty > 0) {
          const matchedQty = Math.min(totalBuyQty, totalSellQty);
          const buyAvg = totalBuyValue / totalBuyQty;
          const sellAvg = totalSellValue / totalSellQty;
          const pnl = (sellAvg - buyAvg) * matchedQty;

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

    // ----------------------------------------------
    // 🔢 TOTAL BUY & SELL VALUE
    // ----------------------------------------------
    let totalBuy = 0,
      totalSell = 0;

    trades.forEach((t) => {
      if (t.side === 1) {
        totalBuy += t.qty * t.tradedPrice;
        totalBuyLength++;
      } else if (t.side === -1) {
        totalSell += t.qty * t.tradedPrice;
      }
    });

    // ----------------------------------------------
    // 🔥 OPEN ORDERS COUNT FROM LOCAL DB
    // ----------------------------------------------
    const openCount = await Order.count({
      where: {
        userId: req.userId,
        orderstatuslocaldb: "OPEN",
      },
    });

    return res.json({
      status: true,
      statusCode: 200,
      broker: "Fyers",
      message: "Fyers tradebook fetched",
      data: pnlData,
      pnl: totalSell - totalBuy,
      totalTraded: totalBuyLength,
      totalOpen: openCount,
    });

  } catch (error) {
    console.error("FYERS Dashboard error:", error);
    return res.json({
      status: false,
      statusCode: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};




export const getFyersUserHolding = async (req, res) => {
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

    // 2️⃣ Compute start of TODAY in IST, convert to UTC ISO for string comparison
    const nowUtc = new Date();
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30

    // Convert current UTC -> IST
    const istNow = new Date(nowUtc.getTime() + IST_OFFSET_MS);
    istNow.setHours(0, 0, 0, 0); // start of day in IST (00:00:00)

    // Convert IST start-of-day back to UTC
    const startOfTodayUtc = new Date(istNow.getTime() - IST_OFFSET_MS);
    const startOfTodayIso = startOfTodayUtc.toISOString(); // e.g. "2025-12-10T00:00:00.000Z"

    console.log("🕒 startOfTodayUtc ISO:", startOfTodayIso);

    // 3️⃣ Get local COMPLETE orders older than today using filltime (stored as ISO string)
    const localOldOrders = await Order.findAll({
      where: {
        userId: req.userId,
        orderstatuslocaldb: "OPEN",
        filltime: {
          [Op.lt]: startOfTodayIso,  // only yesterday & older
        },
       
      },
       raw:true
    });

    return res.json({
      status: true,
      statusCode: 200,
      data: localOldOrders,
      message:
        "Successfully fetched holdings matching local COMPLETE orders (excluding today's filltime)",
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