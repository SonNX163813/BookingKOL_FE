import dayjs from "dayjs";
import { post } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";

const CREATE_PATH = API_PATHS.BOOKING_CAMPAIGN.create;

/* Helpers */
const toISO = (v) => {
  if (!v) return undefined;
  if (v?.toDate) {
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
    return d1.isValid() ? d1.toISOString() : undefined;
  }
  return undefined;
};

const toYmd = (v) => {
  if (!v) return undefined;
  const d = dayjs(v);
  return d.isValid() ? d.format("YYYY-MM-DD") : undefined;
};

const toAmountString = (v) => {
  if (v == null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(String(v).replace(/,/g, ""));
  return Number.isFinite(n) ? n.toFixed(2) : undefined;
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
  const payload = {
    campaignId: body?.campaignId,
    description: body?.description,
    status: body?.status, // REQUESTED | APPROVED | REJECTED | COMPLETED
    repeatType: body?.repeatType, // ONCE | DAILY | WEEKLY | MONTHLY
    dayOfWeek: body?.dayOfWeek, // MONDAY..SUNDAY (khi WEEKLY)
    startAt: toISO(body?.startAt),
    repeatUntil: toYmd(body?.repeatUntil),
    contractAmount: toAmountString(body?.contractAmount),
    kolIds: toIdArray(body?.kolIds),
    liveIds: toIdArray(body?.liveIds),
  };

  if (!payload.campaignId) throw new Error("campaignId is required");

  const res = await post({
    url: CREATE_PATH,
    data: payload,
    config: signal ? { signal } : undefined,
  });
  return res?.data ?? res ?? null;
};
