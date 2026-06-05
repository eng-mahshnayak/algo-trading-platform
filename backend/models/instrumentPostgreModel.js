import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Instrument = sequelize.define(
  "Instrument",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },

    // 🔹 Core Instrument Fields
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    symbol: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    instrumenttype: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    expiry: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },

    strike: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "0.000000",
    },

    lotsize: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "1",
    },

    exch_seg: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "",
    },

    tick_size: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "0.000000",
    },

    // 🔹 Zerodha (Kite)
    kiteSymbol: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    kiteToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    kiteExchange: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // 🔹 Groww
    growwTradingSymbol: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    growwSymbol: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // 🔹 Finvasia
    finvasiaSymbol: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    finvasiaToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // 🔹 Upstox
    upstoxSymbol: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    upstoxToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // 🔹 Fyers
    fyersSymbol: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    fyersToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "Instruments",
    timestamps: true, // createdAt & updatedAt
    indexes: [
      { fields: ["token"] },
      { fields: ["symbol"] },
      { fields: ["exch_seg"] },
    ],
  }
);

export default Instrument;



