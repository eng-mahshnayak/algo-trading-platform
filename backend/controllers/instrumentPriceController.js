import axios from "axios";
import https from "https";
import dns from "node:dns";


const https6 = new https.Agent({
  keepAlive: true,
  lookup: (host, opts, cb) => dns.lookup(host, { family: 6, all: false }, cb),
});
const https4 = new https.Agent({
  keepAlive: true,
  lookup: (host, opts, cb) => dns.lookup(host, { family: 4, all: false }, cb),
});



// helper that tries IPv6 first, then IPv4 only on network errors/timeouts
async function postAngel(url, body, headers) {

  const baseURL = "https://apiconnect.angelone.in";

  const common = {
    baseURL,
    url,
    method: "post",
    data: body,
    headers,
    timeout: 15000,   // overall request timeout
    proxy: false,     // ignore system proxy envs
    // follow-redirects is used internally by axios http adapter
  };

  try {
    return await axios({ ...common, httpsAgent: https6 });
  } catch (e) {
    // Only fall back to IPv4 on network-ish errors
    const netCodes = new Set([
      "ECONNABORTED", "ETIMEDOUT", "ENETUNREACH", "EAI_AGAIN",
      "ECONNRESET", "EHOSTUNREACH"
    ]);
    if (netCodes.has(e?.code)) {
      return await axios({ ...common, httpsAgent: https4 });
    }
    throw e;
  }
}

export const getLTPInstrument = async (req, res, next) => {
  try {
    // basic input guard (avoid 4xx from API due to empty fields)
    const { exchange, tradingsymbol, symboltoken } = req.body || {};

    if (!exchange || !tradingsymbol || !symboltoken) {
      return res.status(400).json({
        status: false,
        statusCode: 400,
        message: "exchange, tradingsymbol and symboltoken are required",
      });
    }
    if (!req.headers.angelonetoken) {
      return res.status(401).json({
        status: false,
        statusCode: 401,
        message: "Missing Angel One token in header 'angelonetoken'",
      });
    }

    const headers = {
      "Authorization": `Bearer ${req.headers.angelonetoken}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      "X-UserType": "USER",
      "X-SourceID": "WEB",
      "X-ClientLocalIP": process.env.CLIENT_LOCAL_IP || "127.0.0.1",
      "X-ClientPublicIP": process.env.CLIENT_PUBLIC_IP || "106.222.213.105",
      "X-MACAddress": process.env.MAC_Address || "32:bd:3a:75:8f:62",
      "X-PrivateKey": process.env.PRIVATE_KEY, // your API key
    };

 
     const body = JSON.stringify({
            "exchange": exchange,
            "tradingsymbol":tradingsymbol,
            "symboltoken":symboltoken
        });

    // try IPv6 first, then fallback to IPv4 if the connect fails
    const resData = await postAngel(
      "/rest/secure/angelbroking/order/v1/getLtpData",
      body,
      headers
    );


    console.log(resData,'hhhy');
    

    if (resData?.data?.status === true) {
      return res.json({
        status: true,
        statusCode: 200,
        data: resData.data,
        message: "",
      });
    }

    return res.status(401).json({
      status: false,
      statusCode: 401,
      message: "Invalid symboltoken",
      error: resData?.data?.message,
    });
  } catch (error) {

    // Log richer diagnostics server-side
    console.error("getLTP error:", {
      code: error?.code,
      errno: error?.errno,
      syscall: error?.syscall,
      address: error?.address,
      port: error?.port,
      message: error?.message,
    });

    return res.status(500).json({
      status: false,
      statusCode: 500,
      message: "Unexpected error occurred. Please try again.",
      data: null,
      error: error?.message,
    });
  }
};