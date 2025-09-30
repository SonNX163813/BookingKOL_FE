// src/utils/apiClient.js
import { API_BASE } from "./config";
import { getAuthHeader, clearAuth } from "./auth";

export async function apiFetch(path, { auth = true, ...options } = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(auth ? getAuthHeader() : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // cố gắng parse JSON kể cả khi lỗi
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      clearAuth();
      // window.location.href = "/login"; // bật nếu muốn đẩy user về /login khi 401
    }
    const msg =
      (Array.isArray(data?.message) ? data.message[0] : data?.message) ||
      data?.error ||
      `Lỗi API (HTTP ${res.status})`;
    throw new Error(msg);
  }
  return data;
}
