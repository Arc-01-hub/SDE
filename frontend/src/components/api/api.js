import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const PUBLIC_ENDPOINTS = ["/auth/login", "/auth/register"];

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");

    const isPublic = PUBLIC_ENDPOINTS.some((url) =>
      config.url?.includes(url)
    );

    if (token && !isPublic) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
