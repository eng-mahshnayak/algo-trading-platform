import express from 'express';
import {  authMiddleware } from '../middleware/authMiddleware.js';
import { angelGetProfileController, angelOneCallback, cancelOrder, getAngelHistoricalMarketData, getAngelOneLTP, getAngelOneOrder, getAngelOneProfileFund, getAngelTradeBooks, getDeshboardOrdersUpdate, getPerticularTradeBook, getPosition,
   getTradeBook,
   getTradeDataForCommonDeshboardUpdate,
   getTradeDataForDeshboard, loginWithAngelOne, loginWithTOTPInAngelOne, logoutAngelOne,
    reGenerateTokenWithAngelOne } from '../controllers/angelController.js';
import { createAngelOneCredential, getAngelOneCredential } from '../controllers/angelOneCrendential.js';
import {   getMergedInstruments, searchInstrumentPostgre } from '../controllers/instrumentController.js';
import { getOrderPerticular } from '../controllers/placeOrderController.js';
import {   getMergedInstrumentsNew, getMongodbInstrument, searchOptionInstrument } from '../controllers/instrumentMultipleDematController.js';

import compression from "compression";

const heavyCompression = compression({
  level: 6,
  threshold: 1024 * 20,
});



const router = express.Router();

// deshbaord 
router.get('/angelone/deshbaord/todayorderdata',authMiddleware,getDeshboardOrdersUpdate)
router.get('/angelone/deshbaord/tradedata',authMiddleware,getTradeDataForCommonDeshboardUpdate)
router.get('/angelone/user/fund',authMiddleware, getAngelOneProfileFund); 



router.get('/angelone/login/totp',authMiddleware,loginWithTOTPInAngelOne );   // our code 
router.get('/angelone/dummydatatrade',authMiddleware,getTradeDataForDeshboard)


router.post('/agnelone/instrument/ltp',authMiddleware,getAngelOneLTP)
router.get('/agnelone/instrument/search/:id',authMiddleware,searchInstrumentPostgre)



//  AngelOne Credential 
router.post('/angelone/credential/create',authMiddleware,createAngelOneCredential)
router.get('/angelone/credential/get',authMiddleware,getAngelOneCredential)


// AngelOne Login
router.get('/angelone', loginWithAngelOne); 
router.get('/angelone/callback', angelOneCallback);
router.get('/angelone/profile', angelGetProfileController); 


router.post('/regenerate/user/token', authMiddleware,reGenerateTokenWithAngelOne);   // our code 
router.get('/angelone/logout/user',authMiddleware, logoutAngelOne);   // our code 



// not used Routes
router.get('/angelone/position',getPosition)
router.get('/angelone/cancel/order',cancelOrder)
router.get('/angelone/get/order',getAngelOneOrder);
router.get('/angelone/get/trade/book',getTradeBook)
router.get('/perticular/trade/book',getPerticularTradeBook)

router.get('/angeloneorderbyoriderid',getOrderPerticular);


// ===================== Angelone Apis  =====================
router.get('/angelone/online/trade/books',getAngelTradeBooks)




router.get('/agnelone/instrument',getMergedInstruments ) 

// working code 
router.get('/agnelone/instrumentnew',heavyCompression,getMergedInstrumentsNew )

router.get("/searchinstrument", searchOptionInstrument);








// router.get('/agnelone/instrumentnew',getMongodbInstrument )



router.get('/agnelone/bankchart',getAngelHistoricalMarketData )





export default router;