
import WebSocket from "ws";
import { emitTick, emitFeedStatus } from "../socket/index.js"; // ← import helper
import axios from 'axios';
import Trade from "../models/orderModel.js"
import { Op } from "sequelize";
import livePriceStore from './livePriceStore.js';



let ws = null
let angelSocket = null;
let angelSocketConnectedAt = null;

let reconnectInterval = 5000; // reconnect after 5 seconds

const EXCHANGE_TYPE = {
  NSE: 1,      // nse_cm
  NFO: 2,      // nse_fo
  BSE: 3,      // bse_cm
  BFO: 4,      // bse_fo
  MCX: 5,      // mcx_fo
  NCX: 7,      // ncx_fo
  CDS: 13,     // cde_fo
  CDE: 13,     // sometimes labeled CDE
};

const tokenSymbolMap = new Map();

export const getOrderFunction1 =  async function (token) {

     try {

      var config = {
        method: 'get',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getOrderBook',
        headers: { 
           'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
        },
      
        };

        let {data} = await axios(config)

        if(data.status==true) {

          let tradesAllData = data.data

          if(tradesAllData===null) {


            return { status:true,data:[] }

          }else{

             const uniqueTrades = [
        ...new Map(
            tradesAllData?.map(item => [`${item.tradingsymbol}-${item.symboltoken}`, item])
          ).values()
        ];

      const tokenList = buildTokenList1(uniqueTrades);

      return {  status:true, data:tokenList }

          }
          
         }else{

         return { status:false,data:[] }
    }

    } catch (error) {

         return { status:false,data:[] }
    }
}

function buildTokenList1(trades) {

  // group tokens by exchangeType
  const buckets = new Map(); // key: exchangeType -> Set(tokens)

  for (const t of trades) {
    const exch = (t.exchange || "").toUpperCase().trim();
    const exchangeType = EXCHANGE_TYPE[exch];

    
    
    const token = t.symboltoken && String(t.symboltoken).trim();

    if (!exchangeType || !token) continue;

    if (!buckets.has(exchangeType)) buckets.set(exchangeType, new Set());
    buckets.get(exchangeType).add(token);
  }

  // turn into [{ exchangeType, tokens: [...] }, ...]
  return Array.from(buckets.entries()).map(([exchangeType, set]) => ({
    exchangeType,
    tokens: Array.from(set), // unique tokens per exchangeType
  }));
}



function buildTokenList(trades) {

  // group tokens by exchangeType
  const buckets = new Map(); // key: exchangeType -> Set(tokens)

  for (const t of trades) {
    let exch 
     if(t.broker==='groww') {

       exch = (t?.filledshares ||t.exchange ||"").toUpperCase().trim();
     }else{
       exch = (t.exchange || "").toUpperCase().trim();
     }

    const exchangeType = EXCHANGE_TYPE[exch];

    const token = t.symboltoken && String(t.symboltoken).trim();
    const angelOneToken =  t.angelOneToken && String(t.angelOneToken).trim();

    if (!exchangeType || !token) continue;

    // 🔥 SYMBOL MAP SAME LOOP ME
    tokenSymbolMap.set(
      `${exchangeType}|${angelOneToken}`,
      {
        symbol: t.tradingsymbol || t.angelOneSymbol,
        angeloneSymbol:t.angelOneSymbol,
        exchange: exch
      }
    );

    if (!buckets.has(exchangeType)) buckets.set(exchangeType, new Set());
    buckets.get(exchangeType).add(token);
  }


  // turn into [{ exchangeType, tokens: [...] }, ...]
  return Array.from(buckets.entries()).map(([exchangeType, set]) => ({
    exchangeType,
    tokens: Array.from(set), // unique tokens per exchangeType
  }));
}




export const getOrderFunction = async function () {
  try {

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

      //  const tradesData = await Trade.findAll({
      //   where: {
      //     // orderstatuslocaldb:"OPEN",   // new line add 23 dec 2025
      //     createdAt: {
      //       [Op.between]: [startOfToday, endOfToday],
      //     },
      //   },
      //   raw: true, // plain JS objects
      // });


       const tradesData = await Trade.findAll({
        where: {
          orderstatuslocaldb:"OPEN",   // new line add 23 dec 2025
          // createdAt: {
          //   [Op.between]: [startOfToday, endOfToday],
          // },
        },
        raw: true, // plain JS objects
      });

    
      


            const uniqueTrades = [
        ...new Map(
            tradesData.map(item => [`${item.angelOneSymbol}-${item.angelOneToken}`, item])
          ).values()
        ];

      const tokenList = buildTokenList(uniqueTrades);

      return tokenList
           
  } catch (error) {
    console.error("getOrderFunction error:", error.message);
    return { status: false, data: [], tokens: [] };
  }
};


 
const userSockets = new Map(); // key = userId or token


const livePrices = new Map();

export  function connectSmartSocket(authToken,feedToken,clientId,) {

  // ♻️ REUSE SAME SOCKET FOR EVERYONE
  if (angelSocket && angelSocket.readyState === WebSocket.OPEN) {
    console.log("♻️ Reusing SAME AngelOne socket");
    return angelSocket;
  }

  // console.log("🆕 Creating SINGLE AngelOne socket");


  const WS_URL = process.env.SMART_WS_URL;

   ws = new WebSocket(WS_URL, {
    headers: {
      Authorization: `Bearer ${authToken}`, // jwt from login
      "x-api-key": process.env.PRIVATE_KEY,                   // API key
      "x-client-code": clientId,            // client code
      "x-feed-token": feedToken,           // feed token
    },
  });

  angelSocket = ws

  ws.on("open", async() => {

     emitFeedStatus({ connected: true });

    let ordersData  = await getOrderFunction(authToken)

    ordersData.push({ exchangeType: 1, tokens: ["99926009","99926000","99919000"] });
          
    const subscribeMessage = {
      correlationID: "abcde12345",
      action: 1, // 1=subscribe
      params: {
        mode: 1, // 1=LTP, 2=Quote, 3=SnapQuote
         tokenList: ordersData
        // tokenList: [
        //   // { exchangeType: 13, tokens: ["99918002"] }, // NFO 
        //   //  { exchangeType: 4, tokens: ["889719"] }, // NSE
        //   //   { exchangeType: 13, tokens: ["13"] }, // CDS
        // ],
      },
    };

    ws.send(JSON.stringify(subscribeMessage));

    // Start heartbeat
    startHeartbeat();
      
    //  }



  });

  ws.on("message", (data, isBinary) => {

    try {
      const tick = parseSmartTickLE(Buffer.from(data));
      if (tick) {
       
         if(tick.exchangeType===1||tick.exchangeType===2||tick.exchangeType===3||tick.exchangeType===4||tick.exchangeType===5) {

          tick.ltp = tick.ltpPaiseOrRaw/100

         } else if(tick.exchangeType===13) {
         
         tick.ltp = tick.ltpPaiseOrRaw/10000000

         }else{
          // console.log("📈 LTP:", tick,'full object');
         }

        //  console.log("📈 LTP:", tick,'full object');

          

         const key = `${tick.exchangeType}|${tick.token}`;

          // console.log(key,'=============key==============');

        const symbolInfo = tokenSymbolMap.get(key);

        //  console.log(symbolInfo,'=============symbolInfo==============');

        tick.symbol = symbolInfo?.symbol || null;
        tick.angelOneSymbol = symbolInfo?.angeloneSymbol || null;
        tick.exchange = symbolInfo?.exchange || null;

        console.log(tick,'=============tick==============');
        

         livePriceStore.setPrice(tick.token, tick.ltp);
        
        // 🔥 ship to your socket clients
        emitTick(tick);

        

      } else {
        // Not LTP (mode 2/3) or unparsed – ignore for now
        console.log("bin len", data.length);
      }
    } catch (e) {
      console.error("Parse error:", e.message);
    }
  });

  ws.on("error", (err) => console.error("⚠️ Smart WS error:", err));

 // ❌ Auto-reconnect on close
  ws.on("close", () => {

    console.warn("❌ WS closed ");

    angelSocket = null;
    angelSocketConnectedAt = null;
    // setTimeout(() => {
    //   connectSmartSocket(authToken,feedToken);
    // }, reconnectInterval);
  });

   return angelSocket;

}

export function isSocketReady() {

  if (!angelSocket) return false;

  if (angelSocket.readyState !== WebSocket.OPEN) return false;

  const ageHours =
    (Date.now() - new Date(angelSocketConnectedAt).getTime()) / 36e5;

  return ageHours <= 5;
}




function parseSmartTickLE(buf) {
  if (buf.length < 51) return null;

  const mode = buf.readUInt8(0);
  if (mode !== 1) return null; // only LTP here; extend for 2/3 later

  const exchangeType = buf.readUInt8(1);
  const token = readNullTerminatedAscii(buf, 2, 25);

  // int64 LE -> Number via BigInt (ms timestamp fits in Number for current dates)
  const sequenceNumber = Number(readInt64LE(buf, 27));
  const exchangeTsMs = Number(readInt64LE(buf, 35));

  // LTP: try int32 at 43 (per "int32" in doc)
  let ltpRaw = null;
  try {
    ltpRaw = buf.readInt32LE(43); // 4 bytes
  } catch { /* ignore */ }

  // If next field starts at 51 and int32 didn’t make sense, also try int64 at 43
  // (Some doc dumps and vendor feeds encode as 8-bytes.)
  if (ltpRaw === null && buf.length >= 51) {
    ltpRaw = Number(readInt64LE(buf, 43));
  }

  // Convert price units:
  // - For equity/MCX etc.: divide by 100 to get rupees
  // - For currencies: divide by 10_000_000 (1e7) per doc
  const isCurrency = (exchangeType === 3 || exchangeType === 7 || exchangeType === 13); // adapt if needed
  const price = isCurrency ? (ltpRaw / 1e7) : (ltpRaw / 100);

  return {
    mode,                       // 1
    exchangeType,               // 1=nse_cm, 2=nse_fo, 3=bse_cm, 4=bse_fo, 5=mcx_fo, 7=ncx_fo, 13=cde_fo
    token,                      // string token id
    sequenceNumber,             // may be 0 for indices (per note)
    exchangeTimestamp: new Date(exchangeTsMs).toISOString(),
    ltpPaiseOrRaw: ltpRaw,      // raw integer
    ltp: price,                 // normalized number
  };
}

/** Read little-endian 64-bit signed int as BigInt */
function readInt64LE(buf, offset) {
  // Node 12+ has readBigInt64LE
  return buf.readBigInt64LE(offset);
}

/** Read a null-terminated ASCII/UTF-8 string within a fixed slice */
function readNullTerminatedAscii(buf, offset, maxLen) {
  const end = offset + maxLen;
  let i = offset;
  for (; i < end; i++) {
    if (buf[i] === 0x00) break;
  }
  return buf.toString("utf8", offset, i);
}

function startHeartbeat() {

    console.log('startHeartbeat');
    
  // SmartAPI requires heartbeat every 30 seconds
  return setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send("ping");                       // 👈 text heartbeat
      console.log("❤️ Sent heartbeat (ping)");
    }
  }, 25000);
}

export function disconnectUserSocket(userId) {

  const ws = userSockets.get(userId);
  
  if (ws && ws.readyState === WebSocket.OPEN) {

    console.log(`🔌 Disconnecting ${userId}...`);

    ws.close(1000, "User manually disconnected");

    userSockets.delete(userId);

  } else {

    console.log(`⚠️ No active socket found for ${userId}`);

  }
}


/** 🔥 Emit a tick to useful rooms */
export async function emitOrderGet(authToken) {

  try {

      let ordersData  = await getOrderFunction(authToken)

      console.log(ordersData,'emitOrderGet');
      

     ordersData.push({ exchangeType: 1, tokens: ["99926009","99926000"] });

      const subscribeMessage = {
      correlationID: "abcde12345",
      action: 1, // 1=subscribe
      params: {
        mode: 1, // 1=LTP, 2=Quote, 3=SnapQuote
         tokenList: ordersData
      },
    };

    ws.send(JSON.stringify(subscribeMessage));

    console.log('done emit');
    
  } catch (err) {
    
    console.warn("emitOrderGet skipped (socket not ready yet):", err.message);
  }
}





// ==================== socket tester code ========================













//  ===========================working code start  =========================



// import WebSocket from "ws";
// import { emitTick, emitFeedStatus } from "../socket/index.js"; // ← import helper
// import axios from 'axios';
// import Trade from "../models/orderModel.js"
// import User from '../models/userModel.js';
// import { Op } from "sequelize";
// let ws = null

// let reconnectInterval = 5000; // reconnect after 5 seconds

// const EXCHANGE_TYPE = {
//   NSE: 1,      // nse_cm
//   NFO: 2,      // nse_fo
//   BSE: 3,      // bse_cm
//   BFO: 4,      // bse_fo
//   MCX: 5,      // mcx_fo
//   NCX: 7,      // ncx_fo
//   CDS: 13,     // cde_fo
//   CDE: 13,     // sometimes labeled CDE
// };


// export const getOrderFunction1 =  async function (token) {

//      try {

//       var config = {
//         method: 'get',
//         url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getOrderBook',
//         headers: { 
//            'Authorization': `Bearer ${token}`,
//             'Content-Type': 'application/json', 
//             'Accept': 'application/json', 
//             'X-UserType': 'USER', 
//             'X-SourceID': 'WEB', 
//             'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
//             'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
//             'X-MACAddress': process.env.MAC_Address, 
//             'X-PrivateKey': process.env.PRIVATE_KEY, 
//         },
      
//         };

//         let {data} = await axios(config)

//         if(data.status==true) {

//           let tradesAllData = data.data

//           if(tradesAllData===null) {


//             return { status:true,data:[] }

//           }else{

//              const uniqueTrades = [
//         ...new Map(
//             tradesAllData?.map(item => [`${item.tradingsymbol}-${item.symboltoken}`, item])
//           ).values()
//         ];

//       const tokenList = buildTokenList1(uniqueTrades);

//       return {  status:true, data:tokenList }

//           }
          
//          }else{

//          return { status:false,data:[] }
//     }

//     } catch (error) {

//          return { status:false,data:[] }
//     }
// }

// function buildTokenList1(trades) {

//   // group tokens by exchangeType
//   const buckets = new Map(); // key: exchangeType -> Set(tokens)

//   for (const t of trades) {
//     const exch = (t.exchange || "").toUpperCase().trim();
//     const exchangeType = EXCHANGE_TYPE[exch];
//     const token = t.symboltoken && String(t.symboltoken).trim();

//     if (!exchangeType || !token) continue;

//     if (!buckets.has(exchangeType)) buckets.set(exchangeType, new Set());
//     buckets.get(exchangeType).add(token);
//   }

//   // turn into [{ exchangeType, tokens: [...] }, ...]
//   return Array.from(buckets.entries()).map(([exchangeType, set]) => ({
//     exchangeType,
//     tokens: Array.from(set), // unique tokens per exchangeType
//   }));
// }



// function buildTokenList(trades) {

//   // group tokens by exchangeType
//   const buckets = new Map(); // key: exchangeType -> Set(tokens)

//   for (const t of trades) {
//     const exch = (t.exchange || "").toUpperCase().trim();
//     const exchangeType = EXCHANGE_TYPE[exch];
//     const token = t.symboltoken && String(t.symboltoken).trim();

//     if (!exchangeType || !token) continue;

//     if (!buckets.has(exchangeType)) buckets.set(exchangeType, new Set());
//     buckets.get(exchangeType).add(token);
//   }

//   // turn into [{ exchangeType, tokens: [...] }, ...]
//   return Array.from(buckets.entries()).map(([exchangeType, set]) => ({
//     exchangeType,
//     tokens: Array.from(set), // unique tokens per exchangeType
//   }));
// }

// export const getOrderFunction = async function () {
//   try {

//         const startOfToday = new Date();
//         startOfToday.setHours(0, 0, 0, 0);

//         const endOfToday = new Date();
//         endOfToday.setHours(23, 59, 59, 999);

//        const tradesData = await Trade.findAll({
//         where: {
//           orderstatuslocaldb:"OPEN",   // new line add 23 dec 2025
//           // createdAt: {
//           //   [Op.between]: [startOfToday, endOfToday],
//           // },
//         },
//         raw: true, // plain JS objects
//       });


//             const uniqueTrades = [
//         ...new Map(
//             tradesData.map(item => [`${item.angelOneSymbol}-${item.angelOneToken}`, item])
//           ).values()
//         ];

//       const tokenList = buildTokenList(uniqueTrades);
 
//       return tokenList
           
//   } catch (error) {
//     console.error("getOrderFunction error:", error.message);
//     return { status: false, data: [], tokens: [] };
//   }
// };


 
// const userSockets = new Map(); // key = userId or token


// export  function connectSmartSocket(userId,authToken,feedToken,clientId,) {


//   const WS_URL = process.env.SMART_WS_URL;

//    ws = new WebSocket(WS_URL, {
//     headers: {
//       Authorization: `Bearer ${authToken}`, // jwt from login
//       "x-api-key": process.env.PRIVATE_KEY,                   // API key
//       "x-client-code": clientId,            // client code
//       "x-feed-token": feedToken,           // feed token
//     },
//   });

//   const now = new Date();

//   // 🗃️ Store everything inside map
//     userSockets.set(userId, {
//       ws,
//       clientId,
//       connectedAt: now.toISOString(),
//       connectedDate: now.toLocaleDateString(),
//       connectedTime: now.toLocaleTimeString(),
//     });

//     console.log(ws.readyState,'ws.readyState');

//   if(ws.readyState !== 'OPEN') {

//     console.log(ws.readyStarste,'ws.readyState if inside');
    
//   }

 

//   ws.on("open", async() => {

//      emitFeedStatus({ connected: true });

//     let ordersData  = await getOrderFunction(authToken)

//       // console.log(ordersData,'socket inside');

//      ordersData.push({ exchangeType: 1, tokens: ["99926009","99926000"] });
          
//     const subscribeMessage = {
//       correlationID: "abcde12345",
//       action: 1, // 1=subscribe
//       params: {
//         mode: 1, // 1=LTP, 2=Quote, 3=SnapQuote
//          tokenList: ordersData
//         // tokenList: [
//         //   // { exchangeType: 13, tokens: ["99918002"] }, // NFO 
//         //   //  { exchangeType: 4, tokens: ["889719"] }, // NSE
//         //   //   { exchangeType: 13, tokens: ["13"] }, // CDS
//         // ],
//       },
//     };

//     ws.send(JSON.stringify(subscribeMessage));

//     // Start heartbeat
//     startHeartbeat();
      
//     //  }



//   });

//   ws.on("message", (data, isBinary) => {

//   // const text = Buffer.isBuffer(data) ? data.toString("utf8") : String(data);

//   //   if (text === "pong") {
      
//   //     console.log(text);

//   //     // return;
//   //   }

//     try {
//       const tick = parseSmartTickLE(Buffer.from(data));
//       if (tick) {
       
//          if(tick.exchangeType===1||tick.exchangeType===2||tick.exchangeType===3||tick.exchangeType===4||tick.exchangeType===5) {

//           tick.ltp = tick.ltpPaiseOrRaw/100

//          } else if(tick.exchangeType===13) {
         
//          tick.ltp = tick.ltpPaiseOrRaw/10000000

//          }else{
//           // console.log("📈 LTP:", tick,'full object');
//          }

//         //  console.log("📈 LTP:", tick,'full object');
        
//         // 🔥 ship to your socket clients
//         emitTick(tick);

        

//       } else {
//         // Not LTP (mode 2/3) or unparsed – ignore for now
//         console.log("bin len", data.length);
//       }
//     } catch (e) {
//       console.error("Parse error:", e.message);
//     }
//   });

//   ws.on("error", (err) => console.error("⚠️ Smart WS error:", err));

//  // ❌ Auto-reconnect on close
//   ws.on("close", () => {
//     console.warn("❌ WS closed ");
//     // setTimeout(() => {
//     //   connectSmartSocket(authToken,feedToken);
//     // }, reconnectInterval);
//   });
// }

// export function isSocketReady(userId) {

//   const userInfo = userSockets.get(userId); // stored object { ws, connectedAt, ... }

//   if (!userInfo || !userInfo.ws) {
//     console.log(`⚠️ No WebSocket found for ${userId}`);
//     return false;
//   }

//   const { ws, connectedAt } = userInfo;
//   const ready = ws.readyState === WebSocket.OPEN;

//   // ⏱️ Check if connection is older than 5 hours
//   const connectedTime = new Date(connectedAt).getTime();
//   const now = Date.now();
//   const hoursElapsed = (now - connectedTime) / (1000 * 60 * 60);

//   const withinFiveHours = hoursElapsed <= 5;

//   // ✅ Final decision
//   const isValid = ready && withinFiveHours;

//   console.log(
//     `Socket ready (${userId}): ${isValid} | ReadyState=${ws.readyState} | Connected ${hoursElapsed.toFixed(
//       2
//     )} hrs ago`
//   );

//   return isValid;
// }




// function parseSmartTickLE(buf) {
//   if (buf.length < 51) return null;

//   const mode = buf.readUInt8(0);
//   if (mode !== 1) return null; // only LTP here; extend for 2/3 later

//   const exchangeType = buf.readUInt8(1);
//   const token = readNullTerminatedAscii(buf, 2, 25);

//   // int64 LE -> Number via BigInt (ms timestamp fits in Number for current dates)
//   const sequenceNumber = Number(readInt64LE(buf, 27));
//   const exchangeTsMs = Number(readInt64LE(buf, 35));

//   // LTP: try int32 at 43 (per "int32" in doc)
//   let ltpRaw = null;
//   try {
//     ltpRaw = buf.readInt32LE(43); // 4 bytes
//   } catch { /* ignore */ }

//   // If next field starts at 51 and int32 didn’t make sense, also try int64 at 43
//   // (Some doc dumps and vendor feeds encode as 8-bytes.)
//   if (ltpRaw === null && buf.length >= 51) {
//     ltpRaw = Number(readInt64LE(buf, 43));
//   }

//   // Convert price units:
//   // - For equity/MCX etc.: divide by 100 to get rupees
//   // - For currencies: divide by 10_000_000 (1e7) per doc
//   const isCurrency = (exchangeType === 3 || exchangeType === 7 || exchangeType === 13); // adapt if needed
//   const price = isCurrency ? (ltpRaw / 1e7) : (ltpRaw / 100);

//   return {
//     mode,                       // 1
//     exchangeType,               // 1=nse_cm, 2=nse_fo, 3=bse_cm, 4=bse_fo, 5=mcx_fo, 7=ncx_fo, 13=cde_fo
//     token,                      // string token id
//     sequenceNumber,             // may be 0 for indices (per note)
//     exchangeTimestamp: new Date(exchangeTsMs).toISOString(),
//     ltpPaiseOrRaw: ltpRaw,      // raw integer
//     ltp: price,                 // normalized number
//   };
// }

// /** Read little-endian 64-bit signed int as BigInt */
// function readInt64LE(buf, offset) {
//   // Node 12+ has readBigInt64LE
//   return buf.readBigInt64LE(offset);
// }

// /** Read a null-terminated ASCII/UTF-8 string within a fixed slice */
// function readNullTerminatedAscii(buf, offset, maxLen) {
//   const end = offset + maxLen;
//   let i = offset;
//   for (; i < end; i++) {
//     if (buf[i] === 0x00) break;
//   }
//   return buf.toString("utf8", offset, i);
// }

// function startHeartbeat() {

//     console.log('startHeartbeat');
    
//   // SmartAPI requires heartbeat every 30 seconds
//   return setInterval(() => {
//     if (ws && ws.readyState === WebSocket.OPEN) {
//       ws.send("ping");                       // 👈 text heartbeat
//       console.log("❤️ Sent heartbeat (ping)");
//     }
//   }, 25000);
// }

// export function disconnectUserSocket(userId) {

//   const ws = userSockets.get(userId);
  
//   if (ws && ws.readyState === WebSocket.OPEN) {

//     console.log(`🔌 Disconnecting ${userId}...`);

//     ws.close(1000, "User manually disconnected");

//     userSockets.delete(userId);

//   } else {

//     console.log(`⚠️ No active socket found for ${userId}`);

//   }
// }


// /** 🔥 Emit a tick to useful rooms */
// export async function emitOrderGet(authToken) {

//   try {

//       let ordersData  = await getOrderFunction(authToken)

//       console.log(ordersData,'emitOrderGet');
      

//      ordersData.push({ exchangeType: 1, tokens: ["99926009","99926000"] });

//       const subscribeMessage = {
//       correlationID: "abcde12345",
//       action: 1, // 1=subscribe
//       params: {
//         mode: 1, // 1=LTP, 2=Quote, 3=SnapQuote
//          tokenList: ordersData
//       },
//     };

//     ws.send(JSON.stringify(subscribeMessage));

//     console.log('done emit');
    
//   } catch (err) {
    
//     console.warn("emitOrderGet skipped (socket not ready yet):", err.message);
//   }
// }





// ============================working code end ==============================