import axios from "axios";
import { ACCESS_TOKEN } from "../data/constants";
import { getItem } from "./localstorage";

const api = axios.create({ baseURL: "http://localhost:8000" });

api.interceptors.request.use(
  (config) => {
    const token = getItem(ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.log(error);
    return Promise.reject(error);
  }
);

export default api;
