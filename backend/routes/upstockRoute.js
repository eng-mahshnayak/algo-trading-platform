import express from 'express';
import { generateUpstoxAuthUrl, getTradeDataForUpstoxDashboard, getUpstoxFunds, getUpstoxInstruments, upStoxCallback } from '../controllers/upStockController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getDeshboardOrdersUpdate } from '../controllers/angelController.js';




const router = express.Router();

router.get('/upstox/login', generateUpstoxAuthUrl);
router.get('/upstox/callback', upStoxCallback);


// deshbaord
// router.get('/upstox/deshbaord/todayorderdata',authMiddleware,getDeshboardOrdersUpdate)
router.get('/upstox/deshbaord/todayorderdata',getTradeDataForUpstoxDashboard)
router.get('/upstox/dummydatatrade', getTradeDataForUpstoxDashboard);
router.get('/upstox/user/fund', getUpstoxFunds);


router.get('/upstox/instruments', getUpstoxInstruments);



export default router;