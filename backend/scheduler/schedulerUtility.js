
import RiskConfig from "../models/RiskConfig.js";
import Order from "../models/orderModel.js";

export function splitQuantity(totalQty, lotSize, maxLots = 20) {

  const maxQty = lotSize * maxLots;

  const quantities = [];

  let remaining = totalQty;

  while (remaining > 0) {

    const sellQty = Math.min(remaining, maxQty);

    quantities.push(sellQty);

    remaining -= sellQty;
  }

  return quantities;
}


export async function getRiskConfig() {

   let riskConfigCache = await RiskConfig.findOne({
      where: { isActive: true },
      raw: true
    });
  
  return riskConfigCache;
}
export async function processUserRisk(user, riskConfig) {

  const userFund = user?.DematFund || 0;

  let maxLoss = 0;

  if (userFund <= riskConfig.strategyTwo.fund&&userFund >= riskConfig.strategyOne.fund) {
    maxLoss = riskConfig.strategyOne.maxLoss;
  } 
  else if (userFund >= riskConfig.strategyTwo.fund) {
    maxLoss = riskConfig.strategyTwo.maxLoss;
  }

  const orders = await Order.findAll({
    where: {
      userId: user?.id,
      orderstatuslocaldb: "OPEN",
      transactiontype: "BUY",
      positionStatus: "OPEN",
    },
    raw: true
  });

  return {
    orders,
    maxLoss,
    userFund
  };

}