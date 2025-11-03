// src/services/kol/LiveMetricAPI.js
import { post } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

/** 16 khóa hợp lệ theo LivestreamMetricReqDTO */
const METRIC_KEYS = [
  "revenue",
  "liveViewsOver1min",
  "viewsUnder1min",
  "commentsIn1min",
  "totalComments",
  "addToCartIn1min",
  "totalViews",
  "avgViewDuration",
  "pcu",
  "productClickRate",
  "orderConversionRate",
  "gpm",
  "totalOrders",
  "buyers",
  "avgOrderValue",
  "productsSold",
];

// Chuyển ""/null/undefined -> 0; ép số; clamp phần trăm; đảm bảo >= 0
const toNumberOrZero = (v) => Number(v ?? 0);
const nonneg = (n) => (Number.isFinite(n) && n >= 0 ? n : 0);
const clampPct = (n) => Math.min(100, Math.max(0, n));

export function buildLivestreamMetricPayload(raw = {}) {
  const out = {};
  for (const k of METRIC_KEYS) {
    let val = toNumberOrZero(raw[k]);
    if (k === "productClickRate" || k === "orderConversionRate") {
      val = clampPct(val);
    } else {
      val = nonneg(val);
    }
    out[k] = val;
  }
  return out;
}

/** ✅ (POST) /v1/kol/requests/worktime/create-livestream-metric/{worktimeId} */
export async function createKolLivestreamMetric(
  worktimeId,
  dto,
  { signal } = {}
) {
  if (!worktimeId) throw new Error("worktimeId is required");
  const payload = buildLivestreamMetricPayload(dto);

  // ✅ Fallback: hỗ trợ CLIENT_API_PATHS.BOOKING.kolCreateLivestreamMetric hoặc CLIENT_API_PATHS.kolCreateLivestreamMetric
  const builder =
    CLIENT_API_PATHS?.BOOKING?.kolCreateLivestreamMetric ??
    CLIENT_API_PATHS?.kolCreateLivestreamMetric;

  if (typeof builder !== "function") {
    throw new Error(
      "Missing CLIENT_API_PATHS.{BOOKING.}kolCreateLivestreamMetric"
    );
  }

  const res = await post({
    url: builder(worktimeId),
    data: payload,
    config: signal ? { signal } : undefined,
  });
  return res?.data ?? null;
}

// Alias cũ (nếu nơi nào còn dùng)
export const createLivestreamMetricsByWorktime = createKolLivestreamMetric;
