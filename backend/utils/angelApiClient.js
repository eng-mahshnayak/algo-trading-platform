// src/utils/angelApiClient.js
import axios from "axios";
import https from "https";
import dns from "node:dns";

// ✅ Create IPv6 and IPv4 agents
const https6 = new https.Agent({
  keepAlive: true,
  lookup: (host, opts, cb) => dns.lookup(host, { family: 6, all: false }, cb),
});
const https4 = new https.Agent({
  keepAlive: true,
  lookup: (host, opts, cb) => dns.lookup(host, { family: 4, all: false }, cb),
});

// ✅ Create a reusable axios instance
const angelApi = axios.create({
  baseURL: "https://apiconnect.angelone.in",
  timeout: 15000,
  proxy: false, // Disable proxy env vars
});

// ✅ Add a request interceptor to use IPv6 → fallback IPv4
angelApi.interceptors.request.use((config) => {
  // default to IPv6 agent
  config.httpsAgent = https6;
  return config;
});

// ✅ Add a response error interceptor for IPv4 fallback
angelApi.interceptors.response.use(
  (res) => res, // success
  async (error) => {
    const netCodes = new Set([
      "ECONNABORTED",
      "ETIMEDOUT",
      "ENETUNREACH",
      "EAI_AGAIN",
      "ECONNRESET",
      "EHOSTUNREACH",
    ]);
    if (netCodes.has(error?.code)) {
      console.warn("⚠️ IPv6 failed, retrying with IPv4...");
      const retryCfg = { ...error.config, httpsAgent: https4 };
      return axios(retryCfg);
    }
    throw error;
  }
);

export default angelApi;
