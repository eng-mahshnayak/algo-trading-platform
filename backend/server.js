

// 🔥 Global crash handlers
process.on("uncaughtException", err => {
  console.error("🔥 Uncaught Exception:", err.stack || err);
});

process.on("unhandledRejection", err => {
  console.error("🔥 Unhandled Rejection:", err.stack || err);
});



import express from 'express';
import dotenv from 'dotenv';
import sequelize from './config/db.js';
import { connectMongo } from './config/mongodb.js';
import authRoutes from './routes/authRoute.js';
import userRoutes from './routes/userRoute.js';
import orderRoute from './routes/orderRoute.js';
import fyersRoute from './routes/fyersRoute.js';
import kiteRoute from './routes/kiteRoute.js';
import upStoxRoute from './routes/upstockRoute.js';
import shoonyaRoute from './routes/shoonyaRoute.js';
import angeloneRoute from './routes/angelOneRoute.js';
import growwRoute from './routes/growwRoutes.js';
import kotakNeoRoute from './routes/kotakneoRoute.js';
import adminRoute from './routes/admin/adminOrderRoute.js';





import cors from 'cors';
import path from 'path';
import http from "http";
import session from "express-session";
import cookieParser from "cookie-parser";
import { initSocket } from "./socket/index.js";
import "./scheduler/startMergeWorker.js"

// import "./scheduler/autoOptionTrade.js"


// import "./scheduler/ocoWatcher.js"

import {seedAdmin} from './script/adminInsert.js'

import './script/postgreToMongodbUserData.js'

import './script/orderInsert.js'


import "./script/getData.js"

import v8 from "v8";

import awsRoutes from './routes/awsAdmin/awsAdminRoute.js';



const heapLimit = v8.getHeapStatistics().heap_size_limit;

console.log("Heap limit:", heapLimit / 1024 / 1024, "MB");


dotenv.config();

const app = express();

app.use(cookieParser()); // <– parses cookies automatically

app.use(
  cors({
    origin: "*",  
  })
);


app.use(express.json());



app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: "sid",
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,          // HTTP only in dev
    maxAge: 1000 * 60 * 60,
  },
}));


app.get("/test/point", (req, res) => {
  
  res.send("Login callback received successfully ✅");
  
});


app.use("/api/uploads", express.static(path.join("uploads")));
app.use("/api/uploads/platform-logos", express.static(path.join("uploads")));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/order', orderRoute);
app.use('/api/admin', adminRoute);
app.use('/api/awsadmin', awsRoutes);


app.use('/api', fyersRoute);
app.use('/api', kiteRoute);
app.use('/api', angeloneRoute);
app.use('/api', shoonyaRoute);
app.use('/api', growwRoute);
app.use('/api', kotakNeoRoute);

app.use('/api', upStoxRoute);






const server = http.createServer(app);

// Initialize Socket.IO on the *server* (NOT the app)
initSocket(server); 

const PORT = process.env.PORT || 5000;



// sequelize.sync({ force: false }).then(() => {
//   console.log('✅ Database connected & synced');

//   connectMongo();

//   server.listen(PORT, () => {
//     console.log(`🚀 Server running on http://localhost:${PORT}`);
//     seedAdmin()
//   });
// }).catch(err => {
//   console.error('❌ DB connection error:', err);
// });



const startServer = async () => {
  try {

    // ✅ Postgre connect
    await sequelize.sync({ force: false });
    console.log("✅ PostgreSQL connected & synced");

    // ✅ Mongo connect
    await connectMongo();
   

    // ✅ Start server AFTER DB
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      seedAdmin();
    });

  } catch (err) {

    console.error("❌ Database connection error:", err);
    process.exit(1); // STOP APP
  }
};

startServer();











// url =====> https://smartapi.angelbroking.com/signup
// password ====> Mahesh@1997


// username ====> bluewebspark@gmail.com
//password======> Manish@5123
// pin ========> 7748
























