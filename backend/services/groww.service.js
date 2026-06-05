import axios from "axios";
import Order from "../models/orderModel.js";
import { logSuccess, logError } from "../utils/loggerr.js";



const GROWW_BASE_URL = "https://api.groww.in/v1";

/* ---------------- HELPERS ---------------- */

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const normalizeStatus = (s = "") =>
  s.toUpperCase().replace(/\s+/g, "_");

const isFinalStatus = (s) =>
  ["COMPLETE", "CANCELLED", "REJECTED","EXECUTED"].includes(s);



// -------------------- MAPPERS PRODUCT --------------------
function getGrowwProductCode(type, segment) {

  if (!type) return "CNC";

  const t = type.toUpperCase();
  const seg = segment?.toUpperCase();

  // EQUITY
  if (seg === "CASH") {

    if (t === "INTRADAY") return "MIS";

    // DELIVERY + CARRYFORWARD दोनों CNC होंगे
    return "CNC";
  }

  // FNO / CURRENCY / COMMODITY
  if (["FNO", "CURRENCY", "COMMODITY"].includes(seg)) {

    if (t === "INTRADAY") return "MIS";

    return "NRML";
  }

  return "CNC"; // safe fallback
}



// -------------------- MAPPERS SEGMENT --------------------
export const getGrowwSegment = ({ exchange }) => {

  const ex = exchange?.toUpperCase();

  switch (ex) {
    case "NSE":
    case "BSE":
      return "CASH";

    case "NFO":
    case "BFO":   // ✅ add this  
      return "FNO";

    case "CDS":
      return "CURRENCY";

    case "MCX":
      return "COMMODITY";

    default:
      throw new Error(`Unsupported exchange for Groww: ${exchange}`);
  }
};




/* =====================================================
            FETCH ORDER STATUS WITH RETRY
===================================================== */

async function fetchGrowwOrderStatusWithRetry(
  growwToken,
  growwOrderId,
  seqment,
  req,
  retries = 5
) {
  let lastStatus = null;

  for (let i = 1; i <= retries; i++) {
    try {

      const res = await axios.get(
        `${GROWW_BASE_URL}/order/status/${growwOrderId}?segment=${seqment}`,
        {
          headers: {
            Authorization: `Bearer ${growwToken}`,
            "X-API-VERSION": "1.0",
          },
        }
      );

       console.log(res.data,'================res order status================');

      lastStatus = res.data;

      const statusNorm = normalizeStatus(
        res.data?.payload?.order_status
      );

     logSuccess(req, {
        msg: "groww order status fetched successfully",
        attempt: i,
        growwOrderId,
        orderStatus: statusNorm
      });

      if (isFinalStatus(statusNorm)) {
        return res.data;
      }

    } catch (err) {

      logError(req, err, {
        msg: "groww failed to fetch order status",
        growwOrderId,
        attempt: i,
        error:err
      });

    }

    await sleep(1200);
  }

  return lastStatus;
}

/* =====================================================
                FETCH TRADES
===================================================== */

async function fetchGrowwTradesWithRetry(
  growwToken,
  growwOrderId,
  segment,
  expectedQty,
  req,
  retries = 5
) {
  let lastTrades = [];

  for (let i = 1; i <= retries; i++) {

    try {

      const res = await axios.get(
        `${GROWW_BASE_URL}/order/trades/${growwOrderId}?segment=${segment}`,
        {
          headers: {
            Authorization: `Bearer ${growwToken}`,
            "X-API-VERSION": "1.0",
          },
        }
      );

      console.log(res.data,'================res trade================');
      

      const trades = res.data?.payload.trade_list || [];

      const totalQty = trades.reduce(
        (sum, t) => sum + Number(t.quantity || 0),
        0
      );

     logSuccess(req, {
        msg: "groww trade details fetched successfully",
        attempt: i,
        growwOrderId,
        totalFilledQty: totalQty,
        expectedQty
      });
      if (totalQty >= expectedQty) {
        return trades;
      }

      lastTrades = trades;

    } catch (err) {

      logError(req, err, {
        msg: "groww failed to fetch trade details",
        growwOrderId,
        attempt: i,
        errorNew:err?.message
      });

    }

    await sleep(1200);
  }

  return lastTrades;
}


/* =====================================================
        WEIGHTED AVERAGE PRICE
===================================================== */

function calculateWeightedAveragePrice(trades) {

  let totalValue = 0;
  let totalQuantity = 0;

  trades.forEach(trade => {
    totalValue += trade.price * trade.quantity;
    totalQuantity += trade.quantity;
  });

  return totalQuantity ? totalValue / totalQuantity : 0;
}


/* =====================================================
                FIFO AUTO SELL
===================================================== */

async function growwFIFOAutoSell(user, symbol,req,buyOrderId='') {

  try {

    const growwToken = user.authToken;

    let orderBuyFind = await Order.findOne({
      where: {
        orderid: buyOrderId,
        transactiontype: "BUY",
        orderstatuslocaldb:"OPEN"
      },
      order: [["createdAt", "ASC"]],
      raw: true
    });

    const orders = await axios.get(
        `${GROWW_BASE_URL}/order/list`,
        { headers:{ Authorization:`Bearer ${growwToken}` } }
        );

        const sellOrders = orders.data?.payload?.order_list.filter(o =>
          o.trading_symbol === orderBuyFind?.tradingsymbol &&
          o.transaction_type === "SELL" &&
          o.order_status === "EXECUTED"
        );

        const latestSell =
            sellOrders.sort(
              (a,b)=> new Date(b.order_timestamp) - new Date(a.order_timestamp)
            )[0];

             

     const tradesRes = await axios.get(
              `${GROWW_BASE_URL}/order/trades/${latestSell.groww_order_id}?segment=${latestSell?.segment}`,
              { headers:{ Authorization:`Bearer ${growwToken}` } }
              );

         let trades = tradesRes.data.payload.trade_list

        //  console.log(trades,'trades');
         

        // ✅ GET ALL TRADES
        let totalQty = 0;
        let totalValue = 0;

         trades.forEach(trade=>{
         totalQty += Number(trade.quantity);
         totalValue += trade.quantity * trade.price;
      });

       const avgSellPrice = totalValue / totalQty;

       console.log(avgSellPrice,'avgSellPriceavgSellPriceavgSellPrice');
       

      const buyPrice = orderBuyFind.fillprice;
      const buyQty = orderBuyFind.fillsize;

       const pnl =
     (avgSellPrice - buyPrice) * buyQty;

     // ✅ CREATE SELL (CLONE BUY)
   const sellPayload = {
     ...orderBuyFind,
     id: undefined,
     transactiontype:"SELL",
     orderid: latestSell?.groww_order_id,
     tradeid: trades[0]?.groww_trade_id,
     uniqueorderid:"",
     tradedValue:avgSellPrice*buyQty,
     fillprice: avgSellPrice,
     price:avgSellPrice,
     quantity:buyQty,
     fillsize: buyQty,
     pnl,
     filltime: new Date(trades[0].created_at).toISOString(),
     buyOrderId: orderBuyFind?.orderid || "",
     buyTime: orderBuyFind?.filltime || "",
     buysize: orderBuyFind?.fillsize || "",
     buyprice: orderBuyFind?.fillprice || "",
     buyvalue: orderBuyFind?.tradedValue || "",
     orderstatuslocaldb:"COMPLETE",
     positionStatus:"COMPLETE",
     text:"AUTO_SYNC_FROM_BROKER"
   };

   console.log(sellPayload,'sellPayload');
   

   await Order.create(sellPayload);

    await Order.update(
      {
        orderstatus: "COMPLETE",
        orderstatuslocaldb: "COMPLETE",
        positionStatus: "COMPLETE",
      },
      {
        where: {
          id: orderBuyFind?.id
        }
      }
    );
      
  } catch (err) {

    console.log(err);
    

    logError(req, err, {
      msg: "Groww FIFO failed",
      error: err
    });

    return [];
  }
}


async function hasGrowwOpenPosition(token, symbol) {

  const res = await axios.get(
    `${GROWW_BASE_URL}/positions/user`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-API-VERSION": "1.0",
      },
    }
  );

  const positions = res.data?.payload?.positions || [];

  return positions.some(
    (p) =>
      p.trading_symbol === symbol &&
      Number(p.quantity) !== 0
  );
}


/* =====================================================
            MAIN PLACE ORDER (KITE LEVEL)
===================================================== */

export const placeGrowwOrder = async (
  user,
  reqInput,
  req,
  useMappings = true
) => {

  let newOrder = null;
  let existingBuyOrder = null;

  const nowISO = new Date().toISOString();

  try {

    const growwToken = user?.authToken;

    if (!growwToken) {
      return { result: "ERROR", message: "Groww token missing" };
    }

     const segment = reqInput?.growwSegment

     const growwProductType = useMappings ? getGrowwProductCode(reqInput.productType,segment) : reqInput.productType;

     let exchange =  reqInput?.growwExchange||reqInput?.exch_seg


    /* ================= BUY MERGE CHECK ================= */

    if (reqInput.transactiontype === "BUY") {

      existingBuyOrder = await Order.findOne({
        where: {
          userId: user.id,
          tradingsymbol: reqInput.growToken,
          producttype :growwProductType,
          transactiontype: "BUY",
          orderstatuslocaldb: "OPEN",
          positionStatus: "OPEN",
          status: "COMPLETE",
        },
      });

    }

      if(reqInput.transactiontype.toUpperCase()==='SELL')  {
    
           logSuccess(req, {
            msg: "Before Check User Position for SELL order ",
          });
    
           const isOpen = await hasGrowwOpenPosition( growwToken,reqInput.growToken );

              if(!isOpen) {

                 logSuccess(req,{
                    msg:"No open position found in Groww. SELL blocked."
                  });

               await growwFIFOAutoSell(user,reqInput.trading_symbol,req,reqInput.buyOrderId)
         
              return { result: "BROKER_REJECTED", orderid:"" };
              
            }
        }

    /* ================= TEMP ORDER ================= */

    newOrder = await Order.create({
      userId: user.id,
      userNameId: user.username,
      broker: "groww",
      variety: reqInput.variety,
      tradingsymbol: reqInput.growToken,
      symboltoken: reqInput.kiteToken || reqInput.token,
      transactiontype: reqInput.transactiontype,
      squareoff: reqInput.squareoff || 0,
      stoploss: reqInput.stoploss || 0,
      quantity: reqInput.quantity,
      duration: reqInput.duration,
      producttype: growwProductType,
      ordertype:reqInput?.orderType||reqInput?.ordertype,
      exchange: exchange,
      optiontype:segment,   // segement store here 
      filledshares:reqInput?.exch_seg,   // angelone exchange store here 
      orderstatuslocaldb: "PENDING",
      status: "PENDING",
      ordertag:  `software-setu-${Date.now().toString().slice(-6)}`,
      fillsize: reqInput.quantity,
      price: reqInput.price,
      buyOrderId: reqInput?.buyOrderId || null,
      strategyName: reqInput?.groupName || "",
      strategyUniqueId: reqInput?.strategyUniqueId || "",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      text: reqInput?.text||"",
    });

    /* ================= PLACE ORDER ================= */

    const placeRes = await axios.post(
      `${GROWW_BASE_URL}/order/create`,
      {
        trading_symbol: reqInput.growToken,
        quantity: reqInput.quantity,
        // price: 0,
        // exchange: reqInput.exch_seg || "NSE",
        exchange:  exchange,
        validity:reqInput.duration,
        segment: segment,
        product: growwProductType || "CNC",
        order_type: reqInput?.orderType||reqInput?.ordertype,
        transaction_type: reqInput.transactiontype,
        order_reference_id: `software-setu-${Date.now().toString().slice(-6)}`
       
      },
      {
        headers: {
          Authorization: `Bearer ${growwToken}`,
          "X-API-VERSION": "1.0",
        },
      }
    );

  
    if (placeRes.data.status !== "SUCCESS") {

      await newOrder.update({
        status: "FAILED",
        orderstatuslocaldb: "FAILED",
        text: placeRes.data.message,
        filltime: nowISO,
      });

      return { result: "BROKER_REJECTED" };
    }

    const growwOrderId =
      placeRes.data.payload.groww_order_id;

    await newOrder.update({
      orderid: growwOrderId,
    });


    /* ================= STATUS ================= */

    const statusRes =
      await fetchGrowwOrderStatusWithRetry(
        growwToken,
        growwOrderId,
        segment,
        req
      );

    const orderStatus =
      normalizeStatus(statusRes?.payload?.status);


    if (orderStatus === "REJECTED") {

      await newOrder.update({
        status: "REJECTED",
        orderstatuslocaldb: "REJECTED",
        text: statusRes?.payload?.reason,
      });

      // // AUTO FIFO
      // if (reqInput.transactiontype === "SELL") {
      //   await growwFIFOAutoSell(
      //     user,
      //     reqInput.trading_symbol,
      //     req
      //   );
      // }

      return { result: "BROKER_REJECTED" };
    }


    if (orderStatus === "CANCELLED") {

      await newOrder.update({
        status: "CANCELLED",
        orderstatuslocaldb: "CANCELLED",
      });

      return { result: "CANCELLED" };
    }


    /* ================= TRADES ================= */

    const trades =
      await fetchGrowwTradesWithRetry(
        growwToken,
        growwOrderId,
        segment,
        Number(reqInput.quantity),
        req
      );

    const avgPrice =
      calculateWeightedAveragePrice(trades);

    const totalQty =
      trades.reduce(
        (s, t) => s + t.quantity,
        0
      );


    /* ================= SELL PARTIAL ================= */

    let buyOrder = null;
    let pnl = 0;
    let finalStatus = 'OPEN'
    let positionStatus = 'OPEN'

    if (reqInput.transactiontype === "SELL") {

      // SELL success → finalize temp SELL
      finalStatus = "COMPLETE";
      positionStatus = "COMPLETE";

    buyOrder = await Order.findOne({
      where: {
        userId: user.id,
        orderid: reqInput.buyOrderId,
        status: "COMPLETE",
        orderstatuslocaldb: "OPEN"
      }
    });

    if (buyOrder) {

      const originalQty = Number(buyOrder.fillsize || buyOrder.quantity);
      const usedQty = totalQty;
      const remainingQty = originalQty - usedQty;

      pnl =
        avgPrice * usedQty -
        Number(buyOrder.fillprice) * usedQty;

      // 🟡 PARTIAL SELL
      if (remainingQty > 0) {

        await buyOrder.update({
          fillsize: remainingQty,
          quantity: remainingQty,
          tradedValue:
            Number(buyOrder.tradedValue || 0) -
            (Number(buyOrder.fillprice) * usedQty),
        });

        // 🔥 CREATE BUY SPLIT (MOST IMPORTANT)
        await Order.create({
          variety: buyOrder.variety,
          tradingsymbol: buyOrder.tradingsymbol,
          symboltoken: buyOrder.symboltoken,
          transactiontype: "BUY",
          exchange: buyOrder.exchange,
          ordertype: buyOrder.ordertype,
          producttype: buyOrder.producttype,
          duration: buyOrder.duration,
          quantity: usedQty,
          fillsize: usedQty,
          price: buyOrder.fillprice,
          fillprice: buyOrder.fillprice,
          tradedValue: buyOrder.fillprice * usedQty,
          userId: buyOrder.userId,
          userNameId: buyOrder.userNameId,
          uniqueorderid: buyOrder?.uniqueorderid,
          orderid: buyOrder?.orderid,
          fillid: buyOrder?.fillid,
          broker: "groww",
          strategyName: buyOrder.strategyName,
          strategyUniqueId: buyOrder.strategyUniqueId,
          ordertag: buyOrder.ordertag,
          status: "COMPLETE",
          orderstatuslocaldb: "COMPLETE",
          positionStatus: "COMPLETE",
          text: "BUY_SPLIT_FOR_SELL"
        });

        logSuccess(req,{
          msg:"groww partial SELL executed with BUY split",
          soldQty: usedQty,
          remainingQty
        });
      }

      // 🔴 FULL CLOSE
      if (remainingQty === 0) {

        await buyOrder.update({
          orderstatuslocaldb: "COMPLETE",
          positionStatus: "COMPLETE",
        });

        finalStatus = "COMPLETE"

        logSuccess(req,{
          msg:"groww position fully closed"
        });
      }
    }
  }


    /* ================= BUY MERGE ================= */

    if (
      reqInput.transactiontype === "BUY" &&
      existingBuyOrder
    ) {

      const mergedQty =
        existingBuyOrder.fillsize + totalQty;

      const mergedValue =
        existingBuyOrder.tradedValue +
        avgPrice * totalQty;

      const mergedAvg =
        mergedValue / mergedQty;

      await existingBuyOrder.update({
        fillsize: mergedQty,
        quantity: mergedQty,
        tradedValue: mergedValue,
        fillprice: mergedAvg,
        price:mergedAvg
      });

      await newOrder.destroy();

      return {
        result: "SUCCESS",
        buyId: existingBuyOrder.id
      };
    }


    /* ================= FINAL UPDATE ================= */


    await newOrder.update({
      status: "COMPLETE",
      fillsize: totalQty,
      quantity:totalQty,
      fillprice: avgPrice,
      price:avgPrice,
      fillid:trades[0]?.groww_trade_id,
      uniqueorderid:trades[0]?.exchange_trade_id,
      tradedValue: avgPrice * totalQty,
      filltime: nowISO,
      pnl,
      buyOrderId: buyOrder?.orderid || null,
      buyprice: buyOrder?.fillprice || 0,
      buysize: totalQty || 0,
      buyTime:buyOrder?.filltime,
      buyvalue:buyOrder?.tradedValue,
      positionStatus:finalStatus,
      status: "COMPLETE",
      orderstatuslocaldb: finalStatus,
    });

    return {
      result: "SUCCESS",
      orderid: growwOrderId,
    };

  } catch (err) {

  console.log(err?.message,'================ERR FAILED===============');
    
  console.log("STATUS:", err.response?.status);
  console.log("DATA:", JSON.stringify(err.response?.data, null, 2));
  console.log("HEADERS:", err.response?.headers);

   logError(req, err, {
      msg: "groww unexpected server STATUS during order flow"
    });



    logError(req,  err.response?.status, {
      msg: "groww unexpected server STATUS during order flow",
        error: err.response?.status
    });


     logError(req, JSON.stringify(err.response?.data, null, 2), {
      msg: "groww unexpected server DATA during order flow",
       error:err.response?.data
    });


     logError(req, err.response?.headers, {
      msg: "groww unexpected server HEADERS during order flow",
      error:err.response?.header
    });

    if (newOrder) {

      await newOrder.update({
        status: "FAILED",
        orderstatuslocaldb: "FAILED",
        text: err.message,
      });

    }

    return { result: "ERROR" };
  }
};










// import axios from "axios";
// import Order from "../models/orderModel.js";
// import dayjs from "dayjs";

// const GROWW_BASE_URL = "https://api.groww.in/v1";

// /* ---------------- HELPERS ---------------- */

// const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// const normalizeStatus = (s = "") =>
//   s.toUpperCase().replace(/\s+/g, "_");

// const isFinalStatus = (s) =>
//   ["COMPLETE", "CANCELLED", "REJECTED"].includes(s);

// /* ---------------- ORDER STATUS RETRY ---------------- */

// const fetchGrowwOrderStatusWithRetry = async ({
//   growwToken,
//   growwOrderId,
//   segment = "CASH",
//   maxRetry = 3
// }) => {
//   let lastStatus = null;

//   for (let i = 1; i <= maxRetry; i++) {
//     const res = await axios.get(
//       `${GROWW_BASE_URL}/order/status/${growwOrderId}?segment=${segment}`,
//       {
//         headers: {
//           Accept: "application/json",
//           Authorization: `Bearer ${growwToken}`,
//           "X-API-VERSION": "1.0",
//         },
//       }
//     );

//     lastStatus = res.data;
//     const statusNorm = normalizeStatus(res.data?.payload?.status);

//     if (isFinalStatus(statusNorm)) {
//       return res.data;
//     }

//     await sleep(1200);
//   }

//   return lastStatus;
// };

// /* ---------------- TRADE FETCH ---------------- */

// const fetchGrowwTrades = async ({
//   growwToken,
//   growwOrderId,
//   segment = "CASH",
// }) => {
//   const res = await axios.get(
//     `${GROWW_BASE_URL}/order/trades/${growwOrderId}?segment=${segment}&page=0&page_size=50`,
//     {
//       headers: {
//         Accept: "application/json",
//         Authorization: `Bearer ${growwToken}`,
//         "X-API-VERSION": "1.0",
//       },
//     }
//   );

//   return res.data?.payload || [];
// };

// /* =====================================================
//    PLACE ORDER – GROWW (Finvasia style)
// ===================================================== */

// export const placeGrowwOrder = async (user, reqInput, req) => {
//   let newOrder = null;

//   console.log(reqInput,'===========reqInput===============');
  

//   const nowISO = new Date().toISOString();

//   try {
//     const growwToken = user?.authToken;

//     if (!growwToken) {
//       return { result: "ERROR", message: "Groww token missing" };
//     }

//     /* -------- 1. CREATE LOCAL PENDING ORDER -------- */

//     newOrder = await Order.create({
      
//       userId: user.id,
//       broker: "groww",
//       tradingsymbol: reqInput.trading_symbol,
//       transactiontype: reqInput.transaction_type,
//       producttype: reqInput.product,
//       exchange: reqInput.exchange,
//       quantity: reqInput.quantity,
//       price: reqInput.price,
//       ordertype: reqInput.order_type,
//       orderstatuslocaldb: "PENDING",
//       status: "PENDING",
//     });

//     /* -------- 2. PLACE ORDER ON GROWW -------- */

//     const placeRes = await axios.post(
//       `${GROWW_BASE_URL}/order/create`,
//       {
//         trading_symbol: reqInput.trading_symbol,
//         quantity: reqInput.quantity,
//         price: reqInput.price,
//         trigger_price: reqInput.trigger_price || 0,
//         validity: reqInput.validity || "DAY",
//         exchange: reqInput.exchange || "NSE",
//         segment: reqInput.segment || "CASH",
//         product: reqInput.product || "CNC",
//         order_type: reqInput.order_type,
//         transaction_type: reqInput.transaction_type,
//         order_reference_id: `softwaresetu`,
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Accept: "application/json",
//           Authorization: `Bearer ${growwToken}`,
//           "X-API-VERSION": "1.0",
//         },
//       }
//     );

//     if (placeRes.data.status !== "SUCCESS") {
//       await newOrder.update({
//         status: "FAILED",
//         orderstatuslocaldb: "FAILED",
//         text: placeRes.data.message || "Order rejected",
//       });
//       return { result: "BROKER_REJECTED" };
//     }

//     const growwOrderId = placeRes.data.payload.groww_order_id;
//     await newOrder.update({ orderid: growwOrderId });

//     /* -------- 3. FETCH FINAL ORDER STATUS -------- */

//     const statusRes = await fetchGrowwOrderStatusWithRetry({
//       growwToken,
//       growwOrderId,
//     });

//     const orderStatus = normalizeStatus(
//       statusRes?.payload?.status
//     );

//     if (orderStatus === "REJECTED") {
//       await newOrder.update({
//         status: "REJECTED",
//         orderstatuslocaldb: "REJECTED",
//         text: statusRes.payload?.reason,
//       });
//       return { result: "REJECTED" };
//     }

//     if (orderStatus === "CANCELLED") {
//       await newOrder.update({
//         status: "CANCELLED",
//         orderstatuslocaldb: "CANCELLED",
//       });
//       return { result: "CANCELLED" };
//     }

//     /* -------- 4. FETCH TRADES -------- */

//     const trades = await fetchGrowwTrades({
//       growwToken,
//       growwOrderId,
//     });

//     let totalQty = 0;
//     let totalValue = 0;

//     trades.forEach(t => {
//       totalQty += Number(t.quantity || 0);
//       totalValue += Number(t.quantity || 0) * Number(t.price || 0);
//     });

//     const avgPrice = totalQty ? totalValue / totalQty : 0;

//     /* -------- 5. FINAL DB UPDATE -------- */

//     await newOrder.update({
//       status: "COMPLETE",
//       orderstatuslocaldb: "COMPLETE",
//       fillsize: totalQty,
//       fillprice: avgPrice,
//       tradedValue: totalValue,
//       filltime: dayjs().toISOString(),
//     });

//     return {
//       result: "SUCCESS",
//       broker: "Groww",
//       orderid: growwOrderId,
//     };

//   } catch (err) {
//     console.error("Groww order error:", err?.response?.data || err.message);

//     if (newOrder) {
//       await newOrder.update({
//         status: "FAILED",
//         orderstatuslocaldb: "FAILED",
//         text: err.message,
//       });
//     }

//     return { result: "BROKER_ERROR", message: err.message };
//   }
// };
