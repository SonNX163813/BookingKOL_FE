// src/services/admin/AdminWorktimeCampaignAPI.js
import { api } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";

const PATH_WORKTIME_CREATE = API_PATHS.WORKTIME_ADMIN.create; // /v1/availabilities/admin/worktime/create
const PATH_WORKTIME_BY_BOOKING = API_PATHS.WORKTIME_ADMIN.getByBooking; // /v1/availabilities/admin/booking

// Dùng API /v1/availabilities/time-line/kol/all để lấy tất cả lịch rảnh
const PATH_SEARCH_FREE_SLOTS = API_PATHS.SCHEDULER_ADMIN.kolTimelineAll; // /v1/availabilities/time-line/kol/all

/**
 * Tạo lịch làm việc (worktime)
 *
 * Body:
 * {
 *   "bookingRequestId": "...",
 *   "availabilityId": "...",
 *   "kolId": "...",
 *   "startAt": "2025-11-18T07:52:23.769Z",
 *   "endAt": "2025-11-18T07:52:23.769Z",
 *   "note": "string"
 * }
 *
 * Interceptor trong axios-config:
 *  - Với POST: trả về response.data và tự show toast success nếu có message.
 */
export const adminCreateWorktime = (payload, config = {}) => {
  if (!payload?.bookingRequestId || !payload?.kolId) {
    console.warn(
      "[adminCreateWorktime] Thiếu bookingRequestId hoặc kolId trong payload:",
      payload
    );
  }
  if (!payload?.startAt || !payload?.endAt) {
    console.warn(
      "[adminCreateWorktime] Thiếu startAt hoặc endAt trong payload:",
      payload
    );
  }

  return api.post(PATH_WORKTIME_CREATE, payload, config);
};

/**
 * Xem lịch làm việc của 1 booking request
 * ✅ GET /v1/availabilities/admin/booking/{bookingRequestId}
 *
 * Tuỳ BE trả gì, ta normalize về { ...raw, content: [] } cho dễ dùng với Table:
 *  - [ ... ]
 *  - { status, message, data: [...] }
 *  - { status, message, data: { workTimes: [...] } }
 */
export const adminGetWorktimesByBooking = async (
  bookingRequestId,
  { signal } = {}
) => {
  if (!bookingRequestId) {
    return Promise.reject(new Error("bookingRequestId is required"));
  }

  const payload = await api.get(
    `${PATH_WORKTIME_BY_BOOKING}/${encodeURIComponent(bookingRequestId)}`,
    signal ? { signal } : undefined
  );

  // Với interceptor hiện tại, payload = response.data từ BE
  const raw = payload?.data ?? payload;

  let content = [];

  if (Array.isArray(raw)) {
    content = raw;
  } else if (Array.isArray(raw?.workTimes)) {
    content = raw.workTimes;
  } else if (Array.isArray(raw?.content)) {
    content = raw.content;
  } else if (raw && typeof raw === "object") {
    content = [raw];
  }

  return {
    ...(raw && typeof raw === "object" ? raw : {}),
    content,
  };
};

/**
 * Tìm tất cả slot rảnh của KOL / trợ live trong một khoảng thời gian
 *
 * ✅ Gọi: GET /v1/availabilities/time-line/kol/all
 *    với query: startDate, endDate, page, size
 *
 * Swagger:
 * - startDate: string(date-time)
 * - endDate: string(date-time)
 * - page: int
 * - size: int
 *
 * BE trả ví dụ:
 * {
 *   "data": [
 *     {
 *       "id": "6b55a473-8a05-4909-b079-bd6a8c2d17e7",
 *       "kolId": "9b27c5e0-fe06-4e0a-a030-6e78ce3fd459",
 *       "kolName": "Angelina Jolie",
 *       "startAt": "2025-11-03T00:00:00Z",
 *       "endAt": "2025-11-03T05:00:00Z",
 *       "status": "AVAILABLE",
 *       "createdAt": "2025-11-02T14:10:38.488911Z"
 *     },
 *     ...
 *   ]
 * }
 */
export const adminSearchFreeSlots = async ({
  startDate,
  endDate,
  page = 0,
  size = 100,
  signal,
} = {}) => {
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
