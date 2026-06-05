import Credential from "../models/angelOneCredential.js";
import FundPNL from "../models/angelFundAndPNL.js"
import { generateTOTP } from "../utils/generateTOTP.js";
import axios from "axios";


const ANGEL_LOGIN_URL =
  "https://apiconnect.angelone.in//rest/auth/angelbroking/user/v1/loginByPassword";

const ANGEL_RMS_URL =
  "https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getRMS";



export const handleAngelOneUser = async (user, existingFund) => {
  try {
    const credentials = await Credential.findOne({ where: { userId: user.id } });

    if (!credentials) {
      return {
        userId: user.id,
        username:user.username,
         firstName:user.firstName,
           lastName:user.lastName,
        brokerName: "Angelone",
        status: "NO_CREDENTIALS",
        message: "AngelOne credentials not found",
        angelFund: 0,
        pnl: 0,
      };
    }

    const totp = await generateTOTP(credentials.totpSecret);

    // 🔐 Login
    const loginRes = await axios({
      method: "post",
      url: ANGEL_LOGIN_URL,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": process.env.CLIENT_LOCAL_IP,
        "X-ClientPublicIP": process.env.CLIENT_PUBLIC_IP,
        "X-MACAddress": process.env.MAC_Address,
        "X-PrivateKey": user.kite_key,
      },
      data: JSON.stringify({
        clientcode: credentials.clientId,
        password: credentials.password,
        totp,
      }),
    });

    if (!loginRes.data?.status) {
      return {
        userId: user.id,
         username:user.username,
         firstName:user.firstName,
           lastName:user.lastName,
        brokerName: "Angelone",
        status: "LOGIN_ERROR",
        message: loginRes.data?.message,
      };
    }

    const { jwtToken, feedToken, refreshToken } = loginRes.data.data;

    // 🔥 RMS FUND CALL
    const rmsRes = await axios({
      method: "get",
      url: "https://apiconnect.angelone.in/rest/secure/angelbroking/user/v1/getRMS",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-UserType": "USER",
        "X-SourceID": "WEB",
        "X-ClientLocalIP": process.env.CLIENT_LOCAL_IP,
        "X-ClientPublicIP": process.env.CLIENT_PUBLIC_IP,
        "X-MACAddress": process.env.MAC_Address,
        "X-PrivateKey": user.kite_key,
      },
    });

    if (!rmsRes.data?.status) {
      return {
        userId: user.id,
         username:user.username,
         firstName:user.firstName,
           lastName:user.lastName,
        brokerName: "Angelone",
        status: "RMS_ERROR",
        message: rmsRes.data?.message,
      };
    }

    const fund = Number(rmsRes.data.data.net);

    const [fundRow] = await FundPNL.findOrCreate({
      where: { userId: user.id },
      defaults: { fund, pnl: 0, authToken: jwtToken, feedToken, refreshToken },
    });

    await fundRow.update({ fund, pnl: 0, authToken: jwtToken, feedToken, refreshToken });

    return {
      userId: user.id,
       username:user.username,
         firstName:user.firstName,
           lastName:user.lastName,
      brokerName: "Angelone",
      status: "SUCCESS",
      angelFund: fund,
      pnl: 0,
    };

  } catch (err) {
    return {
      userId: user.id,
       username:user.username,
         firstName:user.firstName,
           lastName:user.lastName,
      brokerName: "Angelone",
      status: "ERROR",
      message: err.message,
    };
  }
};
