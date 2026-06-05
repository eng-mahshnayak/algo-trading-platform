import User from '../models/userModel.js';
import AngelOneCredential from "../models/angelOneCredential.js"
import {connectSmartSocket, disconnectUserSocket, isSocketReady} from "../services/smartapiFeed.js"
import UserSession from '../models/userSession.js';
import { decrypt } from "../utils/passwordUtils.js";

// export const getAllUsers = async (req, res) => {
//     try {

//         const users = await User.findAll({
//             where: { role: "user" }, 
//        });

//        const creds = await AngelOneCredential.findAll({ raw: true });

//        const merged = users.map(u => {
//         const cred = creds.find(c => c.userId === u.id);

//         return {
//           ...u,
//           angelCredential: cred
//             ? {
//                 clientId: cred.clientId || "",
//                 totpSecret: cred.totpSecret || "",
//                 password: cred.password || ""
//               }
//             : {
//                 clientId: "",
//                 totpSecret: "",
//                 password: ""
//               }
//         };
//       });

//          console.log(merged,'res hhhhy');

//         return res.status(200).json({
//             status: true,
//             count: users.length,
//             data: merged,
//         });
//     } catch (error) {
        
//       console.log(error);
      
//          return res.json({
//             status: false,
//             statusCode:500,
//             message: "Unexpected error occurred. Please try again.",
//             data:null,
//             error: error.message,
//         });

//     }
// };


export const getAllUsers = async (req, res) => {
  try {
    // 1) सारे users (role = 'user') plain objects के रूप में लाओ
    const users = await User.findAll({
      where: { role: "user" },
      raw: true,
    });

    // 2) हर user का password decrypt करो
    const decryptedUsers = await Promise.all(
      users.map(async (user) => {
       

        const encrypted = user.password;
        

        const plainPassword = await decrypt(encrypted, process.env.CRYPTO_SECRET);

        

        return {
          ...user,                // plain user object
          password: plainPassword // decrypted password
        };
      })
    );

    // 3) AngelOne credentials plain objects में
    const creds = await AngelOneCredential.findAll({ raw: true });

    // 4) users + angel credentials merge
    const merged = decryptedUsers.map((u) => {
      const cred = creds.find((c) => c.userId === u.id);

      return {
        ...u, // u already plain object
        angelCredential: {
          clientId: cred?.clientId || "",
          totpSecret: cred?.totpSecret || "",
          password: cred?.password || "",
        },
      };
    });

    return res.status(200).json({
      status: true,
      count: merged.length,
      data: merged,
    });
  } catch (error) {
   
    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error.message,
    });
  }
};

// export const getAllUsers = async (req, res) => {
//     try {
//         const users = await User.findAll({
//             where: { role: "user" },
//         });

//           // 🔹 IMPORTANT: async map + Promise.all
//             const results = await Promise.all(
//               users.map(async (user) => {
//                 console.log(user.firstName);
        
//                 const encrypted = user.password;
//                 console.log("Encrypted:", encrypted, "Secret:", process.env.CRYPTO_SECRET);
        
//                 // अगर decrypt sync है तो 'await' ज़रूरी नहीं है, लेकिन रहने दो तो भी चलेगा
//                 const plainPassword = await decrypt(encrypted, process.env.CRYPTO_SECRET);
        
//                 console.log("Decrypted:", plainPassword);
        
//                 return {
//                   ...user,          // पूरा user object
//                   password: plainPassword, // decrypted password से replace
//                 };
//               })
//             );


//         const creds = await AngelOneCredential.findAll({ raw: true });

//         // Map users and ensure every user has an angelCredential object
//         const merged = results.map(u => {
//             const cred = creds.find(c => c.userId === u.id);
//             return {
//                 ...u.toJSON(), // Use toJSON() to get plain object from Sequelize instance
//                 angelCredential: {
//                     clientId: cred?.clientId || "",
//                     totpSecret: cred?.totpSecret || "",
//                     password: cred?.password || ""
//                 }
//             };
//         });

//         return res.status(200).json({
//             status: true,
//             count: users.length,
//             data: merged,
//         });
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//             status: false,
//             statusCode: 500,
//             message: "Unexpected error occurred. Please try again.",
//             data: null,
//             error: error.message,
//         });
//     }
// };


export const updateUserProfile = async function (req,res,next) {
    try {

    let { id, firstName, lastName, email, phoneNumber, brokerName } = req.body;

     id = Number(id)
    

    // ✅ 1. Validate inputs
    if (!id) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "User ID is required",
        data: null,
      });
    }

     // ✅ 2. Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "User not found",
        data: null,
      });
    }

    // ✅ 3. Update fields only if provided
    user.firstName = firstName ?? user.firstName;
    user.lastName = lastName ?? user.lastName;
    user.email = email ?? user.email;
    user.phoneNumber = phoneNumber ?? user.phoneNumber;
    user.brokerName = brokerName ?? user.brokerName;
   
    // // ✅ 4. If a file (image) was uploaded using multer
    // if (req.file) {
    //   user.image = req.file.originalname; // or save file path if stored locally/cloud
    // }

    // ✅ 5. Save updated user
    await user.save();


    

    return res.json({
      status: true,
      statusCode: 200,
      message: "Profile updated successfully",
      user,
    });
    

  } catch (error) {

    return res.json({
              status: false,
              data:null,
              statusCode:401,
              message:error.message
          });
  }
}


export const getUserByIdAdminCheckUserDeshboard = async (req, res) => {
  try {

    console.log(req.query.userId,'==========req.query.userId===========');
    

      const user = await User.findByPk(req.query.userId);

    if (!user) {
      return res.json({
        statusCode:404,
        status: false,
        message: "User not found",
      });
    }

    return res.json({
      statusCode:200,
      status: true,
      data: user,
    });

  } catch (error) {

    return res.json({
      status: false,
      statusCode:500,
      message: "Unexpected error occurred. Please try again.",
      error: error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {

    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.json({
        statusCode:404,
        status: false,
        message: "User not found",
      });
    }

    return res.json({
      statusCode:200,
      status: true,
      data: user,
    });

  } catch (error) {

    return res.json({
      status: false,
      statusCode:500,
      message: "Unexpected error occurred. Please try again.",
      error: error.message,
    });
  }
};



export const userLogout = async (req, res) => {
  try {

    //  await User.update( {
    //     angelLoginUser:false,
    //   },
    //   {
    //     where: { id: req.userId },
    //     returning: true, // optional, to get the updated record
    //   }
    // );

    disconnectUserSocket(req.userId)

    // find the latest active session
    const activeSession = await UserSession.findOne({
      where: { userId:req.userId , is_active: true },
      order: [['login_at', 'DESC']],
    });


    if (activeSession) {
     
    // update logout time
    activeSession.logout_at = new Date();
    activeSession.is_active = false;
    await activeSession.save();

    }


    return res.status(200).json({
      status: true,
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Unexpected error occurred. Please try again.",
      error: error.message,
    });
  }
};


export const adminGetUserAngelToken = async (req, res) => {
  try {

  
    const user = await User.findByPk(req.headers.userid);

    if (!user) {
      return res.json({
        statusCode:404,
        status: false,
        message: "User not found",
      });
    }

     let existing = await AngelOneCredential.findOne({ where: { userId: req.headers.userid } });

    if (!existing) {
       return res.json({
      statusCode:200,
      status: true,
      data: user,
    });
    }

     if (isSocketReady( req.headers.userid)) {

            console.log('✅ WebSocket is connected!');

          } else {

              connectSmartSocket( req.headers.userid,user.authToken,user.feedToken,existing.clientId)
          }

    return res.json({
      statusCode:200,
      status: true,
      data: user,
    });

  } catch (error) {

    return res.json({
      status: false,
      statusCode:500,
      message: "Unexpected error occurred. Please try again.",
      error: error.message,
    });
  }
};

export const updateUserPakage = async function (req,res,next) {
    try {

    let { id, ...fieldsToUpdate } = req.body;  // extract id, keep rest

     id = Number(id)
    
    //  1. Validate inputs
    if (!id) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "User ID is required",
        data: null,
      });
    }

     // 2. Find user
    const user = await User.findByPk(id);
    if (!user) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "User not found",
        data: null,
      });
    }

    // ⭐ update all fields dynamically
    await user.update(fieldsToUpdate);
    
    return res.json({
      status: true,
      statusCode: 200,
      message: "Profile updated successfully",
      user,
    });
    

  } catch (error) {

    return res.json({
              status: false,
              data:null,
              statusCode:401,
              message:error.message
          });
  }
}



export const getPopupBoxDyamicCode = async function (req,res,next) { 
  
  
  console.log(req.userId,'=======req.getPopupBoxDyamicCode=============');
  

   const user = await User.findOne({
        where: { id:req.userId },
        raw: true,
      });


       console.log(user,'====user===');
      console.log(user?.popupHtmlContent,'====user?.popupHtmlContent===');
      

  let htmlFromDB = user?.popupHtmlContent

  // Database se HTML fetch karo (yahan hardcoded example)
  // const htmlFromDB = `
  //   <div style="max-width:520px;margin:30px auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 15px 40px rgba(0,0,0,0.12);font-family:Arial,Helvetica,sans-serif;">
  //     <div style="background:linear-gradient(135deg,#0f172a,#2563eb);padding:30px;text-align:center;">
  //       <div style="display:inline-block;background:rgba(255,255,255,0.15);color:#ffffff;padding:6px 14px;border-radius:30px;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">
  //         Limited-Time Access
  //       </div>
  //       <h2 style="margin:15px 0 0;color:#ffffff;font-size:28px;font-weight:700;">
  //         Advanced Tools Available
  //       </h2>
  //     </div>
  //     <div style="padding:30px;">
  //       <p style="margin:0 0 18px;color:#374151;font-size:15px;line-height:1.8;">
  //         We recently completed successful testing of our latest advanced tools, which have delivered excellent results across multiple accounts.
  //       </p>
  //       <p style="margin:0 0 18px;color:#374151;font-size:15px;line-height:1.8;">
  //         These tools are currently <strong>pending activation on your account</strong>. As part of our testing program, access has been provisioned and is ready to be enabled at your request.
  //       </p>
  //       <div style="background:#f8fafc;border-left:4px solid #2563eb;padding:16px 18px;border-radius:8px;margin:20px 0;">
  //         <div style="font-size:13px;color:#64748b;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">
  //           Activation Fee
  //         </div>
  //         <div style="font-size:30px;color:#0f172a;font-weight:700;margin-top:5px;">
  //           ₹51,000
  //         </div>
  //       </div>
  //       <p style="margin:0;color:#6b7280;font-size:14px;line-height:1.7;">
  //         If you would like to activate these tools and start benefiting from the enhanced capabilities, please contact your Relationship Manager.
  //       </p>
  //     </div>
  //   </div>
  // `;

  res.json({
    success: true,
    html: htmlFromDB
  });
}

