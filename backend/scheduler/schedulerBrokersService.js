import axios from "axios";












const headers = (token)=>({

 Authorization:`Bearer ${token}`,
 "Content-Type":"application/json",
 Accept:"application/json",
 "X-UserType":"USER",
 "X-SourceID":"WEB",
 'X-ClientLocalIP':process.env.CLIENT_LOCAL_IP,
 'X-ClientPublicIP':process.env.CLIENT_PUBLIC_IP,
 'X-MACAddress':process.env.MAC_Address,
 'X-PrivateKey':process.env.PRIVATE_KEY,
});


export async function angelonePlaceOrder(order,token){

 try{

    const PLACE_URL =
"https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/placeOrder";

   const res = await axios.post(PLACE_URL,order,{
     headers:headers(token)
   });

   return res.data;

 }catch(err){

   throw new Error(err.response?.data?.message || err.message);

 }
}


export async function fetchOrderStatus(orderId,token,retry=5){

const ORDER_DETAILS =
 (id)=>`https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/details/${id}`;

 for(let i=0;i<retry;i++){

   try{

     const res = await axios.get(
       ORDER_DETAILS(orderId),
       {headers:headers(token)}
     );

     return res.data;

   }catch(err){

     await new Promise(r=>setTimeout(r,500));

   }

 }

 throw new Error("Order status fetch failed");
}


export async function fetchTradeBook(token,retry=5){

    const TRADE_BOOK =
 "https://apiconnect.angelone.in/rest/secure/angelbroking/order/v1/getTradeBook";

 for(let i=0;i<retry;i++){

   try{

     const res = await axios.get(
       TRADE_BOOK,
       {headers:headers(token)}
     );

     return res.data;

   }catch(err){

     await new Promise(r=>setTimeout(r,500));

   }

 }

 throw new Error("Trade book fetch failed");
}