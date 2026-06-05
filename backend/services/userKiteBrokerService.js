
import { KiteAccess } from "../utils/kiteClient.js";
import User from "../models/userModel.js"; // your table


export const getKiteClientForUserId = async (userId,token=null,callBackFun=false) => {
  
  if (!userId) {

    throw new Error("userId is required to get Kite client");
  }

  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.kite_key&&!user.kite_secret) {

    throw new Error("Kite API key and Secret not configured for this user");
  }

  let accessToken

  if(callBackFun===true) {
     
    // For login URL, you might not need authToken yet
   accessToken = token

  }else{
    accessToken = user.authToken
  }

  if (!accessToken) {
    throw new Error("Kite access token not available for this user");
  }

  const kite = await KiteAccess(user.kite_key, accessToken);

  return kite
  
};
