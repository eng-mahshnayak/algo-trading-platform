
import cron from "node-cron";
import { startMergeWorker } from "../workers/startMergeWorker.js";
import { logSuccess, logError } from "../utils/loggerr.js";
import redis from "../utils/redis.js";  // your redis client

// =======================================================
// ⏱ Cron Job — Run every day at 6:00 AM
// =======================================================
cron.schedule("0 6 * * *", async () => {
// const callManual =  async () => {

  const now = new Date();

try {

  let MERGED_REDIS_KEY = 'merged_instruments_new'

    await redis.del(MERGED_REDIS_KEY)

     // Log success
    logSuccess( null,{
        msg: `🕖 old redish data is delete`,
      }
    );

  // Log success
    logSuccess(null,
      { cronTime: now.toISOString() },
      {
        msg: `🕖 Cron triggered startMergeWorker at ${now.toLocaleString()}`,
        timestamp: now.toLocaleString(),
      }
    );


    // Start worker
    await startMergeWorker();

    // Log success
    logSuccess(null,
      { cronTime: now.toISOString() },
      {
        msg: "startMergeWorker executed successfully",
        timestamp: now.toLocaleString(),
      }
    );

    console.log(`✔️ startMergeWorker completed successfully at ${new Date().toLocaleString()}`);
  } catch (err) {
    // Log error
    logError(null,
      { cronTime: now.toISOString() },
      {
        msg: "startMergeWorker failed",
        timestamp: new Date().toLocaleString(),
        error: err.message,
        stack: err.stack,
      }
    );

    console.error(`❌ startMergeWorker failed at ${new Date().toLocaleString()}:`, err);
  }
}
);


// callManual()

// ====================ref code 7 jan  2025 ==========================

// import cron from "node-cron";
// import { startMergeWorker } from "../workers/startMergeWorker.js";
// import { logSuccess, logError } from "../utils/loggerr.js";


// // ⏱ every day at 7:00 AM
// // cron.schedule("0 7 * * *", startMergeWorker);


// // ⏱ Every day at 7:00 AM
// cron.schedule("0 7 * * *", async () => {
//   const now = new Date();
//   console.log(`🕖 Cron triggered startMergeWorker at ${now.toLocaleString()}`);

//   try {
//     await startMergeWorker();
//     console.log(`✔️ startMergeWorker completed successfully at ${new Date().toLocaleString()}`);
//   } catch (err) {
//     console.error(`❌ startMergeWorker failed at ${new Date().toLocaleString()}:`, err);
//   }
// });