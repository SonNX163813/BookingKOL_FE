// src/services/admin/AdminScheduleAPI.js
import { get, post } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";
import dayjs from "dayjs";

const BOOKING_BUFFER_MINUTES = 60;
const S_PATHS = API_PATHS.SCHEDULER_ADMIN;

/* ================== Helpers ================== */
const asArray = (payload) => {
  const d = payload?.data ?? payload ?? [];
  if (Array.isArray(d)) return d;
  if (Array.isArray(d.content)) return d.content;
  if (Array.isArray(d.items)) return d.items;
  return [];
};

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

const expandIntervalByMinutes = (iv, minutes) => {
  const s = dayjs(iv.startISO).subtract(minutes, "minute");
  const e = dayjs(iv.endISO).add(minutes, "minute");
  return { startISO: s.toISOString(), endISO: e.toISOString() };
};

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
      if (curEnd.isAfter(lastEnd)) last.endISO = cur.endISO;
    } else {
      out.push(Object.assign({}, cur));
    }
  }
  return out;
};

const subtractInterval = (freeSeg, busySeg) => {
  const fs = dayjs(freeSeg.startISO);
  const fe = dayjs(freeSeg.endISO);
  const bs = dayjs(busySeg.startISO);
  const be = dayjs(busySeg.endISO);
  if (!(fe.isAfter(bs) && fs.isBefore(be))) return [freeSeg];

  const out = [];
  if (bs.isAfter(fs)) {
    const leftEnd = bs.isBefore(fe) ? bs : fe;
    if (leftEnd.isAfter(fs)) {
      out.push({ startISO: fs.toISOString(), endISO: leftEnd.toISOString() });
    }
  }
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

const isCancelled = (st) => String(st || "").toUpperCase() === "CANCELLED";

const expandWorkTimes = (item) => {
  if (!Array.isArray(item?.workTimes) || item.workTimes.length === 0) return [];
  return item.workTimes
    .filter((w) => !isCancelled(w?.status))
    .map((w) => ({
      parentId: item?.id ?? item?.requestId ?? item?.bookingId,
      bookingId: item?.id ?? item?.requestId ?? item?.bookingId,
      ...w,
      startAt: w.startAt,
      endAt: w.endAt,
      id: w.id || `${item?.id}_${w.startAt}_${w.endAt}`,
      title: item?.title || item?.requestNumber || item?.note || "Booking",
      description: item?.note ?? w?.note ?? "Ca booking",
      status: w?.status,
    }));
};

const statusColor = (status) => {
  const s = String(status || "").toUpperCase();
  switch (s) {
    case "IN_PROGRESS":
      return "#f59e0b";
    case "COMPLETED":
    case "DONE":
      return "#10b981";
    case "PENDING":
      return "#60a5fa";
    default:
      return "#4a74da";
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
/* ================== /Helpers ================== */

/** GET (Admin) /v1/admin/availabilities/free-time/{kolId} */
export const adminGetKolFreeTime = async ({
  kolId,
  startDate,
  endDate,
  signal,
} = {}) => {
  if (!kolId) throw new Error("kolId is required");
  const payload = await get({
    url: `${S_PATHS.kolFreeTime}/${encodeURIComponent(kolId)}`,
    params: { startDate, endDate },
    config: signal ? { signal } : undefined,
  });
  return asArray(payload);
};

/** GET (Admin) /v1/admin/availabilities/time-line/kol/{kolId} */
export const adminGetKolTimeline = async ({
  kolId,
  startDate,
  endDate,
  page = 0,
  size = 1000,
  signal,
} = {}) => {
  if (!kolId) throw new Error("kolId is required");
  const payload = await get({
    url: `${S_PATHS.kolTimeline}/${encodeURIComponent(kolId)}`,
    params: { startDate, endDate, page, size },
    config: signal ? { signal } : undefined,
  });
  return asArray(payload);
};

/** Kết hợp free-time + timeline thành { goalList } (Admin) */
export const adminFetchKolDayDuties = async ({
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
    adminGetKolFreeTime({
      kolId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      signal,
    }),
    adminGetKolTimeline({
      kolId,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      page: 0,
      size: 1000,
      signal,
    }),
  ]);

  // 1) Booking thêm buffer ±60' và merge
  const bookedSegmentsRaw = (bookedSlots || [])
    .flatMap(expandWorkTimes)
    .map(toISOInterval)
    .filter(Boolean)
    .map((iv) => expandIntervalByMinutes(iv, BOOKING_BUFFER_MINUTES))
    .filter((seg) => overlaps(seg.startISO, seg.endISO, start, end))
    .sort((a, b) => a.startISO.localeCompare(b.startISO));

  const bookedSegments = mergeSortedIntervals(bookedSegmentsRaw);

  // 2) Free-time trừ booking đã mở rộng
  const freeIntervals = (freeSlots || []).map(toISOInterval).filter(Boolean);
  const freeAfterSubtract = freeIntervals.flatMap((f) =>
    subtractMany(f, bookedSegments)
  );

  // 3) Chuẩn hoá cho UI
  const freeDescs = freeAfterSubtract.map((iv) =>
    normalizeSlot(
      { startAt: iv.startISO, endAt: iv.endISO },
      { isBooking: false }
    )
  );

  // Booking hiển thị giờ gốc (không hiển thị phần buffer)
  const bookedDisplayIntervals = (bookedSlots || [])
    .flatMap(expandWorkTimes)
    .map(toISOInterval)
    .filter(Boolean)
    .filter((seg) => overlaps(seg.startISO, seg.endISO, start, end))
    .sort((a, b) => a.startISO.localeCompare(b.startISO));

  const bookedDescs = bookedDisplayIntervals.map((iv) =>
    normalizeSlot(
      { startAt: iv.startISO, endAt: iv.endISO },
      { isBooking: true }
    )
  );

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
/**
 * POST (Admin) /v1/availabilities/admin/schedule
 * Admin tạo lịch rảnh + lịch làm (workTimes) giống hệt nhau cho KOL.
 */
export const adminRegisterKolSchedule = async ({ kolId, shifts, signal }) => {
  if (!kolId) throw new Error("kolId is required");
  if (!Array.isArray(shifts) || shifts.length === 0)
    throw new Error("`shifts` must be a non-empty array");

  const url = S_PATHS.adminSchedule;
  const results = [];

  for (let i = 0; i < shifts.length; i++) {
    const s = shifts[i];
    if (!s.start || !s.end) {
      throw new Error(`Thiếu thời gian cho ca ${i + 1}`);
    }

    const start = dayjs(s.start);
    const end = dayjs(s.end);

    if (!start.isValid() || !end.isValid() || !end.isAfter(start)) {
      throw new Error(`Khoảng thời gian ca ${i + 1} không hợp lệ`);
    }

    const startISO = start.toISOString();
    const endISO = end.toISOString();

    const body = {
      kolId,
      startAt: startISO,
      endAt: endISO,
      status: "AVAILABLE",
      note: "",
      workTimes: [
        {
          startAt: startISO,
          endAt: endISO,
          status: "AVAILABLE",
          note: "",
        },
      ],
    };

    try {
      const res = await post({
        url,
        data: body,
        config: signal ? { signal } : undefined,
      });
      results.push(res?.data ?? res);
    } catch (e) {
      const httpStatus = e?.response?.status;
      const payload = e?.response?.data;

      const beMsg =
        payload?.message ||
        (Array.isArray(payload?.messages) && payload.messages[0]) ||
        "";

      const label = `${start.format("HH:mm")}–${end.format(
        "HH:mm"
      )}, ${start.format("DD/MM/YYYY")}`;

      const friendly =
        beMsg ||
        `Ca ${i + 1} (${label}) bị trùng với lịch khác hoặc không hợp lệ.`;

      const err = new Error(friendly);
      err.status = httpStatus || 400;
      err.conflict = httpStatus === 400 || httpStatus === 409;
      err.conflictShift = { index: i, startAt: startISO, endAt: endISO };
      throw err;
    }
  }

  return results;
};
