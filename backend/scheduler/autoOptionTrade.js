
// cron/autoOptionTrade.js
import cron from "node-cron";
import axios from "axios";
import redis from "../utils/redis.js";
import zlib from "zlib";
import  Order  from "../models/orderModel.js";
import User  from "../models/userModel.js";
import AngelOneCredentialer from '../models/angelOneCredential.js'
import { Op } from "sequelize";
import { generateFillId , generateOrderId, generateUniqueOrderUUID } from "../controllers/admin/cloneUserController.js";
import {generateStrategyUniqueId} from "../utils/randomWords.js"
import {emitOrderGet,isSocketReady,connectSmartSocket} from "../services/smartapiFeed.js"
import { generateTOTP } from "../utils/generateTOTP.js";



// =======================================================
// CONFIGURATION
// =======================================================
const USER_ID = 4; // Fixed user ID
// const CRON_TIME = "16 9 * * 1-5"; // 9:16 AM, Monday to Friday
const CRON_TIME = "15 9 * * 1-5"; // 9:16 AM, Monday to Friday
const OPTION_TYPE = ["CE", "PE"]; // Both CE and PE
const QUANTITY = 1; // 1 lot
const ORDER_TYPE = "MARKET"; // MARKET order

// =======================================================
// HELPER: Check if buffer is compressed
// =======================================================
const isCompressedBuffer = (buffer) => {
  if (!Buffer.isBuffer(buffer)) return false;
  if (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) return 'gzip';
  if (buffer.length >= 2 && (buffer[0] === 0x78 && 
      (buffer[1] === 0x01 || buffer[1] === 0x5e || buffer[1] === 0x9c || buffer[1] === 0xda))) return 'deflate';
  return false;
};

// =======================================================
// HELPER: Parse expiry date
// =======================================================
const parseExpiryDate = (expiryStr) => {
  try {
    if (!expiryStr) return null;
    const day = expiryStr.slice(0, 2);
    const month = expiryStr.slice(2, 5).toUpperCase();
    const year = expiryStr.slice(5);
    const monthMap = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };
    if (monthMap[month] === undefined) return null;
    return new Date(Number(year), monthMap[month], Number(day), 23, 59, 59);
  } catch (err) {
    return null;
  }
};

// =======================================================
// STEP 1: Check if user is logged in to AngelOne
// =======================================================
const isAngelOneLoggedIn = async (userId) => {
  try {
    const user = await User.findOne({ where: { id: userId } });
    
    if (!user) return false;
    
    // Check if token exists and not expired
    const hasToken = !!user.authToken;
    const isExpired = user.angelLoginExpiry ? new Date(user.angelLoginExpiry) < new Date() : true;
    const isActive = user.angelLoginUser === true;
    
    const isLoggedIn = hasToken && !isExpired && isActive;
    
    console.log(`📊 Login status for user ${userId}: ${isLoggedIn ? "Logged In" : "Not Logged In"}`);
    console.log(`   - Has Token: ${hasToken}`);
    console.log(`   - Is Expired: ${isExpired}`);
    console.log(`   - Is Active: ${isActive}`);
    
    return isLoggedIn;
  } catch (error) {
    console.error("❌ Error checking login status:", error.message);
    return false;
  }
};

// =======================================================
// STEP 2: Login to AngelOne (using your existing logic)
// =======================================================
const loginToAngelOne = async (userId) => {
  try {
    console.log(`🔐 Attempting login for user ${userId}...`);
    
    // Get user from database
    const user = await User.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Get AngelOne credentials
    const existing = await AngelOneCredentialer.findOne({ where: { userId: userId } });
    
    if (!existing) {
      throw new Error("No AngelOne credentials found for this user");
    }
    
    const createdData = existing.dataValues;
    
    // Generate TOTP
    const totpCode = await generateTOTP(createdData.totpSecret);
    
    // Login payload
    const loginPayload = {
      clientcode: createdData.clientId,
      password: createdData.password,
      totp: totpCode,
    };
    
    const loginConfig = {
      method: 'post',
      url: 'https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP,
        'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP,
        'X-MACAddress': process.env.MAC_Address,
        'X-PrivateKey': user.kite_key,
      },
      data: JSON.stringify(loginPayload),
    };
    
    const { data } = await axios(loginConfig);
    
    if (data.status !== true) {
      throw new Error(data.message || "Login failed");
    }
    
    // Fetch fund details
    let dematFund = 0;
    try {
      const fundConfig = {
        method: 'get',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getRMS',
        headers: {
          'Authorization': `Bearer ${data.data.jwtToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-UserType': 'USER',
          'X-SourceID': 'WEB',
          'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP,
          'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP,
          'X-MACAddress': process.env.MAC_Address,
          'X-PrivateKey': user.kite_key,
        }
      };
      
      const fundResponse = await axios(fundConfig);
      
      if (fundResponse.data.status === true && fundResponse.data.data) {
        dematFund = fundResponse.data.data.net || 0;
        console.log("✅ Fund fetched:", dematFund);
      }
    } catch (fundError) {
      console.log("⚠️ Fund fetch error:", fundError.message);
    }
    
    // Update PostgreSQL
    await User.update({
      authToken: data.data.jwtToken,
      feedToken: data.data.feedToken,
      refreshToken: data.data.refreshToken,
      angelLoginUser: true,
      angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000),
      DematFund: dematFund,
    }, {
      where: { id: userId },
    });
    
    // Get updated user
    const postgreUser = await User.findByPk(userId, { raw: true });
    
    // Update MongoDB
    const tokens = {
      authToken: data.data.jwtToken,
      feedToken: data.data.feedToken,
      refreshToken: data.data.refreshToken,
      userToken: postgreUser.userToken,
    };
    
    delete postgreUser.authToken;
    delete postgreUser.feedToken;
    delete postgreUser.refreshToken;
    delete postgreUser.userToken;
    delete postgreUser.angelLoginUser;
    delete postgreUser.angelLoginExpiry;
    delete postgreUser.updatedAt;
    
    await UserMongodbModel.findOneAndUpdate(
      { postgreId: userId },
      {
        $set: {
          ...tokens,
          angelLoginUser: true,
          angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000),
          dematFund: dematFund,
        },
        $setOnInsert: {
          ...postgreUser,
          postgreId: userId,
        }
      },
      { upsert: true, new: true }
    );
    
    // Connect websocket
    if (!isSocketReady(userId)) {
      connectSmartSocket(userId, data.data.jwtToken, data.data.feedToken, createdData.clientId);
    }
    
    console.log(`✅ Successfully logged in user ${userId}`);
    return true;
    
  } catch (error) {
    console.error("❌ Login failed:", error.message);
    throw error;
  }
};

// =======================================================
// STEP 3: Ensure user is logged in (check + login if needed)
// =======================================================
const ensureAngelOneLogin = async (userId) => {
  const isLoggedIn = await isAngelOneLoggedIn(userId);
  
  if (!isLoggedIn) {
    console.log(`⚠️ User ${userId} not logged in. Attempting login...`);
    await loginToAngelOne(userId);
    console.log(`✅ Login completed for user ${userId}`);
  } else {
    console.log(`✅ User ${userId} is already logged in`);
  }
  
  return true;
}

// =======================================================
// STEP 4: Get NIFTY Current Price from AngelOne
// =======================================================
const getNiftyCurrentPrice = async (exchange="NSE",tradingsymbol="NIFTY 50",symboltoken="99926000") => {
  try {
    // First ensure user is logged in
    await ensureAngelOneLogin(USER_ID);
    
    // Get user from database
    const user = await User.findOne({ where: { id: USER_ID } });
    
    if (!user || !user.authToken) {
      throw new Error("User not found or not logged in");
    }
    
    // NIFTY 50 symbol details
    const payload = {
      exchange: exchange,
      tradingsymbol: tradingsymbol,
      symboltoken: symboltoken
    };
    
    const config = {
      method: 'post',
      url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getLtpData',
      headers: {
        'Authorization': `Bearer ${user.authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP,
        'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP,
        'X-MACAddress': process.env.MAC_Address,
        'X-PrivateKey': user.kite_key,
      },
      data: JSON.stringify(payload)
    };
    
    const response = await axios(config);
    
    if (response.data?.status === true && response.data?.data?.ltp) {
      const ltp = parseFloat(response.data.data.ltp);
      console.log(`📊 Current NIFTY Price: ${ltp}`);
      return ltp;
    } else {
      throw new Error("Failed to get LTP");
    }
    
  } catch (error) {
    console.error("❌ Error getting NIFTY price:", error.message);
    throw error;
  }
};

// =======================================================
// STEP 5: Calculate Strike Price
// =======================================================
const calculateStrikePrice = async(currentPrice) => {
  // Round to nearest 100
  const strike = Math.round(currentPrice / 100) * 100;
  console.log(`🎯 Calculated Strike Price: ${strike}`);
  return strike;
};

// =======================================================
// STEP 6: Search Instrument from Redis
// =======================================================
const searchInstrument = async (underlying, strike, type) => {
  try {
    const MERGED_KEY = "merged_instruments_new";
    const cached = await redis.getBuffer(MERGED_KEY);
    
    if (!cached) {
      throw new Error("No data in Redis");
    }
    
    let instruments = [];
    const compressionType = isCompressedBuffer(cached);
    
    if (compressionType === 'gzip') {
      const decompressed = zlib.gunzipSync(cached);
      const parsedData = JSON.parse(decompressed.toString("utf8"));
      instruments = parsedData.data || parsedData;
    } else {
      const parsedData = JSON.parse(cached.toString("utf8"));
      instruments = parsedData.data || parsedData;
    }
    
    if (!Array.isArray(instruments)) {
      instruments = [];
    }
    
    const today = new Date();
    
    // Try multiple search patterns
    const searchPatterns = [
      `${underlying}${strike}${type}`.toUpperCase(),           // NIFTY23500CE
      `${underlying} ${strike}${type}`.toUpperCase(),          // NIFTY 23500CE
      `${underlying} ${strike} ${type}`.toUpperCase(),         // NIFTY 23500 CE
      `${underlying}50${strike}${type}`.toUpperCase(),         // NIFTY5023500CE
      `${underlying}50 ${strike}${type}`.toUpperCase(),        // NIFTY50 23500CE
      `${underlying}50 ${strike} ${type}`.toUpperCase(),       // NIFTY50 23500 CE
      strike + type,                                            // 23500CE
    ];
    
    console.log(`🔍 Searching for ${underlying} ${strike}${type} with patterns:`, searchPatterns);
    
    // Find matching instruments
    let matches = [];
    
    for (const pattern of searchPatterns) {
      const found = instruments
        .filter(inst => {
          const symbol = (inst.symbol || "").toUpperCase();
          const name = (inst.name || "").toUpperCase();
          return symbol.includes(pattern) || name.includes(pattern);
        })
        .map(inst => {
          let expiryStr = inst.expiry;
          if (!expiryStr) {
            const match = (inst.symbol || "").match(/\d{2}[A-Z]{3}\d{4}/);
            expiryStr = match ? match[0] : null;
          }
          const expiryDate = expiryStr ? parseExpiryDate(expiryStr) : null;
          return { ...inst, expiryDate, expiryStr };
        })
        .filter(inst => inst.expiryDate && inst.expiryDate >= today)
        .sort((a, b) => a.expiryDate - b.expiryDate);
      
      if (found.length > 0) {
        matches = found;
        console.log(`✅ Found matches with pattern: ${pattern}`);
        break;
      }
    }
    
    if (matches.length === 0) {
      // Debug: Log some sample instruments to see the format
      const sampleInstruments = instruments.slice(0, 10).map(inst => ({
        symbol: inst.symbol,
        name: inst.name,
        expiry: inst.expiry
      }));
      console.log(`📋 Sample instruments from Redis:`, JSON.stringify(sampleInstruments, null, 2));
      throw new Error(`No instrument found for ${underlying} ${strike} ${type}`);
    }
    
    const nearest = matches[0];
    
    console.log(`✅ Found ${type}: ${nearest.symbol} (Token: ${nearest.token})`);
    
    return {
      token: nearest.token,
      symbol: nearest.symbol,
      exchange: nearest.exch_seg || "NSE",
      expiry: nearest.expiryStr,
      strike: nearest.strike || strike,
      name: nearest.name
    };
    
  } catch (error) {
    console.error(`❌ Error searching ${type}:`, error.message);
    throw error;
  }
};



// =======================================================
// STEP 7: Place Order in Database
// =======================================================
const placeOrder = async (instrument, optionType, currentPrice, strikePrice) => {
  try {
    const user = await User.findOne({ where: { id: USER_ID } });
    
    if (!user) {
      throw new Error("User not found");
    }
    
    const now = new Date();
    const strategyUniqueId = await generateStrategyUniqueId("auto-option");


    let ltp = await getNiftyCurrentPrice(instrument.exchange,instrument.symbol,instrument.token)


    console.log(ltp,'========================ltp symbol ========================');
    
    
    const orderData = {
      userId: USER_ID,
      username: user.username,
      userNameId:user.username,
      brokerName: "angelone",
      exchange: instrument.exchange,
      tradingsymbol: instrument.symbol,
      symboltoken: instrument.token,
      transactiontype: "BUY",
      ordertype: ORDER_TYPE,
      variety: "NORMAL",
      producttype: "NRML",
      duration: "DAY",
      lotSize: QUANTITY,
      quantity: 6500,
      price: ltp,
      strikeprice: strikePrice,
      optiontype: optionType,
      expirydate: instrument.expiry,
      orderid: generateOrderId(),
      uniqueorderid: generateUniqueOrderUUID(),
      fillid: generateFillId(),
      strategyName:user.firstName+"_"+user.lastName,
      strategyUniqueId: strategyUniqueId,
      status: "COMPLETE",
      orderstatus: "COMPLETE",
      orderstatuslocaldb: "OPEN",
      positionStatus: "OPEN",
      text: `AUTO_${optionType}_ORDER`,
      ordertag: "AUTO_OPTION_TRADE",
      fillprice: ltp,
      fillsize: 6500,
      tradedValue: 6500*ltp,
      filltime: now.toISOString(),
      exchorderupdatetime: now.toISOString(),
      parentorderid: "",
      cancelsize: "0",
      averageprice: 0,
      filledshares: "0",
      unfilledshares: String(QUANTITY),
      angelOneSymbol: instrument.symbol,
      angelOneToken: instrument.token,
      createdAt: now,
      updatedAt: now
    };
    
    const order = await Order.create(orderData);
    
    console.log(`✅ Order placed for ${optionType}: ${instrument.symbol}`);
    
    emitOrderGet();
    
    return order;
    
  } catch (error) {
    console.error(`❌ Error placing ${optionType} order:`, error.message);
    throw error;
  }
};

// =======================================================
// STEP 8: Main Auto Trade Function
// =======================================================
const executeAutoOptionTrade = async () => {
  console.log("\n========================================");
  console.log(`🚀 Starting Auto Option Trade at ${new Date().toISOString()}`);
  console.log("========================================\n");
  
  try {
    // Step 1: Ensure user is logged in
    console.log("📌 Checking login status...");
    await ensureAngelOneLogin(USER_ID);
    
    // Step 2: Get current NIFTY price
    const currentPrice = await getNiftyCurrentPrice();
    
    // Step 3: Calculate strike price
    const strikePrice = await calculateStrikePrice(currentPrice);



    
    
    // Step 4: Search and place orders for CE and PE
    const results = [];
    
    for (const optionType of OPTION_TYPE) {
      try {

         console.log("NIFTY", strikePrice, optionType,'=====================instrument running ================');
        const instrument = await searchInstrument("NIFTY", strikePrice, optionType);


        console.log(instrument,'=====================instrument================');
        

        const order = await placeOrder(instrument, optionType, currentPrice, strikePrice);
        
        results.push({
          optionType,
          success: true,
          orderId: order.orderid,
          symbol: instrument.symbol,
          token: instrument.token
        });
        
      } catch (error) {
        results.push({
          optionType,
          success: false,
          error: error.message
        });
      }
    }
    
    console.log("\n========================================");
    console.log("📊 Auto Trade Summary:");
    console.log(`Current NIFTY Price: ${currentPrice}`);
    console.log(`Strike Price: ${strikePrice}`);
    console.log("Results:", results);
    console.log("========================================\n");
    
    return { success: true, currentPrice, strikePrice, results };
    
  } catch (error) {
    console.error("❌ Auto Trade Failed:", error.message);
    return { success: false, error: error.message };
  }
};

// =======================================================
// STEP 9: Check if already executed today
// =======================================================
const isAlreadyExecutedToday = async () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  const existingOrder = await Order.findOne({
    where: {
      userId: USER_ID,
      ordertag: "AUTO_OPTION_TRADE",
      createdAt: {
        [Op.between]: [startOfDay, endOfDay]
      }
    }
  });
  
  return !!existingOrder;
};

// =======================================================
// STEP 10: Start Cron Job
// =======================================================
const startAutoOptionCron = async() => {
  console.log(`⏰ Scheduling auto option trade at 9:16 AM (${CRON_TIME})`);
  
    // Check if already executed today
    const alreadyExecuted = await isAlreadyExecutedToday();
    
    if (alreadyExecuted) {
      console.log("⚠️ Auto trade already executed today. Skipping...");
      return;
    }
    
    // Execute trade
    await executeAutoOptionTrade();

  
  console.log("✅ Auto option cron job started successfully!");
};

// =======================================================
// Manual trigger for testing
// =======================================================
export const manualTriggerAutoTrade = async (req, res) => {
  try {
    const result = await executeAutoOptionTrade();
    return res.json({
      success: true,
      message: "Auto trade executed manually",
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};





// startAutoOptionCron()


// =======================================================
// EXPORTS
// =======================================================
export { startAutoOptionCron, executeAutoOptionTrade };







const startAutoOptionCronBackup = async() => {

  console.log(`⏰ Scheduling auto option trade at 9:16 AM (${CRON_TIME})`);
  
  cron.schedule(CRON_TIME, async () => {
    console.log("\n🔔 Cron job triggered at", new Date().toISOString());
    
    // Check if already executed today
    const alreadyExecuted = await isAlreadyExecutedToday();
    
    if (alreadyExecuted) {
      console.log("⚠️ Auto trade already executed today. Skipping...");
      return;
    }
    
    // Execute trade
    await executeAutoOptionTrade();
    
  }, {
    timezone: "Asia/Kolkata"
  });


  
  console.log("✅ Auto option cron job started successfully!");
};




startAutoOptionCronBackup()














