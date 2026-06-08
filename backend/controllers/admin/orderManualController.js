

import Order from "../../models/orderModel.js";
import User from "../../models/userModel.js";
import { v4 as uuidv4 } from "uuid";
import { Op } from "sequelize";
import sequelize from "../../config/db.js";
import {emitOrderGet} from "../../services/smartapiFeed.js"
import { generateStrategyUniqueId } from "../../utils/randomWords.js";

import axios from 'axios';



// 15 digit order ID
function generateOrderId() {
  return Date.now().toString() + Math.floor(1000 + Math.random() * 9000);
}

// UUID v4
function generateUniqueOrderUUID() {
  return uuidv4();
}

// 7 digit fill ID
function generateFillId() {
  return Math.floor(1000000 + Math.random() * 9000000);
}

const BROKER_FIELD_MAP = {
  kite: {
    symbol: "kiteSymbol",
    token: "kiteToken",
    exchange: "kiteExchange",
  },
  groww: {
    symbol: "growwTradingSymbol",
    token: "token",              // groww me token same hota hai
    exchange: "exch_seg",
  },
  finvasia: {
    symbol: "finvasiaSymbol",
    token: "finvasiaToken",
    exchange: "exch_seg",
  },
  upstox: {
    symbol: "upstoxSymbol",
    token: "upstoxToken",
    exchange: "exch_seg",
  },
  fyers: {
    symbol: "fyersSymbol",
    token: "fyersToken",
    exchange: "exch_seg",
  },
};


export const createManualOrderWithInstrument = async (req, res) => {
  try {
    const data = req.body;

    // 1. user find karo
    const user = await User.findOne({
      where: { id: data.userid },
    });

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const broker = user.brokerName?.toLowerCase();

    // 2. broker ke according symbol & token decide karo
    let symbol = "";
    let token = "";


    console.log(broker,'==============broker==============');

    console.log(req.body,'==============req.body==============');
    

    switch (broker) {
      case "angelone":
        symbol = data.angelOneSymbol;
        token = data.angelOneToken;
        break;

      case "kite":
        symbol = data.kiteSymbol;
        token = data.kiteToken;
        break;

      case "fyers":
        symbol = data.fyersSymbol;
        token = data.fyersToken;
        break;

      case "upstox":
        symbol = data.upstoxSymbol;
        token = data.upstoxToken;
        break;

      case "kotak":
        symbol = data.kotakSymobol;
        token = data.token;
        break;

      case "finvasia":
        symbol = data.finavasiaSymbol;
        token = data.finavasiaToken;
        break;

      case "groww":
        symbol = data.growwTradingSymbol;
        token = data.growToken;
        break;

      default:
        return res.status(400).json({
          status: false,
          message: "Unsupported broker",
        });
    }

    // 3. validation
    if (!symbol || !token) {
      return res.status(400).json({
        status: false,
        message: "Symbol or token missing for broker",
      });
    }

    // 4. total price calculate
    const totalPrice =
      Number(data.price || 0) * Number(data.quantity || 0);

    const strategyUniqueId = await generateStrategyUniqueId(user.firstName+''+user.lastName  );

    const formatDateTime = (date) => {
  return new Date(date).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).replace(",", " at");
};


//    const utcBuyTime = new Date(data.buyTime).toISOString();

// const formattedTime = formatDateTime(utcBuyTime);

    const formattedTime = new Date().toISOString()

    // 5. order create
    const order = await Order.create({
      userId: user.id,
      userNameId: user.username,
      variety: data.variety,
      ordertype: data.orderType,
      producttype: data.productType,
      duration: data.duration,
      price: data.buyPrice,
      fillprice: data.buyPrice,
      filltime:formattedTime,
      totalPrice,
      quantity: data.quantity,
      fillsize:data.quantity,
      tradedValue:data.quantity*data.buyPrice,
      actualQuantity: data.quantity,
      squareoff: data.squareoff,
      stoploss: data.stoploss,
      tradingsymbol: symbol,
      transactiontype: data.transactiontype,
      exchange: data.exch_seg,
      symboltoken: token,
      instrumenttype: data.instrumenttype,
      lotsize: data.lotsize,
      orderid: generateOrderId(),
      uniqueorderid: generateUniqueOrderUUID(),
      fillid: generateFillId(),
      status: "COMPLETE",
      orderstatus: "OPEN",
      orderstatuslocaldb:"OPEN",
      positionStatus:"OPEN",
      ordertag:"CLONE-USER",
      broker: broker,
      angelOneToken: data.angelOneToken,
      angelOneSymbol: data.angelOneSymbol,
      strategyName:user.firstName+''+user.lastName ,
      strategyUniqueId:strategyUniqueId 
    });

     await emitOrderGet();

    return res.status(200).json({
      status: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (err) {
    console.error("Order Error:", err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

export const createSellManualOrderWithInstrument = async (req, res) => {
  try {
    const data = req.body;

    

    // 1. BUY ORDER FIND
    const buyOrder = await Order.findOne({
      where: { id: data.id },
    });

    if (!buyOrder) {
      return res.status(404).json({
        status: false,
        message: "Buy order not found",
      });
    }

    // 2. CALCULATIONS
    const sellPrice = Number(data.sellPrice);
    const quantity = Number(buyOrder.quantity || 0);
    const buyPrice = Number(buyOrder.fillprice || buyOrder.price || 0);

    const pnl = (sellPrice - buyPrice) * quantity;


   const convertToISO = (str) => {
  if (!str) return null;

  const [datePart, timePart] = str.split(" at ");

  return new Date(`${datePart} ${timePart}`).toISOString();
};
    

    // 3. CREATE SELL ORDER
    const sellOrder = await Order.create({
      userId: buyOrder.userId,
      userNameId: buyOrder.userNameId,

      variety: buyOrder.variety,
      ordertype: buyOrder.ordertype,
      producttype: buyOrder.producttype,
      duration: buyOrder.duration,

      buyprice: buyOrder.fillprice,
      buysize: buyOrder.quantity,
      buyvalue: buyOrder.tradedValue,
      buyOrderId: buyOrder.orderid,
      buyTime: convertToISO(buyOrder.filltime),
      price: sellPrice,
      fillprice:sellPrice,
      totalPrice: sellPrice * quantity,
      quantity: quantity,
      fillsize:quantity,
      actualQuantity: quantity,

      tradingsymbol: buyOrder.tradingsymbol,
      transactiontype: "SELL", // 🔥 important
      exchange: buyOrder.exchange,
      symboltoken: buyOrder.symboltoken,

      instrumenttype: buyOrder.instrumenttype,
      lotsize: buyOrder.lotsize,

      orderid: generateOrderId(),
      uniqueorderid: generateUniqueOrderUUID(),
      fillid: generateFillId(),

      status: "COMPLETE",
      orderstatus: "COMPLETE",
      orderstatuslocaldb: "COMPLETE",

      fillprice: sellPrice,
      filltime: new Date(data?.sellTime)?.toISOString(),

      pnl: pnl,

      broker: buyOrder.broker,

      angelOneToken: buyOrder.angelOneToken,
      angelOneSymbol: buyOrder.angelOneSymbol,

      strategyName: buyOrder.strategyName,
      strategyUniqueId: buyOrder.strategyUniqueId,
      strategyName:buyOrder.strategyName ,
      strategyUniqueId:buyOrder.strategyUniqueId ,
      positionStatus: "COMPLETE",
    });

    // 4. UPDATE BUY ORDER
    await buyOrder.update({
      positionStatus: "COMPLETE",
      orderstatuslocaldb: "COMPLETE",
      orderstatus: "COMPLETE",
    });

    return res.status(200).json({
      status: true,
      message: "Sell order created successfully",
      data: {
        buyOrder,
        sellOrder,
        pnl,
      },
    });
  } catch (err) {
    console.error("Order Error:", err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};

export const createSellManualOrderWithInstrumentNew = async (req, res) => {
  try {
    const data = req.body;

    

    // 1. BUY ORDER FIND
    const buyOrder = await Order.findOne({
      where: { id: data.id },
    });

    if (!buyOrder) {
      return res.status(404).json({
        status: false,
        message: "Buy order not found",
      });
    }

  

     let user = await User.findOne({ where: { id: 4 } });    
        
       
        
    
       var dataAngelone = JSON.stringify({
            "exchange":buyOrder.exchange,
            "tradingsymbol":buyOrder.angelOneSymbol,
            "symboltoken":buyOrder.angelOneToken
        });

      var config = {
        method: 'post',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getLtpData',

        headers: { 
             'Authorization': `Bearer ${user.authToken}`,
            'Content-Type': 'application/json', 
            'Accept': 'application/json', 
            'X-UserType': 'USER', 
            'X-SourceID': 'WEB', 
            'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': user.kite_key, 
        },
        data : dataAngelone
    };

    let resData = await axios(config)

     

       // 2. CALCULATIONS
    const sellPrice = Number(resData?.data?.data?.ltp||0);

    const quantity = Number(buyOrder.quantity || 0);
    const buyPrice = Number(buyOrder.fillprice || buyOrder.price || 0);

    const pnl = (sellPrice - buyPrice) * quantity;


   const convertToISO = (str) => {
  if (!str) return null;

  const [datePart, timePart] = str.split(" at ");

  return new Date(`${datePart} ${timePart}`).toISOString();
};
    

    // 3. CREATE SELL ORDER
    const sellOrder = await Order.create({
      userId: buyOrder.userId,
      userNameId: buyOrder.userNameId,

      variety: buyOrder.variety,
      ordertype: buyOrder.ordertype,
      producttype: buyOrder.producttype,
      duration: buyOrder.duration,

      buyprice: buyOrder.fillprice,
      buysize: buyOrder.quantity,
      buyvalue: buyOrder.tradedValue,
      buyOrderId: buyOrder.orderid,
      buyTime: convertToISO(buyOrder.filltime),
      price: sellPrice,
      fillprice:sellPrice,
      totalPrice: sellPrice * quantity,
      quantity: quantity,
      fillsize:quantity,
      actualQuantity: quantity,

      tradingsymbol: buyOrder.tradingsymbol,
      transactiontype: "SELL", // 🔥 important
      exchange: buyOrder.exchange,
      symboltoken: buyOrder.symboltoken,

      instrumenttype: buyOrder.instrumenttype,
      lotsize: buyOrder.lotsize,

      orderid: generateOrderId(),
      uniqueorderid: generateUniqueOrderUUID(),
      fillid: generateFillId(),

      status: "COMPLETE",
      orderstatus: "COMPLETE",
      orderstatuslocaldb: "COMPLETE",

      fillprice: sellPrice,
      filltime: new Date().toISOString(),

      pnl: pnl,

      broker: buyOrder.broker,

      angelOneToken: buyOrder.angelOneToken,
      angelOneSymbol: buyOrder.angelOneSymbol,

      strategyName: buyOrder.strategyName,
      strategyUniqueId: buyOrder.strategyUniqueId,
      strategyName:buyOrder.strategyName ,
      strategyUniqueId:buyOrder.strategyUniqueId ,
      positionStatus: "COMPLETE",
    });

    // 4. UPDATE BUY ORDER
    await buyOrder.update({
      positionStatus: "COMPLETE",
      orderstatuslocaldb: "COMPLETE",
      orderstatus: "COMPLETE",
    });

    return res.status(200).json({
      status: true,
      message: "Sell order created successfully",
      data: {
        buyOrder,
        sellOrder,
        pnl,
      },
    });
  } catch (err) {
    console.error("Order Error:", err);

    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};


export const createManualOrderWithBrokerPrice = async (req, res) => {

  try {

    let data = req.body;

     let strategyUniqueId = await generateStrategyUniqueId("clone-user")

      const brokerKey = data.brokerName.toLowerCase();
      const brokerConfig = BROKER_FIELD_MAP[brokerKey];

      let symobol = data.instrument[brokerConfig?.symbol] || data.tradingsymbol;
    
    // -------- Basic Validations --------
    if (!data.tradingsymbol)
      return res.status(400).json({ status: false, message: "Tradingsymbol required" });

    if (!data.transactiontype)
      return res.status(400).json({ status: false, message: "Transaction Type required" });

    if (!data.exchange)
      return res.status(400).json({ status: false, message: "Exchange required" });

    // -------- Auto Calculate Total Price --------
    if (data.lotSize && data.price) {
      data.totalPrice = Number(data.lotSize) * Number(data.price);
    }

    if (data.transactiontype === "BUY") {

      data.orderstatuslocaldb = "OPEN";
      data.positionStatus = "OPEN";

    } else if (data.transactiontype === "SELL") {

      data.orderstatuslocaldb = "COMPLETE";
       data.positionStatus = "COMPLETE";

    }

    // -------- Generate IDs --------
    let now = new Date().toISOString();
    
    data.orderid = generateOrderId();
    data.uniqueorderid = generateUniqueOrderUUID();
    data.fillid = generateFillId();
    data.userNameId = data.username
    data.broker = data.brokerName ||""
    // -------- Default Values --------
    data.text = data.text || "";
    data.status = data.status || "COMPLETE";
    data.orderstatus = data.orderstatus || "COMPLETE";
    data.orderstatuslocaldb =  data.orderstatuslocaldb
    data.exchorderupdatetime = data.exchorderupdatetime || now;
    data.parentorderid = data.parentorderid || "";
    data.ordertag = data.ordertag || "MANUAL_ORDER";

    data.tradedValue = data.totalPrice || 0;
    data.fillprice = data.price || 0;
    data.fillsize = data.lotSize || 0;
    data.filltime = data.filltime || now;

    data.strikeprice = data.strikeprice || 0;
    data.optiontype = data.optiontype || "";
    data.expirydate = data.expirydate || "";

    data.cancelsize = data.cancelsize || "0";
    data.averageprice = data.averageprice || 0;
    data.filledshares = data.filledshares || "0";
    data.unfilledshares = data.unfilledshares || "0";

    data.quantity = data.lotSize;
    data.strategyUniqueId = strategyUniqueId||""

    data.angelOneSymbol =  data.tradingsymbol,
    data.angelOneToken =  data.symboltoken,
    data.tradingsymbol = symobol


    // ------------------------------------------------------
    //              FIND TODAY'S BUY ORDER
    // ------------------------------------------------------

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let buyOrder = null;

    let pnlData = 0

    if (data.transactiontype === "SELL") {

      buyOrder = await Order.findOne({
        where: {
          userId: data.userId,
          variety: data.variety,
          tradingsymbol: symobol,
          symboltoken: data.symboltoken,
          exchange: data.exchange,
          ordertype: data.ordertype,
          transactiontype: "BUY",
          orderstatuslocaldb:"OPEN",
          createdAt: { [Op.between]: [startOfDay, endOfDay] }
        },
        raw: true
      });

      // -------- If BUY order exists → Calculate PNL --------
      if (buyOrder) {

        buyOrder.orderstatuslocaldb = "COMPLETE";

       await Order.update(
          { orderstatuslocaldb: "COMPLETE",
            positionStatus: "COMPLETE"
           },
          { where: { id: buyOrder.id } }
        );

        const pnl =
          (data.fillsize * data.price) - 
          (buyOrder.fillsize * buyOrder.fillprice);

        data.pnl = pnl;
        data.buyprice = buyOrder.fillprice;
        data.buyTime = buyOrder.filltime;
        data.buysize = buyOrder.fillsize;
        data.buyvalue = buyOrder.tradedValue;
        data.buyOrderId = buyOrder.orderid;
      }
    }

    // -------- Save Final Order --------
    const order = await Order.create(data);

     if(data.transactiontype === "SELL") {

       await User.increment(
        { DematFund: pnlData },                 // 👈 add pnl
        {
          where: { username: data.username }
        }
      );

     }

    emitOrderGet()

    return res.status(201).json({
      status: true,
      message: "Manual Order Created Successfully",
      data: order,
    });

  } catch (err) {
    console.log("Create Order Error:", err);
    return res.status(500).json({
      status: false,
      message: err.message || "Internal Server Error",
    });
  }
};


export const createManualOrder = async (req, res) => {
  
  const t = await sequelize.transaction();
  try {
    let data = { ...req.body };

     const brokerKey = data.brokerName.toLowerCase();
     const brokerConfig = BROKER_FIELD_MAP[brokerKey];
     let symobol = data.instrument[brokerConfig?.symbol] || data.tradingsymbol;

    // -------- Basic Validations --------
    if (!data.tradingsymbol)
      return res.status(400).json({ status: false, message: "Tradingsymbol required" });

    if (!data.exchange)
      return res.status(400).json({ status: false, message: "Exchange required" });

    if (!data.lotSize)
      return res.status(400).json({ status: false, message: "lotSize required" });

    if (data.buyPrice == null || data.sellPrice == null)
      return res.status(400).json({ status: false, message: "buyPrice and sellPrice required" });

    if (!data.buyTime || !data.sellTime)
      return res.status(400).json({ status: false, message: "buyTime and sellTime required" });

    const fillsize = Number(data.lotSize) || 0;

    // Convert to UTC ISO (works correctly ONLY if input includes timezone like +05:30)
    const utcBuyTime = new Date(data.buyTime).toISOString();
    const utcSellTime = new Date(data.sellTime).toISOString();

    let strategyUniqueId = await generateStrategyUniqueId("clone-user")

      const user = await User.findOne({
          where: { id: data.userId }
        });
    
    // Common defaults
    const common = {
      ...data,
      userNameId: data.username,
      text: data.text || "",
      status: "COMPLETE",
      orderstatus: "COMPLETE",
      orderstatuslocaldb: "COMPLETE",
      positionStatus: "COMPLETE",
      parentorderid: data.parentorderid || "",
      strikeprice: data.strikeprice || 0,
      optiontype: data.optiontype || "",
      expirydate: data.expirydate || "",
      cancelsize: data.cancelsize || "0",
      averageprice: data.averageprice || 0,
      filledshares: data.filledshares || "0",
      unfilledshares: data.unfilledshares || "0",
      quantity: fillsize,
      fillsize,
      buysize: fillsize,
      strategyUniqueId:strategyUniqueId
    };

    // =========================
    // 1️⃣ CREATE BUY ORDER FIRST
    // =========================

     let strategyUniqueIdBuy = await generateStrategyUniqueId("clone-user")

    const buyOrderData = {
      ...common,
      orderid: generateOrderId(),
      uniqueorderid: generateUniqueOrderUUID(),
      fillid: generateFillId(),
      broker : user?.brokerName ||"",

      transactiontype: "BUY",
      ordertag: "AUTO_BUY_FROM_MANUAL",

      // BUY-side mapping
      filltime: utcBuyTime,
      buyTime: utcBuyTime,

      price: Number(data.buyPrice),
      fillprice: Number(data.buyPrice),
      angelOneSymbol :  data.tradingsymbol,
      angelOneToken :  data.symboltoken,
      tradingsymbol :symobol,

      // optional store buyprice too (keeps your schema consistent)
      buyprice: Number(data.buyPrice),
      tradedValue: fillsize * Number(data.buyPrice),
      buyvalue: fillsize * Number(data.buyPrice),
      strategyUniqueId:strategyUniqueIdBuy,
      pnl: 0, // pnl usually computed after sell
    };

    const buyOrder = await Order.create(buyOrderData, { transaction: t });

    // =========================
    // 2️⃣ CREATE SELL ORDER AFTER
    // =========================

    let pnlData  = (fillsize * Number(data.sellPrice)) - (fillsize * Number(data.buyPrice))

    const sellOrderData = {
      ...common,
      orderid: generateOrderId(),
      uniqueorderid: generateUniqueOrderUUID(),
      fillid: generateFillId(),

      transactiontype: "SELL",
      ordertag: data.ordertag || "MANUAL_ORDER",
      broker : data?.brokerName ||"",

      // Link sell to buy (choose one)
      parentorderid: buyOrder.orderid, // ✅ strong link
      buyOrderId: buyOrder.orderid,    // ✅ if you already use this column

       angelOneSymbol :  data.tradingsymbol,
       angelOneToken :  data.symboltoken,
      tradingsymbol :symobol,

      // SELL-side mapping
      filltime: utcSellTime,
      buyTime: utcBuyTime, // keep stored as well

      price: Number(data.sellPrice),
      fillprice: Number(data.sellPrice),

      buyprice: Number(data.buyPrice),
      buyvalue: fillsize * Number(data.buyPrice),

      tradedValue: fillsize * Number(data.sellPrice),
      pnl: (fillsize * Number(data.sellPrice)) - (fillsize * Number(data.buyPrice)),
    };

    const sellOrder = await Order.create(sellOrderData, { transaction: t });

      await User.increment(
        { DematFund: pnlData },                 // 👈 add pnl
        {
          where: { username: data.username }
        }
      );
    await t.commit();

    return res.status(201).json({
      status: true,
      message: "BUY created first, then SELL created successfully",
      data: { buyOrder,sellOrder },
    });
  } catch (err) {
    await t.rollback();
    console.log("Create Order Error:", err);
    return res.status(500).json({
      status: false,
      message: err.message || "Internal Server Error",
    });
  }
};






export const getAllManualOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    return res.status(200).json({
      status: true,
      message: "All orders fetched successfully",
      data: orders,
    });
  } catch (err) {
    console.log("Get Orders Error:", err);
    return res.status(500).json({
      status: false,
      message: err.message || "Internal Server Error",
    });
  }
};
