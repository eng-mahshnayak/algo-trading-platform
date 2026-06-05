


import { getKiteClientForUserId } from "../services/userKiteBrokerService.js";
import axios from "axios";
import { fyersModel } from "fyers-api-v3";

// -------------------------------
// HANDLE KITE USER (FUNDS)
// -------------------------------

export const handleKiteUser = async (user, existingFund) => {
  try {

    // 1️⃣ Get authenticated Kite client for this user
    const kite = await getKiteClientForUserId(user.id);

    if (!kite) {
      return {
        userId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        brokerName: "Kite",
        status: "NO_CREDENTIALS",
        message: "Kite access token / credentials not found for user",
        kiteFund: 0,
        pnl: 0,
      };
    }

    // 2️⃣ Get margins/funds from Kite
    const margins = await kite.getMargins(); // equity + commodity

    const equity = margins?.equity || {};
    const availableCash = Number(equity.net ?? 0);

    // 4️⃣ Return clean result for frontend
    return {
      userId: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      brokerName: "Kite",
      status: "SUCCESS",
      angelFund: availableCash,
      pnl: 0,
      // rawMargins: margins,  // if you want to see full data in UI, you can add this
    };
  } catch (err) {
    return {
      userId: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      brokerName: "Kite",
      status: "ERROR",
      message: err.message || "Kite fund fetch failed",
    };
  }
};


// -------------------------------
// HANDLE FINVASIA USER (FUNDS)
// -------------------------------
export const handleFinvasiaUser = async (user, existingFund) => {
  try {

    const SHOONYA_BASE_URL = "https://api.shoonya.com/NorenWClientTP";

    const url = `${SHOONYA_BASE_URL}/Limits`;

    const jData = {
      uid: user.kite_client_id,     // Finvasia user id
      actid: user.kite_client_id,
    };

    const body = `jKey=${user.authToken}&jData=${JSON.stringify(jData)}`;

    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = response?.data;

    if (!data || data.stat !== "Ok") {
      return {
        userId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        brokerName: "Finvasia",
        status: "ERROR",
        message: data?.emsg || "Unable to fetch Finvasia funds",
        angelFund: 0,
        pnl: 0,
      };
    }

    // ✅ Current available fund
    const availableCash =
      Number(data?.cash || 0) + Number(data?.payin || 0);

    return {
      userId: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      brokerName: "Finvasia",
      status: "SUCCESS",
      angelFund: availableCash,
      pnl: 0,
      // raw: data   // debugging ke liye
    };

  } catch (err) {
    return {
      userId: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      brokerName: "Finvasia",
      status: "ERROR",
      message: err.message || "Finvasia fund fetch failed",
      angelFund: 0,
      pnl: 0,
    };
  }
};


// -------------------------------
// HANDLE GROWW USER (FUNDS)
// -------------------------------

export const handleGrowwUser = async (user, existingFund) => {
  try {

    if (!user?.authToken) {
      return {
        userId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        brokerName: "Groww",
        status: "NO_CREDENTIALS",
        message: "Groww access token not found",
        growwFund: 0,
        pnl: 0,
      };
    }

    // ✅ 1. Fetch Margin / Funds
    const fundRes = await axios.get(
      "https://api.groww.in/v1/margins/detail/user",
      {
        headers: {
          Authorization: `Bearer ${user.authToken}`,
          "X-API-VERSION": "1.0",
          Accept: "application/json",
        },
      }
    );

    const fundPayload = fundRes?.data?.payload || {};

    // Real usable cash
    const availableCash = Number(
     fundPayload?.clear_cash-fundPayload.net_margin_used
    );


    // ✅ 3. Final Return (Kite style)
    return {
      userId: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      brokerName: "Groww",
      status: "SUCCESS",

      angelFund: availableCash,

      pnl: 0,
    };

  } catch (err) {

    return {
      userId: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      brokerName: "Groww",
      status: "ERROR",
      message: err?.response?.data?.message || err.message || "Groww fund fetch failed",
    };
  }
};


export const handleFyersUser = async (user, existingFund) => {
  try {

    // 1️⃣ Check if user has access token
    if (!user?.authToken) {
      return {
        userId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        brokerName: "Fyers",
        status: "NO_CREDENTIALS",
        message: "Fyers access token not found",
        angelFund: 0,
        pnl: 0,
      };
    }

    // 2️⃣ Initialize Fyers client
    const fyers = new fyersModel({
      path: "logs/",
      enableLogging: true,
    });

    fyers.setAppId(user?.kite_key);
    fyers.setAccessToken(user.authToken);

    // 3️⃣ Get funds from Fyers
    const funds = await fyers.get_funds();

    // 4️⃣ Check if funds data is valid
    if (!funds || funds.s === 'error') {
      return {
        userId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        brokerName: "Fyers",
        status: "ERROR",
        message: funds?.message || "Unable to fetch Fyers funds",
        angelFund: 0,
        pnl: 0,
      };
    }

    // 5️⃣ Extract available cash (equityAmount)
    // Fyers response structure: funds.fund_limit[0].equityAmount
    const availableCash = funds?.fund_limit?.[0]?.equityAmount || 0;

    // 6️⃣ Return in same format as Kite/Finvasia
    return {
      userId: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      brokerName: "Fyers",
      status: "SUCCESS",
      angelFund: availableCash,    // same field name as others
      pnl: 0,
      // raw: funds  // debugging ke liye
    };

  } catch (err) {
    console.error("Fyers fund fetch error:", err);

    return {
      userId: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      brokerName: "Fyers",
      status: "ERROR",
      message: err.message || "Fyers fund fetch failed",
      angelFund: 0,
      pnl: 0,
    };
  }
};
