import axios from 'axios';
import { networkInterfaces } from 'os';
import User from "../models/userModel.js"
import Order from "../models/orderModel.js"


export async function UpdateUserIdInOrderTable() {
  try {
    console.log("🔁 Start updating username in Order table...");

    // 1) Get all users (only id + username needed)
    const users = await User.findAll({
      attributes: ["id", "username"],
    });

    // 2) Create a map: userId -> username
    const userMap = new Map();
    for (const user of users) {
      userMap.set(user.id, user.username);
    }

    // 3) Get all orders
    const orders = await Order.findAll();

    let updatedCount = 0;
    let skippedCount = 0;

    // 4) Loop through orders and update username (or any other fields)
    for (const order of orders) {
      const userId = order.userId; // field already stored in Order

      if (!userId) {
        skippedCount++;
        continue;
      }

      const username = userMap.get(userId);

      if (!username) {
        // No user found for this userId
        skippedCount++;
        continue;
      }

      console.log(username,'username');
      

      // Update fields in order table
      await order.update({
        userNameId: username, // 👈 make sure 'username' column exists in Order model
        // you can add more fields here if needed, e.g.
        // userEmail: user.email,
      });

      updatedCount++;
    }

    console.log(
      `✅ Done. Updated ${updatedCount} orders, skipped ${skippedCount} (no user or no userId).`
    );

    return { updatedCount, skippedCount };
  } catch (error) {
    console.error("❌ Error while updating orders:", error);
    throw error;
  }
}



// UpdateUserIdInOrderTable()


export async function getPublicIP() {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    return response.data.ip;
  } catch (error) {
    console.error("Error fetching public IP:", error);
    return '127.0.0.1'; // Fallback
  }
}


export async function getMACAddress() {

  const interfaces = networkInterfaces();
  for (const iface in interfaces) {
    const ifaceDetails = interfaces[iface];
    for (const detail of ifaceDetails) {
      if (detail.internal === false && detail.mac) {
        return detail.mac;
      }
    }
  }
  return '00:00:00:00:00:00';
}














