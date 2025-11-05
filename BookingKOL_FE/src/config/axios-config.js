import axios from "axios";
import { toast } from "react-toastify";

import { BASE_URL } from "../utils/config";

export const api = axios.create({
  baseURL: BASE_URL,
});

const normalizeMessage = (message) => {
  if (Array.isArray(message)) {
    return message.filter(Boolean).join(" ");
  }
  if (typeof message === "string") {
    return message;
  }
  if (message === null || message === undefined) {
    return undefined;
  }
  return String(message);
};

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (response.config.method === "get") {
      return response.data;
    }

    if (!response.config?.skipSuccessToast) {
      const toastMessage = normalizeMessage(response.data?.message);
      if (toastMessage) {
        toast.success(toastMessage);
      }
    }

    return response.data;
  },
  (error) => {
    if (!error.config?.skipErrorToast) {
      const toastMessage = normalizeMessage(error.response?.data?.message);
      toast.error(toastMessage || "Có lỗi xảy ra, vui lòng thử lại.");
    }
    return Promise.reject(error);
  }
);

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("auth_token") ??
      sessionStorage.getItem("auth_token");
    if (token) {
      config.headers = config.headers || {};
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

export const remove2 = ({ url, data, config }) =>
  api.request({ url, method: "delete", data, ...(config || {}) });

// PUT/UPDATE
export const patch = ({ url, data, config }) => api.patch(url, data, config);
