import dayjs from "dayjs";

export const HEADER_H = 44; // chiều cao header cột ngày
export const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const PX_PER_HOUR = 60;
export const PX_PER_MIN = PX_PER_HOUR / 60;

export const buildWeekDays = (anchorISO) => {
  const start = dayjs(anchorISO).startOf("isoWeek");
  return Array.from({ length: 7 }, (_, i) => start.add(i, "day"));
};

// chuẩn hoá "HH:mm:ss" từ ISO hoặc "HH:mm(:ss)"
export const toHms = (s) => {
  if (!s) return "00:00:00";
  const iso = dayjs(s);
  if (iso.isValid()) return iso.format("HH:mm:ss");
  const m = String(s).match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (m) {
    const h = String(m[1]).padStart(2, "0");
    const mi = String(m[2]).padStart(2, "0");
    const se = m[3] ? String(m[3]).padStart(2, "0") : "00";
    return `${h}:${mi}:${se}`;
  }
  return "00:00:00";
};

export const toMinutes = (hms) => {
  const [h, m, s = "0"] = (hms || "00:00:00").split(":").map(Number);
  return (h || 0) * 60 + (m || 0) + Math.floor((s || 0) / 60);
};

export const blockStyle = (startTime, endTime) => {
  const top = toMinutes(startTime) * PX_PER_MIN;
  const height = Math.max(
    30,
    (toMinutes(endTime) - toMinutes(startTime)) * PX_PER_MIN
  );
  return { top, height };
};

// màu theo status (tùy chỉnh)
export const STATUS_COLORS = {
  AVAILABLE: "#5FB878",
  BUSY: "#FF9F43",
  BOOKED: "#4C8DF6",
  OFF: "#C9CBD1",
  PENDING: "#B36BFF",
  string: "#4C8DF6", // khi swagger đang mock "string"
};

// Chuẩn hoá dữ liệu API timeline → { 'YYYY-MM-DD': Task[] }
export const normalizeTimelineByDate = (apiData = []) => {
  const map = {};
  apiData.forEach((a) => {
    const dayKey = dayjs(a.startAt || a.endAt || new Date()).format(
      "YYYY-MM-DD"
    );
    const baseColor = STATUS_COLORS[a.status] || "#6b9cff";

    const pushTask = (t) => {
      if (!map[dayKey]) map[dayKey] = [];
      map[dayKey].push(t);
    };

    if (Array.isArray(a.timeLine) && a.timeLine.length) {
      a.timeLine.forEach((tl) => {
        const st = toHms(tl.start);
        const en = toHms(tl.end);
        pushTask({
          id: tl.id || `${a.id}-${st}-${en}`,
          description: tl.note || a.note || tl.status || a.status,
          startTime: st,
          endTime: en,
          color: STATUS_COLORS[tl.status] || baseColor,
          isDone: false,
        });
      });
    } else {
      const st = toHms(a.startAt);
      const en = toHms(a.endAt);
      pushTask({
        id: a.id,
        description: a.note || a.status,
        startTime: st,
        endTime: en,
        color: baseColor,
        isDone: false,
      });
    }
  });
  return map;
};
