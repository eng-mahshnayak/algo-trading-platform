


// controllers/riskManagement.controller.js
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";
import RiskConfig from "../models/RiskConfig.js";
import livePriceStore from "../services/livePriceStore.js";
import { getIO } from "../socket/index.js";
import { logSuccess, logError } from "../utils/loggerr.js";
import axios from "axios";



// Helper function to call instance for square off
const callSquareOffInstance = async (user, orderInput, req) => {
  try {
    // Get user's instance IP
    const instanceUrl = user.publicIp 
      ? `http://${user.publicIp}` 
      : process.env.INSTANCE_URL || 'http://localhost:6000';
    
    const endpoint = '/api/order/execute';
    
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        brokerName: user.brokerName,
        authToken: user.authToken,
        feedToken: user.feedToken,
        refreshToken: user.refreshToken,
        kite_key: user.kite_key,
        kite_secret: user.kite_secret,
        kite_client_id: user.kite_client_id,
        kite_pin: user.kite_pin,
        CLIENT_LOCAL_IP: user.CLIENT_LOCAL_IP,
        CLIENT_PUBLIC_IP: user.CLIENT_PUBLIC_IP,
        MAC_Address: user.MAC_Address,
        role: user.role,
        ...user
      },
      orderInput: orderInput,
      reqInfo: {
        source: 'risk_management',
        timestamp: new Date().toISOString()
      },
      useMappings: true
    };
    
    logSuccess(null, {
      msg: "Calling instance for square off order",
      userId: user.id,
      instanceUrl,
      brokerName: user.brokerName,
      symbol: orderInput.symbol,
      quantity: orderInput.quantity
    });
    
    const response = await axios.post(instanceUrl + endpoint, payload, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Instance-Id': user?.instanceId || user?.publicIp
      }
    });
    
    return response.data;
    
  } catch (err) {
    logError(null, err, {
      msg: "Failed to call instance for square off",
      userId: user.id,
      instanceId: user.instanceId,
      error: err.message
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


const processedOrders = new Set();

import cron from "node-cron";

cron.schedule("40 15 * * *", () => {
  processedOrders.clear();
  console.log("🧹 Reset processed orders at 3:40 PM");
});

// Main risk management interval
setInterval(async () => {
  try {
    // 1️⃣ Fetch active risk configuration
    const riskConfig = await RiskConfig.findOne({
      where: { isActive: true },
      raw: true,
    });

    if (!riskConfig || !riskConfig.isActive) {
      logSuccess(null, {
        msg: `Risk management inactive - no active config found`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    const roomName = `risk_management`;
    const io = getIO();

    // 2️⃣ Fetch all OPEN BUY orders
    const openOrders = await Order.findAll({
      where: {
        orderstatuslocaldb: "OPEN",
        transactiontype: "BUY",
        positionStatus: "OPEN",
      },
      raw: true,
    });

    if (!openOrders.length) {
      logSuccess(null, {
        msg: `No open orders found`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    logSuccess(null, {
      msg: `Fetched open orders`,
      count: openOrders.length,
      orderIds: openOrders.map(o => o.orderid)
    });

    // 3️⃣ Group orders by user and calculate PnL
    const userData = {};

    for (const order of openOrders) {
      // Get current price - use appropriate token
      const token = order.angelOneToken || order.symboltoken;
      // const currentPrice = livePriceStore.getPrice(token);

        const currentPrice = -9
      
      if (!currentPrice) {
        logSuccess(null, {
          msg: "No current price for symbol",
          symbol: order.tradingsymbol,
          token: token,
          orderId: order.orderid
        });
        continue;
      }

      const pnl = (currentPrice - order.price) * order.quantity;

      if (!userData[order.userId]) {
        userData[order.userId] = {
          totalPnL: 0,
          orders: []
        };
      }

      userData[order.userId].totalPnL += pnl;
      userData[order.userId].orders.push(order);
    }

    const userIds = Object.keys(userData);
    if (!userIds.length) {
      logSuccess(null, {
        msg: `No users with valid price data`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 4️⃣ Fetch all users with their instance details
    const users = await User.findAll({
      where: { 
        id: userIds,
        angelLoginUser: true,
      },
      raw: true
    });

    const userMap = {};
    users.forEach(u => userMap[u.id] = u);

    logSuccess(null, {
      msg: `Fetched users data`,
      userIds: userIds,
      foundUsers: users?.length
    });

    // 5️⃣ Risk Check and Square off based on fund
    for (const userId of userIds) {
      try {
        const { totalPnL, orders } = userData[String(userId)];
        const user = userMap[userId];

        if (!user) {
          logSuccess(null, {
            msg: `User not found or inactive`,
            userId: userId
          });
          continue;
        }

        // Check if user has valid instance IP
        if (!user.publicIp && !user.instanceId) {
          logSuccess(null, {
            msg: `User has no instance IP, skipping square off`,
            userId: user.id,
            username: user.username
          });
          continue;
        }

        logSuccess(null, {
          msg: `User PnL calculated`,
          userId: user.id,
          username: user.username,
          totalPnL: totalPnL.toFixed(2),
          ordersCount: orders.length,
          dematFund: user.DematFund,
          instanceIp: user.publicIp
        });

        if (isNaN(totalPnL)) {
          logSuccess(null, {
            msg: "totalPnL is NaN",
            userId: user.id,
            username: user.username
          });
          continue;
        }

        // ========== FUND-BASED RISK CALCULATION ==========
        const userFund = Number(user?.DematFund) || 0;
        let maxLoss = 0;
        let strategyUsed = 'none';
        
        if (userFund > 0) {
          if (userFund <= riskConfig.strategyOne.fund) {
            maxLoss = riskConfig.strategyOne.maxLoss;
            strategyUsed = 'strategyOne';
          }
          else if (userFund <= riskConfig.strategyTwo.fund) {
            maxLoss = riskConfig.strategyTwo.maxLoss;
            strategyUsed = 'strategyTwo';
          }
        }

        maxLoss = Math.abs(maxLoss);

        logSuccess(null, {
          msg: `Risk calculation for user`,
          userId: user.id,
          username: user.username,
          dematFund: userFund,
          maxLoss: maxLoss,
          strategyUsed: strategyUsed,
          totalPnL: totalPnL.toFixed(2)
        });

        // Check if loss exceeds threshold
        if (totalPnL >= -maxLoss) {
          logSuccess(null, {
            msg: `Loss within limits`,
            userId: user.id,
            username: user.username,
            totalPnL: totalPnL.toFixed(2),
            maxLoss: maxLoss,
            remainingLoss: (maxLoss + totalPnL).toFixed(2)
          });
          continue;
        }

        logSuccess(null, {
          msg: `🚨 RISK TRIGGERED - Max loss limit hit`,
          userId: user.id,
          username: user.username,
          totalPnL: totalPnL.toFixed(2),
          maxLoss: maxLoss,
          dematFund: userFund,
          strategyUsed: strategyUsed,
          ordersCount: orders.length,
          exceededBy: (Math.abs(totalPnL) - maxLoss).toFixed(2)
        });

        // Send initial alert
        io.to(roomName).emit("risk_alert", {
          type: "MAX_LOSS_TRIGGERED",
          userId: user.id,
          username: user.username,
          totalPnL,
          maxLoss,
          dematFund: userFund,
          message: `🚨 Max loss limit hit for ${user.username}. Loss: ₹${Math.abs(totalPnL).toFixed(2)} exceeds limit: ₹${maxLoss}`,
          ts: Date.now(),
        });



       
        // 6️⃣ Square off all positions for this user via instance
        for (const order of orders) {
          try {

            const lockKey = `${user.id}-${order.orderid}`;

            

            // 🔒 Already processed? skip
            if (processedOrders.has(lockKey)) {
                continue;
            }

            
            // 🔐 Lock laga do
            processedOrders.add(lockKey);


            const strategyUniqueId = order.strategyUniqueId || "";

            

            // Prepare order input for square off
            const orderInput = {
              variety: order.variety || "NORMAL",
              symbol: order.tradingsymbol,
              instrumenttype: order.instrumenttype,
              token: order.symboltoken,
              exchange: order.exchange,
              orderType: order.ordertype || "MARKET",
              quantity: Math.abs(Number(order.quantity)),
              productType: order.producttype,
              duration: order.duration || "DAY",
              price: order.price || "0",
              triggerprice: order.triggerprice || 0,
              squareoff: order.squareoff || 0,
              stoploss: order.stoploss || 0,
              transactiontype: "SELL",
              totalPrice: order.totalPrice,
              actualQuantity: order.actualQuantity,
              userId: user.id,
              userNameId: user.username,
              text: `Risk square-off: Loss exceeded limit`,
              angelOneToken: order?.angelOneToken || order.symboltoken,
              angelOneSymbol: order?.angelOneSymbol || order.tradingsymbol,
              kiteSymbol: order.tradingsymbol,
              kiteToken: order.symboltoken,
              groupName: order?.strategyName || "",
              strategyUniqueId: strategyUniqueId,
              buyOrderId: String(order.orderid),
              broker: order?.broker || user.brokerName
            };

            logSuccess(null, {
              msg: `Processing square off via instance`,
              userId: user.id,
              username: user.username,
              orderId: order.orderid,
              symbol: order.tradingsymbol,
              quantity: orderInput.quantity,
              instanceIp: user.publicIp
            });

            
        

            // Create pending SELL order in database
            const sellOrderData = {
              tradingsymbol: order.tradingsymbol,
              transactiontype: "SELL",
              quantity: String(orderInput.quantity),
              orderstatuslocaldb: "PENDING",
              userId: user.id,
              userNameId: user.username,
              broker: user.brokerName,
              buyOrderId: String(order.orderid),
              strategyName: order?.strategyName || "",
              strategyUniqueId: strategyUniqueId,
              text: `Risk square-off: Loss exceeded limit`,
              parentOrderId: order.id,
              buyprice: order.price,
              buysize: order.quantity,
              buyvalue: order.tradedValue || (order.price * order.quantity)
            };

            

            // const tempSellOrder = await Order.create(sellOrderData);

            // // Call instance for order placement
            // const instanceResponse = await callSquareOffInstance(user, orderInput, null);

            //   console.log(instanceResponse,'=====================instanceResponse==================================');

            // logSuccess(null, {
            //   msg: "Instance response received for square off",
            //   userId: user.id,
            //   responseStatus: instanceResponse?.status,
            //   responseResult: instanceResponse?.result
            // });

            // // Handle response
            // if (instanceResponse?.status && instanceResponse?.result === "SUCCESS") {
            //   // Calculate PnL
            //   const sellPrice = instanceResponse?.orderDetails?.avgPrice || instanceResponse?.orderDetails?.price;
            //   const sellQuantity = instanceResponse?.orderDetails?.quantity || orderInput.quantity;
            //   const sellValue = sellPrice * sellQuantity;
              
            //   const buyPrice = order.price;
            //   const buyQuantity = order.quantity;
            //   const buyValue = order.tradedValue || (buyPrice * buyQuantity);
              
            //   const pnl = (sellPrice - buyPrice) * Math.min(sellQuantity, buyQuantity);

            //   // Update SELL order
            //   await tempSellOrder.update({
            //     status: "COMPLETE",
            //     orderstatuslocaldb: "COMPLETE",
            //     positionStatus: "COMPLETE",
            //     orderid: instanceResponse?.orderId,
            //     uniqueOrderId: instanceResponse?.uniqueOrderId,
            //     fillid: instanceResponse?.orderDetails?.fillId,
            //     price: sellPrice,
            //     fillprice: sellPrice,
            //     tradedValue: sellValue,
            //     fillsize: sellQuantity,
            //     quantity: sellQuantity,
            //     pnl: pnl?.toFixed(2),
            //     text: instanceResponse?.message || "Risk square-off completed"
            //   });

            //   // Update original BUY order
            //   await Order.update(
            //     { positionStatus: "COMPLETE", orderstatuslocaldb: "COMPLETE" },
            //     { where: { id: order.id } }
            //   );

            //   // Send success alert
            //   io.to(roomName).emit("risk_alert", {
            //     type: "POSITION_SQUARED",
            //     userId: user.id,
            //     username: user.username,
            //     orderId: order.orderid,
            //     symbol: order.tradingsymbol,
            //     quantity: sellQuantity,
            //     pnl: pnl?.toFixed(2),
            //     message: `✅ Position squared: ${order.tradingsymbol} Qty: ${sellQuantity} PnL: ${pnl?.toFixed(2)}`,
            //     ts: Date.now(),
            //   });

            //   console.log(`✅ Order ${order.orderid} squared off successfully via instance`);
              
            // } else if (instanceResponse?.result === "BROKER_REJECTED") {
            //   await tempSellOrder.update({
            //     status: "FAILED",
            //     orderstatuslocaldb: "FAILED",
            //     text: instanceResponse.message || "Broker rejected"
            //   });
              
            //   console.log(`❌ Broker rejected square off for order ${order.orderid}:`, instanceResponse.message);
              
            // } else {
            //   await tempSellOrder.update({
            //     status: "FAILED",
            //     orderstatuslocaldb: "FAILED",
            //     text: instanceResponse.message || "Instance error"
            //   });
              
            //   console.log(`❌ Failed to square off order ${order.orderid}:`, instanceResponse.message);
            // }

          } catch (orderError) {
            logError(null, orderError, {
              msg: `Square off failed for order`,
              orderId: order?.orderid,
              userId: user.id,
              error: orderError.message
            });
            console.error(`❌ Error squaring off order ${order?.orderid}:`, orderError.message);
          }
        }

        // Send final summary alert
        io.to(roomName).emit("risk_alert", {
          type: "RISK_ACTION_COMPLETED",
          userId: user.id,
          username: user.username,
          totalPnL: totalPnL,
          maxLoss: maxLoss,
          dematFund: userFund,
          ordersSquared: orders.length,
          message: `✅ All positions squared off for ${user.username}. Total loss: ₹${Math.abs(totalPnL).toFixed(2)}`,
          ts: Date.now(),
        });

      } catch (userError) {
        logError(null, userError, {
          msg: `Error processing user`,
          userId: userId,
          error: userError.message
        });
        console.error(`❌ Error processing user ${userId}:`, userError.message);
      }
    }

  } catch (error) {
    logError(null, error, {
      msg: `Risk management interval error`,
      error: error.message
    });
    console.error("❌ Risk management interval error:", error);
  }
// }, 60000); // Run every minute
}, 1000); // 1 second

// Error handling for uncaught exceptions
process.on('unhandledRejection', (error) => {
  logError(null, error, {
    msg: `Unhandled rejection in risk management`,
    error: error.message
  });
  console.error('❌ Unhandled rejection in risk management:', error);
});









// import User from "../models/userModel.js";
// import Order from "../models/orderModel.js";
// import RiskConfig from "../models/RiskConfig.js";
// import livePriceStore from "../services/livePriceStore.js";
// import { placeAngelOrder } from "../services/placeAngelOrder.js";
// import { placeKiteOrder } from "../services/placeKiteOrder.js";
// import { placeFyersOrder } from "../services/placeFyersOrder.js";
// import { placeFinavasiaOrder } from "../services/placeFinavasiaOrder.js";
// import { placeUpstoxOrder } from "../services/placeUpstoxOrder.js";
// import { placeGrowwOrder } from "../services/groww.service.js";
// import { getIO } from "../socket/index.js"; // correct path lagana
// import { logSuccess, logError } from "../utils/loggerr.js";

// setInterval(async () => {
//   try {
     
//     // 1️⃣ Fetch active risk configuration
//     const riskConfig = await RiskConfig.findOne({
//       where: {
//         isActive: true,
//       },
//       raw: true,
//     });

//     console.log(riskConfig, '============riskConfig========');

//     if (!riskConfig || !riskConfig.isActive) {
//       logSuccess(null, {
//         msg: `Risk management inactive - no active config found`,
//         timestamp: new Date().toISOString()
//       });
//       return;
//     }

//     const roomName = `risk_management`;
//     const io = getIO();

//     // 2️⃣ Fetch all OPEN BUY orders
//     const openOrders = await Order.findAll({
//       where: {
//         orderstatuslocaldb: "OPEN",
//         transactiontype: "BUY",
//         positionStatus: "OPEN",
//       },
//       raw: true,
//     });

//     console.log(openOrders, '=======openOrders========');

//     if (!openOrders.length) {
//       logSuccess(null, {
//         msg: `No open orders found`,
//         timestamp: new Date().toISOString()
//       });
//       console.log("✅ No open orders found");
//       return;
//     }

//     logSuccess(null, {
//       msg: `Fetched open orders`,
//       count: openOrders.length,
//       orderIds: openOrders.map(o => o.orderid)
//     });

//     // 3️⃣ Group orders by user and calculate PnL
//     const userData = {};

//     for (const order of openOrders) {
//       const currentPrice = livePriceStore.getPrice(order.angelOneToken);
//       // const currentPrice = 194; // For testing

//       if (!currentPrice) {
//         logSuccess(null, {
//           msg: "No current price for symbol",
//           symbol: order.symbol,
//           token: order.angelOneToken,
//           orderId: order.orderid
//         });
//         continue;
//       }

//       const pnl = (currentPrice - order.price) * order.quantity;

//       if (!userData[order.userId]) {
//         userData[order.userId] = {
//           totalPnL: 0,
//           orders: []
//         };
//       }

//       userData[order.userId].totalPnL += pnl;
//       userData[order.userId].orders.push(order);
//     }

//     const userIds = Object.keys(userData);
//     if (!userIds.length) {
//       logSuccess(null, {
//         msg: `No users with valid price data`,
//         timestamp: new Date().toISOString()
//       });
//       return;
//     }

//     // 4️⃣ Fetch all users in one query with specific attributes including dematFund
//     const users = await User.findAll({
//       where: { 
//         id: userIds,
//         angelLoginUser: true, // Only fetch active users
//       },
//       // attributes: ['id', 'username', 'brokerName', 'role', 'angelLoginUser','DematFund'],
//       raw: true
//     });

//     const userMap = {};
//     users.forEach(u => userMap[u.id] = u);

//     logSuccess(null, {
//       msg: `Fetched users data`,
//       userIds: userIds,
//       foundUsers: users?.length
//     });

//     // 5️⃣ Risk Check and Square off based on fund
//     for (const userId of userIds) {
//       try {
//         const { totalPnL, orders } = userData[String(userId)];
        
//         // Check if user exists in map
//         const user = userMap[userId];

//         if (!user) {
//           logSuccess(null, {
//             msg: `User not found or inactive`,
//             userId: userId
//           });
//           continue;
//         }

//         // Log PnL for monitoring
//         logSuccess(null, {
//           msg: `User PnL calculated`,
//           userId: user.id,
//           username: user.username,
//           totalPnL: totalPnL.toFixed(2),
//           ordersCount: orders.length,
//           dematFund: user.DematFund
//         });

//         if (isNaN(totalPnL)) {
//           logSuccess(null, {
//             msg: "totalPnL is NaN",
//             userId: user.id,
//             username: user.username
//           });
//           continue;
//         }

//         // ========== FUND-BASED RISK CALCULATION ==========
        
//         // Get user's fund (default to 0 if not available)
//         const userFund = Number(user?.DematFund) || 0;
        
//         // Calculate max loss based on user's fund and strategy
//         let maxLoss = 0;
//         let strategyUsed = 'none';
        
//         if (userFund > 0) {
//           // Strategy 1: For funds up to 75,000 (using 30% of fund)
//           if (userFund <= riskConfig.strategyOne.fund) {
//             maxLoss = riskConfig.strategyOne.maxLoss
//             strategyUsed = 'strategyOne';
//           }
//           // Strategy 2: For funds between 75,001 and 150,000 (using 25% of fund)
//           else if (userFund <= riskConfig.strategyTwo.fund) {
//             maxLoss = maxLoss = riskConfig.strategyTwo.maxLoss
//             strategyUsed = 'strategyTwo';
//           }
          
//         } 

//         // Ensure maxLoss is positive
//         maxLoss = Math.abs(maxLoss);

//         logSuccess(null, {
//           msg: `Risk calculation for user`,
//           userId: user.id,
//           username: user.username,
//           dematFund: userFund,
//           maxLoss: maxLoss,
//           strategyUsed: strategyUsed,
//           totalPnL: totalPnL.toFixed(2)
//         });

//         // Check if loss exceeds threshold
//         if (totalPnL >= -maxLoss) {
//           logSuccess(null, {
//             msg: `Loss within limits`,
//             userId: user.id,
//             username: user.username,
//             totalPnL: totalPnL.toFixed(2),
//             maxLoss: maxLoss,
//             remainingLoss: (maxLoss + totalPnL).toFixed(2)
//           });
//           continue; // Skip if loss is within limit
//         }

//         logSuccess(null, {
//           msg: `🚨 RISK TRIGGERED - Max loss limit hit`,
//           userId: user.id,
//           username: user.username,
//           totalPnL: totalPnL.toFixed(2),
//           maxLoss: maxLoss,
//           dematFund: userFund,
//           strategyUsed: strategyUsed,
//           ordersCount: orders.length,
//           exceededBy: (Math.abs(totalPnL) - maxLoss).toFixed(2)
//         });

//         // Send initial alert
//         io.to(roomName).emit("risk_alert", {
//           type: "MAX_LOSS_TRIGGERED",
//           userId: user.id,
//           username: user.username,
//           totalPnL,
//           maxLoss,
//           dematFund: userFund,
//           message: `🚨 Max loss limit hit for ${user.username}. Loss: ₹${Math.abs(totalPnL).toFixed(2)} exceeds limit: ₹${maxLoss}`,
//           ts: Date.now(),
//         });

//         // 6️⃣ Square off all positions for this user
//         for (const o of orders) {
//           try {
//             const strategyUniqueId = o.strategyUniqueId || "";
//             const transactiontype = "SELL"; // square off leg

//             // Validate required fields
//             if (!o.quantity || o.quantity <= 0) {
//               logSuccess(null, {
//                 msg: `Invalid quantity for order`,
//                 orderId: o.orderid,
//                 userId: user.id,
//                 quantity: o.quantity
//               });
//               continue;
//             }

//             // Prepare common request input
//             const reqInput = {
//               variety: o.variety,
//               symbol: o.tradingsymbol,
//               instrumenttype: o.instrumenttype,
//               token: o.symboltoken,
//               orderType: o.ordertype,
//               quantity: o.quantity,
//               productType: o.producttype,
//               duration: o.duration,
//               exch_seg: o.exchange,
//               price: o.price,
//               transactiontype,
//               totalPrice: o.totalPrice,
//               actualQuantity: o.actualQuantity,
//               userId: user.id,
//               ordertag: "aitrading",
//               userNameId: user.username,
//               angelOneToken: o?.angelOneToken || o.token,
//               angelOneSymbol: o?.angelOneSymbol || o?.symbol,
//               broker: o?.broker,
//               buyOrderId: String(o.orderid),
//               groupName: o?.strategyName || "",
//               strategyUniqueId: strategyUniqueId,
//               kiteSymbol: o.tradingsymbol || o.angelOneSymbol,
//               kiteToken: o.symboltoken || o.angelOneToken,
//               finavasiaSymbol: o.tradingsymbol || o.angelOneSymbol,
//               finavasiaToken: o?.symboltoken || o?.angelOneToken,
//               FyersSymbol: o.tradingsymbol || o.angelOneSymbol,
//               fyersToken: o.symboltoken || o.angelOneToken,
//               growToken: o.tradingsymbol,
//               growwSegment: o.optiontype,
//               growwExchange: o.exchange,
//             };

//             // Log incoming order data
//             logSuccess(null, {
//               msg: `Processing square off order`,
//               body: reqInput,
//               userId: user.id,
//               username: user.username,
//               orderId: o.orderid
//             });

//             // Get broker from user object with fallback
//             const broker = (user.brokerName || o.broker || "").toLowerCase();
            
//             if (!broker) {
//               logSuccess(null, {
//                 msg: `No broker specified for user`,
//                 userId: user.id,
//                 username: user.username
//               });
//               continue;
//             }

//             console.log(`🔄 Squaring off order ${o.orderid} for ${user.username} via ${broker} | Total PnL: ${totalPnL.toFixed(2)} | Max Loss: ${maxLoss}`);

//             //=============== CALL BROKER SPECIFIC SERVICE ===============//
//             let orderResult;

//             if (broker === "angelone" && user.role === "user") {
//               orderResult = await placeAngelOrder(user, reqInput, null);
//             } 
//             else if (broker === "kite" && user.role === "user") {
//               orderResult = await placeKiteOrder(user, reqInput, null, false);
//             } 
//             else if (broker === "fyers" && user.role === "user") {
//               orderResult = await placeFyersOrder(user, reqInput, null);
//             } 
//             else if (broker === "finvasia" && user.role === "user") {
//               orderResult = await placeFinavasiaOrder(user, reqInput, null, true);
//             } 
//             else if (broker === "upstox" && user.role === "user") {
//               orderResult = await placeUpstoxOrder(user, reqInput, null, true);
//             } 
//             else if (broker === "groww" && user.role === "user") {
//               orderResult = await placeGrowwOrder(user, reqInput, null, false);
//             } 
//             else {
//               console.log(`❌ Invalid broker: ${broker} for user ${user.username}`);
//               continue;
//             }

//             logSuccess(null, {
//               msg: `Order placed successfully`,
//               body: {
//                 orderResult,
//                 orderId: o.orderid,
//                 broker,
//                 userId: user.id
//               }
//             });

//             // Send per-order success alert
//             io.to(roomName).emit("risk_alert", {
//               type: "POSITION_SQUARED",
//               userId: user.id,
//               username: user.username,
//               orderId: o.orderid,
//               symbol: o.tradingsymbol,
//               quantity: o.quantity,
//               message: `✅ Position squared: ${o.tradingsymbol} Qty: ${o.quantity}`,
//               ts: Date.now(),
//             });

//             // Update order status in database if square off successful
//             if (orderResult && orderResult.success) {
//               console.log(`✅ Order ${o?.orderid} squared off successfully`);
              
//               // Optionally update order status here if needed
//               await Order.update(
//                 { 
//                   positionStatus: 'CLOSED',
//                   squareOffTime: new Date()
//                 },
//                 { where: { id: o.id } }
//               );
//             } else {
//               console.log(`❌ Failed to square off order ${o?.orderid}:`, orderResult?.message || 'Unknown error');
//             }

//           } catch (orderError) {
//             logSuccess(null, {
//               msg: `placeOrder failed with error`,
//               error: orderError,
//               orderId: o.orderid,
//             });
//             console.error(`❌ Error squaring off order ${o?.orderid}:`, orderError.message);
//           }
//         }

//         // Send final summary alert after all orders are processed
//         io.to(roomName).emit("risk_alert", {
//           type: "RISK_ACTION_COMPLETED",
//           userId: user.id,
//           username: user.username,
//           totalPnL: totalPnL,
//           maxLoss: maxLoss,
//           dematFund: userFund,
//           ordersSquared: orders.length,
//           message: `✅ All positions squared off for ${user.username}. Total loss: ₹${Math.abs(totalPnL).toFixed(2)}`,
//           ts: Date.now(),
//         });

//       } catch (userError) {
//         logSuccess(null, {
//           msg: `placeOrder failed with error two`,
//           error: userError,
//         });
//         console.error(`❌ Error processing user ${userId}:`, userError.message);
//       }
//     }

//   } catch (error) {
//     logSuccess(null, {
//       msg: `placeOrder failed with error main`,
//       error: error,
//     });
//     console.error("❌ Risk management interval error:", error);
//   }
// // }, 60000); // Run every minute
// }, 1000); // Run every minute

// // Also add error handling for uncaught exceptions
// process.on('unhandledRejection', (error) => {
//   logSuccess(null, {
//     msg: `Unhandled rejection in risk management:`,
//     error: error,
//   });
//   console.error('❌ Unhandled rejection in risk management:', error);
// });

