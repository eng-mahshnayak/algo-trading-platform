import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    postgreId:{
       type:Number
    },
    firstName: {
      type: String,
      default: null,
    },
    lastName: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true, // same as setter trim
    },
    phoneNumber: {
      type: String,
      minlength: 10,
      maxlength: 15,
      default: null,
    },
    password: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["admin", "user", "clone-user"],
      default: "user",
      required: true,
    },
    isChecked: {
      type: Boolean,
      default: false,
    },
    brokerName: {
      type: String,
      default: null,
    },
    brokerImageLink: {
      type: String,
      default: null,
    },
    angelLoginUser: {
      type: Boolean,
      default: null,
    },
    angelLoginExpiry: {
      type: Date,
      default: null,
    },
    DematFund: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0.0,
    },
    userToken: String,
    authToken: String,
    feedToken: String,
    refreshToken: String,

    resetCode: String,
    resetCodeExpire: String,

    strategyName: String,
    strategyDis: String,

    packageName: String,
    packageDis: String,

    packageDate: Date,
    packageFromDate: Date,

    kite_key: String,
    kite_secret: String,
    kite_pin: String,
    kite_client_id: String,

    finavacia_vendor_code: String,
    finavacia_imei: String,

    source: String,
    assignEmp: String,
  },
  {
    timestamps: true, // auto createdAt & updatedAt
  }
);

export default mongoose.model("User", userSchema);
