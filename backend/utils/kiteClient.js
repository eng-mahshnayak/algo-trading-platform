
import { KiteConnect } from "kiteconnect";

// Create a fresh KiteConnect instance per user
export const KiteAccess = (KITE_API_KEY, accessToken = null) => {


  console.log(KITE_API_KEY,'KITE_API_KEY',accessToken,'accessToken');
  

  const kite = new KiteConnect({
    api_key: KITE_API_KEY,
  });

  if (accessToken) {
     kite.setAccessToken(accessToken);
  }

  return kite; // MUST RETURN
};


