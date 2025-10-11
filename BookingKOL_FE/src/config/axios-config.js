import axios from "axios";
import { toast } from "react-toastify";

import { BASE_URL } from "../utils/config";

export const api = axios.create({
  baseURL: BASE_URL,
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

// PUT/UPDATE
export const patch = ({ url, data, config }) => api.patch(url, data, config);
