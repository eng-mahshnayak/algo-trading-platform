
import { shoonyaPost } from "../utils/shoonyaPost.js";
import User from "../models/userModel.js"

import axios from 'axios'; 


import { createHash } from "crypto";
import speakeasy from "speakeasy";

const SHOONYA_BASE_URL = "https://api.shoonya.com/NorenWClientTP";



export const shoonyaLoginWithTotp = async (req, res) => {
  try {

    // 1️⃣ Fetch user from database
    const user = await User.findOne({
      where: { id:req.userId },
      raw: true,
    });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Extract values from user table
    const uid = user.kite_client_id;       // Shoonya Login ID
    const password = user.kite_pin;        // Shoonya password
    const totpSecret = user.kite_secret;   // Shoonya TOTP Base32 secret

    if (!uid || !password || !totpSecret) {
      return res.status(400).json({
        status: false,
        message: "Shoonya credentials missing in user profile",
      });
    }

    // 2️⃣ Generate 6-digit TOTP from Base32 secret
    const factor2 = speakeasy.totp({
      secret: totpSecret,
      encoding: "base32",
      digits: 6,
    });

    console.log("Generated Shoonya TOTP:", factor2);

    // 3️⃣ Compute SHA-256 hashed password (Shoonya requirement)
    const pwdHash = createHash("sha256").update(password).digest("hex");

    // 4️⃣ Compute Shoonya appkey (uid|apiKey)
    const apiKey = user.kite_key
    const appkeyRaw = `${uid}|${apiKey}`;
    const appkey = createHash("sha256").update(appkeyRaw).digest("hex");

    const vc = user.finavacia_vendor_code;
    const imei = user.finavacia_imei;

    // 5️⃣ Create payload for QuickAuth
    const loginPayload = {
      apkversion: "1.0.0",
      uid,
      pwd: pwdHash,
      factor2,
      vc,
      imei,
      source: "API",
      appkey,
    };

    console.log("Shoonya Login Payload:", loginPayload);

    // 6️⃣ POST request to Shoonya QuickAuth
    const jData = `jData=${JSON.stringify(loginPayload)}`;

    const response = await axios.post(
      "https://api.shoonya.com/NorenWClientTP/QuickAuth",
      jData,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const data = response.data;

    console.log("Shoonya Login Response:", data);

    // 7️⃣ Handle errors
    if (data.stat !== "Ok") {
      return res.status(400).json({
        status: false,
        message: data.emsg || "Shoonya login failed",
        data,
      });
    }

    // 8️⃣ Save susertoken to DB
    await User.update(
      { authToken: data.susertoken },
      { where: { id: req.userId} }
    );

    return res.json({
      status: true,
      brokerName:'finvasia',
      message: "Shoonya login successful",
      token: data.susertoken,
      actid: data.actid,
      username: data.uname,
    });

  } catch (err) {
    console.error("Shoonya login error:", err);
    return res.status(500).json({
      status: false,
      message: "Unexpected error during Shoonya login",
      error: err.message,
    });
  }
};



export const finvasiaAppCredential = async (req, res) => {
  try {
    const userId = req.userId; // set by auth middleware

    const {
      clientId,    // Shoonya API KEY
      totpSecret,  // Shoonya TOTP secret
      apiKey,      // Shoonya UID (login id, e.g. FN169676)
      pin,         // Shoonya password / PIN
      imei,        // IMEI
      vc,          // Vendor code
    } = req.body;

    console.log("Finvasia credential payload:", req.body);

    // 1️⃣ Basic validation
    if (!userId) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "Unauthorized: userId is missing",
      });
    }

    if (!clientId || !totpSecret || !apiKey) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "clientId, apiKey (UID) and totpSecret are required",
      });
    }

    // 2️⃣ Find user by id
    const user = await User.findByPk(userId);

    if (!user) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    // 3️⃣ Map frontend → DB fields

    user.kite_key = apiKey;           
    user.kite_client_id = clientId;  
    user.kite_pin = pin || null;    
    user.kite_secret = totpSecret;
   
    user.finavacia_imei = imei || null;
    user.finavacia_vendor_code = vc || null;

    await user.save();

    // 4️⃣ Response
    return res.json({
      status: true,
      statusCode: 200,
      message: "Finvasia (Shoonya) credentials saved successfully",
      data: {
        id: user.id,
        broker: "finvasia",
        uid: user.shoonya_uid,
        hasTotpSecret: !!user.shoonya_totp_secret,
        hasApiKey: !!user.shoonya_api_key,
      },
    });
  } catch (error) {
    console.error("finvasiaAppCredential error:", error);

    return res.json({
      status: false,
      statusCode: 500,
      message: "Failed to save Finvasia (Shoonya) app credentials",
      error: error.message,
    });
  }
};



// -------------------------------
// POST FUNDS CONTROLLER
// -------------------------------
export const getShoonyaFunds = async (req, res) => {
  try {

    let susertoken = req.headers.angelonetoken;

    // 1️⃣ Fetch user from database
    const user = await User.findOne({
      where: { id: req.userId },
      raw: true,
    });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Extract values from user table
    const uid = user.kite_client_id;       // Shoonya Login ID
    


    const url = `${SHOONYA_BASE_URL}/Limits`;

    // 👇 This object will become the JSON in jData
    const jData = {
      uid,    // e.g. "FN169676"
      actid:uid,  // e.g. "FN169676"
    };



    // ✅ Build raw x-www-form-urlencoded string like in their curl examples
    const body = `jKey=${susertoken}&jData=${JSON.stringify(jData)}`;

    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = response?.data;

    if (!data || data.stat !== "Ok") {
      return res.status(400).json({
        status: false,
        message: data?.emsg || "Unable to fetch funds",
        raw: data,
      });
    }

    let cashFund = {
          availablecash:data.cash
    }

    return res.json({
      status: true,
      message: "Funds (Limits) fetched successfully",
      data: cashFund,
    });
  } catch (error) {
    console.error("Shoonya Funds Error:", error?.response?.data || error);

    return res.status(500).json({
      status: false,
      message: "Shoonya funds fetch failed",
      error: error?.response?.data || error.message,
    });
  }
};












export const shoonyaLogin = async (req, res) => {
  try {
    const { userId, password, otp } = req.body;
    const vc = process.env.SHOONYA_VENDOR_CODE;
    const apiKey = process.env.SHOONYA_API_KEY;
    const imei = process.env.SHOONYA_IMEI;

    // 1. Hash the password (SHA-256)
    const pwdHash = createHash('sha256').update(password).digest('hex');

    // 2. Generate appkey (SHA-256 of "uid|apiKey")
    const appkeyRaw = `${userId}|${apiKey}`;
    const appkey = createHash('sha256').update(appkeyRaw).digest('hex');


    console.log(appkey,'appkey');
    

    // 3. Prepare login payload
    const loginPayload = {
      apkversion: '1.0.0',
      uid: userId,
      pwd: pwdHash, // Use hashed password
      factor2: otp,
      vc,
      imei,
      source: 'API',
      appkey,
    };

    // 4. Stringify and format as "jData=<payload>"
    const jData = `jData=${JSON.stringify(loginPayload)}`;

    // 5. Send POST request to Shoonya login endpoint
    const response = await axios.post(
      'https://api.shoonya.com/NorenWClientTP/QuickAuth',
      jData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const data = response.data;

    // 6. Check response status
    if (data.stat !== 'Ok') {
      return res.status(401).json({
        status: false,
        message: data.emsg || 'Shoonya login failed',
        data,
      });
    }

    // 7. Save `susertoken` to your database (mapped to your platform user)
    // Example: await User.update({ shoonyaToken: data.susertoken }, { where: { id: req.user.id } });

    // 8. Return success response
    return res.json({
      status: true,
      message: 'Shoonya login successful',
      data,
    });
  } catch (err) {
    console.error('Shoonya login error:', err);
    return res.status(500).json({
      status: false,
      message: 'Unexpected error in Shoonya login',
      error: err.message,
    });
  }
};

// -------------------------------
// POST FUNDS CONTROLLER
// -------------------------------
export const getShoonyaFunds1 = async (req, res) => {
  try {
    const { uid, susertoken } = req.body;

    if (!uid  || !susertoken) {
      return res.status(400).json({
        status: false,
        message: "uid, actid and susertoken are required",
      });
    }

    const url = `${SHOONYA_BASE_URL}/Limits`;

    // 👇 This object will become the JSON in jData
    const jData = {
      uid,    // e.g. "FN169676"
      actid:uid,  // e.g. "FN169676"
      // Optional: prd, seg, exch, etc.
      // prd: "C",
      // seg: "CM",
      // exch: "NSE",
    };



    // ✅ Build raw x-www-form-urlencoded string like in their curl examples
    const body = `jKey=${susertoken}&jData=${JSON.stringify(jData)}`;

    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = response?.data;

    if (!data || data.stat !== "Ok") {
      return res.status(400).json({
        status: false,
        message: data?.emsg || "Unable to fetch funds",
        raw: data,
      });
    }

    return res.json({
      status: true,
      message: "Funds (Limits) fetched successfully",
      funds: data,
    });
  } catch (error) {
    console.error("Shoonya Funds Error:", error?.response?.data || error);

    return res.status(500).json({
      status: false,
      message: "Shoonya funds fetch failed",
      error: error?.response?.data || error.message,
    });
  }
};

// -------------------------------
// POST ORDERS CONTROLLER
// -------------------------------
export const getShoonyaOrders = async (req, res) => {
  try {
    const { uid, susertoken } = req.body;

    if (!uid || !susertoken) {
      return res.status(400).json({
        status: false,
        message: "uid and susertoken are required",
      });
    }

    const url = `${SHOONYA_BASE_URL}/OrderBook`;

    const jData = { uid };

    const body = `jKey=${susertoken}&jData=${JSON.stringify(jData)}`;

    console.log("Shoonya /OrderBook body =>", body);

    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = response?.data;
    console.log("Finvasia orders raw:", data);

    if (!data) {
      return res.status(400).json({
        status: false,
        message: "No response from Shoonya OrderBook",
      });
    }

    // 🔹 Case A: "no data" → treat as success with empty orders
    if (
      !Array.isArray(data) &&
      data.stat === "Not_Ok" &&
      typeof data.emsg === "string" &&
      data.emsg.toLowerCase().includes("no data")
    ) {
      return res.json({
        status: true,
        message: "No orders found",
        count: 0,
        orders: [],
        raw: data,
      });
    }

    // 🔹 Case B: other errors from Shoonya
    if (!Array.isArray(data) && data.stat && data.stat !== "Ok") {
      return res.status(400).json({
        status: false,
        message: data?.emsg || "Unable to fetch orders",
        raw: data,
      });
    }

    // 🔹 Case C: Success – data is array or wrapped
    let orders = [];

    if (Array.isArray(data)) {
      orders = data;
    } else if (Array.isArray(data?.orders)) {
      orders = data.orders;
    }

    return res.json({
      status: true,
      message: "Orders fetched successfully",
      count: orders.length,
      orders,
      raw: data,
    });
  } catch (error) {
    console.error("Shoonya Orders Error:", error?.response?.data || error);

    return res.status(500).json({
      status: false,
      message: "Shoonya orders fetch failed",
      error: error?.response?.data || error.message,
    });
  }
};


// -------------------------------
// POST Trades CONTROLLER
// -------------------------------
export const getShoonyaTrades = async (req, res) => {
  try {
    // 🔹 Now expecting actid also
    const { uid, susertoken } = req.body;

     let actid = uid

    if (!uid || !actid || !susertoken) {
      return res.status(400).json({
        status: false,
        message: "uid, actid and susertoken are required",
      });
    }

   

    const url = `${SHOONYA_BASE_URL}/TradeBook`;

    // jData MUST have uid + actid
    const jData = {
      uid,   // e.g. "FN169676"
      actid, // e.g. "FN169676"
      // Optional filters if you want later:
      // exch: "NSE",
      // prd: "C",
      // seg: "CM",
    };

    // raw x-www-form-urlencoded (Shoonya style)
    const body = `jKey=${susertoken}&jData=${JSON.stringify(jData)}`;

    console.log("Shoonya /TradeBook body =>", body);

    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = response?.data;
    console.log("Finvasia trades raw:", data);

    if (!data) {
      return res.status(400).json({
        status: false,
        message: "No response from Shoonya TradeBook",
      });
    }

    // 🔹 Case A: "no data" → no trades
    if (
      !Array.isArray(data) &&
      data.stat === "Not_Ok" &&
      typeof data.emsg === "string" &&
      data.emsg.toLowerCase().includes("no data")
    ) {
      return res.json({
        status: true,
        message: "No trades found",
        count: 0,
        trades: [],
        raw: data,
      });
    }

    // 🔹 Case B: some other Shoonya error
    if (!Array.isArray(data) && data.stat && data.stat !== "Ok") {
      return res.status(400).json({
        status: false,
        message: data?.emsg || "Unable to fetch trades",
        raw: data,
      });
    }

    // 🔹 Case C: success – usually an array of trades
    let trades = [];

    if (Array.isArray(data)) {
      trades = data;
    } else if (Array.isArray(data?.trades)) {
      trades = data.trades;
    }

    return res.json({
      status: true,
      message: "Trades fetched successfully",
      count: trades.length,
      trades,
      raw: data,
    });
  } catch (error) {
    console.error("Shoonya Trades Error:", error?.response?.data || error);

    return res.status(500).json({
      status: false,
      message: "Shoonya trades fetch failed",
      error: error?.response?.data || error.message,
    });
  }
};




import { shoonyaPost } from "../utils/shoonyaPost.js";
import User from "../models/userModel.js"

import axios from 'axios'; 


import { createHash } from "crypto";
import speakeasy from "speakeasy";

const SHOONYA_BASE_URL = "https://api.shoonya.com/NorenWClientTP";



export const shoonyaLoginWithTotp = async (req, res) => {
  try {

    // 1️⃣ Fetch user from database
    const user = await User.findOne({
      where: { id:req.userId },
      raw: true,
    });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    // Extract values from user table
    const uid = user.kite_client_id;       // Shoonya Login ID
    const password = user.kite_pin;        // Shoonya password
    const totpSecret = user.kite_secret;   // Shoonya TOTP Base32 secret

    if (!uid || !password || !totpSecret) {
      return res.status(400).json({
        status: false,
        message: "Shoonya credentials missing in user profile",
      });
    }

    // 2️⃣ Generate 6-digit TOTP from Base32 secret
    const factor2 = speakeasy.totp({
      secret: totpSecret,
      encoding: "base32",
      digits: 6,
    });

    console.log("Generated Shoonya TOTP:", factor2);

    // 3️⃣ Compute SHA-256 hashed password (Shoonya requirement)
    const pwdHash = createHash("sha256").update(password).digest("hex");

    // 4️⃣ Compute Shoonya appkey (uid|apiKey)
    const apiKey = user.kite_key
    const appkeyRaw = `${uid}|${apiKey}`;
    const appkey = createHash("sha256").update(appkeyRaw).digest("hex");

    const vc = user.finavacia_vendor_code;
    const imei = user.finavacia_imei;

    // 5️⃣ Create payload for QuickAuth
    const loginPayload = {
      apkversion: "1.0.0",
      uid,
      pwd: pwdHash,
      factor2,
      vc,
      imei,
      source: "API",
      appkey,
    };

    console.log("Shoonya Login Payload:", loginPayload);

    // 6️⃣ POST request to Shoonya QuickAuth
    const jData = `jData=${JSON.stringify(loginPayload)}`;

    const response = await axios.post(
      "https://api.shoonya.com/NorenWClientTP/QuickAuth",
      jData,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const data = response.data;

    console.log("Shoonya Login Response:", data);

    // 7️⃣ Handle errors
    if (data.stat !== "Ok") {
      return res.status(400).json({
        status: false,
        message: data.emsg || "Shoonya login failed",
        data,
      });
    }

    // 8️⃣ Save susertoken to DB
    await User.update(
      { authToken: data.susertoken },
      { where: { id: req.userId} }
    );

    return res.json({
      status: true,
      brokerName:'finvasia',
      message: "Shoonya login successful",
      token: data.susertoken,
      actid: data.actid,
      username: data.uname,
    });

  } catch (err) {
    console.error("Shoonya login error:", err);
    return res.status(500).json({
      status: false,
      message: "Unexpected error during Shoonya login",
      error: err.message,
    });
  }
};













export const shoonyaLogin = async (req, res) => {
  try {
    const { userId, password, otp } = req.body;
    const vc = process.env.SHOONYA_VENDOR_CODE;
    const apiKey = process.env.SHOONYA_API_KEY;
    const imei = process.env.SHOONYA_IMEI;

    // 1. Hash the password (SHA-256)
    const pwdHash = createHash('sha256').update(password).digest('hex');

    // 2. Generate appkey (SHA-256 of "uid|apiKey")
    const appkeyRaw = `${userId}|${apiKey}`;
    const appkey = createHash('sha256').update(appkeyRaw).digest('hex');


    console.log(appkey,'appkey');
    

    // 3. Prepare login payload
    const loginPayload = {
      apkversion: '1.0.0',
      uid: userId,
      pwd: pwdHash, // Use hashed password
      factor2: otp,
      vc,
      imei,
      source: 'API',
      appkey,
    };

    // 4. Stringify and format as "jData=<payload>"
    const jData = `jData=${JSON.stringify(loginPayload)}`;

    // 5. Send POST request to Shoonya login endpoint
    const response = await axios.post(
      'https://api.shoonya.com/NorenWClientTP/QuickAuth',
      jData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const data = response.data;

    // 6. Check response status
    if (data.stat !== 'Ok') {
      return res.status(401).json({
        status: false,
        message: data.emsg || 'Shoonya login failed',
        data,
      });
    }

    // 7. Save `susertoken` to your database (mapped to your platform user)
    // Example: await User.update({ shoonyaToken: data.susertoken }, { where: { id: req.user.id } });

    // 8. Return success response
    return res.json({
      status: true,
      message: 'Shoonya login successful',
      data,
    });
  } catch (err) {
    console.error('Shoonya login error:', err);
    return res.status(500).json({
      status: false,
      message: 'Unexpected error in Shoonya login',
      error: err.message,
    });
  }
};

// -------------------------------
// POST FUNDS CONTROLLER
// -------------------------------
export const getShoonyaFunds = async (req, res) => {
  try {
    const { uid, susertoken } = req.body;

    if (!uid  || !susertoken) {
      return res.status(400).json({
        status: false,
        message: "uid, actid and susertoken are required",
      });
    }

    const url = `${SHOONYA_BASE_URL}/Limits`;

    // 👇 This object will become the JSON in jData
    const jData = {
      uid,    // e.g. "FN169676"
      actid:uid,  // e.g. "FN169676"
      // Optional: prd, seg, exch, etc.
      // prd: "C",
      // seg: "CM",
      // exch: "NSE",
    };



    // ✅ Build raw x-www-form-urlencoded string like in their curl examples
    const body = `jKey=${susertoken}&jData=${JSON.stringify(jData)}`;

    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = response?.data;

    if (!data || data.stat !== "Ok") {
      return res.status(400).json({
        status: false,
        message: data?.emsg || "Unable to fetch funds",
        raw: data,
      });
    }

    return res.json({
      status: true,
      message: "Funds (Limits) fetched successfully",
      funds: data,
    });
  } catch (error) {
    console.error("Shoonya Funds Error:", error?.response?.data || error);

    return res.status(500).json({
      status: false,
      message: "Shoonya funds fetch failed",
      error: error?.response?.data || error.message,
    });
  }
};

// -------------------------------
// POST ORDERS CONTROLLER
// -------------------------------
export const getShoonyaOrders = async (req, res) => {
  try {
    const { uid, susertoken } = req.body;

    if (!uid || !susertoken) {
      return res.status(400).json({
        status: false,
        message: "uid and susertoken are required",
      });
    }

    const url = `${SHOONYA_BASE_URL}/OrderBook`;

    const jData = { uid };

    const body = `jKey=${susertoken}&jData=${JSON.stringify(jData)}`;

    console.log("Shoonya /OrderBook body =>", body);

    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = response?.data;
    console.log("Finvasia orders raw:", data);

    if (!data) {
      return res.status(400).json({
        status: false,
        message: "No response from Shoonya OrderBook",
      });
    }

    // 🔹 Case A: "no data" → treat as success with empty orders
    if (
      !Array.isArray(data) &&
      data.stat === "Not_Ok" &&
      typeof data.emsg === "string" &&
      data.emsg.toLowerCase().includes("no data")
    ) {
      return res.json({
        status: true,
        message: "No orders found",
        count: 0,
        orders: [],
        raw: data,
      });
    }

    // 🔹 Case B: other errors from Shoonya
    if (!Array.isArray(data) && data.stat && data.stat !== "Ok") {
      return res.status(400).json({
        status: false,
        message: data?.emsg || "Unable to fetch orders",
        raw: data,
      });
    }

    // 🔹 Case C: Success – data is array or wrapped
    let orders = [];

    if (Array.isArray(data)) {
      orders = data;
    } else if (Array.isArray(data?.orders)) {
      orders = data.orders;
    }

    return res.json({
      status: true,
      message: "Orders fetched successfully",
      count: orders.length,
      orders,
      raw: data,
    });
  } catch (error) {
    console.error("Shoonya Orders Error:", error?.response?.data || error);

    return res.status(500).json({
      status: false,
      message: "Shoonya orders fetch failed",
      error: error?.response?.data || error.message,
    });
  }
};


// -------------------------------
// POST Trades CONTROLLER
// -------------------------------
export const getShoonyaTrades = async (req, res) => {
  try {
    // 🔹 Now expecting actid also
    const { uid, susertoken } = req.body;

     let actid = uid

    if (!uid || !actid || !susertoken) {
      return res.status(400).json({
        status: false,
        message: "uid, actid and susertoken are required",
      });
    }

   

    const url = `${SHOONYA_BASE_URL}/TradeBook`;

    // jData MUST have uid + actid
    const jData = {
      uid,   // e.g. "FN169676"
      actid, // e.g. "FN169676"
      // Optional filters if you want later:
      // exch: "NSE",
      // prd: "C",
      // seg: "CM",
    };

    // raw x-www-form-urlencoded (Shoonya style)
    const body = `jKey=${susertoken}&jData=${JSON.stringify(jData)}`;

    console.log("Shoonya /TradeBook body =>", body);

    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = response?.data;
    console.log("Finvasia trades raw:", data);

    if (!data) {
      return res.status(400).json({
        status: false,
        message: "No response from Shoonya TradeBook",
      });
    }

    // 🔹 Case A: "no data" → no trades
    if (
      !Array.isArray(data) &&
      data.stat === "Not_Ok" &&
      typeof data.emsg === "string" &&
      data.emsg.toLowerCase().includes("no data")
    ) {
      return res.json({
        status: true,
        message: "No trades found",
        count: 0,
        trades: [],
        raw: data,
      });
    }

    // 🔹 Case B: some other Shoonya error
    if (!Array.isArray(data) && data.stat && data.stat !== "Ok") {
      return res.status(400).json({
        status: false,
        message: data?.emsg || "Unable to fetch trades",
        raw: data,
      });
    }

    // 🔹 Case C: success – usually an array of trades
    let trades = [];

    if (Array.isArray(data)) {
      trades = data;
    } else if (Array.isArray(data?.trades)) {
      trades = data.trades;
    }

    return res.json({
      status: true,
      message: "Trades fetched successfully",
      count: trades.length,
      trades,
      raw: data,
    });
  } catch (error) {
    console.error("Shoonya Trades Error:", error?.response?.data || error);

    return res.status(500).json({
      status: false,
      message: "Shoonya trades fetch failed",
      error: error?.response?.data || error.message,
    });
  }
};
