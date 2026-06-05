import User from "../models/userModel.js";
import axios from "axios";
import crypto from "crypto";


const FINVASIA_BASE_URL = "https://api.shoonya.com";



// ===================== Finavasia LOGIN URL =====================

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

export const FinavasiaLogin = async (req, res) => {
  try {

    console.log("FinvasiaLogin controller hit");


        const uid = "FN169676";
        const password = "Manish@789";
        const factor2 = "359176";      
        const imei = "abc1234";  
    

    if (!uid || !password || !factor2) {
      return res.status(400).json({
        status: false,
        message: "uid, password and factor2 are required",
      });
    }

    // ⭐ from .env
    const apiKey = 'bffee8d42efa5ffc938bada1becb6d8f'         // your Shoonya api_key
    const vendorCode = 'CHTPM1550R_U' // vc
    const apkVersion =  "1.0.0";



    if (!apiKey || !vendorCode) {
      return res.status(500).json({
        status: false,
        message: "Finvasia API config missing (API_KEY / VENDOR_CODE)",
      });
    }

    // pwd = Sha256 of password
    const pwdHash = sha256(password);

    // appkey = Sha256 of uid|api_key
    const appKeyHash = sha256(`${uid}|${apiKey}`);

    const jDataObj = {
      apkversion: apkVersion,
      uid: uid,
      pwd: pwdHash,
      factor2: factor2,
      vc: vendorCode,
      appkey: appKeyHash,
      imei: imei || "DESKTOP-IMEI-OR-MAC",
      source: "API",
    };

    if (ipaddr) jDataObj.ipaddr = ipaddr;
    if (addldivinf) jDataObj.addldivinf = addldivinf;

    // Shoonya expects form-encoded body: jData=<JSON>
    const body = `jData=${encodeURIComponent(JSON.stringify(jDataObj))}`;

    const response = await axios.post(
      `${FINVASIA_BASE_URL}/NorenWClientTP/QuickAuth`,
      body,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const data = response.data;
    console.log("Finvasia login response:", data.data);

    if (data.stat === "Ok") {
      // 👉 HERE you can also save usertoken to DB against userId if you want
      return res.status(200).json({
        status: true,
        message: "Finvasia login successful",
        usertoken: data.usertoken,
        lastaccesstime: data.lastaccesstime,
        raw: data,
      });
    } else {
      return res.status(400).json({
        status: false,
        message: data.emsg || "Finvasia login failed",
        raw: data,
      });
    }
  } catch (error) {
    console.error("Finavasia login error:", error?.response?.data);

    return res.status(500).json({
      status: false,
      message: "Finavasia login error",
      error: error.message,
      raw: error?.response?.data,
    });
  }
};



