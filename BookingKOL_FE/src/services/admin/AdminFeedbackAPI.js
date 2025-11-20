// src/services/admin/AdminFeedbackAPI.js
import { get, patch } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";
import dayjs from "dayjs";

const PATH_FEEDBACK_BY_KOL = API_PATHS.FEEDBACK_ADMIN.getByKol; // /v1/admin/feedbacks/kol

/** ====== PARAMS & NORMALIZE ====== */
const ADMIN_FEEDBACK_ALLOWED_PARAMS = new Set([
  "page",
  "size",
  "minRating",
  "fromDate",
  "toDate",
]);

const ADMIN_FEEDBACK_DEFAULT_PARAMS = {
  page: 0,
  size: 20,
};

const buildAdminFeedbackParams = (params = {}) => {
  const merged = { ...ADMIN_FEEDBACK_DEFAULT_PARAMS, ...(params || {}) };

  const normalizeDate = (v) => {
    if (!v) return undefined;
    if (dayjs.isDayjs(v)) return v.format("YYYY-MM-DD");
    const d = dayjs(v);
    return d.isValid() ? d.format("YYYY-MM-DD") : undefined;
  };

  const normalized = {
    ...merged,
    fromDate: normalizeDate(merged.fromDate),
    toDate: normalizeDate(merged.toDate),
  };

  const out = {};
  for (const [key, value] of Object.entries(normalized)) {
    if (!ADMIN_FEEDBACK_ALLOWED_PARAMS.has(key)) continue;
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    out[key] = value;
  }
  return out;
};

/**
 * Lấy list feedback theo KOL
 *  GET /v1/admin/feedbacks/kol/{kolId}?page=&size=&minRating=&fromDate=&toDate=
 */
export const adminGetFeedbacksByKol = async (
  kolId,
  { signal, params } = {}
) => {
  if (!kolId) throw new Error("kolId is required");

  const reqParams = buildAdminFeedbackParams(params);

  const payload = await get({
    url: `${PATH_FEEDBACK_BY_KOL}/${encodeURIComponent(kolId)}`,
    params: reqParams,
    config: signal ? { signal } : undefined,
  });

  const raw = payload?.data;
  const data = raw?.data ?? raw;

  if (!data) {
    const empty = {
      content: [],
      totalElements: 0,
      page: 0,
      size: ADMIN_FEEDBACK_DEFAULT_PARAMS.size,
    };
    return { ...empty, data: { ...empty } };
  }

  const content = Array.isArray(data?.content)
    ? data.content
    : Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
    ? data.items
    : [];

  const total =
    typeof data?.totalElements === "number"
      ? data.totalElements
      : typeof data?.total === "number"
      ? data.total
      : Array.isArray(data)
      ? data.length
      : content.length;

  const page =
    typeof data?.page === "number"
      ? data.page
      : typeof data?.number === "number"
      ? data.number
      : 0;

  const size =
    typeof data?.size === "number"
      ? data.size
      : ADMIN_FEEDBACK_DEFAULT_PARAMS.size;

  const normalizedResult = { content, totalElements: total, page, size };
  const originalObject =
    data && typeof data === "object" && !Array.isArray(data) ? data : {};

  return {
    ...originalObject,
    ...normalizedResult,
    data: {
      ...originalObject,
      ...normalizedResult,
    },
  };
};

export const adminHideFeedback = async (feedbackId, { signal } = {}) => {
  if (!feedbackId) throw new Error("feedbackId is required");
  const payload = await patch({
    url: API_PATHS.FEEDBACK_ADMIN.hide(feedbackId),
    // ⬇️ TẮT TOAST MẶC ĐỊNH CỦA BE
    config: {
      ...(signal ? { signal } : {}),
      skipSuccessToast: true,
      skipErrorToast: true,
    },
  });

  // patch() đã trả về response.data rồi
  // Nếu BE bọc { status, message, data } thì payload.data là data thật
  return payload?.data ?? payload ?? null;
};

export const adminShowFeedback = async (feedbackId, { signal } = {}) => {
  if (!feedbackId) throw new Error("feedbackId is required");
  const payload = await patch({
    url: API_PATHS.FEEDBACK_ADMIN.show(feedbackId),
    // ⬇️ TẮT TOAST MẶC ĐỊNH CỦA BE
    config: {
      ...(signal ? { signal } : {}),
      skipSuccessToast: true,
      skipErrorToast: true,
    },
  });

  return payload?.data ?? payload ?? null;
};
