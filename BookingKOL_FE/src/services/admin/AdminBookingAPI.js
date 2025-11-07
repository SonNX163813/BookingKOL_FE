import { get } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";

/* ===== Helpers chung ===== */
const normalizeParam = (v) => {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "string") {
    const t = v.trim();
    return t.length ? t : undefined;
  }
  return v;
};

const ALLOWED = new Set([
  "page",
  "size",
  "status",
  "startAt",
  "endAt",
  "createdAtFrom",
  "createdAtTo",
  "requestNumber",
]);

const buildParams = (params = {}) => {
  const merged = { page: 0, size: 20, ...(params || {}) };
  const out = {};
  for (const [k, v] of Object.entries(merged)) {
    if (!ALLOWED.has(k)) continue;
    const nv = normalizeParam(v);
    if (nv !== undefined) out[k] = nv;
  }
  return out;
};

/** ✅ Booking theo KOL ID (đã có) */
export const adminGetBookingRequestsByKol = async (
  kolId,
  {
    page = 0,
    size = 20,
    status,
    startAt,
    endAt,
    createdAtFrom,
    createdAtTo,
    requestNumber,
    signal,
  } = {}
) => {
  if (!kolId) throw new Error("kolId is required");
  const params = buildParams({
    page,
    size,
    status,
    startAt,
    endAt,
    createdAtFrom,
    createdAtTo,
    requestNumber,
  });

  const payload = await get({
    url: `${API_PATHS.BOOKING_REQUEST.getAllByKol}/${encodeURIComponent(
      kolId
    )}`,
    params,
    config: signal ? { signal } : undefined,
  });

  return payload?.data ?? payload ?? null;
};

/** ✅ Booking theo USER ID (NEW) */
export const adminGetBookingRequestsByUser = async (
  userId,
  {
    page = 0,
    size = 20,
    status,
    startAt,
    endAt,
    createdAtFrom,
    createdAtTo,
    requestNumber,
    signal,
  } = {}
) => {
  if (!userId) throw new Error("userId is required");
  const params = buildParams({
    page,
    size,
    status,
    startAt,
    endAt,
    createdAtFrom,
    createdAtTo,
    requestNumber,
  });

  const payload = await get({
    url: `${API_PATHS.BOOKING_REQUEST.getAllByUser}/${encodeURIComponent(
      userId
    )}`,
    params,
    config: signal ? { signal } : undefined,
  });

  return payload?.data ?? payload ?? null;
};
