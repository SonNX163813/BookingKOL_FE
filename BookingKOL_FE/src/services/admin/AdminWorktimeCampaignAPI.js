// src/services/admin/AdminWorktimeCampaignAPI.js
import { api } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";

// ✅ API mới: /v1/availabilities/admin/scheduled-worktime/create
const PATH_SCHEDULED_CREATE =
  API_PATHS?.WORKTIME_ADMIN?.scheduledCreate ||
  "/v1/availabilities/admin/scheduled-worktime/create";

// ✅ API mới: /v1/availabilities/admin/scheduled-worktime/booking/{bookingRequestId}
const PATH_SCHEDULED_BY_BOOKING =
  API_PATHS?.WORKTIME_ADMIN?.getScheduledByBooking ||
  "/v1/availabilities/admin/scheduled-worktime/booking";

// ✅ API mới: PUT /v1/availabilities/admin/scheduled-worktime/assign
const PATH_SCHEDULED_ASSIGN =
  API_PATHS?.WORKTIME_ADMIN?.scheduledAssign ||
  "/v1/availabilities/admin/scheduled-worktime/assign";

// Dùng API /v1/availabilities/time-line/kol/all để lấy tất cả lịch rảnh
const PATH_SEARCH_FREE_SLOTS = API_PATHS?.SCHEDULER_ADMIN?.kolTimelineAll;

/**
 * ✅ Tạo scheduled worktime
 * POST /v1/availabilities/admin/scheduled-worktime/create
 *
 * Body:
 * {
 *   bookingRequestId: string (required)
 *   startAt: string(date-time) (required)
 *   endAt: string(date-time) (required)
 *   note?: string | null
 *   kolId?: string (optional)
 *   availabilityId?: string (optional)
 * }
 */
export const adminCreateWorktime = (payload, config = {}) => {
  if (!payload?.bookingRequestId) {
    console.warn("[adminCreateWorktime] Thiếu bookingRequestId:", payload);
  }
  if (!payload?.startAt || !payload?.endAt) {
    console.warn("[adminCreateWorktime] Thiếu startAt/endAt:", payload);
  }
  return api.post(PATH_SCHEDULED_CREATE, payload, config);
};

/**
 * ✅ Xem scheduled worktime theo bookingRequestId
 * GET /v1/availabilities/admin/scheduled-worktime/booking/{bookingRequestId}
 *
 * Normalize về { ...raw, content: [] }
 */
export const adminGetWorktimesByBooking = async (
  bookingRequestId,
  { signal } = {}
) => {
  if (!bookingRequestId) {
    return Promise.reject(new Error("bookingRequestId is required"));
  }

  const res = await api.get(
    `${PATH_SCHEDULED_BY_BOOKING}/${encodeURIComponent(bookingRequestId)}`,
    signal ? { signal } : undefined
  );

  const raw = res?.data ?? res;

  let content = [];
  if (Array.isArray(raw)) content = raw;
  else if (Array.isArray(raw?.data)) content = raw.data;
  else if (Array.isArray(raw?.content)) content = raw.content;
  else if (raw && typeof raw === "object") content = [raw];

  return {
    ...(raw && typeof raw === "object" ? raw : {}),
    content,
  };
};

/**
 * ✅ Assign/đổi KOL cho scheduled worktime
 * PUT /v1/availabilities/admin/scheduled-worktime/assign
 *
 * Body:
 * {
 *   scheduledWorkTimeId: string (required)
 *   kolId: string (required)
 *   availabilityId: string (required)
 * }
 */
export const adminAssignScheduledWorktime = (payload, config = {}) => {
  if (!payload?.scheduledWorkTimeId) {
    console.warn(
      "[adminAssignScheduledWorktime] Thiếu scheduledWorkTimeId:",
      payload
    );
  }
  if (!payload?.kolId) {
    console.warn("[adminAssignScheduledWorktime] Thiếu kolId:", payload);
  }
  if (!payload?.availabilityId) {
    console.warn(
      "[adminAssignScheduledWorktime] Thiếu availabilityId:",
      payload
    );
  }
  return api.put(PATH_SCHEDULED_ASSIGN, payload, config);
};

/**
 * ✅ Tìm tất cả slot rảnh của KOL / trợ live trong một khoảng thời gian
 * GET /v1/availabilities/time-line/kol/all?startDate=&endDate=&page=&size=
 *
 * BE trả ví dụ:
 * {
 *  status, message, data: [ ... ]
 * }
 */
export const adminSearchFreeSlots = async ({
  startDate,
  endDate,
  page = 0,
  size = 100,
  signal,
} = {}) => {
  if (!PATH_SEARCH_FREE_SLOTS) {
    throw new Error("PATH_SEARCH_FREE_SLOTS is not defined in API_PATHS");
  }

  const params = { page, size };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  const res = await api.get(PATH_SEARCH_FREE_SLOTS, {
    params,
    ...(signal ? { signal } : {}),
  });

  const raw = res?.data ?? res;

  // Ưu tiên raw.data nếu có, fallback sang raw nếu là array
  const list = Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw)
    ? raw
    : [];

  return list;
};
