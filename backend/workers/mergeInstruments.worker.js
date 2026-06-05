

// import { parentPort } from "worker_threads";
import redis from "../utils/redis.js";
import axios from "axios";
import zlib from "zlib";
import unzipper from "unzipper";
import { logSuccess, logError } from "../utils/loggerr.js";
import { KiteAccess } from "../utils/kiteClient.js";





const MERGED_REDIS_KEY = "merged_instruments_new";
const TEN_HOURS_IN_SECONDS = 15 * 60 * 60;

// =======================================================
// ✅ CONFIG: URLs
// =======================================================
const ANGELONE_SCRIP_MASTER_URL = "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json";
const FINVASIA_SYMBOL_MASTER_URLS = {
  NSE: "https://api.shoonya.com/NSE_symbols.txt.zip",
  BSE: "https://api.shoonya.com/BSE_symbols.txt.zip",
  NFO: "https://api.shoonya.com/NFO_symbols.txt.zip",
  MCX: "https://api.shoonya.com/MCX_symbols.txt.zip",
};

const UPSTOX_INSTRUMENT_URLS = {
  COMPLETE: "https://assets.upstox.com/market-quote/instruments/exchange/complete.json.gz",
};

const FYERS_SYMBOL_MASTER_URLS = {
  NSE_CM: "https://public.fyers.in/sym_details/NSE_CM.csv",
  BSE_CM: "https://public.fyers.in/sym_details/BSE_CM.csv",
  NSE_FO: "https://public.fyers.in/sym_details/NSE_FO.csv",
  BSE_FO: "https://public.fyers.in/sym_details/BSE_FO.csv",
  NSE_CD: "https://public.fyers.in/sym_details/NSE_CD.csv",
  MCX_COM: "https://public.fyers.in/sym_details/MCX_COM.csv",
};

const GROWW_INSTRUMENT_URL = "https://growwapi-assets.groww.in/instruments/instrument.csv";

// =======================================================
// ✅ PARSERS (Original Working Version)
// =======================================================
function parseGrowwCSV(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = cols[idx] ?? "";
    });
    records.push(obj);
  }
  return records;
}

function parseFinvasiaCSV(csv) {
  const lines = csv.split("\n").map((l) => l.trim()).filter(Boolean);
  const headers = lines.shift()?.split(",") || [];
  return lines.map((line) => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((header, index) => {
      const key = header.trim();
      let value = values[index]?.trim() ?? "";
      if (!isNaN(value) && value !== "") value = Number(value);
      obj[key] = value;
    });
    return obj;
  });
}

// Original Fyers CSV parser
function splitFyersCSVLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { out.push(cur); cur = ""; } else { cur += ch; }
  }
  out.push(cur);
  return out.map((x) => x.trim());
}

function parseFyersCSV(text, segment) {
  const lines = String(text).split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const hasHeader = lines[0].toLowerCase().includes("fytoken") || lines[0].toLowerCase().includes("symbol");
  const dataLines = hasHeader ? lines.slice(1) : lines;
  return dataLines.map((line) => {
    const cols = splitFyersCSVLine(line);
    const fytoken = cols[0] ?? "";
    const name = cols[1] ?? "";
    const symbolCol = cols.find((c) => typeof c === "string" && /^[A-Z]+:/.test(c)) || "";
    const exchange = symbolCol.includes(":") ? symbolCol.split(":")[0] : "";
    const tradingsymbol = symbolCol.includes(":") ? symbolCol.split(":")[1] : symbolCol;
    return { segment, fytoken, name, symbol: symbolCol, exchange, tradingsymbol, raw: cols };
  });
}

// =======================================================
// ✅ FETCH FUNCTIONS
// =======================================================
async function fetchGrowwInstruments() {
  const res = await axios.get(GROWW_INSTRUMENT_URL, {
    responseType: "text",
    timeout: 180000,
  });
  return parseGrowwCSV(res.data);
}

async function fetchAngelOneScripMaster() {
  try {
    

  const res = await axios.get(ANGELONE_SCRIP_MASTER_URL, { timeout: 180000 });

  console.log('==================fetchAngelOneScripMaster done =============');
  return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
      console.log('==================fetchAngelOneScripMaster=============',error);
      
  }

}

async function fetchKiteInstruments() {
  const apiKey = process.env.KITE_API_KEY;
  const kite = KiteAccess(apiKey);
  const data = await kite.getInstruments();
  return Array.isArray(data) ? data : [];
}

async function downloadAndUnzipFinvasiaText(url) {
  const zipRes = await axios.get(url, { responseType: "arraybuffer", timeout: 180000 });
  const directory = await unzipper.Open.buffer(Buffer.from(zipRes.data));
  const file = directory.files.find((f) => !f.path.endsWith("/") && f.path.toLowerCase().includes(".txt"));
  if (!file) throw new Error(`No .txt found inside zip: ${url}`);
  const content = await file.buffer();
  return content.toString("utf-8");
}

async function fetchFinvasiaInstrumentsByExchange(exch) {
  const url = FINVASIA_SYMBOL_MASTER_URLS[exch];
  if (!url) throw new Error(`Unsupported Finvasia exchange '${exch}'`);
  const txt = await downloadAndUnzipFinvasiaText(url);
  const list = parseFinvasiaCSV(txt);
  return list.map((row) => ({ exch, ...row }));
}

async function fetchAllFinvasiaInstruments() {
  const results = await Promise.all(Object.keys(FINVASIA_SYMBOL_MASTER_URLS).map(fetchFinvasiaInstrumentsByExchange));
  return results.flat();
}

async function fetchUpstoxJsonGz(url) {
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 180000,
    headers: { "Accept-Encoding": "gzip, deflate, br", Accept: "application/json", "User-Agent": "Mozilla/5.0" },
  });
  const gzBuffer = Buffer.from(res.data);
  const jsonText = zlib.gunzipSync(gzBuffer).toString("utf-8");
  return JSON.parse(jsonText);
}

async function fetchUpstoxInstruments() {
  const url = UPSTOX_INSTRUMENT_URLS.COMPLETE;
  return fetchUpstoxJsonGz(url);
}

async function fetchFyersSegment(segment) {
  const url = FYERS_SYMBOL_MASTER_URLS[segment];
  if (!url) throw new Error(`Invalid Fyers segment '${segment}'`);
  const res = await axios.get(url, { responseType: "text", timeout: 180000, headers: { Accept: "text/csv,*/*" } });
  return parseFyersCSV(res.data, segment);
}

async function fetchAllFyersInstruments() {
  const results = await Promise.all(Object.keys(FYERS_SYMBOL_MASTER_URLS).map(fetchFyersSegment));
  return results.flat();
}




//  kotak neo code start 

const KOTAK_MASTER_URL = "https://e22.kotaksecurities.com/script-details/1.0/masterscrip/file-paths";

async function fetchKotakFilePaths() {

  let accessToken = "73c6c0ec-465a-4701-85b6-2d13f107aa5c"

  

  const res = await axios.get(KOTAK_MASTER_URL, {
    headers: {
      Authorization: accessToken
    },
    timeout: 180000
  });

  return res.data?.data?.filesPaths || [];
}

function parseKotakCSV(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  if (!lines.length) return [];

  const headers = lines[0].split(",");

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");

    const obj = {};

    headers.forEach((h, idx) => {
      obj[h.trim()] = cols[idx]?.trim() ?? "";
    });

    records.push(obj);
  }

  return records;
}

async function fetchKotakCSV(url) {

  const res = await axios.get(url, {
    responseType: "text",
    timeout: 180000
  });

  return parseKotakCSV(res.data);

}


async function fetchKotakInstruments() {

  const filePaths = await fetchKotakFilePaths();

  const results = await Promise.all(
    filePaths.map(fetchKotakCSV)
  );

  return results.flat();

}

// kotak neo code end 



// =======================================================
// ✅ HELPER FUNCTIONS
// =======================================================
const safeStr = (v) => (v === null || v === undefined ? "" : String(v));
const normalizeExch = (ex) => safeStr(ex).trim().toUpperCase();
const normalizeSymbol = (s) => safeStr(s).trim().toUpperCase();
const normalizeTradingSymbolForMatch = (symbol) => normalizeSymbol(symbol).replace(/-EQ$/i, "");

const buildTokenKey = (token) => safeStr(token).trim();
const buildSymbolKey = (exch, symbol) => {
  const e = normalizeExch(exch);
  const s = normalizeTradingSymbolForMatch(symbol);
  return e && s ? `${e}:${s}` : "";
};

const getUpstoxToken = (u) => u?.exchange_token || u?.instrument_token || u?.token || u?.exchangeToken || null;
const getUpstoxSymbol = (u) => u?.tradingsymbol || u?.trading_symbol || u?.symbol || u?.instrument_key || u?.instrumentKey || null;
const getUpstoxExchange = (u) => u?.exchange || u?.exch || u?.segment || null;

// =======================================================
// ✅ MAIN PROCESSING WITH ORIGINAL FYERS MATCHING LOGIC
// =======================================================
export const instrumentGetFun = async function () {
  
  console.log('Starting instrument merge worker...');
  
  logSuccess(null, 'Broker instrument fetching started!');


  const startTime = Date.now();

  try {
    // parentPort.postMessage({ status: "STARTED", requestId });

     logSuccess(null, 'All broker instruments fetching ');

    // Fetch all data in parallel
    const [angeloneData=[], kiteData=[], kotakData = [],
    ] =
      await Promise.all([
        fetchAngelOneScripMaster(),
        fetchKiteInstruments(),
        fetchKotakInstruments(),
        // fetchAllFinvasiaInstruments(),
        // fetchGrowwInstruments(),
        // fetchUpstoxInstruments(),
        // fetchAllFyersInstruments(),
       
      ]);

        let finvasiaList=[],growwData=[], upstoxData=[], fyersData=[]

      console.log(kotakData[0],'============ kotak neo symobl ================');
      
    logSuccess(null, 'All broker instruments fetched successfully');


   
    
    const kotakBySymbolKey = new Map();

    for (const k of kotakData) {

      kotakBySymbolKey.set(k.pSymbol, k);

    }



    // Create maps for quick lookup
    const growwTokenMap = new Map();
    for (const growwRecord of growwData) {
      growwTokenMap.set(String(growwRecord.exchange_token), growwRecord);
    }
    logSuccess(null, 'Groww instrument map done!');

    const kiteTokenMap = new Map();
    for (const kiteRecord of kiteData) {
      kiteTokenMap.set(String(kiteRecord.exchange_token), kiteRecord);
    }
    logSuccess(null, 'Kite instrument map done!');

    const finByToken = new Map();
    const finBySymbolKey = new Map();
    for (const f of finvasiaList) {
      const finToken = buildTokenKey(f?.Token);
      if (finToken) finByToken.set(finToken, f);
      const finKey = buildSymbolKey(f?.Exchange, f?.TradingSymbol || f?.Symbol);
      if (finKey) finBySymbolKey.set(finKey, f);
    }
    logSuccess(null, 'Finvasia instrument map done!');

    const upsByToken = new Map();
    const upsBySymbolKey = new Map();
    for (const u of upstoxData) {
      const uToken = buildTokenKey(getUpstoxToken(u));
      if (uToken) upsByToken.set(uToken, u);
      const uKey = buildSymbolKey(getUpstoxExchange(u), getUpstoxSymbol(u));
      if (uKey) upsBySymbolKey.set(uKey, u);
    }
    logSuccess(null, 'Upstox instrument map done!');

    // ORIGINAL FYERS MATCHING LOGIC
    const fyByToken = new Map();
    const fyBySymbolKey = new Map();
    const fyBySymbolOnlyKey = new Map();
    for (const f of fyersData) {
      const fyToken = buildTokenKey(f?.fytoken);
      if (fyToken) fyByToken.set(fyToken, f);
      const fyKey = buildSymbolKey(f?.exchange, f?.tradingsymbol);
      if (fyKey) fyBySymbolKey.set(fyKey, f);
      fyBySymbolOnlyKey.set(f?.tradingsymbol, f);
    }
    logSuccess(null, 'Fyers instrument map done!');

    // Process AngelOne data with original Fyers matching logic
    let fyMatchCount = 0;
    const mergedAngel = angeloneData.map((angel) => {
      const kiteMatch = kiteTokenMap.get(String(angel.token));
      const kiteExch = kiteMatch?.exchange || "";
      const kiteSymbol = kiteMatch?.tradingsymbol || "";

      const angelExch = angel?.exch_seg || "";
      const angelSymbol = angel?.symbol || "";
      const angelExchange = angel?.exch_seg || "";
      const symKey = buildSymbolKey(angelExch, angelSymbol);

      const finMatch = finByToken.get(String(angel.token)) || finBySymbolKey.get(symKey) || null;
      const upstoxMatch = upsByToken.get(String(angel.token)) || upsBySymbolKey.get(symKey) || null;

      const angelSymbolKey = `${angelExchange}:${angelSymbol}`.trim();
      const kiteSymbolKey = `${kiteExch}:${kiteSymbol}`.trim();

      const kotakMatch = kotakBySymbolKey.get(String(angel.token)) || null;

     


      // ORIGINAL FYERS MATCHING LOGIC
      const fyMatch =
        fyByToken.get(String(angel.token)) ||
        fyBySymbolKey.get(angelSymbolKey) ||
        fyBySymbolKey.get(kiteSymbolKey) ||
        fyBySymbolOnlyKey.get(kiteSymbol) ||
        null;

      if (fyMatch) fyMatchCount++;

      const growwMatch = growwTokenMap.get(String(angel.token));

      return {
        ...angel,
        kiteSymbol: kiteMatch?.tradingsymbol || null,
        kiteToken: kiteMatch?.exchange_token || null,
        kiteExchange: kiteMatch?.exchange || null,
        growwTradingSymbol: growwMatch?.trading_symbol || null,
        growwSymbol: growwMatch?.groww_symbol || null,
        growwExchange: growwMatch?.exchange || null,
        growwSegment: growwMatch?.segment || null,
        finvasiaSymbol: finMatch?.TradingSymbol || finMatch?.Symbol || null,
        finvasiaToken: finMatch?.Token || null,
        upstoxSymbol: getUpstoxSymbol(upstoxMatch) || null,
        upstoxToken: getUpstoxToken(upstoxMatch) || null,
        fyersSymbol: fyMatch?.symbol || null,
        fyersToken: fyMatch?.fytoken || null,
        kotakSymbol: kotakMatch?.pTrdSymbol || null,
        //  kotakSymbol: kotakMatch?.pSymbol || null,
        kotakExchange: kotakMatch?.pExchSeg || null,
        
      };
    });

    logSuccess(null, `${fyMatchCount} Fyers matches found`);
    logSuccess(null, 'Match instrument done!');

    // Process Finvasia-only rows with Fyers matching
    const angelTokenSet = new Set(angeloneData.map((a) => String(a.token)));
    const finvasiaOnlyRows = finvasiaList
      .filter((f) => !angelTokenSet.has(String(f.Token)))
      .map((f) => {
        const finToken = String(f.Token);
        const finKey = buildSymbolKey(f.Exchange, f.TradingSymbol || f.Symbol);

        const kiteMatch = kiteTokenMap.get(finToken) || null;
        const upstoxMatch = upsByToken.get(finToken) || upsBySymbolKey.get(finKey) || null;
        
        // Fyers matching for Finvasia-only rows
        const fyMatch = fyByToken.get(finToken) || fyBySymbolKey.get(finKey) || null;

        return {
          source: "FINVASIA_ONLY",
          exch_seg: f.Exchange,
          token: finToken,
          symbol: f.Symbol,
          name: f.Symbol,
          finvasiaSymbol: f.TradingSymbol || f.Symbol || null,
          finvasiaToken: f.Token || null,
          kiteSymbol: kiteMatch?.tradingsymbol || null,
          kiteToken: kiteMatch?.exchange_token || null,
          upstoxSymbol: getUpstoxSymbol(upstoxMatch) || null,
          upstoxToken: getUpstoxToken(upstoxMatch) || null,
          fyersSymbol: fyMatch?.symbol || null,
          fyersToken: fyMatch?.fytoken || null,
        };
      });

    logSuccess(null, 'Merge instrument done!');

    const finalMerged = [...mergedAngel, ...finvasiaOnlyRows];

    logSuccess(null, `Final merged instruments: ${finalMerged.length} records`);

    const responseObj = {
      status: true,
      statusCode: 200,
      data: finalMerged,
      cache: false,
      message: "Angel + Kite + Finvasia + Upstox + Fyers merged",
      timestamp: new Date().toISOString(),
      counts: {
        angelOne: angeloneData.length,
        kite: kiteData.length,
        finvasia: finvasiaList.length,
        upstox: upstoxData.length,
        fyers: fyersData.length,
        groww: growwData.length,
        merged: finalMerged.length,
        fyersMatches: fyMatchCount
      }
    };

    logSuccess(null, 'Payload stringify instrument running...');

    const payload = JSON.stringify(responseObj);

    logSuccess(null, 'Payload stringify instrument done !');

    // Save to Redis with compression
    const saveToRedis = async () => {
      for (let i = 0; i < 3; i++) {
        try {
          // Compress the data
          const compressed = zlib.gzipSync(payload);
          console.log(`Original: ${payload.length} bytes, Compressed: ${compressed.length} bytes`);
          
          await redis.set(MERGED_REDIS_KEY, compressed, "EX", TEN_HOURS_IN_SECONDS);
          console.log('✅ Compressed data stored in Redis');
          return true;
        } catch (e) {
          console.error(`Redis set retry ${i+1}/3 failed:`, e.message);
          await new Promise(r => setTimeout(r, 200));
        }
      }
      return false;
    };

    // await backupInstruments(finalMerged);


    const saved = await saveToRedis();
    if (!saved) {
      logError("⚠️ Could not cache but continuing…");
    }

    const durationMs = Date.now() - startTime;
    logSuccess(null, `============== Duration: ${durationMs}ms ==============`);

    

    logSuccess(null, "✔️ Worker completed successfully!");

    // process.exit(0);

  } catch (err) {
   

    console.error('Worker error:',err);
    
    logError(null, "❌ Worker crashed!");
    logError(null, err?.stack || err?.message);
    // process.exit(1);
  }
}










