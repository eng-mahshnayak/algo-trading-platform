
import axios from 'axios';
import dayjs from "dayjs";
import Trade from "../models/tradeModel.js"
import Order from '../models/orderModel.js';
import { Op } from 'sequelize';



let saveData = [
    {
    
    "userId": 19,
    "variety": "NORMAL",
    "ordertype": "MARKET",
    "producttype": "INTRADAY",
    "duration": "DAY",
    "price": 392.8,
    "triggerprice": 0,
    "quantity": "75",
    "disclosedquantity": "0",
    "squareoff": 0,
    "stoploss": 0,
    "trailingstoploss": 0,
    "tradingsymbol": "NIFTY25NOV2525400CE",
    "transactiontype": "BUY",
    "exchange": "NFO",
    "symboltoken": "52839",
    "instrumenttype": "OPTIDX",
    "strikeprice": 25400,
    "optiontype": "CE",
    "expirydate": "25NOV2025",
    "lotsize": "75",
    "cancelsize": "0",
    "averageprice": 0,
    "filledshares": "0",
    "unfilledshares": "75",
    "orderid": "251111000415701",
    "text": null,
    "status": "cancelled",
    "orderstatus": "cancelled",
    "updatetime": "11-Nov-2025 11:56:57",
    "exchtime": null,
    "exchorderupdatetime": null,
    "fillid": "4133501",
    "filltime": "11:56:57",
    "parentorderid": null,
    "ordertag": null,
    "uniqueorderid": "a9e36c91-a5bf-4933-ba5b-349520ed4a15",
    "createdAt": "2025-11-11T06:26:57.487Z",
    "updatedAt": "2025-11-11T06:49:13.273Z",
    "totalPrice": 28747.5,
    "actualQuantity": "75",
    "tradedValue": 28796.25,
    "fillprice": 383.95,
    "fillsize": 75
  },
  {
    "userId": 19,
    "variety": "NORMAL",
    "ordertype": "MARKET",
    "producttype": "INTRADAY",
    "duration": "DAY",
    "price": 414.4,
    "triggerprice": 0,
    "quantity": "75",
    "disclosedquantity": "0",
    "squareoff": 0,
    "stoploss": 0,
    "trailingstoploss": 0,
    "tradingsymbol": "NIFTY25NOV2525400CE",
    "transactiontype": "SELL",
    "exchange": "NFO",
    "symboltoken": "52839",
    "instrumenttype": "OPTIDX",
    "strikeprice": 25400,
    "optiontype": "CE",
    "expirydate": "25NOV2025",
    "lotsize": "75",
    "cancelsize": "0",
    "averageprice": 0,
    "filledshares": "0",
    "unfilledshares": "75",
    "orderid": "251111000584816",
    "text": null,
    "status": "open",
    "orderstatus": null,
    "updatetime": "11-Nov-2025 13:26:38",
    "exchtime": null,
    "exchorderupdatetime": null,
    "fillid": "5450015",
    "filltime": "13:26:38",
    "parentorderid": null,
    "ordertag": null,
    "uniqueorderid": "24f0e431-51c9-4ea3-a4b6-dbab1b64fce9",
    "createdAt": "2025-11-11T07:56:38.247Z",
    "updatedAt": "2025-11-11T07:56:38.445Z",
    "totalPrice": 31875,
    "actualQuantity": "75",
    "tradedValue": 31871.25,
    "fillprice": 424.95,
    "fillsize": 75
  }
  
  ]

  const saveTradeData = async function () {
       try {

         await Order.bulkCreate(saveData, { ignoreDuplicates: true });

        console.log('save trade data');
        
       } catch (error) {

          console.log(error);
          
       }
      
      
       
  } 

  // saveTradeData()












export const getTradeBookInTable = async (req, res) => {
    try {
      
        const from = dayjs(req.body[0]);
        const to = dayjs(req.body[1]);

       
        

     const tradesData = await Order.findAll({
      where: {
        status: { [Op.in]: ['complete', 'completed'] },
        userId:req.userId,
         createdAt: {
      [Op.between]: [from, to],  // 👈 date filter
    },
        
      },
      order: [['createdAt', 'DESC']], // 👈 sorts in descending order (latest first)
      raw: true,
    });
        



      return res.json({
            status: true,
            statusCode:200,
            data:tradesData,
            message:'get data'
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



export const testGetTradeBook = async (req, res) => {
    try {

     let token = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6Ik0xNjI0MjMiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pZc0luTnZkWEpqWlNJNklqTWlMQ0prWlhacFkyVmZhV1FpT2lJeFpUTmtOMlk1WVMwME5EVmlMVE5rWXpVdE9URXhZUzAyTkdWbU9UWTROakExWW1RaUxDSnJhV1FpT2lKMGNtRmtaVjlyWlhsZmRqSWlMQ0p2Ylc1bGJXRnVZV2RsY21sa0lqbzJMQ0p3Y205a2RXTjBjeUk2ZXlKa1pXMWhkQ0k2ZXlKemRHRjBkWE1pT2lKaFkzUnBkbVVpZlN3aWJXWWlPbnNpYzNSaGRIVnpJam9pWVdOMGFYWmxJbjE5TENKcGMzTWlPaUowY21Ga1pWOXNiMmRwYmw5elpYSjJhV05sSWl3aWMzVmlJam9pVFRFMk1qUXlNeUlzSW1WNGNDSTZNVGMyTXpRME1qSTNOeXdpYm1KbUlqb3hOell6TXpVMU5qazNMQ0pwWVhRaU9qRTNOak16TlRVMk9UY3NJbXAwYVNJNklqZzBaVE0yWW1VMkxUWTBNamN0TkdJNU5TMDVPR013TFRSbE1HRTFNRGd6T1RFMk1DSXNJbFJ2YTJWdUlqb2lJbjAuTlg4emVUMUgzRFMyWng3ZHB2S0lLV0xkMEdZc1V4ZXFqTzByOWl4a0U2OEtZZEtOdXFJWTFta1N5NUJXeGY4bnF2ZXVVQnc2blM1cF9kRWlpaGtGS1ZDTlE5VUZPbWJQV2ZMa3JoaXY5YnpXNE9IbVZyY3drRmRUYTNrbmtXVTJjQS0yRXR3bFc0dlhYYV8tS1o0T0EwU09rRFpOeTJINDlHZnhSY19Kdlk0IiwiQVBJLUtFWSI6InlKYnJubmt4IiwiWC1PTEQtQVBJLUtFWSI6dHJ1ZSwiaWF0IjoxNzYzMzU1ODc3LCJleHAiOjE3NjM0MDQyMDB9.oykRs9YIE0c8mtts4kDQDYQz-63NJgQUS1Tu0ANsCiu3dsZMjd64mTsBVa1rXvtHplaSx1ms9YE3JnsZG8D50A'
    
    var config = {
        method: 'get',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook',
        headers: { 
            'Authorization': `Bearer ${token}`,
            //  'Authorization': `Bearer ${token}`,
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

        const {data} = await axios(config);

         if(data.status==true) {

            return res.json({
            status: true,
            statusCode:200,
            data: data.data,
            message:'get data'
        });

         }else{

        return res.json({
            status: false,
            statusCode:data.errorcode,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: data.message,
        });
    }
        
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


export const testGetOrder = async (req, res,next) => {
    try {

    let token = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6Ik0xNjI0MjMiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pZc0luTnZkWEpqWlNJNklqTWlMQ0prWlhacFkyVmZhV1FpT2lJeFpUTmtOMlk1WVMwME5EVmlMVE5rWXpVdE9URXhZUzAyTkdWbU9UWTROakExWW1RaUxDSnJhV1FpT2lKMGNtRmtaVjlyWlhsZmRqSWlMQ0p2Ylc1bGJXRnVZV2RsY21sa0lqbzJMQ0p3Y205a2RXTjBjeUk2ZXlKa1pXMWhkQ0k2ZXlKemRHRjBkWE1pT2lKaFkzUnBkbVVpZlN3aWJXWWlPbnNpYzNSaGRIVnpJam9pWVdOMGFYWmxJbjE5TENKcGMzTWlPaUowY21Ga1pWOXNiMmRwYmw5elpYSjJhV05sSWl3aWMzVmlJam9pVFRFMk1qUXlNeUlzSW1WNGNDSTZNVGMyTXpVeU5UVTVOaXdpYm1KbUlqb3hOell6TkRNNU1ERTJMQ0pwWVhRaU9qRTNOak0wTXprd01UWXNJbXAwYVNJNkltRTNNbVF4WVRZd0xUWmxaVEF0TkRFNU9TMWlaR0kzTFdVd1pHWXlNMk0wTXpGalpDSXNJbFJ2YTJWdUlqb2lJbjAuUmFSZ2cyNk9hQ1oyZ2pMRmk3a2hLZlRXQTYtbkQ5QWVKN3R3QVdSeWdaaVFfMVFKZnd6NmRmOUJTZUhNeHZBczNKM1VCUTZFYXdJRHRMQXU4MmpjbHVFaW5CdFI5U0psQlczdk1MUTlaWmcwTGE2Z1dyTHZKOUF6Skh1RlVsbjlYNWJBR3BOY1dXSnRtWEFLakIydDYzSWE3b05TeEl0cllXUUt3RFgyOVFnIiwiQVBJLUtFWSI6InlKYnJubmt4IiwiWC1PTEQtQVBJLUtFWSI6dHJ1ZSwiaWF0IjoxNzYzNDM5MTk2LCJleHAiOjE3NjM0OTA2MDB9.J5Z9x52-VRyZeNphEwGpPF9esa4_7eE0xg3ssfQUOyLaEp_Vw3YupxBFZIEcDdiTZMJhFG6mupv7ATuJOq-9uA'
    
    var config = {
        method: 'get',
        url: 'https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getPosition',
        headers: { 
           'Authorization': `Bearer ${token}`,
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

        let {data} = await axios(config)

        //  emitOrderGet(data.data)

        if(data.status==true) {

            return res.json({
            status: true,
            statusCode:200,
           data: data?.data ?? [],
            message:'get data'
        });

         }else{

        return res.json({
            status: false,
            statusCode:data.errorcode,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: data.message,
        });
    }

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

export const testGetPerticularOrder = async (req, res,next) => {
    try {

    let token = 'eyJhbGciOiJIUzUxMiJ9.eyJ1c2VybmFtZSI6Ik0xNjI0MjMiLCJyb2xlcyI6MCwidXNlcnR5cGUiOiJVU0VSIiwidG9rZW4iOiJleUpoYkdjaU9pSlNVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKMWMyVnlYM1I1Y0dVaU9pSmpiR2xsYm5RaUxDSjBiMnRsYmw5MGVYQmxJam9pZEhKaFpHVmZZV05qWlhOelgzUnZhMlZ1SWl3aVoyMWZhV1FpT2pZc0luTnZkWEpqWlNJNklqTWlMQ0prWlhacFkyVmZhV1FpT2lJeFpUTmtOMlk1WVMwME5EVmlMVE5rWXpVdE9URXhZUzAyTkdWbU9UWTROakExWW1RaUxDSnJhV1FpT2lKMGNtRmtaVjlyWlhsZmRqSWlMQ0p2Ylc1bGJXRnVZV2RsY21sa0lqbzJMQ0p3Y205a2RXTjBjeUk2ZXlKa1pXMWhkQ0k2ZXlKemRHRjBkWE1pT2lKaFkzUnBkbVVpZlN3aWJXWWlPbnNpYzNSaGRIVnpJam9pWVdOMGFYWmxJbjE5TENKcGMzTWlPaUowY21Ga1pWOXNiMmRwYmw5elpYSjJhV05sSWl3aWMzVmlJam9pVFRFMk1qUXlNeUlzSW1WNGNDSTZNVGMyTXpRME1qSTNOeXdpYm1KbUlqb3hOell6TXpVMU5qazNMQ0pwWVhRaU9qRTNOak16TlRVMk9UY3NJbXAwYVNJNklqZzBaVE0yWW1VMkxUWTBNamN0TkdJNU5TMDVPR013TFRSbE1HRTFNRGd6T1RFMk1DSXNJbFJ2YTJWdUlqb2lJbjAuTlg4emVUMUgzRFMyWng3ZHB2S0lLV0xkMEdZc1V4ZXFqTzByOWl4a0U2OEtZZEtOdXFJWTFta1N5NUJXeGY4bnF2ZXVVQnc2blM1cF9kRWlpaGtGS1ZDTlE5VUZPbWJQV2ZMa3JoaXY5YnpXNE9IbVZyY3drRmRUYTNrbmtXVTJjQS0yRXR3bFc0dlhYYV8tS1o0T0EwU09rRFpOeTJINDlHZnhSY19Kdlk0IiwiQVBJLUtFWSI6InlKYnJubmt4IiwiWC1PTEQtQVBJLUtFWSI6dHJ1ZSwiaWF0IjoxNzYzMzU1ODc3LCJleHAiOjE3NjM0MDQyMDB9.oykRs9YIE0c8mtts4kDQDYQz-63NJgQUS1Tu0ANsCiu3dsZMjd64mTsBVa1rXvtHplaSx1ms9YE3JnsZG8D50A'
    
    let uniqueOrderId = 'f002cdce-9da9-472e-b045-76e0c17cac2b'
    var config = {
        method: 'get',
        url: `https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/details/${uniqueOrderId}`,
        headers: { 
           'Authorization': `Bearer ${token}`,
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

        let {data} = await axios(config)

        //  emitOrderGet(data.data)

        if(data.status==true) {

            return res.json({
            status: true,
            statusCode:200,
           data: data?.data ?? [],
            message:'get data'
        });

         }else{

        return res.json({
            status: false,
            statusCode:data.errorcode,
            message: "Unexpected error occurred. Please try again.",
            data:null,
            error: data.message,
        });
    }

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