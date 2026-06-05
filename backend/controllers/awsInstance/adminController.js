// adminController.js
import axios from "axios";
import User from "../../models/userModel.js";
import Order from "../../models/orderModel.js";
import { generateStrategyUniqueId } from "../../utils/randomWords.js";
import { logSuccess, logError } from "../../utils/loggerr.js";
import { emitOrderGet } from "../../services/smartapiFeed.js";
import { Op } from "sequelize";
import { getKiteClientForUserId } from "../../services/userKiteBrokerService.js";
import awsProvisioner from "../../services/awsServices/awsProvisioner.js";
import StrategyUserModel from "../../models/strategyUserModel.js";




export const getStrategyMaxQuantity = async (strategyId = null, strategyName = null, quantitySource = 0,lotSizeSource=0) => {
  try {
    // ✅ Check if at least one identifier is provided
    if (!strategyId && !strategyName) {
      console.warn("Neither strategyId nor strategyName provided");
      return quantitySource || 0;
    }

    // ✅ Build where condition dynamically
    const whereCondition = {};
    if (strategyId) {
      whereCondition.id = strategyId;
    }
    if (strategyName) {
      whereCondition.strategyName = strategyName.trim().toLowerCase();
    }

    const strategy = await StrategyUserModel.findOne({
      where: whereCondition
    });
    
    // ✅ Your logic: if maxLotSize is 0, return quantitySource, else return maxLotSize
    if (strategy.maxLotSize === 0) {
      return quantitySource || 0;
    } else {
      return strategy.maxLotSize*lotSizeSource || 0;
    }
    
  } catch (error) {
    console.error("Error fetching strategy max quantity:", error);
    return quantitySource || 0;
  }
};

export const getReBuyStrategyMaxQuantity = async (strategyName, quantitySource = 0,oldQuantity=0) => {
  try {
    
    // ✅ Build where condition dynamically
    const whereCondition = {};

    if (strategyName) {
      whereCondition.strategyName = strategyName.trim().toLowerCase();
    }

    const strategy = await StrategyUserModel.findOne({
      where: whereCondition
    });
    
    // ✅ Your logic: if maxLotSize is 0, return quantitySource, else return maxLotSize
    if (strategy.maxLotSize === 0) {
      return quantitySource || 0;
    } else {
      return oldQuantity || 0;
    }
    
  } catch (error) {
    console.error("Error fetching strategy max quantity:", error);
    return quantitySource || 0;
  }
};

// ============== Instance Service Call ==============
const callInstancePlaceOrder = async (user, input, req,kiteInstance) => {
  try {

    const instanceUrl = `http://${user.publicIp}`;

    //  const instanceUrl = `http://localhost:6000`;

    const endpoint = '/api/order/execute';
    
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        brokerName: user.brokerName,
        authToken: user.authToken,
        ...user
        // Add any other user-specific data needed for order placement
      },
      orderInput: input,
      reqInfo: {
        originalReqId: req.id,
        timestamp: new Date().toISOString()
      },
      useMappings:true,
      kiteInstance
    };

     

    logSuccess(req, {
      msg: "Calling instance for order placement",
      userId: user.id,
      instanceUrl,
      brokerName: user.brokerName
    });

   
   

    const response = await axios.post(instanceUrl + endpoint, payload, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
        'X-Instance-Id': user?.instanceId||'35.154.20.130'
      }
    });

    logSuccess(req, {
      msg: "Instance order placement response received",
      userId: user.id,
      responseStatus: response.data?.status
    });

    return response.data;

  } catch (err) {
    logError(req, err, {
      msg: "Failed to call instance for order placement",
      userId: user.id,
      instanceId: user.instanceId,
      instanceIp: user.instanceIp
    });

    return {
      status: false,
      result: "INSTANCE_ERROR",
      message: err.message,
      userId: user.id,
      broker: user.brokerName
    };
  }
};

// ============== Instance Service Call ==============
export const callInstanceGetPosition = async (user,req) => {
  try {

    const instanceUrl = `http://${user.publicIp}`;

    const endpoint = '/api/order/getkotakposition';
    
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        brokerName: user.brokerName,
        authToken: user.authToken,
        ...user
      },
 
    };

    logSuccess(req, {
      msg: "Calling instance for order placement",
      userId: user.id,
      instanceUrl,
      brokerName: user.brokerName
    });

   
    console.log('============================ before response=============');

    const response = await axios.post(instanceUrl + endpoint, payload, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/json',
        'X-Instance-Id': user?.instanceId||'35.154.20.130'
      }
    });

    console.log('============================response=============',response.data);

    logSuccess(req, {
      msg: "Instance order placement response received",
      userId: user.id,
    });

    return response.data;

  } catch (err) {


    console.log(err.response.data,'=============callInstanceGetPosition===========');
    

    logError(req, err, {
      msg: "Failed to call instance for order placement",
      userId: user.id,
      instanceId: user.instanceId,
      instanceIp: user.instanceIp
    });

    return {
      status: false,
      result: "INSTANCE_ERROR",
      message: err.message,
      userId: user.id,
      broker: user.brokerName
    };
  }
};

// Updated adminPlaceMultiBrokerOrder
export const adminPlaceAWSOrder = async (req, res) => {
  try {

    let tempOrder

    let input = req.body;

     const { strategyId, lotsize } = input;

  // ✅ Sirf strategy ki maxLotSize quantity lo, input quantity ignore karo
    const quantity = await getStrategyMaxQuantity(strategyId,null,input.quantity,input.lotsize);

    input.quantity = quantity

    // Generate strategyUniqueId
    const strategyUniqueId = await generateStrategyUniqueId(input.groupName);
    
    // Add into input object
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

    // 4️⃣ Execute orders per broker via instances
    const settled = await Promise.allSettled(
      users.map(async (user) => {
        logSuccess(req, {
          msg: "Processing user for broker order",
          userId: user.id,
          brokerName: user.brokerName,
          instanceId: user.instanceId,
          instanceIp: user.instanceIp
        });

        try {

        // Check if user has instance information

          if ( !user.publicIp) {
            logError(req, new Error("Missing instance information"), {
              msg: "User missing instance and public  configuration",
              userId: user.id,
              brokerName: user.brokerName
            });

            return {
              userId: user.id,
              broker: user.brokerName,
              result: "INSTANCE_MISSING",
              message: "Instance configuration missing for user"
            };
          }

   let tradingsymbol, symboltoken, exchange;

   // Simple condition based on broker
if(user.brokerName === 'angelone') {
  tradingsymbol = input.symbol;
  symboltoken = input.token;
  exchange = input.exch_seg;
} 
else if(user.brokerName === 'kite') {
  tradingsymbol = input.kiteSymbol || input.symbol;
  symboltoken = input.kiteToken || input.token;
  exchange = input.exch_seg === 'NFO' ? 'NFO' : input.exch_seg;
}
else if(user.brokerName === 'fyers') {
  tradingsymbol = input.fyersSymbol || input.symbol;
  symboltoken = input.fyersToken || input.token;
  exchange = input.exch_seg === 'NFO' ? 'NSE' : input.exch_seg;
}
else if(user.brokerName === 'upstox') {
  tradingsymbol = input.upstoxSymbol || input.symbol;
  symboltoken = input.upstoxToken || input.token;
  exchange = input.exch_seg === 'NFO' ? 'NSE_FO' : input.exch_seg;
}
else if(user.brokerName === 'groww') {
  tradingsymbol = input.growwTradingSymbol || input.symbol;
  symboltoken = input.growToken || input.token;
  exchange = input.growwSegment || input.exch_seg;
}else if(user.brokerName==="finvasia") {
  tradingsymbol = input.finavasiaSymbol || input.symbol;
  symboltoken = input.finavasiaToken || input.token;
  exchange = input.growwExchange || input.exch_seg;
}
else if(user.brokerName==="kotak neo") {

  tradingsymbol = input.kotakSymobol || input.symbol;
  symboltoken = input?.finavasiaToken || input.token;
  exchange = input.kotakExchange || input.exch_seg;
}
else {
  // Default
  tradingsymbol = input.symbol;
  symboltoken = input.token;
  exchange = input.exch_seg;
}


 

    const orderData = {
      variety: input.variety || "NORMAL",
      tradingsymbol:tradingsymbol,
      symboltoken: symboltoken,
       instrumenttype: input.instrumenttype,
      transactiontype: input.transactiontype,
      exchange: exchange,
      ordertype: input.orderType,
      lotsize: input?.lotsize||0,
      quantity: String(input.quantity),
      fillsize: String(input.quantity),
      producttype: input.productType,
      duration: input.duration,
      price: input.price || "0",
      triggerprice: input.triggerprice || 0,
      squareoff: input.squareoff || 0,
      stoploss: input.stoploss || 0,
      orderstatuslocaldb: "PENDING",
      totalPrice: input.totalPrice ?? null,
      actualQuantity: input.actualQuantity ?? null,
      userId: user.id,
      userNameId: user.username,
      ordertag: "softwaresetu",
      broker: "angelone",
      buyOrderId: input?.buyOrderId || null,
      strategyName: input?.groupName || "",
      strategyUniqueId: input?.strategyUniqueId || "",
      text: input?.text||"",
      angelOneSymbol: input.angelOneSymbol || input.symbol,
      angelOneToken: input.angelOneToken || input.token,
    };

     

    // ================= STEP 1: CREATE PENDING ORDER =================
    tempOrder = await Order.create(orderData);

    let kiteInstance

     if(user.brokerName==='kite') {

         kiteInstance = await getKiteClientForUserId(user.id);

     }


    // ================= STEP 2: CALL INSTANCE =================
    const instanceResponse = await callInstancePlaceOrder(user, input, req,kiteInstance);

    console.log(instanceResponse,'==============instanceResponse==============');
    

    // ================= STEP 3: HANDLE RESPONSE =================

// ================= ✅ SUCCESS =================
if (instanceResponse.status && input.transactiontype === "BUY") {

   console.log('==============instanceResponse buy ==============');

  const existingOrder = await Order.findOne({
    where: {
      userId: user.id,
      tradingsymbol: input.symbol,
      transactiontype: "BUY",
      status: "COMPLETE",
      orderstatuslocaldb: "OPEN",
      id: { [Op.ne]: tempOrder.id } // ⚠️ current record exclude
    }
  });

    const nowISOError = new Date().toISOString();

  if (existingOrder) {

    console.log(existingOrder,'==============existingOrder buy ==============');
    // 👉 AVG LOGIC
    const oldQty = Number(existingOrder.quantity);
    const oldPrice = Number(existingOrder.price);

    const newQty = Number(instanceResponse?.orderDetails?.quantity||0);
    const newPrice = Number(instanceResponse?.orderDetails?.avgPrice||0);

    const totalQty = oldQty + newQty;

    const avgPrice =
      ((oldQty * oldPrice) + (newQty * newPrice)) / totalQty;

    // 🔹 Update existing (main position)
    await existingOrder.update({
      quantity: totalQty,
      fillsize: totalQty,
      fillprice:avgPrice.toFixed(2),
      price: avgPrice.toFixed(2),
      tradedValue:totalQty * avgPrice,
      text: "UPDATED_AVG_ORDER"
    });

     console.log('==============existingOrder update ==============');

    // 🔹 Delete current tempOrder 
    await tempOrder.destroy();
  } else {


        console.log( instanceResponse?.orderDetails?.orderid,'==============existingOrder else  buy ==============');

    // 👉 First BUY → just complete current
    await tempOrder.update({
      status: "COMPLETE",
      orderstatuslocaldb: "OPEN",
      positionStatus: "OPEN",
      orderid: instanceResponse?.orderDetails?.orderid,
      fillid: instanceResponse?.orderDetails?.fillId,
      price:instanceResponse?.orderDetails?.avgPrice,
      fillprice:instanceResponse?.orderDetails?.avgPrice,
      tradedValue:instanceResponse?.orderDetails?.tradedValue,
      fillsize:instanceResponse?.orderDetails?.quantity,
      quantity:instanceResponse?.orderDetails?.quantity,
      text: instanceResponse?.message,
      filltime:nowISOError
    });
  }

} else {
  // ================= ❌ FAIL =================

   console.log('==============existingOrder FAILED  buy ==============');
  await tempOrder.update({
    status: "FAILED",
    orderstatuslocaldb: "FAILED",
    orderid: instanceResponse.orderId || null,
    text: instanceResponse.message,
    rawresponse: instanceResponse,
  });
}
          
          
          return {
            userId: user.id,
            broker: user.brokerName,
            ...instanceResponse
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
        logError(req, item?.reason || "", {
          msg: "Broker order rejected",
          userId: user?.id || "",
          broker: user?.brokerName || "",
        });
        return {
          userId: user?.id || "",
          broker: user?.brokerName || "",
          result: "REJECTED",
          message: item?.reason?.message || String(item?.reason || "") || "",
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


// ============== Updated ReBuy Order Controller with Instance Approach ==============
export const adminPlaceReBuyOrder = async (req, res) => {
  try {

    const input = req.body;

    const strategyUniqueIdName = input?.strategyUniqueId?.slice(9);

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
      clients = [{
        ...input.selectedClient,
        orderId: input.orderId
      }];
    }

    if (!clients?.length) {
      return res.json({
        status: false,
        message: input.flag === 'GROUP' ? "No clients for GROUP" : "No client for SINGLE"
      });
    }

    const results = await Promise.allSettled(
      clients.map(async (client, idx) => {
        let tempOrder = null;
        
        try {
          req.userId = client?.userId;

          // Fetch user details
          const user = await User.findOne({
            where: { id: client.userId },
            raw: true,
          });

          if (!user) {
            return {
              userId: client.userId,
              result: "NO_USER",
              message: "User not found",
            };
          }

          if (!user.authToken) {
            return {
              userId: user.id,
              result: "NO_TOKEN",
              message: "User does not have broker authToken",
            };
          }

          if (!user.brokerName) {
            return {
              userId: user.id,
              result: "NO_BROKER",
              message: "User broker not selected",
            };
          }

          // Check if user has instance information
          if (!user.publicIp) {
            logError(req, new Error("Missing instance information"), {
              msg: "User missing instance configuration",
              userId: user.id,
              brokerName: user.brokerName
            });

            return {
              userId: user.id,
              broker: user.brokerName,
              result: "INSTANCE_MISSING",
              message: "Instance configuration missing for user"
            };
          }

          // Fetch the original OPEN order
          const originalOrder = await Order.findOne({
            where: {
              userId: client.userId,
              orderid: client?.orderId,
              orderstatuslocaldb: "OPEN",
            },
            raw: true,
          });

          if (!originalOrder) {
            return {
              userId: user.id,
              result: "ORDER_NOT_FOUND",
              message: "Original OPEN order not found",
            };
          }

                // ✅ Sirf strategy ki maxLotSize quantity lo, input quantity ignore karo
    const quantity = await getReBuyStrategyMaxQuantity(strategyUniqueIdName,input.quantity,originalOrder.quantity);

    input.quantity = quantity

          const sellQtyFinal = input?.quantity || quantity;

          // Prepare broker-specific symbols
          let tradingsymbol, symboltoken, exchange;

          if (user.brokerName === 'angelone') {
            tradingsymbol = originalOrder.tradingsymbol;
            symboltoken = originalOrder.symboltoken;
            exchange = originalOrder.exchange;
          } 
          else if (user.brokerName === 'kite') {
            tradingsymbol = originalOrder.kiteSymbol || originalOrder.tradingsymbol;
            symboltoken = originalOrder.kiteToken || originalOrder.symboltoken;
            exchange = originalOrder.exchange === 'NFO' ? 'NFO' : originalOrder.exchange;
          }
          else if (user.brokerName === 'fyers') {
            tradingsymbol = originalOrder.fyersSymbol || originalOrder.tradingsymbol;
            symboltoken = originalOrder.fyersToken || originalOrder.symboltoken;
            exchange = originalOrder.exchange === 'NFO' ? 'NSE' : originalOrder.exchange;
          }
          else if (user.brokerName === 'upstox') {
            tradingsymbol = originalOrder.upstoxSymbol || originalOrder.tradingsymbol;
            symboltoken = originalOrder.upstoxToken || originalOrder.symboltoken;
            exchange = originalOrder.exchange === 'NFO' ? 'NSE_FO' : originalOrder.exchange;
          }
          else if (user.brokerName === 'groww') {
            tradingsymbol = originalOrder.growwTradingSymbol || originalOrder.tradingsymbol;
            symboltoken = originalOrder.growToken || originalOrder.symboltoken;
            exchange = originalOrder.growwSegment || originalOrder.exchange;
          }
          else if (user.brokerName === "finvasia") {
            tradingsymbol = originalOrder.finavasiaSymbol || originalOrder.tradingsymbol;
            symboltoken = originalOrder.finavasiaToken || originalOrder.symboltoken;
            exchange = originalOrder.growwExchange || originalOrder.exchange;
          }
          else if (user.brokerName === "kotak neo") {
            tradingsymbol = originalOrder.kotakSymbol || originalOrder.tradingsymbol;
            symboltoken = originalOrder.kotakToken || originalOrder.symboltoken;
            exchange = originalOrder.kotakExchange || originalOrder.exchange;
          }
          else {
            tradingsymbol = originalOrder.tradingsymbol;
            symboltoken = originalOrder.symboltoken;
            exchange = originalOrder.exchange;
          }

          // Common reqInput format for instance
          const reqInput = {
            variety: originalOrder.variety || "NORMAL",
            symbol: tradingsymbol,
            instrumenttype: originalOrder.instrumenttype,
            token: symboltoken,
            exch_seg: exchange,
            orderType: originalOrder.ordertype,
            quantity: sellQtyFinal,
            productType: originalOrder.producttype,
            duration: originalOrder.duration,
            price: originalOrder.price || "0",
            triggerprice: originalOrder.triggerprice || 0,
            squareoff: originalOrder.squareoff || 0,
            stoploss: originalOrder.stoploss || 0,
            transactiontype: "BUY", // Re-buy is BUY transaction
            totalPrice: originalOrder.totalPrice,
            actualQuantity: originalOrder.actualQuantity,
            userId: user.id,
            userNameId: user.username,
            text: `ReBuy Order - Original Order: ${originalOrder.orderid}, Quantity: ${sellQtyFinal}`,
            ordertag: "softwaresetu",
            broker: originalOrder?.broker || user.brokerName,
            buyOrderId: String(originalOrder.orderid),
            groupName: originalOrder?.strategyName || "",
            strategyUniqueId: input.strategyUniqueId,
            // Broker-specific fields
            angelOneToken: originalOrder?.angelOneToken || originalOrder.token,
            angelOneSymbol: originalOrder?.angelOneSymbol || originalOrder.tradingsymbol,
            kiteSymbol: tradingsymbol,
            kiteToken: symboltoken,
            finavasiaSymbol: tradingsymbol,
            finavasiaToken: symboltoken,
            fyersSymbol: tradingsymbol,
            fyersToken: symboltoken,
            growSymbol: tradingsymbol,
            growToken: symboltoken,
            growwSegment: originalOrder.optiontype,
            growwExchange: exchange,
            isReBuyOrder: true,
            originalOrderId: originalOrder.id
          };

          console.log('============= ReBuy Order Input =============', reqInput);

          // Create pending order in database
          const orderData = {
            variety: reqInput.variety,
            tradingsymbol: tradingsymbol,
            symboltoken: symboltoken,
            instrumenttype: reqInput.instrumenttype,
            transactiontype: "BUY",
            exchange: exchange,
            ordertype: reqInput.orderType,
            quantity: String(reqInput.quantity),
            fillsize: String(reqInput.quantity),
            producttype: reqInput.productType,
            duration: reqInput.duration,
            price: reqInput.price || "0",
            triggerprice: reqInput.triggerprice || 0,
            squareoff: reqInput.squareoff || 0,
            stoploss: reqInput.stoploss || 0,
            orderstatuslocaldb: "PENDING",
            totalPrice: reqInput.totalPrice ?? null,
            actualQuantity: reqInput.actualQuantity ?? null,
            userId: user.id,
            userNameId: user.username,
            ordertag: "softwaresetu",
            broker: user.brokerName,
            buyOrderId: reqInput?.buyOrderId || null,
            strategyName: reqInput?.groupName || "",
            strategyUniqueId: reqInput?.strategyUniqueId || "",
            text: reqInput?.text || "",
            angelOneSymbol: reqInput.angelOneSymbol || tradingsymbol,
            angelOneToken: reqInput.angelOneToken || symboltoken,
            isReBuyOrder: true,
            parentOrderId: originalOrder.id
          };

          tempOrder = await Order.create(orderData);

          // Get Kite instance if needed
          let kiteInstance = null;
          if (user.brokerName === 'kite') {
            kiteInstance = await getKiteClientForUserId(user.id);
          }

          // ========== CALL INSTANCE FOR ORDER PLACEMENT ==========
          const instanceResponse = await callInstancePlaceOrder(user, reqInput, req, kiteInstance);

          console.log('============= Instance Response for ReBuy =============', instanceResponse);

          // ========== HANDLE INSTANCE RESPONSE ==========
          const nowISOError = new Date().toISOString();

          if (instanceResponse.status && instanceResponse.result === "SUCCESS") {
            // Check if there's an existing OPEN BUY order for averaging
            const existingOrder = await Order.findOne({
              where: {
                userId: user.id,
                tradingsymbol: tradingsymbol,
                transactiontype: "BUY",
                status: "COMPLETE",
                orderstatuslocaldb: "OPEN",
                id: { [Op.ne]: tempOrder.id } // Exclude current order
              }
            });

            if (existingOrder) {
              // AVERAGE LOGIC - Combine with existing position
              console.log('============= Existing order found for averaging =============', existingOrder.id);

              const oldQty = Number(existingOrder.quantity);
              const oldPrice = Number(existingOrder.fillprice || existingOrder.price);

              const newQty = Number(instanceResponse?.orderDetails?.quantity || sellQtyFinal);
              const newPrice = Number(instanceResponse?.orderDetails?.avgPrice || instanceResponse?.orderDetails?.price || reqInput.price);

              const totalQty = oldQty + newQty;
              const avgPrice = ((oldQty * oldPrice) + (newQty * newPrice)) / totalQty;

              // Update existing order with averaged values
              await existingOrder.update({
                quantity: totalQty,
                fillsize: totalQty,
                fillprice: avgPrice.toFixed(2),
                price: avgPrice.toFixed(2),
                tradedValue: totalQty * avgPrice,
                text: `UPDATED_AVG_ORDER - ReBuy added ${newQty} @ ${newPrice}`,
                rebuyOrderId: tempOrder.id,
                rebuyQuantity: newQty,
                rebuyPrice: newPrice
              });

              // Delete the temporary order (since we merged with existing)
              await tempOrder.destroy();

              logSuccess(req, {
                msg: "ReBuy order merged with existing position",
                userId: user.id,
                oldQty,
                newQty,
                totalQty,
                avgPrice
              });

              return {
                userId: user.id,
                broker: user.brokerName,
                result: "SUCCESS_MERGED",
                message: "ReBuy order placed and merged with existing position",
                originalOrderId: originalOrder.id,
                existingOrderId: existingOrder.id,
                oldQuantity: oldQty,
                newQuantity: newQty,
                totalQuantity: totalQty,
                averagePrice: avgPrice.toFixed(2),
                orderDetails: instanceResponse?.orderDetails
              };

            } else {
              // No existing order - just complete the current order
              console.log('============= No existing order, creating new position =============');

              await tempOrder.update({
                status: "COMPLETE",
                orderstatuslocaldb: "OPEN",
                positionStatus: "OPEN",
                orderid: instanceResponse?.orderDetails?.orderid || instanceResponse?.orderId,
                uniqueOrderId: instanceResponse?.orderDetails?.uniqueOrderId || instanceResponse?.uniqueOrderId,
                fillid: instanceResponse?.orderDetails?.fillId || instanceResponse?.fillId,
                price: instanceResponse?.orderDetails?.avgPrice || instanceResponse?.orderDetails?.price,
                fillprice: instanceResponse?.orderDetails?.avgPrice || instanceResponse?.orderDetails?.price,
                tradedValue: instanceResponse?.orderDetails?.tradedValue || (sellQtyFinal * (instanceResponse?.orderDetails?.price || reqInput.price)),
                fillsize: instanceResponse?.orderDetails?.quantity || sellQtyFinal,
                quantity: instanceResponse?.orderDetails?.quantity || sellQtyFinal,
                filltime: nowISOError,
                text: instanceResponse?.message || "ReBuy order completed successfully"
              });

              logSuccess(req, {
                msg: "ReBuy order placed as new position",
                userId: user.id,
                orderId: tempOrder.id,
                quantity: sellQtyFinal
              });

              return {
                userId: user.id,
                broker: user.brokerName,
                result: "SUCCESS_NEW",
                message: "ReBuy order placed as new position",
                orderId: tempOrder.id,
                quantity: sellQtyFinal,
                price: instanceResponse?.orderDetails?.price || reqInput.price,
                orderDetails: instanceResponse?.orderDetails
              };
            }

          } else {
            // FAILURE - Order placement failed
            console.log('============= ReBuy order failed =============');

            await tempOrder.update({
              status: "FAILED",
              orderstatuslocaldb: "FAILED",
              orderid: instanceResponse.orderId || null,
              text: instanceResponse.message || "ReBuy order placement failed",
              rawresponse: instanceResponse,
            });

            return {
              userId: user.id,
              broker: user.brokerName,
              result: instanceResponse.result || "FAILED",
              message: instanceResponse.message || "Order placement failed",
              orderId: tempOrder.id
            };
          }

        } catch (err) {
          console.log('Error in ReBuy order processing:', err);

          // If tempOrder exists, mark it as failed
          if (tempOrder) {
            await tempOrder.update({
              status: "FAILED",
              orderstatuslocaldb: "FAILED",
              text: err.message,
              rawresponse: { error: err.message, stack: err.stack }
            });
          }

          logError(req, err, {
            msg: "ReBuy order failed for user",
            userId: client?.userId,
            errorMessage: err.message
          });

          return {
            userId: client?.userId,
            result: "ERROR",
            message: err.message,
            error: err.stack
          };
        }
      })
    );

    // // Normalize Promise results
    // const finalOutput = results.map((r, i) => {
    //   if (r.status === "fulfilled") {
    //     return r.value;
    //   }
    //   return {
    //     userId: clients[i]?.userId,
    //     result: "PROMISE_REJECTED",
    //     message: r.reason?.message || "Promise rejected"
    //   };
    // });

    // // Emit socket update to refresh positions
    // logSuccess(req, { msg: "Emitting order update event after ReBuy" });
    // await emitOrderGet();

    // return res.json({
    //   status: true,
    //   message: "ReBuy orders processed",
    //   data: finalOutput,
    //   summary: {
    //     total: finalOutput.length,
    //     successful: finalOutput.filter(r => r.result === "SUCCESS_NEW" || r.result === "SUCCESS_MERGED").length,
    //     failed: finalOutput.filter(r => r.result !== "SUCCESS_NEW" && r.result !== "SUCCESS_MERGED").length,
    //     merged: finalOutput.filter(r => r.result === "SUCCESS_MERGED").length,
    //     new: finalOutput.filter(r => r.result === "SUCCESS_NEW").length
    //   }
    // });

  } catch (error) {
    logError(req, error, { 
      msg: "adminPlaceReBuyOrder failed unexpectedly",
      errorMessage: error.message
    });

    return res.json({
      status: false,
      message: "Something went wrong",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

// Add this new function alongside your existing adminPlaceAWSOrder
export const adminGroupSquareOffAWS = async (req, res) => {
 
  // GLOBAL LOCK (use a Set for locks - consider moving to a shared location or using Redis for distributed locks)
  const strategyLocks = new Set();
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  let reqStrategyUniqueId = req.body.strategyUniqueId
  let reason = req.body?.reason || "";

    

  try {
    // Lock mechanism to prevent concurrent square-offs for same strategy
    if (strategyLocks.has(reqStrategyUniqueId)) {
      await sleep(60000); // Wait 1 minute
      strategyLocks.delete(reqStrategyUniqueId);
    }

    strategyLocks.add(reqStrategyUniqueId);

    const strategyUniqueId = reqStrategyUniqueId;

    // Fetch all OPEN BUY orders for this strategy
    const openOrders = await Order.findAll({
      where: {
        orderstatuslocaldb: "OPEN",
        positionStatus: "OPEN",
        transactiontype: "BUY",
        // orderid:"260401191384961"
        strategyUniqueId: reqStrategyUniqueId,
      },
      raw: true,
    });

    if (!openOrders.length) {
      logSuccess(req, {
        msg: "No OPEN BUY orders found to square off",
        strategyUniqueId: reqStrategyUniqueId,
      });

      return res.json({
        status: false,
        message: "No OPEN (BUY) orders found to square off",
        data: [],
      });
    }

        console.log("=============strategyUniqueId============" );

    // Execute square-off for each order
    const results = await Promise.allSettled(
      openOrders.map(async (order) => {
        try {
          // Fetch user details
          const user = await User.findOne({
            where: { id: order.userId },
            raw: true,
          });

          if (!user) {
            logError(req, new Error("User not found"), {
              msg: "Square-off skipped: user not found",
              orderDbId: order.id,
              userId: order.userId,
            });

            return {
              orderId: order.id,
              userId: order.userId,
              result: "NO_USER",
              message: "User not found",
            };
          }

          if (!user.authToken) {
            logError(req, new Error("Missing authToken"), {
              msg: "Square-off skipped: user missing authToken",
              orderDbId: order.id,
              userId: user.id,
            });

            return {
              orderId: order.id,
              userId: user.id,
              result: "NO_TOKEN",
              message: "User does not have broker authToken",
            };
          }

          if (!user.brokerName) {
            logError(req, new Error("Broker not selected"), {
              msg: "Square-off skipped: user broker not selected",
              orderDbId: order.id,
              userId: user.id,
            });

            return {
              orderId: order.id,
              userId: user.id,
              result: "NO_BROKER",
              message: "User broker not selected",
            };
          }

          // Calculate quantity to sell
          let sellQuantity = order.quantity; // Full square-off

          // Create order input for SELL
          const orderInput = {
            // Core order details
            variety: order.variety || "NORMAL",
            symbol: order.tradingsymbol,
            instrumenttype: order.instrumenttype,
            token: order.symboltoken,
            exch_seg: order.exchange,
            orderType: order.ordertype,
            quantity: sellQuantity,
            //  quantity: 700,
            productType: order.producttype,
            duration: order.duration,
            price: order.price || "0",
            triggerprice: order.triggerprice || 0,
            squareoff: order.squareoff || 0,
            stoploss: order.stoploss || 0,
            transactiontype: "SELL",
            
            // Additional metadata
            totalPrice: order.totalPrice,
            actualQuantity: order.actualQuantity,
            userId: user.id,
            userNameId: user.username,
            text: `SquareOff: ${reason || "Manual square-off"}`,
            
            // Broker-specific fields
            angelOneToken: order?.angelOneToken || order.token,
            angelOneSymbol: order?.angelOneSymbol || order.tradingsymbol,
           
            
            // Strategy info
            groupName: order?.strategyName || "",
            strategyUniqueId: strategyUniqueId,
            buyOrderId: String(order.orderid), // Original buy order ID for reference
            broker: order?.broker || user.brokerName,
          };

          logSuccess(req, {
            msg: "Processing square-off via instance",
            userId: user.id,
            brokerName: user.brokerName,
            orderId: order.id,
            symbol: order.tradingsymbol,
            quantity: sellQuantity,
            totalQuantity: order.quantity,
            isPartial: sellQuantity < order.quantity
          });

          // Fetch the original BUY order details using orderid (broker's order ID)
          const originalBuyOrder = await Order.findOne({
            where: { 
              orderid: order.orderid, // This is the broker's order ID from the original BUY
              transactiontype: "BUY",
              userId: user.id,
              status:"COMPLETE",
              orderstatuslocaldb:"OPEN"
            },
            raw: true
          });

          if (!originalBuyOrder) {
            logError(req, new Error("Original BUY order not found"), {
              msg: "Cannot find original BUY order for PnL calculation",
              orderId: order.id,
              orderid: order.orderid,
              userId: user.id
            });

            return {
              orderId: order.id,
              userId: user.id,
              result: "BUY_ORDER_NOT_FOUND",
              message: "Original BUY order not found for PnL calculation"
            };
          }


          

          // Create pending SELL order in database
          const sellOrderData = {
            variety: orderInput.variety,
            tradingsymbol: orderInput.symbol,
            instrumenttype: orderInput.instrumenttype,
            symboltoken: orderInput.token,
            transactiontype: "SELL",
            exchange: orderInput.exch_seg,
            ordertype: orderInput.orderType,
            quantity: String(orderInput.quantity),
            fillsize: String(orderInput.quantity),
            producttype: orderInput.productType,
            duration: orderInput.duration,
            price: orderInput.price || "0",
            triggerprice: orderInput.triggerprice || 0,
            squareoff: orderInput.squareoff || 0,
            stoploss: orderInput.stoploss || 0,
            orderstatuslocaldb: "PENDING",
            totalPrice: orderInput.totalPrice ?? null,
            actualQuantity: orderInput.actualQuantity ?? null,
            userId: user.id,
            userNameId: user.username,
            ordertag: "softwaresetu",
            broker: user.brokerName,
            buyOrderId: orderInput?.buyOrderId || null, // Store original BUY order's broker order ID
            strategyName: orderInput?.groupName || "",
            strategyUniqueId: orderInput?.strategyUniqueId || "",
            text: orderInput?.text || "",
            angelOneSymbol: orderInput.angelOneSymbol || orderInput.symbol,
            angelOneToken: orderInput.angelOneToken || orderInput.token,
            parentOrderId: order.id, // Reference to original BUY order's database ID
            // Store BUY order reference details for PnL calculation
            buyvalue: originalBuyOrder.tradedValue || (originalBuyOrder.quantity * originalBuyOrder.price),
            buyprice: originalBuyOrder.price || originalBuyOrder.fillprice,
            buysize: originalBuyOrder.quantity,
            
          };

              console.log("=============sellOrderData============" );

          const tempSellOrder = await Order.create(sellOrderData);

            const nowISOError = new Date().toISOString();


             console.log("=============callInstancePlaceOrder============" );

          // ========== CALL INSTANCE FOR ORDER PLACEMENT ==========
          const instanceResponse = await callInstancePlaceOrder(user, orderInput, req);

             console.log("=============instanceResponse============" ,instanceResponse);

          logSuccess(req, {
            msg: "Instance response received for square-off",
            userId: user.id,
            responseStatus: instanceResponse?.status,
            responseResult: instanceResponse?.result
          });

          // ========== HANDLE INSTANCE RESPONSE ==========
          if (instanceResponse.status && instanceResponse.result === "SUCCESS") {
            // Calculate PnL after successful sell
            const sellPrice = instanceResponse?.orderDetails?.avgPrice || instanceResponse?.orderDetails?.price;
            const sellQuantityFilled = instanceResponse?.orderDetails?.quantity || sellQuantity;
            const sellValue = sellPrice * sellQuantityFilled;
            
            // Get buy details from original order
            const buyPrice = originalBuyOrder.price || originalBuyOrder.fillprice;
            const buyQuantity = originalBuyOrder.quantity;
            const buyValue = originalBuyOrder.tradedValue || (buyPrice * buyQuantity);
            
            // Calculate PnL
            let pnl = null;
            if (buyPrice && sellPrice) {
              pnl = (sellPrice - buyPrice) * Math.min(sellQuantityFilled, buyQuantity);
              pnl = parseFloat(pnl.toFixed(5));
            }

            logSuccess(req, {
              msg: "PnL calculated for square-off",
              userId: user.id,
              buyPrice,
              sellPrice,
              quantity: sellQuantityFilled,
              pnl
            });


            console.log('================ before  sell update===================');
            

            // SUCCESSFUL SELL - Update the SELL order record with PnL and buy details
            await tempSellOrder.update({
              status: "COMPLETE",
              orderstatuslocaldb: "COMPLETE",
              positionStatus: "COMPLETE",
              orderid: instanceResponse?.orderDetails?.orderid || instanceResponse?.orderId,
              uniqueOrderId: instanceResponse?.orderDetails?.uniqueOrderId || instanceResponse?.uniqueOrderId,
              fillid: instanceResponse?.orderDetails?.fillId,
              price: sellPrice,
              fillprice: sellPrice,
              tradedValue: sellValue,
              fillsize: sellQuantityFilled,
              quantity: sellQuantityFilled,
              filltime:nowISOError,
              text: instanceResponse?.message || "Square-off completed",
              // Update PnL fields
              pnl: pnl,
              // Ensure buy reference fields are properly set (if not already)
              buyOrderId: originalBuyOrder.orderid, // Store the broker's BUY order ID
              buyvalue: buyValue,
              buyprice: buyPrice,
              buysize: buyQuantity,
              buyTime: originalBuyOrder?.filltime
            });

            console.log(sellQuantity, order.quantity,'================ after  sell update===================');

            // Update the original BUY order position status
            if (sellQuantity >= order.quantity) {
              // Full square-off - close the BUY position
              await Order.update(
                {
                  positionStatus: "COMPLETE",
                  orderstatuslocaldb: "COMPLETE"
                },
                { where: { id: order.id } }
              );
            } else {
              
              console.log('===============remaing quantity ===============');
              
            }

            return {
              orderId: order.id,
              sellOrderId: tempSellOrder.id,
              userId: user.id,
              broker: user.brokerName,
              result: "SUCCESS",
              message: instanceResponse?.message || "Square-off completed",
              quantity: sellQuantityFilled,
              isPartial: sellQuantity < order.quantity,
              remainingQuantity: sellQuantity < order.quantity ? order.quantity - sellQuantity : 0,
              pnl: pnl,
              buyPrice: buyPrice,
              sellPrice: sellPrice,
              orderDetails: instanceResponse?.orderDetails
            };
          } 
          else if (instanceResponse.result === "BROKER_REJECTED") {
            // Broker rejected the order - don't calculate PnL
            await tempSellOrder.update({
              status: "FAILED",
              orderstatuslocaldb: "FAILED",
              orderid: instanceResponse.orderId || null,
              text: instanceResponse.message,
              rawresponse: instanceResponse,
            });

            return {
              orderId: order.id,
              userId: user.id,
              broker: user.brokerName,
              result: "BROKER_REJECTED",
              message: instanceResponse.message,
              quantity: sellQuantity
            };
          }
          else if (instanceResponse.result === "INSTANCE_ERROR") {
            // Instance call failed
            await tempSellOrder.update({
              status: "FAILED",
              orderstatuslocaldb: "FAILED",
              text: `Instance error: ${instanceResponse.message}`,
              rawresponse: instanceResponse,
            });

            return {
              orderId: order.id,
              userId: user.id,
              broker: user.brokerName,
              result: "INSTANCE_ERROR",
              message: instanceResponse.message,
              quantity: sellQuantity
            };
          }
          else {
            // Other errors
            await tempSellOrder.update({
              status: "FAILED",
              orderstatuslocaldb: "FAILED",
              text: instanceResponse.message || "Unknown error",
              rawresponse: instanceResponse,
            });

            return {
              orderId: order.id,
              userId: user.id,
              broker: user.brokerName,
              result: "FAILED",
              message: instanceResponse.message || "Order placement failed",
              quantity: sellQuantity
            };
          }

        } catch (err) {

          console.log( err.message,' err.message err.message err.message');
          
          logError(req, err, {
            msg: "Square-off failed for order",
            orderId: order?.id,
            userId: order?.userId,
            errorMessage: err.message
          });

          return {
            orderId: order?.id,
            userId: order?.userId,
            result: "ERROR",
            message: err.message,
            error: err.stack
          };
        }
      })
    );

    // Normalize results from Promise.allSettled
    const normalizedResults = results.map((item, idx) => {
      const order = openOrders[idx];
      
      if (item.status === "fulfilled") {
        return item.value;
      } else {
        logError(req, item.reason, {
          msg: "Square-off promise rejected",
          orderId: order?.id,
          userId: order?.userId
        });
        
        return {
          orderId: order?.id,
          userId: order?.userId,
          result: "PROMISE_REJECTED",
          message: item.reason?.message || "Promise rejected",
          error: item.reason
        };
      }
    });

    // Emit socket update to refresh positions
    logSuccess(req, { msg: "Emitting order update event after square-off" });
    await emitOrderGet();

    // Release lock
    strategyLocks.delete(reqStrategyUniqueId);

    return res.json({
      status: true,
      message: "Square-off orders processed",
      data: normalizedResults,
      summary: {
        total: normalizedResults.length,
        successful: normalizedResults.filter(r => r.result === "SUCCESS").length,
        failed: normalizedResults.filter(r => r.result !== "SUCCESS").length,
        partialSells: normalizedResults.filter(r => r.isPartial === true).length,
        totalPnl: normalizedResults
          .filter(r => r.result === "SUCCESS" && r.pnl)
          .reduce((sum, r) => sum + r.pnl, 0)
          .toFixed(2)
      }
    });

  } catch (error) {
    logError(req, error, {
      msg: "adminGroupSquareOffAWS failed unexpectedly",
      strategyUniqueId: reqStrategyUniqueId,
      errorMessage: error.message
    });

    // Release lock in case of error
    strategyLocks.delete(reqStrategyUniqueId);

    return res.json({
      status: false,
      message: "Square-off processing failed",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

// ================== update logger code======================
export const adminSquareOff = async (req, res) => {
  try {

    // 1) Time window for today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const openOrders = await Order.findAll({
      where: {
        orderstatuslocaldb: "OPEN",
        transactiontype: "BUY",
        positionStatus: "OPEN",
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
          req.userId = o?.userId;

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
          let reason = req.body?.reason;

          // Calculate quantity to sell
          let sellQuantity = o.quantity; // Full square-off

          // Common reqInput format for both services
          const reqInput = {
            // Core order details
            variety: o.variety || "NORMAL",
            symbol: o.tradingsymbol,
            instrumenttype: o.instrumenttype,
            token: o.symboltoken,
            orderType: o.ordertype,
            quantity: sellQuantity,
            productType: o.producttype,
            duration: o.duration,
            exch_seg: o.exchange,
            price: o.price || "0",
            triggerprice: o.triggerprice || 0,
            squareoff: o.squareoff || 0,
            stoploss: o.stoploss || 0,
            transactiontype,
            
            // Additional metadata
            totalPrice: o.totalPrice,
            actualQuantity: o.actualQuantity,
            userId: user.id,
            userNameId: user.username,
            ordertag: "softwaresetu",
            text: `SquareOff: ${reason}`,
            
            // Broker-specific fields
            angelOneToken: o?.angelOneToken || o.token,
            angelOneSymbol: o?.angelOneSymbol || o?.symbol,
            broker: o?.broker || user.brokerName,
            buyOrderId: String(o.orderid),
            
            // Strategy info
            groupName: o?.strategyName || "",
            strategyUniqueId: strategyUniqueId,
            
            // Additional broker symbols
            kiteSymbol: o.tradingsymbol || o.angelOneSymbol,
            kiteToken: o.symboltoken || o.angelOneToken,
            finavasiaSymbol: o.tradingsymbol || o.angelOneSymbol,
            finavasiaToken: o?.symboltoken || o?.angelOneToken,
            FyersSymbol: o.tradingsymbol || o.angelOneSymbol,
            fyersToken: o.symboltoken || o.angelOneToken,
            growToken: o.tradingsymbol,
            growwSegment: o.optiontype,
            growwExchange: o.exchange,
          };

          console.log(reqInput, '=============reqInput=============');

          // Fetch the original BUY order details for PnL calculation
          const originalBuyOrder = await Order.findOne({
            where: {
              orderid: o.orderid,
              transactiontype: "BUY",
              userId: user.id,
              status: "COMPLETE",
              orderstatuslocaldb: "OPEN"
            },
            raw: true
          });

          if (!originalBuyOrder) {
            logError(req, new Error("Original BUY order not found"), {
              msg: "Cannot find original BUY order for PnL calculation",
              orderId: o.id,
              orderid: o.orderid,
              userId: user.id
            });

            return {
              orderId: o.id,
              result: "BUY_ORDER_NOT_FOUND",
              message: "Original BUY order not found for PnL calculation"
            };
          }

          // Create pending SELL order in database
          const sellOrderData = {
            variety: reqInput.variety,
            tradingsymbol: reqInput.symbol,
            instrumenttype: reqInput.instrumenttype,
            symboltoken: reqInput.token,
            transactiontype: "SELL",
            exchange: reqInput.exch_seg,
            ordertype: reqInput.orderType,
            quantity: String(reqInput.quantity),
            fillsize: String(reqInput.quantity),
            producttype: reqInput.productType,
            duration: reqInput.duration,
            price: reqInput.price || "0",
            triggerprice: reqInput.triggerprice || 0,
            squareoff: reqInput.squareoff || 0,
            stoploss: reqInput.stoploss || 0,
            orderstatuslocaldb: "PENDING",
            totalPrice: reqInput.totalPrice ?? null,
            actualQuantity: reqInput.actualQuantity ?? null,
            userId: user.id,
            userNameId: user.username,
            ordertag: "softwaresetu",
            broker: user.brokerName,
            buyOrderId: reqInput?.buyOrderId || null,
            strategyName: reqInput?.groupName || "",
            strategyUniqueId: reqInput?.strategyUniqueId || "",
            text: reqInput?.text || "",
            angelOneSymbol: reqInput.angelOneSymbol || reqInput.symbol,
            angelOneToken: reqInput.angelOneToken || reqInput.token,
            parentOrderId: o.id,
            // Store BUY order reference details for PnL calculation
            buyvalue: originalBuyOrder.tradedValue || (originalBuyOrder.quantity * originalBuyOrder.price),
            buyprice: originalBuyOrder.price || originalBuyOrder.fillprice,
            buysize: originalBuyOrder.quantity,
          };

          console.log("=============sellOrderData============");

          const tempSellOrder = await Order.create(sellOrderData);
          const nowISOError = new Date().toISOString();

          console.log(user ,"============= user callInstancePlaceOrder============");
          console.log(reqInput ,"============= reqInput callInstancePlaceOrder============");
         

          // ========== CALL INSTANCE FOR ORDER PLACEMENT ==========
          const instanceResponse = await callInstancePlaceOrder(user, reqInput, req);

          console.log("=============instanceResponse============", instanceResponse);

          logSuccess(req, {
            msg: "Instance response received for square-off",
            userId: user.id,
            responseStatus: instanceResponse?.status,
            responseResult: instanceResponse?.result
          });

          // ========== HANDLE INSTANCE RESPONSE ==========
          if (instanceResponse.status && instanceResponse.result === "SUCCESS") {
            // Calculate PnL after successful sell
            const sellPrice = instanceResponse?.orderDetails?.avgPrice || 
                            instanceResponse?.orderDetails?.price ||
                            instanceResponse?.price;
            const sellQuantityFilled = instanceResponse?.orderDetails?.quantity || sellQuantity;
            const sellValue = sellPrice * sellQuantityFilled;
            
            // Get buy details from original order
            const buyPrice = originalBuyOrder.price || originalBuyOrder.fillprice;
            const buyQuantity = originalBuyOrder.quantity;
            const buyValue = originalBuyOrder.tradedValue || (buyPrice * buyQuantity);
            
            // Calculate PnL
            let pnl = null;
            if (buyPrice && sellPrice) {
              pnl = (sellPrice - buyPrice) * Math.min(sellQuantityFilled, buyQuantity);
              pnl = parseFloat(pnl.toFixed(5));
            }

            logSuccess(req, {
              msg: "PnL calculated for square-off",
              userId: user.id,
              buyPrice,
              sellPrice,
              quantity: sellQuantityFilled,
              pnl
            });

            console.log('================ before sell update ===================');

            // SUCCESSFUL SELL - Update the SELL order record with PnL and buy details
            await tempSellOrder.update({
              status: "COMPLETE",
              orderstatuslocaldb: "COMPLETE",
              positionStatus: "COMPLETE",
              orderid: instanceResponse?.orderDetails?.orderid || instanceResponse?.orderId,
              uniqueOrderId: instanceResponse?.orderDetails?.uniqueOrderId || instanceResponse?.uniqueOrderId,
              fillid: instanceResponse?.orderDetails?.fillId || instanceResponse?.fillId,
              price: sellPrice,
              fillprice: sellPrice,
              tradedValue: sellValue,
              fillsize: sellQuantityFilled,
              quantity: sellQuantityFilled,
              filltime: nowISOError,
              text: instanceResponse?.message || "Square-off completed",
              // Update PnL fields
              pnl: pnl,
              // Ensure buy reference fields are properly set
              buyOrderId: originalBuyOrder.orderid,
              buyvalue: buyValue,
              buyprice: buyPrice,
              buysize: buyQuantity,
              buyTime: originalBuyOrder?.filltime
            });

            console.log(sellQuantity, o.quantity, '================ after sell update ==================');

            // Update the original BUY order position status
            if (sellQuantity >= o.quantity) {
              // Full square-off - close the BUY position
              await Order.update(
                {
                  positionStatus: "COMPLETE",
                  orderstatuslocaldb: "COMPLETE"
                },
                { where: { id: o.id } }
              );
            } else {
              console.log('=============== remaining quantity ===============');
              // Handle partial square-off if needed
              await Order.update(
                {
                  quantity: o.quantity - sellQuantity,
                  actualQuantity: o.actualQuantity - sellQuantity,
                },
                { where: { id: o.id } }
              );
            }

            return {
              orderId: o.id,
              sellOrderId: tempSellOrder.id,
              userId: user.id,
              broker: user.brokerName,
              result: "SUCCESS",
              message: instanceResponse?.message || "Square-off completed",
              quantity: sellQuantityFilled,
              isPartial: sellQuantity < o.quantity,
              remainingQuantity: sellQuantity < o.quantity ? o.quantity - sellQuantity : 0,
              pnl: pnl,
              buyPrice: buyPrice,
              sellPrice: sellPrice,
              orderDetails: instanceResponse?.orderDetails
            };
          } 
          else if (instanceResponse.result === "BROKER_REJECTED") {
            // Broker rejected the order - don't calculate PnL
            await tempSellOrder.update({
              status: "FAILED",
              orderstatuslocaldb: "FAILED",
              orderid: instanceResponse.orderId || null,
              text: instanceResponse.message,
              rawresponse: instanceResponse,
            });

            return {
              orderId: o.id,
              userId: user.id,
              broker: user.brokerName,
              result: "BROKER_REJECTED",
              message: instanceResponse.message,
              quantity: sellQuantity
            };
          }
          else if (instanceResponse.result === "INSTANCE_ERROR") {
            // Instance call failed
            await tempSellOrder.update({
              status: "FAILED",
              orderstatuslocaldb: "FAILED",
              text: `Instance error: ${instanceResponse.message}`,
              rawresponse: instanceResponse,
            });

            return {
              orderId: o.id,
              userId: user.id,
              broker: user.brokerName,
              result: "INSTANCE_ERROR",
              message: instanceResponse.message,
              quantity: sellQuantity
            };
          }
          else {
            // Other errors
            await tempSellOrder.update({
              status: "FAILED",
              orderstatuslocaldb: "FAILED",
              text: instanceResponse.message || "Unknown error",
              rawresponse: instanceResponse,
            });

            return {
              orderId: o.id,
              userId: user.id,
              broker: user.brokerName,
              result: "FAILED",
              message: instanceResponse.message || "Order placement failed",
              quantity: sellQuantity
            };
          }

        } catch (e) {
          console.log(e.message, 'error in square-off processing');
          
          logError(req, e, {
            msg: "Square-off failed for order",
            orderDbId: o?.id,
            userId: o?.userId,
          });

          return {
            orderId: o?.id,
            userId: o?.userId,
            result: "FAILED",
            message: e.message,
            error: e.stack
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

      return { 
        orderId: openOrders[i]?.id, 
        result: "PROMISE_REJECTED",
        message: r.reason?.message || "Promise rejected"
      };
    });

    // Emit socket update to refresh positions
    logSuccess(req, { msg: "Emitting order update event after square-off" });
    await emitOrderGet();

    return res.json({
      status: true,
      message: "Bulk square-off complete",
      data: finalOutput,
      summary: {
        total: finalOutput.length,
        successful: finalOutput.filter(r => r.result === "SUCCESS").length,
        failed: finalOutput.filter(r => r.result !== "SUCCESS").length,
        partialSells: finalOutput.filter(r => r.isPartial === true).length,
        totalPnl: finalOutput
          .filter(r => r.result === "SUCCESS" && r.pnl)
          .reduce((sum, r) => sum + r.pnl, 0)
          .toFixed(2)
      }
    });
  } catch (error) {
    console.log(error, '========================error');
    
    logError(req, error, { msg: "adminMultipleSquareOff failed unexpectedly" });

    return res.json({
      status: false,
      message: "Something went wrong",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};

// Add this new function alongside your existing adminPlaceAWSOrder
export const adminSquareOffPartialAWS = async (req, res) => {
 
  console.log(req.body,'========== adminSquareOffPartialAWS req.body========');
  
  const { quantity: sellQuantity, strategyUniqueId, flag, orderId: buyOrderDbId } = req.body;
  let reason = req.body?.reason || "Partial square-off";

  try {
    // Validation
    if (!sellQuantity || sellQuantity <= 0) {
      return res.json({
        status: false,
        message: "Invalid quantity. Please provide a positive quantity to square off",
      });
    }

    if (!strategyUniqueId) {
      return res.json({
        status: false,
        message: "strategyUniqueId is required",
      });
    }

    if (!buyOrderDbId) {
      return res.json({
        status: false,
        message: "orderId (database ID of BUY order) is required",
      });
    }

    // Fetch the original BUY order
    const originalBuyOrder = await Order.findOne({
      where: {
        orderid: buyOrderDbId,
        strategyUniqueId: strategyUniqueId,
        transactiontype: "BUY",
        orderstatuslocaldb: "OPEN",
        positionStatus: "OPEN"
      },
      raw: true,
    });

    if (!originalBuyOrder) {
      logError(req, new Error("Original BUY order not found"), {
        msg: "Cannot find original BUY order for partial square-off",
        buyOrderDbId,
        strategyUniqueId
      });

      return res.json({
        status: false,
        message: "Original BUY order not found or already closed",
      });
    }

    // Check if sell quantity is valid
    if (sellQuantity > originalBuyOrder.quantity) {
      return res.json({
        status: false,
        message: `Sell quantity (${sellQuantity}) cannot exceed bought quantity (${originalBuyOrder.quantity})`,
      });
    }

    if (sellQuantity === originalBuyOrder.quantity) {
      return res.json({
        status: false,
        message: "This is a full square-off. Please use adminGroupSquareOffAWS or adminMultipleSquareOff for full square-off",
      });
    }

    // Fetch user details
    const user = await User.findOne({
      where: { id: originalBuyOrder.userId },
      raw: true,
    });

    if (!user) {
      return res.json({
        status: false,
        message: "User not found",
      });
    }

    if (!user.authToken) {
      return res.json({
        status: false,
        message: "User does not have broker authToken",
      });
    }

    if (!user.brokerName) {
      return res.json({
        status: false,
        message: "User broker not selected",
      });
    }

    // Calculate remaining quantity after partial sell
    const remainingQuantity = originalBuyOrder.quantity - sellQuantity;
    
    console.log(`Processing partial square-off: Selling ${sellQuantity}, Remaining: ${remainingQuantity}`);

    // Create order input for SELL
    const orderInput = {
      // Core order details
      variety: originalBuyOrder.variety || "NORMAL",
      symbol: originalBuyOrder.tradingsymbol,
      instrumenttype: originalBuyOrder.instrumenttype,
      token: originalBuyOrder.symboltoken,
      exch_seg: originalBuyOrder.exchange,
      orderType: originalBuyOrder.ordertype,
      quantity: sellQuantity,
      productType: originalBuyOrder.producttype,
      duration: originalBuyOrder.duration,
      price: originalBuyOrder.price || "0",
      triggerprice: originalBuyOrder.triggerprice || 0,
      squareoff: originalBuyOrder.squareoff || 0,
      stoploss: originalBuyOrder.stoploss || 0,
      transactiontype: "SELL",
      
      // Additional metadata
      totalPrice: originalBuyOrder.totalPrice ? (originalBuyOrder.totalPrice * sellQuantity / originalBuyOrder.quantity) : null,
      actualQuantity: originalBuyOrder.actualQuantity,
      userId: user.id,
      userNameId: user.username,
      text: `Partial SquareOff: ${reason} (${sellQuantity}/${originalBuyOrder.quantity})`,
      
      // Broker-specific fields
      angelOneToken: originalBuyOrder?.angelOneToken || originalBuyOrder.token,
      angelOneSymbol: originalBuyOrder?.angelOneSymbol || originalBuyOrder.tradingsymbol,
      
      // Strategy info
      groupName: originalBuyOrder?.strategyName || "",
      strategyUniqueId: strategyUniqueId,
      buyOrderId: String(originalBuyOrder.orderid),
      broker: originalBuyOrder?.broker || user.brokerName,
      
      // Flag to indicate this is a partial square-off
      isPartialSquareOff: true,
      parentOrderDbId: buyOrderDbId
    };

    logSuccess(req, {
      msg: "Processing partial square-off via instance",
      userId: user.id,
      brokerName: user.brokerName,
      originalOrderId: originalBuyOrder.id,
      sellQuantity,
      remainingQuantity
    });

    // Fetch the original BUY order details for PnL calculation
    const originalBuyOrderForPnL = await Order.findOne({
      where: { 
        orderid: originalBuyOrder.orderid,
        transactiontype: "BUY",
        userId: user.id,
        status: "COMPLETE",
        orderstatuslocaldb: "OPEN"
      },
      raw: true
    });

    if (!originalBuyOrderForPnL) {
      logError(req, new Error("Original BUY order not found for PnL"), {
        msg: "Cannot find original BUY order for PnL calculation",
        orderId: originalBuyOrder.id,
        orderid: originalBuyOrder.orderid,
        userId: user.id
      });

      return res.json({
        status: false,
        message: "Original BUY order not found for PnL calculation"
      });
    }

    // Create pending SELL order in database
    const sellOrderData = {
      variety: orderInput.variety,
      tradingsymbol: orderInput.symbol,
      instrumenttype: orderInput.instrumenttype,
      symboltoken: orderInput.token,
      transactiontype: "SELL",
      exchange: orderInput.exch_seg,
      ordertype: orderInput.orderType,
      quantity: String(orderInput.quantity),
      fillsize: String(orderInput.quantity),
      producttype: orderInput.productType,
      duration: orderInput.duration,
      price: orderInput.price || "0",
      triggerprice: orderInput.triggerprice || 0,
      squareoff: orderInput.squareoff || 0,
      stoploss: orderInput.stoploss || 0,
      orderstatuslocaldb: "PENDING",
      totalPrice: orderInput.totalPrice ?? null,
      actualQuantity: orderInput.actualQuantity ?? null,
      userId: user.id,
      userNameId: user.username,
      ordertag: "softwaresetu",
      broker: user.brokerName,
      buyOrderId: orderInput?.buyOrderId || null,
      strategyName: orderInput?.groupName || "",
      strategyUniqueId: orderInput?.strategyUniqueId || "",
      text: orderInput?.text || "",
      angelOneSymbol: orderInput.angelOneSymbol || orderInput.symbol,
      angelOneToken: orderInput.angelOneToken || orderInput.token,
      parentOrderId: originalBuyOrder.id,
      // Store BUY order reference details for PnL calculation (only for the sold portion)
      buyvalue: (originalBuyOrderForPnL.tradedValue || (originalBuyOrderForPnL.price * sellQuantity)) * (sellQuantity / originalBuyOrder.quantity),
      buyprice: originalBuyOrderForPnL.price || originalBuyOrderForPnL.fillprice,
      buysize: sellQuantity, // Only the quantity being sold
    };

    console.log("=============Creating pending SELL order for partial square-off============");
    const tempSellOrder = await Order.create(sellOrderData);
    const nowISOError = new Date().toISOString();

    console.log("=============Calling Instance for partial square-off============");
    
    // ========== CALL INSTANCE FOR ORDER PLACEMENT ==========
    const instanceResponse = await callInstancePlaceOrder(user, orderInput, req);

    console.log("=============Instance Response for partial square-off============", instanceResponse);

    logSuccess(req, {
      msg: "Instance response received for partial square-off",
      userId: user.id,
      responseStatus: instanceResponse?.status,
      responseResult: instanceResponse?.result,
      sellQuantity
    });

    // ========== HANDLE INSTANCE RESPONSE ==========
    if (instanceResponse.status && instanceResponse.result === "SUCCESS") {
      // Calculate PnL after successful sell
      const sellPrice = instanceResponse?.orderDetails?.avgPrice || 
                       instanceResponse?.orderDetails?.price ||
                       instanceResponse?.price;
      const sellQuantityFilled = instanceResponse?.orderDetails?.quantity || sellQuantity;
      const sellValue = sellPrice * sellQuantityFilled;
      
      // Get buy details from original order
      const buyPrice = originalBuyOrderForPnL.price || originalBuyOrderForPnL.fillprice;
      const buyValue = originalBuyOrderForPnL.tradedValue || (buyPrice * sellQuantityFilled);
      
      // Calculate PnL for the sold portion
      let pnl = null;
      if (buyPrice && sellPrice) {
        pnl = (sellPrice - buyPrice) * sellQuantityFilled;
        pnl = parseFloat(pnl.toFixed(5));
      }

      logSuccess(req, {
        msg: "PnL calculated for partial square-off",
        userId: user.id,
        buyPrice,
        sellPrice,
        quantity: sellQuantityFilled,
        pnl
      });

      console.log('================ Updating SELL order after successful partial square-off ===================');

      // SUCCESSFUL SELL - Update the SELL order record with PnL and buy details
      await tempSellOrder.update({
        status: "COMPLETE",
        orderstatuslocaldb: "COMPLETE",
        positionStatus: "COMPLETE",
        orderid: instanceResponse?.orderDetails?.orderid || instanceResponse?.orderId,
        uniqueOrderId: instanceResponse?.orderDetails?.uniqueOrderId || instanceResponse?.uniqueOrderId,
        fillid: instanceResponse?.orderDetails?.fillId || instanceResponse?.fillId,
        price: sellPrice,
        fillprice: sellPrice,
        tradedValue: sellValue,
        fillsize: sellQuantityFilled,
        quantity: sellQuantityFilled,
        filltime: nowISOError,
        text: instanceResponse?.message || "Partial square-off completed",
        pnl: pnl,
        buyOrderId: originalBuyOrderForPnL.orderid,
        buyvalue: buyValue,
        buyprice: buyPrice,
        buysize: sellQuantityFilled,
        buyTime: originalBuyOrderForPnL?.filltime
      });

      // ========== CREATE NEW BUY ORDER FOR REMAINING QUANTITY ==========
      // Only after SELL is successful, create a new BUY order for the remaining quantity
      
      console.log(`Creating new BUY order for remaining quantity: ${remainingQuantity}`);
      
      const newBuyOrderData = {
        // Copy all fields from original order
        variety: originalBuyOrder.variety,
        tradingsymbol: originalBuyOrder.tradingsymbol,
        instrumenttype: originalBuyOrder.instrumenttype,
        symboltoken: originalBuyOrder.symboltoken,
        transactiontype: "BUY",
        exchange: originalBuyOrder.exchange,
        ordertype: originalBuyOrder.ordertype,
        quantity: String(req.body.quantity),
        fillsize: String(req.body.quantity),
        producttype: originalBuyOrder.producttype,
        duration: originalBuyOrder.duration,
        price: originalBuyOrder.price,
        triggerprice: originalBuyOrder.triggerprice,
        squareoff: originalBuyOrder.squareoff,
        stoploss: originalBuyOrder.stoploss,
        orderstatuslocaldb: "COMPLETE",
        positionStatus: "COMPLETE",
        status: "COMPLETE", // Since this is from an existing filled order
        totalPrice: originalBuyOrder.totalPrice ? (originalBuyOrder.totalPrice * remainingQuantity / originalBuyOrder.quantity) : null,
        actualQuantity: remainingQuantity,
        userId: originalBuyOrder.userId,
        userNameId: originalBuyOrder.userNameId,
        ordertag: originalBuyOrder.ordertag || "softwaresetu",
        broker: originalBuyOrder.broker,
        orderid: originalBuyOrder.orderid, // Same broker order ID
        uniqueOrderId: originalBuyOrder.uniqueOrderId,
        fillid: originalBuyOrder.fillid,
        fillprice: originalBuyOrder.fillprice,
        tradedValue:req.body.quantity*originalBuyOrder.fillprice||0,
        filltime: originalBuyOrder.filltime,
        strategyName: originalBuyOrder.strategyName,
        strategyUniqueId: originalBuyOrder.strategyUniqueId,
        text: `${originalBuyOrder.text || ""} (Remaining after partial square-off of ${sellQuantity})`,
        angelOneSymbol: originalBuyOrder.angelOneSymbol,
        angelOneToken: originalBuyOrder.angelOneToken,
       
      };

      const newBuyOrder = await Order.create(newBuyOrderData);
      
      console.log(`New BUY order created with ID: ${newBuyOrder.id}, Quantity: ${remainingQuantity}`);

      // Update the original BUY order to mark it as partially squared off
      await Order.update(
        {
          quantity: remainingQuantity,
          fillsize: remainingQuantity,
          tradedValue:remainingQuantity*originalBuyOrder.fillprice,
        },
        { where: { id: originalBuyOrder.id } }
      );

      console.log(`Original BUY order ${originalBuyOrder.id} marked as partially squared off`);

      return res.json({
        status: true,
        message: "Partial square-off completed successfully",
        data: {
          originalOrder: {
            id: originalBuyOrder.id,
            originalQuantity: originalBuyOrder.quantity,
            squaredOffQuantity: sellQuantityFilled,
            status: "PARTIALLY_SQUARED_OFF"
          },
          sellOrder: {
            id: tempSellOrder.id,
            quantity: sellQuantityFilled,
            price: sellPrice,
            pnl: pnl,
            orderId: tempSellOrder.orderid
          },
          newBuyOrder: {
            id: newBuyOrder.id,
            quantity: remainingQuantity,
            price: buyPrice,
            status: "OPEN"
          },
          pnl: pnl,
          sellPrice: sellPrice,
          buyPrice: buyPrice,
          remainingQuantity: remainingQuantity
        }
      });
      
    } 
    else if (instanceResponse.result === "BROKER_REJECTED") {
      // Broker rejected the order - mark SELL order as failed
      await tempSellOrder.update({
        status: "FAILED",
        orderstatuslocaldb: "FAILED",
        orderid: instanceResponse.orderId || null,
        text: instanceResponse.message,
        rawresponse: instanceResponse,
      });

      return res.json({
        status: false,
        message: "Partial square-off failed - Broker rejected the order",
        data: {
          sellOrderId: tempSellOrder.id,
          result: "BROKER_REJECTED",
          message: instanceResponse.message,
          quantity: sellQuantity
        }
      });
    }
    else if (instanceResponse.result === "INSTANCE_ERROR") {
      // Instance call failed
      await tempSellOrder.update({
        status: "FAILED",
        orderstatuslocaldb: "FAILED",
        text: `Instance error: ${instanceResponse.message}`,
        rawresponse: instanceResponse,
      });

      return res.json({
        status: false,
        message: "Partial square-off failed - Instance error",
        data: {
          sellOrderId: tempSellOrder.id,
          result: "INSTANCE_ERROR",
          message: instanceResponse.message,
          quantity: sellQuantity
        }
      });
    }
    else {
      // Other errors
      await tempSellOrder.update({
        status: "FAILED",
        orderstatuslocaldb: "FAILED",
        text: instanceResponse.message || "Unknown error",
        rawresponse: instanceResponse,
      });

      return res.json({
        status: false,
        message: "Partial square-off failed",
        data: {
          sellOrderId: tempSellOrder.id,
          result: "FAILED",
          message: instanceResponse.message || "Order placement failed",
          quantity: sellQuantity
        }
      });
    }

  } catch (error) {
    console.error('Error in adminSquareOffPartialAWS:', error);
    
    logError(req, error, {
      msg: "adminSquareOffPartialAWS failed unexpectedly",
      strategyUniqueId: req.body?.strategyUniqueId,
      orderId: req.body?.orderId,
      quantity: req.body?.quantity,
      errorMessage: error.message
    });

    return res.json({
      status: false,
      message: "Partial square-off processing failed",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};


// ============== Updated Target & Stoploss Controller - Only ONE will hit ==============
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
    
    // Fetch OPEN BUY Orders
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

    // Process Each Order
    const results = await Promise.allSettled(
      openOrders.map(async (o, idx) => {
        req.userId = o?.userId;

        logSuccess(req, {
          msg: "▶️ Processing order for OCO via instance",
          index: idx,
          orderDbId: o.id,
          buyOrderId: o.orderid,
          userId: o.userId,
        });

        try {
          // Fetch user
          const user = await User.findOne({
            where: { id: o.userId },
            raw: true,
          });

          if (!user) {
            return { orderId: o.id, result: "NO_USER", message: "User not found" };
          }

          if (!user.authToken) {
            return { orderId: o.id, result: "NO_TOKEN", message: "No auth token" };
          }

          if (!user.brokerName) {
            return { orderId: o.id, result: "NO_BROKER", message: "Broker not selected" };
          }

          if (!user.publicIp) {
            return { 
              orderId: o.id, 
              result: "INSTANCE_MISSING", 
              message: "Instance configuration missing for user" 
            };
          }

          // Fetch the original BUY order details for PnL calculation
          const originalBuyOrder = await Order.findOne({
            where: { 
              orderid: o.orderid,
              transactiontype: "BUY",
              userId: user.id,
              status: "COMPLETE",
              orderstatuslocaldb: "OPEN"
            },
            raw: true
          });

          if (!originalBuyOrder) {
            logError(req, new Error("Original BUY order not found"), {
              msg: "Cannot find original BUY order for PnL calculation",
              orderId: o.id,
              orderid: o.orderid,
              userId: user.id
            });

            return {
              orderId: o.id,
              userId: user.id,
              result: "BUY_ORDER_NOT_FOUND",
              message: "Original BUY order not found for PnL calculation"
            };
          }

          // Prepare order input (single order that will hit either target or stoploss)
          // We place a LIMIT order at target price and STOPLOSS at stoploss price
          // The broker will execute whichever hits first
          
          const orderInput = {
            variety: o.variety || "NORMAL",
            symbol: o.tradingsymbol,
            instrumenttype: o.instrumenttype,
            token: o.symboltoken,
            exch_seg: o.exchange,
            orderType: "LIMIT", // Main order type
            quantity: o.quantity,
            productType: o.producttype,
            duration: "DAY",
            price: targetPrice.toString(), // Target price
            triggerprice: stoplossPrice.toString(), // Stoploss price
            squareoff: 0,
            stoploss: stoplossPrice, // Stoploss value
            transactiontype: "SELL",
            totalPrice: o.totalPrice,
            actualQuantity: o.actualQuantity,
            userId: user.id,
            userNameId: user.username,
            text: `OCO Order - Target: ${targetPrice}, Stoploss: ${stoplossPrice}`,
            ordertag: "softwaresetu",
            broker: o?.broker || user.brokerName,
            buyOrderId: String(o.orderid),
            groupName: o?.strategyName || "",
            strategyUniqueId: reqStrategyUniqueId,
            orderTypeForBroker: "OCO", // One Cancels Other
            angelOneToken: o?.angelOneToken || o.token,
            angelOneSymbol: o?.angelOneSymbol || o.tradingsymbol,
           
          };

          // Create pending order in database for tracking
          const pendingOrderData = {
            variety: orderInput.variety,
            tradingsymbol: o.tradingsymbol,
            instrumenttype: o.instrumenttype,
            symboltoken: o.symboltoken,
            transactiontype: "SELL",
            exchange: o.exchange,
            ordertype: "LIMIT",
            quantity: String(o.quantity),
            fillsize: String(o.quantity),
            producttype: o.producttype,
            duration: "DAY",
            price: targetPrice.toString(),
            triggerprice: stoplossPrice.toString(),
            squareoff: 0,
            stoploss: stoplossPrice,
            orderstatuslocaldb: "PENDING",
            userId: user.id,
            userNameId: user.username,
            ordertag: "softwaresetu",
            broker: user.brokerName,
            buyOrderId: String(o.orderid),
            strategyName: o?.strategyName || "",
            strategyUniqueId: reqStrategyUniqueId,
            text: `OCO Order - Target: ${targetPrice}, Stoploss: ${stoplossPrice}`,
            parentOrderId: o.id,
            orderType: "OCO",
            // Store BUY order reference details for PnL calculation
            buyvalue: originalBuyOrder.tradedValue || (originalBuyOrder.quantity * originalBuyOrder.price),
            buyprice: originalBuyOrder.price || originalBuyOrder.fillprice,
            buysize: originalBuyOrder.quantity,
            targetPrice: targetPrice,
            stoplossPrice: stoplossPrice,
          };

          // Create pending record
          const pendingOrder = await Order.create(pendingOrderData);

          // Get Kite instance if needed
          let kiteInstance = null;
          if (user.brokerName === 'kite') {
            kiteInstance = await getKiteClientForUserId(user.id);
          }

          // Call instance for order placement
          console.log(`📊 Placing OCO order for ${o.orderid} - Target: ${targetPrice}, Stoploss: ${stoplossPrice}`);
          const response = await callInstancePlaceOrder(user, orderInput, req, kiteInstance);

          const nowISO = new Date().toISOString();

          // Handle response with PnL calculation
          let orderStatus = "FAILED";
          let executedPrice = null;
          let executedType = null; // "TARGET" or "STOPLOSS"
          let pnl = null;
          
          if (response.status && response.result === "SUCCESS") {
            orderStatus = "SUCCESS";
            
            // Get executed price and determine which order hit
            executedPrice = response?.orderDetails?.avgPrice || response?.orderDetails?.price;
            const executedQuantity = response?.orderDetails?.quantity || o.quantity;
            const sellValue = executedPrice * executedQuantity;
            
            // Determine if target or stoploss hit
            if (executedPrice >= targetPrice - 0.01 && executedPrice <= targetPrice + 0.01) {
              executedType = "TARGET";
            } else if (executedPrice <= stoplossPrice + 0.01) {
              executedType = "STOPLOSS";
            } else {
              executedType = "UNKNOWN";
            }
            
            // Calculate PnL
            const buyPrice = originalBuyOrder.price || originalBuyOrder.fillprice;
            const buyQuantity = originalBuyOrder.quantity;
            const buyValue = originalBuyOrder.tradedValue || (buyPrice * buyQuantity);
            
            if (buyPrice && executedPrice) {
              pnl = (executedPrice - buyPrice) * Math.min(executedQuantity, buyQuantity);
              pnl = parseFloat(pnl.toFixed(5));
            }
            
            await pendingOrder.update({
              status: "COMPLETE",
              orderstatuslocaldb: "COMPLETE",
              positionStatus: "COMPLETE",
              orderid: response?.orderDetails?.orderid || response?.orderId,
              fillid: response?.orderDetails?.fillId,
              price: executedPrice,
              fillprice: executedPrice,
              tradedValue: sellValue,
              fillsize: executedQuantity,
              quantity: executedQuantity,
              filltime: nowISO,
              text: `${executedType} order executed at ${executedPrice}`,
              pnl: pnl,
              executedType: executedType,
              buyOrderId: originalBuyOrder.orderid,
              buyvalue: buyValue,
              buyprice: buyPrice,
              buysize: buyQuantity,
              buyTime: originalBuyOrder?.filltime
            });
            
            // Close the original BUY order
            await Order.update({
              positionStatus: "COMPLETE",
              orderstatuslocaldb: "COMPLETE",
              text: `Closed via ${executedType} at ${executedPrice}. PnL: ${pnl}`
            }, { where: { id: o.id } });
            
          } else {
            await pendingOrder.update({
              status: "FAILED",
              orderstatuslocaldb: "FAILED",
              text: response?.message || "Order failed",
              rawresponse: response
            });
          }

          return {
            orderId: o.id,
            buyOrderId: o.orderid,
            userId: user.id,
            result: orderStatus,
            executedType: executedType,
            executedPrice: executedPrice,
            pnl: pnl,
            targetPrice: targetPrice,
            stoplossPrice: stoplossPrice,
            orderId: pendingOrder.id
          };

        } catch (e) {
          logError(req, e, {
            msg: "❌ Exception while processing OCO order",
            orderId: o.id,
            userId: o.userId
          });

          return { 
            orderId: o.id, 
            result: "FAILED", 
            message: e.message 
          };
        }
      })
    );

    // Normalize results
    const finalOutput = results.map((r, i) => {
      if (r.status === "fulfilled") {
        return r.value;
      }
      return { 
        orderId: openOrders[i]?.id, 
        result: "PROMISE_REJECTED", 
        message: r.reason?.message 
      };
    });

    // Emit socket update
    await emitOrderGet();

    return res.json({
      status: true,
      message: "OCO orders placed (Target + Stoploss - only one will execute)",
      data: finalOutput,
      summary: {
        total: finalOutput.length,
        success: finalOutput.filter(r => r.result === "SUCCESS").length,
        failed: finalOutput.filter(r => r.result === "FAILED").length,
        targetHit: finalOutput.filter(r => r.executedType === "TARGET").length,
        stoplossHit: finalOutput.filter(r => r.executedType === "STOPLOSS").length,
        totalPnl: finalOutput
          .filter(r => r.pnl)
          .reduce((sum, r) => sum + r.pnl, 0)
          .toFixed(2)
      }
    });

  } catch (error) {
    logError(req, error, {
      msg: "🔥 adminPlaceMultiTargetStoplossOrder crashed",
    });

    return res.json({
      status: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};



export const getHealthData = async (req, res) => {
  try {

    let userId = ''
   
     // 2️⃣ Fetch users by strategy group
    const user = await User.findOne({
      where: { id: userId },
      raw: true,
    });


    const response = await axios.get(`http://${user.publicIp}/health`);

    console.log(response.data,'==============response==========');
    

    // Return response to frontend
    return res.status(200).json({
      success: true,
      data: response.data,
    });

  } catch (error) {
    console.error("Health API Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch health data",
      error: error.message,
    });
  }
};


export const CreateInstanceInAws = async (req, res) => {
  try {

    let userId = req.headers.userid

     const user = await User.findOne({
      where: { id: userId },
    });

    console.log(user,'useruseruseruser');
    
    const provisionResult = await awsProvisioner.provisionUser(user);

     // update status before sending response
    await user.update({
      status: "running",
    });

     return res.json({
      success: true,
      statusCode:201,
      message: "Instance Create Successfully",
      error:null,
    });

  } catch (error) {
    console.error("Health API Error:", error.message);

    return res.status(500).json({
      success: false,
       statusCode:500,
      message: "Failed to fetch health data",
      error: error.message,
    });
  }
};



// =================================watch list========================

// =================== UPDATED SINGLE USER ORDER WITH INSTANCE IP =========================
export const adminPlaceWatchListOrder = async (req, res) => {
  try {
    let tempOrder;
    let input = { ...req.body };

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

    // 3️⃣ Get strategy max quantity
    const { strategyId, lotsize } = input;
    const quantity = await getStrategyMaxQuantity(strategyId, null, input.quantity, input.lotsize);
    input.quantity = quantity;

    logSuccess(req, {
      msg: "Order execution started",
      userId: user.id,
      broker: user.brokerName,
      instanceIp: user.publicIp
    });

    // 4️⃣ Check if user has instance information
    if (!user.publicIp) {
      logError(req, new Error("Missing instance information"), {
        msg: "User missing public IP configuration",
        userId: user.id,
        brokerName: user.brokerName
      });

      return res.json({
        status: false,
        message: "Instance configuration missing for user",
        error: "Public IP not configured for this user"
      });
    }

    // 5️⃣ Prepare broker-specific symbol/token mappings
    let tradingsymbol, symboltoken, exchange;

    // Simple condition based on broker
    if (user.brokerName === 'angelone') {
      tradingsymbol = input.symbol;
      symboltoken = input.token;
      exchange = input.exch_seg;
    } 
    else if (user.brokerName === 'kite') {
      tradingsymbol = input.kiteSymbol || input.symbol;
      symboltoken = input.kiteToken || input.token;
      exchange = input.exch_seg === 'NFO' ? 'NFO' : input.exch_seg;
    }
    else if (user.brokerName === 'fyers') {
      tradingsymbol = input.fyersSymbol || input.symbol;
      symboltoken = input.fyersToken || input.token;
      exchange = input.exch_seg === 'NFO' ? 'NSE' : input.exch_seg;
    }
    else if (user.brokerName === 'upstox') {
      tradingsymbol = input.upstoxSymbol || input.symbol;
      symboltoken = input.upstoxToken || input.token;
      exchange = input.exch_seg === 'NFO' ? 'NSE_FO' : input.exch_seg;
    }
    else if (user.brokerName === 'groww') {
      tradingsymbol = input.growwTradingSymbol || input.symbol;
      symboltoken = input.growToken || input.token;
      exchange = input.growwExchange || input.exch_seg;
    }
    else if (user.brokerName === "finvasia") {
      tradingsymbol = input.finavasiaSymbol || input.symbol;
      symboltoken = input.finavasiaToken || input.token;
      exchange = input.growwExchange || input.exch_seg;
    }
    else if (user.brokerName === "kotak neo") {
      tradingsymbol = input.kotakSymbol || input.symbol;
      symboltoken = input.kotakToken || input.token;
      exchange = input.kotakExchange || input.exch_seg;
    }
    else {
      // Default
      tradingsymbol = input.symbol;
      symboltoken = input.token;
      exchange = input.exch_seg;
    }

    // 6️⃣ Prepare order data for database
    const orderData = {
      variety: input.variety || "NORMAL",
      tradingsymbol: tradingsymbol,
      symboltoken: symboltoken,
      instrumenttype: input.instrumenttype,
      transactiontype: input.transactiontype,
      exchange: exchange,
      ordertype: input.orderType,
      lotsize: input?.lotsize || 0,
      quantity: String(input.quantity),
      fillsize: String(input.quantity),
      producttype: input.productType,
      duration: input.duration,
      price: input.price || "0",
      triggerprice: input.triggerprice || 0,
      squareoff: input.squareoff || 0,
      stoploss: input.stoploss || 0,
      orderstatuslocaldb: "PENDING",
      totalPrice: input.totalPrice ?? null,
      actualQuantity: input.actualQuantity ?? null,
      userId: user.id,
      userNameId: user.username,
      ordertag: "softwaresetu",
      broker: user.brokerName,
      buyOrderId: input?.buyOrderId || null,
      strategyName: user?.strategyName || "",
      strategyUniqueId: input?.strategyUniqueId || "",
      text: input?.text || "",
      angelOneSymbol: input.angelOneSymbol || input.symbol,
      angelOneToken: input.angelOneToken || input.token,
    };

    // 7️⃣ Create pending order in database
    tempOrder = await Order.create(orderData);

    // 8️⃣ Get kite instance if broker is kite
    let kiteInstance = null;
    if (user.brokerName === 'kite') {
      kiteInstance = await getKiteClientForUserId(user.id);
    }

    // 9️⃣ Call instance to place order
    const instanceResponse = await callInstancePlaceOrder(user, input, req, kiteInstance);

    console.log(instanceResponse, '==============Instance Response==============');

    // 🔟 Handle response based on transaction type
    const nowISOError = new Date().toISOString();

    if (instanceResponse.status && input.transactiontype === "BUY") {
      console.log('==============BUY Success - Processing ==============');

      // Check for existing BUY order
      const existingOrder = await Order.findOne({
        where: {
          userId: user.id,
          tradingsymbol:tradingsymbol,
          transactiontype: "BUY",
          status: "COMPLETE",
          orderstatuslocaldb: "OPEN",
          id: { [Op.ne]: tempOrder.id } // Exclude current record
        }
      });

      if (existingOrder) {
        console.log(existingOrder, '==============Existing Order Found - AVG Logic==============');
        
        // AVG LOGIC: Calculate new average price
        const oldQty = Number(existingOrder.quantity);
        const oldPrice = Number(existingOrder.price);
        const newQty = Number(instanceResponse?.orderDetails?.quantity || 0);
        const newPrice = Number(instanceResponse?.orderDetails?.avgPrice || 0);
        const totalQty = oldQty + newQty;
        const avgPrice = ((oldQty * oldPrice) + (newQty * newPrice)) / totalQty;

        // Update existing order
        await existingOrder.update({
          quantity: totalQty,
          fillsize: totalQty,
          fillprice: avgPrice.toFixed(2),
          price: avgPrice.toFixed(2),
          tradedValue: totalQty * avgPrice,
          text: "UPDATED_AVG_ORDER"
        });

        console.log('==============Existing Order Updated==============');
        
        // Delete current temp order
        await tempOrder.destroy();
      } else {
        console.log('==============First BUY - Completing Order==============');
        
        // First BUY - complete current order
        await tempOrder.update({
          status: "COMPLETE",
          orderstatuslocaldb: "OPEN",
          positionStatus: "OPEN",
          orderid: instanceResponse?.orderDetails?.orderid,
          fillid: instanceResponse?.orderDetails?.fillId,
          price: instanceResponse?.orderDetails?.avgPrice,
          fillprice: instanceResponse?.orderDetails?.avgPrice,
          tradedValue: instanceResponse?.orderDetails?.tradedValue,
          fillsize: instanceResponse?.orderDetails?.quantity,
          quantity: instanceResponse?.orderDetails?.quantity,
          text: instanceResponse?.message,
          filltime: nowISOError
        });
      }
    } else {
      // FAILED ORDER
      console.log('==============Order FAILED==============');
      await tempOrder.update({
        status: "FAILED",
        orderstatuslocaldb: "FAILED",
        orderid: instanceResponse.orderId || null,
        text: instanceResponse.message,
        rawresponse: instanceResponse,
      });
    }

    // 1️⃣1️⃣ Emit socket update
    await emitOrderGet();

    logSuccess(req, {
      msg: "Order executed successfully",
      userId: user.id,
      broker: user.brokerName
    });

    return res.json({
      status: instanceResponse.status || false,
      message: instanceResponse.status ? "Order executed successfully" : (instanceResponse.message || "Order execution failed"),
      data: instanceResponse,
      orderId: tempOrder?.id
    });

  } catch (err) {
    logError(req, err, {
      msg: "Admin broker order execution failed",
      customerId: req.body?.customerId
    });

    return res.json({
      status: false,
      message: err.message,
      error: err.stack
    });
  }
};

// ==================================watch list end ====================

// ==================================new code start ===============
export const StopInstanceInAws = async (req, res) => {
  try {
    
    let userId = req.headers.userid;

    const user = await User.findOne({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "User not found",
        error: "User not found"
      });
    }

    if (!user.instanceId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "No instance found for this user",
        error: "Instance not found"
      });
    }

    const stopResult = await awsProvisioner.stopUserInstance(user);

    if (stopResult.success) {
      return res.json({
        success: true,
        statusCode: 200,
        message: stopResult.message,
        data: {
          instanceId: stopResult.instanceId,
          state: stopResult.state
        },
        error: null,
      });
    } else {
      throw new Error(stopResult.error);
    }

  } catch (error) {
    console.error("Stop Instance API Error:", error.message);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Failed to stop instance",
      error: error.message,
    });
  }
};

export const StartInstanceInAws = async (req, res) => {
  try {
    let userId = req.headers.userid;

    const user = await User.findOne({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "User not found",
        error: "User not found"
      });
    }

    if (!user.instanceId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "No instance found for this user",
        error: "Instance not found"
      });
    }

    const startResult = await awsProvisioner.startUserInstance(user);

    if (startResult.success) {
      return res.json({
        success: true,
        statusCode: 200,
        message: startResult.message,
        data: {
          instanceId: startResult.instanceId,
          publicIp: startResult.publicIp,
          state: startResult.state
        },
        error: null,
      });
    } else {
      throw new Error(startResult.error);
    }

  } catch (error) {
    console.error("Start Instance API Error:", error.message);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Failed to start instance",
      error: error.message,
    });
  }
};

export const DeleteInstanceInAws = async (req, res) => {
  try {
    let userId = req.headers.userid;
    const { releaseElasticIp = true } = req.body; // Optional: control whether to release Elastic IP

    const user = await User.findOne({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "User not found",
        error: "User not found"
      });
    }

    if (!user.instanceId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "No instance found for this user",
        error: "Instance not found"
      });
    }

    const deleteResult = await awsProvisioner.deleteUserInstance(user, releaseElasticIp);

    if (deleteResult.success) {
      return res.json({
        success: true,
        statusCode: 200,
        message: deleteResult.message,
        data: {
          instanceId: deleteResult.instanceId,
          publicIp: deleteResult.publicIp,
          elasticIpReleased: deleteResult.elasticIpReleased
        },
        error: null,
      });
    } else {
      throw new Error(deleteResult.error);
    }

  } catch (error) {
    console.error("Delete Instance API Error:", error.message);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Failed to delete instance",
      error: error.message,
    });
  }
};

export const GetInstanceStatus = async (req, res) => {
  try {

    console.log(req.params.id,'===========req.params============');
    

    let userId = req.params.id;

    const user = await User.findOne({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        statusCode: 404,
        message: "User not found",
        error: "User not found"
      });
    }

    if (!user.instanceId) {
      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: "No instance found for this user",
        data: {
          hasInstance: false,
          instanceState: null
        },
        error: null,
      });
    }

    const instanceDetails = await awsProvisioner.getInstanceDetailsNew(user.instanceId);
    
    if (!instanceDetails) {
      return res.status(200).json({
        success: true,
        statusCode: 200,
        message: "Instance not found in AWS",
        data: {
          hasInstance: false,
          instanceState: 'not_found'
        },
        error: null,
      });
    }

    return res.json({
      success: true,
      statusCode: 200,
      message: "Instance status retrieved successfully",
      data: {
        hasInstance: true,
        instanceId: user.instanceId,
        instanceState: instanceDetails.State.Name,
        publicIp: user.publicIp,
        type: instanceDetails.InstanceType,
        launchTime: instanceDetails.LaunchTime,
        userStatus: user.status
      },
      error: null,
    });

  } catch (error) {
    console.error("Get Instance Status API Error:", error.message);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Failed to get instance status",
      error: error.message,
    });
  }
};

// ====================================new code end =================
