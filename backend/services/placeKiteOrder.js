import { getKiteClientForUserId } from "../services/userKiteBrokerService.js";
import Order from "../models/orderModel.js";
import { logSuccess, logError } from "../utils/loggerr.js";




// -------------------- MAPPERS --------------------
function getKiteProductCode(type) {
  if (!type) return "";
  switch (type.toUpperCase()) {
    case "DELIVERY": return "CNC";
    case "CARRYFORWARD": return "NRML";
    case "MARGIN": return "MTF";
    case "INTRADAY": return "MIS";
    case "BO": return "MIS";
    default: return type.toUpperCase();
  }
}

function mapVarietyToKite(variety) {
  if (!variety) return "regular";
  switch (variety.toUpperCase()) {
    case "NORMAL": return "regular";
    case "STOPLOSS": return "co";
    case "ROBO": return "iceberg";
    default: return "regular";
  }
}

// -------------------- HELPERS --------------------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));



async function fetchTradesWithRetry(
  kite,
  orderid,
  expectedQty,
  req,
  retries = 5,
  delayMs = 1200
) {
  let lastTrades = [];

  for (let i = 1; i <= retries; i++) {
    try {
      const trades = await kite.getOrderTrades(orderid);

      const totalQty = Array.isArray(trades)
        ? trades.reduce((sum, t) => sum + Number(t.quantity || 0), 0)
        : 0;

      logSuccess(req, {
        msg: "Kite getOrderTrades retry",
        attempt: i,
        orderid,
        tradesCount: trades?.length || 0,
        totalQty,
        expectedQty,
      });

      // ✅ FULL FILL CONFIRMATION
      if (totalQty >= expectedQty) {
        return trades;
      }

      lastTrades = trades || [];
    } catch (e) {
      logError(req, e, {
        msg: "Kite getOrderTrades failed",
        attempt: i,
        orderid,
        error:e
      });
    }

    if (i < retries) await sleep(delayMs);
  }

  // ❗ retries exhausted → return whatever we got (partial fill)
  return lastTrades;
}


// Calculate weighted average price from trades
function calculateWeightedAveragePrice(trades) {
  let totalValue = 0;
  let totalQuantity = 0;

  trades.forEach(trade => {
    totalValue += trade.average_price * trade.quantity;
    totalQuantity += trade.quantity;
  });

  return totalValue / totalQuantity;
}


// ======================= codde auto sell fetch code start   =======================

async function kiteFIFOWithAPI(kite, symbol,user,req) {

  try {

  const normalize = v => v?.trim().toUpperCase();

  // 1️⃣ Fetch OrderBook & TradeBook
  const [orderBook, tradeBook,postions] = await Promise.all([
    kite.getOrders(),
    kite.getTrades(),
    kite.getPositions()
  ]);

  // console.log(postions,'=================postions===================');
  

  // 2️⃣ Group trades by order_id
  const tradeMap = new Map();
  for (const t of tradeBook) {
    const key = String(t.order_id);
    if (!tradeMap.has(key)) tradeMap.set(key, []);
    tradeMap.get(key).push(t);
  }

  // 3️⃣ Filter COMPLETE orders for symbol (FIFO)
  const orders = orderBook
    .filter(o =>
      normalize(o.tradingsymbol) === normalize(symbol) &&
      o.status === "COMPLETE"
    )
    .sort(
      (a, b) =>
        new Date(a.exchange_timestamp) - new Date(b.exchange_timestamp)
    );

  const buyQueue = [];
  const results = [];

  // 4️⃣ FIFO Matching
  for (const o of orders) {
    // ===== BUY =====
    if (o.transaction_type === "BUY") {
      const trades = tradeMap.get(String(o.order_id)) || [];
      if (!trades.length) continue;

      let qty = 0;
      let value = 0;

      for (const t of trades) {
        const q = Number(t.quantity || 0);
        const p = Number(t.average_price || o.price || 0);
        qty += q;
        value += q * p;
      }

      if (!qty) continue;

      buyQueue.push({
        qty,
        price: value / qty,
        orderid: o.order_id,
        time: o.exchange_timestamp
      });
    }

    
    
    // ===== SELL =====
    if (o.transaction_type === "SELL") {
      const trades = tradeMap.get(String(o.order_id)) || [];
      if (!trades.length) {
        // Agar trade nahi milti, to order ki price use karein
        const sellQty = Number(o.quantity || 0);
        const sellPrice = Number(o.average_price || 0);
        if (!sellQty || !sellPrice) continue;

        let remainingQty = sellQty;
        let pnl = 0;
        const buyOrderIds = [];

        while (remainingQty > 0 && buyQueue.length) {
          const buy = buyQueue[0];
          const matchedQty = Math.min(buy.qty, remainingQty);
          pnl += (sellPrice - buy.price) * matchedQty;
          remainingQty -= matchedQty;
          buy.qty -= matchedQty;
          buyOrderIds.push(buy.orderid);
          if (buy.qty === 0) buyQueue.shift();
        }

        results.push({
          symbol: o.tradingsymbol,
          buyOrderIds,
          sellOrderId: o.order_id,
          ordertag: o?.tag || "User Manual Sell",
          sellUniqueOrderId: o.order_id,
          sellPriceAvg: Number(sellPrice.toFixed(2)),
          quantity: sellQty,
          pnl: Number(pnl.toFixed(2)),
          sellFillIds: [],
          sellTradeIds: [],
          buyTime: buyOrderIds.length ? buyQueue[0]?.time : null,
          sellTime: o.exchange_timestamp,
          broker: "KITE"
        });
        continue;
      }

      // Trades mil gayi hain, to unse average price aur total quantity nikalein
      let sellQty = 0;
      let sellValue = 0;

      for (const t of trades) {
        const q = Number(t.quantity || 0);
        const p = Number(t.average_price || o.price || 0);
        sellQty += q;
        sellValue += q * p;
      }

      if (!sellQty) continue;

      const avgSellPrice = sellValue / sellQty;

      let remainingQty = sellQty;
      let pnl = 0;
      const buyOrderIds = [];

      while (remainingQty > 0 && buyQueue.length) {
        const buy = buyQueue[0];
        const matchedQty = Math.min(buy.qty, remainingQty);
        pnl += (avgSellPrice - buy.price) * matchedQty;
        remainingQty -= matchedQty;
        buy.qty -= matchedQty;
        buyOrderIds.push(buy.orderid);
        if (buy.qty === 0) buyQueue.shift();
      }

      results.push({
        symbol: o.tradingsymbol,
        buyOrderIds,
        sellOrderId: o.order_id,
        ordertag: o?.tag || "User Manual Sell",
        sellUniqueOrderId: o.order_id,
        sellPriceAvg: Number(avgSellPrice.toFixed(2)),
        quantity: sellQty,
        pnl: Number(pnl.toFixed(2)),
        sellFillIds: trades.map(t => t.trade_id),
        sellTradeIds: trades.map(t => t.trade_id),
        buyTime: buyOrderIds.length ? buyQueue[0]?.time : null,
        sellTime: o.exchange_timestamp,
        broker: "KITE"
      });
    }
  }

  // 5️⃣ Database Update Logic (SAME AS ANGELONE)
  if (results.length > 0) {
    let orderBuyFind = await Order.findOne({
      where: {
        orderid: results[0]?.buyOrderIds[0],
        transactiontype: "BUY"
      },
      order: [["createdAt", "ASC"]],
      raw: true
    });

    const sellPayload = {
      userId: orderBuyFind?.userId || "",
      userNameId: orderBuyFind?.userNameId || "",
      tradingsymbol: orderBuyFind?.tradingsymbol || "",
      variety: orderBuyFind?.variety || "",
      ordertype: orderBuyFind?.ordertype || "",
      producttype: orderBuyFind?.producttype || "",
      duration: orderBuyFind?.duration || "",
      exchange: orderBuyFind?.exchange || "",
      symboltoken: orderBuyFind?.symboltoken || "",
      instrumenttype: orderBuyFind?.instrumenttype || "",
      optiontype: orderBuyFind?.optiontype || "",
      text: "User Manual Sell",
      ordertag: "User Manual Sell",
      kiteToken: orderBuyFind?.kiteToken || "",
      kiteSymbol: orderBuyFind?.kiteSymbol || "",
      strategyName: orderBuyFind?.strategyName || "",
      strategyUniqueId: orderBuyFind?.strategyUniqueId || "",
      transactiontype: "SELL",
      orderid: results[0]?.sellOrderId || "",
      uniqueorderid: results[0]?.sellUniqueOrderId || "",
      quantity: orderBuyFind?.fillsize||results[0]?.quantity || 0,
      actualQuantity: results[0]?.quantity || 0,
      buyOrderId: orderBuyFind?.orderid || "",
      buyTime: orderBuyFind?.filltime || "",
      buysize: orderBuyFind?.fillsize || "",
      buyprice: orderBuyFind?.fillprice || "",
      buyvalue: orderBuyFind?.tradedValue || "",
      price: results[0]?.sellPriceAvg || "",
      fillprice: results[0]?.sellPriceAvg || 0,
      fillid: results[0]?.sellFillIds[0] || 0,
      tradedValue: (results[0]?.sellPriceAvg * (orderBuyFind?.fillsize||results[0]?.quantity)) || 0,
      fillsize: orderBuyFind?.fillsize||results[0]?.quantity || 0,
      pnl: Number(results[0]?.pnl.toFixed(5)) || 0,
      status: "COMPLETE",
      orderstatus: "COMPLETE",
      positionStatus: "COMPLETE",
      orderstatuslocaldb: "COMPLETE",
      filltime: new Date(results[0]?.sellTime).toISOString(),
      broker: orderBuyFind?.broker || "KITE",
    };


   
    

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
  }

  
  return results;
    
  } catch (err) {

    console.log(err);
    

     logError(req,err, {
        msg: "angelOneFIFOWithAPI",
        error:err?.message||err,
        userId:user?.id
      });

       return [];
    
  }

}

// ======================= codde auto sell fetch code end   =======================

const hasOpenPosition = (positionData, tradingSymbol) => {
  return positionData.net.some(
    (pos) =>
      pos.tradingsymbol === tradingSymbol && pos.quantity !== 0
  );
};


// ========================= UPDATED placeKiteOrder with Partial SELL ========================
export const placeKiteOrder = async (user, reqInput, req, useMappings = true) => {
  let newOrder = null;
  let existingBuyOrder = null;
  const nowISOError = new Date().toISOString();

  try {
    const kite = await getKiteClientForUserId(user.id);

    const kiteProductType = useMappings ? getKiteProductCode(reqInput.productType) : reqInput.productType;
    const kiteVariety = useMappings ? mapVarietyToKite(reqInput.variety) : reqInput.variety;

    // 1️⃣ READ EXISTING BUY (NO UPDATE HERE)
    if ((reqInput.transactiontype || "").toUpperCase() === "BUY") {
      existingBuyOrder = await Order.findOne({
        where: {
          userId: user.id,
          tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
          producttype: kiteProductType,
          ordertype: reqInput.orderType,
          transactiontype: "BUY",
          orderstatuslocaldb: "OPEN",
          status: "COMPLETE",
        },
      });

      if (existingBuyOrder) {
        logSuccess(req, {
          msg: "Existing BUY found for potential merge",
          buyOrderId: existingBuyOrder.id
        });
      }
    }

    // 2️⃣ ALWAYS CREATE NEW TEMP ORDER
    const orderData = {
      tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
      symboltoken: reqInput.kiteToken || reqInput.token,
      exchange: reqInput.exch_seg,
      transactiontype: reqInput.transactiontype.toUpperCase(),
      ordertype: reqInput.orderType,
      producttype: kiteProductType,
      duration: reqInput.duration,
      squareoff: reqInput.squareoff || 0,
      stoploss: reqInput.stoploss || 0,
      variety: kiteVariety,
      quantity: String(reqInput.quantity),
      fillsize: String(reqInput.quantity),
      price: Number(reqInput.price || 0),
      orderstatuslocaldb: "PENDING",
      userId: user.id,
      userNameId: user.username,
      broker: "kite",
      ordertag: "softwaresetu",
      buyOrderId: reqInput?.buyOrderId || null,
      strategyName: reqInput?.groupName || "",
      strategyUniqueId: reqInput?.strategyUniqueId || "",
      angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
      angelOneToken: reqInput.angelOneToken || reqInput.token,
      text: reqInput?.text||"",
    };


    if(reqInput.transactiontype.toUpperCase()==='SELL')  {

       logSuccess(req, {
        msg: "Before Check User Position for SELL order ",
      });

      let getpositionData =  await kite.getPositions()

       logSuccess(req, {
        msg: "After Check User Position for SELL order ",
      });

        const isOpen = hasOpenPosition(
                      getpositionData,
                      reqInput.kiteSymbol
                    );

          if(!isOpen) {

           await kiteFIFOWithAPI(kite,reqInput?.kiteSymbol,user,req)

          return { result: "BROKER_REJECTED", orderid:"" };
          
          }
    }
   
   

    newOrder = await Order.create(orderData);

    logSuccess(req, {
      msg: `Temp ${orderData.transactiontype} created`,
      tempOrderId: newOrder.id,
      qty: orderData.quantity
    });

    // 3️⃣ PLACE BROKER ORDER
    let placeRes;
    try {
      placeRes = await kite.placeOrder(kiteVariety, {
        exchange: orderData.exchange,
        tradingsymbol: orderData.tradingsymbol,
        transaction_type: orderData.transactiontype,
        quantity: Number(reqInput.quantity),
        product: kiteProductType,
        order_type: reqInput.orderType,
        price: Number(reqInput.price || 0),
        tag: "softwaresetu",
      });

      logSuccess(req, {
        msg: "Kite API responded success for placement",
        tempOrderId: newOrder.id,
        brokerStatus: "PLACED"
      });
    } catch (err) {
      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        positionStatus: "FAILED",
        text: err.message,
        filltime: nowISOError,
      });

      logError(req, err, {
        msg: "Kite placement failed (REJECTED)",
        error:err
      });

      return { result: "BROKER_REJECTED" };
    }

    const orderid = placeRes.order_id;
    await newOrder.update({ orderid });

    // 4️⃣ TRADEBOOK FETCH WITH RETRY
    const trades = await fetchTradesWithRetry(kite, orderid, Number(reqInput.quantity), req);

    // 🛑 No trades? Check order status in orderbook
if (!trades?.length) {
  const orderInfo = await kite.getOrderHistory(orderid)
    .catch(() => []);

  const lastState = orderInfo?.slice?.(-1)?.[0];  // last history event

  if (lastState?.status === "REJECTED") {
    await newOrder.update({
      status: lastState.status || "REJECTED",
      orderstatuslocaldb: lastState.status || "REJECTED",
      positionStatus: lastState.status || "REJECTED",
      text: lastState.status_message || "BROKER_REJECTED",
      filltime: new Date().toISOString(),
    });

    logError(req, {
      msg: "Order rejected after placement",
      orderid,
      reason: lastState?.status_message
    });


     if(reqInput.transactiontype.toUpperCase()==='SELL'&& lastState?.status?.toUpperCase()==='REJECTED') {

         await kiteFIFOWithAPI(kite,reqInput?.kiteSymbol,user,req)
           
      }


    return { result: "BROKER_REJECTED", orderid };
  }

  if (lastState?.status === "CANCELLED") {
    await newOrder.update({
      status:lastState.status || "CANCELLED",
      orderstatuslocaldb: lastState.status || "CANCELLED",
      positionStatus:lastState.status || "CANCELLED",
      text: lastState.status_message || "BROKER_CANCELLED",
      filltime: new Date().toISOString(),
    });

    return { result: "BROKER_CANCELLED", orderid };
  }
        // OPEN
      if (lastState?.status === "OPEN") {
        await newOrder.update({
          status: "OPEN",
          orderstatuslocaldb: "OPEN",
          positionStatus: "OPEN",
          text: lastState.status_message || "Order open",
        });

        return { result: "OPEN", orderid };
      }

      // PENDING
      if (
        lastState?.status === "PENDING" || 
        lastState?.status === "TRIGGER PENDING" || 
        lastState?.status === "TRIGGER_PENDING"
      ) {
        await newOrder.update({
          status: "PENDING",
          orderstatuslocaldb: "PENDING",
          positionStatus: "PENDING",
          text: lastState.status_message || "Order pending",
        });

        return { result: "PENDING", orderid };
      }

        // otherwise still pending
        return { result: "PENDING", orderid };
      }


    const avgPrice = calculateWeightedAveragePrice(trades);
    const totalQty = trades.reduce((s, t) => s + t.quantity, 0);
    const firstFill = trades[0];

    let finalStatus = "OPEN";
    let positionStatus = "OPEN";
    let buyOrder = null;


    // ====================== SELL PROCESSING ======================
    if (orderData.transactiontype === "SELL") {
      buyOrder = await Order.findOne({
        where: { userId: user.id, orderid: reqInput.buyOrderId,orderstatuslocaldb:"OPEN",status: "COMPLETE" },
      });

      if (buyOrder) {
        const originalQty = Number(buyOrder.fillsize || buyOrder.quantity);
        const usedQty = totalQty;
        const remainingQty = originalQty - usedQty;

        finalStatus = "COMPLETE";
        positionStatus = "COMPLETE";

        // 🟡 Partial SELL
        if (remainingQty > 0) {
          await buyOrder.update({
            fillsize: remainingQty,
            quantity: remainingQty,
            tradedValue: (Number(buyOrder.tradedValue || 0) - ((Number(buyOrder.fillprice || buyOrder.price)) * usedQty)),
          });

          // Insert BUY clone
          const buyFillPrice = Number(buyOrder.fillprice || buyOrder.price);
          await Order.create({
            variety: buyOrder.variety,
            tradingsymbol: buyOrder.tradingsymbol,
            instrumenttype: buyOrder.instrumenttype,
            symboltoken: buyOrder.symboltoken,
            transactiontype: "BUY",
            exchange: buyOrder.exchange,
            ordertype: buyOrder.ordertype,
            producttype: buyOrder.producttype,
            duration: buyOrder.duration,
            quantity: usedQty,
            fillsize: usedQty,
            price: buyFillPrice,
            fillprice: buyFillPrice,
            tradedValue: buyFillPrice * usedQty,
            userId: buyOrder.userId,
            userNameId: buyOrder.userNameId,
            broker: buyOrder.broker,
            angelOneSymbol: buyOrder.angelOneSymbol,
            angelOneToken: buyOrder.angelOneToken,
            strategyName: buyOrder.strategyName,
            strategyUniqueId: buyOrder.strategyUniqueId,
            filltime: buyOrder.filltime,
            uniqueorderid: buyOrder.uniqueorderid,
            orderid: buyOrder.orderid,
            fillid: buyOrder.fillid,
            ordertag:buyOrder.ordertag,
            status: "COMPLETE",
            orderstatuslocaldb: "COMPLETE",
            positionStatus: "COMPLETE",
            text: "BUY_SPLIT_FOR_SELL",
          });

          logSuccess(req, {
            msg: `Partial SELL split created`,
            soldQty: usedQty,
            remainingQty,
            id:buyOrder?.id
          });
        }

        // 🔴 Full SELL close
        if (remainingQty === 0) {
          await buyOrder.update({
            orderstatuslocaldb: "COMPLETE",
            positionStatus: "COMPLETE",
          });
        }
      }
    }

    const pnl =
      newOrder.transactiontype === "SELL" && buyOrder
        ? avgPrice * totalQty - Number(buyOrder?.fillprice) * totalQty
        : 0;

    // ====================== BUY MERGE ======================
    if (newOrder.transactiontype === "BUY" && existingBuyOrder) {
      const mergedQty = Number(existingBuyOrder.fillsize || 0) + totalQty;
      const mergedValue = Number(existingBuyOrder.tradedValue || 0) + avgPrice * totalQty;
      const mergedAvg = mergedValue / mergedQty;

      await existingBuyOrder.update({
        fillsize: mergedQty,
        quantity: mergedQty,
        tradedValue: mergedValue,
        price: mergedAvg,
        fillprice: mergedAvg,
      });

      await newOrder.destroy();

      logSuccess(req, {
        msg: "BUY merged safely with existing BUY",
        mergedQty,
      });

      return { result: "SUCCESS", buyId: existingBuyOrder.id };
    }

    // =================== FINAL UPDATE FOR THIS ORDER ==================
    await newOrder.update({
      tradedValue: avgPrice * totalQty,
      fillprice: avgPrice,
      price: avgPrice,
      fillsize: totalQty,
      quantity: totalQty,
      uniqueorderid: firstFill?.exchange_order_id,
      filltime: firstFill?.fill_timestamp
        ? new Date(firstFill.fill_timestamp).toISOString()
        : nowISOError,
      fillid: firstFill?.trade_id,
      pnl,
      buyOrderId: buyOrder?.orderid || null,
      buyprice: buyOrder?.fillprice||0,
      buyTime: buyOrder?.filltime||null,
      buysize: totalQty||0,
      buyvalue: totalQty*buyOrder?.fillprice||0,
      positionStatus,
      status: "COMPLETE",
      orderstatuslocaldb: finalStatus,
    });

    logSuccess(req, {
      msg: `${newOrder.transactiontype} completed`,
      tempOrderId: newOrder.id,
      pnl
    });

    return { result: "SUCCESS", orderid };

  } catch (err) {
    logError(req, err, { msg: "Kite unexpected error",error:err });

    if (newOrder?.id) {
      await newOrder.update({
        orderstatuslocaldb: "FAILED",
        status: "FAILED",
        positionStatus: "FAILED",
        text: err.message,
        filltime: nowISOError,
      });
    }
    return { result: "ERROR" };
  }
};



// =======================test codde auto sell fetch code start   =======================

async function kiteFIFOWithAPI1(kite, symbol) {
  const normalize = v => v?.trim().toUpperCase();

  // 1️⃣ Fetch OrderBook & TradeBook
  const [orderBook, tradeBook] = await Promise.all([
    kite.getOrders(),
    kite.getTrades()
  ]);

  // 2️⃣ Group trades by order_id
  const tradeMap = new Map();
  for (const t of tradeBook) {
    const key = String(t.order_id);
    if (!tradeMap.has(key)) tradeMap.set(key, []);
    tradeMap.get(key).push(t);
  }

  // 3️⃣ Filter COMPLETE orders for symbol (FIFO)
  const orders = orderBook
    .filter(o =>
      normalize(o.tradingsymbol) === normalize(symbol) &&
      o.status === "COMPLETE"
    )
    .sort(
      (a, b) =>
        new Date(a.exchange_timestamp) - new Date(b.exchange_timestamp)
    );

  const buyQueue = [];
  const results = [];

  // 4️⃣ FIFO Matching
  for (const o of orders) {
    // ===== BUY =====
    if (o.transaction_type === "BUY") {
      const trades = tradeMap.get(String(o.order_id)) || [];
      if (!trades.length) continue;

      let qty = 0;
      let value = 0;

      for (const t of trades) {

        console.log(t,'======t-====');
        
        const q = Number(t.quantity || 0);
        const p = Number(t.average_price || o.price || 0);
        qty += q;
        value += q * p;
      }

      if (!qty) continue;

      buyQueue.push({
        qty,
        price: value / qty,
        orderid: o.order_id,
        time: o.exchange_timestamp
      });
    }

    console.log(o,'=============0=========');
    
    // ===== SELL =====
    if (o.transaction_type === "SELL") {
      const trades = tradeMap.get(String(o.order_id)) || [];
      if (!trades.length) {
        // Agar trade nahi milti, to order ki price use karein
        const sellQty = Number(o.quantity || 0);
        const sellPrice = Number(o.average_price || 0);
        if (!sellQty || !sellPrice) continue;

        let remainingQty = sellQty;
        let pnl = 0;
        const buyOrderIds = [];

        while (remainingQty > 0 && buyQueue.length) {
          const buy = buyQueue[0];
          const matchedQty = Math.min(buy.qty, remainingQty);
          pnl += (sellPrice - buy.price) * matchedQty;
          remainingQty -= matchedQty;
          buy.qty -= matchedQty;
          buyOrderIds.push(buy.orderid);
          if (buy.qty === 0) buyQueue.shift();
        }

        results.push({
          symbol: o.tradingsymbol,
          buyOrderIds,
          sellOrderId: o.order_id,
          ordertag: o?.tag || "User Manual Sell",
          sellUniqueOrderId: o.order_id,
          sellPriceAvg: Number(sellPrice.toFixed(2)),
          quantity: sellQty,
          pnl: Number(pnl.toFixed(2)),
          sellFillIds: [],
          sellTradeIds: [],
          buyTime: buyOrderIds.length ? buyQueue[0]?.time : null,
          sellTime: o.exchange_timestamp,
          broker: "KITE"
        });
        continue;
      }

      // Trades mil gayi hain, to unse average price aur total quantity nikalein
      let sellQty = 0;
      let sellValue = 0;

      for (const t of trades) {
        const q = Number(t.quantity || 0);
        const p = Number(t.average_price || o.price || 0);
        sellQty += q;
        sellValue += q * p;
      }

      if (!sellQty) continue;

      const avgSellPrice = sellValue / sellQty;

      let remainingQty = sellQty;
      let pnl = 0;
      const buyOrderIds = [];

      while (remainingQty > 0 && buyQueue.length) {
        const buy = buyQueue[0];
        const matchedQty = Math.min(buy.qty, remainingQty);
        pnl += (avgSellPrice - buy.price) * matchedQty;
        remainingQty -= matchedQty;
        buy.qty -= matchedQty;
        buyOrderIds.push(buy.orderid);
        if (buy.qty === 0) buyQueue.shift();
      }

      results.push({
        symbol: o.tradingsymbol,
        buyOrderIds,
        sellOrderId: o.order_id,
        ordertag: o?.tag || "User Manual Sell",
        sellUniqueOrderId: o.order_id,
        sellPriceAvg: Number(avgSellPrice.toFixed(2)),
        quantity: sellQty,
        pnl: Number(pnl.toFixed(2)),
        sellFillIds: trades.map(t => t.trade_id),
        sellTradeIds: trades.map(t => t.trade_id),
        buyTime: buyOrderIds.length ? buyQueue[0]?.time : null,
        sellTime: o.exchange_timestamp,
        broker: "KITE"
      });
    }
  }

  // 5️⃣ Database Update Logic (SAME AS ANGELONE)
  if (results.length > 0) {
    let orderBuyFind = await Order.findOne({
      where: {
        orderid: results[0]?.buyOrderIds[0],
        transactiontype: "BUY"
      },
      order: [["createdAt", "ASC"]],
      raw: true
    });

    const sellPayload = {
      userId: orderBuyFind?.userId || "",
      userNameId: orderBuyFind?.userNameId || "",
      tradingsymbol: orderBuyFind?.tradingsymbol || "",
      variety: orderBuyFind?.variety || "",
      ordertype: orderBuyFind?.ordertype || "",
      producttype: orderBuyFind?.producttype || "",
      duration: orderBuyFind?.duration || "",
      exchange: orderBuyFind?.exchange || "",
      symboltoken: orderBuyFind?.symboltoken || "",
      instrumenttype: orderBuyFind?.instrumenttype || "",
      optiontype: orderBuyFind?.optiontype || "",
      text: "User Manual Sell",
      ordertag: "User Manual Sell",
      kiteToken: orderBuyFind?.kiteToken || "",
      kiteSymbol: orderBuyFind?.kiteSymbol || "",
      strategyName: orderBuyFind?.strategyName || "",
      strategyUniqueId: orderBuyFind?.strategyUniqueId || "",
      transactiontype: "SELL",
      orderid: results[0]?.sellOrderId || "",
      uniqueorderid: results[0]?.sellUniqueOrderId || "",
      quantity: results[0]?.quantity || 0,
      actualQuantity: results[0]?.quantity || 0,
      buyOrderId: orderBuyFind?.orderid || "",
      buyTime: orderBuyFind?.filltime || "",
      buysize: orderBuyFind?.fillsize || "",
      buyprice: orderBuyFind?.fillprice || "",
      buyvalue: orderBuyFind?.tradedValue || "",
      price: results[0]?.sellPriceAvg || "",
      fillprice: results[0]?.sellPriceAvg || 0,
      fillid: results[0]?.sellFillIds[0] || 0,
      tradedValue: (results[0]?.sellPriceAvg * results[0]?.quantity) || 0,
      fillsize: results[0]?.quantity || 0,
      pnl: Number(results[0]?.pnl.toFixed(5)) || 0,
      status: "COMPLETE",
      orderstatus: "COMPLETE",
      positionStatus: "COMPLETE",
      orderstatuslocaldb: "COMPLETE",
      filltime: new Date(results[0]?.sellTime).toISOString(),
      broker: orderBuyFind?.broker || "KITE",
    };

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
  }

  console.log(results, "========== FINAL KITE FIFO ==========");
  return results;
}





//  const kite = await getKiteClientForUserId(43);

// const trades =  await kiteFIFOWithAPI(
//   kite, // authenticated kite client
//   "NIFTY26JAN25300CE"
// );


// =======================test codde auto sell fetch code end   =======================


// ========================= aws running code======================


// import { getKiteClientForUserId } from "../services/userKiteBrokerService.js";
// import Order from "../models/orderModel.js";
// import { logSuccess, logError } from "../utils/loggerr.js";



// // -------------------- MAPPERS --------------------
// function getKiteProductCode(type) {
//   if (!type) return "";
//   switch (type.toUpperCase()) {
//     case "DELIVERY": return "CNC";
//     case "CARRYFORWARD": return "NRML";
//     case "MARGIN": return "MTF";
//     case "INTRADAY": return "MIS";
//     case "BO": return "MIS";
//     default: return type.toUpperCase();
//   }
// }

// function mapVarietyToKite(variety) {
//   if (!variety) return "regular";
//   switch (variety.toUpperCase()) {
//     case "NORMAL": return "regular";
//     case "STOPLOSS": return "co";
//     case "ROBO": return "iceberg";
//     default: return "regular";
//   }
// }

// // -------------------- HELPERS --------------------
// const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// async function fetchTradesWithRetry121(kite, orderid, req, retries = 3, delayMs = 1200) {
//   for (let i = 1; i <= retries; i++) {
//     try {

//       const trades = await kite.getOrderTrades(orderid);
//       logSuccess(req, {
//         msg: "Kite getOrderTrades retry",
//         attempt: i,
//         orderid,
//         tradesCount: Array.isArray(trades) ? trades.length : 0,
//       });
//       if (Array.isArray(trades) && trades.length > 0) return trades;
//     } catch (e) {
//       logError(req, e, { msg: "Kite getOrderTrades failed", attempt: i, orderid });
//     }
//     if (i < retries) await sleep(delayMs);
//   }
//   return [];
// }
// 
// async function fetchTradesWithRetry(
//   kite,
//   orderid,
//   expectedQty,
//   req,
//   retries = 5,
//   delayMs = 1200
// ) {
//   let lastTrades = [];

//   for (let i = 1; i <= retries; i++) {
//     try {
//       const trades = await kite.getOrderTrades(orderid);

//       const totalQty = Array.isArray(trades)
//         ? trades.reduce((sum, t) => sum + Number(t.quantity || 0), 0)
//         : 0;

//       logSuccess(req, {
//         msg: "Kite getOrderTrades retry",
//         attempt: i,
//         orderid,
//         tradesCount: trades?.length || 0,
//         totalQty,
//         expectedQty,
//       });

//       // ✅ FULL FILL CONFIRMATION
//       if (totalQty >= expectedQty) {
//         return trades;
//       }

//       lastTrades = trades || [];
//     } catch (e) {
//       logError(req, e, {
//         msg: "Kite getOrderTrades failed",
//         attempt: i,
//         orderid,
//       });
//     }

//     if (i < retries) await sleep(delayMs);
//   }

//   // ❗ retries exhausted → return whatever we got (partial fill)
//   return lastTrades;
// }




// async function findBuyOrderForSell({ userId, reqInput, req }) {
//   if (reqInput?.buyOrderId) {
//     const buyOrder = await Order.findOne({
//       where: {
//         userId,
//         orderid: String(reqInput.buyOrderId),
//         transactiontype: "BUY",
//         // producttype: reqInput.productType,
//         // ordertype: reqInput.orderType,
//         status: "COMPLETE",
//         orderstatuslocaldb: "OPEN",
//       },
//       raw: true,
//     });
//     logSuccess(req, { msg: "BUY match by buyOrderId", buyOrderId: reqInput.buyOrderId, found: !!buyOrder });
//     if (buyOrder) return buyOrder;
//   }

// }

// // Calculate weighted average price from trades
// function calculateWeightedAveragePrice(trades) {
//   let totalValue = 0;
//   let totalQuantity = 0;

//   trades.forEach(trade => {
//     totalValue += trade.average_price * trade.quantity;
//     totalQuantity += trade.quantity;
//   });

//   return totalValue / totalQuantity;
// }

// // ======================================================================
// // ✅ Unified placeKiteOrder (handles both mapped and direct inputs)
// // ======================================================================

// // ======================================================================
// // ✅ SAFE BUY MERGE KITE ORDER
// // ======================================================================




// export const placeKiteOrder = async (user, reqInput, req,useMappings = true) => {

//   let newOrder = null;
//   let existingBuyOrder = null;
//   const nowISOError = new Date().toISOString();

//   try {

//     const kite = await getKiteClientForUserId(user.id);

//     const kiteProductType = useMappings ? getKiteProductCode(reqInput.productType) : reqInput.productType;
//     const kiteVariety = useMappings ? mapVarietyToKite(reqInput.variety) : reqInput.variety;


//     // 🔑 READ ONLY existing BUY (NO UPDATE)
//     if ((reqInput.transactiontype || "").toUpperCase() === "BUY") {
//       existingBuyOrder = await Order.findOne({
//         where: {
//           userId: user.id,
//           tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
//           producttype: kiteProductType,
//           ordertype: reqInput.orderType,
//           transactiontype: "BUY",
//           orderstatuslocaldb: "OPEN",
//         },
//       });
//     }

//     // ✅ ALWAYS CREATE NEW ORDER
//     const orderData = {
//       tradingsymbol: reqInput.kiteSymbol || reqInput.symbol,
//       symboltoken: reqInput.kiteToken || reqInput.token,
//       exchange: reqInput.exch_seg,
//       transactiontype: reqInput.transactiontype.toUpperCase(),
//       ordertype: reqInput.orderType,
//       producttype: kiteProductType,
//       duration: reqInput.duration,
//       squareoff: reqInput.squareoff || 0,
//       stoploss: reqInput.stoploss || 0,
//       variety: kiteVariety,
//       quantity: String(reqInput.quantity),
//       price: Number(reqInput.price || 0),
//       orderstatuslocaldb: "PENDING",
//       userId: user.id,
//       userNameId: user.username,
//       broker: "kite",
//       ordertag: "softwaresetu",
//       buyOrderId: reqInput?.buyOrderId || null,
//       strategyName: reqInput?.groupName || "",
//       strategyUniqueId: reqInput?.strategyUniqueId || "",
//       angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
//       angelOneToken: reqInput.angelOneToken || reqInput.token,
//     };

//     newOrder = await Order.create(orderData);
//     // ---------------- PLACE ORDER ----------------
//     let placeRes;
//     try {
//       placeRes = await kite.placeOrder(kiteVariety, {
//         exchange: reqInput.exch_seg,
//         tradingsymbol: orderData.tradingsymbol,
//         transaction_type: orderData.transactiontype,
//         quantity: Number(reqInput.quantity),
//         product: kiteProductType,
//         order_type: reqInput.orderType,
//         price: Number(reqInput.price || 0),
//         tag: "softwaresetu",
//       });
//     } catch (err) {
//       await newOrder.update({
//         orderstatuslocaldb: "FAILED",
//         status: "FAILED",
//         positionStatus: "FAILED",
//         text: err.message,
//         filltime: nowISOError,
//       });
//       return { result: "BROKER_REJECTED" };
//     }

//     const orderid = placeRes.order_id;
//     await newOrder.update({ orderid });

//     // ---------------- TRADEBOOK ----------------
//     const trades = await fetchTradesWithRetry(kite, orderid, Number(reqInput.quantity), req);
//       // const trades = await fetchTradesWithRetry(kite, orderid, req);
      
//     if (!trades.length) return { result: "SUCCESS", orderid };

//     const avgPrice = calculateWeightedAveragePrice(trades);
//     const totalQty = trades.reduce((s, t) => s + t.quantity, 0);

//     let finalStatus = "OPEN";
//     let positionStatus = "OPEN";
//     let buyOrder = null;

//     // ---------------- SELL PAIRING ----------------
//     if (orderData.transactiontype === "SELL") {
//       buyOrder = await Order.findOne({
//         where: {
//           userId: user.id,
//           orderid: reqInput.buyOrderId,
//         },
//       });

//       if (buyOrder) {
//         await buyOrder.update({
//           orderstatuslocaldb: "COMPLETE",
//           positionStatus: "COMPLETE",
//         });
//       }
//       finalStatus = "COMPLETE";
//       positionStatus = "COMPLETE";

//  }

//     const pnl =
//       orderData.transactiontype === "SELL" && buyOrder
//         ? ((avgPrice * totalQty) - (buyOrder.fillprice * buyOrder.fillsize))
//         : 0;

//     // ================= SAFE BUY MERGE =================
//     if (orderData.transactiontype === "BUY" && existingBuyOrder) {

//       const mergedQty =
//         Number(existingBuyOrder.fillsize || 0) + totalQty;

//       const mergedValue =
//         Number(existingBuyOrder.tradedValue || 0) +
//         avgPrice * totalQty;

//       const mergedAvg = mergedValue / mergedQty;

//       await existingBuyOrder.update({
//         fillsize: mergedQty,
//         quantity: mergedQty,
//         tradedValue: mergedValue,
//         price: mergedAvg,
//         fillprice: mergedAvg,
//       });

//       await newOrder.destroy();

//       return {
//         result: "SUCCESS",
//         mergedInto: existingBuyOrder.id,
//       };
//     }

//     // ================= NORMAL FINAL UPDATE =================
//     await newOrder.update({
//       tradedValue: avgPrice * totalQty,
//       price: avgPrice,
//       fillprice: avgPrice,
//       fillsize: totalQty,
//       quantity: totalQty,
//       uniqueorderid:trades[0]?.exchange_order_id,
//       filltime: trades[0]?.fill_timestamp
//         ? new Date(trades[0].fill_timestamp).toISOString()
//         : nowISOError,
//       fillid: trades[0]?.trade_id,
//       pnl,
//       buyOrderId: buyOrder?.orderid || "NA",
//       buyTime:buyOrder?.filltime,
//       buyprice: buyOrder?.fillprice,
//       buysize: buyOrder?.fillsize,
//       buyvalue: buyOrder?.tradedValue,
//       positionStatus,
//       status: "COMPLETE",
//       orderstatuslocaldb: finalStatus,
//     });

// return {
//        result: "SUCCESS", orderid
//        };

//   } catch (err) {
//     logError(req, err, { msg: "Kite unexpected error" });
//     if (newOrder?.id) {
//       await newOrder.update({
//         orderstatuslocaldb: "FAILED",
//         status: "FAILED",
//         positionStatus: "FAILED",
//         filltime: nowISOError,
//       });
//     }
//     return { result: "ERROR" };
//   }
// };










