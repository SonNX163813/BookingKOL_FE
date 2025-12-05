// src/services/admin/AdminBookingCampaignAPI.js
import dayjs from "dayjs";
import { get } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";

const PATH = API_PATHS.BOOKING_CAMPAIGN.list;
const PATH_DETAIL = API_PATHS.BOOKING_CAMPAIGN.detail;
// 👇 thêm path cho API /v1/campaigns/{id}
const PATH_CAMPAIGN_DETAIL = API_PATHS.CAMPAIGN.detail;

// Cho phép thêm sort (nếu BE support). Ví dụ Spring:
// ?page=0&size=20&sort=createdAt,desc
const ALLOWED = new Set([
  "search",
  "startDate",
  "endDate",
  "packageType",
  "page",
  "size",
  "sort", // ✅ thêm
]);

const toISO = (v) => {
  if (!v) return undefined;
  try {
    if (typeof v === "string") {
      const d0 = dayjs(v);
      if (d0.isValid()) return d0.toISOString();

      const cutAtZ = v.includes("Z") ? v.slice(0, v.indexOf("Z") + 1) : v;
      const cleaned = cutAtZ.replace(/[^0-9T:.Z-]/g, "");
      const d1 = dayjs(cleaned);
      return d1.isValid() ? d1.toISOString() : undefined;
    }

    if (v && typeof v.toDate === "function") {
      const d = v.toDate(); // dayjs instance
      return d instanceof Date && !Number.isNaN(d.getTime())
        ? d.toISOString()
        : undefined;
    }

    if (v instanceof Date && !Number.isNaN(v.getTime())) {
      return v.toISOString();
    }
  } catch (_err) {
    return undefined;
  }
  return undefined;
};

const buildParams = (params = {}) =>
  Object.entries(params || {}).reduce((acc, [k, v]) => {
    if (
      !ALLOWED.has(k) ||
      v == null ||
      (typeof v === "string" && v.trim() === "")
    )
      return acc;

    if (k === "startDate" || k === "endDate") {
      const iso = toISO(v);
      if (iso) acc[k] = iso;
      return acc;
    }

    // sort có thể là string "createdAt,desc" hoặc array (tùy BE),
    // ở đây giữ nguyên v để gửi lên.
    acc[k] = v;
    return acc;
  }, {});

// ================== LIST /admin/bookings ==================
export const adminGetCampaignBookings = async ({ signal, params } = {}) => {
  const payload = await get({
    url: PATH,
    params: buildParams(params),
    config: signal ? { signal } : undefined,
  });

  // payload ở đây là wrapper BE: { status, message, data, timestamp }
  const data = payload?.data ?? payload;
  const content = Array.isArray(data?.content)
    ? data.content
    : Array.isArray(data)
    ? data
    : [];

  return { ...(typeof data === "object" ? data : {}), content };
};

// ================== DETAIL /admin/bookings/admin/{campaignId} ==================
export const adminGetCampaignBookingDetail = async (
  campaignId,
  { signal } = {}
) => {
  if (!campaignId) return Promise.reject(new Error("campaignId is required"));

  return get({
    url: `${PATH_DETAIL}/${encodeURIComponent(campaignId)}`,
    config: signal ? { signal } : undefined,
  });
};

// ================== CAMPAIGN INFO /campaigns/{campaignId} ==================
export const adminGetCampaignInfo = async (campaignId, { signal } = {}) => {
  if (!campaignId) return Promise.reject(new Error("campaignId is required"));

  return get({
    url: `${PATH_CAMPAIGN_DETAIL}/${encodeURIComponent(campaignId)}`,
    config: signal ? { signal } : undefined,
  });
};
