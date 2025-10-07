import axios from "axios";
import { toast } from "react-toastify";

export const baseURL = "/api/";

export const api = axios.create({
  baseURL,
});

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (response.config.method === "get") {
      return response.data;
    }
    toast.success(response.data.message);
    return response.data;
  },
  (error) => {
    toast.error(error.response?.data?.message || "Có lỗi xảy ra!");
    return Promise.reject(error);
  }
);

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// GET
export const get = ({ url, params, config }) =>
  api.get(url, {
    params,
    ...config,
  });

// POST
export const post = ({ url, data, config }) => api.post(url, data, config);

// PUT/UPDATE
export const update = ({ url, data, config }) => api.put(url, data, config);

// DELETE
export const remove = ({ url }) => api.delete(url);
