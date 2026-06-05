import AngelOneCredentialer from '../models/angelOneCredential.js'
import User from "../models/userModel.js"
import { connectSmartSocket, emitOrderGet, isSocketReady } from '../services/smartapiFeed.js';
import { generateTOTP } from '../utils/generateTOTP.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import dayjs from "dayjs";
import Order from '../models/orderModel.js';
import { Op } from "sequelize";

import UserMongodbModel from '../models/userMongodbModel.js'



// Step 1: Redirect to AngelOne login
export const loginWithAngelOne = async (req, res) => {

  const { ANGELONE_CLIENT_ID, ANGELONE_REDIRECT_URI } = process.env;

  const authUrl = `https://smartapi.angelbroking.com/publisher-login?api_key=${ANGELONE_CLIENT_ID}&redirect_uri=${encodeURIComponent(ANGELONE_REDIRECT_URI)}`;

  res.redirect(authUrl);

};


export const angelOneCallback = async (req, res) => {

  const { auth_token, feed_token, refresh_token } = req.query;

  if (!auth_token) {
    return res.status(400).json({ message: "Missing auth_token in callback" });
  }

  try {

    const angelUser = {
      clientcode: `774795`,
      name: "AngelOne User",
      email: `jhaamit7747@gmail.com` 
    };


    // Save or update user in DB
    let user = await User.findOne({ where: { angeloneId: angelUser.clientcode } });

    if (!user) {
      user = await User.create({
        firstName: "AngelOne",
        lastName: "User",
        password: "dummyPassword123!", 
        name: angelUser.name,
        email: angelUser.email,
        angeloneId: angelUser.clientcode,
        authToken: auth_token,
        feedToken: feed_token,
        refreshToken: refresh_token
      });
      
    } else {
      user.name = angelUser.name;
      user.email = angelUser.email || user.email;
      user.authToken = auth_token;
      user.feedToken = feed_token;
      user.refreshToken = refresh_token;
      await user.save();
      
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    console.log("🎯 JWT generated:", token);

    res.redirect(
      `${process.env.FRONTEND_URL}/login-success?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`
    );

  } catch (error) {
    console.error("💥 Error in AngelOne Callback:", error.message);
    res.status(500).json({ message: "AngelOne login failed", error: error.message });
  }
};

// ===========running code======================
export const loginWithTOTPInAngelOne121 = async function (req,res,next) {
    try {
         
    let existing = await AngelOneCredentialer.findOne({ where: { userId: req.userId } });

    if (!existing) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "No credentials found for this user.",
        data: null,
      });
    }

   const createdData = existing.dataValues;

   let totpCode = await generateTOTP(createdData.totpSecret)

      var data2 = JSON.stringify({
      "clientcode":createdData.clientId,
      "password":createdData.password,
      "totp":totpCode, 
    });

      var config = {
      method: 'post',
       url: 'https://apiconnect.angelone.in//rest/auth/angelbroking/user/v1/loginByPassword',

      headers : {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
      },
      data:data2
    };

    let {data} = await axios(config);

     if(data.status==true) {

      
      await User.update( {
        authToken: data.data.jwtToken,
        feedToken: data.data.feedToken,
        refreshToken: data.data.refreshToken,
        angelLoginUser:true,
        angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours
      },
      {
        where: { id: req.userId },
        returning: true, // optional, to get the updated record
      }
    );

         

        //------------------------------------------------
        // ✅ GET POSTGRE USER (for Mongo insert)
        //------------------------------------------------

        const postgreUser = await User.findByPk(req.userId, { raw: true });

          

         //------------------------------------------------
          // ✅ TOKENS
          //------------------------------------------------

          const tokens = {
            authToken: data.data.jwtToken,
            feedToken: data.data.feedToken,
            refreshToken: data.data.refreshToken,
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
          { postgreId: req.userId },

          {
            $set: {
              ...tokens,
              angelLoginUser: true,
              angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000),
            },

            $setOnInsert: {
              ...postgreUser,
              postgreId: req.userId,
            }
          },

          {
            upsert: true,
            new: true,
          }
        );

        if (isSocketReady(req.userId)) {
        console.log('✅ WebSocket is connected!');
      } else {
          connectSmartSocket(req.userId,data.data.jwtToken,data.data.feedToken,createdData.clientId)
      }

      return res.status(200).json({
              status: true,
              data: data.data
          });

     }else{

          return res.json({
              status: false,
              data:null,
              statusCode:data.errorCode,
              message:data.message
          });
     }

  } catch (error) {

    console.log(error);
    

    return res.json({
              status: false,
              data:null,
              statusCode:401,
              message:error.message
          });
  }
}

export const loginWithTOTPInAngelOne = async function (req, res, next) {
    try {

    let user = await User.findOne({ where: { id: req.userId } });       

    let existing = await AngelOneCredentialer.findOne({ where: { userId: req.userId } });

      

    if (!existing) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "No credentials found for this user.",
        data: null,
      });
    }

    const createdData = existing.dataValues;


    console.log(createdData.clientId,'===============createdData.clientId===============');
    

    

    let totpCode = await generateTOTP(createdData.totpSecret);


     console.log(totpCode,'=====================totpCode ===================');

    var data2 = JSON.stringify({
      "clientcode": createdData.clientId,
      "password": createdData.password,
      "totp": totpCode, 
    });

    var config = {
      method: 'post',
      url: 'https://apiconnect.angelone.in//rest/auth/angelbroking/user/v1/loginByPassword',
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
      data: data2
    };

    let { data } = await axios(config);

     console.log(data,'=====================data angelone ===================');

    if (data.status == true) {
      
      // ========== 1. FETCH FUND DETAILS ==========
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

        console.log(fundResponse.data,'============fundResponse==========');
        
        
        if (fundResponse.data.status == true && fundResponse.data.data) {
          // Extract total available balance - adjust based on actual API response structure
          const fundData = fundResponse.data.data;
          
          // Common fields in AngelOne RMS response
          dematFund =  fundData.net ||
                      0;
                     
          
          console.log("✅ Fund fetched successfully:", dematFund);
        }
      } catch (fundError) {
        console.error("❌ Failed to fetch fund details:", fundError.message);
        // Continue with login even if fund fetch fails
      }

      // ========== 2. UPDATE POSTGRES USER ==========
      const [updatedCount, updatedRows] = await User.update({
        authToken: data.data.jwtToken,
        feedToken: data.data.feedToken,
        refreshToken: data.data.refreshToken,
        angelLoginUser: true,
        angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours
        DematFund: dematFund, // Update demat fund
      }, {
        where: { id: req.userId },
        returning: true,
      });

      // ========== 3. GET UPDATED POSTGRE USER ==========
      const postgreUser = await User.findByPk(req.userId, { raw: true });

      // ========== 4. TOKENS OBJECT ==========
      const tokens = {
        authToken: data.data.jwtToken,
        feedToken: data.data.feedToken,
        refreshToken: data.data.refreshToken,
        userToken: postgreUser.userToken,
      };

      // ========== 5. MONGO UPSERT ==========
      // Remove conflicting fields
      delete postgreUser.authToken;
      delete postgreUser.feedToken;
      delete postgreUser.refreshToken;
      delete postgreUser.userToken;
      delete postgreUser.angelLoginUser;
      delete postgreUser.angelLoginExpiry;
      delete postgreUser.dematFund; // Remove from postgreUser to avoid conflict
      delete postgreUser.updatedAt;

      await UserMongodbModel.findOneAndUpdate(
        { postgreId: req.userId },
        {
          $set: {
            ...tokens,
            angelLoginUser: true,
            angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000),
            dematFund: dematFund, // Update demat fund in MongoDB
          },
          $setOnInsert: {
            ...postgreUser,
            postgreId: req.userId,
          }
        },
        {
          upsert: true,
          new: true,
        }
      );

      // ========== 6. WEBSOCKET CONNECTION ==========
      if (isSocketReady(req.userId)) {
        console.log('✅ WebSocket is connected!');
      } else {

         
        connectSmartSocket(req.userId, data.data.jwtToken, data.data.feedToken, createdData.clientId);
      }

      // ========== 7. RETURN SUCCESS RESPONSE WITH FUND ==========
      return res.json({
        status: true,
        data: {
          ...data.data,
          dematFund: dematFund // Include fund in response
        }
      });

    } else {

        console.log(data,'=====================data.message  error ===================');
      return res.json({
        status: false,
        data: null,
        statusCode: data.errorCode,
        message: data.message
      });
    }

  } catch (error) {
    console.log(error,'ttttttttttttt');
    
    return res.json({
      status: false,
      data: null,
      statusCode: 401,
      message: error.message
    });
  }
}


export const angelGetProfileController = async (req, res) => {
  try {

    let angelAccessToken = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6Ik0xNjI0MjMiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pZc0luTnZkWEpqWlNJNklqTWlMQ0prWlhacFkyVmZhV1FpT2lJeFpUTmtOMlk1WVMwME5EVmlMVE5rWXpVdE9URXhZUzAyTkdWbU9UWTROakExWW1RaUxDSnJhV1FpT2lKMGNtRmtaVjlyWlhsZmRqSWlMQ0p2Ylc1bGJXRnVZV2RsY21sa0lqbzJMQ0p3Y205a2RXTjBjeUk2ZXlKa1pXMWhkQ0k2ZXlKemRHRjBkWE1pT2lKaFkzUnBkbVVpZlN3aWJXWWlPbnNpYzNSaGRIVnpJam9pWVdOMGFYWmxJbjE5TENKcGMzTWlPaUowY21Ga1pWOXNiMmRwYmw5elpYSjJhV05sSWl3aWMzVmlJam9pVFRFMk1qUXlNeUlzSW1WNGNDSTZNVGMyTmpnNU9EZzRNQ3dpYm1KbUlqb3hOelkyT0RFeU16QXdMQ0pwWVhRaU9qRTNOalk0TVRJek1EQXNJbXAwYVNJNklqazVOVEZpT1RNeExXTmlPV0V0TkRWaE9DMWhNREF3TFdKaE1ETmxNek5pTURNME15SXNJbFJ2YTJWdUlqb2lJbjAuYjBiNTRXeGhIcFo0Y3J5YmJGM0hmbWVONzFEQkx2V2xHU0tMZ2ROWldhM3lDVkVZWWdJbXcxdUhaUzRWcE45bmJiQXJtZC1zRi1RT2dQbUtDdjBSQmtsaWhhaW5TRnI5aFFSQks2RG1kRzlkYWNGY24yMHRtZWN1TWZGQU8yNXZRRHNpUDV4ZEdoQlhvRHRlbExGVE1lbEtqQWFQNllzaGJrTmdTZ2hSbzNBIiwiQVBJLUtFWSI6InlKYnJubmt4IiwiWC1PTEQtQVBJLUtFWSI6dHJ1ZSwiaWF0IjoxNzY2ODEyNDgwLCJleHAiOjE3NjY4NjAyMDB9.0E7ps6IEGboMRASBaMWmZ3MHjvGKM1Y54ccaQABYmdtMKF4sZp0eQGb-TCumBNLPuILn2QUc-6l7Dqt8KvrKjA'
    
    if (!angelAccessToken) {
     
      return res.status(400).json({
        success: false,
        message: "Angel access token not found",
      });
    }

    const config = {
      method: "get",
      url: "https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getProfile",
      headers: {
        Authorization: `Bearer ${angelAccessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
         'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
      },
    };

    const response = await axios(config);
    
    return res.status(200).json({
      success: true,
      data: response.data?.data,
    });
  } catch (error) {
    

    return res.status(500).json({
      success: false,
      message: "Failed to fetch Angel profile",
      error: error.response?.data || error.message,
    });
  }
};


export const getAngelOneProfileFund1 = async function (req,res,next) {
    try {

     
      var config = {
      method: 'get',
      url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getRMS',

      headers : {
        // 'Authorization': `Bearer ${auth_token}`,
         'Authorization': `Bearer ${req.headers.angelonetoken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
      }
    };

    let {data} = await axios(config);


     if(data.status==true) {

      var configTrade = {
              method: 'get',
              url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getOrderBook',
              headers: { 
                 'Authorization': `Bearer ${req.headers.angelonetoken}`,
                'Content-Type': 'application/json', 
                'Accept': 'application/json', 
                'X-UserType': 'USER', 
                'X-SourceID': 'WEB', 
               'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
              },
              
          };

          
      let getTradeData = await axios(configTrade);

      if(getTradeData.data.status==true) {

        return res.json({
              status: true,
              statusCode:200,
              data: data.data,
              totalOrders:getTradeData.data.data||0,
          });
      }else{
          return res.json({
              status: false,
              data:null,
              statusCode:getTradeData.data.errorCode,
              message:getTradeData.error.message
          });
     }

     }else{
          return res.json({
              status: false,
              data:null,
              statusCode:data.errorCode,
              message:data.message
          });
     }

  } catch (error) {

    return res.json({
              status: false,
              data:null,
              statusCode:401,
              message:error.message
          });
  }
}



export const getAngelOneProfileFund = async function (req,res,next) {
    try {

        let user = await User.findOne({ where: { id: req.userId} });  
        
        console.log(user.firstName,'================user==================');
        
        console.log({
        // 'Authorization': `Bearer ${auth_token}`,
         'Authorization': `Bearer ${req.headers.angelonetoken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP':user.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': user.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
           'X-PrivateKey': user.kite_key, 
      },'===================headers=======================');
        
 
      var config = {
      method: 'get',
      url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getRMS',

      headers : {
        // 'Authorization': `Bearer ${auth_token}`,
         'Authorization': `Bearer ${req.headers.angelonetoken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP':user.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': user.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
           'X-PrivateKey': user.kite_key, 
      }
    };

    let {data} = await axios(config);


    console.log(data,'datadatadata');
    


     if(data.status==true) {

         return res.json({
              status: true,
              statusCode:200,
              data: data.data,
             
          });


     }else{
          return res.json({
              status: false,
              data:null,
              statusCode:data.errorCode,
              message:data.message
          });
     }

  } catch (error) {

    return res.json({
              status: false,
              data:null,
              statusCode:401,
              message:error.message
          });
  }
}



export const getAngelOneOrder = async (req, res,next) => {
    try {

  
      
   let angelToken = 
"eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6IlYzOTk4MTkiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pFekxDSnpiM1Z5WTJVaU9pSXpJaXdpWkdWMmFXTmxYMmxrSWpvaU1XVXpaRGRtT1dFdE5EUTFZaTB6WkdNMUxUa3hNV0V0TmpSbFpqazJPRFl3TldKa0lpd2lhMmxrSWpvaWRISmhaR1ZmYTJWNVgzWXlJaXdpYjIxdVpXMWhibUZuWlhKcFpDSTZNVE1zSW5CeWIyUjFZM1J6SWpwN0ltUmxiV0YwSWpwN0luTjBZWFIxY3lJNkltRmpkR2wyWlNKOUxDSnRaaUk2ZXlKemRHRjBkWE1pT2lKaFkzUnBkbVVpZlN3aWJtSjFUR1Z1WkdsdVp5STZleUp6ZEdGMGRYTWlPaUpoWTNScGRtVWlmWDBzSW1semN5STZJblJ5WVdSbFgyeHZaMmx1WDNObGNuWnBZMlVpTENKemRXSWlPaUpXTXprNU9ERTVJaXdpWlhod0lqb3hOemMwTkRrM05EVTJMQ0p1WW1ZaU9qRTNOelEwTVRBNE56WXNJbWxoZENJNk1UYzNORFF4TURnM05pd2lhblJwSWpvaU5qRXpOR0ZrT0RrdE5HWTBNaTAwTXpNNUxUbGhZak10WXpka1kyVTFNbVkxWlRJeklpd2lWRzlyWlc0aU9pSWlmUS5jQjA4ZkJrU1NlYmFHQS13ZFEtLW0zMkJCWEZXY1cyeGJBOHNPT3k1MWlVYzk0ZGE5YUNmRk1fVTdTS0J0b0xrUkxIV0Q2TXNiQ213R3lpLXNycWIzVlVrXzdVWjMtWmd2LUxYYjNjaTFmQURqT3lTbGhQOExTeTRPNWFCSTRQQzFLRzljX01tbzZUb2hIWm9IeTFfNUJNR2RVeGhqQkY3NVJFaDZOUkp6akkiLCJBUEktS0VZIjoieUpicm5ua3giLCJYLU9MRC1BUEktS0VZIjp0cnVlLCJpYXQiOjE3NzQ0MTEwNTYsImV4cCI6MTc3NDQ2MzQwMH0.gxE5UlI7DA-k6s0CCr-7pElW7F5ErE4cLPjzPm795whM3gU4VaTTlQVvV-bCLWzQdx6nBsKvssnLUQPLWRrDJA"



   if (!angelToken) {
    
     return res.json({
            status: false,
            statusCode:401,
            message: "Login In AngelOne Account",
            error: null,
        });
  }
      
    
        var config = {
        method: 'get',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getOrderBook',
        headers: { 
           'Authorization': `Bearer ${angelToken}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
        },
      
        };

        let {data} = await axios(config)

        //  emitOrderGet('')

        if(data.status==true&&data.data!==null) {


       

            return res.json({
            status: true,
            statusCode:200,
           data:  data.data,
            message:'get data'
        });

         }else if(data.status==true&&data.data===null){

            return res.json({
            status: false,
            statusCode:200,
            data:  [],
            message:'Angel Trading Data is Empty'
        });

         }else{
            return res.json({
            status: false,
            statusCode:data.errorcode,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: data.message,
        });
    }

    } catch (error) {

        return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};


export const getAngelOneProfile = async function (req,res,next) {
    try {

      var config = {
      method: 'get',
      url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getProfile',
      headers : {
         'Authorization': `Bearer ${req.headers.angelonetoken}`,
          // 'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
        'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
      }
    };

    let {data} = await axios(config);

     if(data.status==true) {

      return res.status(200).json({
              status: true,
              data: data.data
          });

     }else{

          return res.json({
              status: false,
              data:null,
              statusCode:data.errorCode,
              message:data.message
          });
     }

  } catch (error) {

    return res.json({
              status: false,
              data:null,
              statusCode:401,
              message:error.message
          });
  }
}

export const reGenerateTokenWithAngelOne = async function (req,res,next) {
    try {

          var reqData = JSON.stringify({
            "refreshToken":req.body.refresh_token
          });

          var config = {
          method: 'post',
          url: 'https://apiconnect.angelone.in/rest/auth/angelbroking/jwt/v1/generateTokens',
          headers: {
            'Authorization': `Bearer ${req.headers.angelonetoken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-UserType': 'USER',
            'X-SourceID': 'WEB',
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
        },
        data : reqData
      };

    let {data} = await axios(config);

       if(data.status==true) {

            return res.json({
            success: true,
            statusCode:200,
            data: data.data,
            message:'get data'
        });

         }else{

        return res.json({
            success: false,
            statusCode:data.errorcode,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: data.message,
        });
    }

  } catch (error) {

    res.status(500).json({
            success: false,
            message: error.message,
        });

  }
}

export const getTradeBook = async (req, res) => {
    try {
        
     let angelToken = "eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6IkMxOTEzMzEiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pFd01pd2ljMjkxY21ObElqb2lNeUlzSW1SbGRtbGpaVjlwWkNJNklqRmxNMlEzWmpsaExUUTBOV0l0TTJSak5TMDVNVEZoTFRZMFpXWTVOamcyTURWaVpDSXNJbXRwWkNJNkluUnlZV1JsWDJ0bGVWOTJNaUlzSW05dGJtVnRZVzVoWjJWeWFXUWlPakV3TWl3aWNISnZaSFZqZEhNaU9uc2laR1Z0WVhRaU9uc2ljM1JoZEhWeklqb2lZV04wYVhabEluMHNJbTFtSWpwN0luTjBZWFIxY3lJNkltRmpkR2wyWlNKOWZTd2lhWE56SWpvaWRISmhaR1ZmYkc5bmFXNWZjMlZ5ZG1salpTSXNJbk4xWWlJNklrTXhPVEV6TXpFaUxDSmxlSEFpT2pFM05qa3lNamszT0Rrc0ltNWlaaUk2TVRjMk9URTBNekl3T1N3aWFXRjBJam94TnpZNU1UUXpNakE1TENKcWRHa2lPaUl3WkRsbE1EQTBaaTAxTjJZeExUUmpOMll0T0RWa1pDMDROelZrTW1ZeVkyRmpOV0VpTENKVWIydGxiaUk2SWlKOS51Z1BEcHBjcHZYalNHaTBpQm94aHRfbEFjbjJsMXRtMmxscXZSMURjLUZ0cTZmWWszSkhkd0FoTXMwaGFrOVU5am1ZRGM0S1dRVFI5LVBFZVphXzNPS0lOTlZHWV9hcGlNLVNtaXUzd0puYWdvMlVFSnpLdml5S0wtd253Q05YSmNfY1FfVTJJMmVvVjhaZVpZdEhkUE1UMEdnV3B2Skd0ZlgxdXJydjJ4YzQiLCJBUEktS0VZIjoieUpicm5ua3giLCJYLU9MRC1BUEktS0VZIjp0cnVlLCJpYXQiOjE3NjkxNDMzODksImV4cCI6MTc2OTE5MzAwMH0.8HGQhWWv0L08eratd3lJY0Zv2QegdeYkuR76wt14jI3fDM_xN2hQMC-ZpD0oh5-AeJgiA3ObYngmTUD2jX7Xng"  // prince
   
     if (!angelToken) {
    
     return res.json({
            status: false,
            statusCode:401,
            message: "Login In AngelOne Account",
            error: null,
        });
  }
  
    var config = {
        method: 'get',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook',
        headers: { 
            'Authorization': `Bearer ${angelToken}`,
            //  'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
             'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
        },
        };

        const {data} = await axios(config);

    
         if(data.status==true&&data.data!==null) {

         const sorted  =   data.data.sort((a, b) => {

         return new Date(`1970-01-01T${b.filltime}`) - new Date(`1970-01-01T${a.filltime}`);
           
        });

            return res.json({
            status: true,
            statusCode:200,
            data: sorted,
            message:'get data'
        });

         }else if(data.status==true&&data.data===null){

            return res.json({
            status: false,
            statusCode:200,
            data: [],
            message:'Angel Trading Data is Empty'
        });

         }else{

        return res.json({
            status: false,
            statusCode:data.errorcode,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: data.message,
        });
    }
        
    } catch (error) {

         return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });

    }
};

export const cancelOrder = async (req, res,next) => {
   
    try {

    const angelToken = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6Ik0xNjI0MjMiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pZc0luTnZkWEpqWlNJNklqTWlMQ0prWlhacFkyVmZhV1FpT2lJeFpUTmtOMlk1WVMwME5EVmlMVE5rWXpVdE9URXhZUzAyTkdWbU9UWTROakExWW1RaUxDSnJhV1FpT2lKMGNtRmtaVjlyWlhsZmRqSWlMQ0p2Ylc1bGJXRnVZV2RsY21sa0lqbzJMQ0p3Y205a2RXTjBjeUk2ZXlKa1pXMWhkQ0k2ZXlKemRHRjBkWE1pT2lKaFkzUnBkbVVpZlN3aWJXWWlPbnNpYzNSaGRIVnpJam9pWVdOMGFYWmxJbjE5TENKcGMzTWlPaUowY21Ga1pWOXNiMmRwYmw5elpYSjJhV05sSWl3aWMzVmlJam9pVFRFMk1qUXlNeUlzSW1WNGNDSTZNVGMyTkRFME5UWXlOQ3dpYm1KbUlqb3hOelkwTURVNU1EUTBMQ0pwWVhRaU9qRTNOalF3TlRrd05EUXNJbXAwYVNJNklqTXlNREJpWW1FMExUTTBNV1F0TkRJMU15MWlPVEkxTFRsa1lqRXdabVU0TmpkaFpDSXNJbFJ2YTJWdUlqb2lJbjAuZE8zWUUxSXdTRVhJN0ZtemtoMGFGU1lOYjEweGc3cUFlRkNPUXktd2FhX0t3bGc1Y3M2U0FRcllMUHp2WGM0ZWRwMkdPSzNJcVpfVlJCLTVkMHVOcmNkM3h4UW5Xb3dFMFFUSVc0dElPZHUwX3F4Ty16X1VqUElMSU9rRjZHYXdFUWNLbS1qS0FGa3psQVVfYUhuZVotS1JWd3JhcVQwLTVHTmxZeWViQjRvIiwiQVBJLUtFWSI6InlKYnJubmt4IiwiWC1PTEQtQVBJLUtFWSI6dHJ1ZSwiaWF0IjoxNzY0MDU5MjI0LCJleHAiOjE3NjQwOTU0MDB9.OA0TlacLUm8EuI4jKGblV1teFfxLB1t5RKHpmQZRuqR5Abo_yHyDn_nD5vuu3W_Y0e4iwly5t3xgTK7LdUIBJQ'


    var data = JSON.stringify({
    //   "variety":req.body.variety,
     "variety":'NORMAL',
      "orderid":'251125001194690'
    });
    
    

       var config = {
        method: 'post',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/cancelOrder',
        headers: { 
           'Authorization': `Bearer ${angelToken}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
    },
    data : data
    };
    
    let resData = await axios(config)

    console.log(resData.data);
    

    if(resData.data.status==true){

       return res.json({
        status: true,
        statusCode:201,
        data:null,
        message: 'Order Cancell Successfully'
    });



      

    }else{

     return res.json({
            status: false,
            statusCode:data.errorcode,
            message: resData?.data?.message,
            data:null,
            error: "Order is not Cancell",
        });     

    }

    } catch (error) {

        return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};

export const cancelOrderActual = async (req, res,next) => {
   
    try {

        const angelToken = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6Ik0xNjI0MjMiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pZc0luTnZkWEpqWlNJNklqTWlMQ0prWlhacFkyVmZhV1FpT2lJeFpUTmtOMlk1WVMwME5EVmlMVE5rWXpVdE9URXhZUzAyTkdWbU9UWTROakExWW1RaUxDSnJhV1FpT2lKMGNtRmtaVjlyWlhsZmRqSWlMQ0p2Ylc1bGJXRnVZV2RsY21sa0lqbzJMQ0p3Y205a2RXTjBjeUk2ZXlKa1pXMWhkQ0k2ZXlKemRHRjBkWE1pT2lKaFkzUnBkbVVpZlN3aWJXWWlPbnNpYzNSaGRIVnpJam9pWVdOMGFYWmxJbjE5TENKcGMzTWlPaUowY21Ga1pWOXNiMmRwYmw5elpYSjJhV05sSWl3aWMzVmlJam9pVFRFMk1qUXlNeUlzSW1WNGNDSTZNVGMyTkRFME5UWXlOQ3dpYm1KbUlqb3hOelkwTURVNU1EUTBMQ0pwWVhRaU9qRTNOalF3TlRrd05EUXNJbXAwYVNJNklqTXlNREJpWW1FMExUTTBNV1F0TkRJMU15MWlPVEkxTFRsa1lqRXdabVU0TmpkaFpDSXNJbFJ2YTJWdUlqb2lJbjAuZE8zWUUxSXdTRVhJN0ZtemtoMGFGU1lOYjEweGc3cUFlRkNPUXktd2FhX0t3bGc1Y3M2U0FRcllMUHp2WGM0ZWRwMkdPSzNJcVpfVlJCLTVkMHVOcmNkM3h4UW5Xb3dFMFFUSVc0dElPZHUwX3F4Ty16X1VqUElMSU9rRjZHYXdFUWNLbS1qS0FGa3psQVVfYUhuZVotS1JWd3JhcVQwLTVHTmxZeWViQjRvIiwiQVBJLUtFWSI6InlKYnJubmt4IiwiWC1PTEQtQVBJLUtFWSI6dHJ1ZSwiaWF0IjoxNzY0MDU5MjI0LCJleHAiOjE3NjQwOTU0MDB9.OA0TlacLUm8EuI4jKGblV1teFfxLB1t5RKHpmQZRuqR5Abo_yHyDn_nD5vuu3W_Y0e4iwly5t3xgTK7LdUIBJQ'


    var data = JSON.stringify({
    //   "variety":req.body.variety,
     "variety":'',
      "orderid":''
    });
    

       var config = {
        method: 'post',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/cancelOrder',
        headers: { 
           'Authorization': `Bearer ${angelToken}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
    },
    data : data
    };
    
    let resData = await axios(config)

    if(resData.data.status==true){

        // normalize if needed
    const where = { orderid: req.body.orderid };

    // Postgres can return the updated row(s)
    const [affected, rows] = await Order.update(
      {
        status: 'cancelled',        // or 'canceled' if you prefer US spelling
        orderstatus: 'cancelled',
      },
      {
        where,
        returning: true,            // only works on Postgres
      }
    );

    if (affected === 0) {

         return res.json({
            status: false,
            statusCode:404,
            message: "Order is Cancell and Not Update in PG DB With Cancell Status",
            data:null,
            error: "Order is Cancell and Not Update in PG DB With Cancell Status",
        });     
    }

        return res.json({
        status: true,
        statusCode:201,
        data:null,
        message: 'Order Cancell Successfully'
    });

    }else{

     return res.json({
            status: false,
            statusCode:data.errorcode,
            message: resData?.data?.message,
            data:null,
            error: "Order is not Cancell",
        });     

    }

    } catch (error) {

        return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};

export const getPerticularTradeBook = async (req, res) => {
    try {

      
      

    let orderId = '09f4fc85-cc93-478e-8144-0ac62814a43f'
    
     const angelToken = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6Ik0xNjI0MjMiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pZc0luTnZkWEpqWlNJNklqTWlMQ0prWlhacFkyVmZhV1FpT2lJeFpUTmtOMlk1WVMwME5EVmlMVE5rWXpVdE9URXhZUzAyTkdWbU9UWTROakExWW1RaUxDSnJhV1FpT2lKMGNtRmtaVjlyWlhsZmRqSWlMQ0p2Ylc1bGJXRnVZV2RsY21sa0lqbzJMQ0p3Y205a2RXTjBjeUk2ZXlKa1pXMWhkQ0k2ZXlKemRHRjBkWE1pT2lKaFkzUnBkbVVpZlN3aWJXWWlPbnNpYzNSaGRIVnpJam9pWVdOMGFYWmxJbjE5TENKcGMzTWlPaUowY21Ga1pWOXNiMmRwYmw5elpYSjJhV05sSWl3aWMzVmlJam9pVFRFMk1qUXlNeUlzSW1WNGNDSTZNVGMyTkRFME5UWXlOQ3dpYm1KbUlqb3hOelkwTURVNU1EUTBMQ0pwWVhRaU9qRTNOalF3TlRrd05EUXNJbXAwYVNJNklqTXlNREJpWW1FMExUTTBNV1F0TkRJMU15MWlPVEkxTFRsa1lqRXdabVU0TmpkaFpDSXNJbFJ2YTJWdUlqb2lJbjAuZE8zWUUxSXdTRVhJN0ZtemtoMGFGU1lOYjEweGc3cUFlRkNPUXktd2FhX0t3bGc1Y3M2U0FRcllMUHp2WGM0ZWRwMkdPSzNJcVpfVlJCLTVkMHVOcmNkM3h4UW5Xb3dFMFFUSVc0dElPZHUwX3F4Ty16X1VqUElMSU9rRjZHYXdFUWNLbS1qS0FGa3psQVVfYUhuZVotS1JWd3JhcVQwLTVHTmxZeWViQjRvIiwiQVBJLUtFWSI6InlKYnJubmt4IiwiWC1PTEQtQVBJLUtFWSI6dHJ1ZSwiaWF0IjoxNzY0MDU5MjI0LCJleHAiOjE3NjQwOTU0MDB9.OA0TlacLUm8EuI4jKGblV1teFfxLB1t5RKHpmQZRuqR5Abo_yHyDn_nD5vuu3W_Y0e4iwly5t3xgTK7LdUIBJQ'

    var config = {
        method: 'get',
        url: `https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/details/${orderId}`,
        headers: { 
           'Authorization': `Bearer ${angelToken}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
             'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
        },
        };

        const {data} = await axios(config);

        console.log(data.dataa,'dsccsdcs');

         if(data.status==true) {

            return res.json({
            status: true,
            statusCode:200,
            data: data.data,
            message:'get data'
        });

         }else{

        return res.json({
            status: false,
            statusCode:data.errorcode,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: data.message,
        });
    }
        
    } catch (error) {
        
         return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });

    }
};

export const getTradeBookWithDateFilter = async (req, res) => {
    try {

         // Convert to Dayjs objects for easy comparison
        const from = dayjs(req.body[0]);
        const to = dayjs(req.body[1]);


    var config = {
        method: 'get',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook',
        headers: { 
            'Authorization': `Bearer ${req.headers.angelonetoken}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
             'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
        },
        };

        const {data} = await axios(config);

         if(data.status==true) {

             // ✅ Filter trades within the date range
            const filtered = data.data.filter((t) => {
            const tradeTime = dayjs(t.updatetime, "DD-MMM-YYYY HH:mm:ss");
            return tradeTime.isAfter(from) && tradeTime.isBefore(to);
        });

            return res.json({
            status: true,
            statusCode:200,
            data:filtered,
            message:'get data'
        });

         }else{

        return res.json({
            status: false,
            statusCode:data.errorcode,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: data.message,
        });
    }
        
    } catch (error) {

        
        

         return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });

    }
};

export const logoutAngelOne = async function (req,res,next) {
    try {

      const obj = { clientcode:'M162423' };

      const jsonString = JSON.stringify(obj);

      var config = {
      method: 'post',
      url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/logout',

      headers : {
        'Authorization': `Bearer ${process.env.ANGELONE_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-UserType': 'USER',
        'X-SourceID': 'WEB',
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
      },
       data : jsonString
    };

    let response = await axios(config);

    const apiData = response.data;

      return res.status(200).json({
              success: true,
              data: apiData
          });

  } catch (error) {
    console.log('hhhy',error);
  }


}

export const getTradeDataForDeshboard = async function (req,res,next) {

    try{

      let totalBuyLength = 0
         const angelToken = req.headers.angelonetoken;

            if (!angelToken) {

              return res.json({
                      status: false,
                      statusCode:401,
                      message: "Login In AngelOne Account",
                      error: null,
                  });
            }

        var config = {
        method: 'get',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook',
        headers: { 
            'Authorization': `Bearer ${req.headers.angelonetoken}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
             'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
        },
        };

        let response = await axios(config)
        
        if(response.data.status===true&&response.data.data===null) {

           return res.json({
                    status: true,
                    statusCode:203,
                    message: "getting data",
                    data:[],
                     totalTraded:totalBuyLength,
                    pnl:0,

                    error:null,
                });


        }else if(response.data.status){

        const toMoney = n => Math.round(n * 100) / 100;

        function calculatePnL(orders) {
       
       
            const grouped = {};

        // group by symbol
        for (const o of orders) {
            if (!grouped[o.tradingsymbol]) grouped[o.tradingsymbol] = [];
            grouped[o.tradingsymbol].push(o);
        }

        const results = [];

    
        for (const [symbol, list] of Object.entries(grouped)) {

            const buys = list.filter(o => o.transactiontype === 'BUY');
            const sells = list.filter(o => o.transactiontype === 'SELL');


            let totalBuyQty = 0, totalBuyValue = 0;
            buys.forEach(b => { totalBuyQty += b.fillsize; totalBuyValue += b.fillsize * b.tradevalue; });

            let totalSellQty = 0, totalSellValue = 0;
            sells.forEach(s => { totalSellQty += s.fillsize; totalSellValue += s.fillsize * s.tradevalue; });

            if (totalBuyQty > 0 && totalSellQty > 0) {
            const matchedQty = Math.min(totalBuyQty, totalSellQty);
            const buyAvg = totalBuyValue / totalBuyQty;
            const sellAvg = totalSellValue / totalSellQty;
            const pnl = (sellAvg - buyAvg) * matchedQty;

        
            results.push({
                label:symbol,
                win: toMoney(buyAvg),
                loss: toMoney(sellAvg),
                quantity: matchedQty,
                pnl: toMoney(pnl)
            });
            }
        }

        return results;
        }


        // // ---- Run and print as JSON ----
        const pnlData = calculatePnL(response.data.data);

        const trades = response.data.data;  // or paste your array directly

        let totalBuy = 0;
        let totalSell = 0;
        

        trades?.forEach((trade) => {
        const type = String(trade.transactiontype).toUpperCase();
        const value = Number(trade.tradevalue) || 0;

        if (type === "BUY") {
            totalBuy += value;
            totalBuyLength++
        } else if (type === "SELL") {
            totalSell += value;
        }
        });

                const openCount = await Order.count({
            where: {
              userId:req.userId,
              orderstatuslocaldb: "OPEN"
            }
          });

        return res.json({
                    status: true,
                    statusCode:203,
                    message: "getting data",
                    data:pnlData,
                    pnl:totalSell-totalBuy,
                    totalTraded:totalBuyLength,
                    totalOpen:openCount,
                    error:null,
                });

        }else{
          return res.json({
                    status: true,
                    statusCode:203,
                    message: "getting data",
                    data:[],
                     totalTraded:totalBuyLength,
                    pnl:0,
                    error:null,
                });
        }

    }catch(error) {
      
        console.log(error.message,'hello bye');

         return res.json({
                    status: true,
                    statusCode:203,
                    message: "getting data",
                    data:[],
                    pnl:0,
                    error:null,
                });
        

    }
}


// ============= update code =================================
export const getTradeDataForCommonDeshboardUpdate = async (req, res) => {
  try {
    const userId = req.userId;

    

    /* =====================================================
       ✅ IST DAY RANGE (VERY IMPORTANT)
    ===================================================== */
    const nowIST = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    const startOfDay = new Date(nowIST);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(nowIST);
    endOfDay.setHours(23, 59, 59, 999);

    const startISO = startOfDay.toISOString();
    const endISO = endOfDay.toISOString();

    /* =====================================================
       ✅ FETCH TODAY COMPLETED TRADES
    ===================================================== */
    let trades = await Order.findAll({
      where: {
        userId,
        orderstatuslocaldb: "COMPLETE",
        filltime: {
          [Op.between]: [startISO, endISO],
        },
      },
      raw: true,
    });

    if (!trades.length) {
      return res.json({
        status: true,
        statusCode: 200,
        message: "No trades found today",
        data: [],
        onlineTrades: [],
        pnl: 0,
        totalTraded: 0,
        totalOpen: 0,
      });
    }

    /* =====================================================
       ✅ SORT TRADES (FIFO SAFE)
    ===================================================== */
    trades.sort((a, b) => {
      const ta = new Date(a.filltime).getTime();
      const tb = new Date(b.filltime).getTime();

      if (ta !== tb) return ta - tb;

      // BUY before SELL at same timestamp
      if (a.transactiontype !== b.transactiontype) {
        return a.transactiontype === "BUY" ? -1 : 1;
      }

      return Number(a.id || 0) - Number(b.id || 0);
    });

      console.log(trades,'hhhhhy pnl');
      
    /* =====================================================
       ✅ REALIZED PnL (SOURCE OF TRUTH)
    ===================================================== */
    const realizedPnL = trades.reduce(
      (sum, t) => sum + Number(t.pnl || 0),
      0
    );

      

    /* =====================================================
       ✅ TOTAL COMPLETED TRADES
       (1 SELL = 1 TRADE)
    ===================================================== */
   const sellTrades = trades.filter((t) => t.transactiontype === "SELL");



   

    // Use Set to store unique strategyUniqueId
    const uniqueStrategyIds = new Set(sellTrades.map((t) => t.strategyUniqueId));

    // Count of unique strategyUniqueId
    const totalTraded = uniqueStrategyIds.size;


   
    


    /* =====================================================
       ✅ OPEN / PENDING ORDERS COUNT
    ===================================================== */
    const totalOpen = await Order.count({
      where: {
        userId,
        orderstatuslocaldb: { [Op.in]: ["OPEN", "PENDING"] },
      },
    });

    /* =====================================================
       ✅ FIFO PnL (ANALYTICS / CHART PURPOSE)
    ===================================================== */
    function calculateFIFO(trades) {


      
      const grouped = {};
      let totalPnL = 0;
      const output = [];

      for (const t of trades) {
        if (!["BUY", "SELL"].includes(t.transactiontype)) continue;

        const symbol = t.tradingsymbol;
        const qty = Number(t.fillsize || t.quantity || 0);
        const price = Number(t.fillprice || t.price || 0);

        if (!qty || !price) continue;

        if (!grouped[symbol]) {
          grouped[symbol] = {
            buys: [],
            totalBuyValue: 0,
            totalBuyQty: 0,
            totalSellValue: 0,
            totalSellQty: 0,
            pnl: 0,
          };
        }

        const g = grouped[symbol];

        if (t.transactiontype === "BUY") {
          g.buys.push({ qty, price });
          g.totalBuyQty += qty;
          g.totalBuyValue += qty * price;
        }

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

      for (const [symbol, g] of Object.entries(grouped)) {
        if (g.totalBuyQty && g.totalSellQty) {
          output.push({
            label: symbol,
            win: Number((g.totalBuyValue / g.totalBuyQty).toFixed(2)),
            loss: Number((g.totalSellValue / g.totalSellQty).toFixed(2)),
            quantity: Math.min(g.totalBuyQty, g.totalSellQty),
            pnl: Number(g.pnl.toFixed(2)),
          });
        }
      }

      return {
        pnlData: output,
        fifoPnL: Number(totalPnL.toFixed(2)),
      };
    }

    const { pnlData } = calculateFIFO(trades);

    /* =====================================================
       ✅ FINAL RESPONSE
    ===================================================== */



    console.log(Number(realizedPnL.toFixed(2)),'hhhhhy pnl');
    

    
    return res.json({
      status: true,
      statusCode: 200,
      message: "Trade dashboard fetched",
      data: pnlData,                 // FIFO analytics
      onlineTrades: trades,          // raw trades
      pnl: Number(realizedPnL.toFixed(2)), // DB PnL (REAL)
      totalTraded,
      totalOpen,
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

// ==============old code ====================================
export const getTradeDataForCommonDeshboardUpdateRunning = async function (req, res) {
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
        // orderstatuslocaldb: { [Op.in]: ["OPEN", "PENDING"] },
         orderstatuslocaldb: { [Op.in]: ["OPEN", ] },
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
     
      message: "tradebook fetched",
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

export const getTradeDataForCommonDeshboardUpdate1212 = async (req, res) => {
  try {
    const userId = req.userId;

    // ===============================
    // 📅 Today UTC Range
    // ===============================
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);

    const startISO = start.toISOString();
    const endISO = end.toISOString();

    // ===============================
    // 1️⃣ Fetch today's COMPLETE trades
    // ===============================
    const todayTrades = await Order.findAll({
      where: {
        userId,
        orderstatuslocaldb: "COMPLETE",
        filltime: { [Op.between]: [startISO, endISO] },
      },
      raw: true,
    });

    // ===============================
    // Counts (OLD COMPATIBLE)
    // ===============================
    const totalTraded = await Order.count({
      where: {
        userId,
        transactiontype: "BUY",
        orderstatuslocaldb: "COMPLETE",
        filltime: { [Op.between]: [startISO, endISO] },
      },
    });

    const totalOpen = await Order.count({
      where: {
        userId,
        // orderstatuslocaldb: { [Op.in]: ["OPEN", "PENDING"] },
         orderstatuslocaldb: { [Op.in]: ["OPEN", ] },
      },
    });

    const totalOpenData = await Order.findAll({
      where: {
        userId,
        // orderstatuslocaldb: { [Op.in]: ["OPEN", "PENDING"] },
        orderstatuslocaldb: { [Op.in]: ["OPEN"] },
      },
    });


    console.log(totalOpenData,'================totalOpenData=============');
    

    if (!todayTrades.length) {
      return res.json({
        status: true,
        statusCode: 200,
        message: "No trades found",
        data: [],
        onlineTrades: [],
        pnl: 0,
        totalTraded,
        totalOpen,
      });
    }

    // ===============================
    // 2️⃣ Collect SELL buyOrderIds
    // ===============================
    const buyOrderIds = [
      ...new Set(
        todayTrades
          .filter(
            t =>
              t.transactiontype === "SELL" &&
              t.buyOrderId &&
              t.buyOrderId !== "0"
          )
          .map(t => String(t.buyOrderId).trim())
      ),
    ];

    // ===============================
    // 3️⃣ Fetch missing BUY orders
    // ===============================
    const previousBuys = buyOrderIds.length
      ? await Order.findAll({
          where: {
            userId,
            transactiontype: "BUY",
            orderstatuslocaldb: "COMPLETE",
            orderid: { [Op.in]: buyOrderIds },
          },
          raw: true,
        })
      : [];

    // ===============================
    // 4️⃣ Merge & sort (OLD LOGIC)
    // ===============================
    const tradeMap = new Map();
    [...previousBuys, ...todayTrades].forEach(t => {
      tradeMap.set(`${t.orderid}_${t.transactiontype}`, t);
    });

    const trades = Array.from(tradeMap.values());

    trades.sort((a, b) => {
      const ta = new Date(a.filltime).getTime();
      const tb = new Date(b.filltime).getTime();
      if (ta !== tb) return ta - tb;
      return a.transactiontype === "BUY" ? -1 : 1;
    });

    // ===============================
    // 5️⃣ FIFO ENGINE (buyOrderId priority)
    // ===============================
    const grouped = {};
    let totalPnL = 0;

    for (const t of trades) {
      const symbol = t.tradingsymbol;
      const qty = Number(t.fillsize || t.quantity || 0);
      const price = Number(t.fillprice || t.averageprice || 0);
      if (!qty || !price) continue;

      if (!grouped[symbol]) {
        grouped[symbol] = {
          buys: [],
          totalBuyValue: 0,
          totalBuyQty: 0,
          totalSellValue: 0,
          totalSellQty: 0,
          pnl: 0,
        };
      }

      const g = grouped[symbol];

      // BUY
      if (t.transactiontype === "BUY") {
        g.buys.push({
          orderid: String(t.orderid).trim(),
          qty,
          price,
        });
        g.totalBuyQty += qty;
        g.totalBuyValue += qty * price;
      }

      // SELL
      if (t.transactiontype === "SELL") {
        g.totalSellQty += qty;
        g.totalSellValue += qty * price;

        let remaining = qty;
        let buyQueue = g.buys;

        if (t.buyOrderId && t.buyOrderId !== "0") {
          const id = String(t.buyOrderId).trim();
          buyQueue = buyQueue.filter(b => b.orderid === id);
        }

        for (const buy of buyQueue) {
          if (remaining <= 0) break;
          const matched = Math.min(buy.qty, remaining);

          const pnl = (price - buy.price) * matched;
          g.pnl += pnl;
          totalPnL += pnl;

          buy.qty -= matched;
          remaining -= matched;
        }
      }
    }

    // ===============================
    // 6️⃣ OLD FORMAT OUTPUT (FRONTEND SAFE)
    // ===============================
    const pnlData = [];

    for (const [symbol, g] of Object.entries(grouped)) {
      if (g.totalBuyQty > 0 && g.totalSellQty > 0) {
        pnlData.push({
          label: symbol,
          win: Number((g.totalBuyValue / g.totalBuyQty).toFixed(2)),
          loss: Number((g.totalSellValue / g.totalSellQty).toFixed(2)),
          quantity: Math.min(g.totalBuyQty, g.totalSellQty),
          pnl: Number(g.pnl.toFixed(2)),
        });
      }
    }

    // ===============================
    // ✅ FINAL RESPONSE (UNCHANGED FOR FE)
    // ===============================
    return res.json({
      status: true,
      statusCode: 200,
      message: "tradebook fetched",
      data: pnlData,
      onlineTrades: trades,
      pnl: Number(totalPnL.toFixed(2)),
      totalTraded,
      totalOpen,
    });
  } catch (err) {
    console.error("Tradebook Error:", err);
    return res.json({
      status: false,
      statusCode: 500,
      message: "Internal error",
      error: err.message,
    });
  }
};




export const getDeshboardOrdersUpdateRunning = async (req, res) => {
  try {

    // 1️⃣ Set date range (today by default)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const startISO = startOfDay.toISOString();
    const endISO = endOfDay.toISOString();

    // 2️⃣ Fetch completed orders from local DB
    const orders = await Order.findAll({
      where: {
        userId: req.userId,
        orderstatuslocaldb: "COMPLETE",
        filltime: { [Op.between]: [startISO, endISO] },
      },
      order: [["createdAt", "DESC"]], // Latest first
      raw: true,
    });

    // 3️⃣ Map orders to frontend format
    const mappedOrders = orders.map((o) => ({
      tradingsymbol: o.tradingsymbol,
      orderid: o.orderid,
      buyOrderId: o.buyOrderId,
      transactiontype: o.transactiontype,
      lotsize: Number(o.quantity),
      averageprice: Number(o.fillprice || o.averageprice || 0),
      orderstatus: o.orderstatuslocaldb,
      ordertime: o.filltime || o.createdAt,
    }));

    // 4️⃣ Take last 5 orders for dashboard
    const recentFiveOrders = mappedOrders.slice(0, 5);


const mergeSellByBuyOrderId = (orders) => {
  let buy = null;
  let sell = null;

  for (const o of orders) {
    const qty = Number(o.lotsize || 0);
    const price = Number(o.averageprice || 0);

    if (o.transactiontype === "BUY") {
      buy = { ...o };
    }

    if (o.transactiontype === "SELL") {
      if (!sell) {
        sell = {
          ...o,
          lotsize: 0,
          totalValue: 0
        };
      }
      sell.lotsize += qty;
      sell.totalValue += qty * price;
    }
  }

  if (sell) {
    sell.averageprice = sell.totalValue / sell.lotsize;
    delete sell.totalValue;
  }

  // ⭐ HERE IS THE CHANGE ⭐
  if (!buy && !sell) return [];     // nothing found
  if (buy && !sell) return [buy];   // only buy found
  if (!buy && sell) return [sell];  // only sell found

  return [buy, sell];               // buy + merged sell
};


  let newmappedOrders = []

  if(req.role==='clone-user') {

    newmappedOrders = mappedOrders

  }else{

   newmappedOrders = await mergeSellByBuyOrderId(mappedOrders)
  }


  console.log(newmappedOrders);
  

    return res.json({
      status: true,
      message: " orders retrieved successfully",
      data: {
        totalOrders: newmappedOrders,
        recentOrders: recentFiveOrders,
      },
    });
  } catch (error) {
    console.error(" Orders Error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching  orders",
      error: error.message,
    });
  }
};

export const getDeshboardOrdersUpdate = async (req, res) => {
  try {
    const userId = req.userId;

    // ===============================
    // 📅 Today UTC range
    // ===============================
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setUTCHours(23, 59, 59, 999);

    const startISO = startOfDay.toISOString();
    const endISO = endOfDay.toISOString();

    // ===============================
    // 1️⃣ Fetch today's COMPLETE orders
    // ===============================
    const orders = await Order.findAll({
      where: {
        userId,
        orderstatuslocaldb: "COMPLETE",
        filltime: { [Op.between]: [startISO, endISO] },
      },
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    if (!orders.length) {
      return res.json({
        status: true,
        message: "No orders found",
        data: {
          totalOrders: [],
          recentOrders: [],
        },
      });
    }

    // ===============================
    // 2️⃣ Map to frontend format (UNCHANGED)
    // ===============================
    const mappedOrders = orders.map(o => ({
      tradingsymbol: o.tradingsymbol,
      orderid: String(o.orderid).trim(),
      buyOrderId: String(o.buyOrderId || "0").trim(),
      transactiontype: o.transactiontype,
      lotsize: Number(o.quantity || 0),
      averageprice: Number(o.fillprice || o.averageprice || 0),
      orderstatus: o.orderstatuslocaldb,
      ordertime: o.filltime || o.createdAt,
    }));

    // ===============================
    // 3️⃣ Recent 5 orders (UNCHANGED)
    // ===============================
    const recentFiveOrders = mappedOrders.slice(0, 5);

    // ===============================
    // 4️⃣ Merge SELLs by buyOrderId (FIXED)
    // ===============================
    const mergeByBuyOrderId = (orders) => {
      const buyMap = {};
      const sellMap = {};

      for (const o of orders) {
        const qty = Number(o.lotsize || 0);
        const price = Number(o.averageprice || 0);

        // BUY
        if (o.transactiontype === "BUY") {
          buyMap[o.orderid] = {
            ...o,
          };
        }

        // SELL
        if (o.transactiontype === "SELL") {
          const key = o.buyOrderId && o.buyOrderId !== "0"
            ? o.buyOrderId
            : "__NO_BUY__";

          if (!sellMap[key]) {
            sellMap[key] = {
              ...o,
              lotsize: 0,
              totalValue: 0,
            };
          }

          sellMap[key].lotsize += qty;
          sellMap[key].totalValue += qty * price;
        }
      }

      const result = [];

      // 🔗 Combine BUY + SELL
      for (const [buyId, buy] of Object.entries(buyMap)) {
        result.push(buy);

        if (sellMap[buyId]) {
          const s = sellMap[buyId];
          s.averageprice = s.totalValue / s.lotsize;
          delete s.totalValue;
          result.push(s);
          delete sellMap[buyId];
        }
      }

      // 🔥 Remaining SELLs (no BUY found today)
      for (const s of Object.values(sellMap)) {
        s.averageprice = s.totalValue / s.lotsize;
        delete s.totalValue;
        result.push(s);
      }

      return result;
    };

    // ===============================
    // 5️⃣ Role based output
    // ===============================
    let finalOrders = [];

    if (req.role === "clone-user") {
      finalOrders = mappedOrders;
    } else {
      finalOrders = mergeByBuyOrderId(mappedOrders);
    }

    // ===============================
    // ✅ RESPONSE (FRONTEND SAFE)
    // ===============================
    return res.json({
      status: true,
      message: "orders retrieved successfully",
      data: {
        totalOrders: finalOrders,
        recentOrders: recentFiveOrders,
      },
    });
  } catch (error) {
    console.error("Dashboard Orders Error:", error);
    return res.status(500).json({
      status: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
};

// 21 jan 2025
export const getAngelOneTradeDataUserPostionRunning = async function (req, res, next) {
  try {
    const angelToken = req.headers.angelonetoken;

    if (!angelToken) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Login In AngelOne Account",
        onlineTrades: [],
        error: null,
      });
    }

    const config = {
      method: "get",
      url: "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook",
      headers: {
        Authorization: `Bearer ${angelToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": process.env.CLIENT_LOCAL_IP,
        "X-ClientPublicIP": process.env.CLIENT_PUBLIC_IP,
        "X-MACAddress": process.env.MAC_Address,
        "X-PrivateKey": process.env.PRIVATE_KEY,
      },
    };

    const response = await axios(config);

    if (!response.data?.status) {
      return res.json({
        status: false,
        statusCode: 203,
        message: "No Trade in User Position",
        onlineTrades: [],
        error: response.data?.message || null,
      });
    }

    const trades = response.data?.data || [];


    console.log('===========trades=========',trades);
    

    if (!trades.length) {
      return res.json({
        status: true,
        statusCode: 200,
        message: "No Trade in User Position",
        onlineTrades: [],
        error: null,
      });
    }

    // 1) Collect orderids
    const angelOrderIds = trades.map((t) => String(t.orderid || t.order_id || "")).filter(Boolean);

    // 2) Find matching in local DB
    const existingOrders = await Order.findAll({
      where: {
        userId: req.userId,
        orderid: { [Op.in]: angelOrderIds },
      },
      attributes: ["orderid"],
      raw: true,
    });

    const existingIdsSet = new Set(existingOrders.map((o) => String(o.orderid)));

    // 3) Filter only new trades
    const newTrades = trades.filter((t) => !existingIdsSet.has(String(t.orderid || t.order_id)));

    if (!newTrades.length) {
      return res.json({
        status: true,
        statusCode: 200,
        message: "No New Trade in User Position",
        onlineTrades: [],
        error: null,
      });
    }

    // ✅ FRONTEND-FRIENDLY MAPPING
    const mappedTrades = newTrades.map((t) => {
      const orderid = String(t.orderid || t.order_id || "");
      const tradeid = String(t.tradeid || t.trade_id || t.fillid || "");
      const qty = Number(t.quantity ?? t.tradedqty ?? t.fillsize ?? 0);
      const fillPrice = Number(t.fillprice ?? t.tradeprice ?? t.price ?? 0);

      return {
        // ✅ AG GRID FIELDS (your columnDefs)
        tradingsymbol: t.tradingsymbol || t.symbolname || "-",
        exchange: t.exchange || "-",
        transaction_type: t.transactiontype || t.transaction_type || "-",  // AG Grid uses this
        product: t.producttype || t.product || "-",                        // AG Grid uses this
        average_price: Number(t.averageprice ?? t.average_price ?? fillPrice ?? 0), // AG Grid uses this
        quantity: qty,
        order_id: orderid,                                                 // AG Grid uses this
        trade_id: tradeid,                                                 // AG Grid uses this

        // ✅ MOBILE CARD FIELDS (your MobileOrderCard uses these)
        transactiontype: t.transactiontype || t.transaction_type || "-",
        ordertype: t.ordertype || "-",
        producttype: t.producttype || t.product || "-",
        fillprice: String(fillPrice || ""),
        fillsize: String(t.fillsize ?? t.tradedqty ?? qty ?? ""),
        orderid: orderid,
        status: t.status || t.orderstatus || "-",
        orderstatus: t.orderstatus || t.status || "-",
        text: t.text || t.message || "",
        updatetime: t.updatetime || t.exchorderupdatetime || t.exchtime || "",
        uniqueorderid: String(t.uniqueorderid || t.unique_order_id || ""),
        exchangeorderid: String(t.exchangeorderid || t.exchange_order_id || ""),

        // ✅ for your socket ltp mapping
        symboltoken: String(t.symboltoken || t.token || ""),

        // optional passthrough
        createdAt: t.createdAt || null,
        updatedAt: t.updatedAt || null,
      };
    });

    return res.json({
      status: true,
      statusCode: 200,
      message: "Trade in User Position",
      onlineTrades: mappedTrades,
      error: null,
    });
  } catch (error) {
    return res.json({
      status: false,
      statusCode: 500,
      message: "Error getting AngelOne trade data",
      onlineTrades: [],
      error: error?.message || null,
    });
  }
};


// =============================== getAngelOneTradeDataUserPostion start====================== 

  const EXCHANGE_TYPE = {
  NSE: 1,
  NFO: 2,
  BSE: 3,
  BFO: 4,
  MCX: 5,
  NCX: 7,
  CDS: 13,
  CDE: 13,
};


function buildSocketTokenList(orders) {

  const bucket = new Map(); // exchangeType => Set(tokens)

  for (const o of orders) {

    const exch = o.exchange?.toUpperCase().trim();
    const exchangeType = EXCHANGE_TYPE[exch];
    const token = String(o.symboltoken || "").trim();

    if (!exchangeType || !token) continue;

    if (!bucket.has(exchangeType)) {
      bucket.set(exchangeType, new Set());
    }

    bucket.get(exchangeType).add(token);
  }

  return Array.from(bucket.entries()).map(
    ([exchangeType, tokens]) => ({
      exchangeType,
      tokens: Array.from(tokens),
    })
  );
}


export const getAngelOneTradeDataUserPostion = async function (req, res, next) {
  try {


      let user = await User.findOne({ where: { id: req.userId } });       

    const angelToken = req.headers.angelonetoken;

    if (!angelToken) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Login In AngelOne Account",
        onlineTrades: [],
        error: null,
      });
    }

    const headers = {
      Authorization: `Bearer ${angelToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-UserType": "USER",
      "X-SourceID": "WEB",
      "X-ClientLocalIP": process.env.CLIENT_LOCAL_IP,
      "X-ClientPublicIP": process.env.CLIENT_PUBLIC_IP,
      "X-MACAddress": process.env.MAC_Address,
       'X-PrivateKey': user.kite_key, 
    };

    // =====================================================
    // 1️⃣ POSITION API (OLD LOGIC)
    // =====================================================
    const positionRes = await axios.get(
      "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getPosition",
      { headers }
    );

    const finalTrades = positionRes.data?.data || [];

      const now = new Date();

      // IST time nikalna
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // 3:20 PM ke baad condition
      const isAfter320 =
        hours > 15 || (hours === 15 && minutes >= 20);

      const trades = isAfter320 ? [] : finalTrades;

    if (!trades.length) {
      return res.json({
        status: true,
        statusCode: 200,
        message: "No Trade in User Position",
        onlineTrades: [],
        error: null,
      });
    }

    // =====================================================
    // 2️⃣ ORDER BOOK API (NEW)
    // =====================================================
    const orderRes = await axios.get(
      "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getOrderBook",
      { headers }
    );

    const orders = orderRes.data?.data || [];

    // =====================================================
    // 3️⃣ TRADE BOOK API (NEW)
    // =====================================================
    const tradeRes = await axios.get(
      "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook",
      { headers }
    );

    const tradeBook = tradeRes.data?.data || [];

    // =====================================================
    // 4️⃣ FIRST FILL MAP (orderid → trade)
    // =====================================================
    const tradeMap = {};
    for (const t of tradeBook) {
      if (!tradeMap[t.orderid]) {
        tradeMap[t.orderid] = t; // FIRST FILL
      }
    }

    // =====================================================
    // 5️⃣ OLD MAPPING + NEW DATA MERGE
    // =====================================================
    const mappedTrades = trades.map((t) => {

      const buyQty = Number(t.buyqty || 0);
      const sellQty = Number(t.sellqty || 0);

      let transaction_type;
      let quantity;

      if (buyQty > sellQty) {
        transaction_type = "BUY";
        quantity = buyQty - sellQty;
      } 
      // else if (sellQty === buyQty) {

      //   //  return null;
       
        
      //   transaction_type = "SELL";
      //    if((sellQty - buyQty)===0) {
      //     quantity = sellQty 
      //    }else{
      //      quantity = sellQty - buyQty;
      //    }
        
      // }
       else {
        return null;
      }

      // 🔍 MATCH ORDER
      const matchedOrder = orders.find(o =>
        o.tradingsymbol === t.tradingsymbol &&
        o.producttype === t.producttype &&
        o.transactiontype === transaction_type &&
        o.status === "complete"
      );

      // 🔍 MATCH TRADE (FIRST FILL)
      const matchedTrade = matchedOrder
        ? tradeMap[matchedOrder.orderid]
        : null;

      const fillPrice = Number(t.buyavgprice || 0);

      return {
        // ================= GRID =================
        tradingsymbol: t.tradingsymbol || "-",
        exchange: t.exchange || "-",
        transaction_type,
        product: t.producttype || "-",
        average_price: Number(t.averageprice || fillPrice || 0),
        quantity,

        // ================= IDS (NOW REAL) =================
        order_id: matchedOrder?.orderid || "",
        trade_id: matchedTrade?.fillid || "",     // 👈 fillid
        uniqueorderid: matchedOrder?.uniqueorderid || "",

        // ================= MOBILE =================
        transactiontype: transaction_type,
        ordertype: matchedOrder?.ordertype || "MARKET",
        producttype: t.producttype || "-",
        fillprice: String(fillPrice || ""),
        price: String(fillPrice || ""),
        fillsize: quantity,
        orderid: matchedOrder?.orderid || "",
        status: "COMPLETE",
        instrumenttype:t?.instrumenttype,
        orderstatus: matchedOrder?.status || "COMPLETE",
        text: "",
        updatetime:
          matchedOrder?.updatetime ||
          matchedTrade?.exchtime ||
          "",

        exchangeorderid:
          matchedOrder?.exchangeorderid || "",

        // ================= SOCKET =================
        symboltoken: String(t.symboltoken || ""),

        // ================= RAW =================
        buyqty: t.buyqty,
        sellqty: t.sellqty,
        netqty: t.netqty,
        pnl: t.pnl,
        cmp: t.ltp,
        instrumenttype: t.instrumenttype,

        createdAt: t.createdAt || null,
        updatedAt: t.updatedAt || null,
      };
    }).filter(Boolean); // 👈 null remove


    
    

    return res.json({
      status: true,
      statusCode: 200,
      message: "Trade in User Position",
      onlineTrades: mappedTrades,
      error: null,
    });

  } catch (error) {

    console.log(error,'rrr');
    
    return res.json({
      status: false,
      statusCode: 500,
      message: "Error getting AngelOne trade data",
      onlineTrades: [],
      error: error?.message || null,
    });
  }
};


// =============================== getAngelOneTradeDataUserPostion end ====================== 



export const getPosition = async (req, res,next) => {
    try {

       

      // let token = req.headers.angelonetoken

       let token = 
   "eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6IkMxOTEzMzEiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pFd01pd2ljMjkxY21ObElqb2lNeUlzSW1SbGRtbGpaVjlwWkNJNklqRmxNMlEzWmpsaExUUTBOV0l0TTJSak5TMDVNVEZoTFRZMFpXWTVOamcyTURWaVpDSXNJbXRwWkNJNkluUnlZV1JsWDJ0bGVWOTJNaUlzSW05dGJtVnRZVzVoWjJWeWFXUWlPakV3TWl3aWNISnZaSFZqZEhNaU9uc2laR1Z0WVhRaU9uc2ljM1JoZEhWeklqb2lZV04wYVhabEluMHNJbTFtSWpwN0luTjBZWFIxY3lJNkltRmpkR2wyWlNKOWZTd2lhWE56SWpvaWRISmhaR1ZmYkc5bmFXNWZjMlZ5ZG1salpTSXNJbk4xWWlJNklrTXhPVEV6TXpFaUxDSmxlSEFpT2pFM05qazNOalF6TmpJc0ltNWlaaUk2TVRjMk9UWTNOemM0TWl3aWFXRjBJam94TnpZNU5qYzNOemd5TENKcWRHa2lPaUkyWkROaVltVTFNeTA0TW1ObExUUmxORGd0WVRRMU55MWtNalF6TVdJMk4yVTVZVFVpTENKVWIydGxiaUk2SWlKOS5mYmRNSlV6QUxLc3N3NEVGM2ltUHRMNWhpUDJVaXdCd1VhbkpzaTc4RjdLNFpqWTVRQWRBMmhZYzBsc3FIOVYzUmFxdDlhbnc2amJEWEtGU0w3TUdKNERRYnZQTFV4Y2tvOTcwYlV0cHJFTHV3Z1B3aVBxRjRPZEhMdkR0ZXZCMEJjSDZBSzNHbjZ4T2d0OUZMaHg0N1NqUnFPY1d3czBYUloyMmp2VjJkc0UiLCJBUEktS0VZIjoieUpicm5ua3giLCJYLU9MRC1BUEktS0VZIjp0cnVlLCJpYXQiOjE3Njk2Nzc5NjIsImV4cCI6MTc2OTcxMTQwMH0.q3aAfcPSacTwQQNrJgs3dxhQpLmsS4gMlP1eG3SJ7w0c7qeIemmKdVd0xb98-HNTXoEvK621oBhXWCi6kTIJVw"
   

     
      var config = {
        method: 'get',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getPosition',
        headers: { 
              'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
        },
       
    };

    let resData = await axios(config)

   
    
     if(resData?.data?.status==true) {

         return res.json({
            status: true,
            statusCode:200,
            data: resData.data,
            message:''
        });
     }else{
       
        return res.json({
            status: false,
            statusCode:401,
            message: "Invalid symboltoken",
            error: resData?.data?.message,
        });

     }

    } catch (error) {
   
       return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};

//   WOKRING 
export const getAngelOneLTP = async (req, res,next) => {
    try {

        let user = await User.findOne({ where: { id: 4 } });    
        
       
        
    
       var data = JSON.stringify({
            "exchange":req.body.exchange,
            "tradingsymbol":req.body.tradingsymbol,
            "symboltoken":req.body.symboltoken
        });

      var config = {
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
        data : data
    };

    let resData = await axios(config)

     console.log(resData.data,'============resData============');
     
    

     if(resData?.data?.status==true) {

         return res.json({
            status: true,
            statusCode:200,
            data: resData.data,
            message:'',
             error: null,
        });
     }else{
       
        return res.json({
            status: false,
            statusCode:401,
            message: resData?.data?.message,
            error: resData?.data?.message,
        });

     }

    } catch (error) {

       return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};




// ===================== Angelone Apis  =====================

//  testing holding code ==================
export const getCommonUserHolding = async (req, res) => {
  try {

     if(req.result.ok===false) {
         
      return res.json({
      status: true,
      statusCode: 200,
      data: [],
      message:
        "User is not Login !",
    });
  }
    

    // 3️⃣ Get local COMPLETE orders older than today using filltime (stored as ISO string)
    const localOldOrders = await Order.findAll({
      where: {
        userId: req.userId,
        positionStatus:"HOLDING",
        orderstatuslocaldb: "OPEN",
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

//  working holding code ==================
export const getAngelUserHolding = async (req, res) => {
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

export const getAngelTradeBooks = async (req, res) => {
    try {

    // const angelToken = req.headers.angelonetoken

   const angelToken = "eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6Ik0xNjI0MjMiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pZc0luTnZkWEpqWlNJNklqTWlMQ0prWlhacFkyVmZhV1FpT2lJeFpUTmtOMlk1WVMwME5EVmlMVE5rWXpVdE9URXhZUzAyTkdWbU9UWTROakExWW1RaUxDSnJhV1FpT2lKMGNtRmtaVjlyWlhsZmRqSWlMQ0p2Ylc1bGJXRnVZV2RsY21sa0lqbzJMQ0p3Y205a2RXTjBjeUk2ZXlKa1pXMWhkQ0k2ZXlKemRHRjBkWE1pT2lKaFkzUnBkbVVpZlN3aWJXWWlPbnNpYzNSaGRIVnpJam9pWVdOMGFYWmxJbjE5TENKcGMzTWlPaUowY21Ga1pWOXNiMmRwYmw5elpYSjJhV05sSWl3aWMzVmlJam9pVFRFMk1qUXlNeUlzSW1WNGNDSTZNVGMyTnprMU1ETTJPQ3dpYm1KbUlqb3hOelkzT0RZek56ZzRMQ0pwWVhRaU9qRTNOamM0TmpNM09EZ3NJbXAwYVNJNklqZzVZems0TVdaa0xXUmtOakl0TkRsaE1DMWhaamxpTFRFM1pqRm1PV1JoTW1ReVlpSXNJbFJ2YTJWdUlqb2lJbjAuc1lGZ0hIaHJSbW1nLUpWRzc3NUFRbHRQS3J5cFQ4eDdHNUJOM0dXVGNNeS15dFp0ZnRCd196WllHYUYweENJTWYwamM3UHI5WDgtUGx4UEFJcXFBZ1lXWmNfcnZ3dVN6Z0JfaXhnRmNfMkE3azFfakZzcWI0RXhOTFd5Y0E1UkxMZmFJWXlzZGVlNGpyTTZwMWY5eE0xQ1AtTm1fRmdycDZsYXdaNEFnYkNFIiwiQVBJLUtFWSI6InlKYnJubmt4IiwiWC1PTEQtQVBJLUtFWSI6dHJ1ZSwiaWF0IjoxNzY3ODYzOTY4LCJleHAiOjE3Njc4OTcwMDB9.21ehjSVbCZ0AapX3uErc4jFw7FkF9V4tE3CLBvDNihBF7Xwk_bZ5iJShJyQ8a4ASVpwcgxyKIKdU7P56ECKL6g"
   
   var config = {
        method: 'get',
        url: `https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook`,

      //  url: `https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getOrderBook`,
        
        headers: { 
           'Authorization': `Bearer ${angelToken}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
             'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
        },
        };

        const {data} = await axios(config);

         if(data.status==true) {

        return res.json({
            status: true,
            statusCode:200,
            data: data.data,
            message:'get data'
        });

         }else{

        return res.json({
            status: false,
            statusCode:data.errorcode,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: data.message,
        });
    }
        
    } catch (error) {
        
         return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });

    }
};



export const getAngelHistoricalMarketData = async (req, res) => {
  try {

    const getCurrentISTTime = () => {
  const now = new Date();

  // IST convert (important)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);

  const year = istTime.getFullYear();
  const month = String(istTime.getMonth() + 1).padStart(2, '0');
  const day = String(istTime.getDate()).padStart(2, '0');
  const hours = String(istTime.getHours()).padStart(2, '0');
  const minutes = String(istTime.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

      let user = await User.findOne({ where: { id: 130 } });   

    const angelToken = user.authToken

   if (!angelToken) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Login In AngelOne Account",
        data: null,
        error: null,
      });
    }

    const {
      exchange='NFO',        // NSE | NFO
      // symboltoken="40735",     // instrument token 
       symboltoken="72180",  // instrument token 23100 ce    /

      
      interval='THREE_MINUTE',        // ONE_MINUTE, FIVE_MINUTE, etc
      fromdate = "2026-05-26 11:50",
      // todate   = "2026-04-02 01:00",
// fromdate = "2026-04-06 12:50",
//  fromdate = "2026-05-26 1:30",
 todate = getCurrentISTTime()
    } = req.query;



    const headers = {
      Authorization: `Bearer ${angelToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-UserType": "USER",
      "X-SourceID": "WEB",
    'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
      "X-PrivateKey":user.kite_key,
    };

    // =====================================================
    // 1️⃣ HISTORICAL CANDLE DATA
    // =====================================================
    const candlePayload = {
      exchange,
      symboltoken,
      interval,
      fromdate,
      todate
    };

    const candleRes = await axios.post(
      "https://apiconnect.angelone.in/rest/secure/angelbroking/historical/v1/getCandleData",
      candlePayload,
      { headers }
    );

    // =====================================================
    // 2️⃣ HISTORICAL OI DATA (ONLY IF NFO)
    // =====================================================
    let oiData = [];

    if (exchange === "NFO" && symboltoken) {
      const oiPayload = {
        exchange: "NFO",
        symboltoken: symboltoken,
        interval,
        fromdate,
        todate
      };

      const oiRes = await axios.post(
        "https://apiconnect.angelone.in/rest/secure/angelbroking/historical/v1/getOIData",
        oiPayload,
        { headers }
      );

      oiData = oiRes.data?.data || [];
    }

    // =====================================================
    // ✅ FINAL RESPONSE
    // =====================================================
    return res.json({
      status: true,
      message: "Angel One Historical Market Data",
      data: {
        candles: candleRes.data?.data || [],
        // oi: oiData
      },
      error: null
    });

  } catch (err) {
    console.error("Angel Historical API Error:", err?.response?.data || err.message);

    return res.json({
      status: false,
      message: "Failed to fetch Angel historical data",
      error: err?.response?.data || err.message,
    });
  }
};