// src/services/kol/ScheduleAPI.js
import dayjs from "dayjs";
import { get } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

/** ======= CẤU HÌNH BUSINESS RULE (buffer ± phút quanh booking) ======= */
export const BOOKING_BUFFER_MINUTES = 60;

/* ================== UTIL: unwrap các dạng envelope khác nhau ================== */
const asArray = (payload) => {
  const d = payload?.data ?? payload ?? [];
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.content)) return d.content;
  if (Array.isArray(d.items)) return d.items;
  return [];
};

/* ================== COLOR theo status ================== */
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

const isCancelled = (st) => String(st || "").toUpperCase() === "CANCELLED";

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

/** GET /v1/availabilities/time-line/{availabilityId} */
export const getAvailabilityTimelineById = async (
  availabilityId,
  { signal } = {}
) => {
  if (!availabilityId) throw new Error("availabilityId is required");
  const payload = await get({
    url: `/v1/availabilities/time-line/${encodeURIComponent(availabilityId)}`,
    config: signal ? { signal } : undefined,
  });
  const body = payload?.data ?? payload;
  const data = body?.data ?? body;
  // Một số BE trả mảng → lấy phần tử đầu
  if (Array.isArray(data)) return data[0] ?? null;
  return data ?? null;
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
      workTimeId: w?.id,
      bookingRequestId: w?.bookingRequestId,

      title: item?.requestNumber || item?.title || item?.note || "Booking",
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

  const titleLike =
    slot?.title ||
    meta?.title ||
    slot?.description ||
    meta?.note ||
    (isBooking ? "Booking" : "Lịch rảnh");

  const statusLike = isBooking
    ? slot?.status || meta?.status || "BOOKED"
    : "FREE";

  return {
    id:
      meta?.workTimeId ||
      slot?.id ||
      `${isBooking ? "B" : "F"}_${startISO}_${endISO}`,
    availabilityId:
      meta?.availabilityId || meta?.parentId || meta?.bookingId || null,
    workTimeId: meta?.workTimeId || null,
    bookingRequestId: meta?.bookingRequestId || null,

    description: titleLike,
    colorCode:
      slot?.colorCode || (isBooking ? statusColor(statusLike) : "#34c759"),
    status: statusLike,
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
