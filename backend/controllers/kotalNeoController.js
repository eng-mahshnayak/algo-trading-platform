
// controllers/auth.controller.js
import axios from "axios";
import User from "../models/userModel.js"
import { generateTOTP } from "../utils/generateTOTP.js";
import { logSuccess, logError } from "../utils/loggerr.js";

const callInstanceLogin = async (user, req) => {
  try {
    
    // Build instance URL from user's public IP
    let instanceUrl = `http://${user.publicIp}`;

    //  let instanceUrl = `http://localhost:6000`;
    

    const endpoint = '/api/auth/kotakneo/login/totp'; // Endpoint on instance server
    
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        brokerName: user.brokerName,
        kite_client_id: user.kite_client_id,
        kite_secret: user.kite_secret,
        kite_key: user.kite_key,
        kite_pin: user.kite_pin,
        phoneNumber: user.phoneNumber,
        publicIp: user.publicIp
      },
      reqInfo: {
        originalReqId: req.id || Date.now(),
        timestamp: new Date().toISOString()
      }
    };

    logSuccess(req, {
      msg: "Calling instance for Kotak login",
      userId: user.id,
      instanceUrl,
      brokerName: user.brokerName
    });

    const response = await axios.post(instanceUrl + endpoint, payload, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Instance-Id': user?.instanceId || user.publicIp?.split(':')[0]
      }
    });

    console.log("============= Instance Login Response =============", response.data);

    // If login successful on instance, update user tokens
    if (response.data?.status && response.data?.data) {
      await User.update(
        {
          authToken: response.data.data.authToken,
          feedToken: response.data.data.feedToken,
          refreshToken: response.data.data.refreshToken,
          angelLoginUser: true,
          angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000)
        },
        { where: { id: user.id } }
      );
    }

    logSuccess(req, {
      msg: "Instance Kotak login response received",
      userId: user.id,
      responseStatus: response.data?.status
    });

    return response.data;

  } catch (err) {
    console.error("Instance login call error:", err.message);
    if (err.response) {
      console.error("Response data:", err.response.data);
    }
    
    logError(req, err, {
      msg: "Failed to call instance for Kotak login",
      userId: user.id,
      instanceIp: user.publicIp,
      error: err.message
    });

    return {
      status: false,
      result: "INSTANCE_ERROR",
      message: err.message,
      userId: user.id,
      broker: user.brokerName
    };
  }
};


export const adminKotakLoginNew = async (req, res) => {
  try {

    const userId = req.userId;

    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.json({ status: false, message: "User not found" });
    }

        console.log(user,'===========user=========');
    
    // Call instance login
    const loginResult = await callInstanceLogin(user, req);

    console.log(loginResult,'===========loginResult=========');
    
    
    if (loginResult.status) {
      return res.json({
        status: true,
        message: "Kotak login successful via instance",
        data: loginResult.data
      });
    } else {
      return res.json({
        status: false,
        message: loginResult.message
      });
    }
    
  } catch (error) {

    return res.json({
      status: false,
      message: error.message
    });
  }
};

    // Step 1: TOTP Login - View Token
export const loginWithTOTP =  async (req, res)=> {
        try {
            // const { totp } = req.body;

            let accessToken = '5805b42a-33ab-4299-8531-6e193e39e737'
            let ucc = 'V2UTL'
             let mobileNumber = '+916265293054';  // +91 ke saath string
            let totp = '618112'
            let totpCode = "QKB2IER7IR27ECDAICMFFSYUWU"

            const response = await axios.post(
                `https://mis.kotaksecurities.com/login/1.0/tradeApiLogin`,
                {
                    mobileNumber,
                    ucc,
                    totp
                },
                {
                    headers: {
                        'Authorization': accessToken,
                        'neo-fin-key': 'neotradeapi',
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(response.data.data,'===========response.data.data==========');
            

            // Store in session/temporary storage
            const { token, sid, kType } = response.data.data;
            
            if (kType === 'View') {
                // Save for step 2
                req.session.viewToken = token;
                req.session.viewSid = sid;
                
                return res.status(200).json({
                    success: true,
                    message: 'TOTP verified. Now validate MPIN.',
                    data: {
                        requiresMpin: true,
                        viewToken: token,
                        sid: sid
                    }
                });
            }

            res.status(200).json(response.data);

        } catch (error) {
            console.error('TOTP Login Error:', error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                success: false,
                message: error.response?.data?.message || 'TOTP verification failed',
                error: error.response?.data || error.message
            });
        }
}

    // Step 2: MPIN Validate - Trade Token
export const validateMPIN =  async (req, res)=> {
        try {
            let accessToken = '5805b42a-33ab-4299-8531-6e193e39e737'
            const mpin = '987654'
            const viewToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6WyJWaWV3Il0sImV4cCI6MTc3Mzg1ODYwMCwianRpIjoiY2JkODFjYzYtMmM4My00OWIzLTgwNDUtYTZkZTZiY2JhZWRhIiwiaWF0IjoxNzczODIwMTY2LCJpc3MiOiJsb2dpbi1zZXJ2aWNlIiwic3ViIjoiMWMwZmYyNTQtODhkOC00OGI5LWFjMzUtZjYxMzRhNWFjZDM2IiwidWNjIjoiVjJVVEwiLCJuYXAiOiIiLCJ5Y2UiOiJlWVxcNlx1MDAyNiQ_NVwidVx0XHUwMDBmXHUwMDA3dFx1MDAwMFx1MDAxMGIiLCJmZXRjaGNhY2hpbmdydWxlIjowLCJjYXRlZ29yaXNhdGlvbiI6IiJ9.miEDN3E8uNrdFbaz_mE5zp0lb0Guz3dEXLJXWqBDSekUO4KliJrOLwlezpmyWmDZtFwXhgGgejY2sjjbqGroiG580O2FRhbkOItG0YDSuYsswOiaRwXv_p1C15PdtqZRdyXr4tZ_RbWzNDJSHAHGQbeSQQ2sEJcBMMXvEWHcBTqL12qHjeu-dnsY-3Cc_KGIwYO5h6MO63cZZM-EAca9ZUC9-RrVLLsyS2WcZ2eOdIcoDG2iMud4TM70tXPbi0ZZlHFNp5H7poOkBq47yHYPLtO2Gt4oT3gr3XTXOpEtSOqD86Kw5gKdr-DSZQmtUvLqIoOxNZL3jX-7GwtYFuM94A"
            const viewSid = 'e63540d8-4bdc-4df5-8fc7-07ca4850b551'

            if (!viewToken || !viewSid) {
                return res.status(400).json({
                    success: false,
                    message: 'Please complete TOTP login first'
                });
            }

            const response = await axios.post(
                `https://mis.kotaksecurities.com/login/1.0/tradeApiValidate`,
                { mpin },
                {
                    headers: {
                        'Authorization': accessToken,
                        'neo-fin-key': 'neotradeapi',
                        'Content-Type': 'application/json',
                        'sid': viewSid,
                        'Auth': viewToken
                    }
                }
            );

            const { token, sid, baseUrl, kType } = response.data.data;


            console.log(response.data.data,'==========response.data.data Trade=========');
            

            if (kType === 'Trade') {
                // Store trade token in session
                req.session.tradeToken = token;
                req.session.tradeSid = sid;
                req.session.baseUrl = baseUrl;
                req.session.isAuthenticated = true;

                // Clear view tokens
                delete req.session.viewToken;
                delete req.session.viewSid;

                return res.status(200).json({
                    success: true,
                    message: 'MPIN validated successfully. Ready for trading.',
                    data: {
                        tradeToken: token,
                        sid: sid,
                        baseUrl: baseUrl
                    }
                });
            }

            res.status(200).json(response.data);

        } catch (error) {
            console.error('MPIN Validation Error:', error.response?.data || error.message);
            res.status(error.response?.status || 500).json({
                success: false,
                message: error.response?.data?.message || 'MPIN validation failed',
                error: error.response?.data || error.message
            });
        }
}

export const kotakNeoLoginWithTOtp = async function (req,res,next) {
  
  try {

    const userId = req?.userId; // set by auth middleware

     // 2️⃣ Find user by id
    const user = await User.findByPk(userId);

    if (!user) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    let numberSix = await generateTOTP(user.kite_key)
    let mobileNumber = user.phoneNumber
    let mob = `+91${String(mobileNumber)}`;
    let mpin = user.kite_secret
    let ucc = user.kite_client_id
    let accessToken = user.kite_pin

    const response = await axios.post(
                `https://mis.kotaksecurities.com/login/1.0/tradeApiLogin`,
                {
                    mobileNumber:mob,
                    ucc,
                    totp:numberSix
                },
                {
                    headers: {
                        'Authorization': accessToken,
                        'neo-fin-key': 'neotradeapi',
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log( response.data,'===============response.data.data==============');

                      // Store in session/temporary storage
            const { token, sid } = response.data.data;


             const response2 = await axios.post(
                `https://mis.kotaksecurities.com/login/1.0/tradeApiValidate`,
                { mpin },
                {
                    headers: {
                        'Authorization': accessToken,
                        'neo-fin-key': 'neotradeapi',
                        'Content-Type': 'application/json',
                        'sid': sid,
                        'Auth': token
                    }
                }
            );

             console.log(response2.data.data,'===============response2.data.data==============');

            const  tradeToken = response2.data.data.token
            const  sidToken = response2.data.data.sid
            const baseUrl = response2.data.data.baseUrl
            const kType = response2.data.data.kType

            // ========== 9️⃣ UPDATE POSTGRES USER ==========
     await User.update(
      { 
        authToken: tradeToken,
        feedToken : sidToken,
        refreshToken:baseUrl,
        angelLoginUser: true,
        angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours
        
      },
      { where: { id: req.userId } }
    );


    // ========== 1️⃣3️⃣ RETURN SUCCESS RESPONSE WITH FUND ==========
    return res.json({
      status: true,
      message: "login successful",
    });

  } catch (error) {
    console.log(error.response.data,'error');
    
     return res.json({
      status: false,
      message: error?.message,
    });
  }

}


export const getUserLimits = async (req, res) => {
  try {

     const userId = req?.userId; // set by auth middleware

      // 2️⃣ Find user by id
    const user = await User.findByPk(userId);

      if (!user) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    const response = await axios.post(
      `${user.refreshToken}/quick/user/limits`,
      new URLSearchParams({
        jData: JSON.stringify({
          seg: "ALL",
          exch: "ALL",
          prod: "ALL"
        })
      }),
      {
        headers: {
          Auth: user.authToken,
          Sid:  user.feedToken,
          "neo-fin-key": "neotradeapi",
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );


    console.log(response.data,'============fund=============');
    

    return res.json({
      success: true,
     data: {
    availablecash: response.data.Net
  }
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.response?.data || error.message
    });

  }
};

export const kotakNeoCredential = async (req, res) => {
  try {
    
    const userId = req?.userId; // set by auth middleware

    const {
      clientId,    // Shoonya API KEY
      totpSecret,  // Shoonya TOTP secret
      apiKey,      // Shoonya UID (login id, e.g. FN169676)
      pin,         // Shoonya password / PIN
    } = req.body;

    console.log(" credential payload:", req.body);

    // 1️⃣ Basic validation
    if (!userId) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "Unauthorized: userId is missing",
      });
    }

    if (!clientId || !totpSecret || !apiKey||!pin) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "clientId, apiKey (UID) and totpSecret,pin are required",
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
   
  

    await user.save();

    // 4️⃣ Response
    return res.json({
      status: true,
      statusCode: 200,
      message: "credentials saved successfully",
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


// -----------------------
// GET SINGLE ORDER HISTORY CONTROLLER
// -----------------------
export const getKotakOrderHistory = async (req, res) => {
  try {
   
      const userId = 93

      // 2️⃣ Find user by id
   const user = await User.findOne({
          where: { id: userId },
          raw: true
        });


    console.log(user,'=====user=====');
    

      if (!user) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "User not found",
      });
    }


    // -----------------------
    // HEADERS - KOTAK NEO
    // -----------------------
    const kotakHeaders = (user) => ({
      "Auth": user.authToken,
      "Sid": user.feedToken, // Kotak uses Sid for session
      "neo-fin-key": "neotradeapi",
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    });


    if (!user?.authToken || !user?.feedToken) {
      return res.status(401).json({
        status: false,
        message: "User not authenticated with Kotak"
      });
    }

  
   const KOTAK_ORDER_HISTORY_URL = `${user.refreshToken}/quick/user/orders`;

    const det = await axios.get(KOTAK_ORDER_HISTORY_URL, {
        headers: {
          ...kotakHeaders(user),
          "neo-fin-key": "neotradeapi"
        },
       
    });


    console.log(det.data.data,'detdetdetdet');
    

   

    return res.json({
      status: true,
      message: "Order history fetched successfully",
      data:det.data.data || [],
    });

  } catch (error) {


    console.log(error,'errorerrorerror');
    
    const errorMsg = error.response?.data?.emsg || 
                     error.response?.data?.message || 
                     error.message;

   
    return res.status(error.response?.status || 500).json({
      status: false,
      message: "Failed to fetch order history",
      error: errorMsg,
      stCode: error.response?.data?.stCode || 500
    });
  }
};



export const getMasterScriptFilePaths = async (req, res) => {
  try {

    let accessToken = '4988c5b5-bf17-4e2c-91d7-342c26e00c73'

    const response = await axios.get(
      `https://e22.kotaksecurities.com/script-details/1.0/masterscrip/file-paths`,
      {
        headers: {
          Authorization: accessToken
        }
      }
    );

    return res.json({
      success: true,
      data: response.data
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.response?.data || error.message
    });

  }
};



export const placeOrder = async (req, res) => {
  try {
    const { baseUrl, token, sid } = req.headers;

    // 👉 Body se data le
    const {
      exchangeSegment, // es
      productCode,     // pc
      orderType,       // pt
      quantity,        // qt
      price,           // pr
      tradingSymbol,   // ts
      transactionType, // tt (B/S)
      validity = "DAY"
    } = req.body;

    // 👉 jData बनाओ
    const jData = {
      am: "NO",
      dq: "0",
      es: exchangeSegment,  // e.g. "nse_cm"
      mp: "0",
      pc: productCode,      // e.g. "MIS"
      pf: "N",
      pr: price || "0",
      pt: orderType,        // "MKT" / "L"
      qt: quantity,
      rt: validity,
      tp: "0",
      ts: tradingSymbol,    // e.g. "ITBEES-EQ"
      tt: transactionType   // "B" / "S"
    };

    // 👉 URL encode
    const encodedData = new URLSearchParams({
      jData: JSON.stringify(jData)
    }).toString();

    // 👉 API call
    const response = await axios.post(
      `${baseUrl}/quick/order/rule/ms/place`,
      encodedData,
      {
        headers: {
          accept: "application/json",
          Auth: token,
          Sid: sid,
          "neo-fin-key": "neotradeapi",
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    );

    return res.status(200).json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error("Order Error:", error?.response?.data || error.message);

    return res.status(500).json({
      success: false,
      error: error?.response?.data || error.message
    });
  }
};






    // Logout
export const logout = async (req, res)=> {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Logout failed'
                });
            }
            res.clearCookie('connect.sid');
            res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        });
}

    // Check Auth Status
export const status =  async (req, res)=> {
        if (req.session.isAuthenticated) {
            res.status(200).json({
                success: true,
                isAuthenticated: true,
                baseUrl: req.session.baseUrl
            });
        } else {
            res.status(200).json({
                success: true,
                isAuthenticated: false
            });
        }
}





// 

// {
//   "success": true,
//   "message": "MPIN validated successfully. Ready for trading.",
//   "data": {
//     "tradeToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6WyJUcmFkZSJdLCJleHAiOjE3NzM4NTg2MDAsImp0aSI6ImIwMDViNjczLWRhN2EtNDRlYS04YzIzLTgyMjBlYzZkM2M2YSIsImlhdCI6MTc3MzgyMDI0MywiaXNzIjoibG9naW4tc2VydmljZSIsInN1YiI6IjFjMGZmMjU0LTg4ZDgtNDhiOS1hYzM1LWY2MTM0YTVhY2QzNiIsInVjYyI6IlYyVVRMIiwibmFwIjoiIiwieWNlIjoiZVlcXDZcdTAwMjYkPzVcInVcdFx1MDAwZlx1MDAwN3RcdTAwMDBcdTAwMTBiIiwiZmV0Y2hjYWNoaW5ncnVsZSI6MCwiY2F0ZWdvcmlzYXRpb24iOiIifQ.OlJdVmNHEB-wAVlhdNxIlItf_Z3QqYJq-1xu-Em3nyBy8pIaMALwIyC4wLonopSBkeWb6a9M1FyzcW9TQJFvLCEUP1xusBfO4M7nGlX2QD_w4ApEB0i2O-C3wmlfb71qDUEx274xxCQjv3WGiItHnakFVcSoa89fJlvWDYy_zwBH_fWE2Tm_yv7BEVjKXI6l60ia5PgyIge2IDwAifEHmTQaA6P6JTepqTW7ETkuZf_ZhII4ZeenVia8d44y8UELkaIWLlUBQMGanUGaRQ6EhByZdxFUHJSF00zenb-rRxCme5onoRGTf-MYCWG6b-ccr3ht0rCwraUyI2QSE4bPKQ",
//     "sid": "8c17c092-ee3b-4d86-a5d4-040ca2d0e2bf",
//     "baseUrl": "https://e22.kotaksecurities.com"
//   }
// }
