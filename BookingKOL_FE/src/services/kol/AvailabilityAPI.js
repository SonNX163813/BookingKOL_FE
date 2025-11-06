// src/services/kol/AvailabilityAPI.js
import { get } from "../../config/axios-config";

export const getAvailabilityTimelineById = async (
  availabilityId,
  { signal } = {}
) => {
  if (!availabilityId) throw new Error("availabilityId is required");
  const url = `/v1/availabilities/time-line/${encodeURIComponent(
    availabilityId
  )}`;

  const res = await get({ url, config: signal ? { signal } : undefined });
  // Chuẩn hoá: BE có thể trả {status,message,data} hoặc object thẳng
  const raw = res?.data ?? res;
  const appStatus = typeof raw?.status === "number" ? raw.status : 200;
  if (appStatus !== 200) {
    const msg = Array.isArray(raw?.message) ? raw.message[0] : raw?.message;
    const err = new Error(msg || "Không tải được availability timeline.");
    err.appStatus = appStatus;
    throw err;
  }
  return raw?.data ?? raw ?? null;
};
