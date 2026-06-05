
import Order from "../models/orderModel.js";
import {  logError } from "../utils/loggerr.js";
import { getIO } from "../socket/index.js";


export const updateTargetAndStoploss = async (user,buyOrderReq, targetPrice,stoplossPrice, req) => {
  try {

        await Order.update(
            {
              squareoff: targetPrice,
              stoploss: stoplossPrice,

            },
            {
              where: {
                userId: user.id,
                orderid: buyOrderReq.orderid,
              },
            }
          );

      // AFTER successful DB update
      const io = getIO();

      const payload = {
      orderId: buyOrderReq.orderid,
      targetPrice,
      stoplossPrice,
      userId: user.id,
      ts: Date.now(),
    };

      console.log("📤 Emitting order:oco:update →", payload);

     io.to("orders").emit("order:oco:update", payload);

  } catch (error) {

    logError(req, error, { msg: "placeAngelOrder failed unexpectedly" });

    return { status: false, broker: "angelone", message: error?.message };
  }
}


// setTimeout(() => {
//   getIO().to("orders").emit("order:oco:update", {
//     orderId: "TEST123",
//     targetPrice: 999,
//     stoplossPrice: 111,
//     userId: 39,
//     ts: Date.now(),
//   });

//   console.log('hhhy');
  
// }, 3000);



