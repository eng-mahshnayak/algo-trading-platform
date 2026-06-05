import UserMongodbModel from '../models/userMongodbModel.js';
import User from "../models/userModel.js";


const userPostgreToMongodb = async function () {
  try {

    let userId = 62

    //------------------------------------------------
    // ✅ Fetch Postgre user
    //------------------------------------------------
    const postgreUser = await User.findByPk(userId, { raw: true });

    if (!postgreUser) {
      console.log("User not found");
      return null;
    }

    //------------------------------------------------
    // 🔥 Clone full object
    //------------------------------------------------
    const userData = { ...postgreUser };

    //------------------------------------------------
    // ✅ Rename id → postgreId
    //------------------------------------------------
    userData.postgreId = userData.id;
    delete userData.id;

    //------------------------------------------------
    // ❗ Remove fields you DON'T want in Mongo
    //------------------------------------------------

    delete userData.password;     // NEVER store twice
    delete userData.resetCode;
    delete userData.resetCodeExpire;

    // optional:
    // delete userData.createdAt;
    // delete userData.updatedAt;

    //------------------------------------------------
    // 🚀 UPSERT
    //------------------------------------------------
    const mongoUser = await UserMongodbModel.findOneAndUpdate(
      { postgreId: userId },
      {
        $set: userData, // update if exists
      },
      {
        upsert: true,
        new: true,
      }
    );

    console.log("✅ User synced successfully");

    return mongoUser;

  } catch (error) {

    console.error("Sync Error:", error);
    throw error;
  }
};

// userPostgreToMongodb()
