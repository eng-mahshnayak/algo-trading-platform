import User from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import { KiteConnect } from "kiteconnect";
import { sendResetMail } from '../utils/sendEmail.js';
import querystring from "querystring";
import dotenv from 'dotenv';
dotenv.config();
import { Op } from 'sequelize';
import { generateRandomNumbers } from "../utils/randomWords.js";
import axios from 'axios';
import { generateTOTP } from '../utils/generateTOTP.js';
import AngelOneCredentialer from '../models/angelOneCredential.js'
import {  connectSmartSocket,emitOrderGet,isSocketReady} from "../services/smartapiFeed.js"
import UserSession from '../models/userSession.js';
import BrokerModel from '../models/borkerModel.js';

import { encrypt,decrypt } from "../utils/passwordUtils.js"
const GROWW_CLIENT_ID = process.env.GROWW_CLIENT_ID;
const GROWW_CLIENT_SECRET = process.env.GROWW_CLIENT_SECRET;
const GROWW_REDIRECT_URI = process.env.GROWW_REDIRECT_URI;
const FRONTEND_URL = process.env.FRONTEND_URL;
import { logSuccess } from '../utils/loggerr.js';
import UserMongodbModel from '../models/userMongodbModel.js'

export async function getUserSessionData1234(req, res) {
  try {
    // pagination
    const page = parseInt(req.query.page, 10) || 1;
    const size = parseInt(req.query.size, 10) || 10;

    const limit = size;
    const offset = (page - 1) * size;

    // 1️⃣ get sessions
    const { rows, count } = await UserSession.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    // 2️⃣ extract userIds
    const userIds = [...new Set(rows.map(r => r.userId))];

    // 3️⃣ fetch users
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ["id", "firstName", "lastName"],
      raw: true,
    });

    // 4️⃣ create user map
    const userMap = {};
    users.forEach(u => {
      userMap[u.id] = `${u.firstName || ""} ${u.lastName || ""}`.trim();
    });

    // 5️⃣ attach display_name
    const data = rows.map(session => ({
      ...session,
      display_name: userMap[session.userId] || null,
    }));

    return res.json({
      status: true,
      statusCode: 200,
      data,
      pagination: {
        totalRecords: count,
        totalPages: Math.ceil(count / size),
        currentPage: page,
        pageSize: size,
      },
      message: "Get session data successfully",
    });

  } catch (err) {
    return res.json({
      status: false,
      statusCode: 500,
      data: null,
      message: err.message,
    });
  }
}


export async function getUserSessionData(req, res, next) {
  try {
    // 1️⃣ query params
    const page = parseInt(req.query.page, 10) || 1;   // default page = 1
    const size = parseInt(req.query.size, 10) || 10;  // default size = 10
    const userId = req.userId || null;
  
    if(req.role=='user'||req.role==='clone-user'){

     let  totalPages = 0
          return res.json({
      status: true,
      statusCode: 200,
      data: [],
      pagination: {
        totalRecords: 0,
         totalPages,
        currentPage: 0,
        pageSize: 0,
      },
      message: "Get session data successfully",
    });
  }




    const limit = size;
    const offset = (page - 1) * size;

     // 🔍 WHERE condition
    const whereCondition = {};
    if (userId) {
      whereCondition.userId = userId; // exact match
    }


    // 2️⃣ data + count
    const { rows, count } = await UserSession.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    // 3️⃣ pagination meta
    const totalPages = Math.ceil(count / size);

      // 2️⃣ extract userIds
    const userIds = [...new Set(rows.map(r => r.userId))];

    // 3️⃣ fetch users
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ["id", "firstName", "lastName"],
      raw: true,
    });

    // 4️⃣ create user map
    const userMap = {};
    users.forEach(u => {
      userMap[u.id] = `${u.firstName || ""} ${u.lastName || ""}`.trim();
    });

    // 5️⃣ attach display_name
    const data = rows.map(session => ({
      ...session,
      user_name: userMap[session.userId] || null,
    }));

    return res.json({
      status: true,
      statusCode: 200,
      data: data,
      pagination: {
        totalRecords: count,
        totalPages,
        currentPage: page,
        pageSize: size,
      },
      message: "Get session data successfully",
    });
  } catch (err) {
    return res.json({
      status: false,
      statusCode: 500,
      data: null,
      message: err.message,
    });
  }
}

export async function getUserAdminSessionData(req, res, next) {
  try {
    // 1️⃣ query params
    const page = parseInt(req.query.page, 10) || 1;   // default page = 1
    const size = parseInt(req.query.size, 10) || 10;  // default size = 10
    const userId = req.query.userId || null;

    const limit = size;
    const offset = (page - 1) * size;

     // 🔍 WHERE condition
    const whereCondition = {};
    if (userId ) {
      whereCondition.userId = userId
    }


    // 2️⃣ data + count
    const { rows, count } = await UserSession.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      raw: true,
    });

    // 3️⃣ pagination meta
    const totalPages = Math.ceil(count / size);

      // 2️⃣ extract userIds
    const userIds = [...new Set(rows.map(r => r.userId))];

    // 3️⃣ fetch users
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ["id", "firstName", "lastName"],
      raw: true,
    });

    // 4️⃣ create user map
    const userMap = {};
    users.forEach(u => {
      userMap[u.id] = `${u.firstName || ""} ${u.lastName || ""}`.trim();
    });

    // 5️⃣ attach display_name
    const data = rows.map(session => ({
      ...session,
      user_name: userMap[session.userId] || null,
    }));

    return res.json({
      status: true,
      statusCode: 200,
      data: data,
      pagination: {
        totalRecords: count,
        totalPages,
        currentPage: page,
        pageSize: size,
      },
      message: "Get session data successfully",
    });
  } catch (err) {
    return res.json({
      status: false,
      statusCode: 500,
      data: null,
      message: err.message,
    });
  }
}

export const deleteMultipleUserSessions = async (req, res) => {
  try {

    const { ids } = req.body;

    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({
        status: false,
        message: "IDs array is required",
      });
    }

    const deletedCount = await UserSession.destroy({
      where: {
        id: {
          [Op.in]: ids,
        },
      },
    });

    return res.json({
      status: true,
      deletedCount,
      message: `${deletedCount} sessions deleted successfully`,
    });
  } catch (err) {
    console.error("Bulk Delete Error:", err);
    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

export const deleteUserSessionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        status: false,
        message: "Session ID is required",
      });
    }

    const deleted = await UserSession.destroy({
      where: { id },
    });

    if (!deleted) {
      return res.status(404).json({
        status: false,
        message: "Session not found",
      });
    }

    return res.json({
      status: true,
      message: "Session deleted successfully",
    });
  } catch (err) {
    console.error("Delete Session Error:", err);
    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};



// ===================== auth controller start ================================


export async function fetchGooglFromSerpApi(req,res,next) {

  try {

    const url = "https://serpapi.com/search.json";

    const response = await axios.get(url, {
      params: {
        engine: "google_finance",
        q: "GOOGL:NASDAQ",
        // api_key: SERPAPI_KEY,
      },
    });
    
      return res.json({
              status: true,
              data:response.data,
              statusCode:2001,
              message:null
          });
    

  } catch (err) {


    console.log(err,'hn');
    

    return res.json({
              status: true,
              data:null,
              statusCode:2001,
              message:err.message
          });

  }
}

async function generateUniqueUsername() {
  let username;
  let isUnique = false;

  while (!isUnique) {
    username = await generateRandomNumbers(5); // e.g., "48371"

    const existingUser = await User.findOne({
      where: { username: username },
    });

    if (!existingUser) {
      isUnique = true; // ✅ unique username found
    }
  }

  return username;
}


export const register = async (req, res) => {

const { firstName, lastName,mob, isChecked,broker,employee="",source="" } = req.body;
const email = (req.body.email || "").trim();
const password = (req.body.password || "").trim();

  try {
    
    if (!isChecked) {

       return res.json({
            status: false,
            statusCode:400,
            message: "You must accept the Terms and Conditions",
            error: null,
        });
    }

     // ✅ Check mobile number length (must be exactly 10 digits)
      if (!mob || mob.length !== 10) {
        return res.json({
          status: false,
          statusCode: 400,
          message: "Mobile number must be exactly 10 digits",
          error: null,
        });
      }

      // ✅ Validate password strength
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{7,}$/;

  if (!passwordRegex.test(password)) {
    return res.json({
      status: false,
      statusCode: 400,
      message:
        "Password must be at least 7 characters long and contain uppercase, lowercase, number, and special character",
    });
  }

       const username = await generateUniqueUsername();
    
      const userExists = await User.findOne({
        where: {
          [Op.or]: [
            { email: email },
            { phoneNumber: mob },
            {username:username}
          ]
        }
      });

    if (userExists){

       return res.json({
            status: false,
            statusCode:400,
            message: "User already exists with mobile ,email",
            error: null,
        });

    } 


    // const hashedPassword = await bcrypt.hash(password, 10);

      const hashedPassword = await encrypt(password, process.env.CRYPTO_SECRET);

      const brokerLower = broker?.toString().trim().toLowerCase();

     const brokerData = await BrokerModel.findOne({
          where: { brokerName: brokerLower },
          raw: true,
        });

    if (!brokerData) {
          return res.json({
            status: false,
            message: "Invalid broker selected",
          });
        }

    const brokerLink = brokerData.brokerLink;

     let saveUser = await User.create({
      firstName,
      lastName,
      username:username,
      email,
      phoneNumber:mob,
      role:'user',
      password: hashedPassword,
      isChecked,
      brokerName:brokerLower,
      brokerImageLink:brokerLink,
      assignEmp:employee,
      source:source
    });
    
     const token = jwt.sign({ id: saveUser.id,role:saveUser.role,broker:saveUser.brokerName }, process.env.JWT_SECRET, { expiresIn: '1d' });

     // create a new login session
      await UserSession.create({
      userId: saveUser.id,
      login_at: new Date(),
      is_active: true,
    });


   
     return res.json({
            status: true,
            statusCode:400,
            saveUser,token,
            data:saveUser,
            message: "User registered successfully",
            error: null,
        });
  } catch (error) {


    console.log(error);
    

    return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });

  }
  
};


// export const login = async (req, res) => {

// const email = (req.body.email || "").trim();
// const password = (req.body.password || "").trim();

//   try {

//     // Get start and end of today
//       const now = new Date();
//       const startOfDay = new Date(now.setHours(0, 0, 0, 0)); // Midnight today
//       const endOfDay = new Date(now.setHours(23, 59, 59, 999)); // End of today

//        console.log(email,password,'llllll');
    

//     // const user = await User.findOne({ where: { email } });

//     const user = await User.findOne({
//       where: {
//         [Op.or]: [
//           { email: email },      // assuming you store emails in lowercase
//           { username: email },    // usernames are case-sensitive or as per your rules
//         ],
//       },
//     });

   

//     if (!user) {

//       console.log(user,'user');
      

//       return res.json({
//             status: false,
//             statusCode:401,
//             message: "User not found",
//             error: null,
//         });
//     }

    
//      // Count logins for the user today
//       const loginCount = await UserSession.count({
//         where: {
//           userId: user.id,
//           is_active:true,
//           login_at: {
//             [Op.not]: null, // Ensure login_at is not null
//             [Op.between]: [startOfDay, endOfDay], // Check if login_at is today
//           },
//         },
//       });

//       if(loginCount>=3&&user.role!=='admin') {
        
//           return res.json({
//             status: false,
//             statusCode:401,
//             message: "Only Two User Login Same Crendential",
//             error: null,
//         });
//       }

      
      

//     const originalPass = decrypt(user.password,process.env.CRYPTO_SECRET)

//       console.log('crypto code end ');

  
//     if (originalPass!==password){

//       return res.json({
//             status: false,
//             statusCode:401,
//             message: "Invalid credentials",
//             error: null,
//         });

//     } 


//      // create a new login session
//        await UserSession.create({
//       userId:  user.id,
//       login_at: new Date(),
//       is_active: true,
//     });


     
//     // 2️⃣ Find any user where angelLoginUser = true AND updated today
//       const activeAngelUser = await User.findOne({
//         where: {
//           angelLoginUser: true,
//           email:user.email,
//           updatedAt: {
//             [Op.between]: [startOfDay, endOfDay],
//           },
//         },
//         raw:true
//       });
      
//     const token = jwt.sign({ id: user.id,role:user.role,borker:user.brokerName }, process.env.JWT_SECRET, { expiresIn: '1d' })

//      if(user.role==='admin') {

//        if(activeAngelUser) {
      
//           let adminCren = {
//               authToken:activeAngelUser.authToken,
//               feedToken:activeAngelUser.feedToken,
//               refreshToken:activeAngelUser.refreshToken
//           }

//         if (isSocketReady(user.id)) {

//          emitOrderGet(user.authToken)
//       } else {
//           connectSmartSocket(user.id,activeAngelUser.authToken,activeAngelUser.feedToken,'abc')
//       }

//       return res.json({
//             status: true,
//             statusCode:400,
//             token, user,
//             message: "User login successfully",
//             angelTokens:adminCren,
//             error: null,
//         });

//     }else{
//         return res.json({
//             status: true,
//             statusCode:400,
//             token, user,
//             message: "User login successfully",
//             angelTokens:{},
//             error: null,
//         });
//     }
      
//      }else{

//         // 2️⃣ Find any user where angelLoginUser = true AND updated today
//       const angelCrendentialData = await AngelOneCredentialer.findOne({
//         where: {
//           userId:user.id ,
//         },
//         raw:true
//       });

//        if(angelCrendentialData) {

//         if (isSocketReady(user.id)) {

//             console.log('socket already connection',isSocketReady(user.id));

//         emitOrderGet(user.authToken)
        
//       } else {
//           connectSmartSocket(user.id,user.authToken,user.feedToken,angelCrendentialData?.clientId)
//       }

//      let userCren = {
//               authToken:user.authToken,
//               feedToken:user.feedToken,
//               refreshToken:user.refreshToken
//           }

      
//      return res.json({
//             status: true,
//             statusCode:400,
//             token, user,
//             angelTokens:userCren,
//             message: "User login successfully",
//             error: null,
//         });


//        }else if(user.brokerName==='kite') {

//         return res.json({
//             status: true,
//             statusCode:400,
//             token, user,
//             angelTokens:{
//               authToken:user.authToken,
//               feedToken:user.feedToken,
//               refreshToken:user.refreshToken
//             },
//             message: "User login successfully",
//             error: null,
//         });

//        }else{
         
//          return res.json({
//             status: true,
//             statusCode:400,
//             token, user,
//             angelTokens:{
//               authToken:"",
//               feedToken:"",
//               refreshToken:""
//             },
//             message: "User login successfully",
//             error: null,
//         });

//        }

//      }
  
//   } catch (error) {

//     console.log(error);
    

//       return res.json({
//             status: false,
//             statusCode:500,
//             message: "Unexpected error occurred. Please try again.",
//             data:null,
//             error: error.message,
//         });
//   }
// };













// Step 2: Get AngelOne Profile



const reverseGeocode = async (lat,lng) => {

  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
  const res = await axios.get(url, {
    headers: { "User-Agent": "your-app-name" },
  });

  return res.data;
};



export const login = async (req, res) => {

const email = (req.body.email || "").trim();
const password = (req.body.password || "").trim();
let location = req.body?.location

logSuccess(req, {
        msg: "Login User",
        email: email,
        location:location
      });


  try {


   
    
    
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: email },      // assuming you store emails in lowercase
          { username: email },    // usernames are case-sensitive or as per your rules
        ],
      },
    });

    if (!user) {

      return res.json({
            status: false,
            statusCode:401,
            message: "User not found",
            error: null,
        });
    }

    const originalPass = decrypt(user.password,process.env.CRYPTO_SECRET)

    console.log(originalPass,'=====originalPass=======');
    

    if (originalPass!==password){

      return res.json({
            status: false,
            statusCode:401,
            message: "Invalid credentials",
            error: null,
        });

    } 


    

    const isNormalUser =
          user.role === "user" || user.role === "clone-user";

          
           

        if (isNormalUser) {
          const activeSession = await UserSession.findOne({
            where: {
              userId: user.id,
              is_active: true,
            },
          });

           let  DetailsObj 

          
           

          if(location?.source!=='fallback'&&location?.lat!==undefined&&location?.lng!==undefined) {
              DetailsObj = await reverseGeocode(location?.lat,location?.lng)
          }else{
             DetailsObj = {
              display_name:"NOT FOUND DETAILS"
             }
          }
       

         console.log(DetailsObj,'DetailsObj');
         

          // ✅ only create if no active session exists
          if (!activeSession) {
            await UserSession.create({
              userId: user.id,
              login_at: new Date(),
              is_active: true,
              display_name:DetailsObj?.display_name
            });
          }
        } else if (user.role === "admin") {
          // 🔥 admin → always create session
          await UserSession.create({
            userId: user.id,
            login_at: new Date(),
            is_active: true,
          });
        }


    // 2️⃣ Find any user where angelLoginUser = true AND updated today
      const activeAngelUser = await User.findOne({
        where: {
          angelLoginUser: true,
          brokerName:"angelone",
          role:'user'
          // updatedAt: {
          //   [Op.between]: [startOfDay, endOfDay],
          // },
        },
        raw:true
      });

      console.log(activeAngelUser,'activeAngelUser');
      

    const token = jwt.sign({ id: user.id,role:user.role,borker:user.brokerName }, process.env.JWT_SECRET, { expiresIn: '1d' })

  
    await User.update(
      { userToken: token },
      {
        where: { id: user.id }
      }
    );

     if(user.role==='admin') {

       if(activeAngelUser) {
      
          let adminCren = {
              authToken:activeAngelUser.authToken,
              feedToken:activeAngelUser.feedToken,
              refreshToken:activeAngelUser.refreshToken
          }

       if (!isSocketReady()) {

          // connectSmartSocket(
          //   activeAngelUser.authToken,
          //   activeAngelUser.feedToken,
          //   angelCrendentialData.clientId
          // );

        } else {
          emitOrderGet(user.authToken);
        }

      return res.json({
            status: true,
            statusCode:400,
            token, user,
            message: "User login successfully",
            angelTokens:adminCren,
            error: null,
        });

    }else{

      console.log('heellos chwckk');
      
        return res.json({
            status: true,
            statusCode:400,
            token, user,
            message: "User login successfully",
            angelTokens:{},
            error: null,
        });
    }
      
     }else{

        // 2️⃣ Find any user where angelLoginUser = true AND updated today
      const angelCrendentialData = await AngelOneCredentialer.findOne({
        where: {
          userId:user.id ,
        },
        raw:true
      });

       if(angelCrendentialData) {


        if (!isSocketReady()) {

          connectSmartSocket(
            user.authToken,
            user.feedToken,
            angelCrendentialData?.clientId
          );
          
        } else {
          emitOrderGet(user.authToken);
        }

     let userCren = {
              authToken:user.authToken,
              feedToken:user.feedToken,
              refreshToken:user.refreshToken
          }

      
     return res.json({
            status: true,
            statusCode:400,
            token, user,
            angelTokens:userCren,
            message: "User login successfully",
            error: null,
        });


       }else if(user.brokerName==='kite') {

        return res.json({
            status: true,
            statusCode:400,
            token, user,
            angelTokens:{
              authToken:user.authToken,
              feedToken:user.feedToken,
              refreshToken:user.refreshToken
            },
            message: "User login successfully",
            error: null,
        });

       }else if(user.brokerName==='fyers') {
             return res.json({
            status: true,
            statusCode:400,
            token, user,
            angelTokens:{
              authToken:user.authToken,
              feedToken:user?.feedToken,
              refreshToken:user?.refreshToken
            },
            message: "User login successfully",
            error: null,
        });
       }else{
         
         return res.json({
            status: true,
            statusCode:400,
            token, user,
            angelTokens:{
              authToken:"",
              feedToken:"",
              refreshToken:""
            },
            message: "User login successfully",
            error: null,
        });

       }

     }
  
  } catch (error) {


    console.log(error.response.data);
    

      return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
  }
};


// =========================working code ========================

export const login121 = async (req, res) => {

const email = (req.body.email || "").trim();
const password = (req.body.password || "").trim();

  try {

    // Get start and end of today
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0)); // Midnight today
      const endOfDay = new Date(now.setHours(23, 59, 59, 999)); // End of today

      
    // const user = await User.findOne({ where: { email } });

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: email },      // assuming you store emails in lowercase
          { username: email },    // usernames are case-sensitive or as per your rules
        ],
      },
    });

   

    if (!user) {

      return res.json({
            status: false,
            statusCode:401,
            message: "User not found",
            error: null,
        });
    }

     // Count logins for the user today
      const loginCount = await UserSession.count({
        where: {
          userId: user.id,
          is_active:true,
          login_at: {
            [Op.not]: null, // Ensure login_at is not null
            [Op.between]: [startOfDay, endOfDay], // Check if login_at is today
          },
        },
      });

      if(loginCount>=2) {
        
          return res.json({
            status: false,
            statusCode:401,
            message: "Only Two User Login Same Crendential",
            error: null,
        });
      }

    const originalPass = decrypt(user.password,process.env.CRYPTO_SECRET)

    if (originalPass!==password){

      return res.json({
            status: false,
            statusCode:401,
            message: "Invalid credentials",
            error: null,
        });

    } 


    const isNormalUser =
          user.role === "user" || user.role === "clone-user";

        if (isNormalUser) {
          const activeSession = await UserSession.findOne({
            where: {
              userId: user.id,
              is_active: true,
            },
          });

          // ✅ only create if no active session exists
          if (!activeSession) {
            await UserSession.create({
              userId: user.id,
              login_at: new Date(),
              is_active: true,
            });
          }
        } else if (user.role === "admin") {
          // 🔥 admin → always create session
          await UserSession.create({
            userId: user.id,
            login_at: new Date(),
            is_active: true,
          });
}
     
    // 2️⃣ Find any user where angelLoginUser = true AND updated today
      const activeAngelUser = await User.findOne({
        where: {
          angelLoginUser: true,
          brokerName:"angelone",
          // updatedAt: {
          //   [Op.between]: [startOfDay, endOfDay],
          // },
        },
        raw:true
      });


      console.log(activeAngelUser,'activeAngelUser===========');
      
      
    const token = jwt.sign({ id: user.id,role:user.role,borker:user.brokerName }, process.env.JWT_SECRET, { expiresIn: '1d' })

     if(user.role==='admin') {

       if(activeAngelUser) {
      
          let adminCren = {
              authToken:activeAngelUser.authToken,
              feedToken:activeAngelUser.feedToken,
              refreshToken:activeAngelUser.refreshToken
          }

        if (isSocketReady(user.id)) {

        //  emitOrderGet(user.authToken)
      } else {
          // connectSmartSocket(user.id,activeAngelUser.authToken,activeAngelUser.feedToken,'abc')
      }

      return res.json({
            status: true,
            statusCode:400,
            token, user,
            message: "User login successfully",
            angelTokens:adminCren,
            error: null,
        });

    }else{
        return res.json({
            status: true,
            statusCode:400,
            token, user,
            message: "User login successfully",
            angelTokens:{},
            error: null,
        });
    }
      
     }else{

        // 2️⃣ Find any user where angelLoginUser = true AND updated today
      const angelCrendentialData = await AngelOneCredentialer.findOne({
        where: {
          userId:user.id ,
        },
        raw:true
      });

       if(angelCrendentialData) {

        if (isSocketReady(user.id)) {

            console.log('socket already connection',isSocketReady(user.id));

        emitOrderGet(user.authToken)
        
      } else {
          connectSmartSocket(user.id,user.authToken,user.feedToken,angelCrendentialData?.clientId)
      }

     let userCren = {
              authToken:user.authToken,
              feedToken:user.feedToken,
              refreshToken:user.refreshToken
          }

      
     return res.json({
            status: true,
            statusCode:400,
            token, user,
            angelTokens:userCren,
            message: "User login successfully",
            error: null,
        });


       }else if(user.brokerName==='kite') {

        return res.json({
            status: true,
            statusCode:400,
            token, user,
            angelTokens:{
              authToken:user.authToken,
              feedToken:user.feedToken,
              refreshToken:user.refreshToken
            },
            message: "User login successfully",
            error: null,
        });

       }else{
         
         return res.json({
            status: true,
            statusCode:400,
            token, user,
            angelTokens:{
              authToken:"",
              feedToken:"",
              refreshToken:""
            },
            message: "User login successfully",
            error: null,
        });

       }

     }
  
  } catch (error) {

    console.log(error);
    

      return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
  }
};



export const adminloginWithTOTPInAngelOne = async function (req, res, next) {
  try {

    // ========== 1. CHECK LOGIN LIMIT ==========
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    const loginCount = await UserSession.count({
      where: {
        userId: req.headers.userid,
        is_active: true,
        login_at: {
          [Op.not]: null,
          [Op.between]: [startOfDay, endOfDay],
        },
      },
    });

    if (loginCount >= 2) {
      return res.json({
        status: false,
        statusCode: 401,
        message: "Only Two User Login Same Credential",
        error: null,
      });
    }

    // ========== 2. GET ANGEL CREDENTIAL ==========
    let existing = await AngelOneCredentialer.findOne({
      where: { userId: req.headers.userid },
    });

    if (!existing) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "No credentials found for this user.",
        data: null,
      });
    }

    const createdData = existing.dataValues;

    // ========== 3. GENERATE TOTP ==========
    let totpCode = await generateTOTP(createdData.totpSecret);

    const loginPayload = {
      clientcode: createdData.clientId,
      password: createdData.password,
      totp: totpCode,
    };

        // ========== 7. GET POSTGRES USER ==========
    const postgreUser = await User.findByPk(req.headers.userid, { raw: true });


    // ========== 4. LOGIN ANGEL ONE ==========
    const loginConfig = {
      method: "post",
      url: "https://apiconnect.angelone.in/rest/auth/angelbroking/user/v1/loginByPassword",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": process.env.CLIENT_LOCAL_IP,
        "X-ClientPublicIP": process.env.CLIENT_PUBLIC_IP,
        "X-MACAddress": process.env.MAC_Address,
        "X-PrivateKey": postgreUser.kite_key,
      },
      data: loginPayload,
    };

    const { data } = await axios(loginConfig);

    if (data.status !== true) {
      return res.json({
        status: false,
        data: null,
        statusCode: data.errorCode,
        message: data.message,
      });
    }

    // ========== 5. FETCH FUND ==========
    let dematFund = 0;

    try {

      const fundConfig = {
        method: "get",
        url: "https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getRMS",
        headers: {
          Authorization: `Bearer ${data.data.jwtToken}`,
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

      const fundResponse = await axios(fundConfig);

      if (fundResponse.data.status === true && fundResponse.data.data) {

        const fundData = fundResponse.data.data;

        dematFund = fundData.net || 0;

        console.log("✅ Fund fetched:", dematFund);
      }

    } catch (fundError) {

      console.log("❌ Fund fetch error:", fundError.message);

    }

    
    

    // ========== 6. UPDATE POSTGRES ==========
    await User.update(
      {
        authToken: data.data.jwtToken,
        feedToken: data.data.feedToken,
        refreshToken: data.data.refreshToken,
        angelLoginUser: true,
        angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000),
        DematFund: dematFund,
      },
      {
        where: { id: req.headers.userid },
        returning: true,
      }
    );



    // ========== 8. TOKEN OBJECT ==========
    const tokens = {
      authToken: data.data.jwtToken,
      feedToken: data.data.feedToken,
      refreshToken: data.data.refreshToken,
      userToken: postgreUser.userToken,
    };

    // Remove conflicting fields
    delete postgreUser.authToken;
    delete postgreUser.feedToken;
    delete postgreUser.refreshToken;
    delete postgreUser.userToken;
    delete postgreUser.angelLoginUser;
    delete postgreUser.angelLoginExpiry;
    delete postgreUser.updatedAt;

    // ========== 9. UPSERT MONGODB ==========
    const saveData = await UserMongodbModel.findOneAndUpdate(
      { postgreId: req.headers.userid },
      {
        $set: {
          ...tokens,
          angelLoginUser: true,
          angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000),
          dematFund: dematFund,
        },

        $setOnInsert: {
          ...postgreUser,
          postgreId: req.headers.userid,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );

   

    // ========== 10. SOCKET CONNECT ==========
    if (!isSocketReady()) {
      connectSmartSocket(
        data.data.jwtToken,
        data.data.feedToken,
        createdData.clientId
      );
    } else {
      emitOrderGet(data.data.jwtToken);
    }

    // ========== 11. RESPONSE ==========
    return res.status(200).json({
      status: true,
      data: {
        ...data.data,
        dematFund: dematFund,
      },
    });

  } catch (error) {

    console.log(error);

    return res.json({
      status: false,
      data: null,
      statusCode: 401,
      message: error.message,
    });

  }
};

//   ==============update 11 march 2026 ====================
export const adminloginWithTOTPInAngelOne131 = async function (req,res,next) {
    try {

       // Get start and end of today
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0)); // Midnight today
      const endOfDay = new Date(now.setHours(23, 59, 59, 999)); // End of today

    // Count logins for the user today
      const loginCount = await UserSession.count({
        where: {
          userId: req.headers.userid,
            is_active:true,
          login_at: {
            [Op.not]: null, // Ensure login_at is not null
            [Op.between]: [startOfDay, endOfDay], // Check if login_at is today
          },
        },
      });

      if(loginCount>=2) {
        
          return res.json({
            status: false,
            statusCode:401,
            message: "Only Two User Login Same Crendential",
            error: null,
        });
      }  
        
    let existing = await AngelOneCredentialer.findOne({ where: { userId:req.headers.userid  } });

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

      console.log( data.data.jwtToken,' data.data.jwtToken,');
      

      await User.update( {
        authToken: data.data.jwtToken,
        feedToken: data.data.feedToken,
        refreshToken: data.data.refreshToken,
        angelLoginUser:true,
        angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours
      },
      {
        where: { id: req.headers.userid },
        returning: true, // optional, to get the updated record
      }
    );


            //------------------------------------------------
            // ✅ GET POSTGRE USER (for Mongo insert)
            //------------------------------------------------
    
            const postgreUser = await User.findByPk(req.headers.userid, { raw: true });

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
            
                 let saveDtaa  = await UserMongodbModel.findOneAndUpdate(
                      { postgreId: req.headers.userid },
            
                      {
                        $set: {
                          ...tokens,
                          angelLoginUser: true,
                          angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000),
                        },
            
                        $setOnInsert: {
                          ...postgreUser,
                          postgreId: req.headers.userid,
                        }
                      },
            
                      {
                        upsert: true,
                        new: true,
                      }
                    );



                    console.log('save and update mongodb !',saveDtaa);
                    
    



          if (!isSocketReady()) {
            connectSmartSocket(
              data.data.jwtToken,
              data.data.feedToken,
             createdData.clientId
            );
          } else {
            emitOrderGet(data.data.jwtToken,);
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

    return res.json({
              status: false,
              data:null,
              statusCode:401,
              message:error.message
          });
  }
}

// ===========================working code ==========================
export const adminloginWithTOTPInAngelOne121 = async function (req,res,next) {
    try {

       // Get start and end of today
      const now = new Date();
      const startOfDay = new Date(now.setHours(0, 0, 0, 0)); // Midnight today
      const endOfDay = new Date(now.setHours(23, 59, 59, 999)); // End of today

    // Count logins for the user today
      const loginCount = await UserSession.count({
        where: {
          userId: req.headers.userid,
            is_active:true,
          login_at: {
            [Op.not]: null, // Ensure login_at is not null
            [Op.between]: [startOfDay, endOfDay], // Check if login_at is today
          },
        },
      });

      if(loginCount>=2) {
        
          return res.json({
            status: false,
            statusCode:401,
            message: "Only Two User Login Same Crendential",
            error: null,
        });
      }  
        
    let existing = await AngelOneCredentialer.findOne({ where: { userId:req.headers.userid  } });

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
        where: { id: req.headers.userid },
        returning: true, // optional, to get the updated record
      }
    );

        




        if (isSocketReady(req.headers.userid)) {
        console.log('✅ WebSocket is connected!');
      } else {
          connectSmartSocket(req.headers.userid,data.data.jwtToken,data.data.feedToken,createdData.clientId)
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




// ---------- ZERODHA ----------
// controllers/kiteController.js
const kite = new KiteConnect({
  api_key: process.env.KITE_API_KEY,
});


// 1. Redirect to Groww authorize page
export const loginWithGroww = (req, res) => {
  const params = querystring.stringify({
    client_id: GROWW_CLIENT_ID,
    response_type: "code",
    redirect_uri: GROWW_REDIRECT_URI,
    scope: "profile email",
    state: "xyz123"
  });
  res.redirect(`https://groww.in/oauth/authorize?${params}`);
};

// 2. Handle callback
export const growwCallback = async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange code for access token
    const tokenRes = await axios.post(
      "https://groww.in/oauth/token",
      querystring.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: GROWW_REDIRECT_URI,
        client_id: GROWW_CLIENT_ID,
        client_secret: GROWW_CLIENT_SECRET
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token } = tokenRes.data;

    // Fetch user profile
    const userRes = await axios.get("https://groww.in/oauth/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const growwUser = userRes.data;

    // Apne DB me user create/update karo
    const user = {
      name: growwUser.name,
      email: growwUser.email,
      growwId: growwUser.id
    };

    // JWT generate karo
    const token = createJwtToken(user);

    // Redirect to frontend with token & user
    res.redirect(
      `${FRONTEND_URL}/groww-login-success?token=${token}&user=${encodeURIComponent(
        JSON.stringify(user)
      )}`
    );
  } catch (err) {
    console.error("Groww login error:", err);
    res.redirect(`${FRONTEND_URL}/login?error=groww_login_failed`);
  }
};



// // 1. Redirect to Fyers authorize page

// export const fyersLogin = async (req, res) => {
//   try {
//     const BASE = process.env.FYERS_BASE_URL || "https://api-t1.fyers.in";
//     const authUrl = `${BASE}/api/v3/generate-authcode` +
//       `?client_id=${encodeURIComponent(process.env.FYERS_APP_ID)}` +
//       `&redirect_uri=${encodeURIComponent(process.env.FYERS_REDIRECT_URI)}` +
//       `&response_type=code` +
//       `&state=fyers_${Date.now()}`;

//     return res.redirect(authUrl);
//   } catch (err) {
//     console.error("FYERS login redirect error:", err);
//     return res.status(500).json({ message: "Unable to start FYERS login" });
//   }
// };

// // Utility: appIdHash (FYERS v3 requirement)
// // Most setups: sha256(`${APP_ID}:${APP_SECRET}`)
// function makeAppIdHash(appId, secret) {
//   return crypto.createHash("sha256").update(`${appId}:${secret}`).digest("hex");
// }


// export const fyersCallback = async (req, res) => {
//   const BASE = process.env.FYERS_BASE_URL || "https://api-t1.fyers.in";
//   try {
//     const code = req.query.code || req.query.auth_code; 
//     if (!code) {
//       return res.status(400).json({ message: "Missing auth code from FYERS" });
//     }

//     const appId = process.env.FYERS_APP_ID;
//     const secret = process.env.FYERS_APP_SECRET;
//     const appIdHash = makeAppIdHash(appId, secret);

//     // Exchange code for tokens
//     const tokenRes = await axios.post(
//       `${BASE}/api/v3/validate-authcode`,
//       {
//         grant_type: "authorization_code",
//         appIdHash,
//         code, 
//       },
//       { headers: { "Content-Type": "application/json" } }
//     );

//     const { access_token, refresh_token } = tokenRes.data || {};
//     if (!access_token) {
//       throw new Error("No access_token in FYERS response");
//     }

//     const profileRes = await axios.get(`${BASE}/api/v3/profile`, {
//       headers: { Authorization: `Bearer ${access_token}` },
//     });

//     const fyersProfile = profileRes.data || {};
 
//     const fyersId = fyersProfile?.fy_id || fyersProfile?.user_id || fyersProfile?.id || null;
//     const name =
//       fyersProfile?.name ||
//       fyersProfile?.display_name ||
//       "FYERS User";
//     const email =
//       fyersProfile?.email_id ||
//       fyersProfile?.email ||
//       `${fyersId || "fyers"}@fyers.local`;

   
//     let user = await User.findOne({ where: { fyersId } });
//     if (!user) {
//       user = await User.create({
//         firstName: "FYERS",
//         lastName: "User",
//         name,
//         email,
//         password: "dummyPassword123!", 
//         fyersId,
//         fyersAccessToken: access_token,
//         fyersRefreshToken: refresh_token,
//       });
//     } else {
//       user.name = name;
//       user.email = email || user.email;
//       user.fyersAccessToken = access_token;
//       user.fyersRefreshToken = refresh_token;
//       await user.save();
//     }

//     // JWT for your app
//     const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });

   
//     return res.redirect(
//       `${process.env.FRONTEND_URL}/login-success?token=${encodeURIComponent(
//         token
//       )}&user=${encodeURIComponent(JSON.stringify(user))}`
//     );
//   } catch (err) {
//     console.error("FYERS callback error:", err?.response?.data || err.message);
//     return res.redirect(
//       `${process.env.FRONTEND_URL}/login?error=fyers_login_failed`
//     );
//   }
// };





export const sendForgotEmail = async (req, res) => {

  const { email } = req.body;

  try {
    const emailExist = await User.findOne({ where: { email } });

    if(!emailExist) {

      return res.status(400).json({ message: "email is not registered" });

    }

    const resetCode = Math.floor(10000 + Math.random() * 900000).toString();

    emailExist.resetCode = resetCode;

    emailExist.resetCodeExpire = Date.now() + 15 * 60 * 1000;

    await emailExist.save();

    await sendResetMail(email, resetCode);

    return res.status(200).json({ message: "Reset Code Send to Your Email" });

  } catch (error) {

    console.error(error);

    return res.status(500).json({ message: "server error" });
  }
}


export const verifyCode = async (req, res) => {

  const { email, code } = req.body;

  try {

    const user = await User.findOne({ where: { email } });

    if (!user) {

      return res.status(404).json({ message: "Email not registered" });
    }

    if (user.resetCode === code) {

      return res.status(200).json({ message: "Code verified successfully" });

    } else {

      return res.status(400).json({ message: "Invalid or expired code" });

    }
  } catch (error) {

    console.error("Verify code error:", error);

    res.status(500).json({ message: "Internal server error" });
  }
};



export const newPassword = async (req, res) => {
  try {

    const { email, newPassword, confirmPassword } = req.body;

    if(!email || !newPassword || !confirmPassword) {

      return res.status(400).json({ message: "all field are required" });
    }

    if(newPassword !== confirmPassword) {

      return res.status(400).json({ message: "password do not match" });
    }

    const user = await User.findOne({where: { email }});

    if(!user) {

      return res.status(404).json({ message: "user not found" });
    }

    const hashedPassword = await encrypt(existingUser.password, process.env.CRYPTO_SECRET);

    user.password = hashedPassword;

    user.resetCode = null;

    await user.save();

    return res.status(200).json({ message: "password reset successfully" });

  } catch (error) {

    console.error(" new password error", error);

    return res.status(500).json({ message: "internal server error" })

  }
};





// ===================== auth controller end ================================


// ====================== profile controller start ========================

export const profileUpdate = async (req, res) => {
  try {

    const { id, firstName, lastName, email, phoneNumber, bio } = req.body;
    let image;
    if (req.file) {
      image = req.file.filename;
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.update({
      firstName,
      lastName,
      email,
      phoneNumber,
      bio,
      ...(image && { image }),
    });

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const addressUpdate = async (req, res) => {
  try {
    const { id, country, cityOrState, postalCode } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.update({
      country,
      cityOrState,
      postalCode,
    });

    return res.status(200).json({ user, message: "Address updated successfully" });
  } catch (error) {
    console.error("Address update failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updatePassword = async (req, res) => {

  const { currentPassword, newPassword, confirmPassword } = req.body;

  try {

    const existingUser = await User.findByPk(req.userId);

    if (!existingUser) {

      return res.status(404).json({ message: "User not found" });
    }

    const originalPass = await decrypt( existingUser.password,process.env.CRYPTO_SECRET);

    if (originalPass!==currentPassword) {

      return res.status(400).json({ message: "Current password is incorrect" });

    }

    if (newPassword !== confirmPassword) {

      return res.status(400).json({ message: "Passwords do not match" });

    }

    const hashedPassword = await encrypt( newPassword,process.env.CRYPTO_SECRET);

    existingUser.password = hashedPassword;

    await existingUser.save();

    res.status(200).json({ message: "Password changed successfully" });

  } catch (err) {

    console.error("Error in updatePassword:", err);

    res.status(500).json({ message: "Server error", error: err.message });
  }
};



export const testGetAngelOneProfileFund = async function (req,res,next) {
    try {

      let token = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6IkFSSk1BMTkyMSIsInJvbGVzIjowLCJ1c2VydHlwZSI6IlVTRVIiLCJ0b2tlbiI6ImV5SmhiR2NpT2lKU1V6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUoxYzJWeVgzUjVjR1VpT2lKamJHbGxiblFpTENKMGIydGxibDkwZVhCbElqb2lkSEpoWkdWZllXTmpaWE56WDNSdmEyVnVJaXdpWjIxZmFXUWlPalFzSW5OdmRYSmpaU0k2SWpNaUxDSmtaWFpwWTJWZmFXUWlPaUl4WlROa04yWTVZUzAwTkRWaUxUTmtZelV0T1RFeFlTMDJOR1ZtT1RZNE5qQTFZbVFpTENKcmFXUWlPaUowY21Ga1pWOXJaWGxmZGpJaUxDSnZiVzVsYldGdVlXZGxjbWxrSWpvMExDSndjbTlrZFdOMGN5STZleUprWlcxaGRDSTZleUp6ZEdGMGRYTWlPaUpoWTNScGRtVWlmU3dpYldZaU9uc2ljM1JoZEhWeklqb2lZV04wYVhabEluMTlMQ0pwYzNNaU9pSjBjbUZrWlY5c2IyZHBibDl6WlhKMmFXTmxJaXdpYzNWaUlqb2lRVkpLVFVFeE9USXhJaXdpWlhod0lqb3hOell6TVRnM05qTXdMQ0p1WW1ZaU9qRTNOak14TURFd05UQXNJbWxoZENJNk1UYzJNekV3TVRBMU1Dd2lhblJwSWpvaU0yRXpZMk5pWWpBdFlUbGtOaTAwTm1Ga0xUbG1ObUl0WmpKak5EUTVabVkwWXpZM0lpd2lWRzlyWlc0aU9pSWlmUS5weTFNamFRQXg5X0lyTVdqektyVWRPaU9ZZWl4UkxhNmVqbmFqcGprS3luY0VqMDJwUTdrVEFfY3VLc0ZQaVd2cnRWemw5OXhXcW5LLV9iOGItTUtCZXZKQ0dDTEZmcmV2c3VXRnM0amhxWC14VGl6Qm1WODVLTkg0NGR4bFZzQlhpOXVpLXFJc2Q5R1VGX3M5T1FyblMwWE5scW9VRFpjWFNOakRfZThBaUkiLCJBUEktS0VZIjoieUpicm5ua3giLCJYLU9MRC1BUEktS0VZIjp0cnVlLCJpYXQiOjE3NjMxMDEyMzAsImV4cCI6MTc2MzE0NTAwMH0.yzO3Ka-9N0-Ta96mop8yiwLBpASR7AiMEDtPmqYjE4jpSP2GuMWjA3yTXuLP5ey7_m5OHHznuLeZNOnTqESt1A'
    

      var config = {
      method: 'get',
      url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getRMS',

      headers : {
        // 'Authorization': `Bearer ${auth_token}`,
         'Authorization': `Bearer ${token}`,
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

    console.log(data,'test fund');
    


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

export const testGetAngelOneProfile = async function (req,res,next) {
    try {


    let token = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6IkFSSk1BMTkyMSIsInJvbGVzIjowLCJ1c2VydHlwZSI6IlVTRVIiLCJ0b2tlbiI6ImV5SmhiR2NpT2lKU1V6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUoxYzJWeVgzUjVjR1VpT2lKamJHbGxiblFpTENKMGIydGxibDkwZVhCbElqb2lkSEpoWkdWZllXTmpaWE56WDNSdmEyVnVJaXdpWjIxZmFXUWlPalFzSW5OdmRYSmpaU0k2SWpNaUxDSmtaWFpwWTJWZmFXUWlPaUl4WlROa04yWTVZUzAwTkRWaUxUTmtZelV0T1RFeFlTMDJOR1ZtT1RZNE5qQTFZbVFpTENKcmFXUWlPaUowY21Ga1pWOXJaWGxmZGpJaUxDSnZiVzVsYldGdVlXZGxjbWxrSWpvMExDSndjbTlrZFdOMGN5STZleUprWlcxaGRDSTZleUp6ZEdGMGRYTWlPaUpoWTNScGRtVWlmU3dpYldZaU9uc2ljM1JoZEhWeklqb2lZV04wYVhabEluMTlMQ0pwYzNNaU9pSjBjbUZrWlY5c2IyZHBibDl6WlhKMmFXTmxJaXdpYzNWaUlqb2lRVkpLVFVFeE9USXhJaXdpWlhod0lqb3hOell6TVRnM05qTXdMQ0p1WW1ZaU9qRTNOak14TURFd05UQXNJbWxoZENJNk1UYzJNekV3TVRBMU1Dd2lhblJwSWpvaU0yRXpZMk5pWWpBdFlUbGtOaTAwTm1Ga0xUbG1ObUl0WmpKak5EUTVabVkwWXpZM0lpd2lWRzlyWlc0aU9pSWlmUS5weTFNamFRQXg5X0lyTVdqektyVWRPaU9ZZWl4UkxhNmVqbmFqcGprS3luY0VqMDJwUTdrVEFfY3VLc0ZQaVd2cnRWemw5OXhXcW5LLV9iOGItTUtCZXZKQ0dDTEZmcmV2c3VXRnM0amhxWC14VGl6Qm1WODVLTkg0NGR4bFZzQlhpOXVpLXFJc2Q5R1VGX3M5T1FyblMwWE5scW9VRFpjWFNOakRfZThBaUkiLCJBUEktS0VZIjoieUpicm5ua3giLCJYLU9MRC1BUEktS0VZIjp0cnVlLCJpYXQiOjE3NjMxMDEyMzAsImV4cCI6MTc2MzE0NTAwMH0.yzO3Ka-9N0-Ta96mop8yiwLBpASR7AiMEDtPmqYjE4jpSP2GuMWjA3yTXuLP5ey7_m5OHHznuLeZNOnTqESt1A'
     
    var config = {
      method: 'get',
      url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getProfile',
      headers : {
         'Authorization': `Bearer ${token}`,
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


// ====================== profile controller end ==========================
