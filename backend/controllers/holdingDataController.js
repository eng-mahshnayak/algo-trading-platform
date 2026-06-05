
import axios from 'axios';








export const getProfitAndLoss = async (req, res,next) => {
    try {

         const result = await computePortfolioPnL();

        let resData = JSON.stringify(result, null, 2)

         return res.json({
            status: true,
            statusCode:201,
            message: "",
            data:result.totals.totalPnL,
            error: null,
        });

       

    } catch (error) {

        console.log(error);
        
   
       return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};



// const getHoldingData = async function () {

//     let response = {
//     "status": true,
//     "data": [
//         {
//         "tradingsymbol": "SBIN-EQ",
//         "symboltoken": "3045",
//         "exchange": "NSE",
//         "averageprice": 600.00,
//         "quantity": 50
//         },
//         {
//         "tradingsymbol": "INFY-EQ",
//         "symboltoken": "1594",
//         "exchange": "NSE",
//         "averageprice": 1450.00,
//         "quantity": 10
//         }
//     ]
// }

//  return response

// }

// const getLtpData = async function () {

//     let response = {
//     "status": true,
//     "data": {
//         "exchange": "NSE",
//         "tradingsymbol": "SBIN-EQ",
//         "symboltoken": "3045",
//         "ltp": 612.50
//     }
// }

//  return response

// }

// const getPositionData = async function () {

//    let response =  {
//     "status": true,
//     "data": [
//         {
//         "tradingsymbol": "SBIN-EQ",
//         "symboltoken": "3045",
//         "buyavgprice": 610.00,
//         "sellavgprice": 615.50,
//         "buyqty": 50,
//         "sellqty": 50,
//         "netqty": 0,
//         "pnl": 275.00
//         }
//         ]
//     }

//      return response
    
// }

// const getOrderBookData = async function () {
//     let response = {
//     "status": true,
//     "data": [
//         {
//         "orderid": "12345",
//         "tradingsymbol": "SBIN-EQ",
//         "transactiontype": "BUY",
//         "price": 600.0,
//         "filledshares": "50",
//         "status": "complete",
//         "updatetime": "30-Oct-2025 10:55:01"
//         },
//         {
//         "orderid": "12346",
//         "tradingsymbol": "SBIN-EQ",
//         "transactiontype": "SELL",
//         "price": 612.5,
//         "filledshares": "50",
//         "status": "complete",
//         "updatetime": "30-Oct-2025 12:20:31"
//         }
//     ]
//     }

//     return response
// }


// pnl.js — one page, run: node pnl.js

// ----------------- MOCK SMARTAPI-LIKE FETCHERS (replace with real endpoints later) -----------------



const getHoldingData = async function () {
  return {
    status: true,
    data: [
      { tradingsymbol: "SBIN-EQ", symboltoken: "3045", exchange: "NSE", averageprice: 600.0, quantity: 50 },
      { tradingsymbol: "INFY-EQ", symboltoken: "1594", exchange: "NSE", averageprice: 1450.0, quantity: 10 },
    ],
  };
};

// For demo, accept symbol and return LTP for that symbol. Replace with your live LTP endpoint.
const getLtpData = async function (symbol) {
  const map = {
    "SBIN-EQ": 400.5,
    "INFY-EQ": 1000.35,
  };
  return {
    status: true,
    data: { exchange: "NSE", tradingsymbol: symbol, symboltoken: "", ltp: map[symbol] ?? 0 },
  };
};



const getOrderBookData = async function () {
  return {
    status: true,
    data: [
      {
        orderid: "12345",
        tradingsymbol: "SBIN-EQ",
        transactiontype: "BUY",
        price: 600.0,
        filledshares: "50",
        status: "complete",
        updatetime: "30-Oct-2025 10:55:01",
      },
      {
        orderid: "12346",
        tradingsymbol: "SBIN-EQ",
        transactiontype: "SELL",
        price: 500.5,
        filledshares: "50",
        status: "complete",
        updatetime: "30-Oct-2025 12:20:31",
      },
    ],
  };
};

// ----------------- P&L LOGIC (drop-in) -----------------

//  convert in number 
const toNum = (v) => (v === null || v === undefined || v === "" ? 0 : Number(v));

// get a formate date 
const parseTime = (s) => {
  const m = /^(\d{2})-([A-Za-z]{3})-(\d{4}) (\d{2}):(\d{2}):(\d{2})$/.exec(String(s || ""));
  if (!m) return new Date(s);
  const [, d, mon, y, hh, mm, ss] = m;
  const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  return new Date(Number(y), months[mon], Number(d), Number(hh), Number(mm), Number(ss));
};


// Unrealized P&L from holdings + LTPs
function computeUnrealizedPnL(holdings, ltpMap) {
  const perSymbol = [];
  let invested = 0,
    current = 0,
    pnl = 0;

  for (const h of holdings || []) {
    const qty = toNum(h.quantity);
    const avg = toNum(h.averageprice);
    const ltp = toNum(ltpMap?.[h.tradingsymbol]);

    const investedVal = avg * qty;
    const currentVal = ltp * qty;
    const upnl = currentVal - investedVal;

    invested += investedVal;
    current += currentVal;
    pnl += upnl;

    perSymbol.push({
      symbol: h.tradingsymbol,
      qty,
      avgPrice: avg,
      ltp,
      invested: investedVal,
      current: currentVal,
      unrealizedPnL: upnl,
      changePct: investedVal ? (upnl / investedVal) * 100 : 0,
    });
  }

  return {
    perSymbol,
    totals: {
      invested,
      current,
      unrealizedPnL: pnl,
      changePct: invested ? (pnl / invested) * 100 : 0,
    },
  };
}

// Realized P&L from order book using FIFO (supports longs & shorts)
function computeRealizedPnLFromOrders(orders) {
  const bySym = new Map();

//  make a map
  for (const o of orders || []) {

    const sym = o.tradingsymbol;
    if (!bySym.has(sym)) bySym.set(sym, []);
    bySym.get(sym).push(o);
  }

  //  sort data according to date   
  for (const [, list] of bySym) list.sort((a, b) => parseTime(a.updatetime) - parseTime(b.updatetime));

  let totalRealized = 0;
  const perSymbol = [];

  for (const [sym, list] of bySym) {
    const longBuys = []; // { qty, price }
    const shortSells = []; // { qty, price }
    let realized = 0;

    for (const o of list) {
      const side = String(o.transactiontype || "").toUpperCase();
      const px = toNum(o.price);
      let qty = toNum(o.filledshares);

      if (side === "BUY") {
        while (qty > 0 && shortSells.length) {
          const lot = shortSells[0];
          const matched = Math.min(qty, lot.qty);
          realized += (lot.price - px) * matched; // cover short
          lot.qty -= matched;
          qty -= matched;
          if (lot.qty === 0) shortSells.shift();
        }
        if (qty > 0) longBuys.push({ qty, price: px });
      } else if (side === "SELL") {
        while (qty > 0 && longBuys.length) {
          const lot = longBuys[0];
          const matched = Math.min(qty, lot.qty);
          realized += (px - lot.price) * matched; // close long
          lot.qty -= matched;
          qty -= matched;
          if (lot.qty === 0) longBuys.shift();
        }
        if (qty > 0) shortSells.push({ qty, price: px }); // start/extend short
      }
    }

    totalRealized += realized;
    perSymbol.push({ symbol: sym, realizedPnL: realized });
  }

  return { perSymbol, totals: { realizedPnL: totalRealized } };
}

// Tie everything together
async function computePortfolioPnL() {
    
  const holdingsRes = await getHoldingData();
  const ordersRes = await getOrderBookData();

  // Build LTP map (replace with batch quote in production)
  const ltpMap = {};
  for (const h of holdingsRes?.data || []) {
    const ltpRes = await getLtpData(h.tradingsymbol);
    ltpMap[h.tradingsymbol] = toNum(ltpRes?.data?.ltp);
  }

//   const unreal = computeUnrealizedPnL(holdingsRes?.data || [], ltpMap);
  const realized = computeRealizedPnLFromOrders(ordersRes?.data || []);
//   const totalPnL = toNum(unreal.totals.unrealizedPnL) + toNum(realized.totals.realizedPnL);
    const totalPnL = toNum(realized.totals.realizedPnL);

  return {
    // unrealized: unreal,
    realized,
    totals: {
      totalPnL,
    //   unrealizedPnL: unreal.totals.unrealizedPnL,
      realizedPnL: realized.totals.realizedPnL,
    },
  };
}





     