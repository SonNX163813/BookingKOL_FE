// // src/utils/config.js
// const BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");

// export const API_BASE = BASE;
// // Nếu BASE đã là '/api' -> '/api/v1', còn nếu lỡ đặt '/api/v1' -> giữ nguyên
// export const BASE_URL = BASE.endsWith("/api") ? `${BASE}/v1` : `${BASE}`;

// src/utils/config.js
export const BASE_URL = "http://54.179.248.120/api";

// ➕ Thêm 1 dòng này để các file đang dùng API_BASE không lỗi:
export const API_BASE = BASE_URL.replace(/\/api\/v1\/?$/, "");
