import Order from "../models/orderModel.js";
import { Op } from "sequelize";

// 🎯 Target users
const TARGET_USERS = [

 { userId: 116, userNameId: "37288" },
 { userId: 114, userNameId: "45053" },
 { userId: 110, userNameId: "58150" },
 { userId: 111, userNameId: "84789" },

];

// 🎯 Source user
const SOURCE_USER_ID = 22;

// 🔥 Lot size finder
function getLotSize(symbol) {
  if (!symbol) return 1;

  const sym = symbol.toUpperCase();

  if (sym.includes("SENSEX")) return 20;
  if (sym.includes("BANKNIFTY")) return 30;
  if (sym.includes("NIFTY")) return 65;
  if (sym.includes("DIXON")) return 50;

  return 1;
}

// 🔥 Strong random generator
function generateLotQuantity(symbol, userIndex, orderIndex) {
  const lotSize = getLotSize(symbol);

  // 🎯 base random (10–30)
  let lotCount = Math.floor(Math.random() * 21) + 10;

  // 🎯 strong randomness (time आधारित)
  const timeFactor = Date.now() % 7; // हर call me change hoga

  // 🎯 unique mix
  const variation = (userIndex * 3 + orderIndex + timeFactor) % 5;

  lotCount = lotCount + variation;

  // ❌ सीमा control
  if (lotCount > 30) lotCount = 30;
  if (lotCount < 10) lotCount = 10;

  return lotSize * lotCount;
}

export async function copyOrdersToUsers() {
  try {
    console.log("🚀 Script started...");

    // 📅 last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    console.log("📅 Fetch after:", threeMonthsAgo);

    // 📥 fetch orders
    const orders = await Order.findAll({
      where: {
        userId: SOURCE_USER_ID,
        createdAt: {
          [Op.gte]: threeMonthsAgo,
        },
      },
      raw: true,
    });

    console.log(`📦 Orders fetched: ${orders.length}`);

    if (!orders.length) {
      console.log("⚠️ No data found");
      return;
    }

    // 🔁 loop users
    for (let i = 0; i < TARGET_USERS.length; i++) {
      const user = TARGET_USERS[i];

      console.log(`\n👤 Processing userId: ${user.userId}`);

      const newOrders = orders.map((order, index) => {

        // 🔥 quantity generate
        const qty = generateLotQuantity(
          order.tradingsymbol,
          i,
          index
        );

        console.log(
          `➡️ ${order.tradingsymbol} | User ${user.userId} | Qty: ${qty}`
        );

        return {
          ...order,
          id: undefined,
          userId: user.userId,
          userNameId: user.userNameId,
          quantity: String(qty),
          actualQuantity: String(qty),

          // 🔥 IMPORTANT FIX (aaj ka bhi random banega)
          createdAt: new Date(Date.now() + Math.floor(Math.random() * 10000)),
          updatedAt: new Date(),
        };
      });

      await Order.bulkCreate(newOrders);

      console.log(`✅ Inserted ${newOrders.length} orders`);
    }

    console.log("\n🎉 All users done!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

// 👉 run manually
// copyOrdersToUsers();



export async function deleteOrdersForUsers() {
  try {

    // 🎯 Target users
const TARGET_USERS123 = [

 { userId: 116, userNameId: "37288" },
 { userId: 114, userNameId: "45053" },
 { userId: 110, userNameId: "58150" },
 { userId: 111, userNameId: "84789" },

];

    console.log("🗑️ Delete script started...");

    // condition build
    const conditions = TARGET_USERS123.map(user => ({
      userId: user.userId,
    //   userNameId: user.userNameId,
    }));

    const deletedCount = await Order.destroy({
      where: {
        [Op.or]: conditions,
      },
    });

    console.log(`✅ Deleted ${deletedCount} orders`);
  } catch (err) {
    console.error("❌ Delete failed:", err.message);
  }
}

// run
// deleteOrdersForUsers();

