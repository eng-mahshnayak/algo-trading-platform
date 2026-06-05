import axios from 'axios';
import Order from '../models/orderModel.js';

















import { setTokensInSession, getManyTokensFromSession } from "../utils/sessionUtils.js";

export const storeTokens = (req, res) => {

  const userTokens = [
    { id: 1, token: "abc" },
    { id: 2, token: "xyz" },
  ];

  setTokensInSession(req, userTokens);
  
  res.json({ message: "Tokens stored successfully", data: userTokens });

};

export const getTokens = async(req, res) => {

  const userIds = [];

  const tokens = await getManyTokensFromSession(req, userIds);

  res.json({ message: "Fetched tokens from session", tokens });

};



export const dummyOrderData = async (req, res,next) => {
    try {

     let obj = {
  "status": true,
  "statusCode": 200,
  "data": [
    {
      "variety": "NORMAL",
      "ordertype": "MARKET",
      "producttype": "INTRADAY",
      "duration": "EOS",
      "price": 383.1,
      "triggerprice": 0,
      "quantity": "20",
      "disclosedquantity": "0",
      "squareoff": 0,
      "stoploss": 0,
      "trailingstoploss": 0,
      "tradingsymbol": "SENSEX25N0684700CE",
      "transactiontype": "BUY",
      "exchange": "BFO",
      "symboltoken": "889009",
      "ordertag": "",
      "instrumenttype": "OPTIDX",
      "strikeprice": 84700,
      "optiontype": "CE",
      "expirydate": "06NOV2025",
      "lotsize": "20",
      "cancelsize": "0",
      "averageprice": 374.25,
      "filledshares": "20",
      "unfilledshares": "0",
      "orderid": "251031000042117",
      "text": "",
      "status": "complete",
      "orderstatus": "complete",
      "updatetime": "31-Oct-2025 09:20:28",
      "exchtime": "31-Oct-2025 09:20:28",
      "exchorderupdatetime": "31-Oct-2025 09:20:28",
      "fillid": "",
      "filltime": "",
      "parentorderid": "",
      "uniqueorderid": "AAAD833605_3e540a47-705a-4c70-9169-929b84731436",
      "exchangeorderid": "1761882300005569068"
    },
    {
      "variety": "NORMAL",
      "ordertype": "MARKET",
      "producttype": "INTRADAY",
      "duration": "EOS",
      "price": 336.9,
      "triggerprice": 0,
      "quantity": "20",
      "disclosedquantity": "0",
      "squareoff": 0,
      "stoploss": 0,
      "trailingstoploss": 0,
      "tradingsymbol": "SENSEX25N0684700CE",
      "transactiontype": "SELL",
      "exchange": "BFO",
      "symboltoken": "889009",
      "ordertag": "",
      "instrumenttype": "OPTIDX",
      "strikeprice": 84700,
      "optiontype": "CE",
      "expirydate": "06NOV2025",
      "lotsize": "20",
      "cancelsize": "0",
      "averageprice": 345.55,
      "filledshares": "20",
      "unfilledshares": "0",
      "orderid": "251031000047021",
      "text": "",
      "status": "complete",
      "orderstatus": "complete",
      "updatetime": "31-Oct-2025 09:21:06",
      "exchtime": "31-Oct-2025 09:21:06",
      "exchorderupdatetime": "31-Oct-2025 09:21:06",
      "fillid": "",
      "filltime": "",
      "parentorderid": "",
      "uniqueorderid": "AAAD833605_d861f618-0c01-4b96-91cd-6a21b3a26648",
      "exchangeorderid": "1761882300005759848"
    },
    {
      "variety": "NORMAL",
      "ordertype": "LIMIT",
      "producttype": "INTRADAY",
      "duration": "DAY",
      "price": 34,
      "triggerprice": 0,
      "quantity": "400",
      "disclosedquantity": "0",
      "squareoff": 0,
      "stoploss": 0,
      "trailingstoploss": 0,
      "tradingsymbol": "UNITDSPR25NOV251480CE",
      "transactiontype": "BUY",
      "exchange": "NFO",
      "symboltoken": "126980",
      "ordertag": "",
      "instrumenttype": "OPTSTK",
      "strikeprice": 1480,
      "optiontype": "CE",
      "expirydate": "25NOV2025",
      "lotsize": "400",
      "cancelsize": "400",
      "averageprice": 0,
      "filledshares": "0",
      "unfilledshares": "400",
      "orderid": "251031000060940",
      "text": "",
      "status": "cancelled",
      "orderstatus": "cancelled",
      "updatetime": "31-Oct-2025 09:25:26",
      "exchtime": "31-Oct-2025 09:24:54",
      "exchorderupdatetime": "31-Oct-2025 09:25:26",
      "fillid": "",
      "filltime": "",
      "parentorderid": "",
      "uniqueorderid": "AAAD833605_16e2aabb-b135-4ad9-9cae-ee5abc06dfa9",
      "exchangeorderid": "2600000008389520"
    },
    {
      "variety": "NORMAL",
      "ordertype": "LIMIT",
      "producttype": "INTRADAY",
      "duration": "EOS",
      "price": 450,
      "triggerprice": 0,
      "quantity": "20",
      "disclosedquantity": "0",
      "squareoff": 0,
      "stoploss": 0,
      "trailingstoploss": 0,
      "tradingsymbol": "SENSEX25N0684800CE",
      "transactiontype": "BUY",
      "exchange": "BFO",
      "symboltoken": "888770",
      "ordertag": "",
      "instrumenttype": "OPTIDX",
      "strikeprice": 84800,
      "optiontype": "CE",
      "expirydate": "06NOV2025",
      "lotsize": "20",
      "cancelsize": "20",
      "averageprice": 0,
      "filledshares": "0",
      "unfilledshares": "20",
      "orderid": "251031000109592",
      "text": "",
      "status": "cancelled",
      "orderstatus": "cancelled",
      "updatetime": "31-Oct-2025 09:36:00",
      "exchtime": "31-Oct-2025 09:35:41",
      "exchorderupdatetime": "31-Oct-2025 09:36:00",
      "fillid": "",
      "filltime": "",
      "parentorderid": "",
      "uniqueorderid": "AAAD833605_bb9a624c-9957-40fa-938f-8182d03b1459",
      "exchangeorderid": "1761883333755659772"
    },
    {
      "variety": "NORMAL",
      "ordertype": "LIMIT",
      "producttype": "INTRADAY",
      "duration": "DAY",
      "price": 69.55,
      "triggerprice": 0,
      "quantity": "175",
      "disclosedquantity": "0",
      "squareoff": 0,
      "stoploss": 0,
      "trailingstoploss": 0,
      "tradingsymbol": "EICHERMOT25NOV257400CE",
      "transactiontype": "BUY",
      "exchange": "NFO",
      "symboltoken": "80770",
      "ordertag": "",
      "instrumenttype": "OPTSTK",
      "strikeprice": 7400,
      "optiontype": "CE",
      "expirydate": "25NOV2025",
      "lotsize": "175",
      "cancelsize": "0",
      "averageprice": 69.55,
      "filledshares": "175",
      "unfilledshares": "0",
      "orderid": "251031000152014",
      "text": "",
      "status": "complete",
      "orderstatus": "complete",
      "updatetime": "31-Oct-2025 09:50:14",
      "exchtime": "31-Oct-2025 09:50:04",
      "exchorderupdatetime": "31-Oct-2025 09:50:14",
      "fillid": "",
      "filltime": "",
      "parentorderid": "",
      "uniqueorderid": "AAAD833605_83c91df1-e6ef-4772-8e95-f974faccb0f0",
      "exchangeorderid": "2400000027669013"
    },
    {
      "variety": "NORMAL",
      "ordertype": "LIMIT",
      "producttype": "INTRADAY",
      "duration": "DAY",
      "price": 68,
      "triggerprice": 0,
      "quantity": "175",
      "disclosedquantity": "0",
      "squareoff": 0,
      "stoploss": 0,
      "trailingstoploss": 0,
      "tradingsymbol": "EICHERMOT25NOV257400CE",
      "transactiontype": "SELL",
      "exchange": "NFO",
      "symboltoken": "80770",
      "ordertag": "",
      "instrumenttype": "OPTSTK",
      "strikeprice": 7400,
      "optiontype": "CE",
      "expirydate": "25NOV2025",
      "lotsize": "175",
      "cancelsize": "0",
      "averageprice": 70.1,
      "filledshares": "175",
      "unfilledshares": "0",
      "orderid": "251031000154288",
      "text": "",
      "status": "complete",
      "orderstatus": "complete",
      "updatetime": "31-Oct-2025 09:50:58",
      "exchtime": "31-Oct-2025 09:50:58",
      "exchorderupdatetime": "31-Oct-2025 09:50:58",
      "fillid": "",
      "filltime": "",
      "parentorderid": "",
      "uniqueorderid": "AAAD833605_6997d705-a6f1-47ff-b06b-80c4a5a02e69",
      "exchangeorderid": "2400000028191028"
    },
    {
      "variety": "NORMAL",
      "ordertype": "LIMIT",
      "producttype": "INTRADAY",
      "duration": "DAY",
      "price": 84,
      "triggerprice": 0,
      "quantity": "150",
      "disclosedquantity": "0",
      "squareoff": 0,
      "stoploss": 0,
      "trailingstoploss": 0,
      "tradingsymbol": "HAL25NOV254850CE",
      "transactiontype": "BUY",
      "exchange": "NFO",
      "symboltoken": "104704",
      "ordertag": "",
      "instrumenttype": "OPTSTK",
      "strikeprice": 4850,
      "optiontype": "CE",
      "expirydate": "25NOV2025",
      "lotsize": "150",
      "cancelsize": "150",
      "averageprice": 0,
      "filledshares": "0",
      "unfilledshares": "150",
      "orderid": "251031000167938",
      "text": "",
      "status": "cancelled",
      "orderstatus": "cancelled",
      "updatetime": "31-Oct-2025 09:57:30",
      "exchtime": "31-Oct-2025 09:57:19",
      "exchorderupdatetime": "31-Oct-2025 09:57:30",
      "fillid": "",
      "filltime": "",
      "parentorderid": "",
      "uniqueorderid": "AAAD833605_fb80e8c6-9eb2-4f6b-8feb-30800d7d0f76",
      "exchangeorderid": "2200000027404941"
    },
    {
      "variety": "NORMAL",
      "ordertype": "LIMIT",
      "producttype": "INTRADAY",
      "duration": "DAY",
      "price": 84,
      "triggerprice": 0,
      "quantity": "150",
      "disclosedquantity": "0",
      "squareoff": 0,
      "stoploss": 0,
      "trailingstoploss": 0,
      "tradingsymbol": "HAL25NOV254850CE",
      "transactiontype": "BUY",
      "exchange": "NFO",
      "symboltoken": "104704",
      "ordertag": "",
      "instrumenttype": "OPTSTK",
      "strikeprice": 4850,
      "optiontype": "CE",
      "expirydate": "25NOV2025",
      "lotsize": "150",
      "cancelsize": "0",
      "averageprice": 84,
      "filledshares": "150",
      "unfilledshares": "0",
      "orderid": "251031000168552",
      "text": "",
      "status": "complete",
      "orderstatus": "complete",
      "updatetime": "31-Oct-2025 09:57:47",
      "exchtime": "31-Oct-2025 09:57:42",
      "exchorderupdatetime": "31-Oct-2025 09:57:47",
      "fillid": "",
      "filltime": "",
      "parentorderid": "",
      "uniqueorderid": "AAAD833605_fa5297cb-fa51-4741-ae42-616bfe82d3a9",
      "exchangeorderid": "2200000027651424"
    },
    {
      "variety": "NORMAL",
      "ordertype": "LIMIT",
      "producttype": "INTRADAY",
      "duration": "DAY",
      "price": 88,
      "triggerprice": 0,
      "quantity": "150",
      "disclosedquantity": "0",
      "squareoff": 0,
      "stoploss": 0,
      "trailingstoploss": 0,
      "tradingsymbol": "HAL25NOV254850CE",
      "transactiontype": "SELL",
      "exchange": "NFO",
      "symboltoken": "104704",
      "ordertag": "",
      "instrumenttype": "OPTSTK",
      "strikeprice": 4850,
      "optiontype": "CE",
      "expirydate": "25NOV2025",
      "lotsize": "150",
      "cancelsize": "150",
      "averageprice": 0,
      "filledshares": "0",
      "unfilledshares": "150",
      "orderid": "251031000169204",
      "text": "",
      "status": "cancelled",
      "orderstatus": "cancelled",
      "updatetime": "31-Oct-2025 09:59:17",
      "exchtime": "31-Oct-2025 09:58:05",
      "exchorderupdatetime": "31-Oct-2025 09:59:17",
      "fillid": "",
      "filltime": "",
      "parentorderid": "",
      "uniqueorderid": "AAAD833605_e85ab3d6-e4cd-41e8-8ed9-a66fe380d33d",
      "exchangeorderid": "2200000027888610"
    },
    {
      "variety": "NORMAL",
      "ordertype": "LIMIT",
      "producttype": "INTRADAY",
      "duration": "DAY",
      "price": 87,
      "triggerprice": 0,
      "quantity": "150",
      "disclosedquantity": "0",
      "squareoff": 0,
      "stoploss": 0,
      "trailingstoploss": 0,
      "tradingsymbol": "HAL25NOV254850CE",
      "transactiontype": "SELL",
      "exchange": "NFO",
      "symboltoken": "104704",
      "ordertag": "",
      "instrumenttype": "OPTSTK",
      "strikeprice": 4850,
      "optiontype": "CE",
      "expirydate": "25NOV2025",
      "lotsize": "150",
      "cancelsize": "150",
      "averageprice": 0,
      "filledshares": "0",
      "unfilledshares": "150",
      "orderid": "251031000171566",
      "text": "",
      "status": "cancelled",
      "orderstatus": "cancelled",
      "updatetime": "31-Oct-2025 10:02:42",
      "exchtime": "31-Oct-2025 09:59:17",
      "exchorderupdatetime": "31-Oct-2025 10:02:42",
      "fillid": "",
      "filltime": "",
      "parentorderid": "",
      "uniqueorderid": "AAAD833605_2ee14068-10de-49ab-8060-d776c2969420",
      "exchangeorderid": "2200000028581378"
    },
    {
      "variety": "NORMAL",
      "ordertype": "LIMIT",
      "producttype": "INTRADAY",
      "duration": "DAY",
      "price": 84,
      "triggerprice": 0,
      "quantity": "150",
      "disclosedquantity": "0",
      "squareoff": 0,
      "stoploss": 0,
      "trailingstoploss": 0,
      "tradingsymbol": "HAL25NOV254850CE",
      "transactiontype": "SELL",
      "exchange": "NFO",
      "symboltoken": "104704",
      "ordertag": "",
      "instrumenttype": "OPTSTK",
      "strikeprice": 4850,
      "optiontype": "CE",
      "expirydate": "25NOV2025",
      "lotsize": "150",
      "cancelsize": "150",
      "averageprice": 0,
      "filledshares": "0",
      "unfilledshares": "150",
      "orderid": "251031000183699",
      "text": "",
      "status": "cancelled",
      "orderstatus": "cancelled",
      "updatetime": "31-Oct-2025 10:03:34",
      "exchtime": "31-Oct-2025 10:02:43",
      "exchorderupdatetime": "31-Oct-2025 10:03:34",
      "fillid": "",
      "filltime": "",
      "parentorderid": "",
      "uniqueorderid": "AAAD833605_1137f9fd-be68-47e3-afbd-22894c00e880",
      "exchangeorderid": "2200000030627454"
    },
    {
      "variety": "NORMAL",
      "ordertype": "LIMIT",
      "producttype": "INTRADAY",
      "duration": "DAY",
      "price": 83,
      "triggerprice": 0,
      "quantity": "150",
      "disclosedquantity": "0",
      "squareoff": 0,
      "stoploss": 0,
      "trailingstoploss": 0,
      "tradingsymbol": "HAL25NOV254850CE",
      "transactiontype": "SELL",
      "exchange": "NFO",
      "symboltoken": "104704",
      "ordertag": "",
      "instrumenttype": "OPTSTK",
      "strikeprice": 4850,
      "optiontype": "CE",
      "expirydate": "25NOV2025",
      "lotsize": "150",
      "cancelsize": "150",
      "averageprice": 0,
      "filledshares": "0",
      "unfilledshares": "150",
      "orderid": "251031000189184",
      "text": "",
      "status": "cancelled",
      "orderstatus": "cancelled",
      "updatetime": "31-Oct-2025 10:04:56",
      "exchtime": "31-Oct-2025 10:04:45",
      "exchorderupdatetime": "31-Oct-2025 10:04:56",
      "fillid": "",
      "filltime": "",
      "parentorderid": "",
      "uniqueorderid": "AAAD833605_9c3418de-f4dd-4bd6-bc35-4025bcfa22b8",
      "exchangeorderid": "2200000031761317"
    },
    {
      "variety": "NORMAL",
      "ordertype": "LIMIT",
      "producttype": "INTRADAY",
      "duration": "DAY",
      "price": 86,
      "triggerprice": 0,
      "quantity": "150",
      "disclosedquantity": "0",
      "squareoff": 0,
      "stoploss": 0,
      "trailingstoploss": 0,
      "tradingsymbol": "HAL25NOV254850CE",
      "transactiontype": "SELL",
      "exchange": "NFO",
      "symboltoken": "104704",
      "ordertag": "",
      "instrumenttype": "OPTSTK",
      "strikeprice": 4850,
      "optiontype": "CE",
      "expirydate": "25NOV2025",
      "lotsize": "150",
      "cancelsize": "150",
      "averageprice": 0,
      "filledshares": "0",
      "unfilledshares": "150",
      "orderid": "251031000189842",
      "text": "",
      "status": "cancelled",
      "orderstatus": "cancelled",
      "updatetime": "31-Oct-2025 10:06:38",
      "exchtime": "31-Oct-2025 10:06:04",
      "exchorderupdatetime": "31-Oct-2025 10:06:38",
      "fillid": "",
      "filltime": "",
      "parentorderid": "",
      "uniqueorderid": "AAAD833605_b47a42ba-2a4b-41e9-b577-13814b5d35be",
      "exchangeorderid": "2200000031865485"
    },
    {
      "variety": "NORMAL",
      "ordertype": "LIMIT",
      "producttype": "INTRADAY",
      "duration": "DAY",
      "price": 81,
      "triggerprice": 0,
      "quantity": "150",
      "disclosedquantity": "0",
      "squareoff": 0,
      "stoploss": 0,
      "trailingstoploss": 0,
      "tradingsymbol": "HAL25NOV254850CE",
      "transactiontype": "SELL",
      "exchange": "NFO",
      "symboltoken": "104704",
      "ordertag": "",
      "instrumenttype": "OPTSTK",
      "strikeprice": 4850,
      "optiontype": "CE",
      "expirydate": "25NOV2025",
      "lotsize": "150",
      "cancelsize": "0",
      "averageprice": 81,
      "filledshares": "150",
      "unfilledshares": "0",
      "orderid": "251031000195692",
      "text": "",
      "status": "complete",
      "orderstatus": "complete",
      "updatetime": "31-Oct-2025 10:07:18",
      "exchtime": "31-Oct-2025 10:07:13",
      "exchorderupdatetime": "31-Oct-2025 10:07:18",
      "fillid": "",
      "filltime": "",
      "parentorderid": "",
      "uniqueorderid": "AAAD833605_3aaf8959-89a5-42a5-8fe6-d4bbd0aab5b1",
      "exchangeorderid": "2200000032866021"
    },
    {
      "variety": "NORMAL",
      "ordertype": "LIMIT",
      "producttype": "INTRADAY",
      "duration": "DAY",
      "price": 168.8,
      "triggerprice": 0,
      "quantity": "75",
      "disclosedquantity": "0",
      "squareoff": 0,
      "stoploss": 0,
      "trailingstoploss": 0,
      "tradingsymbol": "NIFTY04NOV2525800CE",
      "transactiontype": "BUY",
      "exchange": "NFO",
      "symboltoken": "47670",
      "ordertag": "",
      "instrumenttype": "OPTIDX",
      "strikeprice": 25800,
      "optiontype": "CE",
      "expirydate": "04NOV2025",
      "lotsize": "75",
      "cancelsize": "0",
      "averageprice": 167,
      "filledshares": "75",
      "unfilledshares": "0",
      "orderid": "251031000233227",
      "text": "",
      "status": "complete",
      "orderstatus": "complete",
      "updatetime": "31-Oct-2025 10:20:52",
      "exchtime": "31-Oct-2025 10:20:52",
      "exchorderupdatetime": "31-Oct-2025 10:20:52",
      "fillid": "",
      "filltime": "",
      "parentorderid": "",
      "uniqueorderid": "AAAD833605_08096040-ab29-4b94-a62c-7c221525885c",
      "exchangeorderid": "1500000052194376"
    },
    {
      "variety": "NORMAL",
      "ordertype": "MARKET",
      "producttype": "INTRADAY",
      "duration": "DAY",
      "price": 129.75,
      "triggerprice": 0,
      "quantity": "75",
      "disclosedquantity": "0",
      "squareoff": 0,
      "stoploss": 0,
      "trailingstoploss": 0,
      "tradingsymbol": "NIFTY04NOV2525800CE",
      "transactiontype": "SELL",
      "exchange": "NFO",
      "symboltoken": "47670",
      "ordertag": "",
      "instrumenttype": "OPTIDX",
      "strikeprice": 25800,
      "optiontype": "CE",
      "expirydate": "04NOV2025",
      "lotsize": "75",
      "cancelsize": "0",
      "averageprice": 132.55,
      "filledshares": "75",
      "unfilledshares": "0",
      "orderid": "251031000280530",
      "text": "",
      "status": "complete",
      "orderstatus": "complete",
      "updatetime": "31-Oct-2025 10:38:51",
      "exchtime": "31-Oct-2025 10:38:51",
      "exchorderupdatetime": "31-Oct-2025 10:38:51",
      "fillid": "",
      "filltime": "",
      "parentorderid": "",
      "uniqueorderid": "999ee463-cbc5-40b4-99e7-a0408b9883eb",
      "exchangeorderid": "1500000065872884"
    },
    {
      "variety": "NORMAL",
      "ordertype": "MARKET",
      "producttype": "INTRADAY",
      "duration": "DAY",
      "price": 140.15,
      "triggerprice": 0,
      "quantity": "75",
      "disclosedquantity": "0",
      "squareoff": 0,
      "stoploss": 0,
      "trailingstoploss": 0,
      "tradingsymbol": "NIFTY04NOV2525800CE",
      "transactiontype": "BUY",
      "exchange": "NFO",
      "symboltoken": "47670",
      "ordertag": "",
      "instrumenttype": "OPTIDX",
      "strikeprice": 25800,
      "optiontype": "CE",
      "expirydate": "04NOV2025",
      "lotsize": "75",
      "cancelsize": "0",
      "averageprice": 136.25,
      "filledshares": "75",
      "unfilledshares": "0",
      "orderid": "251031000286625",
      "text": "",
      "status": "complete",
      "orderstatus": "complete",
      "updatetime": "31-Oct-2025 10:42:22",
      "exchtime": "31-Oct-2025 10:42:22",
      "exchorderupdatetime": "31-Oct-2025 10:42:22",
      "fillid": "",
      "filltime": "",
      "parentorderid": "",
      "uniqueorderid": "AAAD833605_9ad7f0a6-498b-4003-ab15-38549b0641d5",
      "exchangeorderid": "1500000067793963"
    }
  ],
  "message": "get data"
    }
    
    return res.json({
            status: true,
            statusCode:203,
            message: "getting data",
            data:obj,
            error:null,
        });
 

    } catch (error) {
   
       return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};


export const dummyTradeData = async function (req,res,next) {
  
    const orders = [
  { fillId: 263720,  orderId: '251031000042117', symbol: 'SENSEX25N0684700CE', txnType: 'BUY',  time: '2025-10-31T09:20:28', quantity: 20, price: 374.25 },
    { fillId: 284850,  orderId: '251031000047021', symbol: 'SENSEX25N0684700CE', txnType: 'SELL', time: '2025-10-31T09:21:06', quantity: 20, price: 345.55 },

//   { fillId: 2205537, orderId: '251031000280530', symbol: 'NIFTY04NOV2525800CE', txnType: 'SELL', time: '2025-10-31T09:25:30', quantity: 50, price: 12.40 },
//   { fillId: 169302,  orderId: '251031000168552', symbol: 'HAL25NOV254850CE',   txnType: 'BUY',  time: '2025-10-31T09:21:40', quantity: 25, price: 33.70 },
//   { fillId: 2304823, orderId: '251031000286625', symbol: 'NIFTY04NOV2525800CE', txnType: 'BUY',  time: '2025-10-31T09:26:10', quantity: 75, price: 11.65 },
//   { fillId: 182874,  orderId: '251031000154288', symbol: 'EICHERMOT25NOV257400CE', txnType: 'SELL', time: '2025-10-31T09:22:05', quantity: 30, price: 21.10 },
//   { fillId: 1622835, orderId: '251031000233227', symbol: 'NIFTY04NOV2525800CE', txnType: 'BUY',  time: '2025-10-31T09:24:10', quantity: 25, price: 12.05 },
//   { fillId: 196015,  orderId: '251031000195692', symbol: 'HAL25NOV254850CE',   txnType: 'SELL', time: '2025-10-31T09:23:55', quantity: 25, price: 31.20 },
//   { fillId: 284850,  orderId: '251031000047021', symbol: 'SENSEX25N0684700CE', txnType: 'SELL', time: '2025-10-31T09:21:06', quantity: 20, price: 345.55 },
//   { fillId: 180604,  orderId: '251031000152014', symbol: 'EICHERMOT25NOV257400CE', txnType: 'BUY',  time: '2025-10-31T09:22:50', quantity: 30, price: 20.35 },
];

const toMoney = n => Math.round(n * 100) / 100;

function calculatePnL(orders) {
  const grouped = {};

  // group by symbol
  for (const o of orders) {
    if (!grouped[o.symbol]) grouped[o.symbol] = [];
    grouped[o.symbol].push(o);
  }

  const results = [];

  for (const [symbol, list] of Object.entries(grouped)) {
    const buys = list.filter(o => o.txnType === 'BUY');
    const sells = list.filter(o => o.txnType === 'SELL');

    let totalBuyQty = 0, totalBuyValue = 0;
    buys.forEach(b => { totalBuyQty += b.quantity; totalBuyValue += b.quantity * b.price; });

    let totalSellQty = 0, totalSellValue = 0;
    sells.forEach(s => { totalSellQty += s.quantity; totalSellValue += s.quantity * s.price; });

    if (totalBuyQty > 0 && totalSellQty > 0) {
      const matchedQty = Math.min(totalBuyQty, totalSellQty);
      const buyAvg = totalBuyValue / totalBuyQty;
      const sellAvg = totalSellValue / totalSellQty;
      const pnl = (sellAvg - buyAvg) * matchedQty;

      results.push({
        label:symbol,
        win: toMoney(buyAvg),
        loss: toMoney(sellAvg),
        quantity: matchedQty,
        pnl: toMoney(pnl)
      });
    }
  }

  return results;
}

// ---- Run and print as JSON ----
const pnlData = calculatePnL(orders);
// console.log(JSON.stringify(pnlData, null, 2));


 return res.json({
            status: true,
            statusCode:203,
            message: "getting data",
            data:pnlData,
            error:null,
        });
    
}


export const getOrderDataForDeshboard = async (req, res,next) => {
    try {

       
        console.log('hy req.headers.angelonetoken; 1');

          const angelToken = req.headers.angelonetoken;

            if (!angelToken) {

               console.log('hy req.headers.angelonetoken;');
              
              return res.json({
                      status: false,
                      statusCode:401,
                      message: "Login In AngelOne Account",
                      error: null,
                  });
            }

        var config = {
            method: 'get',
           url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getOrderBook',
            headers: { 
                 'Authorization': `Bearer ${req.headers.angelonetoken}`,
                'Content-Type': 'application/json', 
                'Accept': 'application/json', 
                'X-UserType': 'USER', 
                'X-SourceID': 'WEB', 
                 'X-ClientLocalIP': process.env.CLIENT_LOCAL_IP, 
            'X-ClientPublicIP': process.env.CLIENT_PUBLIC_IP, 
            'X-MACAddress': process.env.MAC_Address, 
            'X-PrivateKey': process.env.PRIVATE_KEY, 
            },
        };

         let response = await axios(config)


           return res.json({
            status: true,
            statusCode:203,
            message: "getting data",
            data:response?.data?.data,
            error:null,
        });
 

    } catch (error) {

       return res.json({
            status: false,
            statusCode:500,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: error.message,
        });
    }
};










