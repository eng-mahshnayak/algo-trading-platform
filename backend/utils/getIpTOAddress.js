import axios from "axios";

export const getLocationFromIP = async (ip) => {
  const res = await axios.get(`https://ipapi.co/${ip}/json/`);
  return res.data;
};
