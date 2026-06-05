import axios from "axios";
import User from "../models/userModel.js"
import UserMongodbModel from '../models/userMongodbModel.js'
import { logSuccess, logError } from "../utils/loggerr.js";
import Order from "../models/orderModel.js";


// ======== new update code ========
export const getGrowwTradesDataUserPosition = async function (req, res) {
  try {
    const userId = req.userId;

    const userData = await User.findOne({
      where: { id: userId },
      raw: true,
    });

    const growwToken = userData?.authToken;
    const BASE_URL = process.env.GROWW_BASE_URL||'https://api.groww.in/v1';

    if (!growwToken) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "Groww token not found",
      });
    }

    /* -------------------------------- */
    const callGrowwAPI = async (endpoint) => {
      const response = await axios.get(`${BASE_URL}/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${growwToken}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    };

    /* -------------------------------- */
    const positionsRes = await callGrowwAPI("positions/user");
    const ordersRes = await callGrowwAPI("order/list");

    let positions = positionsRes?.payload?.positions || [];
    const orders = ordersRes?.payload?.order_list || [];


    console.log(orders,'ordersordersorders');
    
    /* --------------------------------
       3:20 PM Condition
    ---------------------------------*/
    const now = new Date();
    const isAfter320 =
      now.getHours() > 15 ||
      (now.getHours() === 15 && now.getMinutes() >= 20);

    positions = isAfter320 ? [] : positions;

    if (!positions.length) {
      return res.json({
        status: true,
        statusCode: 200,
        message: "No Trade in User Position",
        onlineTrades: [],
      });
    }

    /* --------------------------------
       Filter Executed Orders
    ---------------------------------*/
    const executedOrders = orders.filter(
      (o) => o.order_status === "EXECUTED"
    );

    /* --------------------------------
       Fetch Trades Order-wise
    ---------------------------------*/
    const tradeMap = {};

    for (const order of executedOrders) {
      try {

        
        const tradeRes = await callGrowwAPI(
          `order/trades/${order.groww_order_id}?segment=${order.segment}`
        );

        const tradeData = tradeRes?.payload.trade_list || [];

        //  console.log(tradeData,'===========tradeRes===========');

        if (tradeData.length) {
          tradeMap[order.groww_order_id] = tradeData[0];
        }
      } catch (err) {
        console.log(
          `Trade fetch failed for ${order.groww_order_id}`,
          err.message
        );
      }
    }

    /* --------------------------------
       Map Positions Properly
    ---------------------------------*/
    const mappedTrades = [];

    for (const p of positions) {
      const quantity = Number(p.quantity || 0);
      if (quantity === 0) continue;

      const matchedOrder = executedOrders.find(
        (o) => o.trading_symbol === p.trading_symbol
      );

       const orderData = await Order.findOne({
      where: { 
        userId: userId,
        tradingsymbol:  p.trading_symbol,
       },
      raw: true,
    });

      const matchedTrade = matchedOrder
        ? tradeMap[matchedOrder.groww_order_id]
        : null;

      mappedTrades.push({
        tradingsymbol: p.trading_symbol || "-",
        exchange: p.exchange || "-",
        transaction_type: matchedOrder?.transaction_type || "BUY",
        product: p.product || "-",

        average_price: Number(p.net_price || 0),
        quantity: quantity,

        order_id: matchedOrder?.groww_order_id || "",
        trade_id: matchedTrade?.groww_trade_id || "",
        uniqueorderid: matchedOrder?.groww_order_id || "",

        transactiontype: matchedOrder?.transaction_type || "BUY",
        ordertype: matchedOrder?.order_type || "MARKET",
        producttype: p.product || "-",

        fillprice: String(
          matchedTrade?.price || matchedOrder?.average_fill_price || ""
        ),
        price: String(
          matchedTrade?.price || matchedOrder?.average_fill_price || ""
        ),

        pnl: String(p.realised_pnl || 0),
        cmp: "",

        fillsize: quantity,
        orderid: matchedOrder?.groww_order_id || "",

        status: "COMPLETE",
        instrumenttype: p.segment || "",
        orderstatus: matchedOrder?.order_status || "EXECUTED",

        text: "",
        updatetime:
          matchedTrade?.updated_at ||
          matchedOrder?.exchange_time ||
          "",

        symboltoken: orderData?.angelOneToken || "",
        createdAt: null,
        updatedAt: null,
      });
    }

    return res.json({
      status: true,
      statusCode: 200,
      message: "User Position Trades (Groww)",
      onlineTrades: mappedTrades,
    });

  } catch (error) {
    console.error("Groww Dashboard error:", error);

    return res.json({
      status: false,
      statusCode: 500,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const growwAppCredential = async (req, res) => {
  try {

    
    const userId = req.userId; // set by auth middleware

    const { authToken } = req.body;

    if (!userId) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "Unauthorized: missing userId",
      });
    }

    if (!authToken) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "authToken is required",
      });
    }

     const response = await axios.get(
      "https://api.groww.in/v1/margins/detail/user",
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
          "X-API-VERSION": "1.0",
        },
      }
    );

    const growwData = response.data;


    console.log(growwData,'===========growwData==========');
    

    // ✅ Fund calculation (Groww equivalent of Kite equity.net)
    const availableCash =
      growwData?.payload?.clear_cash || 0;


       await User.update( {
        authToken: authToken,
        angelLoginUser:true,
        angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours
      },
      {
        where: { id: userId},
        returning: true, // optional, to get the updated record
      }
    );


      

    // Find user
    const userData = await User.findByPk(userId);

    if (!userData) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    // Save/Update
    userData.authToken = authToken;
    userData.angelLoginUser = true
    userData.angelLoginExpiry= new Date(Date.now() + 10 * 60 * 60 * 1000),
    await userData.save();


       const user = await User.findByPk(userId,{ raw: true });

    


      //------------------------------------------------
              // ✅ TOKENS
              //------------------------------------------------
    
              const tokens = {
                authToken: authToken,
                feedToken: "",
                refreshToken: "",
                userToken: user?.userToken, // if needed
              };
    
              
    
            //------------------------------------------------
            // 🔥 MONGO UPSERT (BEST PRACTICE)
            //------------------------------------------------
    
            // remove conflicting fields
            delete user.authToken;
            delete user.feedToken;
            delete user.refreshToken;
            delete user.userToken;
            delete user.angelLoginUser;
            delete user.angelLoginExpiry;
            delete user.updatedAt;
    
            await UserMongodbModel.findOneAndUpdate(
              { postgreId: req.userId },
    
              {
                $set: {
                  ...tokens,
                  angelLoginUser: true,
                  angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000),
                },
    
                $setOnInsert: {
                  ...user,
                  postgreId: req.userId,
                }
              },
    
              {
                upsert: true,
                new: true,
              }
            );

    return res.json({
      status: true,
      statusCode: 200,
      message: "Groww credential saved successfully",
      data: {
        id: user.id,
        broker: "groww",
        hasToken: !!user.authToken,
      },
    });
  } catch (error) {
    console.error("growwAppCredential error:", error.response.data);

      logError(req, error.response.data, {
      msg: "growwAppCredential error:",
      error: error.response.data
    });

    return res.json({
      status: false,
      statusCode: 500,
      message: "Failed to save Groww credentials",
      error: error.message,
    });
  }
};


export const getGrowwAppCredential = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "Unauthorized: missing userId",
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    const authToken = user.authToken || "";

    return res.json({
      status: true,
      statusCode: 200,
      message: authToken ? "Groww credential loaded" : "No Groww credential found",
      data: { authToken },
    });
  } catch (error) {
    console.error("getGrowwAppCredential error:", error);

    return res.json({
      status: false,
      statusCode: 500,
      message: "Failed to fetch Groww credentials",
      error: error.message,
    });
  }
};


export const getGrowwUserDetail = async (req, res) => {
  try {

    // Option 1: frontend se header me
    const growwToken = process.env.GROWW_TOKEN

    // Option 2: DB se (example)
    // const growwToken = req.user.growwToken;

    if (!growwToken) {
      return res.status(400).json({
        status: false,
        message: "Groww access token required",
      });
    }

    const response = await axios.get(
      "https://api.groww.in/v1/user/detail",
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${growwToken}`,
          "X-API-VERSION": "1.0",
        },
      }
    );

    return res.status(200).json({
      status: true,
      message: "Groww user detail fetched successfully",
      data: response.data,
    });

  } catch (error) {
    console.error("Groww API Error:", error?.response?.data || error.message);

    return res.status(500).json({
      status: false,
      message:
        error?.response?.data?.message ||
        "Failed to fetch Groww user detail",
    });
  }
};






export const getGrowwUserMargins = async (req, res) => {
  try {
    // Groww access token
    const growwToken = req.headers.angelonetoken;

    if (!growwToken) {
      return res.status(400).json({
        status: false,
        message: "Groww access token required",
      });
    }

    const response = await axios.get(
      "https://api.groww.in/v1/margins/detail/user",
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${growwToken}`,
          "X-API-VERSION": "1.0",
        },
      }
    );

    const growwData = response.data;

    // ✅ ============= Fund calculation running code ===============
    // const availableCash =
    //   growwData?.payload?.clear_cash || 0;


        // growwData?.payload?.net_margin_used || 0;

      

      console.log(growwData?.payload,'============growwData?.payload fund==========');
      
       const clearCash = growwData.payload.clear_cash || 0;

    const optionBuyBalance =
      growwData?.payload.fno_margin_details?.option_buy_balance_available || 0;

    const cncBalance =
      growwData?.payload.equity_margin_details?.cnc_balance_available || 0;

    // 🔥 Choose highest usable balance
    const availableCash = growwData.payload.clear_cash - growwData.payload.net_margin_used

    

    console.log(availableCash,'availableCashavailableCashavailableCash');
    

    return res.status(200).json({
      status: true,
      statusCode: 200,
      message: "Funds & margins retrieved successfully",
      data: {
         raw: growwData,              // full Groww response
        availablecash: availableCash // Kite-style fund
      },
    });

  } catch (error) {
    console.error(
      "Groww Margins API Error:",
      error?.response?.data || error.message
    );

    return res.status(500).json({
      status: false,
      message:
        error?.response?.data?.message ||
        "Failed to fetch Groww user margins",
    });
  }
};





/* =====================================================
        GET SINGLE ORDER (DB + GROWW STATUS)
===================================================== */

export const getGrowwOrder = async (req, res) => {
  try {

    let GROWW_BASE_URL = 'https://api.groww.in/v1'
    let orderId = 'GMKFO260210145456YAV21RFKVP98'
    let token  =
'eyJraWQiOiJaTUtjVXciLCJhbGciOiJFUzI1NiJ9.eyJleHAiOjE3NzIxNTIyMDAsImlhdCI6MTc3MjA3OTAyNiwibmJmIjoxNzcyMDc5MDI2LCJzdWIiOiJ7XCJ0b2tlblJlZklkXCI6XCJmZTE4YzcwZi1iMGUwLTRlY2MtOGM0ZC0zYzY4YjViMGUzYjFcIixcInZlbmRvckludGVncmF0aW9uS2V5XCI6XCJlMzFmZjIzYjA4NmI0MDZjODg3NGIyZjZkODQ5NTMxM1wiLFwidXNlckFjY291bnRJZFwiOlwiODY0MGM0OTgtYjEzOS00NTE4LTkxMzMtYjM5Y2VlNDA1YWY0XCIsXCJkZXZpY2VJZFwiOlwiODc5MmY1Y2ItZWMyMC01YmQ0LWIyY2EtMDBlZjMyNGUxYzk2XCIsXCJzZXNzaW9uSWRcIjpcImQ5MTliMGZjLTAwZTMtNDYxYy1hMDZiLWUzZGU1YWI3NzIzMVwiLFwiYWRkaXRpb25hbERhdGFcIjpcIno1NC9NZzltdjE2WXdmb0gvS0EwYkFhUU55Q3R5ai9KeDQzU0I0UzRic1pSTkczdTlLa2pWZDNoWjU1ZStNZERhWXBOVi9UOUxIRmtQejFFQisybTdRPT1cIixcInJvbGVcIjpcIm9yZGVyLWJhc2ljLGxpdmVfZGF0YS1iYXNpYyxub25fdHJhZGluZy1iYXNpYyxvcmRlcl9yZWFkX29ubHktYmFzaWNcIixcInNvdXJjZUlwQWRkcmVzc1wiOlwiMTgyLjcwLjI1MC4xNTYsMTcyLjY5Ljg3Ljg2LDM1LjI0MS4yMy4xMjNcIixcInR3b0ZhRXhwaXJ5VHNcIjoxNzcyMTUyMjAwMDAwfSIsImlzcyI6ImFwZXgtYXV0aC1wcm9kLWFwcCJ9.5dEcO6r1SxO3CL8-I06aIQObSgR2SxMUhCNcKMNKGRa435izcKd8VpRWYUD5l2HdiHRCv_ePiBFjkrzTjt6zew'
    if (!orderId) {

      return res.json({
        status: false,
        message: "orderId is required"
      });
    }

   

    /* ================= BROKER STATUS (OPTIONAL) ================= */

      let growwStatus = null;
      let segment = 'FNO'

    
      try {

        const resGroww = await axios.get(
          // `${GROWW_BASE_URL}/order/status/${orderId}?segment=${"CASH"}`,
           `${GROWW_BASE_URL}/order/list`,
          // `${GROWW_BASE_URL}/order/trades/${orderId}?segment=${"FNO"}`,
          //  `${GROWW_BASE_URL}/order/trades/${orderId}?segment=${segment}`,
            // `${GROWW_BASE_URL}/order/trades/${orderId}`,

          // `${GROWW_BASE_URL}/positions/user`,


            
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "X-API-VERSION": "1.0",
            },
          }
        );

       growwStatus = resGroww.data
        

       console.log('groww live order status fetched successfully');
       

      } catch (err) {

       console.log(err,'groww error');
       
      }
    

    /* ================= RESPONSE ================= */

    return res.json({
      status: true,
      message: "Order fetched successfully",
      data: growwStatus
    });

  } catch (err) {

    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
};













