// src/utils/config.js
const BASE = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");

export const API_BASE = BASE;
// Nếu BASE đã là '/api' -> '/api/v1', còn nếu lỡ đặt '/api/v1' -> giữ nguyên
export const BASE_URL = BASE.endsWith("/api") ? `${BASE}/v1` : `${BASE}`;
