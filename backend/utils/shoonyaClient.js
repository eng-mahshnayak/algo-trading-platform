// utils/shoonyaClient.ts
import axios from "axios";

const shoonyaClient = axios.create({
  baseURL: process.env.SHOONYA_BASE_URL, // e.g. https://api.shoonya.com/NorenWClientTP/
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  timeout: 10000,
});

export default shoonyaClient;