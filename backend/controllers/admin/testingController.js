
import redis from "../../utils/redis.js";  // your redis client

export const testingInstrument = async (req, res) => {
  try {



    const MERGED_REDIS_KEY = "merged_instruments_new";

    const cachedData = await redis.get(MERGED_REDIS_KEY);


    
    
    
 
  } catch (error) {
    console.error("getCloneUserTrade error:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong while fetching clone user trade data",
      error: error.message,
    });
  }
};