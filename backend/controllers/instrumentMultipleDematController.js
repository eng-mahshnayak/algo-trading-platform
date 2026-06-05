
import redis from "../utils/redis.js";  // your redis client
import { logSuccess, logError } from "../utils/loggerr.js"; // <-- path adjust
import { startMergeWorker } from "../workers/startMergeWorker.js";
import zlib from "zlib";
import { GetInstrumentAngelone } from "../utils/getRedisInstrument.js";
import InstrumentsMongodbModel from '../models/instrumentMongodbModel.js' 


// =======================================================
// ✅ MAIN CONTROLLER: Merged Instruments Testing Code
// =======================================================
let isWorkerRunning = false;

// Helper to check if buffer is compressed
const isCompressedBuffer = (buffer) => {
  if (!Buffer.isBuffer(buffer)) return false;
  // Check for gzip magic number (0x1f 0x8b)
  if (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
    return 'gzip';
  }
  // Check for deflate/zlib header
  if (buffer.length >= 2 && (buffer[0] === 0x78 && 
      (buffer[1] === 0x01 || buffer[1] === 0x5e || 
       buffer[1] === 0x9c || buffer[1] === 0xda))) {
    return 'deflate';
  }
  return false;
};

export const getMergedInstrumentsNew = async (req, res) => {
  try {
    console.log("✅ getMergedInstrumentsNew called");

    const MERGED_KEY = "merged_instruments_new";

    // await redis.del(MERGED_KEY);
    // console.log("🧹 Redis merged data removed!");

    // 1️⃣ Check Redis cache
    const cached = await redis.getBuffer(MERGED_KEY);
    
    if (cached) {
      console.log("✅ Cache found, checking compression...");
      
      // Check if data is compressed
      const compressionType = isCompressedBufferNew(cached);
      
      if (compressionType) {
       
        try {
          let decompressed;
          
          if (compressionType === 'gzip') {
            decompressed = zlib.gunzipSync(cached);
          } else if (compressionType === 'deflate') {
            decompressed = zlib.inflateSync(cached);
          }
          
         
           const realData = JSON.parse(decompressed.toString("utf8"));


           console.log(realData.data[0],'realData');

          
          // Send decompressed data
          res.setHeader("Content-Type", "application/json");
          res.setHeader("X-Compression", compressionType);
          res.setHeader("X-Original-Size", cached.length);
          res.setHeader("X-Decompressed-Size", decompressed.length);

          

        //  await GetInstrumentAngelone()

        
        
          
          return res.status(200).send(decompressed);


          
        } catch (decompressError) {
          console.error("❌ Decompression failed:", decompressError);
          // Fallback: Send compressed data (client will need to handle it)
          res.setHeader("Content-Type", "application/octet-stream");
          res.setHeader("X-Compression", compressionType);

          console.log('Decompressed 123',cached[0]);

          return res.status(200).send(cached);
        }
      } else {
        // Data is not compressed, send as is
        console.log("✅ Data is not compressed, sending directly");
        res.setHeader("Content-Type", "application/json");

          console.log('Decompressed 1',cached[0]);

        return res.status(200).send(cached);
      }
    }

    // 2️⃣ If worker already running
    if (isWorkerRunning) {
      return res.status(202).json({
        status: false,
        code: "WORKER_RUNNING",
        message: "Preparing instruments... worker is already running, try again in 10-15 minutes"
      });
    }

    // 3️⃣ Start worker (async fire)
    console.log("❌ Cache empty — starting merge worker");
    isWorkerRunning = true;

    startMergeWorker()   // no await here → fire and forget
      // .then(() => console.log("✔️ Merge worker completed"))
      // .catch((err) => console.error("❌ Merge worker failed:", err))
      // .finally(() => {
      //   isWorkerRunning = false;
      //   console.log("✅ Worker status reset");
      // });

    // 4️⃣ Immediate response
    return res.status(202).json({
      status: false,
      code: "WORKER_STARTED",
      message: "Preparing instruments... try again in 10-15 minutes",
      startedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error("❌ Controller error:", err);
    isWorkerRunning = false;
    return res.status(500).json({
      status: false,
      code: "INTERNAL_ERROR",
      error: err.message,
      message: "Server error while preparing instruments. Please try again in 20-30 minutes"
    });
  }
};






export const getMongodbInstrument = async (req, res) => {
  try {
    
     console.time("Mongo Query Time 🔥");

    let mongodbData = await InstrumentsMongodbModel.find().lean()

    console.timeEnd("Mongo Query Time 🔥");
     
    return res.json({
      status: true,
      data: mongodbData,
      message: "Instrument Successfully gettings"
    });
    
  } catch (err) {
    
    return res.status(500).json({
      status: false,
      code: "INTERNAL_ERROR",
      error: err.message,
      message: "Server error while preparing instruments. Please try again in 20-30 minutes"
    });
  }
};




// =============================new instrument search code for automatic dummy trade============================

// ============================= CHECK COMPRESSED BUFFER =============================
const isCompressedBufferNew = (buffer) => {
  if (!Buffer.isBuffer(buffer)) return false;

  // gzip
  if (
    buffer.length >= 2 &&
    buffer[0] === 0x1f &&
    buffer[1] === 0x8b
  ) {
    return "gzip";
  }

  // deflate
  if (
    buffer.length >= 2 &&
    buffer[0] === 0x78 &&
    (
      buffer[1] === 0x01 ||
      buffer[1] === 0x5e ||
      buffer[1] === 0x9c ||
      buffer[1] === 0xda
    )
  ) {
    return "deflate";
  }

  return false;
};

// ============================= PARSE EXPIRY =============================
const parseExpiryDate = (expiryStr) => {
  try {
    // Example: 12MAY2026

    if (!expiryStr) return null;

    const day = expiryStr.slice(0, 2);
    const month = expiryStr.slice(2, 5).toUpperCase();
    const year = expiryStr.slice(5);

    const monthMap = {
      JAN: 0,
      FEB: 1,
      MAR: 2,
      APR: 3,
      MAY: 4,
      JUN: 5,
      JUL: 6,
      AUG: 7,
      SEP: 8,
      OCT: 9,
      NOV: 10,
      DEC: 11
    };

    if (monthMap[month] === undefined) {
      return null;
    }

    return new Date(
      Number(year),
      monthMap[month],
      Number(day),
      23,
      59,
      59
    );
  } catch (err) {
    return null;
  }
};

// ============================= MAIN SEARCH API =============================
export const searchOptionInstrument = async (req, res) => {
  try {

    let { query, underlying, strike, type } = req.query;

    // ============================= BUILD QUERY =============================
    if (underlying && strike && type) {
      query = `${underlying} ${strike} ${type}`;
    }

    if (!query) {
      return res.status(400).json({
        success: false,
        message:
          "Query parameter required. Example: ?query=NIFTY 24700 CE"
      });
    }

    // ============================= GET REDIS DATA =============================
    const MERGED_KEY = "merged_instruments_new";

    const cached = await redis.getBuffer(MERGED_KEY);

    if (!cached) {
      return res.status(404).json({
        success: false,
        message: "Instrument data not found in Redis"
      });
    }

    // ============================= PARSE DATA =============================
    let instruments = [];

    const compressionType = isCompressedBufferNew(cached);

    if (compressionType === "gzip") {

      const decompressed = zlib.gunzipSync(cached);

      const parsedData = JSON.parse(
        decompressed.toString("utf8")
      );

      instruments = parsedData.data || parsedData;

    } else {

      const parsedData = JSON.parse(
        cached.toString("utf8")
      );

      instruments = parsedData.data || parsedData;
    }

    if (!Array.isArray(instruments)) {
      instruments = [];
    }

    if (instruments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No instruments found"
      });
    }

    console.log(`📊 Total instruments: ${instruments.length}`);

    // ============================= PARSE QUERY =============================
    const queryParts = query
      .toUpperCase()
      .match(/([A-Z]+)\s*(\d+)\s*(CE|PE)/);

    let results = [];

    // ============================= OPTION SEARCH =============================
    if (queryParts) {

      const underlyingBase = queryParts[1];
      const strikeInput = queryParts[2];
      const optionType = queryParts[3];

      console.log(
        `🔍 Searching: ${underlyingBase} ${strikeInput} ${optionType}`
      );

      // ============================= STRATEGY 1 =============================
      results = instruments.filter((inst) => {

        const symbol =
          (inst.symbol || "").toUpperCase();

        const hasUnderlying =
          symbol.includes(underlyingBase);

        const hasStrike =
          symbol.includes(strikeInput);

        const hasType =
          symbol.includes(optionType);

        return (
          hasUnderlying &&
          hasStrike &&
          hasType
        );
      });

      console.log(
        `✅ Strategy 1 found: ${results.length}`
      );

      // ============================= STRATEGY 2 =============================
      if (results.length === 0) {

        results = instruments.filter((inst) => {

          const symbol =
            (inst.symbol || "").toUpperCase();

          const strikeMatch =
            symbol.match(/(\d{4,5})(?=CE|PE)/);

          const extractedStrike =
            strikeMatch
              ? strikeMatch[1]
              : null;

          const hasUnderlying =
            symbol.includes(underlyingBase);

          const hasType =
            symbol.includes(optionType);

          return (
            hasUnderlying &&
            extractedStrike === strikeInput &&
            hasType
          );
        });

        console.log(
          `✅ Strategy 2 found: ${results.length}`
        );
      }

    } else {

      // ============================= SIMPLE SEARCH =============================
      const searchTerm = query
        .toUpperCase()
        .replace(/\s+/g, "");

      results = instruments.filter((inst) => {

        const symbol =
          (inst.symbol || "").toUpperCase();

        return symbol.includes(searchTerm);
      });
    }

    // ============================= NO RESULT =============================
    if (results.length === 0) {

      return res.status(404).json({
        success: false,
        message: `No instrument found for ${query}`
      });
    }

    // ============================= FILTER VALID EXPIRY =============================
    const now = new Date();

    results = results
      .map((inst) => ({
        ...inst,
        parsedExpiry: parseExpiryDate(inst.expiry)
      }))
      .filter((inst) => {

        // remove invalid expiry
        if (!inst.parsedExpiry) {
          return false;
        }

        // remove expired contract
        return inst.parsedExpiry >= now;
      })
      .sort((a, b) => {

        // nearest expiry first
        return a.parsedExpiry - b.parsedExpiry;
      });

    // ============================= AFTER FILTER =============================
    if (results.length === 0) {

      return res.status(404).json({
        success: false,
        message: "No active expiry instrument found"
      });
    }

    // ============================= TAKE ONLY NEAREST =============================
    const instrument = results[0];

    console.log(
      `🎯 Selected nearest expiry: ${instrument.symbol}`
    );

    // ============================= RESPONSE =============================
    return res.json({
      success: true,
      searchQuery: query,
      data: {
        angelone: {
          token: instrument.token || null,
          symbol: instrument.symbol || null,
          exchange: instrument.exch_seg || null,
          name: instrument.name || null,
          strike: instrument.strike || null,
          expiry: instrument.expiry || null,
          instrumenttype:
            instrument.instrumenttype || null
        },

        kite: {
          token: instrument.kiteToken || null,
          symbol: instrument.kiteSymbol || null,
          exchange:
            instrument.kiteExchange || null
        },

        kotak: {
          token: instrument.kotakToken || null,
          symbol:
            instrument.kotakSymbol || null,
          exchange:
            instrument.kotakExchange || null
        }
      }
    });

  } catch (error) {

    console.error(
      "❌ Search error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
      stack:
        process.env.NODE_ENV === "development"
          ? error.stack
          : undefined
    });
  }
};



// ====================backup 23 jan =====================



// import redis from "../utils/redis.js";  // your redis client
// import { logSuccess, logError } from "../utils/loggerr.js"; // <-- path adjust
// import { startMergeWorker } from "../workers/startMergeWorker.js";
// import zlib from "zlib";
// import { GetInstrumentAngelone } from "../utils/getRedisInstrument.js";


// // =======================================================
// // ✅ MAIN CONTROLLER: Merged Instruments Testing Code
// // =======================================================
// let isWorkerRunning = false;

// // Helper to check if buffer is compressed
// const isCompressedBuffer = (buffer) => {
//   if (!Buffer.isBuffer(buffer)) return false;
//   // Check for gzip magic number (0x1f 0x8b)
//   if (buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b) {
//     return 'gzip';
//   }
//   // Check for deflate/zlib header
//   if (buffer.length >= 2 && (buffer[0] === 0x78 && 
//       (buffer[1] === 0x01 || buffer[1] === 0x5e || 
//        buffer[1] === 0x9c || buffer[1] === 0xda))) {
//     return 'deflate';
//   }
//   return false;
// };

// export const getMergedInstrumentsNew = async (req, res) => {
//   try {
//     console.log("✅ getMergedInstrumentsNew called");

//     const MERGED_KEY = "merged_instruments_new";

//     // await redis.del(MERGED_KEY);
//     // console.log("🧹 Redis merged data removed!");

//     // 1️⃣ Check Redis cache
//     const cached = await redis.getBuffer(MERGED_KEY);
    
//     if (cached) {
//       console.log("✅ Cache found, checking compression...");
      
//       // Check if data is compressed
//       const compressionType = isCompressedBuffer(cached);
      
//       if (compressionType) {
       
//         try {
//           let decompressed;
          
//           if (compressionType === 'gzip') {
//             decompressed = zlib.gunzipSync(cached);
//           } else if (compressionType === 'deflate') {
//             decompressed = zlib.inflateSync(cached);
//           }
          
         
//            const realData = JSON.parse(decompressed.toString("utf8"));


//            console.log(realData.data[0],'realData');

          
//           // Send decompressed data
//           res.setHeader("Content-Type", "application/json");
//           res.setHeader("X-Compression", compressionType);
//           res.setHeader("X-Original-Size", cached.length);
//           res.setHeader("X-Decompressed-Size", decompressed.length);

          

//         //  await GetInstrumentAngelone()

        
        
          
//           return res.status(200).send(decompressed);


          
//         } catch (decompressError) {
//           console.error("❌ Decompression failed:", decompressError);
//           // Fallback: Send compressed data (client will need to handle it)
//           res.setHeader("Content-Type", "application/octet-stream");
//           res.setHeader("X-Compression", compressionType);

//           console.log('Decompressed 123',cached[0]);

//           return res.status(200).send(cached);
//         }
//       } else {
//         // Data is not compressed, send as is
//         console.log("✅ Data is not compressed, sending directly");
//         res.setHeader("Content-Type", "application/json");

//           console.log('Decompressed 1',cached[0]);

//         return res.status(200).send(cached);
//       }
//     }

//     // 2️⃣ If worker already running
//     if (isWorkerRunning) {
//       return res.status(202).json({
//         status: false,
//         code: "WORKER_RUNNING",
//         message: "Preparing instruments... worker is already running, try again in 10-15 minutes"
//       });
//     }

//     // 3️⃣ Start worker (async fire)
//     console.log("❌ Cache empty — starting merge worker");
//     isWorkerRunning = true;

//     startMergeWorker()   // no await here → fire and forget
//       // .then(() => console.log("✔️ Merge worker completed"))
//       // .catch((err) => console.error("❌ Merge worker failed:", err))
//       // .finally(() => {
//       //   isWorkerRunning = false;
//       //   console.log("✅ Worker status reset");
//       // });

//     // 4️⃣ Immediate response
//     return res.status(202).json({
//       status: false,
//       code: "WORKER_STARTED",
//       message: "Preparing instruments... try again in 10-15 minutes",
//       startedAt: new Date().toISOString()
//     });

//   } catch (err) {
//     console.error("❌ Controller error:", err);
//     isWorkerRunning = false;
//     return res.status(500).json({
//       status: false,
//       code: "INTERNAL_ERROR",
//       error: err.message,
//       message: "Server error while preparing instruments. Please try again in 20-30 minutes"
//     });
//   }
// };

// ====================backup 23 end ===================





const resolveMergedRedisKey = (req) => {

  const type = String(req.query.type || "new").toLowerCase();

  console.log(type);
  

  if (type === "angelone") return "merged_instruments";

  return "merged_instruments_new"; // default
};



export const getMergedInstrumentsCacheTTL = async (req, res) => {
  try {
    const MERGED_REDIS_KEY = resolveMergedRedisKey(req);

    const nowIST = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    const ttl = await redis.ttl(MERGED_REDIS_KEY);      // -2, -1, or seconds
    const exists = await redis.exists(MERGED_REDIS_KEY);

    const ttlReadable =
      ttl > 0
        ? `${Math.floor(ttl / 60)} min ${ttl % 60} sec`
        : ttl === -1
        ? "No expiry set"
        : "Cache not found";

    logSuccess(req, {
      msg: "Fetched Redis cache TTL",
      redisKey: MERGED_REDIS_KEY,
      cacheType: req.query.type || "new",
      timeIST: nowIST,
      exists: Boolean(exists),
      ttlSeconds: ttl,
      ttlReadable,
    });

    return res.json({
      status: true,
      message: "Redis cache TTL fetched",
      data: {
        redisKey: MERGED_REDIS_KEY,
        cacheType: req.query.type || "new",
        checkedAtIST: nowIST,
        exists: Boolean(exists),
        ttlSeconds: ttl,
        ttlReadable,
      },
    });
  } catch (error) {
    logError(req, error, {
      msg: "Failed to fetch Redis cache TTL",
      cacheType: req.query.type,
    });

    return res.status(500).json({
      status: false,
      message: "Failed to fetch Redis cache TTL",
      error: error?.message,
    });
  }
};


export const clearMergedInstrumentsCache = async (req, res) => {
  try {
    const MERGED_REDIS_KEY = resolveMergedRedisKey(req);

    const nowIST = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    const ttlBefore = await redis.ttl(MERGED_REDIS_KEY);
    const existedBefore = await redis.exists(MERGED_REDIS_KEY);

    const delCount = await redis.del(MERGED_REDIS_KEY);

    logSuccess(req, {
      msg: "Merged instruments Redis cache deleted",
      redisKey: MERGED_REDIS_KEY,
      cacheType: req.query.type || "new",
      deletedAtIST: nowIST,
      existedBefore: Boolean(existedBefore),
      ttlBefore,
      deleted: delCount === 1,
    });

    return res.json({
      status: true,
      message: "Redis cache deleted successfully",
      data: {
        redisKey: MERGED_REDIS_KEY,
        cacheType: req.query.type || "new",
        deletedAtIST: nowIST,
        existedBefore: Boolean(existedBefore),
        ttlBefore,
        deleted: delCount === 1,
      },
    });
  } catch (error) {
    logError(req, error, {
      msg: "Failed to delete Redis cache",
      cacheType: req.query.type,
    });

    return res.status(500).json({
      status: false,
      message: "Failed to delete Redis cache",
      error: error?.message,
    });
  }
};











// ========================================================
// ============================ 17 jan 2025 old ================
// ========================================================




// import redis from "../utils/redis.js";  // your redis client
// import { logSuccess, logError } from "../utils/loggerr.js"; // <-- path adjust
// import { startMergeWorker } from "../workers/startMergeWorker.js";



// // =======================================================
// // ✅ MAIN CONTROLLER: Merged Instruments Testing Code
// // =======================================================
// let isWorkerRunning = false;

// export const getMergedInstrumentsNew = async (req, res) => {
//   try {

//     console.log("✅ getMergedInstrumentsNew called");

//     const MERGED_KEY = "merged_instruments_new";

//     //  const cached2 = await redis.del(MERGED_KEY);

//     // 1️⃣ Check Redis cache

//     const cached = await redis.get(MERGED_KEY);
//     if (cached) {

//        console.log("✅ cached called");

//       res.setHeader("Content-Type", "application/json");
//       return res.status(200).send(cached);
//     }

//       console.log("✅ with out cached called");

//     // 2️⃣ If worker already running
//     if (isWorkerRunning) {
//       return res.json({
//         status: false,
//         message: "Preparing instruments... worker is already running, try again in 10-15 Minute"
//       });
//     }

//     // 3️⃣ Start worker (async fire)
//     console.log("Cache empty — starting merge worker");
//     isWorkerRunning = true;

//     startMergeWorker()   // no await here → fire and forget
//       .then(() => console.log("✔️ Merge worker completed"))
//       .catch((err) => console.error("❌ Merge worker failed:", err))
//       .finally(() => {
//         isWorkerRunning = false;
        
//       });

//     // 4️⃣ Immediate response
//     return res.json({
//       status: false,
//       message: "Preparing instruments... try again in 10-15 Minute"
//     });

//   } catch (err) {
//     console.error("❌ Controller error:", err);
//     isWorkerRunning = false;
//     return res.json({
//       status: false,
//       error: err.message,
//       message: "Preparing instruments... try again in 20-30 Minute"
//     });
//   }
// };









// const resolveMergedRedisKey = (req) => {

//   const type = String(req.query.type || "new").toLowerCase();

//   console.log(type);
  

//   if (type === "angelone") return "merged_instruments";

//   return "merged_instruments_new"; // default
// };



// export const getMergedInstrumentsCacheTTL = async (req, res) => {
//   try {
//     const MERGED_REDIS_KEY = resolveMergedRedisKey(req);

//     const nowIST = new Date().toLocaleString("en-IN", {
//       timeZone: "Asia/Kolkata",
//     });

//     const ttl = await redis.ttl(MERGED_REDIS_KEY);      // -2, -1, or seconds
//     const exists = await redis.exists(MERGED_REDIS_KEY);

//     const ttlReadable =
//       ttl > 0
//         ? `${Math.floor(ttl / 60)} min ${ttl % 60} sec`
//         : ttl === -1
//         ? "No expiry set"
//         : "Cache not found";

//     logSuccess(req, {
//       msg: "Fetched Redis cache TTL",
//       redisKey: MERGED_REDIS_KEY,
//       cacheType: req.query.type || "new",
//       timeIST: nowIST,
//       exists: Boolean(exists),
//       ttlSeconds: ttl,
//       ttlReadable,
//     });

//     return res.json({
//       status: true,
//       message: "Redis cache TTL fetched",
//       data: {
//         redisKey: MERGED_REDIS_KEY,
//         cacheType: req.query.type || "new",
//         checkedAtIST: nowIST,
//         exists: Boolean(exists),
//         ttlSeconds: ttl,
//         ttlReadable,
//       },
//     });
//   } catch (error) {
//     logError(req, error, {
//       msg: "Failed to fetch Redis cache TTL",
//       cacheType: req.query.type,
//     });

//     return res.status(500).json({
//       status: false,
//       message: "Failed to fetch Redis cache TTL",
//       error: error?.message,
//     });
//   }
// };


// export const clearMergedInstrumentsCache = async (req, res) => {
//   try {
//     const MERGED_REDIS_KEY = resolveMergedRedisKey(req);

//     const nowIST = new Date().toLocaleString("en-IN", {
//       timeZone: "Asia/Kolkata",
//     });

//     const ttlBefore = await redis.ttl(MERGED_REDIS_KEY);
//     const existedBefore = await redis.exists(MERGED_REDIS_KEY);

//     const delCount = await redis.del(MERGED_REDIS_KEY);

//     logSuccess(req, {
//       msg: "Merged instruments Redis cache deleted",
//       redisKey: MERGED_REDIS_KEY,
//       cacheType: req.query.type || "new",
//       deletedAtIST: nowIST,
//       existedBefore: Boolean(existedBefore),
//       ttlBefore,
//       deleted: delCount === 1,
//     });

//     return res.json({
//       status: true,
//       message: "Redis cache deleted successfully",
//       data: {
//         redisKey: MERGED_REDIS_KEY,
//         cacheType: req.query.type || "new",
//         deletedAtIST: nowIST,
//         existedBefore: Boolean(existedBefore),
//         ttlBefore,
//         deleted: delCount === 1,
//       },
//     });
//   } catch (error) {
//     logError(req, error, {
//       msg: "Failed to delete Redis cache",
//       cacheType: req.query.type,
//     });

//     return res.status(500).json({
//       status: false,
//       message: "Failed to delete Redis cache",
//       error: error?.message,
//     });
//   }
// };
