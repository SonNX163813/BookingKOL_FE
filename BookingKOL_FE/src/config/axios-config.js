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
    return "";
  }
  return String(message);
};

// ✅ Chỉ im lặng đúng case "Không tìm thấy Livestream Metric..." tại endpoint metrics
const shouldSilenceLivestreamMetricToast = (error) => {
  const status = error?.response?.status;
  if (status !== 400) return false;

  const msg = normalizeMessage(error?.response?.data?.message);
  if (!/không tìm thấy\s+livestream\s+metric/i.test(msg)) return false;

  const url = String(error?.config?.url ?? "");
  // match cả trường hợp có/không có dấu "/" đầu
  return /\/?v1\/admin\/requests\/worktime\/livestream-metrics/i.test(url);
};

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (response.config.method === "get") {
      return response.data;
    }

    if (!response.config?.skipSuccessToast) {
      const toastMessage = normalizeMessage(response.data?.message);
      if (toastMessage) toast.success(toastMessage);
    }

    return response.data;
  },
  (error) => {
    // ✅ DỨT ĐIỂM: không toast + không reject cho case thiếu livestream metrics
    // -> caller nhận payload (data:null) như success => tránh retry/refetch loop
    if (shouldSilenceLivestreamMetricToast(error)) {
      return error.response?.data ?? { data: null };
    }

    if (!error.config?.skipErrorToast) {
      const toastMessage = normalizeMessage(error.response?.data?.message);
      toast.error(toastMessage);
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

// PATCH
export const patch = ({ url, data, config }) => api.patch(url, data, config);
