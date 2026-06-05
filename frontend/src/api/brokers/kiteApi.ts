// src/api/brokers/kiteApi.ts
import { http, authHeaders } from "../http";

export const kiteApi = {
  /**
   * Generate Kite Login URL (redirect flow)
   */
  generateToken: async () => {
    try {
      
      const { data } = await http.get("/kite", {
        headers: authHeaders(),
      });

      if (data.status && data.data?.loginUrl) {
        // Redirect user to Kite login page

        console.log( data.data.loginUrl,'========= data.data.loginUrl============');
        

        window.location.href = data.data.loginUrl;
      }

      return data;
    } catch (error: any) {
      console.error("Kite Token Error:", error?.response?.data);
      throw error?.response?.data || error;
    }
  },

  /**
   * Fetch Kite Funds
   */
  getFund: async () => {
    try {

      return await http.get("/kite/fund", {
        headers: {
          ...authHeaders(),
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });
    } catch (error: any) {
      console.error("Kite Fund Error:", error?.response?.data);
      throw error?.response?.data || error;
    }
  },

  /**
   * Fetch Kite Today Trades
   */
  getTodayTrade: async () => {
    try {

      return await http.get("/kite/deshbaord/todaytrade", {
        headers: {
          ...authHeaders(),
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

    } catch (error: any) {
      console.error("Kite TodayTrade Error:", error?.response?.data);
      throw error?.response?.data || error;
    }
  },

  getTodayOrder: async () => {
    try {

      return await http.get("/kite/deshbaord/todayorderdata", {
        headers: {
          ...authHeaders(),
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

    } catch (error: any) {
      console.error("Kite TodayTrade Error:", error?.response?.data);
      throw error?.response?.data || error;
    }
  },

};





     
