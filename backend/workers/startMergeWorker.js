
import { Worker } from "worker_threads";
import { instrumentGetFun } from "./mergeInstruments.worker.js";

export const startMergeWorker = () => {

  instrumentGetFun()
  // return new Promise((resolve, reject) => {
  //   try {



  //     // const worker = new Worker(
  //     //   new URL("../workers/mergeInstruments.worker.js", import.meta.url),
  //     //   {
  //     //     resourceLimits: {
  //     //       maxOldGenerationSizeMb: 4096,
  //     //     },
  //     //   }
  //     // );

  //     // worker.on("message", (msg) => {
  //     //   console.log("Worker:", msg);
  //     // });

  //     // worker.on("error", (err) => {
  //     //   console.error("❌ Worker error:", err);
  //     //   reject(err); // IMPORTANT
  //     // });

  //     // worker.on("exit", (code) => {
  //     //   if (code === 0) {
  //     //     console.log("✔️ Worker finished successfully");
  //     //     resolve();
  //     //   } else {
  //     //     reject(new Error(`Worker exited with code ${code}`));
  //     //   }
  //     // });
  //   } catch (err) {

  //     console.log(err,'reject error');
      
  //     reject(err); // IMPORTANT
  //   }
  // });
};



// import { Worker } from "worker_threads";



// export const startMergeWorker = () => {
//   try {

//     const worker = new Worker(
//     new URL("../workers/mergeInstruments.worker.js", import.meta.url),
//      {
//           resourceLimits: {
//             maxOldGenerationSizeMb: 4096, // worker memory limit
//           },
//         }
//   );

//   worker.on("message", (msg) => {
//     console.log("Worker:", msg);
//   });

//   worker.on("error", console.error);
    
//   } catch (err) {
    
//     console.log(err.message);
    
//   }
 
// };