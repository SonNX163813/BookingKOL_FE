// src/services/admin/AdminBookingFromCampaignAPI.js
import dayjs from "dayjs";
import { post } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";

const CREATE_PATH = API_PATHS.BOOKING_CAMPAIGN.create;

/* Helpers */
const toISO = (v) => {
  if (!v) return undefined;

  // dayjs object (có .toDate)
  if (v && typeof v.toDate === "function") {
    const d = v.toDate();
    return d instanceof Date && !Number.isNaN(d.getTime())
      ? d.toISOString()
      : undefined;
  }

  // Date object
  if (v instanceof Date && !Number.isNaN(v.getTime?.())) {
    return v.toISOString();
  }

  // string
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
  const a = Array.isArray(v) ? v : String(v).split(/[,\s]+/);
  const ids = a.map((s) => String(s).trim()).filter(Boolean);
  return ids.length ? Array.from(new Set(ids)) : undefined;
};

/** POST /v1/admin/bookings/create */
export const adminCreateBookingFromCampaign = async (
  body = {},
  { signal } = {}
) => {
  const raw = {
    campaignId: body?.campaignId,
    description: body?.description,
    // ❌ KHÔNG hard-code status nữa, chỉ gửi nếu FE truyền vào:
    status: body?.status, // optional
    repeatType: body?.repeatType,
    startAt: toISO(body?.startAt),
    repeatUntil: toYmd(body?.repeatUntil),
    contractAmount: toAmountNumber(body?.contractAmount),
    kolIds: toIdArray(body?.kolIds),
    liveIds: toIdArray(body?.liveIds),
  };

  if (!raw.campaignId) {
    throw new Error("campaignId is required");
  }

  // Loại bỏ field undefined / null / mảng rỗng
  const payload = Object.entries(raw).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) return acc;
    if (Array.isArray(value) && value.length === 0) return acc;
    acc[key] = value;
    return acc;
  }, {});

  const res = await post({
    url: CREATE_PATH,
    data: payload,
    config: signal ? { signal } : undefined,
  });

  return res?.data ?? res ?? null;
};
