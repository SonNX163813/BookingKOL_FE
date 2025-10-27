import {
  get,
  patch,
  post,
  remove,
  remove2,
  update,
} from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";
import dayjs from "dayjs";

// ================== GIỮ NGUYÊN CŨ ==================
const KOL_LIST_ALLOWED_PARAMS = new Set([
  "minRating",
  "categoryId",
  "minPrice",
  "page",
  "size",
]);

const KOL_LIST_DEFAULT_PARAMS = { page: 0, size: 10 };

const buildKolListParams = (params = {}) => {
  const mergedParams = { ...KOL_LIST_DEFAULT_PARAMS, ...(params ?? {}) };
  return Object.entries(mergedParams).reduce((acc, [key, value]) => {
    if (!KOL_LIST_ALLOWED_PARAMS.has(key)) return acc;
    const skip =
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "");
    if (!skip) acc[key] = value;
    return acc;
  }, {});
};

export const getKolProfiles = async ({ signal, params } = {}) => {
  const config = signal ? { signal } : undefined;
  const payload = await get({
    url: CLIENT_API_PATHS.KOL.getAllAvailable,
    params: buildKolListParams(params),
    config,
  });
  const data = payload?.data;
  if (!data) return { content: [] };
  const content = Array.isArray(data.content) ? data.content : [];
  return { ...data, content };
};

export const getKolProfileById = async (kolId, { signal } = {}) => {
  if (!kolId) throw new Error("kolId is required");
  const config = signal ? { signal } : undefined;
  const payload = await get({
    url: `${CLIENT_API_PATHS.KOL.getDetailByKolId}/${kolId}`,
    config,
  });
  return payload?.data ?? null;
};
// ====================================================

// ===== NEW: chỉ định rõ các field cho phép update (KHÔNG có giá) =====
const KOL_UPDATE_ALLOWED_FIELDS = new Set([
  "fullName",
  "displayName",
  "dob",
  "experience",
  "role",
  "city",
  "country",
  "bio",
  // nếu BE cho phép cập nhật list chuỗi: điểm mạnh, nền tảng, v.v.
  "strengths", // array<string>
  "platformProficiency", // array<object> (nếu bạn cần)
  "categories", // array<{id|name...}> (tuỳ BE)
  "avatarUrl", // nếu BE cho phép đổi metadata, KHÔNG upload file
  // … thêm field nào BE cho phép, nhưng KHÔNG thêm giá
]);

const buildUpdatePayload = (body = {}) => {
  const cleaned = {};
  Object.entries(body).forEach(([k, v]) => {
    if (!KOL_UPDATE_ALLOWED_FIELDS.has(k)) return;
    if (v === undefined) return;
    if (Array.isArray(v)) cleaned[k] = v.filter((x) => x != null);
    else cleaned[k] = v;
  });
  return cleaned;
};

/**
 * Update hồ sơ KOL của chính user đang đăng nhập.
 * KHÔNG gửi các trường giá (minBookingPrice, rateCard...) – đã loại bằng buildUpdatePayload.
 */
export const updateMyKolProfile = async (body, { signal } = {}) => {
  const config = signal ? { signal } : undefined;
  const payload = await update({
    url: CLIENT_API_PATHS.KOL.updateMyProfile,
    data: buildUpdatePayload(body),
    config,
  });
  return payload?.data ?? null;
};

export const resetPasswordWithOtp = async ({
  email,
  otp,
  newPassword,
  confirmPassword,
  signal,
}) => {
  return await post({
    url: "/password/reset", // 👈 theo yêu cầu
    data: { email, otp, newPassword, confirmPassword },
    config: signal ? { signal } : undefined,
  });
};
export const getKolProfileByUserId = async (userId, { signal } = {}) => {
  if (!userId) throw new Error("userId is required");

  const config = signal ? { signal } : undefined;
  const payload = await get({
    url: `${CLIENT_API_PATHS.KOL.getDetailByUserId}/${userId}`,
    config,
  });

  return payload?.data ?? null;
};

export const uploadKolMedias = async (files, opts = {}) => {
  const { onUploadProgress, signal, fileType, isCover, targetType } = opts;
  const form = new FormData();

  if (Array.isArray(files)) files.forEach((f) => f && form.append("files", f));
  else if (files) form.append("files", files);

  // Nếu BE yêu cầu thêm metadata
  if (fileType) form.append("fileType", fileType); // "IMAGE" | "VIDEO" (nếu cần)
  if (typeof isCover === "boolean") form.append("isCover", String(isCover));
  if (targetType) form.append("targetType", targetType); // "PORTFOLIO" | ...

  return await post({
    url: CLIENT_API_PATHS.KOL.medias.upload, // /v1/kol/medias/upload
    data: form,
    config: {
      signal,
      headers: { "Content-Type": "multipart/form-data" }, // override JSON
      onUploadProgress,
    },
  });
};

export const addKolCategories = async (categoryIds = [], { signal } = {}) => {
  const ids = (Array.isArray(categoryIds) ? categoryIds : [categoryIds]).filter(
    Boolean
  );
  if (!ids.length) return null;

  const results = [];
  for (const id of ids) {
    const res = await post({
      url: CLIENT_API_PATHS.KOL.categoryAdd, // "/v1/kol/category/add"
      data: null,
      // post cho phép config.params => truyền query qua đây
      config: { params: { categoryId: id }, ...(signal ? { signal } : {}) },
    });
    results.push(res ?? null);
  }
  return results;
};

// Remove nhiều categoryId (loop từng id) — DELETE /v1/kol/category/remove?categoryId=...
export const removeKolCategories = async (
  categoryIds = [],
  { signal } = {}
) => {
  const ids = (Array.isArray(categoryIds) ? categoryIds : [categoryIds]).filter(
    Boolean
  );
  if (!ids.length) return null;

  const results = [];
  for (const id of ids) {
    // Cách 1 (đơn giản): remove() chỉ nhận {url} => gắn query trực tiếp
    const url = `${
      CLIENT_API_PATHS.KOL.categoryRemove
    }?categoryId=${encodeURIComponent(id)}`;
    const res = await remove({ url });

    // Nếu muốn truyền thêm signal/params qua config, dùng remove2 như dưới và bỏ 2 dòng trên:
    // const res = await remove2({
    //   url: CLIENT_API_PATHS.KOL.categoryRemove,
    //   data: null,
    //   config: { params: { categoryId: id }, ...(signal ? { signal } : {}) },
    // });

    results.push(res ?? null);
  }
  return results;
};
export const setCoverImage = async (fileId, { signal } = {}) => {
  if (!fileId) throw new Error("fileId is required");
  const payload = await update({
    url: CLIENT_API_PATHS.KOL.medias.changeCover, // "/v1/kol/cover-image/change"
    data: null, // không cần body
    config: { params: { fileId }, signal }, // fileId ở query string
  });
  // interceptor trả {status, message, data}; ta trả về 'data' cho tiện dùng ở UI
  return payload?.data ?? null;
};

/** Deactivate media (xoá khỏi hồ sơ mà không xoá file vật lý)
 *  /api/v1/kol/medias/deactivate  body: { fileUsageIds: [...] }
 */
export const deactivateKolMedias = async (fileUsageIds, { signal } = {}) => {
  const ids = (
    Array.isArray(fileUsageIds) ? fileUsageIds : [fileUsageIds]
  ).filter(Boolean);
  if (!ids.length) return null;
  return await update({
    url: CLIENT_API_PATHS.KOL.medias.deactivate, // /v1/kol/medias/deactivate
    data: { fileUsageIds: ids },
    config: signal ? { signal } : undefined,
  });
};

// ==== helpers chung (đặt gần đầu file KolAPI) ====
const extractAppMessage = (payload) => {
  if (!payload) return "";
  const msg = payload.message;
  if (Array.isArray(msg) && msg.length) return msg[0];
  if (typeof msg === "string") return msg;
  return "";
};

const assertAppOk = (axiosResOrBody) => {
  const body = axiosResOrBody?.data ?? axiosResOrBody;
  const appStatus = typeof body?.status === "number" ? body.status : 200;
  if (appStatus !== 200) {
    const err = new Error(extractAppMessage(body) || "Yêu cầu không hợp lệ.");
    err.appStatus = appStatus;
    err.appPayload = body;
    throw err;
  }
  return body?.data ?? body;
};

const toISO = (dateObj, timeObj) =>
  dateObj
    .hour(timeObj.hour())
    .minute(timeObj.minute())
    .second(0)
    .millisecond(0)
    .toISOString();

const fmtLabel = (startISO, endISO) =>
  `${dayjs(startISO).format("HH:mm")}–${dayjs(endISO).format("HH:mm")}, ${dayjs(
    startISO
  ).format("DD/MM/YYYY")}`;

// ==== sửa hàm đăng ký ====
export const registerKolAvailabilities = async ({
  kolId,
  date,
  shifts,
  signal,
}) => {
  if (!kolId) throw new Error("Missing KOL id");
  if (!dayjs.isDayjs(date)) throw new Error("`date` must be a dayjs object");
  if (!Array.isArray(shifts) || shifts.length === 0)
    throw new Error("`shifts` must be a non-empty array");

  const url = CLIENT_API_PATHS.SCHEDULER.kolSchedule(encodeURIComponent(kolId));

  const results = [];
  for (let i = 0; i < shifts.length; i++) {
    const s = shifts[i];
    const startISO = toISO(date, s.start);
    const endISO = toISO(date, s.end);
    const body = { startAt: startISO, endAt: endISO };

    try {
      const res = await post({
        url,
        data: body,
        config: signal ? { signal } : undefined,
      });
      const ok = assertAppOk(res); // kiểm tra app-status trong body
      results.push(ok);
    } catch (e) {
      const httpStatus = e?.response?.status;
      const appStatus = e?.appStatus;
      const payload = e?.appPayload || e?.response?.data;

      const isConflict =
        appStatus === 400 ||
        appStatus === 409 ||
        httpStatus === 400 ||
        httpStatus === 409;

      const beMsg = extractAppMessage(payload);
      const label = fmtLabel(startISO, endISO);
      const friendly =
        beMsg || `Ca ${i + 1} (${label}) bị trùng với lịch khác.`;

      const err = new Error(friendly);
      err.appStatus = appStatus || httpStatus || 400;
      err.conflict = !!isConflict;
      err.conflictShift = { index: i, startAt: startISO, endAt: endISO };
      throw err; // → FE sẽ rơi vào catch, KHÔNG cập nhật lịch sử
    }
  }
  return results;
};
export const deleteKolMedia = async (fileId, { signal } = {}) => {
  if (!fileId) throw new Error("fileId is required");
  // remove() chỉ nhận {url} → gắn id vào path
  return await patch({
    url: CLIENT_API_PATHS.KOL.medias.delete(encodeURIComponent(fileId)),
  });
};

/** Chuẩn hoá payload về mảng */
const asArray = (payload) => {
  const d = payload?.data ?? payload ?? [];
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.content)) return d.content;
  if (Array.isArray(d.items)) return d.items;
  return [];
};

/** GET /v1/availabilities/free-time/{kolId} */
export const getKolFreeTime = async ({
  kolId,
  startDate,
  endDate,
  signal,
} = {}) => {
  if (!kolId) throw new Error("kolId is required");
  const url = CLIENT_API_PATHS.SCHEDULER.kolFreeTime(encodeURIComponent(kolId));
  const payload = await get({
    url,
    params: { startDate, endDate },
    config: signal ? { signal } : undefined,
  });
  return asArray(payload);
};

/** GET /v1/availabilities/time-line/kol/{kolId} */
export const getKolTimeline = async ({
  kolId,
  startDate,
  endDate,
  page = 0,
  size = 1000,
  signal,
} = {}) => {
  if (!kolId) throw new Error("kolId is required");
  const url = CLIENT_API_PATHS.SCHEDULER.kolTimeline(encodeURIComponent(kolId));
  const payload = await get({
    url,
    params: { startDate, endDate, page, size },
    config: signal ? { signal } : undefined,
  });
  return asArray(payload);
};

/* --- chuẩn hoá 1 slot từ API -> item cho UI --- */
const normalizeSlot = (slot, { isBooking }) => {
  const startISO =
    slot?.startAt ||
    slot?.startTime ||
    slot?.start ||
    slot?.beginAt ||
    slot?.from;
  const endISO =
    slot?.endAt || slot?.endTime || slot?.end || slot?.finishAt || slot?.to;
  const s = dayjs(startISO),
    e = dayjs(endISO);

  return {
    id: slot?.id || `${isBooking ? "B" : "F"}_${startISO}_${endISO}`,
    description:
      slot?.title || slot?.description || (isBooking ? "Booking" : "Lịch rảnh"),
    colorCode: slot?.colorCode || (isBooking ? "#4a74da" : "#34c759"),
    status: isBooking ? slot?.status || "BOOKED" : "FREE",
    isBooking: !!isBooking,
    startISO,
    endISO,
    startTime: s.isValid() ? s.format("HH:mm:ss") : "00:00:00",
    endTime: e.isValid() ? e.format("HH:mm:ss") : "00:00:00",
  };
};

/* --- tạo map ngày rỗng để luôn render bảng --- */
const emptyDayMap = (start, end) => {
  const map = new Map();
  for (
    let d = dayjs(start).startOf("day");
    d.isBefore(end) || d.isSame(end, "day");
    d = d.add(1, "day")
  ) {
    map.set(d.format("DD"), []); // key 'DD'
  }
  return map;
};

/**
 * Gộp free-time + timeline thành dayDuties cho Grid
 * @param { kolId, range: 'day'|'week'|'month', fromDate, signal }
 */
export const fetchDayDuties = async ({
  kolId,
  range = "month",
  fromDate,
  signal,
}) => {
  const base = dayjs(fromDate || dayjs());
  let start, end;
  if (range === "day") {
    start = base.startOf("day");
    end = base.endOf("day");
  } else if (range === "week") {
    start = base.startOf("isoWeek");
    end = base.endOf("isoWeek");
  } else {
    start = base.startOf("month");
    end = base.endOf("month");
  }

  const [freeSlots, bookedSlots] = await Promise.all([
    getKolFreeTime({
      kolId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      signal,
    }),
    getKolTimeline({
      kolId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      page: 0,
      size: 1000,
      signal,
    }),
  ]);

  const freeDescs = freeSlots.map((s) =>
    normalizeSlot(s, { isBooking: false })
  );
  const bookedDescs = bookedSlots.map((s) =>
    normalizeSlot(s, { isBooking: true })
  );

  const map = emptyDayMap(start, end);
  const put = (desc) => {
    const k = dayjs(desc.startISO).format("DD");
    map.get(k)?.push(desc);
  };
  freeDescs.forEach(put);
  bookedDescs.forEach(put);

  const goalList = Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([day, list]) => ({
      day,
      task: list.length
        ? [
            {
              description: list.sort((a, b) =>
                a.startTime.localeCompare(b.startTime)
              ),
            },
          ]
        : [],
    }));

  return { goalList };
};

const resolveAvatarUrl = (kol) => {
  const raw = kol?.avatarUrl;
  const usages = kol?.fileUsageDtos || [];

  // Nếu đã là URL http(s)
  if (raw && /^https?:\/\//i.test(raw)) return raw;

  // Nếu raw là id của FileUsage → map sang file.fileUrl
  const byUsageId = raw ? usages.find((u) => u?.id === raw) : null;
  if (byUsageId?.file?.fileUrl) return byUsageId.file.fileUrl;

  // Nếu raw là id của File → map theo file.id
  const byFileId = raw ? usages.find((u) => u?.file?.id === raw) : null;
  if (byFileId?.file?.fileUrl) return byFileId.file.fileUrl;

  // Fallback: ưu tiên usage AVATAR đang active
  const avatarUsage = usages.find(
    (u) => u?.targetType === "AVATAR" && u?.isActive && u?.file?.fileUrl
  );
  if (avatarUsage?.file?.fileUrl) return avatarUsage.file.fileUrl;

  // Fallback 2: cover image portfolio
  const cover = usages.find(
    (u) => u?.isCover && u?.isActive && u?.file?.fileUrl
  );
  if (cover?.file?.fileUrl) return cover.file.fileUrl;

  return "";
};
