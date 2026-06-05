
// src/api/http.ts
import axios from "axios";

const apiUrl = import.meta.env.VITE_API_URL;

export const http = axios.create({
  baseURL: apiUrl,
});

export const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
});



   