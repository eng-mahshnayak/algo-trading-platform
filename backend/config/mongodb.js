
import mongoose from "mongoose";

export const connectMongo = async () => {
  try {

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // fast fail
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

  } catch (error) {

    console.error("❌ MongoDB connection failed:");
    console.error(error.message);
  }
};
