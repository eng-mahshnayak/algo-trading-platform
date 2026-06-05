// src/api/brokers/angelOneApi.ts
import { http, authHeaders } from "../http";

export const upStoxApi = {

  generateToken: async () => {
    try {
      const { data } = await http.get("/upstox/login", {
        headers: authHeaders(),
      });

      console.log(data,'upstox');
      

      // if (data.status && data.data) {
      //   // Save tokens
      //   localStorage.setItem("angel_token", data.data.jwtToken || "");
      //   localStorage.setItem("angel_feed_token", data.data.feedToken || "");
      //   localStorage.setItem("angel_refresh_token", data.data.refreshToken || "");
      // }

      // return data;


        if (data.status && data.data?.loginUrl) {
        // Redirect user to Kite login page
        window.location.href = data.data.loginUrl;
      }

      return data;


    } catch (error: any) {
      console.error("upstox Token Error:", error?.response?.data);
      throw error?.response?.data || error;
    }
  },

  /**
   * Fetch AngelOne Funds
   */
  getFund: async () => {
    try {
      return await http.get("/upstox/user/fund", {
        headers: {
          ...authHeaders(),
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });
    } catch (error: any) {
      console.error("upstox Fund Error:", error?.response?.data);
      throw error?.response?.data || error;
    }
  },

  /**
   * Fetch AngelOne Today Trades / Positions
   */
  getTodayTrade: async () => {
    try {
      return await http.get("/upstox/dummydatatrade", {
        headers: {
          ...authHeaders(),
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });
    } catch (error: any) {
      console.error("upstox Trade Error:", error?.response?.data);
      throw error?.response?.data || error;
    }
  },


   getTodayOrder: async () => {
    try {

      return await http.get("/upstox/deshbaord/todayorderdata", {
        headers: {
          ...authHeaders(),
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });

    } catch (error: any) {
      console.error("upstox TodayTrade Error:", error?.response?.data);
      throw error?.response?.data || error;
    }
  },

  
};
