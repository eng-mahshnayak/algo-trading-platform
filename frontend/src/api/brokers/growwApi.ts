// src/api/brokers/angelOneApi.ts
import { http, authHeaders } from "../http";

export const growwApi = {

  generateToken: async () => {
    try {
      const { data } = await http.get("/angelone/login/totp", {
        headers: authHeaders(),
      });

      console.log(data,'groww');
      

      if (data.status && data.data) {
        // Save tokens
        localStorage.setItem("angel_token", data.data.jwtToken || "");
        localStorage.setItem("angel_feed_token", data.data.feedToken || "");
        localStorage.setItem("angel_refresh_token", data.data.refreshToken || "");
      }

      return data;
    } catch (error: any) {
      console.error("AngelOne Token Error:", error?.response?.data);
      throw error?.response?.data || error;
    }
  },

  /**
   * Fetch AngelOne Funds
   */
  getFund: async () => {
    try {
      return await http.get("/margins/detail/user", {
        headers: {
          ...authHeaders(),
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });
    } catch (error: any) {
      console.error("AngelOne Fund Error:", error?.response?.data);
      throw error?.response?.data || error;
    }
  },

  /**
   * Fetch AngelOne Today Trades / Positions
   */
  getTodayTrade: async () => {
    try {
      return await http.get("/angelone/deshbaord/tradedata", {
        headers: {
          ...authHeaders(),
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });
    } catch (error: any) {
      console.error("AngelOne Trade Error:", error?.response?.data);
      throw error?.response?.data || error;
    }
  },

  getTodayOrder: async () => {
    try {
      return await http.get("/angelone/deshbaord/todayorderdata", {
        headers: {
          ...authHeaders(),
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });
    } catch (error: any) {
      console.error("AngelOne Trade Error:", error?.response?.data);
      throw error?.response?.data || error;
    }
  },


  
};
