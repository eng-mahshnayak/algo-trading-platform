import express from 'express';

import { callbackFyers, FyersAppCredential, FyersAppCredentialGet, fyersFunds, fyersLogin, fyersProfile, getFyersInstruments, getTradeDataForFyersDashboard, updateFyersToken } from '../controllers/fyersController.js';
import { getDeshboardOrdersUpdate, getTradeDataForCommonDeshboardUpdate } from '../controllers/angelController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';



const router = express.Router();

router.get('/fyers/login', authMiddleware,fyersLogin);
router.get('/fyers/callback', callbackFyers);
router.get('/fyers/appcredential/get', authMiddleware,FyersAppCredentialGet);
router.post('/fyers/appcredential/create', authMiddleware,FyersAppCredential);


router.post('/fyers/updatefyerstoken', updateFyersToken);

router.get('/fyers/profile', fyersProfile);


// deshbaord
router.get('/fyers/deshbaord/todayorderdata',authMiddleware,getDeshboardOrdersUpdate)
router.get('/fyers/deshbaord/todaytrade',authMiddleware, getTradeDataForCommonDeshboardUpdate);
router.get('/fyers/fund',authMiddleware, fyersFunds);


router.get('/fyers/instrument', getFyersInstruments);


export default router;