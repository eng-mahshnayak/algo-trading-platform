// utils/fyersClient.js
import { fyersModel as FyersAPI } from "fyers-api-v3";





/**
 * Set per-user access token before every call
 */
export const setFyersAccessToken = async (accessToken,user) => {
  if (!accessToken) {

    throw new Error("No Fyers access token provided");
  }

  let fyers = new FyersAPI();

  // Configure static app data from env
  fyers.setAppId(user?.kite_key);
  
  fyers.setRedirectUrl(process.env.fyers_redirect_uri);

  fyers.setAccessToken(accessToken);

  return fyers
};


