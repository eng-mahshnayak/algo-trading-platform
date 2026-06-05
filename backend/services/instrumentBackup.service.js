
import BrokerInstrumentBackup from "../models/instrumentMongodbModel.js";

export const backupInstruments = async (finalMerged) => {
  try {

    const version = new Date().toISOString(); 
   
    const BATCH_SIZE = 15000;

    for (let i = 0; i < finalMerged.length; i += BATCH_SIZE) {

      const batch = finalMerged
        .slice(i, i + BATCH_SIZE)
        .map((item) => ({
        token:item.token,
        symbol:item.symbol,
        exch_seg:item.exch_seg,
        kiteSymbol:item.kiteSymbol,
        kiteToken:item.kiteToken,
        kiteExchange:item.kiteExchange,
        finvasiaSymbol:item.finvasiaSymbol,
        finvasiaToken:item.finvasiaToken,
        upstoxSymbol:item.upstoxSymbol,
        upstoxToken:item.upstoxToken,
        fyersSymbol:item.fyersSymbol,
        fyersToken:item.fyersToken,
        growwTradingSymbol:item.growwTradingSymbol,
        growwSymbol:item.growwSymbol,
        growwExchange:item.growwExchange,
        growwSegment:item.growwSegment,

        version,
        }));

      await BrokerInstrumentBackup.insertMany(batch, {
        ordered: false, // skip duplicates
      });

    //   console.log(`Inserted batch ${i / BATCH_SIZE + 1}`);
    }

    console.log("✅ MongoDB Backup Completed");

  } catch (err) {
    console.error("Backup failed:", err.message);
  }
};
