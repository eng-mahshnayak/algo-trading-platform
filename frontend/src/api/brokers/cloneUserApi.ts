// src/api/brokers/angelOneApi.ts
import { http, authHeaders } from "../http";

export const cloneUserOneApi = {

  generateToken: async () => {
    try {
      const { data } = await http.get("/admin/getuserclonedematlogin", {
        headers: authHeaders(),
      });

      if (data.status && data.data) {
        // Save tokens
        localStorage.setItem("angel_token", data.data.jwtToken || "");
        localStorage.setItem("angel_feed_token", data.data.feedToken || "");
        localStorage.setItem("angel_refresh_token", data.data.refreshToken || "");
      }

      return data;
    } catch (error: any) {
      console.error("clone Token Error:", error?.response?.data);
      throw error?.response?.data || error;
    }
  },

  /**
   * Fetch AngelOne Funds
   */
  getFund: async () => {
    try {
      return await http.get("/admin/getuserclone/fund", {
        headers: {
          ...authHeaders(),
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });
    } catch (error: any) {
      console.error("clone Fund Error:", error?.response?.data);
      throw error?.response?.data || error;
    }
  },

  /**
   * Fetch AngelOne Today Trades / Positions
   */
  getTodayTrade: async () => {
    try {
      return await http.get("/admin/getuserclonetrade", {
        headers: {
          ...authHeaders(),
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });
    } catch (error: any) {
      console.error("clone Trade Error:", error?.response?.data);
      throw error?.response?.data || error;
    }
  },

   getTodayOrder: async () => {
    try {
      return await http.get("/admin/getuserclonetrade/todayorderdata", {
        headers: {
          ...authHeaders(),
          AngelOneToken: localStorage.getItem("angel_token") || "",
        },
      });
    } catch (error: any) {
      console.error("clone Trade Error:", error?.response?.data);
      throw error?.response?.data || error;
    }
  },


  
};
