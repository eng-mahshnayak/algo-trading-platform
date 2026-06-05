import redis from "../utils/redis.js";
import zlib from "zlib";

// Helper to detect compression
const isCompressedBuffer = (buffer) => {

  if (!Buffer.isBuffer(buffer)) return false;

  // gzip magic number
  if (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
    return "gzip";
  }

  // zlib / deflate
  if (
    buffer.length >= 2 &&
    buffer[0] === 0x78 &&
    [0x01, 0x5e, 0x9c, 0xda].includes(buffer[1])
  ) {
    return "deflate";
  }

  return false;
};

const EXCHANGE_TYPE = {
  NSE: 1,
  NFO: 2,
  BSE: 3,
  BFO: 4,
  MCX: 5,
  NCX: 7,
  CDS: 13,
  CDE: 13,
};

function buildSocketTokenList(orders) {
  const bucket = new Map();
  for (const o of orders) {
    const exch = o.exch_seg?.toUpperCase().trim();
    const exchangeType = EXCHANGE_TYPE[exch];
    const token = String(o.token || o.symboltoken || "").trim();
    if (!exchangeType || !token) continue;
    if (!bucket.has(exchangeType)) {
      bucket.set(exchangeType, new Set());
    }
    bucket.get(exchangeType).add(token);
  }
  return Array.from(bucket.entries()).map(
    ([exchangeType, tokens]) => ({
      exchangeType,
      tokens: Array.from(tokens),
    })
  );
}


export const GetInstrumentAngelone = async function (array = []) {
  
  const MERGED_REDIS_KEY = "merged_instruments_new";

  const cached = await redis.getBuffer(MERGED_REDIS_KEY);
  if (!cached) return [];

  let rawBuffer = cached;
  const compressionType = isCompressedBuffer(cached);

  if (compressionType === "gzip") {
    rawBuffer = zlib.gunzipSync(cached);
  } else if (compressionType === "deflate") {
    rawBuffer = zlib.inflateSync(cached);
  }

  const realData = JSON.parse(rawBuffer.toString("utf8"));


  console.log(realData[0]);
  

  const instrumentMap = new Map();

  // 🔹 All symbol fields to match against
  const SYMBOL_FIELDS = [
    "symbol",
    "kiteSymbol",
    "growwTradingSymbol",
    "growwSymbol",
    "upstoxSymbol",
    "fyersSymbol",
  ];

  // 🔹 Build map
  for (const item of realData.data) {
    for (const field of SYMBOL_FIELDS) {
      if (item[field]) {
        const key = `${item[field]}_${item.exch_seg}`;
        instrumentMap.set(key, item);
      }
    }
  }

  // 🔹 Match input array
  const matched = [];

  for (const obj of array) {
    const key = `${obj.tradingsymbol}_${obj.exchange}`;
    if (instrumentMap.has(key)) {
      matched.push(instrumentMap.get(key));
    }
  }


  let arrayList = await buildSocketTokenList(matched)

  console.log(arrayList,'==================arrayList===========');
  
  

  return matched;
};



export const GetInstrumentAngelone1212 = async function (array=[]) {
  const MERGED_REDIS_KEY = "merged_instruments_new";

  // 1️⃣ Get buffer from Redis
  const cached = await redis.getBuffer(MERGED_REDIS_KEY);
  if (!cached) return null;

  // 2️⃣ Decompress if needed
  let rawBuffer = cached;
  const compressionType = isCompressedBuffer(cached);

  if (compressionType === "gzip") {
    rawBuffer = zlib.gunzipSync(cached);
  } else if (compressionType === "deflate") {
    rawBuffer = zlib.inflateSync(cached);
  }

  // 3️⃣ Buffer → String
  const jsonString = rawBuffer.toString("utf8");

  // 4️⃣ String → JSON (REAL DATA)
  const realData = JSON.parse(jsonString);


  console.log(realData.data[0],'============realData.data[0]==========');

  console.log(array,'===============array===============');

  

  return array ;
};
