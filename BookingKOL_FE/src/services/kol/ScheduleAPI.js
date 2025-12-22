// src/services/kol/ScheduleAPI.js
import dayjs from "dayjs";
import { get } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

/** ======= CẤU HÌNH BUSINESS RULE (buffer ± phút quanh booking) ======= */
export const BOOKING_BUFFER_MINUTES = 60;

/** ✅ ĐỔI CHỮ HIỂN THỊ "Booking" Ở LIST */
export const DEFAULT_BOOKING_TEXT = "Đã đặt lịch"; // <-- bạn đổi chữ ở đây

/** ===== Worktime status (GIỐNG BẠN GỬI) ===== */
export const WORKTIME_STATUS_LABEL = {
  AVAILABLE: "Sẵn sàng",
  ASSIGNED: "Đã gán",
  IN_PROGRESS: "Đang thực hiện",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  PENDING_ASSIGNMENT: "Chưa có KOL",
  PENDING: "Chờ thực hiện",
};

export const WORKTIME_STATUS_COLOR = {
  AVAILABLE: "processing",
  ASSIGNED: "blue",
  IN_PROGRESS: "processing",
  DELIVERED: "gold",
  COMPLETED: "success",
  CANCELLED: "error",
  PENDING_ASSIGNMENT: "default",
  PENDING: "blue",
};

/** ✅ Map Tag color (antd) -> HEX để tô nền (SchedulerGrid hay dùng HEX) */
const TAG_COLOR_HEX = {
  processing: "#1677ff",
  blue: "#1677ff",
  gold: "#faad14",
  success: "#1677ff",
  error: "#ff4d4f",
  default: "#8c8c8c",
};

/* ================== UTIL: unwrap envelope ================== */
const asArray = (payload) => {
  const d = payload?.data ?? payload ?? [];
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.content)) return d.content;
  if (Array.isArray(d.items)) return d.items;
  return [];
};

const asObject = (payload) => {
  const body = payload?.data ?? payload;
  const data = body?.data ?? body;
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
};

/* ================== STATUS helpers ================== */
const normalizeStatus = (status) => String(status || "").toUpperCase();

const statusTagColor = (status) => {
  const s = normalizeStatus(status);
  return WORKTIME_STATUS_COLOR[s] || "default";
};

const statusColor = (status) => {
  const tag = statusTagColor(status);
  return TAG_COLOR_HEX[tag] || "#4a74da";
};

const isCancelled = (st) => normalizeStatus(st) === "CANCELLED";

/* ================== API THÔ ================== */

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

/** GET /v1/availabilities/time-line/{availabilityId} (cũ) */
export const getAvailabilityTimelineById = async (
  availabilityId,
  { signal } = {}
) => {
  if (!availabilityId) throw new Error("availabilityId is required");
  const payload = await get({
    url: `/v1/availabilities/time-line/${encodeURIComponent(availabilityId)}`,
    config: signal ? { signal } : undefined,
  });
  return asObject(payload);
};

/** ✅ NEW: GET /v1/user/bookings/requests/by-worktime/{kolWorkTimeId} */
export const getBookingRequestByWorktimeId = async (
  kolWorkTimeId,
  { signal } = {}
) => {
  if (!kolWorkTimeId) throw new Error("kolWorkTimeId is required");
  const payload = await get({
    url: `/v1/user/bookings/requests/by-worktime/${encodeURIComponent(
      kolWorkTimeId
    )}`,
    config: signal ? { signal } : undefined,
  });
  return asObject(payload);
};

/* ================== CHUẨN HOÁ & TÍNH TOÁN LỊCH ================== */

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
      if (curEnd.isAfter(lastEnd)) last.endISO = cur.endISO;
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

  if (!(fe.isAfter(bs) && fs.isBefore(be))) return [freeSeg];

  const out = [];
  // trái
  if (bs.isAfter(fs)) {
    const leftEnd = bs.isBefore(fe) ? bs : fe;
    if (leftEnd.isAfter(fs)) {
      out.push({ startISO: fs.toISOString(), endISO: leftEnd.toISOString() });
    }
  }
  // phải
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

/** Map ngày rỗng để luôn render bảng (day: "DD" → []) */
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

/** Join workTimes vào từng booking (flatten từng ca) */
const expandWorkTimes = (item) => {
  if (!Array.isArray(item?.workTimes) || item.workTimes.length === 0) return [];
  return item.workTimes
    .filter((w) => !isCancelled(w?.status))
    .map((w) => ({
      availabilityId: item?.id || item?.availabilityId,

      // ✅ IMPORTANT: đây chính là kolWorkTimeId để gọi API mới
      workTimeId: w?.id,
      kolWorkTimeId: w?.id, // ✅ alias cho rõ nghĩa
      bookingRequestId: w?.bookingRequestId,

      // ✅ thêm vài field để UI dùng nhanh (nếu timeline có)
      bookingType: w?.bookingType || item?.bookingType || null,
      bookingStatus: w?.bookingStatus || item?.bookingStatus || null,
      requestNumber: item?.requestNumber || w?.requestNumber || null,

      // ✅ nếu không có requestNumber/title/note -> dùng DEFAULT_BOOKING_TEXT
      title:
        item?.requestNumber ||
        item?.title ||
        item?.note ||
        DEFAULT_BOOKING_TEXT,
      note: w?.note ?? item?.note,
      status: w?.status,

      startAt: w?.startAt,
      endAt: w?.endAt,
    }));
};

/** Chuẩn hoá slot cho UI (kèm meta để click mở chi tiết) */
const normalizeSlot = (slot, { isBooking, meta } = {}) => {
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

  // ✅ text hiển thị ở list
  const titleLike =
    slot?.title ||
    meta?.title ||
    slot?.description ||
    meta?.note ||
    (isBooking ? DEFAULT_BOOKING_TEXT : "Lịch rảnh");

  const statusLike = isBooking
    ? slot?.status || meta?.status || "PENDING"
    : "FREE";

  const tagColor = isBooking ? statusTagColor(statusLike) : "success";

  return {
    id:
      meta?.workTimeId ||
      slot?.id ||
      `${isBooking ? "B" : "F"}_${startISO}_${endISO}`,

    availabilityId:
      meta?.availabilityId || meta?.parentId || meta?.bookingId || null,

    // ✅ IMPORTANT: giữ workTimeId & alias kolWorkTimeId để popup gọi API mới
    workTimeId: meta?.workTimeId || null,
    kolWorkTimeId: meta?.kolWorkTimeId || meta?.workTimeId || null,

    bookingRequestId: meta?.bookingRequestId || null,

    // ✅ meta loại booking (nếu có)
    bookingType: meta?.bookingType || null,
    bookingStatus: meta?.bookingStatus || null,
    requestNumber: meta?.requestNumber || null,

    description: titleLike,

    // ✅ colorCode = HEX để tô nền; tagColor = token để dùng AntD Tag nếu cần
    colorCode:
      slot?.colorCode || (isBooking ? statusColor(statusLike) : "#34c759"),
    tagColor,

    status: statusLike,
    statusLabel: WORKTIME_STATUS_LABEL[normalizeStatus(statusLike)] || null,
    isBooking: !!isBooking,

    startISO,
    endISO,
    startTime: s.isValid() ? s.format("HH:mm:ss") : "00:00:00",
    endTime: e.isValid() ? e.format("HH:mm:ss") : "00:00:00",
  };
};

/**
 * Gộp free-time + timeline thành cấu trúc dayDuties cho Grid
 * - WorkTimes được flatten thành từng ca
 * - Free-time bị TRỪ các booking (đã mở rộng buffer ±BOOKING_BUFFER_MINUTES)
 * - Booking hiển thị giờ GỐC (không hiển thị phần buffer)
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

  // 1) Booking: flatten + buffer + merge cho mục đích TRỪ free
  const bookedSegmentsRaw = (bookedSlots || [])
    .flatMap(expandWorkTimes)
    .map(toISOInterval)
    .filter(Boolean)
    .map((iv) => expandIntervalByMinutes(iv, BOOKING_BUFFER_MINUTES))
    .filter((seg) => overlaps(seg.startISO, seg.endISO, start, end))
    .sort((a, b) => a.startISO.localeCompare(b.startISO));

  const bookedSegments = mergeSortedIntervals(bookedSegmentsRaw);

  // 2) Free-time: trừ các booking đã mở rộng
  const freeIntervals = (freeSlots || []).map(toISOInterval).filter(Boolean);
  const freeAfterSubtract = freeIntervals.flatMap((f) =>
    subtractMany(f, bookedSegments)
  );

  // 3) Chuẩn hoá list cho UI
  const freeDescs = freeAfterSubtract.map((iv) =>
    normalizeSlot(
      { startAt: iv.startISO, endAt: iv.endISO },
      { isBooking: false }
    )
  );

  // Booking hiển thị giờ gốc (không lấy buffer)
  const bookedExpanded = (bookedSlots || []).flatMap(expandWorkTimes);
  const bookedDisplay = bookedExpanded
    .map((w) => ({ iv: toISOInterval(w), meta: w }))
    .filter(({ iv }) => iv && overlaps(iv.startISO, iv.endISO, start, end))
    .sort((a, b) => a.iv.startISO.localeCompare(b.iv.startISO));

  const bookedDescs = bookedDisplay.map(({ iv, meta }) =>
    normalizeSlot(
      {
        startAt: iv.startISO,
        endAt: iv.endISO,
        title: meta.title,
        description: meta.note,
        status: meta.status,
        id: meta.workTimeId,
      },
      { isBooking: true, meta }
    )
  );

  // 4) Build day map để Grid render
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
