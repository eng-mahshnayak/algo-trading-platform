import User from "../models/userModel.js"
import unzipper from "unzipper";
import axios from 'axios'; 
import Order from "../models/orderModel.js"
import { Op } from "sequelize";
import { createHash } from "crypto";
import speakeasy from "speakeasy";
import qs from "qs";
import crypto from "crypto";

const SHOONYA_BASE_URL = "https://api.shoonya.com/NorenWClientTP";

import UserMongodbModel from '../models/userMongodbModel.js' 


import puppeteer from 'puppeteer'; 

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


async function shoonyaLogin123() {
    try {
        const pythonScriptPath = path.join(__dirname, "login.py");
        console.log("Executing Shoonya login...");
        
        const { stdout, stderr } = await execPromise(`python3 "${pythonScriptPath}"`, {
            timeout: 120000,
            maxBuffer: 10 * 1024 * 1024
        });
        
        if (stderr) {
            console.log("Python logs:", stderr);
        }
        
        if (!stdout || stdout.trim() === '') {
            throw new Error("No output from Python script");
        }
        
        console.log("Python output:", stdout);
        const result = JSON.parse(stdout.trim());
        
        if (result.success) {
            console.log("✅ Shoonya Login Successful!");
            console.log("Access Token:", result.accessToken);
            console.log("User ID:", result.userId);
            console.log("Account ID:", result.accountId);
            return result;
        } else {
            console.error("❌ Login Failed:", result.error);
            return null;
        }
    } catch (error) {
        console.error("❌ Error:", error.message);
        if (error.stderr) {
            console.error("Python stderr:", error.stderr);
        }
        return null;
    }
}

// Test the login
async function testLogin() {
    const loginResult = await shoonyaLogin123();
    if (loginResult) {
        console.log("\n🎉 Successfully got access token!");
        console.log("Token:", loginResult.accessToken);
    } else {
        console.log("\n💥 Failed to get access token");
    }
}

// Run test
// testLogin();


// async function shoonyaLogin123() {

//   const CLIENT_ID   = "FN194505";
//   const USER_ID     = "FN194505_U";
//   const PASSWORD    = "Mgn@1997";
//   const TOTP_SECRET = "F3OJ3XZT632FD3C4I6OK67IDRR23IC7V";
//   const SECRET_CODE = "a6o4y5CKbDQzbKFbXLoQ4nyB6QFnRjG3H1cDPGFzXf35aRYiDXPcKLjIHnQHHX98";

//   const LOGIN_URL = `https://trade.shoonya.com/OAuthlogin/authorize/oauth?client_id=${USER_ID}`;
//   const TOKEN_URL = "https://trade.shoonya.com/NorenWClientAPI/GenAcsTok";

//   let browser;

//   try {
//     browser = await puppeteer.launch({
//       headless: "new",
//       args: ["--no-sandbox", "--disable-setuid-sandbox"]
//     });

//     const page = await browser.newPage();

//     // 🔥 CDP SESSION (main magic)
//     const client = await page.target().createCDPSession();
//     await client.send("Network.enable");

//     let authCode = null;

//     // 🔥 capture network like selenium
//     client.on("Network.requestWillBeSent", (params) => {
//       const url = params.request.url;

//       if (url.includes("code=")) {
//         const match = url.match(/code=([^&]+)/);
//         if (match) {
//           authCode = match[1];
//           console.log("✅ Auth Code:", authCode);
//         }
//       }
//     });

//     console.log("🚀 Opening login page...");
//     await page.goto(LOGIN_URL, { waitUntil: "networkidle2" });

//     await page.waitForSelector("input");

//     const inputs = await page.$$("input");

//     // fill login
//     await inputs[0].type(USER_ID, { delay: 50 });
//     await inputs[1].type(PASSWORD, { delay: 50 });

//     const otp = speakeasy.totp({
//       secret: TOTP_SECRET,
//       encoding: "base32"
//     });

//     console.log("🔐 OTP:", otp);

//     await inputs[2].type(otp, { delay: 50 });

//     await page.keyboard.press("Enter");

//     console.log("⏳ Waiting for auth code...");

//     const start = Date.now();

//     while (!authCode && Date.now() - start < 60000) {
//       await new Promise(r => setTimeout(r, 500));
//     }

//     if (!authCode) {
//       await page.screenshot({ path: "fail.png" });
//       throw new Error("Auth code not received");
//     }

//     console.log("✅ FINAL AUTH CODE:", authCode);

//     // 🔥 TOKEN CALL
//     const checksum = crypto
//       .createHash("sha256")
//       .update(authCode + CLIENT_ID + SECRET_CODE)
//       .digest("hex");

//     const jData = {
//       code: authCode,
//       secret_key: SECRET_CODE,
//       api_key: CLIENT_ID,
//       uid: USER_ID,
//       checksum
//     };

//     const body = `jData=${JSON.stringify(jData)}&jKey=`;

//     const res = await axios.post(TOKEN_URL, body, {
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded"
//       }
//     });

//     console.log("🎯 Token:", res.data);

//     return { success: true, data: res.data };

//   } catch (err) {
//     console.log("❌ Login Failed:", err.message);
//     return { success: false, error: err.message };
//   } finally {
//     if (browser) await browser.close();
//   }
// }

// // 🔥 test
// (async () => {
//   const result = await shoonyaLogin123();
//   console.log("FINAL RESULT:", result);
// })();


// import puppeteer from 'puppeteer'; 

// // Fixed and working Shoonya login function with proper autofill
// async function shoonyaLoginNew() {
//   const CLIENT_ID   = "FN194505";
//   const USER_ID     = "FN194505_U";
//   const PASSWORD    = "Mgn@1997";
//   const TOTP_SECRET = "F3OJ3XZT632FD3C4I6OK67IDRR23IC7V";
//   const SECRET_CODE = "a6o4y5CKbDQzbKFbXLoQ4nyB6QFnRjG3H1cDPGFzXf35aRYiDXPcKLjIHnQHHX98";

//   const LOGIN_URL = `https://trade.shoonya.com/OAuthlogin/authorize/oauth?client_id=${USER_ID}`;
//   const TOKEN_URL = "https://trade.shoonya.com/NorenWClientAPI/GenAcsTok";

//   let browser;

//   try {
//     browser = await puppeteer.launch({
//       headless: false,
//       args: [
//         "--no-sandbox", 
//         "--disable-setuid-sandbox",
//         "--disable-dev-shm-usage",
//         "--window-size=1920,1080",
//         "--start-maximized"
//       ],
//       defaultViewport: null
//     });

//     const page = await browser.newPage();
    
//     let authCode = null;

//     // Capture auth code from URL changes
//     page.on('framenavigated', async (frame) => {
//       const url = frame.url();
//       if (url.includes('code=')) {
//         const match = url.match(/code=([^&]+)/);
//         if (match && match[1]) {
//           authCode = match[1];
//           console.log("✅ Auth code captured from navigation:", authCode);
//         }
//       }
//     });

//     console.log("Opening login page...");
//     await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    
//     // Wait for page to fully load
//     await page.waitForSelector('body', { timeout: 10000 });
//     await new Promise(resolve => setTimeout(resolve, 2000));

//     // Fill User ID
//     console.log("Attempting to fill form using direct selectors...");
    
//     const userIdFilled = await page.evaluate((userId) => {
//       const selectors = [
//         'input[name="uid"]',
//         'input[name="userid"]',
//         'input[name="username"]',
//         'input[name="userId"]',
//         'input[placeholder*="User"]',
//         'input[placeholder*="ID"]',
//         'input[type="text"]:first-of-type',
//         '#username',
//         '#userid'
//       ];
      
//       for (let selector of selectors) {
//         const field = document.querySelector(selector);
//         if (field && field.type !== 'password') {
//           field.value = userId;
//           field.dispatchEvent(new Event('input', { bubbles: true }));
//           field.dispatchEvent(new Event('change', { bubbles: true }));
//           console.log(`Filled user ID using selector: ${selector}`);
//           return true;
//         }
//       }
//       return false;
//     }, USER_ID);
    
//     if (userIdFilled) {
//       console.log("✅ User ID filled successfully");
//     } else {
//       console.log("⚠️ Could not find User ID field");
//     }
    
//     // Fill Password
//     const passwordFilled = await page.evaluate((password) => {
//       const selectors = [
//         'input[type="password"]',
//         'input[name="password"]',
//         'input[name="pwd"]',
//         'input[name="pass"]',
//         '#password',
//         '#pwd'
//       ];
      
//       for (let selector of selectors) {
//         const field = document.querySelector(selector);
//         if (field && field.type === 'password') {
//           field.value = password;
//           field.dispatchEvent(new Event('input', { bubbles: true }));
//           field.dispatchEvent(new Event('change', { bubbles: true }));
//           console.log(`Filled password using selector: ${selector}`);
//           return true;
//         }
//       }
//       return false;
//     }, PASSWORD);
    
//     if (passwordFilled) {
//       console.log("✅ Password filled successfully");
//     } else {
//       console.log("⚠️ Could not find Password field");
//     }
    
//     // Generate OTP
//     const otp = speakeasy.totp({
//       secret: TOTP_SECRET,
//       encoding: "base32",
//       step: 30,
//       window: 1
//     });
    
//     console.log("Generated OTP:", otp);
    
//     // Fill OTP
//     const otpFilled = await page.evaluate((otp) => {
//       const selectors = [
//         'input[placeholder*="OTP"]',
//         'input[placeholder*="otp"]',
//         'input[placeholder*="code"]',
//         'input[name="otp"]',
//         'input[name="code"]',
//         'input[type="text"]:last-of-type',
//         '#otp',
//         '#code'
//       ];
      
//       for (let selector of selectors) {
//         const field = document.querySelector(selector);
//         if (field && field.type !== 'password') {
//           field.value = otp;
//           field.dispatchEvent(new Event('input', { bubbles: true }));
//           field.dispatchEvent(new Event('change', { bubbles: true }));
//           console.log(`Filled OTP using selector: ${selector}`);
//           return true;
//         }
//       }
//       return false;
//     }, otp);
    
//     if (otpFilled) {
//       console.log("✅ OTP filled successfully");
//     } else {
//       console.log("⚠️ Could not find OTP field");
//     }
    
//     // Click login button
//     console.log("Looking for login button...");
    
//     const loginClicked = await page.evaluate(() => {
//       const allButtons = Array.from(document.querySelectorAll('button, input[type="submit"]'));
//       let loginBtn = allButtons.find(btn => {
//         const text = (btn.innerText || btn.value || '').toUpperCase();
//         return text.includes('LOGIN') || text.includes('SIGN IN');
//       });
      
//       if (loginBtn) {
//         loginBtn.scrollIntoView();
//         loginBtn.click();
//         return true;
//       }
//       return false;
//     });
    
//     if (!loginClicked) {
//       console.log("Attempting to press Enter on last field...");
//       await page.keyboard.press('Enter');
//     } else {
//       console.log("✅ Login button clicked");
//     }
    
//     console.log("Waiting for auth code after login...");
    
//     // Wait for auth code
//     const startTime = Date.now();
//     const timeout = 60000;
    
//     while (!authCode && (Date.now() - startTime) < timeout) {
//       await new Promise(resolve => setTimeout(resolve, 1000));
      
//       const currentUrl = page.url();
//       if (currentUrl.includes('code=')) {
//         const match = currentUrl.match(/code=([^&]+)/);
//         if (match && match[1]) {
//           authCode = match[1];
//           console.log("✅ Auth code found in URL:", authCode);
//           break;
//         }
//       }
      
//       if ((Date.now() - startTime) % 10000 === 0) {
//         console.log(`Still waiting for auth code... ${Math.floor((Date.now() - startTime)/1000)}s elapsed`);
//       }
//     }
    
//     if (!authCode) {
//       await page.screenshot({ path: 'login-debug.png' });
//       console.log("📸 Screenshot saved as login-debug.png");
//       throw new Error("Auth code not captured within timeout period");
//     }
    
//     console.log("✅ Final Auth Code:", authCode);
    
//     // Get Access Token - FIXED FORMAT FOR SHOONYA API
//     console.log("Requesting access token...");

//     const checksum = crypto
//   .createHash("sha256")
//   .update(authCode + CLIENT_ID + SECRET_CODE)
//   .digest("hex");
    
 
// // ✅ FIXED KEYS
// const jDataObj = {
//   code: authCode,
//   secret_key: SECRET_CODE,   // 🔥 FIX
//   api_key: CLIENT_ID,
//   uid: USER_ID ,              // 🔥 FIX
//     checksum: checksum   // 🔥 MUST

// };



//  console.log("jDataObj...");

// // ❗ IMPORTANT: NO encodeURIComponent here
// const body = `jData=${JSON.stringify(jDataObj)}&jKey=`;

//  console.log("body...");

// // ✅ API call
// const tokenResponse = await axios.post(
//   TOKEN_URL,
//   body,
//   {
//     headers: {
//       "Content-Type": "application/x-www-form-urlencoded"
//     }
//   }
// );

// console.log("Token Response:", tokenResponse.data);
      
//       if (tokenResponse.data && tokenResponse.data.stat === "Ok") {
//         console.log("✅ Access token obtained successfully!");
//         return {
//           success: true,
//           authCode: authCode,
//           accessToken: tokenResponse.data.accesstoken,
//           refreshToken: tokenResponse.data.refreshtoken,
//           userId: tokenResponse.data.userid,
//           accountId: tokenResponse.data.actid,
//           fullResponse: tokenResponse.data
//         };
//       } else {
//         throw new Error(`Token API error: ${JSON.stringify(tokenResponse.data)}`);
//       }
//     } catch (error) {
//       console.log("First format failed, trying alternative...",error);
      
//       // Method 2: Try without jData wrapper but as plain object
//       const altRequestData = {
//         code: authCode,
//         Secret_Code: SECRET_CODE,
//         api_key: CLIENT_ID,
//         UID: USER_ID,
//         grant_type: "authorization_code"
//       };
      
//       const tokenResponse2 = await axios.post(
//         TOKEN_URL,
//         altRequestData,
//         {
//           headers: {
//             "Content-Type": "application/json"
//           },
//           timeout: 30000
//         }
//       );
      
//       if (tokenResponse2.data && tokenResponse2.data.stat === "Ok") {
//         console.log("✅ Access token obtained with alternative format!");
//         return {
//           success: true,
//           authCode: authCode,
//           accessToken: tokenResponse2.data.accesstoken,
//           refreshToken: tokenResponse2.data.refreshtoken,
//           userId: tokenResponse2.data.userid,
//           accountId: tokenResponse2.data.actid,
//           fullResponse: tokenResponse2.data
//         };
//       } else {
//         throw new Error(`Token API error: ${JSON.stringify(tokenResponse2.data)}`);
//       }
//     }
    
  
// }

// // Test function
// async function testLogin() {
//   console.log("Starting Shoonya login test...");
//   const result = await shoonyaLoginNew();
  
//   if (result.success) {
//     console.log("\n✅ Login Successful!");
//     console.log("==================");
//     console.log("Access Token:", result.accessToken);
//     console.log("Refresh Token:", result.refreshToken);
//     console.log("User ID:", result.userId);
//     console.log("Account ID:", result.accountId);
//   } else {
//     console.log("\n❌ Login Failed!");
//     console.log("Error:", result.error);
//     if (result.details) {
//       console.log("Details:", result.details);
//     }
//   }
  
//   return result;
// }

// // Run test
// testLogin();


// ==========running code==================



export const shoonyaLoginWithTotp121 = async (req, res) => {
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

    // 6️⃣ POST request to Shoonya QuickAuth
    const jData = `jData=${JSON.stringify(loginPayload)}`;

    const response = await axios.post(
      "https://api.shoonya.com/NorenWClientTP/QuickAuth",
      jData,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const data = response.data;

    // 7️⃣ Handle errors
    if (data.stat !== "Ok") {

      console.log(data.emsg ,'======data.emsg ========');
      
      return res.status(400).json({
        status: false,
        message: data.emsg || "Shoonya login failed",
        data,
      });
    }

    // 8️⃣ Save susertoken to DB
   let updateUser =  await User.update(
      { 
        authToken: data.susertoken,
        angelLoginUser:true,
        angelLoginExpiry:new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours

       },
      { where: { id: req.userId} }
    );



    //------------------------------------------------
    // ✅ 1. Find user in Postgre
    //------------------------------------------------
    const postgreUser = await User.findByPk(req.userId, { raw: true });

    if (!postgreUser) {
          console.log("❌ User not found in Postgre");
        
    }

    //------------------------------------------------
    // ✅ TOKENS
    //------------------------------------------------
    
    const tokens = {
      authToken: postgreUser.authToken,
      feedToken:  postgreUser?.feedToken||"",
      refreshToken: postgreUser?.refreshToken||"",
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

export const shoonyaLoginWithTotp5151 = async (req, res) => {
  try {

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
    const password = user.kite_pin;        // Shoonya password
    const totpSecret = user.kite_secret;   // Shoonya TOTP Base32 secret
   const apiKey = user.kite_key;

    if (!uid || !password || !totpSecret) {
      return res.status(400).json({
        status: false,
        message: "Shoonya credentials missing in user profile",
      });
    }

   
    

    // 3️⃣ Compute SHA-256 hashed password (Shoonya requirement)
    const pwdHash = createHash("sha256").update(password).digest("hex");

    // 4️⃣ Compute Shoonya appkey (uid|apiKey)
 
    const appkeyRaw = `${uid}|${apiKey}`;
    const appkey = createHash("sha256").update(appkeyRaw).digest("hex");

    const vc = user.finavacia_vendor_code;
    const imei = user.finavacia_imei;

     // 2️⃣ Generate 6-digit TOTP from Base32 secret
    const factor2 = speakeasy.totp({
      secret: totpSecret,
      encoding: "base32",
      digits: 6,
       step: 30,
    });


    console.log('topt code : ',factor2);

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

    // 6️⃣ POST request to Shoonya QuickAuth
    // const jData = `jData=${JSON.stringify(loginPayload)}`;

    const jData =  qs.stringify({
  jData: JSON.stringify(loginPayload)
});

     console.log('==============finavasia  before fund after login=================');

     
    const response = await axios.post(
      // "https://api.shoonya.com/NorenWClientTP/QuickAuth",
       "https://trade.shoonya.com/OAuthlogin/NorenWClientTP/QuickAuth",
      jData,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" },
     timeout: 15000 // Add timeout
      }
    );

    const data = response.data;


    console.log(data,'====================data login=================');
    

    // 7️⃣ Handle errors
    if (data.stat !== "Ok") {
      console.log(data.emsg ,'======data.emsg ========');
      
      return res.status(400).json({
        status: false,
        message: data.emsg || "Shoonya login failed",
        data,
      });
    }

    // ========== 8️⃣ FETCH FUND DETAILS ==========
    let dematFund = 0;
    try {
      const fundUrl = `${SHOONYA_BASE_URL}/Limits`;
      
      const fundJData = {
        uid: uid,
        actid: uid,
      };

      const fundBody = `jKey=${data.susertoken}&jData=${JSON.stringify(fundJData)}`;

        console.log('==============finavasia  before fund after login=================');

      const fundResponse = await axios.post(fundUrl, fundBody, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const fundData = fundResponse?.data;

      console.log(fundData, 'finavasia fund after login');

      if (fundData && fundData.stat === "Ok") {
        // Calculate available balance
        const availableBalance = Number(fundData?.cash || 0) + 
                                 Number(fundData?.payin || 0) - 
                                 Number(fundData?.marginused || 0);
        
        dematFund = availableBalance > 0 ? availableBalance : 0;
        
        console.log("✅ Finvasia fund fetched successfully:", dematFund);
      }
    } catch (fundError) {
      console.error("❌ Failed to fetch Finvasia fund details:", fundError.message);
      // Continue with login even if fund fetch fails
    }

    // ========== 9️⃣ UPDATE POSTGRES USER ==========
    let updateUser = await User.update(
      { 
        authToken: data.susertoken,
        angelLoginUser: true,
        angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours
        DematFund: dematFund, // Update demat fund
      },
      { where: { id: req.userId } }
    );

    // ========== 🔟 GET UPDATED POSTGRE USER ==========
    const postgreUser = await User.findByPk(req.userId, { raw: true });

    if (!postgreUser) {
      console.log("❌ User not found in Postgre");
    }

    // ========== 1️⃣1️⃣ TOKENS OBJECT ==========
    const tokens = {
      authToken: postgreUser.authToken,
      feedToken: postgreUser?.feedToken || "",
      refreshToken: postgreUser?.refreshToken || "",
      userToken: postgreUser.userToken,
    };

    // ========== 1️⃣2️⃣ MONGO UPSERT ==========
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
      { postgreId: user.id },
      {
        $set: {
          ...tokens,
          angelLoginUser: true,
          angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000),
          dematFund: dematFund, // Update demat fund in MongoDB
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

    // ========== 1️⃣3️⃣ RETURN SUCCESS RESPONSE WITH FUND ==========
    return res.json({
      status: true,
      brokerName: 'finvasia',
      message: "Shoonya login successful",
      token: data.susertoken,
      actid: data.actid,
      username: data.uname,
      dematFund: dematFund, // Include fund in response
    });

  } catch (err) {
    console.error("Shoonya login error:",  err.response);
    return res.status(500).json({
      status: false,
      message: "Unexpected error during Shoonya login",
      error: err.message,
    });
  }
};



export const shoonyaLoginWithTotp = async (req, res) => {
  try {
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


    console.log("======================finavasia===================");
    

    // Extract values from user table
    const uid = user.kite_client_id; // Shoonya Login ID
    const password = user.kite_pin; // Shoonya password
    const totpSecret = user.kite_secret; // Shoonya TOTP Base32 secret
    const apiKey = user.kite_key;

    if (!uid || !password || !totpSecret) {
      return res.status(400).json({
        status: false,
        message: "Shoonya credentials missing in user profile",
      });
    }

    // 2️⃣ Compute SHA-256 hashed password (Shoonya requirement)
    const pwdHash = createHash("sha256").update(password).digest("hex");

    // 3️⃣ Compute Shoonya appkey (uid|apiKey)
    const appkeyRaw = `${uid}|${apiKey}`;
    const appkey = createHash("sha256").update(appkeyRaw).digest("hex");

    const vc = user.finavacia_vendor_code;
    const imei = user.finavacia_imei;

    // 4️⃣ Generate 6-digit TOTP from Base32 secret
    const factor2 = speakeasy.totp({
      secret: totpSecret,
      encoding: "base32",
      digits: 6,
      step: 30,
    });

    console.log('TOTP code:', factor2);

    // 5️⃣ Create payload for QuickAuth
    const loginPayload = {
      apkversion: "1.0.0",
      uid: uid,
      pwd: pwdHash,
      factor2: factor2,
      vc: vc,
      imei: imei,
      source: "API",
      appkey: appkey,
    };

    // 6️⃣ Try multiple endpoints and formats
    let response;
    let data;

    // Strategy 1: Try trade.shoonya.com OAuth endpoint with form-urlencoded
    try {
      const jData = qs.stringify({
        jData: JSON.stringify(loginPayload)
      });

      console.log('Attempting login with trade.shoonya.com endpoint...');
      response = await axios.post(
        "https://trade.shoonya.com/OAuthlogin/NorenWClientTP/QuickAuth",
        jData,
        {
          headers: { 
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json"
          },
          timeout: 15000
        }
      );
      data = response.data;
    } catch (err) {
      console.log('First endpoint failed, trying alternative...');
      
      // Strategy 2: Try api.shoonya.com with JSON format
      try {
        response = await axios.post(
          "https://api.shoonya.com/NorenWClientTP/QuickAuth",
          loginPayload, // Direct JSON, no jData wrapper
          {
            headers: { 
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            timeout: 15000
          }
        );
        data = response.data;
      } catch (err2) {
        // Strategy 3: Try with GET method
        console.log('Second endpoint failed, trying GET method...');
        response = await axios.get(
          "https://api.shoonya.com/NorenWClientTP/QuickAuth",
          {
            params: { jData: JSON.stringify(loginPayload) },
            headers: {
              "Accept": "application/json"
            },
            timeout: 15000
          }
        );
        data = response.data;
      }
    }

    console.log('Login response:', JSON.stringify(data, null, 2));

    // 7️⃣ Handle errors
    if (data.stat !== "Ok") {
      console.log('Login error message:', data.emsg);
      
      return res.status(400).json({
        status: false,
        message: data.emsg || "Shoonya login failed",
        data: data,
      });
    }

    console.log('✅ Login successful!');

    // ========== 8️⃣ FETCH FUND DETAILS ==========
    let dematFund = 0;
    try {
      const fundUrl = `${SHOONYA_BASE_URL}/Limits`;
      
      const fundJData = {
        uid: uid,
        actid: uid,
      };

      const fundBody = `jKey=${data.susertoken}&jData=${JSON.stringify(fundJData)}`;

      console.log('Fetching fund details...');
      
      const fundResponse = await axios.post(fundUrl, fundBody, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 15000
      });

      const fundData = fundResponse?.data;
      console.log('Fund response:', fundData);

      if (fundData && fundData.stat === "Ok") {
        // Calculate available balance
        const availableBalance = Number(fundData?.cash || 0) + 
                                 Number(fundData?.payin || 0) - 
                                 Number(fundData?.marginused || 0);
        
        dematFund = availableBalance > 0 ? availableBalance : 0;
        
        console.log("✅ Finvasia fund fetched successfully:", dematFund);
      } else {
        console.log("⚠️ Fund fetch returned non-OK status:", fundData?.stat);
      }
    } catch (fundError) {
      console.error("❌ Failed to fetch Finvasia fund details:", fundError.message);
      if (fundError.response) {
        console.error("Fund error response:", fundError.response.data);
      }
      // Continue with login even if fund fetch fails
    }

    // ========== 9️⃣ UPDATE POSTGRES USER ==========
    await User.update(
      { 
        authToken: data.susertoken,
        angelLoginUser: true,
        angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours
        DematFund: dematFund,
      },
      { where: { id: req.userId } }
    );

    // ========== 🔟 GET UPDATED POSTGRES USER ==========
    const postgreUser = await User.findByPk(req.userId, { raw: true });

    if (!postgreUser) {
      console.log("❌ User not found in Postgres");
      return res.status(404).json({
        status: false,
        message: "User not found after update",
      });
    }

    // ========== 1️⃣1️⃣ TOKENS OBJECT ==========
    const tokens = {
      authToken: postgreUser.authToken,
      feedToken: postgreUser?.feedToken || "",
      refreshToken: postgreUser?.refreshToken || "",
      userToken: postgreUser.userToken,
    };

    // ========== 1️⃣2️⃣ MONGO UPSERT ==========
    // Create a copy without sensitive/token fields
    const mongoUserData = { ...postgreUser };
    delete mongoUserData.authToken;
    delete mongoUserData.feedToken;
    delete mongoUserData.refreshToken;
    delete mongoUserData.userToken;
    delete mongoUserData.angelLoginUser;
    delete mongoUserData.angelLoginExpiry;
    delete mongoUserData.dematFund;
    delete mongoUserData.updatedAt;

    await UserMongodbModel.findOneAndUpdate(
      { postgreId: user.id },
      {
        $set: {
          ...tokens,
          angelLoginUser: true,
          angelLoginExpiry: new Date(Date.now() + 10 * 60 * 60 * 1000),
          dematFund: dematFund,
          lastLoginAt: new Date(),
        },
        $setOnInsert: {
          ...mongoUserData,
          postgreId: user.id,
          createdAt: new Date(),
        }
      },
      {
        upsert: true,
        new: true,
      }
    );

    // ========== 1️⃣3️⃣ RETURN SUCCESS RESPONSE WITH FUND ==========
    return res.json({
      status: true,
      brokerName: 'finvasia',
      message: "Shoonya login successful",
      token: data.susertoken,
      actid: data.actid,
      username: data.uname,
      dematFund: dematFund,
    });

  } catch (err) {
    console.error("Shoonya login error:", err.message);
    if (err.response) {
      console.error("Error response status:", err.response.status);
      console.error("Error response data:", err.response.data);
      console.error("Error response headers:", err.response.headers);
    }
    
    return res.status(500).json({
      status: false,
      message: "Unexpected error during Shoonya login",
      error: err.message,
    });
  }
};


export const shoonyaGenerateAccessToken = async (req, res) => {
  try {
    // 1️⃣ Code URL parameter se milega (redirect URL se)
    const  code  = 'LRQpRyzIzmOrzyKixL70L7Gmfyqz8zqNCmzIBNr5hLnfYYyf04r0qqinX0yB49n0'
    
    if (!code) {
      return res.status(400).json({
        status: false,
        message: "Code parameter is required",
      });
    }

    // 2️⃣ Database se user credentials fetch karo
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

    const appKey = user.kite_key;      // Shoonya API Key (app key)
    const secretKey = user.kite_secret; // Shoonya Secret Key
    const uid = user.kite_client_id;

    if (!appKey || !secretKey) {
      return res.status(400).json({
        status: false,
        message: "API Key or Secret Key missing",
      });
    }

    // 3️⃣ Generate checksum: SHA256(appKey + secretKey + code)
    const checksumRaw = `${appKey}${secretKey}${code}`;
    const checksum = crypto.createHash("sha256").update(checksumRaw).digest("hex");

    console.log("Generated checksum:", checksum);
    console.log("Code received:", code);

    // 4️⃣ Create payload for GenAcsTok
    const payload = {
      code: code,
      checksum: checksum,
    };

    const jData = `jData=${JSON.stringify(payload)}`;

    // 5️⃣ POST request to Shoonya GenAcsTok
    const response = await axios.post(
      "https://api.shoonya.com/NorenWClientTP/GenAcsTok",
      jData,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const data = response.data;

    console.log("GenAcsTok response:", data);

    // 6️⃣ Handle errors
    if (data.stat !== "Ok") {
      return res.status(400).json({
        status: false,
        message: data.emsg || "Failed to generate access token",
        data: data,
      });
    }

    // 7️⃣ Save tokens to database
    await User.update(
      {
        authToken: data.access_token,
        refreshToken: data.refresh_token,
        userToken: data.access_token,
        angelLoginUser: true,
        angelLoginExpiry: new Date(Date.now() + data.expires_in * 1000), // expires_in is in seconds
      },
      { where: { id: req.userId } }
    );

    // 8️⃣ Return success response
    return res.json({
      status: true,
      brokerName: "finvasia",
      message: "Access token generated successfully",
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    });
  } catch (err) {
    console.error("GenAcsTok error:", err.message);
    return res.status(500).json({
      status: false,
      message: "Unexpected error during token generation",
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

export const getFinvasiaAppCredential = async (req, res) => {
  try {
    const userId = req.userId; // set by auth middleware

    if (!userId) {
      return res.json({
        status: false,
        statusCode: 400,
        message: "Unauthorized: userId missing",
      });
    }

    // 1️⃣ Find user
    const user = await User.findByPk(userId);

    if (!user) {
      return res.json({
        status: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    // 2️⃣ Build response object
    const data = {
      clientId: user.kite_client_id || "",  // API key entered in form 1st
      totpSecret: user.kite_secret || "",  // Secret
      apiKey: user.kite_key || "",         // UID (login id)
      pin: user.kite_pin || "",            // PIN/Pwd
      imei: user.finavacia_imei || "",
      vc: user.finavacia_vendor_code || "",
    };

    const isEmpty =
      !data.clientId && !data.totpSecret && !data.apiKey && !data.pin &&
      !data.imei && !data.vc;

    return res.json({
      status: true,
      statusCode: 200,
      message: isEmpty
        ? "No Finvasia credential found"
        : "Finvasia credential loaded successfully",
      data,
    });
  } catch (error) {
    console.error("getFinavasiaAppCredential error:", error);

    return res.json({
      status: false,
      statusCode: 500,
      message: "Failed to fetch Finvasia (Shoonya) credentials",
      error: error.message,
    });
  }
};




export const getFinvasiaTradesDataUserPosition = async function (req, res) {
  try {

    const userId = req.userId; // assuming middleware se aa raha hai

    let userData = await User.findOne({
      where:{
        id:userId
      },
      raw:true
    })

    const uid = userData.kite_client_id; // Finvasia UID

    let finvasiaToken = userData.authToken
    
    const BASE_URL = process.env.SHOONYA_BASE_URL;

    /* -------------------------------
       COMMON API CALL HELPER
    --------------------------------*/
    const callShoonyaAPI = async (endpoint, payload) => {

        const body = `jKey=${finvasiaToken}&jData=${JSON.stringify({
          uid,
          actid: uid,
        })}`;

      const res = await axios.post(`${BASE_URL}/${endpoint}`, body, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      return res.data;
    };

    /* -------------------------------
       FETCH POSITIONS / ORDERS / TRADES
    --------------------------------*/
    const positionsRes = await callShoonyaAPI("PositionBook", {
      uid,
      actid: uid,
    });

    const ordersRes = await callShoonyaAPI("OrderBook", {
      uid,
    });

    const tradesRes = await callShoonyaAPI("TradeBook", {
      uid,
    });

    let positions = Array.isArray(positionsRes) ? positionsRes : [];
    const orders = Array.isArray(ordersRes) ? ordersRes : [];
    let trades = Array.isArray(tradesRes) ? tradesRes : [];


      const now = new Date();

      // IST time nikalna
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // 3:20 PM ke baad condition
      const isAfter320 =
        hours > 15 || (hours === 15 && minutes >= 20);

        positions = isAfter320 ? [] : positions;

    if (!positions.length) {
      return res.json({
        status: true,
        statusCode: 200,
        message: "No Trade in User Position",
        onlineTrades: [],
        error: null,
      });
    }    

    /* -------------------------------
       BUILD ORDER → TRADE MAP
    --------------------------------*/
    const tradeMap = {};
    for (const t of trades) {
      if (!tradeMap[t.orderno]) {
        tradeMap[t.orderno] = t;
      }
    }

    /* -------------------------------
       MAP POSITIONS
    --------------------------------*/
    const mappedTrades = [];

    for (const p of positions) {
      const netQty = Number(p.netqty || 0);
      if (netQty === 0) continue;

      const quantity = Math.abs(netQty);
      const transaction_type = netQty > 0 ? "BUY" : "SELL";

      const matchedOrder = orders.find(
        (o) =>
          o.tsym === p.tsym &&
          o.trantype === transaction_type &&
          o.status === "COMPLETE"
      );

      const matchedTrade = matchedOrder
        ? tradeMap[matchedOrder.orderno]
        : null;

      mappedTrades.push({
        tradingsymbol: p.tsym || "-",
        exchange: p.exch || "-",
        transaction_type,
        product: p.prd || "-",
        average_price: Number(p.netavgprc || 0),
        quantity,
        order_id: matchedOrder?.orderno || "",
        trade_id: matchedTrade?.tradeid || "",
        uniqueorderid: matchedOrder?.orderno || "",
        transactiontype: transaction_type,
        ordertype: matchedOrder?.prctyp || "MARKET",
        producttype: p.prd || "-",
        fillprice: String(p.netavgprc || ""),
        price: String(p.netavgprc || ""),
        pnl: String(p.pnl || ""),
        cmp: String(p.ltp || ""),
        fillsize: quantity,
        orderid: matchedOrder?.orderno || "",
        status: "COMPLETE",
        instrumenttype: p.instname || "",
        orderstatus: matchedOrder?.status || "COMPLETE",
        text: "",
        updatetime:
          matchedTrade?.norentm ||
          matchedOrder?.exch_tm ||
          "",

        symboltoken: String(p.token || ""),
        createdAt: null,
        updatedAt: null,
      });
    }

    return res.json({
      status: true,
      statusCode: 200,
      message: "User Position Trades (Finvasia)",
      onlineTrades: mappedTrades,
    });
  } catch (error) {
    console.error("Finvasia Dashboard error:", error);
    return res.json({
      status: false,
      statusCode: 500,
      message: "Internal server error",
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
    // const body = `jKey=${susertoken}&jData=${JSON.stringify(jData)}`;
   const body = `jKey=${user.authToken}&jData=${JSON.stringify(jData)}`;

    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = response?.data;

    console.log(data,'finavasia fund');
    

    if (!data || data.stat !== "Ok") {
      return res.status(400).json({
        status: false,
        message: data?.emsg || "Unable to fetch funds",
        raw: data,
      });
    }

  // const availableBalance =
  // Number(data.mr_eqt_a || 0) +
  // Number(data.mr_der_a || 0);
  //   console.log(availableBalance)

  // const availableBalance = Number(data?.cash || 0) + Number(data?.payin || 0)
  
  const availableBalance =
  Number(data?.cash || 0)+Number(data?.payin || 0) - Number(data?.marginused || 0);

  let cashFund = {
  availablecash:   availableBalance  
};

    return res.json({
      status: true,
      message: "Funds (Limits) fetched successfully",
      // data: cashFund,
      data:cashFund
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







export const getShoonyaUserHolding = async (req, res) => {
  try {
    const token = req.headers.angelonetoken;

    // if (!token) {
    //   return res.json({
    //     status: false,
    //     statusCode: 401,
    //     message: "Finavasia access token missing in header ",
    //     error: null,
    //   });
    // }

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

     const uid = 'FN169676'
     const susertoken = "bd891d999db82152011ef31d99cddc3054d07d96b51d525e2f0cdcb3f66df310"


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
    

     let orderDetails = data.find((o) => String(o.norenordno) === '25121500600217');

     console.log("Finvasia orders raw:", orderDetails);

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
   
     const uid = 'FN169676'
     const susertoken = "b52d7d821bfdfef87e4e8cea09756353a78789e37d73222126c21136b1911f6f"

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

export const getShoonyaHoldings = async (req, res) => {
  try {
    const uid = "FN169676";
    const susertoken = "bd891d999db82152011ef31d99cddc3054d07d96b51d525e2f0cdcb3f66df310";
    const actid = uid;

    if (!uid || !actid || !susertoken) {
      return res.status(400).json({
        status: false,
        message: "uid, actid and susertoken are required",
      });
    }

    const url = `${SHOONYA_BASE_URL}/Holdings`;

    const jData = {
      uid,
      actid,
      prd: "C",    // 👈 MANDATORY FIELD FOR HOLDINGS
    };

    const body = `jKey=${susertoken}&jData=${JSON.stringify(jData)}`;

    console.log("Shoonya /Holdings body =>", body);

    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = response?.data;
    console.log("Finvasia holdings raw:", data);

    if (!data) {
      return res.status(400).json({
        status: false,
        message: "No response from Shoonya Holdings",
      });
    }

    if (!Array.isArray(data) && data.stat && data.stat !== "Ok") {
      return res.status(400).json({
        status: false,
        message: data?.emsg || "Unable to fetch holdings",
        raw: data,
      });
    }

    const holdings = Array.isArray(data) ? data : data?.holdingdata || [];

    return res.json({
      status: true,
      message: "Holdings fetched successfully",
      count: holdings.length,
      holdings,
      raw: data,
    });
  } catch (error) {
    console.error("Shoonya Holdings Error:", error?.response?.data || error);

    return res.status(500).json({
      status: false,
      message: "Shoonya holdings fetch failed",
      error: error?.response?.data || error.message,
    });
  }
};


export const getShoonyaPositions = async (req, res) => {
  try {
    const uid = "FN169676";
    const susertoken = "bd891d999db82152011ef31d99cddc3054d07d96b51d525e2f0cdcb3f66df310";
    const actid = uid;

    if (!uid || !actid || !susertoken) {
      return res.status(400).json({
        status: false,
        message: "uid, actid and susertoken are required",
      });
    }

    const url = `${SHOONYA_BASE_URL}/Positions`;

    const jData = {
      uid,
      actid,
    };

    const body = `jKey=${susertoken}&jData=${JSON.stringify(jData)}`;

    console.log("Shoonya /Positions body =>", body);

    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = response?.data;
    console.log("Finvasia positions raw:", data);

    if (!data) {
      return res.status(400).json({
        status: false,
        message: "No response from Shoonya Positions",
      });
    }

    if (!Array.isArray(data) && data.stat && data.stat !== "Ok") {
      return res.status(400).json({
        status: false,
        message: data?.emsg || "Unable to fetch positions",
        raw: data,
      });
    }

    const positions = Array.isArray(data) ? data : data?.positiondata || [];

    return res.json({
      status: true,
      message: "Positions fetched successfully",
      count: positions.length,
      positions,
      raw: data,
    });
  } catch (error) {
    console.error("Shoonya Positions Error:", error?.response?.data || error);

    return res.status(500).json({
      status: false,
      message: "Shoonya positions fetch failed",
      error: error?.response?.data || error.message,
    });
  }
};



export const getShoonyaTrades2 = async (req, res) => {
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

export const getShoonyaOrders2 = async (req, res) => {
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




// const SYMBOL_MASTER_URLS = {
//   NSE: "https://api.shoonya.com/NSE_symbols.txt",
//   BSE: "https://api.shoonya.com/BSE_symbols.txt",
//   NFO: "https://api.shoonya.com/NFO_symbols.txt",
//   MCX: "https://api.shoonya.com/MCX_symbols.txt",
// };

// const cache = new Map();
// const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

// function parseCSVToObjects(csv) {
//   const lines = csv
//     .split("\n")
//     .map(l => l.trim())
//     .filter(Boolean);

//   const headers = lines.shift().split(",");

//   return lines.map(line => {
//     const values = line.split(",");

//     const obj = {};
//     headers.forEach((header, index) => {
//       const key = header.trim();

//       let value = values[index]?.trim() ?? "";

//       // auto type conversion
//       if (!isNaN(value) && value !== "") {
//         value = Number(value);
//       }

//       obj[key] = value;
//     });

//     return obj;
//   });
// }

// async function loadInstruments(exch) {
//   const now = Date.now();
//   const cached = cache.get(exch);
//   if (cached && now - cached.at < CACHE_TTL_MS) return cached.data;

//   const res = await axios.get(SYMBOL_MASTER_URLS[exch], {
//     responseType: "text",
//     timeout: 60000,
//   });


//   const data = parseCSVToObjects(res.data);
//   // cache.set(exch, { at: now, data });
//   return data;
// }

// export const getShoonyaInstrumentsFull = async (req, res) => {
//   try {

//     console.log("=============finavasia instrument");
    
//     const exch = String(req.query.exch || "NSE").toUpperCase();
//     const instruments = await loadInstruments(exch);

//     // ✅ PURE LIST RESPONSE
//     return res.json(instruments);
//   } catch (err) {
//     return res.status(500).json({
//       error: err?.message || "Failed to load Finvasia instruments",
//     });
//   }
// };




const SYMBOL_MASTER_URLS = {
  NSE: "https://api.shoonya.com/NSE_symbols.txt.zip",
  BSE: "https://api.shoonya.com/BSE_symbols.txt.zip",
  NFO: "https://api.shoonya.com/NFO_symbols.txt.zip",
  MCX: "https://api.shoonya.com/MCX_symbols.txt.zip",
};

function parseCSVToObjects(csv) {
  const lines = csv
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  const headers = lines.shift().split(",");

  return lines.map(line => {
    const values = line.split(",");

    const obj = {};
    headers.forEach((header, index) => {
      const key = header.trim();

      let value = values[index]?.trim() ?? "";

      // auto type conversion
      if (!isNaN(value) && value !== "") {
        value = Number(value);
      }

      obj[key] = value;
    });

    return obj;
  });
}


async function downloadAndUnzipText(url) {
  // download zip as buffer
  const zipRes = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 120000,
  });

  // unzip: take first file in archive
  const directory = await unzipper.Open.buffer(Buffer.from(zipRes.data));
  const file = directory.files.find((f) => !f.path.endsWith("/") && f.path.includes(".txt"));

  if (!file) throw new Error(`No .txt found inside zip: ${url}`);

  const content = await file.buffer();
  return content.toString("utf-8");
}

async function loadInstruments(exch) {
  const url = SYMBOL_MASTER_URLS[exch];
  if (!url) throw new Error(`Unsupported exch '${exch}'. Use NSE/BSE/NFO/MCX`);

  const txt = await downloadAndUnzipText(url);
  return parseCSVToObjects(txt).map((row) => ({ exch, ...row }));
}

export const getShoonyaInstrumentsFull = async (req, res) => {
  try {
    const exch = req.query.exch ? String(req.query.exch).toUpperCase() : null;

    // If exch provided -> single file
    if (exch) {
      const instruments = await loadInstruments(exch);
      return res.json(instruments);
    }

    // Else -> all 4 files
    const results = await Promise.all(
      Object.keys(SYMBOL_MASTER_URLS).map((k) => loadInstruments(k))
    );

    return res.json(results.flat());
  } catch (err) {
    console.error("Finvasia instrument error:", err?.message);
    return res.status(500).json({
      status: false,
      message: err?.message || "Failed to load Finvasia instruments",
    });
  }
};