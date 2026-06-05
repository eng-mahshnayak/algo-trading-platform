import express from 'express';
import {  finvasiaAppCredential, getFinvasiaAppCredential, getShoonyaFunds, getShoonyaHoldings, getShoonyaInstrumentsFull, getShoonyaOrders, getShoonyaPositions, getShoonyaTrades, shoonyaGenerateAccessToken, shoonyaLogin, shoonyaLoginWithTotp } from '../controllers/shoonyaController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getDeshboardOrdersUpdate, getTradeDataForCommonDeshboardUpdate } from '../controllers/angelController.js';



const router = express.Router();

// deshboard
router.get('/finvasia/deshbaord/todaytrade',authMiddleware, getTradeDataForCommonDeshboardUpdate);
router.get('/finvasia/fund',authMiddleware, getShoonyaFunds);
router.get('/finvasia/deshbaord/todayorderdata',authMiddleware, getDeshboardOrdersUpdate);




router.post('/finvasia/login', authMiddleware,shoonyaLogin);
router.post('/finavasia/appcredential/create', authMiddleware,finvasiaAppCredential);
router.get('/finavasia/appcredential/get', authMiddleware,getFinvasiaAppCredential);





router.get('/finavasia/logintotp',authMiddleware,shoonyaLoginWithTotp );

// router.get('/finavasia/logintotp',authMiddleware,shoonyaGenerateAccessToken );









router.get('/finvasia/orders', getShoonyaOrders);
router.get('/finvasia/trades', getShoonyaTrades);
router.get('/finvasia/holding', getShoonyaHoldings);
router.get('/finvasia/postions', getShoonyaPositions);




router.post('/finvasia/orders', getShoonyaOrders);
router.post('/finvasia/trades', getShoonyaTrades);


router.get("/finvasia/instruments/full", getShoonyaInstrumentsFull);




export default router;