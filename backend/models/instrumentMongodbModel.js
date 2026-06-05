import mongoose from "mongoose";

const brokerInstrumentSchema = new mongoose.Schema(
  {
    token: String,
    symbol: String,
    exch_seg: String,

    kiteSymbol: String,
    kiteToken: String,
    kiteExchange: String,

    finvasiaSymbol: String,
    finvasiaToken: String,

    upstoxSymbol: String,
    upstoxToken: String,

    fyersSymbol: String,
    fyersToken: String,

    growwTradingSymbol: String,
    growwSymbol: String,
    growwExchange:String,
    growwSegment:String,

    source: String,

    version: {
      type: String, // same for one run
      index: true,
    },
  },
  {
    timestamps: true,
  }
);



export default mongoose.model(
  "BrokerInstrumentBackup",
  brokerInstrumentSchema
);
