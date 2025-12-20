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

const hasAuthToken = () => {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(
      localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")
    );
  } catch {
    return false;
  }
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

// ✅ NEW: Im lặng toast khi "Không tìm thấy yêu cầu hủy ..." tại cancel detail
const shouldSilenceCancelDetailToast = (error) => {
  const status = error?.response?.status;
  if (status !== 400 && status !== 404) return false;

  const msg = normalizeMessage(
    error?.response?.data?.message || error?.response?.data?.error
  );

  // match đúng case BE bạn gặp
  if (!/không\s*tìm\s*thấy\s*yêu\s*cầu\s*hủy/i.test(msg)) return false;

  const url = String(error?.config?.url ?? "");
  // match cả trường hợp có/không có dấu "/" đầu và có thể có baseURL
  return /\/?v1\/requests\/cancel\/detail\/?/i.test(url);
};

// ✅ helper: các flag "im lặng" (không ảnh hưởng call site cũ)
const isSilentConfig = (cfg) =>
  cfg?.silent === true ||
  cfg?.skipToast === true ||
  cfg?.skipErrorToast === true;

const shouldSilenceAuthlessError = (error) => {
  const status = error?.response?.status;
  if (error?.config?.skipAuthErrorToast) return true;
  if (status !== 401 && status !== 403) return false;
  return !hasAuthToken();
};

// Response interceptor
api.interceptors.response.use(
  (response) => {
    if (response.config.method === "get") {
      return response.data;
    }

    // ✅ nếu silent/skipToast thì không success toast
    if (
      !response.config?.skipSuccessToast &&
      !response.config?.silent &&
      !response.config?.skipToast
    ) {
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

    // ✅ NEW: không toast nhưng VẪN reject để caller catch -> return null (ẩn UI)
    if (shouldSilenceCancelDetailToast(error)) {
      return Promise.reject(error);
    }

    if (shouldSilenceAuthlessError(error)) {
      return Promise.reject(error);
    }

    // ✅ nếu silent/skipToast thì không error toast (không ảnh hưởng call site cũ)
    if (!isSilentConfig(error.config) && !error.config?.skipErrorToast) {
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
export const get = ({ url, params, config, skipToast } = {}) =>
  api.get(url, {
    params,
    ...(config || {}),
    // ✅ NEW: optional flag, không phá call site cũ
    ...(skipToast
      ? { skipToast: true, silent: true, skipErrorToast: true }
      : {}),
  });

// POST
export const post = ({ url, data, config }) => api.post(url, data, config);

// PUT/UPDATE
export const update = ({ url, data, config }) => api.put(url, data, config);

// DELETE
export const remove = ({ url, config }) => api.delete(url, config);

export const remove2 = ({ url, data, config }) =>
  api.request({ url, method: "delete", data, ...(config || {}) });

// PATCH
export const patch = ({ url, data, config }) => api.patch(url, data, config);
