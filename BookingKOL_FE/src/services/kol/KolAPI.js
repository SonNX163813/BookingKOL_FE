// src/services/kol/KolAPI.js
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

/** ======= CẤU HÌNH BUSINESS RULE ======= */
// Buffer tối thiểu giữa các ca (phút). Ví dụ 60 = ±1h quanh booking.
const BOOKING_BUFFER_MINUTES = 60;

/* ================== KOL LIST (CLIENT) ================== */
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

/* ================== UPDATE HỒ SƠ (không đụng tới giá) ================== */
const KOL_UPDATE_ALLOWED_FIELDS = new Set([
  "fullName",
  "displayName",
  "dob",
  "experience",
  "role",
  "city",
  "country",
  "bio",
  "strengths",
  "platformProficiency",
  "categories",
  "avatarUrl",
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

export const updateMyKolProfile = async (body, { signal } = {}) => {
  const config = signal ? { signal } : undefined;
  const payload = await update({
    url: CLIENT_API_PATHS.KOL.updateMyProfile,
    data: buildUpdatePayload(body),
    config,
  });
  return payload?.data ?? null;
};

/* ================== AUTH: Reset password với OTP ================== */
export const resetPasswordWithOtp = async ({
  email,
  otp,
  newPassword,
  confirmPassword,
  signal,
}) => {
  return await post({
    url: "/password/reset",
    data: { email, otp, newPassword, confirmPassword },
    config: signal ? { signal } : undefined,
  });
};

/* ================== PROFILE ================== */
export const getKolProfileByUserId = async (userId, { signal } = {}) => {
  if (!userId) throw new Error("userId is required");

  const config = signal ? { signal } : undefined;
  const payload = await get({
    url: `${CLIENT_API_PATHS.KOL.getDetailByUserId}/${userId}`,
    config,
  });

  return payload?.data ?? null;
};

/* ================== MEDIA ================== */
export const uploadKolMedias = async (files, opts = {}) => {
  const { onUploadProgress, signal, fileType, isCover, targetType } = opts;
  const form = new FormData();

  if (Array.isArray(files)) files.forEach((f) => f && form.append("files", f));
  else if (files) form.append("files", files);

  if (fileType) form.append("fileType", fileType); // "IMAGE" | "VIDEO"
  if (typeof isCover === "boolean") form.append("isCover", String(isCover));
  if (targetType) form.append("targetType", targetType); // "PORTFOLIO" | ...

  return await post({
    url: CLIENT_API_PATHS.KOL.medias.upload, // /v1/kol/medias/upload
    data: form,
    config: {
      signal,
      headers: { "Content-Type": "multipart/form-data" },
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
      config: { params: { categoryId: id }, ...(signal ? { signal } : {}) },
    });
    results.push(res ?? null);
  }
  return results;
};

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
    const url = `${
      CLIENT_API_PATHS.KOL.categoryRemove
    }?categoryId=${encodeURIComponent(id)}`;
    const res = await remove({ url });
    // Hoặc dùng remove2 nếu muốn truyền signal/params qua config:
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
    data: null,
    config: { params: { fileId }, signal },
  });
  return payload?.data ?? null;
};

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

export const deleteKolMedia = async (fileId, { signal } = {}) => {
  if (!fileId) throw new Error("fileId is required");
  return await patch({
    url: CLIENT_API_PATHS.KOL.medias.delete(encodeURIComponent(fileId)),
    config: signal ? { signal } : undefined,
  });
};

/* ================== HELPERS CHUNG ================== */
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

/* ================== SCHEDULER: ĐĂNG KÝ ================== */
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
      const ok = assertAppOk(res);
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
      throw err;
    }
  }
  return results;
};

/* ================== LẤY LỊCH (Free time & Timeline) ================== */
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

/* ================== CHUẨN HOÁ SLOT & FLATTEN workTimes ================== */
const statusColor = (status) => {
  const s = String(status || "").toUpperCase();
  switch (s) {
    case "IN_PROGRESS":
      return "#f59e0b"; // amber
    case "COMPLETED":
    case "DONE":
      return "#10b981"; // green
    case "PENDING":
      return "#60a5fa"; // light blue
    default:
      return "#4a74da"; // default blue
  }
};

const normalizeSlot = (slot, { isBooking }) => {
  const startISO =
    slot?.startAt ||
    slot?.startTime ||
    slot?.start ||
    slot?.beginAt ||
    slot?.from;
  const endISO =
    slot?.endAt || slot?.endTime || slot?.end || slot?.finishAt || slot?.to;

  const s = dayjs(startISO);
  const e = dayjs(endISO);

  return {
    id: slot?.id || `${isBooking ? "B" : "F"}_${startISO}_${endISO}`,
    description:
      slot?.title ||
      slot?.description ||
      slot?.note ||
      (isBooking ? "Booking" : "Lịch rảnh"),
    colorCode:
      slot?.colorCode || (isBooking ? statusColor(slot?.status) : "#34c759"),
    status: isBooking ? slot?.status || "BOOKED" : "FREE",
    isBooking: !!isBooking,
    startISO,
    endISO,
    startTime: s.isValid() ? s.format("HH:mm:ss") : "00:00:00",
    endTime: e.isValid() ? e.format("HH:mm:ss") : "00:00:00",
  };
};

const isCancelled = (st) => String(st || "").toUpperCase() === "CANCELLED";

/** Flatten workTimes -> segments, giữ meta để popup dùng */
const expandWorkTimes = (item) => {
  if (!Array.isArray(item?.workTimes) || item.workTimes.length === 0) return [];

  const availabilityId = item?.id ?? item?.availabilityId ?? null; // id record timeline cha
  const bookingRequestId = item?.requestId ?? item?.bookingId ?? null;
  const requestNumber = item?.requestNumber ?? null;

  return item.workTimes
    .filter((w) => !isCancelled(w?.status))
    .map((w) => ({
      // ==== META để click popup gọi API chính xác ====
      availabilityId, // ✅ cần cho /v1/availabilities/time-line/{availabilityId}
      parentId: availabilityId, // alias
      bookingRequestId, // fallback gọi detail đơn khi cần
      requestNumber, // hiển thị mã đơn

      // ==== DỮ LIỆU HIỂN THỊ ====
      ...w,
      startAt: w.startAt,
      endAt: w.endAt,
      id: w.id || `${availabilityId}_${w.startAt}_${w.endAt}`, // unique cho React key
      title: item?.title || requestNumber || item?.note || "Booking",
      description: item?.note ?? w?.note ?? "Ca booking",
      status: w?.status,
    }));
};

/* ==== Interval helpers (chuẩn hoá + buffer + trừ free bằng booking) ==== */
const toISOInterval = (slot) => {
  const startISO =
    slot?.startAt ||
    slot?.startTime ||
    slot?.start ||
    slot?.beginAt ||
    slot?.from;
  const endISO =
    slot?.endAt || slot?.endTime || slot?.end || slot?.finishAt || slot?.to;

  const s = dayjs(startISO);
  const e = dayjs(endISO);
  if (!s.isValid() || !e.isValid() || !e.isAfter(s)) return null;
  return { startISO: s.toISOString(), endISO: e.toISOString() };
};

const overlaps = (aStart, aEnd, bStart, bEnd) => {
  const s = dayjs(aStart);
  const e = dayjs(aEnd);
  return e.isAfter(bStart) && s.isBefore(bEnd);
};

/** Mở rộng 1 khoảng theo buffer phút (±minutes) */
const expandIntervalByMinutes = (iv, minutes) => {
  const s = dayjs(iv.startISO).subtract(minutes, "minute");
  const e = dayjs(iv.endISO).add(minutes, "minute");
  return { startISO: s.toISOString(), endISO: e.toISOString() };
};

/** Merge các interval đã sort theo start (gộp cả trường hợp chạm nhau) */
const mergeSortedIntervals = (arr) => {
  if (!arr.length) return arr;
  const out = [Object.assign({}, arr[0])];
  for (let i = 1; i < arr.length; i++) {
    const cur = arr[i];
    const last = out[out.length - 1];
    const lastEnd = dayjs(last.endISO);
    const curStart = dayjs(cur.startISO);
    const curEnd = dayjs(cur.endISO);

    if (!curStart.isAfter(lastEnd)) {
      // overlap hoặc tiếp giáp -> gộp
      if (curEnd.isAfter(lastEnd)) {
        last.endISO = cur.endISO;
      }
    } else {
      out.push(Object.assign({}, cur));
    }
  }
  return out;
};

/** Trừ 1 khoảng busy khỏi 1 khoảng free -> trả về 0..2 khoảng còn lại */
const subtractInterval = (freeSeg, busySeg) => {
  const fs = dayjs(freeSeg.startISO);
  const fe = dayjs(freeSeg.endISO);
  const bs = dayjs(busySeg.startISO);
  const be = dayjs(busySeg.endISO);

  // không chồng lấn
  if (!(fe.isAfter(bs) && fs.isBefore(be))) return [freeSeg];

  const out = [];
  // phần trái: [fs, min(bs, fe))
  if (bs.isAfter(fs)) {
    const leftEnd = bs.isBefore(fe) ? bs : fe;
    if (leftEnd.isAfter(fs)) {
      out.push({ startISO: fs.toISOString(), endISO: leftEnd.toISOString() });
    }
  }
  // phần phải: (max(be, fs), fe]
  if (be.isBefore(fe)) {
    const rightStart = be.isAfter(fs) ? be : fs;
    if (fe.isAfter(rightStart)) {
      out.push({
        startISO: rightStart.toISOString(),
        endISO: fe.toISOString(),
      });
    }
  }
  return out;
};

/** Trừ nhiều booking khỏi 1 free (booking đã sort theo start) */
const subtractMany = (freeSeg, busyList) => {
  let pieces = [freeSeg];
  for (const b of busyList) {
    const next = [];
    for (const p of pieces) next.push(...subtractInterval(p, b));
    pieces = next;
    if (!pieces.length) break;
  }
  return pieces;
};

/** Map ngày rỗng để luôn render bảng */
const emptyDayMap = (start, end) => {
  const map = new Map();
  for (
    let d = dayjs(start).startOf("day");
    d.isBefore(end) || d.isSame(end, "day");
    d = d.add(1, "day")
  ) {
    map.set(d.format("DD"), []);
  }
  return map;
};

/**
 * Gộp free-time + timeline thành dayDuties cho Grid
 * - CHỈ dùng workTimes trong mỗi booking/timeline item
 * - BỎ hoàn toàn các segment có status === "CANCELLED"
 * - Free-time sẽ bị TRỪ các khoảng booking đã **mở rộng buffer ±BOOKING_BUFFER_MINUTES**
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

  // 1) Booking: flatten workTimes -> interval -> MỞ RỘNG theo buffer -> filter theo range -> sort -> MERGE
  const bookedSegmentsRaw = (bookedSlots || [])
    .flatMap(expandWorkTimes)
    .map(toISOInterval)
    .filter(Boolean)
    .map((iv) => expandIntervalByMinutes(iv, BOOKING_BUFFER_MINUTES))
    .filter((seg) => overlaps(seg.startISO, seg.endISO, start, end))
    .sort((a, b) => a.startISO.localeCompare(b.startISO));

  const bookedSegments = mergeSortedIntervals(bookedSegmentsRaw);

  // 2) Free-time: normalize -> subtract với các booking (đã mở rộng + merge)
  const freeIntervals = (freeSlots || []).map(toISOInterval).filter(Boolean);
  const freeAfterSubtract = freeIntervals.flatMap((f) =>
    subtractMany(f, bookedSegments)
  );

  // 3) Chuẩn hoá FREE thành desc cho UI
  const freeDescs = freeAfterSubtract.map((iv) =>
    normalizeSlot(
      { startAt: iv.startISO, endAt: iv.endISO },
      { isBooking: false }
    )
  );

  // 3b) Chuẩn hoá BOOKING (giờ gốc) + GIỮ META để popup dùng
  const bookedSegmentsWithMeta = (bookedSlots || [])
    .flatMap(expandWorkTimes)
    .map((seg) => ({ ...seg, __iv: toISOInterval(seg) }))
    .filter((x) => x.__iv)
    .filter(({ __iv }) => overlaps(__iv.startISO, __iv.endISO, start, end))
    .sort((a, b) => a.__iv.startISO.localeCompare(b.__iv.startISO));

  const bookedDescs = bookedSegmentsWithMeta.map((seg) => {
    const iv = seg.__iv;
    const base = normalizeSlot(
      { startAt: iv.startISO, endAt: iv.endISO },
      { isBooking: true }
    );
    return {
      ...base,
      // ✅ META cho popup
      availabilityId: seg.availabilityId ?? seg.parentId ?? null,
      parentId: seg.availabilityId ?? seg.parentId ?? null,
      bookingRequestId:
        seg.bookingRequestId ?? seg.requestId ?? seg.bookingId ?? null,
      requestNumber: seg.requestNumber ?? seg.title ?? null,
      status: seg.status ?? base.status,
    };
  });

  // 4) Build day map (luôn render)
  const map = emptyDayMap(start, end);
  const put = (desc) => {
    const k = dayjs(desc.startISO).format("DD");
    if (map.has(k)) map.get(k).push(desc);
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

/* ================== AVATAR RESOLVER (tiện dùng cho UI) ================== */
export const resolveAvatarUrl = (kol) => {
  const raw = kol?.avatarUrl;
  const usages = kol?.fileUsageDtos || [];

  if (raw && /^https?:\/\//i.test(raw)) return raw;

  const byUsageId = raw ? usages.find((u) => u?.id === raw) : null;
  if (byUsageId?.file?.fileUrl) return byUsageId.file.fileUrl;

  const byFileId = raw ? usages.find((u) => u?.file?.id === raw) : null;
  if (byFileId?.file?.fileUrl) return byFileId.file.fileUrl;

  const avatarUsage = usages.find(
    (u) => u?.targetType === "AVATAR" && u?.isActive && u?.file?.fileUrl
  );
  if (avatarUsage?.file?.fileUrl) return avatarUsage.file.fileUrl;

  const cover = usages.find(
    (u) => u?.isCover && u?.isActive && u?.file?.fileUrl
  );
  if (cover?.file?.fileUrl) return cover.file.fileUrl;

  return "";
};

/* ================== MY SINGLE BOOKING REQUESTS (KOL) ================== */
const MY_SINGLE_REQUESTS_ALLOWED_PARAMS = new Set([
  "status",
  "requestNumber",
  "startAt",
  "endAt",
  "createdAtFrom",
  "createdAtTo",
  "page",
  "size",
]);

const MY_SINGLE_REQUESTS_DEFAULT_PARAMS = { page: 0, size: 20 };

const buildMySingleRequestsParams = (params = {}) => {
  const merged = { ...MY_SINGLE_REQUESTS_DEFAULT_PARAMS, ...(params || {}) };

  // Chuẩn hoá yyyy-MM-dd cho các trường ngày (nếu hợp lệ)
  const normalizeDate = (v) => {
    if (!v) return undefined;
    if (dayjs.isDayjs(v)) return v.format("YYYY-MM-DD");
    const d = dayjs(v);
    return d.isValid() ? d.format("YYYY-MM-DD") : undefined;
  };

  const normalized = {
    ...merged,
    startAt: normalizeDate(merged.startAt),
    endAt: normalizeDate(merged.endAt),
    createdAtFrom: normalizeDate(merged.createdAtFrom),
    createdAtTo: normalizeDate(merged.createdAtTo),
  };

  // status: cho phép truyền mảng hoặc string; Swagger là string → FE có thể gửi CSV
  if (Array.isArray(merged.status)) {
    const csv = merged.status
      .filter(Boolean)
      .map(String)
      .map((s) => s.trim())
      .filter(Boolean)
      .join(",");
    normalized.status = csv || undefined;
  } else if (typeof merged.status === "string") {
    normalized.status = merged.status.trim() || undefined;
  }

  if (typeof merged.requestNumber === "string") {
    normalized.requestNumber = merged.requestNumber.trim() || undefined;
  }

  // Loại bỏ key rỗng và chỉ giữ các key được phép
  const out = {};
  for (const [key, value] of Object.entries(normalized)) {
    if (!MY_SINGLE_REQUESTS_ALLOWED_PARAMS.has(key)) continue;
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    out[key] = value;
  }
  return out;
};

export const getMySingleBookingRequests = async ({ signal, params } = {}) => {
  const reqParams = buildMySingleRequestsParams(params);

  const payload = await get({
    url: CLIENT_API_PATHS.BOOKING.mySingleRequestsAll,
    params: reqParams, // ví dụ: { page:0, size:20, status:"IN_PROGRESS,REQUESTED" }
    config: signal ? { signal } : undefined,
  });

  // Hỗ trợ cả envelope { status, message, data } hoặc trả thẳng page object/array
  const raw = payload?.data;
  const data = raw?.data ?? raw;

  if (!data) {
    const empty = {
      content: [],
      totalElements: 0,
      page: 0,
      size: MY_SINGLE_REQUESTS_DEFAULT_PARAMS.size,
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
      : MY_SINGLE_REQUESTS_DEFAULT_PARAMS.size;

  const normalizedResult = { content, totalElements: total, page, size };
  const originalObject =
    data && typeof data === "object" && !Array.isArray(data) ? data : {};

  // Trả về 2 dạng đồng nhất (để nơi dùng dễ đọc .data.content / .content đều OK)
  return {
    ...originalObject,
    ...normalizedResult,
    data: {
      ...originalObject,
      ...normalizedResult,
    },
  };
};

/** GET chi tiết booking single của KOL
 *  Endpoint: /v1/kol/booking/single-requests/detail/{requestId}
 */
export const getKolMySingleRequestDetail = async (
  requestId,
  { signal } = {}
) => {
  if (!requestId) throw new Error("requestId is required");

  const url = CLIENT_API_PATHS.BOOKING.mySingleRequestDetail(
    encodeURIComponent(requestId)
  );

  const payload = await get({
    url,
    config: signal ? { signal } : undefined,
  });

  const raw = payload?.data ?? payload; // hỗ trợ cả 2 dạng
  const appStatus = typeof raw?.status === "number" ? raw.status : 200;

  if (appStatus !== 200) {
    const msg = Array.isArray(raw?.message) ? raw.message[0] : raw?.message;
    const err = new Error(msg || "Không tải được chi tiết yêu cầu.");
    err.appStatus = appStatus;
    throw err;
  }

  return raw?.data ?? raw ?? null;
};

export const changeKolAvatarNew = async (file, opts = {}) => {
  if (!file) throw new Error("file is required");

  const { onUploadProgress, signal } = opts;
  const form = new FormData();

  // BE yêu cầu @RequestParam("fileAvatar")
  form.append("fileAvatar", file, file.name || "avatar.jpg");

  const payload = await post({
    url: CLIENT_API_PATHS.KOL.medias.avatarChangeNew, // /v1/kol/avatar/change/new-image
    data: form,
    config: {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
      ...(signal ? { signal } : {}),
    },
  });

  return payload?.data ?? null;
};

/** Ưu tiên dùng để xem chi tiết booking theo availabilityId (timeline id) */
export const getAvailabilityTimelineById = async (
  availabilityId,
  { signal } = {}
) => {
  if (!availabilityId) throw new Error("availabilityId is required");
  // Gọi trực tiếp endpoint timeline theo id
  const url = `/v1/availabilities/time-line/${encodeURIComponent(
    availabilityId
  )}`;
  const payload = await get({ url, config: signal ? { signal } : undefined });

  const body = payload?.data ?? payload;
  const data = body?.data ?? body;
  // BE đôi khi trả mảng → lấy phần tử đầu
  return Array.isArray(data) ? data[0] ?? null : data ?? null;
};
export const removeKolAvailabilityRange = async ({
  availabilityId,
  startRemove,
  endRemove,
  signal,
} = {}) => {
  if (!availabilityId) throw new Error("availabilityId is required");
  if (!startRemove || !endRemove) {
    throw new Error("startRemove và endRemove là bắt buộc");
  }

  const body = {
    availabilityId,
    startRemove: dayjs.isDayjs(startRemove)
      ? startRemove.toISOString()
      : startRemove,
    endRemove: dayjs.isDayjs(endRemove) ? endRemove.toISOString() : endRemove,
  };

  const res = await post({
    url: CLIENT_API_PATHS.SCHEDULER.kolRemoveRange,
    data: body,
    config: signal ? { signal } : undefined,
  });

  // axios-config interceptor đã toast & trả res.data
  return res;
};
