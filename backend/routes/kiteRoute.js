import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getKiteAllInstruments,getKiteFunds, kiteCallback, kiteLogin,
    getKiteAllOrders,getKiteProfile,getKiteProfile2,getKiteTradesData,
    kiteAppCredential,
    getKiteTrades,
    getKiteOrders,
    getKiteHolding,
    kiteHoldingFunApi,
    placeKiteOnlineOrder,
    cancellKiteOnlineOrder,
    kiteAppCredentialGet
 } from '../controllers/kiteController.js';
import { getDeshboardOrdersUpdate, getTradeDataForCommonDeshboardUpdate } from '../controllers/angelController.js';





const router = express.Router();

// deshboard
router.get('/kite/deshbaord/todayorderdata',authMiddleware,getDeshboardOrdersUpdate)
router.get('/kite/deshbaord/todaytrade',authMiddleware,getTradeDataForCommonDeshboardUpdate)
router.get('/kite/fund',authMiddleware,getKiteFunds)





router.get('/kite',authMiddleware,kiteLogin); // Get login URL
router.get('/kite/callback', kiteCallback); // Handle callback (no auth needed)


router.post('/kite/appcredential/create',authMiddleware, kiteAppCredential);
router.get("/kite/appcredential/get", authMiddleware, kiteAppCredentialGet);


// router.get('/kite/instrument',authMiddleware,getKiteAllInstruments)
router.get('/kite/instrument',getKiteAllInstruments)


// token required 


router.get('/kite/orders',authMiddleware,getKiteAllOrders)
router.get('/kite/profile',authMiddleware,getKiteProfile)
router.get('/kite/profile2',authMiddleware,getKiteProfile2)
router.get('/kite/trade',authMiddleware,getKiteTradesData)


router.get('/kite/get/holdingdata',authMiddleware,getKiteHolding)



router.get('/kite/online/data',getKiteTrades)
router.get('/kite/placeorderadminonline',placeKiteOnlineOrder)
router.get('/kite/placeorcancelnonline',cancellKiteOnlineOrder)
router.get('/kite/online/data2',getKiteOrders)
router.get('/kite/online/holdingcheck',kiteHoldingFunApi)




export default router;