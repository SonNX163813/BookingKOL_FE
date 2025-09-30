// src/utils/config.js
export const BASE_URL = "http://localhost:8080/api/v1";

// ➕ Thêm 1 dòng này để các file đang dùng API_BASE không lỗi:
export const API_BASE = BASE_URL.replace(/\/api\/v1\/?$/, "");
