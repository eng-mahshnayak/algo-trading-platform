import User from "../../models/userModel.js";
import Order from "../../models/orderModel.js";
import { placeAngelOrder } from "../../services/placeAngelOrder.js";
import { placeKiteOrder } from "../../services/placeKiteOrder.js";
import { placeFyersOrder } from "../../services/placeFyersOrder.js";
import { emitOrderGet } from "../../services/smartapiFeed.js";
import { logSuccess, logError } from "../../utils/loggerr.js";
import { placeFinavasiaOrder } from "../../services/placeFinavasiaOrder.js";
import { generateStrategyUniqueId } from "../../utils/randomWords.js";
import { Op } from "sequelize";
import {  updateTargetAndStoploss } from "../../services/placeTargetAndStoplossAngel.js";
import { checkTargetAndStoplossAngelOrder, checkTargetAndStoplossKiteOrder } from "../../services/checkTargetAndStoplossStatus.js";
import { placeUpstoxOrder } from "../../services/placeUpstoxOrder.js";
import { placeGrowwOrder } from "../../services/groww.service.js";
import { placeKotakOrder } from "../../services/placeKotakNeo.js";



export const getTokenStatusSummary = async (req, res) => {
  try {
    const now = new Date();

    

    const [expiredCount] = await User.update(
      {
        angelLoginUser: false,
        angelLoginExpiry: null,
      },
      {
        where: {
          angelLoginUser: true,
          role: "user",
          [Op.or]: [
            { angelLoginExpiry: null },
            { angelLoginExpiry: { [Op.lt]: now } },
          ],
        },
      }
    );

   
   

    const generatedUsers = await User.findAll({
      where: {
        angelLoginUser: true,
        role: "user",
      },
      attributes: [
        ["id", "_id"],
        "firstName",
        "lastName",
        "angelLoginExpiry",
      ],
    });

    const notGeneratedUsers = await User.findAll({
      where: {
        role: "user",
        [Op.or]: [
      { angelLoginUser: false },
      { angelLoginUser: null }
    ]
      },
      attributes: [
        ["id", "_id"],
        "firstName",
        "lastName",
      ],
    });


    return res.json({
      status: true,
      generatedCount: generatedUsers.length,
      notGeneratedCount: notGeneratedUsers.length,
      generatedUsers,
      notGeneratedUsers,
    });
  } catch (err) {
    logError(req, err, {
      msg: "getTokenStatusSummary failed",
    });

    return res.status(500).json({
      status: false,
      message: "Server error",
      error: err.message,
      data: null,
    });
  }
};

export const getLoginUser = async (req, res) => {
  try {

    const now = new Date();

    

   
   

    const generatedUsers = await User.findAll({
      where: {
        angelLoginUser: true,
        role: "user",
      },
    });

   


    return res.json({
      status: true,
      generatedCount: generatedUsers.length,
      generatedUsers,
      
    });
  } catch (err) {
    logError(req, err, {
      msg: "getTokenStatusSummary failed",
    });

    return res.status(500).json({
      status: false,
      message: "Server error",
      error: err.message,
      data: null,
    });
  }
};

const safeErr = (e) => e?.message || e?.response?.data || String(e);

// ==============update logger code ==============================
export const adminPlaceMultiBrokerOrder = async (req, res) => {
  try {
    
    const input = req.body;


    console.log(input,'inputinputinputinput');
    

    //  Generate strategyUniqueId
    const strategyUniqueId = await generateStrategyUniqueId(input.groupName);
    
    //  Add into input object
    input.strategyUniqueId = strategyUniqueId;


    // 2️⃣ Fetch users by strategy group
    const users = await User.findAll({
      where: { strategyName: input.groupName },
      raw: true,
    });

   
    if (!users.length) {
      logSuccess(req, {
        msg: "No users found for strategy group",
        groupName: input.groupName,
      });

      return res.json({
        status: false,
        message: "No users found for this group",
        error: "No users found for this group",
      });
    }

    // 3️⃣ Day range (kept as-is)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

   

    // 4️⃣ Execute orders per broker
    const settled = await Promise.allSettled(
      users.map(async (user) => {
        logSuccess(req, {
          msg: "Processing user for broker order",
          userId: user.id,
          brokerName: user.brokerName,
        });

        try {
          if (user.brokerName.toLowerCase() === "angelone") {
          

            return await placeAngelOrder(user, input, req);
          }

          if (user.brokerName.toLowerCase() === "kite") {
           
            return await placeKiteOrder(user, input, req, true);
          }

          if (user.brokerName.toLowerCase() === "fyers") {
            
            return await placeFyersOrder(user, input, req);
          }

          if (user.brokerName.toLowerCase() === "upstox") {

              return await placeUpstoxOrder(user, input, req, true)
          }

          if (user.brokerName.toLowerCase() === "finvasia") {
            
            return await placeFinavasiaOrder(user, input, req, true);
          }

          if (user.brokerName.toLowerCase() === "groww") {
            
            return await placeGrowwOrder(user, input, req, true);
          }
          if (user.brokerName.toLowerCase() === "kotak neo") {
            
            return await placeKotakOrder(user, input, req, true);
          }


          logSuccess(req, {
            msg: "Unsupported broker encountered",
            userId: user.id,
            brokerName: user.brokerName,
          });

          return {
            userId: user.id,
            broker: user.brokerName,
            result: "UNSUPPORTED",
          };
        } catch (err) {
          logError(req, err, {
            msg: "Broker order execution failed inside map",
            userId: user.id,
            brokerName: user.brokerName,
          });
          throw err;
        }
      })
    );

    logSuccess(req, {
      msg: "All broker promises settled",
      total: settled.length,
    });

    // 5️⃣ Normalize results
    const results = settled.map((item, idx) => {
      const user = users[idx];

      if (item?.status === "fulfilled") {
       
        return item?.value;
      } else {
        logError(req, item?.reason||"", {
          msg: "Broker order rejected",
          userId: user?.id||"",
          broker: user?.brokerName||"",
        });
        return {
          userId: user?.id||"",
          broker: user?.brokerName||"",
          result: "REJECTED",
          message: item?.reason?.message || String(item?.reason||"")||"",
        };
      }
    });

    // 6️⃣ Emit socket update
    logSuccess(req, { msg: "Emitting order update event" });
    await emitOrderGet();

  
    return res.json({
      status: true,
      message: "Orders executed for all brokers",
      data: results,
    });

  } catch (err) {
    logError(req, err, {
      msg: "Admin multi-broker order execution failed",
    });

    return res.json({
      status: false,
      message: err.message,
    });
  }
};

// ==============update logger code ==============================
export const adminGroupSquareOff = async (req, res) => {

  // GLOBAL LOCK
  const strategyLocks = new Set();
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  let reqStrategyUniqueId = req.body.strategyUniqueId
  let reqSellQuantity = req.body?.quantity||0
  let reason = req.body?.reason ||""
  
  try {

    // ✔️ Agar already locked hai
    if (strategyLocks.has(reqStrategyUniqueId)) {
    
      await sleep(60000); // Wait 1 minute
      
      strategyLocks.delete(reqStrategyUniqueId);
    }

    // 🔒 Add lock for fresh request
    strategyLocks.add(reqStrategyUniqueId);


    // const afterUnderscore = reqStrategyUniqueId.split("_").pop();

    // //  Generate strategyUniqueId
    // const strategyUniqueId = await generateStrategyUniqueId(afterUnderscore);

     const strategyUniqueId = reqStrategyUniqueId

    // 1) Time window for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const openOrders = await Order.findAll({
      where: {
        orderstatuslocaldb: "OPEN",
        positionStatus: "OPEN",
        transactiontype: "BUY",
        strategyUniqueId: reqStrategyUniqueId, // optional: null avoid
      },
      raw: true,
    });


    if (!openOrders.length) {
      logSuccess(req, {
        msg: "No OPEN BUY orders found today to square off",
      });

      return res.json({
        status: false,
        message: "No OPEN (BUY) orders found today to square off",
        data: [],
      });
    }

    const results = await Promise.allSettled(
      openOrders.map(async (o, idx) => {
        try {

          req.userId = o?.userId

          const user = await User.findOne({
            where: { id: o.userId },
            raw: true,
          });

          if (!user) {
            logSuccess(req, {
              msg: "Square-off skipped: user not found",
              orderDbId: o.id,
              userId: o.userId,
            });

            return {
              orderId: o.id,
              result: "NO_USER",
              message: "User not found",
            };
          }

          if (!user.authToken) {
            logSuccess(req, {
              msg: "Square-off skipped: user missing authToken",
              orderDbId: o.id,
              userId: user.id,
            });

            return {
              orderId: o.id,
              result: "NO_TOKEN",
              message: "User does not have broker authToken",
            };
          }

          if (!user.brokerName) {
            logSuccess(req, {
              msg: "Square-off skipped: user broker not selected",
              orderDbId: o.id,
              userId: user.id,
            });

            return {
              orderId: o.id,
              result: "NO_BROKER",
              message: "User broker not selected",
            };
          }

          const transactiontype = "SELL"; // square off leg

          let sellQtyFinal =
              reqSellQuantity && reqSellQuantity > 0
                ? reqSellQuantity                       // partial sell request
                : o.quantity;     

          // Common reqInput format for both services
          const reqInput = {
            variety: o.variety,
            symbol: o.tradingsymbol,
            instrumenttype: o.instrumenttype,
            token: o.symboltoken,
            exch_seg: o.exchange,
            orderType: o.ordertype,
            quantity: sellQtyFinal,
            productType: o.producttype,
            duration: o.duration,
            price: o.price,
            transactiontype,
            totalPrice: o.totalPrice,
            actualQuantity: o.actualQuantity,
            userId: user.id,
            text:`Winner : ${reason}`,
            userNameId: user.username,
            angelOneToken: o?.angelOneToken || o.token,
            angelOneSymbol: o?.angelOneSymbol || o?.symbol,
            broker: o?.broker,
            buyOrderId: String(o.orderid),
            groupName:o?.strategyName||"",
            strategyUniqueId:strategyUniqueId,
            kiteSymbol: o.tradingsymbol || o.angelOneSymbol,
            kiteToken: o.symboltoken || o.angelOneToken,
            finavasiaSymbol : o.tradingsymbol || o.angelOneSymbol ,
            finavasiaToken : o?.symboltoken||o?.angelOneToken,
            fyersSymbol: o.tradingsymbol || o.angelOneSymbol,
            fyersToken: o.symboltoken || o.angelOneToken,
            growSymbol:o.tradingsymbol,
            growToken:o.tradingsymbol,
            growwSegment:o.optiontype,
            growwExchange:o.exchange,
          };


          console.log(reqInput,'==============reqInput==============');
          

          

          //=============== CALL BROKER SPECIFIC SERVICE ===============//
          const broker = (user.brokerName || "").toLowerCase();

          let sellQuantityPartial = 0

           if( reqSellQuantity < o.quantity) {

            sellQuantityPartial = reqSellQuantity

           }

          // if (broker === "angelone" && user.role === "user") {
           

          //   await placeAngelOrder(user, reqInput, req,sellQuantityPartial);

           
          // } else if (broker === "kite" && user.role === "user") {
            

          //   await placeKiteOrder(user, reqInput, req, false);

           
          // } else if (broker === "fyers" && user.role === "user") {
           

          //   await placeFyersOrder(user, reqInput, req);

            
          // } else if (broker === "finvasia" && user.role === "user") {
           
          //   await placeFinavasiaOrder(user, reqInput, req, true);

           
          // }else if (broker === "upstox" && user.role === "user") {
           
          //   await placeUpstoxOrder(user, reqInput, req, true);

          // }else if (broker === "groww" && user.role === "user") {
           
          //   await placeGrowwOrder(user, reqInput, req, false);

          // }
          // else if (broker === "kotak neo" && user.role === "user") {
           
          //   await placeKotakOrder(user, reqInput, req, false);

          // }
          //  else {

          //   logSuccess(req, {
          //     msg: "Square-off skipped: invalid/unknown broker",
          //     orderDbId: o.id,
          //     brokerName: user.brokerName,
          //     brokerValue: user.broker,
          //     userId: user.id,
          //   });

          //   return {
          //     orderId: o.id,
          //     result: "INVALID_BROKER",
          //     message: `Unknown broker: ${user.broker}`,
          //   };
          // }

          return {
            orderId: o.id,
            broker: user.broker,
          };
        } catch (e) {
          logError(req, e, {
            msg: "Square-off failed for order",
            orderDbId: o.id,
            userId: o.userId,
          });

          return {
            orderId: o.id,
            result: "FAILED",
            message: safeErr(e),
          };
        }
      })
    );

    // 4) Normalize Promise results
    const finalOutput = results.map((r, i) => {
      if (r.status === "fulfilled") {
       
        return r.value;
      }

      return { orderId: openOrders[i].id, result: "PROMISE_REJECTED" };
    });

      strategyLocks.delete(reqStrategyUniqueId||req.body.strategyUniqueId);

    return res.json({
      status: true,
      message: "Bulk square-off complete",
      data: finalOutput,
    });
  } catch (error) {
    logError(req, error, { msg: "adminMultipleSquareOff failed unexpectedly" });

    strategyLocks.delete(reqStrategyUniqueId||req.body.strategyUniqueId);

    return res.json({
      status: false,
      message: "Something went wrong",
      error: safeErr(error),
    });
  }


};

// =================== UPDATE LOGGER CODE =========================
export const adminPlaceBrokerOrderWithEmployeeId = async (req, res) => {
  try {
    const input = { ...req.body };

    console.log(input,'==============================input======================');
    

    // 1️⃣ Fetch user
    const user = await User.findOne({
      where: { id: input.customerId },
      raw: true,
    });

    if (!user) {
      logSuccess(req, {
        msg: "User not found",
        customerId: input.customerId,
      });

      return res.json({
        status: false,
        message: "User not found",
      });
    }

    // 2️⃣ Generate strategyUniqueId
    const strategyUniqueId = await generateStrategyUniqueId(user.strategyName);
    input.strategyUniqueId = strategyUniqueId;

    logSuccess(req, {
      msg: "Order execution started",
      userId: user.id,
      broker: user.brokerName,
    });

    // 3️⃣ Broker Handler Map (Clean Approach)
    const brokerHandlers = {
      angelone: placeAngelOrder,
      kite: placeKiteOrder,
      fyers: placeFyersOrder,
      upstox: placeUpstoxOrder,
      finvasia: placeFinavasiaOrder,
      groww: placeGrowwOrder,
    };

    const brokerName = user.brokerName?.toLowerCase();
    const handler = brokerHandlers[brokerName];

    if (!handler) {
      logSuccess(req, {
        msg: "Unsupported broker",
        brokerName,
      });

      return res.json({
        status: false,
        message: "Unsupported broker",
      });
    }

    // 4️⃣ Execute Order
    // const result = await handler(user, input, req, true);

    // 5️⃣ Emit socket update
    await emitOrderGet();

    logSuccess(req, {
      msg: "Order executed successfully",
      userId: user.id,
    });

    return res.json({
      status: true,
      message: "Order executed successfully",
      data: result,
    });

  } catch (err) {
    logError(req, err, {
      msg: "Admin broker order execution failed",
    });

    return res.json({
      status: false,
      message: err.message,
    });
  }
};

// ==============update logger code ==============================
export const adminPlaceReBuyOrder = async (req, res) => {
  
  try {

    const input = req.body;

    // Validate
    if (!input.flag || !input.strategyUniqueId || !input.orderId || !input.quantity) {
      return res.json({
        status: false,
        message: "Missing required fields"
      });
    }


   // Get clients based on flag
      let clients = [];

      if (input.flag === 'GROUP') {
        clients = input.allClients || [];
      } else {
        // Add orderId from main request to client object
      clients = [{
        ...input.selectedClient,
        orderId: input.orderId  // main request se orderId add karo
      }];
    }

    if (!clients?.length) {
      return res.json({
        status: false,
        message: input.flag === 'GROUP' ? "No clients for GROUP" : "No client for SINGLE"
      });
    }

     const results = await Promise.allSettled(
      clients.map(async (user, idx) => {
        try {

          req.userId = user?.userId

          const userFindData = await User.findOne({
            where: { id: user.userId },
            raw: true,
          });

          if (!userFindData) {
            logSuccess(req, {
              msg: "Square-off skipped: user not found",
              userId: userFindData.userId,
            });

            return {
              result: "NO_USER",
              message: "User not found",
            };
          }

          if (!userFindData.authToken) {
            logSuccess(req, {
              msg: "Square-off skipped: user missing authToken",
              userId: userFindData.id,
            });

            return {
              result: "NO_TOKEN",
              message: "User does not have broker authToken",
            };
          }

          if (!userFindData.brokerName) {
            logSuccess(req, {
              msg: "Square-off skipped: user broker not selected",
              userId: userFindData.id,
            });

            return {
              result: "NO_BROKER",
              message: "User broker not selected",
            };
          }

          let o = await Order.findOne({
              where: { 
                userId: user.userId,
                orderid:user?.orderId,
                orderstatuslocaldb: "OPEN",
               },
              raw: true,
          })

          let sellQtyFinal = input?.quantity||o.quantity

          // Common reqInput format for both services
          const reqInput = {
            variety: o.variety,
            symbol: o.tradingsymbol,
            instrumenttype: o.instrumenttype,
            token: o.symboltoken,
            exch_seg: o.exchange,
            orderType: o.ordertype,
            quantity: sellQtyFinal,
            productType: o.producttype,
            duration: o.duration,
            price: o.price,
            transactiontype:o.transactiontype,
            totalPrice: o.totalPrice,
            actualQuantity: o.actualQuantity,
            userId: userFindData.id,
            text:``,
            userNameId: userFindData.username,
            angelOneToken: o?.angelOneToken || o.token,
            angelOneSymbol: o?.angelOneSymbol || o?.symbol,
            broker: o?.broker,
            buyOrderId: String(o.orderid),
            groupName:o?.strategyName||"",
            strategyUniqueId:o?.strategyUniqueId,
            kiteSymbol: o.tradingsymbol || o.angelOneSymbol,
            kiteToken: o.symboltoken || o.angelOneToken,
            finavasiaSymbol : o.tradingsymbol || o.angelOneSymbol ,
            finavasiaToken : o?.symboltoken||o?.angelOneToken,
            fyersSymbol: o.tradingsymbol || o.angelOneSymbol,
            fyersToken: o.symboltoken || o.angelOneToken,
            growSymbol:o.tradingsymbol,
            growToken:o.tradingsymbol,
            growwSegment:o.optiontype,
            growwExchange:o.exchange,
          };

          //=============== CALL BROKER SPECIFIC SERVICE ===============//
          const broker = (userFindData.brokerName || "").toLowerCase();


          if (broker === "angelone" && userFindData.role === "user") {
           

            await placeAngelOrder(userFindData, reqInput, req);

           
          } else if (broker === "kite" && userFindData.role === "user") {
            

            await placeKiteOrder(userFindData, reqInput, req, false);

           
          } else if (broker === "fyers" && userFindData.role === "user") {
           

            await placeFyersOrder(userFindData, reqInput, req);

            
          } else if (broker === "finvasia" && userFindData.role === "user") {
           
            await placeFinavasiaOrder(userFindData, reqInput, req, true);

           
          }else if (broker === "upstox" && userFindData.role === "user") {
           
            await placeUpstoxOrder(userFindData, reqInput, req, true);

          }else if (broker === "groww" && userFindData.role === "user") {
           
            await placeGrowwOrder(userFindData, reqInput, req, false);

          }
           else {

            logSuccess(req, {
              msg: "Square-off skipped: invalid/unknown broker",
              orderDbId: o.id,
              brokerName: userFindData.brokerName,
              brokerValue: userFindData.broker,
              userId: userFindData.id,
            });

            return {
              orderId: o.id,
              result: "INVALID_BROKER",
              message: `Unknown broker: ${userFindData.broker}`,
            };
          }

        } catch (e) {

          console.log(e);
          
          logError(req, e, {
            msg: "Square-off failed for order",
            orderDbId: o.id,
            userId: o.userId,
          });

          return {
            orderId: o.id,
            result: "FAILED",
            message: safeErr(e),
          };
        }
      })
    );

     // 4) Normalize Promise results
    const finalOutput = results.map((r, i) => {
      if (r.status === "fulfilled") {
       
        return r.value;
      }

      return { orderId: openOrders[i].id, result: "PROMISE_REJECTED" };
    });

    return res.json({
      status: true,
      message: "Re Buy complete",
      data: finalOutput,
    });

  } catch (error) {

    logError(req, error, { msg: "adminMultipleSquareOff failed unexpectedly" });

    return res.json({
      status: false,
      message: "Something went wrong",
      error: safeErr(error),
    });
  }
};

// ================== update logger code======================
export const adminMultipleSquareOff = async (req, res) => {
  try {
    
   
    console.log('===================== sequreoff controller check point ===================');
    


    // 1) Time window for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const openOrders = await Order.findAll({
      where: {
        orderstatuslocaldb: "OPEN",
        transactiontype: "BUY",
        positionStatus:"OPEN",
        createdAt: { [Op.between]: [startOfDay, endOfDay] },
      },
      raw: true,
    });

    if (!openOrders.length) {
      logSuccess(req, {
        msg: "No OPEN BUY orders found today to square off",
      });

     
      return res.json({
        status: false,
        message: "No OPEN (BUY) orders found today to square off",
        data: [],
      });
    }

   
    const results = await Promise.allSettled(
      openOrders.map(async (o, idx) => {
        
        try {
          
           req.userId = o?.userId

          const user = await User.findOne({
            where: { id: o.userId },
            raw: true,
          });

         
          if (!user) {
            

            return {
              orderId: o.id,
              result: "NO_USER",
              message: "User not found",
            };
          }

          if (!user.authToken) {
           
            return {
              orderId: o.id,
              result: "NO_TOKEN",
              message: "User does not have broker authToken",
            };
          }

          if (!user.brokerName) {
           
            return {
              orderId: o.id,
              result: "NO_BROKER",
              message: "User broker not selected",
            };
          }

         const strategyUniqueId = o.strategyUniqueId || "";

          const transactiontype = "SELL"; // square off leg

          // Common reqInput format for both services
          const reqInput = {
            variety: o.variety,
            symbol: o.tradingsymbol,
            instrumenttype: o.instrumenttype,
            token: o.symboltoken,
            orderType: o.ordertype,
            quantity: o.quantity,
            productType: o.producttype,
            duration: o.duration,
            exch_seg:o.exchange,
            price: o.price,
            transactiontype,
            totalPrice: o.totalPrice,
            actualQuantity: o.actualQuantity,
            userId: user.id,
            ordertag:"aitrading",
            userNameId: user.username,
            angelOneToken: o?.angelOneToken || o.token,
            angelOneSymbol: o?.angelOneSymbol || o?.symbol,
            broker: o?.broker,
            buyOrderId: String(o.orderid),
            groupName:o?.strategyName||"",
            strategyUniqueId:strategyUniqueId,
            kiteSymbol: o.tradingsymbol || o.angelOneSymbol,
            kiteToken: o.symboltoken || o.angelOneToken,
            finavasiaSymbol : o.tradingsymbol || o.angelOneSymbol ,
            finavasiaToken : o?.symboltoken||o?.angelOneToken,
            FyersSymbol: o.tradingsymbol || o.angelOneSymbol,
            fyersToken: o.symboltoken || o.angelOneToken,
            growToken:o.tradingsymbol,
            growwSegment:o.optiontype,
            growwExchange:o.exchange,
           
          };


          console.log(reqInput,'=============reqInput=============');
          

          // //=============== CALL BROKER SPECIFIC SERVICE ===============//
          // const broker = (user.brokerName || "").toLowerCase();

          // if (broker === "angelone" && user.role === "user") {
          
          //   await placeAngelOrder(user, reqInput, req);

           
          // } else if (broker === "kite" && user.role === "user") {
            
          //   await placeKiteOrder(user, reqInput, req, false);

           
          // } else if (broker === "fyers" && user.role === "user") {
           

          //   await placeFyersOrder(user, reqInput, req);

            
          // } else if (broker === "finvasia" && user.role === "user") {

          //   await placeFinavasiaOrder(user, reqInput, req, true);

          // }else if (broker === "upstox" && user.role === "user") {
    
          //   await placeUpstoxOrder(user, reqInput, req, true);

          // }else if (broker === "groww" && user.role === "user") {
    
          //   await placeGrowwOrder(user, reqInput, req, false);

          // }
          
          // else {
      
          //   return {
          //     orderId: o.id,
          //     result: "INVALID_BROKER",
          //     message: `Unknown broker: ${user.broker}`,
          //   };
          // }

          

          return {
            orderId: o.id,
            broker: user.broker,
          };
        } catch (e) {
          logError(req, e, {
            msg: "Square-off failed for order",
            orderDbId: o.id,
            userId: o.userId,
          });

          return {
            orderId: o.id,
            result: "FAILED",
            message: safeErr(e),
          };
        }
      })
    );

   

    // 4) Normalize Promise results
    const finalOutput = results.map((r, i) => {
      if (r.status === "fulfilled") {
        logSuccess(req, {
          msg: "Square-off promise fulfilled",
          orderDbId: openOrders[i]?.id,
          result: r.value?.result || "OK",
        });
        return r.value;
      }

      logError(req, r.reason, {
        msg: "Square-off promise rejected",
        orderDbId: openOrders[i]?.id,
      });

      return { orderId: openOrders[i].id, result: "PROMISE_REJECTED" };
    });

    

    return res.json({
      status: true,
      message: "Bulk square-off complete",
      data: finalOutput,
    });
  } catch (error) {

    console.log(error,'========================error');
    
    logError(req, error, { msg: "adminMultipleSquareOff failed unexpectedly" });

    return res.json({
      status: false,
      message: "Something went wrong",
      error: safeErr(error),
    });
  }
};



// ==============update logger code ==============================
export const adminSingleSquareOff = async (req, res) => {
  try {

    let orderId = req.body.orderId

    let reqStrategyUniqueId = req.body.strategyUniqueId

    console.log(reqStrategyUniqueId,'reqStrategyUniqueId');
    
    const afterUnderscore = reqStrategyUniqueId.split("_").pop();

    //  Generate strategyUniqueId
    const strategyUniqueId = await generateStrategyUniqueId(afterUnderscore);


    if (!orderId) {
     
      return res.json({
        status: false,
        message: "orderId is required",
      });
    }

      console.log('================ checl 12345=============');

    // 2️⃣ Today window (kept as-is)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const o = await Order.findOne({
      where: {
        orderid: String(orderId),
        orderstatuslocaldb: "OPEN",
        transactiontype: "BUY",

      },
      raw: true,
    });

     req.userId = o?.userId

    if (!o) {
      logSuccess(req, {
        msg: "No OPEN BUY order found for square-off",
        orderId: String(orderId),
      });

      return res.json({
        status: false,
        message: "No OPEN BUY order found with this id",
      });
    }

     console.log('================ checl transactiontype=============');

    const user = await User.findOne({
      where: { id: o.userId },
      raw: true,
    });

    if (!user) {
      logSuccess(req, { msg: "Square-off failed: user not found", userId: o.userId });
      return res.json({
        status: false,
        message: "User not found for this order",
      });
    }

    if (!user.authToken) {
      logSuccess(req, { msg: "Square-off failed: user missing authToken", userId: user.id });
      return res.json({
        status: false,
        message: "User does not have broker authToken",
      });
    }

    if (!user.brokerName) {
      logSuccess(req, { msg: "Square-off failed: user broker not selected", userId: user.id });
      return res.json({
        status: false,
        message: "User broker not selected",
      });
    }

    // 5️⃣ Build reqInput for SELL leg
    const transactiontype = "SELL";


    console.log(transactiontype,'================transactiontype=============');
    

    const reqInput = {
      variety: o.variety,
      symbol: o.tradingsymbol,
      instrumenttype: o.instrumenttype,
      token: o.symboltoken||o.angelOneToken,
      exch_seg: o.exchange,
      orderType: o.ordertype,
      quantity: o.quantity,
      productType: o.producttype,
      duration: o.duration,
      price: o.price,
      transactiontype,
      totalPrice: o.totalPrice,
      actualQuantity: o.actualQuantity,
      userId: user.id,
      userNameId: user.username,
      angelOneToken: o?.angelOneToken || o.token,
      angelOneSymbol: o?.angelOneSymbol || o?.symbol,
      broker: o?.broker,
      buyOrderId: String(orderId),
       groupName:o?.strategyName||"",
       strategyUniqueId:strategyUniqueId||"",
       kiteSymbol: o.tradingsymbol || o.angelOneSymbol,
       kiteToken: o.symboltoken || o.angelOneToken,
       finavasiaSymbol : o.tradingsymbol || o.angelOneSymbol ,
       finavasiaToken : o?.symboltoken||o?.angelOneToken,
       fyersSymbol: o.tradingsymbol || o.angelOneSymbol,
       fyersToken: o.symboltoken || o.angelOneToken,
       growToken:o.tradingsymbol,
       growwSegment:o.optiontype,
       growwExchange:o.exchange

    };

    // 6️⃣ Route to broker service
    const broker = (user.brokerName || "").toLowerCase();

    if (broker === "angelone" && user.role === "user") {

      // ✅ keeping your existing call exactly (even if args look odd)
      await placeAngelOrder(user, reqInput, req);

    } else if (broker === "kite" && user.role === "user") {
      
      await placeKiteOrder(user, reqInput, req, false);

    } else if (broker === "fyers" && user.role === "user") {
      
      await placeFyersOrder(user, reqInput, req);

    } else if (broker === "finvasia" && user.role === "user") {
      
      await placeFinavasiaOrder(user, reqInput, req, true);
 
    }else if (broker === "upstox" && user.role === "user") {
      
     await placeUpstoxOrder(user, reqInput, req, true);

    }else if (broker === "groww" && user.role === "user") {
      
  
     await placeGrowwOrder(user, reqInput, req, false);

    }
     else {

      return res.json({
        status: false,
        message: `Unknown or invalid broker: ${user.broker}`,
      });
    }

    return res.json({
      status: true,
      message: "Single order square-off complete",
    });

  } catch (error) {
    logError(req, error, { msg: "adminSingleSquareOff failed unexpectedly" });

    return res.json({
      status: false,
      message: "Something went wrong",
      error: safeErr(error),
    });
  }
};

// ==============update logger code ==============================
export const adminPlaceMultiTargetStoplossOrder = async (req, res) => {
  try {


    const reqStrategyUniqueId = req.body.strategyUniqueId;
    const targetPrice = Number(req.body.targetPrice);
    const stoplossPrice = Number(req.body.stoplossPrice);

    

    if (!Number.isFinite(targetPrice) || !Number.isFinite(stoplossPrice)) {
     
      return res.json({
        status: false,
        message: "Invalid targetPrice/stoplossPrice",
      });
    }
    
    // ================= Fetch OPEN BUY Orders =================
   
    const openOrders = await Order.findAll({
      where: {
        orderstatuslocaldb: "OPEN",
        transactiontype: "BUY",
        strategyUniqueId: reqStrategyUniqueId,
      },
      raw: true,
    });

    

    if (!openOrders.length) {
      logSuccess(req, {
        msg: "No OPEN BUY orders found, exiting",
      });

      return res.json({
        status: false,
        message: "No OPEN (BUY) orders found",
        data: [],
      });
    }

    // ================= Process Each Order =================
    const results = await Promise.allSettled(
      openOrders.map(async (o, idx) => {

         req.userId = o?.userId

        logSuccess(req, {
          msg: "▶️ Processing order for OCO",
          index: idx,
          orderDbId: o.id,
          buyOrderId: o.orderid,
          userId: o.userId,
          order:o
        });

        try {
          // ---------- Fetch user ----------
          const user = await User.findOne({
            where: { id: o.userId },
            raw: true,
          });

          if (!user) {
            
            return { orderId: o.id, result: "NO_USER" };
          }

          if (!user.authToken) {
           
            return { orderId: o.id, result: "NO_TOKEN" };
          }

          await updateTargetAndStoploss(user,o,targetPrice,stoplossPrice,req)

          return {
            orderId: o.id,
            result: "OK",
          };
        } catch (e) {
          logError(req, e, {
            msg: "❌ Exception while processing OCO order",
          });

          return { orderId: o.id, result: "FAILED", message: safeErr(e) };
        }
      })
    );

    return res.json({
      status: true,
      message: "Bulk Target+Stoploss placed",
      data: null,
    });
  } catch (error) {
    logError(req, error, {
      msg: "🔥 adminPlaceMultiTargetStoplossOrder crashed",
    });

    return res.json({
      status: false,
      message: "Something went wrong",
      error: safeErr(error),
    });
  }
};


// ================== update logger code======================
export const adminMultipleHoldingSquareOff = async (req, res) => {
  try {

    const openOrders = await Order.findAll({
      where: {
        orderstatuslocaldb: "OPEN",
        transactiontype: "BUY",
        positionStatus:"HOLDING",
      },
      raw: true,
    });

    if (!openOrders.length) {
      logSuccess(req, {
        msg: "No OPEN BUY orders found today to square off",
      });

     
      return res.json({
        status: false,
        message: "No OPEN (BUY) orders found today to square off",
        data: [],
      });
    }

   
    const results = await Promise.allSettled(
      openOrders.map(async (o, idx) => {
        
        try {
          
           req.userId = o?.userId

          const user = await User.findOne({
            where: {
               id: o.userId,
               angelLoginUser:true
               },
            raw: true,
          });

         
          if (!user) {
            return {
              orderId: o.id,
              result: "NO_USER",
              message: "User not found",
            };
          }

          if (!user.authToken) {
           
            return {
              orderId: o.id,
              result: "NO_TOKEN",
              message: "User does not have broker authToken",
            };
          }

          if (!user.brokerName) {
           
            return {
              orderId: o.id,
              result: "NO_BROKER",
              message: "User broker not selected",
            };
          }

         const strategyUniqueId = o.strategyUniqueId || "";

          const transactiontype = "SELL"; // square off leg

          // Common reqInput format for both services
          const reqInput = {
            variety: o.variety,
            symbol: o.tradingsymbol,
            instrumenttype: o.instrumenttype,
            token: o.symboltoken,
            exch_seg: o.exchange,
            orderType: o.ordertype,
            quantity: o.quantity,
            productType: o.producttype,
            duration: o.duration,
            price: o.price,
            transactiontype,
            totalPrice: o.totalPrice,
            actualQuantity: o.actualQuantity,
            userId: user.id,
            ordertag:"aitrading",
            userNameId: user.username,
            angelOneToken: o?.angelOneToken || o.token,
            angelOneSymbol: o?.angelOneSymbol || o?.symbol,
            broker: o?.broker,
            buyOrderId: String(o.orderid),
            groupName:o?.strategyName||"",
            strategyUniqueId:strategyUniqueId,
            kiteSymbol: o.tradingsymbol || o.angelOneSymbol,
            kiteToken: o.symboltoken || o.angelOneToken,
            finavasiaSymbol : o.tradingsymbol || o.angelOneSymbol ,
            finavasiaToken : o?.symboltoken||o?.angelOneToken,
            FyersSymbol: o.tradingsymbol || o.angelOneSymbol,
            fyersToken: o.symboltoken || o.angelOneToken,
            growToken:o.tradingsymbol,
            growwSegment:o.optiontype,
            growwExchange:o.exchange,
          };

          //=============== CALL BROKER SPECIFIC SERVICE ===============//
          const broker = (user.brokerName || "").toLowerCase();

          if (broker === "angelone" && user.role === "user") {
          
            await placeAngelOrder(user, reqInput, req);

           
          } else if (broker === "kite" && user.role === "user") {
            
            await placeKiteOrder(user, reqInput, req, false);

           
          } else if (broker === "fyers" && user.role === "user") {
           

            await placeFyersOrder(user, reqInput, req);

            
          } else if (broker === "finvasia" && user.role === "user") {

            await placeFinavasiaOrder(user, reqInput, req, true);

          }else if (broker === "upstox" && user.role === "user") {
    
            await placeUpstoxOrder(user, reqInput, req, true);

          }else if (broker === "groww" && user.role === "user") {
      
            await placeGrowwOrder(user, reqInput, req, false);

          } else {
      
            return {
              orderId: o.id,
              result: "INVALID_BROKER",
              message: `Unknown broker: ${user.broker}`,
            };
          }

          

          return {
            orderId: o.id,
            broker: user.broker,
          };
        } catch (e) {
          logError(req, e, {
            msg: "Square-off failed for order",
            orderDbId: o.id,
            userId: o.userId,
          });

          return {
            orderId: o.id,
            result: "FAILED",
            message: safeErr(e),
          };
        }
      })
    );

   

    // 4) Normalize Promise results
    const finalOutput = results.map((r, i) => {
      if (r.status === "fulfilled") {
        logSuccess(req, {
          msg: "Square-off promise fulfilled",
          orderDbId: openOrders[i]?.id,
          result: r.value?.result || "OK",
        });
        return r.value;
      }

      logError(req, r.reason, {
        msg: "Square-off promise rejected",
        orderDbId: openOrders[i]?.id,
      });

      return { orderId: openOrders[i].id, result: "PROMISE_REJECTED" };
    });

    

    return res.json({
      status: true,
      message: "Bulk square-off complete",
      data: finalOutput,
    });
  
  } catch (error) {

    logError(req, error, { msg: "adminMultipleSquareOff failed unexpectedly" });

    return res.json({
      status: false,
      message: "Something went wrong",
      error: safeErr(error),
    });
  }
};







// ==============update logger code ==============================
export const adminCheckTargetAndStoploss121 = async (req, res) => {
  try {

    let reqStrategyUniqueId = req.body.strategyUniqueId

    // 1) Time window for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    logSuccess(req, {
      msg: "Computed start/end of day for Target and Stoploss check",
      startOfDay,
      endOfDay,
    });

    // 2) Fetch all OPEN (BUY) orders today
    logSuccess(req, { msg: "Fetching OPEN BUY orders for today in Target and Stoploss check" });

    const openOrders = await Order.findAll({
      where: {
        orderstatuslocaldb: "OPEN",
        transactiontype: "BUY",
        strategyUniqueId: reqStrategyUniqueId, // optional: null avoid
      },
      raw: true,
    });

    logSuccess(req, {
      msg: "OPEN BUY orders fetched",
      openOrdersCount: openOrders.length,
    });

    if (!openOrders.length) {
      logSuccess(req, {
        msg: "No OPEN BUY orders found today to Target and Stoploss check",
      });

      return res.json({
        status: false,
        message: "No OPEN (BUY) orders found today to Target and Stoploss check",
        data: [],
      });
    }

    // 3) Process each order
    logSuccess(req, {
      msg: "Starting Target and Stoploss check processing for orders",
      count: openOrders.length,
    });

    const results = await Promise.allSettled(
     
      openOrders.map(async (o, idx) => {

        // Target orderId nikalna
          const targetMatch = o?.text?.match(/target_order_id:(\d+)/);
          const targetOrderId = targetMatch ? targetMatch[1] : null;

          // Stoploss orderId nikalna
          const stoplossMatch = o?.text?.match(/stoploss_order_id:(\d+)/);
          const stoplossOrderId = stoplossMatch ? stoplossMatch[1] : null;

        logSuccess(req, {
          msg: "Processing Target and Stoploss check for order",
          index: idx,
          targetOrderId:targetOrderId,
          stoplossOrderId:stoplossOrderId,
          orderDbId: o.id,
          orderid: o.orderid,
          userId: o.userId,
          symbol: o.tradingsymbol,
          exchange: o.exchange,
        });

        try {
          // 3a) Fetch user of the order
          logSuccess(req, {
            msg: "Fetching user for Target and Stoploss check order",
            orderDbId: o.id,
            userId: o.userId,
          });

          const user = await User.findOne({
            where: { id: o.userId },
            raw: true,
          });

          logSuccess(req, {
            msg: "User lookup result for Target and Stoploss check order",
            orderDbId: o.id,
            userFound: !!user,
            userId: user?.id,
            brokerName: user?.brokerName,
            role: user?.role,
            hasAuthToken: !!user?.authToken,
          });

          if (!user) {
            logSuccess(req, {
              msg: "Target and Stoploss check skipped: user not found",
              orderDbId: o.id,
              userId: o.userId,
            });

            return {
              orderId: o.id,
              result: "NO_USER",
              message: "User not found",
            };
          }

          if (!user.authToken) {
            logSuccess(req, {
              msg: "Target and Stoploss check skipped: user missing authToken",
              orderDbId: o.id,
              userId: user.id,
            });

            return {
              orderId: o.id,
              result: "NO_TOKEN",
              message: "User does not have broker authToken",
            };
          }

          if (!user.brokerName) {
            logSuccess(req, {
              msg: "Target and Stoploss check skipped: user broker not selected",
              orderDbId: o.id,
              userId: user.id,
            });

            return {
              orderId: o.id,
              result: "NO_BROKER",
              message: "User broker not selected",
            };
          }

          //=============== CALL BROKER SPECIFIC SERVICE ===============//
          const broker = (user.brokerName || "").toLowerCase();

          logSuccess(req, {
            msg: "Routing Target and Stoploss check to broker service",
            orderDbId: o.id,
            broker,
            userId: user.id,
            role: user.role,
          });

          if (broker === "angelone" && user.role === "user") {
            logSuccess(req, {
              msg: "Calling placeAngelOrder for bulk Target and Stoploss check",
              orderDbId: o.id,
              userId: user.id,
            });

            let isSellOrder = null;
            let isCencellOrder = null

             if(req.body.reason==='STOPLOSS') {

              isSellOrder = stoplossOrderId
              isCencellOrder = targetOrderId

             }else{
                isSellOrder = targetOrderId
                isCencellOrder = stoplossOrderId
             }

            await checkTargetAndStoplossAngelOrder(user,isSellOrder,o.orderid,isCencellOrder);

            logSuccess(req, {
              msg: "AngelOne Target and Stoploss check completed",
              orderDbId: o.id,
              userId: user.id,
            });
          } else if (broker === "kite" && user.role === "user") {
            logSuccess(req, {
              msg: "Calling placeKiteOrder for bulk Target and Stoploss check",
              orderDbId: o.id,
              userId: user.id,
            });

             if(req.body.reason==='STOPLOSS') {

              isSellOrder = stoplossOrderId
              isCencellOrder = targetOrderId

             }else{
                isSellOrder = targetOrderId
                isCencellOrder = stoplossOrderId
             }

            await checkTargetAndStoplossKiteOrder(user,isSellOrder,o.orderid,isCencellOrder);

            logSuccess(req, {
              msg: "Kite Target and Stoploss check completed",
              orderDbId: o.id,
              userId: user.id,
            });
          } else if (broker === "fyers" && user.role === "user") {
            logSuccess(req, {
              msg: "Calling placeFyersOrder for bulk Target and Stoploss check",
              orderDbId: o.id,
              userId: user.id,
            });

            // await placeFyersOrder(user, req);

            logSuccess(req, {
              msg: "Fyers square-off completed",
              orderDbId: o.id,
              userId: user.id,
            });
          } else if (broker === "finvasia" && user.role === "user") {
            logSuccess(req, {
              msg: "Calling placeFinavasiaOrder for bulk Target and Stoploss check",
              orderDbId: o.id,
              userId: user.id,
            });

            // await placeFinavasiaOrder(user, req, true);

            logSuccess(req, {
              msg: "Finvasia Target and Stoploss check completed",
              orderDbId: o.id,
              userId: user.id,
            });
          } else {
            logSuccess(req, {
              msg: "Target and Stoploss check skipped: invalid/unknown broker",
              orderDbId: o.id,
              brokerName: user.brokerName,
              brokerValue: user.broker,
              userId: user.id,
            });

            return {
              orderId: o.id,
              result: "INVALID_BROKER",
              message: `Unknown broker: ${user.broker}`,
            };
          }

          logSuccess(req, {
            msg: "Target and Stoploss check processed successfully for order",
            orderDbId: o.id,
            broker: user.broker,
            brokerName: user.brokerName,
            userId: user.id,
          });

          return {
            orderId: o.id,
            broker: user.broker,
          };
        } catch (e) {
          logError(req, e, {
            msg: "Target and Stoploss check failed for order",
            orderDbId: o.id,
            userId: o.userId,
          });

          return {
            orderId: o.id,
            result: "FAILED",
            message: safeErr(e),
          };
        }
      })
    );

    logSuccess(req, {
      msg: "All Target and Stoploss promises settled",
      total: results.length,
    });

    // 4) Normalize Promise results
    const finalOutput = results.map((r, i) => {
      if (r.status === "fulfilled") {
        logSuccess(req, {
          msg: "Target and Stoploss check promise fulfilled",
          orderDbId: openOrders[i]?.id,
          result: r.value?.result || "OK",
        });
        return r.value;
      }

      logError(req, r.reason, {
        msg: "Target and Stoploss check promise rejected",
        orderDbId: openOrders[i]?.id,
      });

      return { orderId: openOrders[i].id, result: "PROMISE_REJECTED" };
    });

    logSuccess(req, {
      msg: "Bulk Target and Stoploss check completed",
      outputCount: finalOutput.length,
    });

     console.log("===================group req end=====================");

    return res.json({
      status: true,
      message: "Bulk Target and Stoploss check complete",
      data: finalOutput,
    });
  } catch (error) {
    logError(req, error, { msg: "adminMultipleSquareOff failed unexpectedly" });

    return res.json({
      status: false,
      message: "Something went wrong",
      error: safeErr(error),
    });
  }
};









