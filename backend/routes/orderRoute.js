import express from 'express';

import { getOrderWithDate, getOrderInTables, getTradeWithDate, userGetTradeInTables, searchOrders, getRejectsOrdersTable} from '../controllers/placeOrderController.js';
import { authMiddleware} from '../middleware/authMiddleware.js';
import { getTradeBookInTable } from '../controllers/tradeController.js';
import {   getKiteTradesDataUserPosition } from '../controllers/kiteController.js';
import { getCloneUserHolding, getCloneUserTradeDataUserPostion } from '../controllers/admin/cloneUserController.js';
import {  getAngelOneTradeDataUserPostion, getCommonUserHolding } from '../controllers/angelController.js';

import { getFyersUserHolding } from '../controllers/fyersController.js';
import { getUpstoxUserHolding } from '../controllers/upStockController.js';
import { syncMyHoldings } from '../services/baseBrokerHoldings.js';
import { getFinvasiaTradesDataUserPosition } from '../controllers/shoonyaController.js';
import { getGrowwTradesDataUserPosition } from '../controllers/growwController.js';


const router = express.Router();

//  update routes
// router.get('/get/table/order',authMiddleware,getOrderInTables); 
router.get('/get/table/order',authMiddleware,getOrderInTables); 



router.post('/datefilter/order',authMiddleware,getOrderWithDate)
router.get('/search',authMiddleware,searchOrders); 
router.get('/get/tabletradebook',authMiddleware,userGetTradeInTables)

 
router.post('/datefilter/trade',getTradeWithDate)



router.get('/get/table/tradebook',authMiddleware,getTradeBookInTable)



router.get('/userposition/common/todaytrade',authMiddleware,
  async (req, res,next) => {
    try {

        const { role, borker:brokername } = req;

        if (role === "user" && brokername === "kite") {

        return getKiteTradesDataUserPosition(req, res,next);
        
        }else if(role === "user" && brokername === "angelone") {

          return getAngelOneTradeDataUserPostion(req, res,next)

        }else if(role === "user" && brokername === "finvasia") {
         return getFinvasiaTradesDataUserPosition(req,res,next)

        }else if(role === "user" && brokername === "fyers") {
          
        }else if(role === "user" && brokername === "upstox") {
          
        }else if(role === "user" && brokername === "groww") {
            return getGrowwTradesDataUserPosition(req, res,next)
          
        }
        
        else {
        
          return getCloneUserTradeDataUserPostion(req,res,next)
        
        }

    } catch (error) {
    
      return res.status(500).json({ status: false, message: "Server error" });
    }
  }

)

router.get('/user/common/holding',authMiddleware,syncMyHoldings,
async (req, res,next) => {
    try {

      const { role, borker:brokername } = req;

        if (role === "user" && brokername === "kite") {

        return getCommonUserHolding(req, res,next);
        
        }else if(role === "user" && brokername === "angelone") {

          return getCommonUserHolding(req,res,next)

        
        }else  if(role === "user" && brokername === "finvasia"){

          return getCommonUserHolding(req,res,next)
        
        }else  if(role === "user" && brokername === "fyers"){
        
          return getFyersUserHolding(req,res,next)
          

        }else  if(role === "user" && brokername === "upstox"){
        
          return getUpstoxUserHolding(req,res,next)
          
        }
        else {
          return  getCloneUserHolding(req,res,next)
        }
    } catch (error) {
      
      return res.status(500).json({ status: false, message: "Server error" });
    }
}

)



//  new routes
router.post('/get/tablerejects/order',authMiddleware,getRejectsOrdersTable); 

export default router;