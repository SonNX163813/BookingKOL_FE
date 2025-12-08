// src/services/admin/AdminBookingFromCampaignAPI.js
import dayjs from "dayjs";
import { post, update } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";

const CREATE_PATH = API_PATHS.BOOKING_CAMPAIGN.create;

const buildEditUrl = (bookingRequestId) => {
  const builder = API_PATHS?.BOOKING_CAMPAIGN?.edit;
  if (typeof builder === "function") return builder(bookingRequestId);
  return `/v1/admin/bookings/edit/${encodeURIComponent(bookingRequestId)}`;
};

/* Helpers */
const toISO = (v) => {
  if (!v) return undefined;

  // dayjs object / antd date obj (has toDate)
  if (v && typeof v.toDate === "function") {
    const d = v.toDate();
    return d instanceof Date && !Number.isNaN(d.getTime())
      ? d.toISOString()
      : undefined;
  }

  if (v instanceof Date && !Number.isNaN(v.getTime?.())) return v.toISOString();

  if (typeof v === "string") {
    const d0 = dayjs(v);
    if (d0.isValid()) return d0.toISOString();

    const cutAtZ = v.includes("Z") ? v.slice(0, v.indexOf("Z") + 1) : v;
    const cleaned = cutAtZ.replace(/[^0-9T:.Z-]/g, "");
    const d1 = dayjs(cleaned);
    if (d1.isValid()) return d1.toISOString();
  }

  return undefined;
};

const toYmd = (v) => {
  if (!v) return undefined;
  const d = dayjs(v);
  return d.isValid() ? d.format("YYYY-MM-DD") : undefined;
};

const toAmountNumber = (v) => {
  if (v == null || v === "") return undefined;
  const n =
    typeof v === "number" ? v : Number(String(v).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : undefined;
};

const toIdArray = (v) => {
  if (!v) return undefined;

  const arr = Array.isArray(v) ? v : [v];

  const ids = arr
    .flatMap((item) => {
      if (item == null) return [];

      // string/number
      if (typeof item === "string" || typeof item === "number") {
        return [String(item).trim()];
      }

      // object from Select labelInValue / option / entity
      if (typeof item === "object") {
        const candidate = item.value ?? item.id ?? item.key;
        return candidate ? [String(candidate).trim()] : [];
      }

      return [String(item).trim()];
    })
    .filter(Boolean);

  return ids.length ? Array.from(new Set(ids)) : undefined;
};

const stripEmpty = (raw) =>
  Object.entries(raw).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) return acc;
    if (typeof value === "string" && value.trim() === "") return acc;
    if (Array.isArray(value) && value.length === 0) return acc;
    acc[key] = value;
    return acc;
  }, {});

const isFileLike = (v) =>
  typeof File !== "undefined" && v instanceof File
    ? true
    : typeof Blob !== "undefined" && v instanceof Blob;

/** POST /v1/admin/bookings/create */
export const adminCreateBookingFromCampaign = async (
  body = {},
  { signal } = {}
) => {
  const raw = {
    campaignId: body?.campaignId,
    description: body?.description,
    status: body?.status, // optional
    repeatType: body?.repeatType,
    startAt: toISO(body?.startAt),
    // ⚠️ nếu API create có endAt thì mới thêm:
    // endAt: toISO(body?.endAt),
    repeatUntil: toYmd(body?.repeatUntil),
    contractAmount: toAmountNumber(body?.contractAmount),
    kolIds: toIdArray(body?.kolIds),
    liveIds: toIdArray(body?.liveIds),
  };

  if (!raw.campaignId) throw new Error("campaignId is required");

  const payload = stripEmpty(raw);

  const res = await post({
    url: CREATE_PATH,
    data: payload,
    config: signal ? { signal } : undefined,
  });

  return res?.data ?? res ?? null;
};

/** ✅ PUT /v1/admin/bookings/edit/{bookingRequestId} */
export const adminEditBookingRequest = async (
  bookingRequestId,
  body = {},
  { signal } = {}
) => {
  if (!bookingRequestId) throw new Error("bookingRequestId is required");

  const raw = {
    description: body?.description,
    repeatType: body?.repeatType,
    dayOfWeek: body?.dayOfWeek, // nếu BE cần number thì bạn convert ở đây
    startAt: toISO(body?.startAt),
    endAt: toISO(body?.endAt),
    repeatUntil: toYmd(body?.repeatUntil),
    contractAmount: toAmountNumber(body?.contractAmount),
    contractFile: body?.contractFile, // string URL hoặc File
    kolIds: toIdArray(body?.kolIds),
    liveIds: toIdArray(body?.liveIds),
  };

  const payload = stripEmpty(raw);

  // ✅ Nếu contractFile là File/Blob -> gửi multipart/form-data
  let data = payload;
  let config = signal ? { signal } : undefined;

  if (payload.contractFile && isFileLike(payload.contractFile)) {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach((x) => fd.append(k, x));
      else fd.append(k, v);
    });

    data = fd;
    config = {
      ...(config ?? {}),
      headers: {
        ...(config?.headers ?? {}),
        "Content-Type": "multipart/form-data",
      },
    };
  }

  const res = await update({
    url: buildEditUrl(bookingRequestId),
    data,
    config,
  });

  return res?.data ?? res ?? null;
};
