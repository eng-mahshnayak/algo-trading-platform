import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import { KiteAccess } from "../utils/kiteClient.js";
import axios from "axios";
import crypto from "crypto";
import { getKiteClientForUserId } from "../services/userKiteBrokerService.js";
import { Op } from "sequelize";
import { GetInstrumentAngelone } from "../utils/getRedisInstrument.js";

import { logSuccess, logError } from "../utils/loggerr.js";
import UserMongodbModel from '../models/userMongodbModel.js'

export const getKiteAllInstruments = async (req, res) => {
  try {
    // 2️⃣ If not in cache → Call Kite API
    // ===========================================
    const apiKey = process.env.KITE_API_KEY;
    const kite = KiteAccess(apiKey);

    const instruments = await kite.getInstruments(); // heavy call

    return res.json({
      status: true,
      statusCode: 200,
      data: instruments,
      cache: false,
      message: "Kite instruments fetched from API and cached in Redis",
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




export const kiteAppCredential = async (req, res) => {
  try {

    const userId = req.userId; // set by auth middleware
    
    const { clientId, totpSecret,pin,apiKey } = req.body;

    console.log(req.body);
    

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

export const kiteAppCredentialGet = async (req, res) => {
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
      message: "Kite App Credentials fetched",
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
      message: "Failed to fetch kite app credentials",
      error: error.message,
    });
  }
};


// ======================================
// =============== testing  code start 
// ======================================

export const kiteLogin1 = async (req, res) => {
  try {

    const userId = req.userId;

    if (!userId) {

      logError(req, null, {
        action: "KITE_LOGIN",
        msg: "Unauthorized access attempt",
      });

      return res.status(401).json({
        status: false,
        message: "User not authenticated",
      });
    }

    const user = await User.findOne({
      where: { id: userId },
      attributes: ["id", "kite_key", "kite_secret"],
    });

    if (!user) {

      logError(req, null, {
        action: "KITE_LOGIN",
        userId,
        msg: "User not found",
      });

      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    if (!user.kite_key || !user.kite_secret) {

      logError(req, null, {
        action: "KITE_LOGIN",
        userId,
        broker: "kite",
        msg: "API key/secret missing",
      });

      return res.status(400).json({
        status: false,
        message: "Kite API key/secret not configured",
      });
    }

    const kite = KiteAccess(user.kite_key);

    const loginUrl = kite.getLoginURL() +
  `&redirect_params=${encodeURIComponent(`uid=${user.id}`)}`;

    logSuccess(req, {
      action: "KITE_LOGIN",
      userId,
      broker: "kite",
      msg: "Login URL generated successfully",
    });

    return res.status(200).json({
      status: true,
      data: { loginUrl },
    });

  } catch (error) {

    logError(req, error, {
      action: "KITE_LOGIN",
      userId: req.userId,
      broker: "kite",
      msg: "Failed to generate login URL",
    });

    return res.status(500).json({
      status: false,
      message: "Failed to generate login URL",
    });
  }
};

const generateKiteChecksum1 = (apiKey, requestToken, apiSecret) => {

    const str = apiKey + requestToken + apiSecret;

    return crypto.createHash("sha256").update(str).digest("hex");

};

export const kiteCallback1 = async (req, res) => {

  const { request_token, uid } = req.query;

  if (!request_token) {

    logError(req, null, {
      action: "KITE_CALLBACK",
      broker: "kite",
      msg: "Missing request_token",
    });

    return res.status(400).json({
      status: false,
      message: "Missing request_token",
    });
  }

  try {

    const user = await User.findByPk(uid);

    if (!user) {

      logError(req, null, {
        action: "KITE_CALLBACK",
        broker: "kite",
        msg: "User not found from state",
        state,
      });

      return res.redirect(`${process.env.FRONTEND_URL}/kite-login-failed`);
    }

    //  console.log("KiteAccess generated:");

    // const kite = KiteAccess(user.kite_key);

    //   console.log("generateSession generated:");

    // let res = await kite.generateSession(request_token, user.kite_secret)

    //  console.log("Session generated:", res);

    logSuccess(req, {
      action: "KITE_CALLBACK",
      userId: user.id,
      broker: "kite",
      msg: "Callback received, generating session",
    });

    console.log( user.kite_key,user.kite_secret,'user.kite_secret');
    

    const checksum = generateKiteChecksum(
      user.kite_key,
      request_token,
      user.kite_secret
    );

    console.log(checksum,'=========checksum=============');
    

    const response = await axios.post(
      "https://api.kite.trade/session/token",
      new URLSearchParams({
        api_key: user.kite_key,
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

     console.log(response.data.data,'=========response=============');

    if (response.data?.status === "success") {

      const session = response.data.data;

      await user.update({
        authToken: session.access_token,
        feedToken: session.public_token,
        refreshToken: session.enctoken,
        angelLoginUser: true,
        angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000),
      });

      logSuccess(req, {
        action: "KITE_SESSION_CREATED",
        userId: user.id,
        broker: "kite",
        msg: "Access token generated and stored",
      });


            //------------------------------------------------
            // ✅ 1. Find user in Postgre
            //------------------------------------------------
            const postgreUser = await User.findByPk(user.id, { raw: true });

            if (!postgreUser) {
              console.log("❌ User not found in Postgre");
              return null;
            }

              //------------------------------------------------
              // ✅ TOKENS
              //------------------------------------------------
    
              const tokens = {
                authToken: postgreUser.authToken,
                feedToken:  postgreUser.feedToken,
                refreshToken: postgreUser.refreshToken,
                userToken: postgreUser.userToken, // if needed
              };
    
              
    
            //------------------------------------------------
            // 🔥 MONGO UPSERT (BEST PRACTICE)
            //------------------------------------------------
    
            // remove conflicting fields
            delete postgreUser.authToken;
            delete postgreUser.feedToken;
            delete postgreUser.refreshToken;
            delete postgreUser.userToken;
            delete postgreUser.angelLoginUser;
            delete postgreUser.angelLoginExpiry;
            delete postgreUser.updatedAt;
    
            await UserMongodbModel.findOneAndUpdate(
              { postgreId: user.id },
    
              {
                $set: {
                  ...tokens,
                  angelLoginUser: true,
                  angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000),
                },
    
                $setOnInsert: {
                  ...postgreUser,
                  postgreId: user.id,
                }
              },
    
              {
                upsert: true,
                new: true,
              }
            );


      return res.redirect(
        `${process.env.FRONTEND_URL}/dashboard`
      );
    }

    logError(req, null, {
      action: "KITE_SESSION_FAILED",
      userId: user.id,
      broker: "kite",
      msg: "Kite returned non-success response",
      response: response.data,
    });

    return res.redirect(`${process.env.FRONTEND_URL}/kite-login-failed`);

  } catch (error) {

    logError(req, error, {
      action: "KITE_CALLBACK_ERROR",
      broker: "kite",
      msg: "Unexpected error during Kite callback",
    });

    return res.redirect(
      `${process.env.FRONTEND_URL}/kite-login-failed`
    );
  }
};


// ======================================
// =============== testing  code end  
// ======================================





// ======================================
// =============== production code start 
// ======================================


// ===================== KITE LOGIN URL =====================
export const kiteLogin = async (req, res) => {
  try {
    // 👇 1) Get logged-in user's id (adjust according to your auth setup)
    const userId = req.userId; // or req.user.id / req.params.id

          console.log('========================kite userId=====================');

    if (!userId) {
      return res.status(401).json({
        status: false,
        message: "User not authenticated",
      });
    }

       console.log('========================kite userId 12345=====================');

    // 👇 2) Fetch user from DB
    const user = await User.findOne({
      where: { id: userId },
      attributes: ["id", "kite_key", "kite_secret"],
    });

      console.log('========================kite user login link 12 34=====================');

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

     console.log('========================kite user login link 12=====================');

    // 👇 3) Use user-specific api key
    const kite = KiteAccess(user.kite_key);

    // running code 
    // const loginUrl = kite.getLoginURL();

    // optimised code and also not tested 
     const loginUrl = kite.getLoginURL({
       userId: user.id  
     });


     console.log(loginUrl,user.id,'========================kite user login link=====================');
     
    
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
    });

    if (!kiteUsers || kiteUsers.length === 0) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/kite-login-failed?error=${encodeURIComponent(
          "No Kite users configured"
        )}`
      );
    }

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
          
          // ========== 3️⃣ FETCH FUND DETAILS FROM KITE ==========
          let dematFund = 0;
          
          try {
            
          const  kiteClient  = await getKiteClientForUserId(user.id,session.access_token,true)

           // Helper: sirf number allow karega
          const getNumber = (val) =>
            typeof val === "number" ? val : undefined;

            // Get margins/funds
            const funds = await kiteClient.getMargins();
            console.log(`✅ Kite funds  ${user.id}:`, funds);
            
            dematFund = funds?.equity?.net || funds?.equity?.available|| 0;

            // Step 2: agar object hai to usme se value nikalo
          if (typeof dematFund === "object" && dematFund !== null) {
            dematFund =
              getNumber(dematFund?.live_balance) ??
              getNumber(dematFund?.cash) ??
              getNumber(dematFund?.opening_balance) ??
              0;
          } else {
            dematFund = getNumber(dematFund) ?? 0;
          }


            console.log(`✅ Kite funds fetched for user ${user.id}:`, dematFund);
          } catch (fundError) {
            console.warn(
              `⚠️ Failed to fetch funds for user ${user.id}:`,
              fundError.message
            );
            // Continue with login even if fund fetch fails
          }


          // ========== 4️⃣ UPDATE USER WITH TOKENS AND FUND ==========
          await User.update(
            {
              authToken: session.access_token,
              angelLoginUser: true,
              angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours
              feedToken: session.public_token,
              refreshToken: session.enctoken, // may be undefined, that's fine
              DematFund: dematFund, // Update demat fund
            },
            {
              where: { id: user.id },
            }
          );

          console.log(
            "✅ Kite session matched & tokens/funds updated for user:",
            user.id
          );

          // ========== 5️⃣ UPDATE MONGO DB ==========
          try {
            // Get updated user data
            const updatedUser = await User.findByPk(user.id, { raw: true });
            
            if (updatedUser) {
              // Remove conflicting fields
              delete updatedUser.authToken;
              delete updatedUser.feedToken;
              delete updatedUser.refreshToken;
              delete updatedUser.userToken;
              delete updatedUser.angelLoginUser;
              delete updatedUser.angelLoginExpiry;
              delete updatedUser.dematFund;
              delete updatedUser.updatedAt;

              // Upsert to MongoDB
              await UserMongodbModel.findOneAndUpdate(
                { postgreId: user.id },
                {
                  $set: {
                    authToken: session.access_token,
                    feedToken: session.public_token,
                    refreshToken: session.enctoken,
                    userToken: updatedUser.userToken,
                    angelLoginUser: true,
                    angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000),
                    dematFund: dematFund,
                  },
                  $setOnInsert: {
                    ...updatedUser,
                    postgreId: user.id,
                  }
                },
                {
                  upsert: true,
                  new: true,
                }
              );
              
              console.log(`✅ MongoDB updated for user ${user.id}`);
            }
          } catch (mongoError) {
            console.warn(`⚠️ MongoDB update failed for user ${user.id}:`, mongoError.message);
            // Continue with redirect even if mongo update fails
          }

          // ========== 6️⃣ REDIRECT WITH SUCCESS ==========
          return res.redirect(
            `${process.env.FRONTEND_URL}/dashboard?access_token=${session.access_token}&dematFund=${dematFund}`
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

    // 7️⃣ If we reach here, NO user succeeded
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

// ===================== KITE CALLBACK  Running=====================
export const kiteCallback121 = async (req, res) => {
  
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

    if (!kiteUsers || kiteUsers.length === 0) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/kite-login-failed?error=${encodeURIComponent(
          "No Kite users configured"
        )}`
      );
    }


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



// ======================================
// =============== production code end  
// ======================================


// ===================== FUNDS + ORDERS =====================
export const getKiteFunds1 = async (req, res) => {
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

    // 1️⃣ Get Funds
    const funds = await kite.getMargins();

    const availableCash = funds?.equity?.net || 0;

    // 2️⃣ Get all orders
    let orders = await kite.getOrders();


    console.log( orders,'orders');
    

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

export const getKiteFunds_holding_api = async (req, res) => {
  try {
    const token = req.headers.angelonetoken;

     const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const startISO = startOfDay.toISOString();
    const endISO = endOfDay.toISOString();

    if (!token) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Kite access token missing in header (angelonetoken)",
        error: null,
      });
    }

    // 🔹 Get Kite client for funds only (orders will come from Local DB)
    const kite = await getKiteClientForUserId(req.userId);

    // -------------------------------
    // 1️⃣ GET FUNDS FROM KITE API
    // -------------------------------
    const funds = await kite.getMargins();
    const availableCash = funds?.equity?.net || 0;

    // ---------------------------------
    // 2️⃣ FETCH ORDERS FROM LOCAL DB
    // ---------------------------------
    let orders = await Order.findAll({
      where: {
        userId: req.userId,
        orderstatuslocaldb: "COMPLETE", // ONLY completed orders
        filltime: { [Op.between]: [startISO, endISO] },
      },
      order: [["createdAt", "DESC"]], // Latest first
      raw: true,
    });

    // ---------------------------------
    // 3️⃣ MAP LOCAL DB FIELDS → FRONTEND FORMAT
    // ---------------------------------
    const mappedOrders = orders.map((o) => ({
      tradingsymbol: o.tradingsymbol,
      orderid: o.orderid,
      transactiontype: o.transactiontype,
      lotsize: Number(o.quantity),
      averageprice: Number(o.fillprice || o.averageprice || 0),
      orderstatus: o.orderstatuslocaldb,
      ordertime: o.filltime || o.createdAt,
    }));

    // ---------------------------------
    // 4️⃣ TAKE LAST 5 ORDERS FOR DASHBOARD
    // ---------------------------------
    const recentFiveOrders = mappedOrders.slice(0, 5);

    return res.json({
      status: true,
      statusCode: 200,
      message: "Funds & Local Orders retrieved successfully",
      data: {
        raw: funds,
        availablecash: availableCash,
      },
      totalOrders: mappedOrders,
      recentOrders: recentFiveOrders,
    });
  } catch (error) {
    console.log("Local Kite Orders Fetch Error:", error);

    return res.json({
      status: false,
      statusCode: 500,
      message: "Error fetching funds & local kite orders",
      error: error.message,
    });
  }
};

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

    // 🔹 Get Kite client for funds only (orders will come from Local DB)
    const kite = await getKiteClientForUserId(req.userId);

    // -------------------------------
    // 1️⃣ GET FUNDS FROM KITE API
    // -------------------------------
    const funds = await kite.getMargins();

     console.log(funds,'=================funds=================');

    const availableCash = funds?.equity?.net || 0;


    console.log(availableCash,'=================availableCash=================');
    

    return res.json({
      status: true,
      statusCode: 200,
      message: "Funds & Local Orders retrieved successfully",
      data: {
        raw: funds,
        availablecash: availableCash,
      },
     
    });
  } catch (error) {
    console.log("Local Kite Orders Fetch Error:", error);

    return res.json({
      status: false,
      statusCode: 500,
      message: "Error fetching funds & local kite orders",
      error: error.message,
    });
  }
};

// ===================== DASHBOARD P&L =====================

export const getKiteTradesDataUserPositionRunning = async function (req, res, next) {
  try {

    const kiteToken = req.headers.angelonetoken;

    if (!kiteToken) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Login in Broker Account",
        error: null,
      });
    }

    const kite = await getKiteClientForUserId(req.userId);

    // 1️⃣ Get live trades from Kite
    const trades = await kite.getTrades();

    if (!Array.isArray(trades) || trades.length === 0) {
      return res.json({
        status: true,
        statusCode: 200,
        message: "No Trade in User Position",
        data: [],
        pnl: 0,
        totalTraded: 0,
        totalOpen: 0,
      });
    }

    // 2️⃣ Build list of Kite order_ids
    const kiteOrderIds = trades.map((t) => String(t.order_id));

    // 3️⃣ Find which of these orderids already exist in local DB
    const existingOrders = await Order.findAll({
      where: {
        userId: req.userId,
        orderid: {
          [Op.in]: kiteOrderIds,
        },
      },
      attributes: ["orderid"],
      raw: true,
    });

    const existingIdsSet = new Set(
      existingOrders.map((o) => String(o.orderid))
    );

    // 4️⃣ Filter only trades that are NOT in local DB
    const newTrades = trades.filter(
      (t) => !existingIdsSet.has(String(t.order_id))
    );


    if (!newTrades.length) {

      return res.json({
        status: true,
        statusCode: 200,
        message: "Trade in User Position",
        onlineTrades: [], // Raw trades not yet saved locall
      });
    }

  
    return res.json({
      status: true,
      statusCode: 200,
      message: "User Position Trades",
      onlineTrades: newTrades, // Raw trades not yet saved locally
     
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


// =============================== getKiteTradesDataUserPosition start====================== 

export const getKiteTradesDataUserPosition1 = async function (req, res, next) {
  try {
    const kiteToken = req.headers.angelonetoken;
    if (!kiteToken) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Login in Broker Account",
        error: null,
      });
    }

    const kite = await getKiteClientForUserId(req.userId);

    // Kite Position, Orders, Trades
    const positions = await kite.getPositions();
    const orders = await kite.getOrders();
    const trades = await kite.getTrades();


    console.log(positions,'====================positions===================');
    

    // Build trade map (order_id → trade)
    const tradeMap = {};
    for (const t of trades) {
      if (!tradeMap[t.order_id]) {
        tradeMap[t.order_id] = t;
      }
    }

    // Map positions to trades/orders (using both net and day)
    const mappedTrades = [];

    // Process NET positions
    for (const p of positions.net) {
      const quantity = Math.abs(Number(p.quantity || 0));
      if (quantity === 0) continue;

      const transaction_type = p.quantity > 0 ? "BUY" : "SELL";
      const matchedOrder = orders.find(o =>
        o.tradingsymbol === p.tradingsymbol &&
        o.transaction_type === transaction_type &&
        o.status === "COMPLETE"
      );

      const matchedTrade = matchedOrder ? tradeMap[matchedOrder.order_id] : null;

      mappedTrades.push({
        tradingsymbol: p.tradingsymbol || "-",
        exchange: p.exchange || "-",
        transaction_type,
        product: p.product || "-",
        average_price: Number(p.average_price || 0),
        quantity,

        order_id: matchedOrder?.order_id || "",
        trade_id: matchedTrade?.trade_id || "",
        uniqueorderid: matchedOrder?.order_id || matchedOrder?.uniqueorderid || "",

        transactiontype: transaction_type,
        ordertype: matchedOrder?.order_type || "MARKET",
        producttype: p.product || "-",
        fillprice: String(p.average_price || ""),
        price: String(p.average_price || ""),
        fillsize: quantity,
        orderid: matchedOrder?.order_id || "",
        status: "COMPLETE",
        instrumenttype: p.instrument_type || p.segment || "",
        orderstatus: matchedOrder?.status || "COMPLETE",
        text: "",
        updatetime: matchedOrder?.order_timestamp || matchedTrade?.exchange_timestamp || "",

        symboltoken: String(p.instrument_token || ""),

        createdAt: p.createdAt || null,
        updatedAt: p.updatedAt || null,
      });
    }

    // Process DAY positions (if needed)
    for (const p of positions.day) {
      const quantity = Math.abs(Number(p.quantity || 0));
      if (quantity === 0) continue;

      const transaction_type = p.quantity > 0 ? "BUY" : "SELL";
      const matchedOrder = orders.find(o =>
        o.tradingsymbol === p.tradingsymbol &&
        o.transaction_type === transaction_type &&
        o.status === "COMPLETE"
      );

      const matchedTrade = matchedOrder ? tradeMap[matchedOrder.order_id] : null;

      const existingTrade = mappedTrades.find(t => t.tradingsymbol === p.tradingsymbol);
      if (!existingTrade) {
        mappedTrades.push({
          tradingsymbol: p.tradingsymbol || "-",
          exchange: p.exchange || "-",
          transaction_type,
          product: p.product || "-",
          average_price: Number(p.average_price || 0),
          quantity,

          order_id: matchedOrder?.order_id || "",
          trade_id: matchedTrade?.trade_id || "",
          uniqueorderid: matchedOrder?.order_id || matchedOrder?.uniqueorderid || "",

          transactiontype: transaction_type,
          ordertype: matchedOrder?.order_type || "MARKET",
          producttype: p.product || "-",
          fillprice: String(p.average_price || ""),
          price: String(p.average_price || ""),
          fillsize: quantity,
          orderid: matchedOrder?.order_id || "",
          status: "COMPLETE",
          instrumenttype: p.instrument_type || p.segment || "",
          orderstatus: matchedOrder?.status || "COMPLETE",
          text: "",
          updatetime: matchedOrder?.order_timestamp || matchedTrade?.exchange_timestamp || "",

          symboltoken: String(p.instrument_token || ""),

          createdAt: p.createdAt || null,
          updatedAt: p.updatedAt || null,
        });
      }
    }

    // Get local open orders (for socket token list)
    const localOpenOrders = await Order.findAll({
      where: {
        orderstatuslocaldb: "OPEN",
        userId:req.userId
      },
      attributes: ["tradingsymbol"],
      raw: true,
    });

    // console.log(mappedTrades,'=====================mappedTrades===================');
    
    const localOpenSymbolSet = new Set(
      localOpenOrders.map(o => o.tradingsymbol)
    );

    const kiteOrders = orders.filter(o => {
    if (o.status !== "COMPLETE") return false;
    if (localOpenSymbolSet.has(o.tradingsymbol)) return false;
    return true;
  });

   

    // 🔥 UNIQUE trading symbols
    const tradingSymbols = [...new Map(
            kiteOrders
              .filter(o => o.status === "COMPLETE" && !localOpenSymbolSet.has(o.tradingsymbol))
              .map(o => [JSON.stringify({ tradingsymbol: o.tradingsymbol, exchange: o.exchange }), { tradingsymbol: o.tradingsymbol, exchange: o.exchange }])
          ).values()];




    
    let responseFun = await GetInstrumentAngelone(tradingSymbols)

  
    

    return res.json({
      status: true,
      statusCode: 200,
      message: "User Position Trades",
      onlineTrades: mappedTrades,
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


export const getKiteTradesDataUserPosition = async function (req, res, next) {
  try {
    const kiteToken = req.headers.angelonetoken;
    if (!kiteToken) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Login in Broker Account",
        error: null,
      });
    }

    const kite = await getKiteClientForUserId(req.userId);

    // Kite Position, Orders, Trades
    let positions = await kite.getPositions();
    const orders = await kite.getOrders();
    const trades = await kite.getTrades();


    const now = new Date();

      // IST time nikalna
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // 3:20 PM ke baad condition
      const isAfter320 =
        hours > 15 || (hours === 15 && minutes >= 20);

      //  positions = isAfter320 ? [] : positions;
       positions = isAfter320 ? {day:[]} : positions;

    if (!positions?.day?.length) {
      return res.json({
        status: true,
        statusCode: 200,
        message: "No Trade in User Position",
        onlineTrades: [],
        error: null,
      });
    }

    if (!trades.length) {
      return res.json({
        status: true,
        statusCode: 200,
        message: "No Trade in User Position",
        onlineTrades: [],
        error: null,
      });
    }

    

    // Build trade map (order_id → trade)
    const tradeMap = {};
    for (const t of trades) {
      if (!tradeMap[t.order_id]) {
        tradeMap[t.order_id] = t;
      }
    }

    // Map positions to trades/orders (using both net and day)
    const mappedTrades = [];

    // Process NET positions
    for (const p of positions?.net) {
      const quantity = Math.abs(Number(p.quantity || 0));
      if (quantity === 0) continue;

      const transaction_type = p.quantity > 0 ? "BUY" : "SELL";
      const matchedOrder = orders.find(o =>
        o.tradingsymbol === p.tradingsymbol &&
        o.transaction_type === transaction_type &&
        o.status === "COMPLETE"
      );

      const matchedTrade = matchedOrder ? tradeMap[matchedOrder.order_id] : null;

      mappedTrades.push({
        tradingsymbol: p.tradingsymbol || "-",
        exchange: p.exchange || "-",
        transaction_type,
        product: p.product || "-",
        average_price: Number(p.average_price || 0),
        quantity,

        order_id: matchedOrder?.order_id || "",
        trade_id: matchedTrade?.trade_id || "",
        uniqueorderid: matchedOrder?.order_id || matchedOrder?.uniqueorderid || "",

        transactiontype: transaction_type,
        ordertype: matchedOrder?.order_type || "MARKET",
        producttype: p.product || "-",
        fillprice: String(p.average_price || ""),
        price: String(p.average_price || ""),
        pnl: String(p.pnl || ""),
        cmp:String(p.last_price),
        fillsize: quantity,
        orderid: matchedOrder?.order_id || "",
        status: "COMPLETE",
        instrumenttype: p.instrument_type || p.segment || "",
        orderstatus: matchedOrder?.status || "COMPLETE",
        text: "",
        updatetime: matchedOrder?.order_timestamp || matchedTrade?.exchange_timestamp || "",

        symboltoken: String(p.instrument_token || ""),

        createdAt: p.createdAt || null,
        updatedAt: p.updatedAt || null,
      });
    }

    // Process DAY positions (if needed)
    for (const p of positions.day) {
      const quantity = Math.abs(Number(p.quantity || 0));
      if (quantity === 0) continue;

      const transaction_type = p.quantity > 0 ? "BUY" : "SELL";
      const matchedOrder = orders.find(o =>
        o.tradingsymbol === p.tradingsymbol &&
        o.transaction_type === transaction_type &&
        o.status === "COMPLETE"
      );

      const matchedTrade = matchedOrder ? tradeMap[matchedOrder.order_id] : null;

      const existingTrade = mappedTrades.find(t => t.tradingsymbol === p.tradingsymbol);
      if (!existingTrade) {
        mappedTrades.push({
          tradingsymbol: p.tradingsymbol || "-",
          exchange: p.exchange || "-",
          transaction_type,
          product: p.product || "-",
          average_price: Number(p.average_price || 0),
          quantity,
          order_id: matchedOrder?.order_id || "",
          trade_id: matchedTrade?.trade_id || "",
          uniqueorderid: matchedOrder?.order_id || matchedOrder?.uniqueorderid || "",
          transactiontype: transaction_type,
          ordertype: matchedOrder?.order_type || "MARKET",
          producttype: p.product || "-",
          fillprice: String(p.average_price || ""),
          price: String(p.average_price || ""),
          fillsize: quantity,
          orderid: matchedOrder?.order_id || "",
          status: "COMPLETE",
          instrumenttype: p.instrument_type || p.segment || "",
          orderstatus: matchedOrder?.status || "COMPLETE",
          text: "",
          updatetime: matchedOrder?.order_timestamp || matchedTrade?.exchange_timestamp || "",
          symboltoken: String(p.instrument_token || ""),
          createdAt: p.createdAt || null,
          updatedAt: p.updatedAt || null,
        });
      }
    }

  //   // Get local open orders (for socket token list)
  //   const localOpenOrders = await Order.findAll({
  //     where: {
  //       orderstatuslocaldb: "OPEN",
  //       userId:req.userId
  //     },
  //     attributes: ["tradingsymbol"],
  //     raw: true,
  //   });

  //   // console.log(mappedTrades,'=====================mappedTrades===================');
    
  //   const localOpenSymbolSet = new Set(
  //     localOpenOrders.map(o => o.tradingsymbol)
  //   );

  //   const kiteOrders = orders.filter(o => {
  //   if (o.status !== "COMPLETE") return false;
  //   if (localOpenSymbolSet.has(o.tradingsymbol)) return false;
  //   return true;
  // });

  //   // 🔥 UNIQUE trading symbols
  //   const tradingSymbols = [...new Map(
  //           kiteOrders
  //             .filter(o => o.status === "COMPLETE" && !localOpenSymbolSet.has(o.tradingsymbol))
  //             .map(o => [JSON.stringify({ tradingsymbol: o.tradingsymbol, exchange: o.exchange }), { tradingsymbol: o.tradingsymbol, exchange: o.exchange }])
  //         ).values()];

  //   let responseFun = await GetInstrumentAngelone(tradingSymbols)

    return res.json({
      status: true,
      statusCode: 200,
      message: "User Position Trades",
      onlineTrades: mappedTrades,
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

export const getKiteTradesDataUserPosition12 = async function (req, res, next) {
  try {
    const kiteToken = req.headers.angelonetoken;
    if (!kiteToken) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Login in Broker Account",
        error: null,
      });
    }

    const kite = await getKiteClientForUserId(req.userId);

    const positions = await kite.getPositions();
    const orders = await kite.getOrders();
    const trades = await kite.getTrades();

    // ---------- TRADE MAP ----------
    const tradeMap = {};
    for (const t of trades) {
      if (!tradeMap[t.order_id]) {
        tradeMap[t.order_id] = t;
      }
    }

    const mappedTrades = [];


    console.log(positions,'=====================positions========================');
    

    // ---------- NET POSITIONS ----------
    for (const p of positions.net) {
      const quantity = Math.abs(Number(p.quantity || 0));
      if (quantity === 0) continue;

      const transaction_type = p.quantity > 0 ? "BUY" : "SELL";

      const matchedOrder = orders.find(o =>
        o.tradingsymbol === p.tradingsymbol &&
        o.transaction_type === transaction_type &&
        o.status === "COMPLETE"
      );

      const matchedTrade = matchedOrder ? tradeMap[matchedOrder.order_id] : null;

      const tradeObj = {
        tradingsymbol: p.tradingsymbol || "-",
        exchange: p.exchange || "-",
        transaction_type,
        product: p.product || "-",
        average_price: Number(p.average_price || 0),
        quantity,

        order_id: matchedOrder?.order_id || "",
        trade_id: matchedTrade?.trade_id || "",
        uniqueorderid: matchedOrder?.order_id || matchedOrder?.uniqueorderid || "",

        transactiontype: transaction_type,
        ordertype: matchedOrder?.order_type || "MARKET",
        producttype: p.product || "-",
        fillprice: String(p.average_price || ""),
        price: String(p.average_price || ""),
        fillsize: quantity,
        orderid: matchedOrder?.order_id || "",
        status: "COMPLETE",
        instrumenttype: p.instrument_type || p.segment || "",
        orderstatus: matchedOrder?.status || "COMPLETE",
        text: "",
        updatetime: matchedOrder?.order_timestamp || matchedTrade?.exchange_timestamp || "",
        symboltoken: String(p.instrument_token || ""),

        userId: req.userId,
        role: req.userRole || "USER", // ADMIN / USER
      };

      mappedTrades.push(tradeObj);

      // ================= DB LOGIC START =================

      if (transaction_type === "BUY") {

        // Check existing ADMIN buy
        const existingAdminBuy = await Order.findOne({
          where: {
            tradingsymbol: tradeObj.tradingsymbol,
            transactiontype: "BUY",
            // role: "ADMIN",
          },
        });

        // Check existing USER buy
        const existingUserBuy = await Order.findOne({
          where: {
            tradingsymbol: tradeObj.tradingsymbol,
            transactiontype: "BUY",
            // role: "USER",
            userId: req.userId,
          },
        });

        if (existingAdminBuy && tradeObj.role === "USER") {
          // MERGE USER BUY INTO ADMIN BUY
          const totalQty = existingAdminBuy.quantity + tradeObj.quantity;
          const avgPrice =
            (existingAdminBuy.average_price * existingAdminBuy.quantity +
              tradeObj.average_price * tradeObj.quantity) / totalQty;

          await existingAdminBuy.update({
            quantity: totalQty,
            average_price: avgPrice,
          });

        } else if (!existingUserBuy) {
          // STORE NEW BUY
          await Order.create({
            ...tradeObj,
            remainingQty: tradeObj.quantity,
          });
        }

      } else if (transaction_type === "SELL") {

        // STORE SELL OBJECT
        await Order.create({
          ...tradeObj,
        });

        // CHECK ADMIN BUY TO UPDATE
        const adminBuy = await Order.findOne({
          where: {
            tradingsymbol: tradeObj.tradingsymbol,
            transactiontype: "BUY",
            // role: "ADMIN",
            remainingQty: { [Op.gt]: 0 },
          },
        });

        if (adminBuy) {
          const newRemaining =
            adminBuy.remainingQty - tradeObj.quantity;

          await adminBuy.update({
            remainingQty: Math.max(newRemaining, 0),
          });
        }
      }

      // ================= DB LOGIC END =================
    }

    return res.json({
      status: true,
      statusCode: 200,
      message: "User Position Trades",
      onlineTrades: mappedTrades,
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







// =============================== getKiteTradesDataUserPosition end ====================== 


export const getTradeDataForKiteDeshboard2 = async function (req, res) {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const startISO = startOfDay.toISOString();
    const endISO = endOfDay.toISOString();

    const userId = req.userId;

    // 🔥 Fetch trades saved in YOUR DB
    const trades = await Order.findAll({
      where: {
        userId,
        orderstatuslocaldb: "COMPLETE",
        filltime: { [Op.between]: [startISO, endISO] },
      },
      raw: true,
    });


     // 🔥 Fetch trades saved in YOUR DB
    const TotalTrades = await Order.count({
      where: {
        userId,
        orderstatuslocaldb: "COMPLETE",
        transactiontype:"BUY"
      },
      raw: true,
    });


    if (!trades.length) {
      return res.json({
        status: true,
        statusCode: 200,
        message: "No trades found",
        data: [],
        pnl: 0,
        totalTraded: 0,
        totalOpen: 0,
      });
    }

    // ------------------------------
    // 🚀 FIFO PnL CALCULATION (FINAL)
    // ------------------------------

    function calculateFIFO(trades) {
      const grouped = {};
      const output = [];
      let totalPnL = 0;

      for (const t of trades) {
        const symbol = t.tradingsymbol;

        if (!grouped[symbol]) {
          grouped[symbol] = {
            fifo: [],        // BUY Queue
            pnl: 0,
            qtyTraded: 0,
          };
        }

        const g = grouped[symbol];
        const qty = Number(t.fillsize || t.quantity);
        const price = Number(t.fillprice || t.averageprice);

        // BUY → push into FIFO
        if (t.transactiontype === "BUY") {
          g.fifo.push({ qty, price });
        }

        // SELL → match with FIFO
        else if (t.transactiontype === "SELL") {
          let remaining = qty;

          while (remaining > 0 && g.fifo.length) {
            const buyItem = g.fifo[0];
            const matched = Math.min(buyItem.qty, remaining);

            const pnl = (price - buyItem.price) * matched;
            g.pnl += pnl;
            totalPnL += pnl;

            buyItem.qty -= matched;
            remaining -= matched;

            if (buyItem.qty === 0) g.fifo.shift();
          }
        }
      }

      // Build output array
      for (const [symbol, g] of Object.entries(grouped)) {
        output.push({
          symbol,
          pnl: Number(g.pnl.toFixed(2)),
        });
      }

      return { pnlData: output, totalPnL: Number(totalPnL.toFixed(2)) };
    }

    const { pnlData, totalPnL } = calculateFIFO(trades);

    // Count Open Orders
    const openOrders = await Order.count({
      where: {
        userId,
        orderstatuslocaldb: "OPEN",
      },
    });

    return res.json({
      status: true,
      statusCode: 200,
      broker: "Kite",
      message: "Kite tradebook fetched",
      data: pnlData,
      onlineTrades: trades,
      pnl: totalPnL,
      totalTraded: TotalTrades,
      totalOpen: openOrders,
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

export const getTradeDataForKiteDeshboard1 = async function (req, res) {
  try {

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const startISO = startOfDay.toISOString();
    const endISO = endOfDay.toISOString();

    const userId = req.userId;

    // 🔥 Fetch trades saved in YOUR DB
    let trades = await Order.findAll({
      where: {
        userId,
        orderstatuslocaldb: "COMPLETE",
        filltime: { [Op.between]: [startISO, endISO] },
      },
      raw: true,
    });

    console.log(trades,'trades');
    

    // 🔥 Sort trades in FIFO order (IMPORTANT!)
    trades.sort((a, b) => new Date(a.filltime) - new Date(b.filltime));

    // 🔥 Count Total BUY trades
    const TotalTrades = await Order.count({
      where: {
        userId,
        orderstatuslocaldb: "COMPLETE",
        transactiontype: "BUY",
          filltime: { [Op.between]: [startISO, endISO] },
      },
    });

  console.log(TotalTrades,'TotalTrades');

    if (!trades.length) {
      return res.json({
        status: true,
        statusCode: 200,
        message: "No trades found",
        data: [],
        pnl: 0,
        totalTraded: 0,
        totalOpen: 0,
      });
    }

    // ------------------------------
    // 🚀 FIFO PnL CALCULATION (FINAL)
    // ------------------------------

function calculateFIFO(trades) {
  const grouped = {};
  const output = [];
  let totalPnL = 0;

  for (const t of trades) {
    const symbol = t.tradingsymbol;

    if (!grouped[symbol]) {
      grouped[symbol] = {
        buys: [],      // BUY queue (FIFO)
        totalBuyValue: 0,
        totalBuyQty: 0,
        totalSellValue: 0,
        totalSellQty: 0,
        pnl: 0,
      };
    }

    const g = grouped[symbol];
    const qty = Number(t.fillsize || t.quantity);
    const price = Number(t.fillprice || t.averageprice);

    // BUY ENTRY
    if (t.transactiontype === "BUY") {
      g.buys.push({ qty, price });
      g.totalBuyQty += qty;
      g.totalBuyValue += qty * price;
    }

    // SELL ENTRY
    if (t.transactiontype === "SELL") {
      g.totalSellQty += qty;
      g.totalSellValue += qty * price;

      let remaining = qty;

      while (remaining > 0 && g.buys.length) {
        const buy = g.buys[0];
        const matched = Math.min(buy.qty, remaining);

        const pnl = (price - buy.price) * matched;
        g.pnl += pnl;
        totalPnL += pnl;

        buy.qty -= matched;
        remaining -= matched;

        if (buy.qty === 0) g.buys.shift();
      }
    }
  }

  // Build formatted output
  for (const [symbol, g] of Object.entries(grouped)) {
    if (g.totalBuyQty > 0 && g.totalSellQty > 0) {
      const buyAvg = g.totalBuyValue / g.totalBuyQty;
      const sellAvg = g.totalSellValue / g.totalSellQty;
      const matchedQty = Math.min(g.totalBuyQty, g.totalSellQty);

      output.push({
        label: symbol,
        win: Number(buyAvg.toFixed(2)),
        loss: Number(sellAvg.toFixed(2)),
        quantity: matchedQty,
        pnl: Number(g.pnl.toFixed(2)),
      });
    }
  }

  return { pnlData: output, totalPnL: Number(totalPnL.toFixed(2)) };
}

    const { pnlData, totalPnL } = calculateFIFO(trades);

    // Count Open Orders
    const openOrders = await Order.count({
      where: { userId, orderstatuslocaldb: "OPEN" },
    });


    console.log(totalPnL,'TotalTrades');
    

    return res.json({
      status: true,
      statusCode: 200,
      broker: "Kite",
      message: "Kite tradebook fetched",
      data: pnlData,
      onlineTrades: trades,
      pnl: totalPnL,
      totalTraded: TotalTrades,
      totalOpen: openOrders,
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



export const getTradeDataForKiteDeshboard_Holding_API = async function (req, res) {
  try {
    // ✅ Today range (UTC based on ISO)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const startISO = startOfDay.toISOString();
    const endISO = endOfDay.toISOString();

    const userId = req.userId;

    // ✅ Fetch today's completed trades from DB
    let trades = await Order.findAll({
      where: {
        userId,
        orderstatuslocaldb: "COMPLETE",
        filltime: { [Op.between]: [startISO, endISO] },
      },
      raw: true,
    });

    // ✅ Total BUY trades count (your requirement)
    const TotalTrades = await Order.count({
      where: {
        userId,
        orderstatuslocaldb: "COMPLETE",
        transactiontype: "BUY",
        filltime: { [Op.between]: [startISO, endISO] },
      },
    });

    // ✅ Open orders count (OPEN + PENDING)
    const openOrders = await Order.count({
      where: {
        userId,
        orderstatuslocaldb: { [Op.in]: ["OPEN", "PENDING"] },
      },
    });

    if (!trades.length) {
      return res.json({
        status: true,
        statusCode: 200,
        message: "No trades found",
        data: [],
        onlineTrades: [],
        pnl: 0,
        totalTraded: TotalTrades,
        totalOpen: openOrders,
      });
    }

    // ✅ IMPORTANT: FIFO needs stable sorting
    // - Sort by filltime ascending
    // - If same time, BUY first then SELL
    // - If still same, by id ascending
    trades.sort((a, b) => {
      const ta = new Date(a.filltime).getTime();
      const tb = new Date(b.filltime).getTime();

      if (ta !== tb) return ta - tb;

      // BUY before SELL for same timestamp
      if (a.transactiontype !== b.transactiontype) {
        return a.transactiontype === "BUY" ? -1 : 1;
      }

      return Number(a.id || 0) - Number(b.id || 0);
    });

    // ------------------------------
    // ✅ FIFO PnL CALCULATION
    // ------------------------------
    function calculateFIFO(sortedTrades) {
      const grouped = {};
      const output = [];
      let totalPnL = 0;

      for (const t of sortedTrades) {
        const symbol = t.tradingsymbol;

        if (!grouped[symbol]) {
          grouped[symbol] = {
            buys: [], // FIFO queue
            totalBuyValue: 0,
            totalBuyQty: 0,
            totalSellValue: 0,
            totalSellQty: 0,
            pnl: 0,
          };
        }

        const g = grouped[symbol];

        const qty = Number(t.fillsize || t.quantity || 0);
        const price = Number(t.fillprice || t.averageprice || t.price || 0);

        if (!qty || !price) continue;

        // BUY
        if (t.transactiontype === "BUY") {
          g.buys.push({ qty, price });
          g.totalBuyQty += qty;
          g.totalBuyValue += qty * price;
        }

        // SELL
        if (t.transactiontype === "SELL") {
          g.totalSellQty += qty;
          g.totalSellValue += qty * price;

          let remaining = qty;

          while (remaining > 0 && g.buys.length) {
            const buy = g.buys[0];
            const matched = Math.min(buy.qty, remaining);

            const pnl = (price - buy.price) * matched;
            g.pnl += pnl;
            totalPnL += pnl;

            buy.qty -= matched;
            remaining -= matched;

            if (buy.qty === 0) g.buys.shift();
          }
        }
      }

      // Output per symbol
      for (const [symbol, g] of Object.entries(grouped)) {
        if (g.totalBuyQty > 0 && g.totalSellQty > 0) {
          const buyAvg = g.totalBuyValue / g.totalBuyQty;
          const sellAvg = g.totalSellValue / g.totalSellQty;
          const matchedQty = Math.min(g.totalBuyQty, g.totalSellQty);

          output.push({
            label: symbol,
            win: Number(buyAvg.toFixed(2)),   // avg buy
            loss: Number(sellAvg.toFixed(2)), // avg sell
            quantity: matchedQty,
            pnl: Number(g.pnl.toFixed(2)),
          });
        }
      }

      return {
        pnlData: output,
        totalPnL: Number(totalPnL.toFixed(2)),
      };
    }

    const { pnlData, totalPnL } = calculateFIFO(trades);

    return res.json({
      status: true,
      statusCode: 200,
      message: " tradebook fetched",
      data: pnlData,
      onlineTrades: trades,
      pnl: totalPnL,
      totalTraded: TotalTrades,
      totalOpen: openOrders,
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
export const getKiteHolding1 = async (req, res) => {
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

    console.log(orders,'holding');
    

    
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



export const getKiteHolding2 = async (req, res) => {
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

    // 1️⃣ Get Kite client and live holdings
    const kite = await getKiteClientForUserId(req.userId);
    const holdings = await kite.getHoldings(); // array of current holdings

    console.log("🔹 Kite holdings count:", holdings.length);

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
    });

    console.log("📦 Local old COMPLETE orders:", localOldOrders.length);

    // 4️⃣ Build set of symbols from local old orders (adjust field name if different)
    const oldSymbolSet = new Set(
      localOldOrders
        .map((o) => o.tradingsymbol || o.symbol || o.kiteSymbol)
        .filter(Boolean)
    );

    // 5️⃣ Filter Kite holdings to only those which exist in local old orders
    const filteredHoldings = holdings.filter((h) =>
      oldSymbolSet.has(h.tradingsymbol)
    );

    // 6️⃣ (Optional) Enrich holdings with related local orders
    const enrichedHoldings = filteredHoldings.map((h) => {
      const relatedOrders = localOldOrders.filter(
        (o) =>
          (o.tradingsymbol || o.symbol || o.kiteSymbol) === h.tradingsymbol
      );
      return {
        // ...h,
        // localOrders: relatedOrders,
             ...relatedOrders,

      };
    });

    console.log(enrichedHoldings,'enrichedHoldings');
    

    return res.json({
      status: true,
      statusCode: 200,
      data: enrichedHoldings, // ✅ only yesterday+old positions
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
export const getKiteHolding = async (req, res) => {
  try {

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


export const getKiteTrades = async (req, res) => {
  try {

    const  kite  = await getKiteClientForUserId(43)


    //  const  kite  = await getKiteClientForUserId(13)

    // const orders = await kite.getOrderHistory("1999368808602804224");

    //  const completeObj = orders.find(
    //       item => item.status?.toLowerCase() === "complete"
    //     );

        const orders = await kite.getOrders();

        // console.log('kite request !',orders);

              //  const orders = await kite.getOrderTrades("2004398212261355520");
        //  const orders = await kite.getPositions();

         
         

    // const orders = await kite.getHoldings();
    
    

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

    console.log(error);
    
    return res.json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error.message,
    });
  }
};

export const placeKiteOnlineOrder = async (req, res) => {
  try {

    const  kite  = await getKiteClientForUserId(21)

    // 4) Kite payload
    const orderParams = {
      exchange:"" ,
      tradingsymbol:"" ,
      transaction_type: "SELL",
      quantity:"",
      product: "NRML",           // product CNC , NRML , MIS , MTF
      tag:"softwaresetu",
      order_type:"MARKET" ,        // MARKET , LIMIT
      price: "" || 0,
      market_protection: 5,
    };

     placeRes = await kite.placeOrder("regular", orderParams);
   
    const orders = await kite.getOrders();

    return res.json({
      status: true,
      statusCode: 200,
      data: orders,
      message: "Successfully Place order ",
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

export const cancellKiteOnlineOrder = async (req, res) => {
  try {

    const  kite  = await getKiteClientForUserId(39)

    
    // const response = await kite.cancelOrder("regular", "2005853002329513984");

    // console.log(response,'response cancell');
    
   
    const orders = await kite.getOrders();

    console.log(orders);
    

    return res.json({
      status: true,
      statusCode: 200,
      data: orders,
      message: "Successfully Cancell order ",
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

  const  kite  = await getKiteClientForUserId(43)

  //  const orders = await kite.getOrders();

    const orders = await kite.getOrderTrades("260122151467261");
    

    // console.log(orders,'orders orders');
    

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


export const kiteHoldingFunApi = async(req,res)=> {

    try {
      
      const userId = 11

    const user = await User.findByPk(userId);
  
    if (!user) return { ok: false, statusCode: 400, message: "User missing" };

    const apiKey = user?.kite_key;
    const accessToken = user?.authToken;

    if (!apiKey || !accessToken) {
      return { ok: false, statusCode: 400, message: "Kite apiKey/accessToken missing" };
    }

    const url = "https://api.kite.trade/portfolio/positions";

    const resp = await axios.get(url, {
      timeout: 30000,
      headers: {
        "X-Kite-Version": "3",
        Authorization: `token ${apiKey}:${accessToken}`,
      },
    });

    const positions = resp?.data?.data; 

     return res.json({
      status: true,
      statusCode: 200,
      data: positions,
      message: "Successfully fetched Holding with trades",
    });

    } catch (error) {

      console.log(error);
      
      
    }
    

}



















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