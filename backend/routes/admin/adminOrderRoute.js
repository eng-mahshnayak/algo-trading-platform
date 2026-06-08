import express from 'express';
import {  adminFetchOrderHolding, adminFetchUserPositionData, adminFetchUserPositionDataMongodb, adminGetCloneUserHolding, AdminGetHoldingMultiple, adminGetRecentOrder, AdminGetTotalUsers, AdminLoginMultipleUser, adminPlaceMultipleOrder, adminSequareOff, refreshAngelFundsForAllUsers } from '../../controllers/admin/adminOrderController.js';
import { getTokens, storeTokens } from '../../controllers/testController.js';
import {AdminAuthMiddleware, authMiddleware} from '../../middleware/authMiddleware.js';
import { adminGetUserAngelToken } from '../../controllers/userController.js';
import { adminGetOrderInTables, adminGetOrderWithDate, adminGetTradeInTables, adminGetTradesByStrategyUniqueId, adminSearchOrders, getOrderWithDate } from '../../controllers/placeOrderController.js';
import { adminloginWithTOTPInAngelOne, deleteMultipleUserSessions, deleteUserSessionById, fetchGooglFromSerpApi, getUserAdminSessionData, getUserSessionData } from '../../controllers/authController.js';
import { createStrategy, deleteStrategy, getAllStrategies, getAllStrategiesLoginUser, getStrategyById, updateStrategy } from '../../controllers/userStrategy.js';
import { createBroker, deleteBroker, getAllBrokers, getBrokerById, updateBroker } from '../../controllers/admin/brokerControler.js';
import { createCloneUser, deleteCloneUser, getCloneAllUsers, getCloneUserFund, getCloneUserTrade, loginCloneUserDemat, updateCloneUser, uploadOrderExcel } from '../../controllers/admin/cloneUserController.js';
import { upload } from '../../middleware/upload.js';
import {   adminGroupSquareOff, adminMultipleHoldingSquareOff, adminMultipleSquareOff, adminPlaceBrokerOrderWithEmployeeId, adminPlaceMultiBrokerOrder, adminPlaceMultiTargetStoplossOrder, adminPlaceReBuyOrder, adminSingleSquareOff, getLoginUser, getTokenStatusSummary } from '../../controllers/admin/adminMultipleBrokerController.js';
import { createManualOrder, createManualOrderWithBrokerPrice, createManualOrderWithInstrument, createSellManualOrderWithInstrument, createSellManualOrderWithInstrumentNew } from '../../controllers/admin/orderManualController.js';
import {  adminFetchSellOrdersAndUpdateManual, getUsersPnlData } from '../../controllers/admin/adminFetchOrder.js';
import { getDeshboardOrdersUpdate } from '../../controllers/angelController.js';
import { clearMergedInstrumentsCache, getMergedInstrumentsCacheTTL } from '../../controllers/instrumentMultipleDematController.js';
import { testingInstrument } from '../../controllers/admin/testingController.js';
import { syncHoldingsAllBrokers } from '../../services/baseBrokerHoldings.js';

import { angelTradeWebhookController, kiteTradeWebhookController } from '../../controllers/admin/webhook/adminWHController.js';
import { GetOrderStatusPerticularSymbol } from '../../controllers/admin/refreshController.js';
import multer from "../../utils/multer.js"; // path to your multer file
import { createPlatformSetting, deletePlatformSetting, getActivePlatformSetting, getPlatformSettings, updatePlatformSetting } from '../../controllers/admin/platform_settings.js';
import { createRiskConfig, deleteRiskConfig, getAllRiskConfig, getOneRiskConfig, updateRiskConfig } from '../../controllers/admin/riskConfigController.js';
import { getIO } from '../../socket/index.js';
import { adminSquareOff } from '../../controllers/awsInstance/adminController.js';

import { createGithubSetting, deleteGithubSetting, getAllGithubSettings, getGithubSettingById, updateGithubSetting } from '../../controllers/admin/githubSettingController.js';
import { bulkUpdateUserRisk, getAllUsersRisk, getUserRiskById, updateUserRisk } from '../../controllers/admin/riskManagementPerticularUserController.js';


const router = express.Router();

// ==========================================================
// Single file upload with field name 'softwareLogo'
//  user route  AdminAuthMiddleware not used in this routes 
// ==========================================================
router.post("/platform-settings", upload.single("softwareLogo"), authMiddleware,createPlatformSetting);
router.put("/platform-settings/:id", upload.single("softwareLogo"),authMiddleware, updatePlatformSetting);
router.get("/platform-settings", authMiddleware,getPlatformSettings);

router.delete("/platform-settings/:id", authMiddleware,deletePlatformSetting);

//  auth middleware nhi lagana h 
router.get("/active/platform-settings",getActivePlatformSetting);


// user route use 
router.get('/getusersectionsession/data',authMiddleware, getUserSessionData);


router.get('/getusersession/data',AdminAuthMiddleware, getUserAdminSessionData);
router.delete('/deleteusersession/:id',AdminAuthMiddleware, deleteUserSessionById);
router.post('/deleteusersession/many',AdminAuthMiddleware, deleteMultipleUserSessions);


router.get('/tokenstatussummary',AdminAuthMiddleware,getTokenStatusSummary)
router.get('/fetchloginuser',AdminAuthMiddleware,getLoginUser)


//  update fetch function start 

const successMiddleware = (req, res, next) => {

  console.log('req controll check 2 !');

  return res.json({
    status: true,
    message: "Success middleware response",
  });
};

router.get('/fetchorderdetails',successMiddleware)
// router.get('/fetchorderdetails',GetOrderStatusPerticularSymbol) // currently not working 30 jan 2026 

//  update fetch function end 




router.post('/multiple/place/order',AdminAuthMiddleware,adminPlaceMultiBrokerOrder)
router.post('/employeeid/place/order',AdminAuthMiddleware,adminPlaceBrokerOrderWithEmployeeId)
router.post('/rebuy/place/order',AdminAuthMiddleware,adminPlaceReBuyOrder)



router.get('/sequareoff',AdminAuthMiddleware,adminMultipleSquareOff)


router.post('/group/squareoff',AdminAuthMiddleware,adminGroupSquareOff)
router.post("/single/squareoff", AdminAuthMiddleware, adminSingleSquareOff);
router.post("/multiple/targetstoploss/order", AdminAuthMiddleware, adminPlaceMultiTargetStoplossOrder);
router.get('/holding/sequareoff',AdminAuthMiddleware,adminMultipleHoldingSquareOff)
router.post("/targetstoplosscheck", AdminAuthMiddleware, adminGroupSquareOff);



// router.get('/fetchorderdetails',adminFetchBuyOrdersAndUpdateManual)
router.get('/fetchsellorderdetails',adminFetchSellOrdersAndUpdateManual)

router.post("/getusers/pnldata", getUsersPnlData);



router.get('/get/totalusers',AdminAuthMiddleware,AdminGetTotalUsers)
router.get('/getuser/profile',AdminAuthMiddleware,adminGetUserAngelToken );


// router.get('/get/table/order',AdminAuthMiddleware,adminGetOrderInTables);

router.get('/get/table/order',AdminAuthMiddleware,adminGetOrderInTables);

router.get('/login/totp/angelone',AdminAuthMiddleware, adminloginWithTOTPInAngelOne);   // our code 



router.post('/datefilter/order',AdminAuthMiddleware,adminGetOrderWithDate);
router.post('/search/order',adminSearchOrders);


router.get('/get/table/trade',AdminAuthMiddleware,adminGetTradeInTables); // check
router.get("/trades/strategy/:strategyUniqueId", adminGetTradesByStrategyUniqueId);

// 
router.get("/angel/funds/refresh",AdminAuthMiddleware,refreshAngelFundsForAllUsers);


// strategies routes 
router.get("/strategies",AdminAuthMiddleware, getAllStrategies);          // findAll
router.get("/strategiesloginuser",AdminAuthMiddleware, getAllStrategiesLoginUser);  
router.get("/strategies/:id",AdminAuthMiddleware, getStrategyById);       // findOne
router.post("/strategies",AdminAuthMiddleware, createStrategy);           // create
router.put("/strategies",AdminAuthMiddleware, updateStrategy);        // update
router.delete("/strategies/:id",AdminAuthMiddleware, deleteStrategy);     // deleteOne




// brokers routes
router.get("/broker",authMiddleware, getAllBrokers);
router.get("/brokersignup", getAllBrokers);
router.get("/broker/:id",AdminAuthMiddleware, getBrokerById);
router.post("/broker", AdminAuthMiddleware,createBroker);
router.put("/broker",AdminAuthMiddleware, updateBroker);
router.delete("/broker/:id", AdminAuthMiddleware,deleteBroker);



// clone user admin routes 
router.get("/clone-users", getCloneAllUsers);
router.post("/clone-users", AdminAuthMiddleware,createCloneUser);
router.delete("/clone-users/:id",AdminAuthMiddleware, deleteCloneUser);
router.put("/clone-users/:id",AdminAuthMiddleware, updateCloneUser);
router.post(
  "/clone-users/upload-excel",
  AdminAuthMiddleware,
  upload.single("file"),
  uploadOrderExcel
);


router.post("/manual/create",
  AdminAuthMiddleware, 
  async (req, res, next) => {
    try {
      const { buyPrice, sellPrice, buyTime, sellTime } = req.body;

      // helper to check "empty"
      const isEmpty = (v) =>
        v === undefined || v === null || v === "";

      const allFourEmpty =
        isEmpty(buyPrice) &&
        isEmpty(sellPrice) &&
        isEmpty(buyTime) &&
        isEmpty(sellTime);

      if (allFourEmpty) {
        // ✅ All 4 empty → use broker price controller
        return createManualOrderWithBrokerPrice(req, res, next);
      } else {
        // ✅ At least one present → use normal manual order controller
        return createManualOrder(req, res, next);
      }
    } catch (err) {
      return res.json({
      status: false,
      statusCode:500,
      message: err.message || "Internal Server Error",
    });
    }
  }
);


router.post("/manualinstrument/create/order",
  AdminAuthMiddleware, 
 createManualOrderWithInstrument
);

// router.post("/manualinstrument/createsell/order",
//   AdminAuthMiddleware, 
//  createSellManualOrderWithInstrument
// );


router.post("/manualinstrument/createsell/order",
  AdminAuthMiddleware, 
 createSellManualOrderWithInstrumentNew
);


//  clone user routes and not change authMiddleware
router.get('/getuserclonetrade/todayorderdata',authMiddleware,getDeshboardOrdersUpdate)
router.get("/getuserclone/fund",authMiddleware,getCloneUserFund);
router.get("/getuserclonetrade", authMiddleware,getCloneUserTrade);


router.get("/chartadmin", authMiddleware,fetchGooglFromSerpApi);

router.get("/getuserclonedematlogin",AdminAuthMiddleware, loginCloneUserDemat);



router.get("/get/recent/order",AdminAuthMiddleware, adminGetRecentOrder);


// Holding Data in AngelOne
router.get('/get/holdingdata',AdminAuthMiddleware, adminGetCloneUserHolding)
router.get('/getall/holdingdata',AdminAuthMiddleware,syncHoldingsAllBrokers, AdminGetHoldingMultiple)

//  postgre 
router.get('/userpostionshow',AdminAuthMiddleware, adminFetchUserPositionData)

// mongodb 
router.get('/mongodb/userpostionshow',AdminAuthMiddleware, adminFetchUserPositionDataMongodb)

router.get('/fetch/borker/order',AdminAuthMiddleware,adminFetchOrderHolding)



router.get('/login/users',AdminLoginMultipleUser)
router.get('/store/session',storeTokens)
router.get('/get/session',getTokens)
router.post('/search/order',adminSearchOrders);



// 🔍 Check cache remaining time
// /admin/cache/merged/ttl?type=new
// /admin/cache/merged/ttl?type=angelone
router.get("/cache/merged/ttl", getMergedInstrumentsCacheTTL);

// 🧹 Clear cache
// /admin/cache/merged/clear?type=new
// /admin/cache/merged/clear?type=angelone
router.get("/cache/merged/clear", clearMergedInstrumentsCache);


router.post('/testing/app',testingInstrument)

//=================== webhook for all borker==================

// POST /api/webhook/kite/trade
router.post("/webhook/kite/trade", kiteTradeWebhookController);

// POST /api/webhook/angel/trade
router.post("/webhook/angelone/trade", angelTradeWebhookController);



router.post("/riskconfig", createRiskConfig);
router.get("/riskconfig", getAllRiskConfig);
router.get("/riskconfig/:id", getOneRiskConfig);
router.put("/riskconfig/:id", updateRiskConfig);
router.delete("/riskconfig/:id", deleteRiskConfig);


// Get all users with risk settings
router.get('/risk-management/users-risk', getAllUsersRisk);

// Get single user risk settings
router.get('/risk-management/users-risk/:id', getUserRiskById);

// Update single user risk settings
router.put('/risk-management/users-risk/:id', updateUserRisk);

// Bulk update risk settings
router.post('/risk-management/users-risk/bulk-update', bulkUpdateUserRisk);


router.get('/githubsetting', getAllGithubSettings);
router.get('/githubsetting/:id', getGithubSettingById);
router.post('/githubsetting', createGithubSetting);
router.put('/githubsetting/:id', updateGithubSetting);
router.delete('/githubsetting/:id', deleteGithubSetting);



router.get("/testrisk", (req, res) => {


  const io = getIO();

  const roomName = `risk_management`;

  io.to(roomName).emit("risk_alert", {
    type: "TEST_RISK",
    userId: '123',
    username: "Test User",
    totalPnL: -35000,
    maxLoss: 30000,
    message: "🚨 TEST: Max loss triggered!",
    ts: Date.now(),
  });

  return res.json({
    status: true,
    message: "Test risk event emitted"
  });
});


export default router;