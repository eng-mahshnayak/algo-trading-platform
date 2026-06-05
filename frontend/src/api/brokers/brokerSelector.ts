// src/api/brokers/brokerSelector.ts
import { angelOneApi } from "./angelOneApi";
import { kiteApi } from "./kiteApi";
import { cloneUserOneApi } from "./cloneUserApi";
import { fyersApi } from "./fyersApi";
import {finvasiaApi} from "./finvasiaApi"
import {upStoxApi} from "./upStoxApi"
import {growwApi} from "./growwApi"
import { kotakNeoApi } from "./kotakneo";
import {  useNavigate } from "react-router-dom";


export const useBrokerApi = () => {

    const navigate = useNavigate();

  const userData = localStorage.getItem("user");

  const user = userData ? JSON.parse(userData) : null;

  const userRole = user?.role;
  const broker = user?.brokerName?.toLowerCase();
  const brokerImage = user?.brokerImageLink;  // ⭐ new field

  console.log(broker,userRole,'login with !');
  

  if (!broker) {

     navigate("/", { replace: true });
    // throw new Error("Broker not selected in user data");
  }

  if (!brokerImage) console.warn("brokerImageLink missing in user data");

if (broker === "angelone"&&userRole==='user') {
    return {
      api: angelOneApi,
      image: brokerImage,
      brokerName:broker,
      role:userRole

    };
  }
  if (broker === "kotak neo"&&userRole==='user') {
    return {
      api: kotakNeoApi,
      image: brokerImage,
      brokerName:broker,
      role:userRole

    };
  }

 if (broker === "kite"&&userRole==='user') {
    return {
      api: kiteApi,
      image: brokerImage,
       brokerName:broker,
        role:userRole
    };
  }

  if (broker === "fyers"&&userRole==='user') {
    return {
      api: fyersApi,
      image: brokerImage,
       brokerName:broker,
        role:userRole
    };
  }

   if (broker === "upstox"&&userRole==='user') {
    return {
      api: upStoxApi,
      image: brokerImage,
       brokerName:broker,
        role:userRole
    };
  }

   if (broker === "finvasia"&&userRole==='user') {
    return {
      api: finvasiaApi,
      image: brokerImage,
       brokerName:broker,
        role:userRole
    };
  }
  if (broker === "groww"&&userRole==='user') {
    return {
      api: growwApi,
      image: brokerImage,
       brokerName:broker,
        role:userRole
    };
  }

   if (userRole=='clone-user') {
    return {
      api: cloneUserOneApi,
      image: brokerImage,
       brokerName:broker,
       role:userRole
    };
  }

  // when logout
  if(broker==undefined||userRole==undefined) {
      navigate("/", { replace: true });
  }


  throw new Error(`Unsupported broker: ${broker} and ${userRole}`);
};


