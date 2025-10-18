import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
dayjs.extend(isoWeek);

export const convertToFullWeekday = (weekday) => {
  // nhận "Mon", "Tue"... hoặc "Thứ 2", "Thứ 3" -> trả ra chữ in hoa tùy bạn
  return String(weekday || "").toUpperCase();
};

export const getTodayLabel = (lang, refDate = new Date()) => {
  const d = dayjs(refDate);
  return [
    {
      weekday: d.format("ddd"), // Mon/Tue...
      day: d.format("D"),
      month: d.format("M"),
      year: d.format("YYYY"),
    },
  ];
};

export const getWeekDays = (refDate = new Date(), lang = "vi") => {
  const start = dayjs(refDate).startOf("isoWeek");
  return Array.from({ length: 7 }, (_, i) => {
    const d = start.add(i, "day");
    return {
      weekday: d.format("ddd"),
      day: d.format("D"),
      month: d.format("M"),
      year: d.format("YYYY"),
    };
  });
};

// Dùng cho MonthGrid: trả về mảng 6*7 ô
export const getCalendarGridDays = (
  fromDateYmd = dayjs().format("YYYY-MM-DD")
) => {
  const d = dayjs(fromDateYmd);
  const startOfMonth = d.startOf("month");
  const endOfMonth = d.endOf("month");

  const startGrid = startOfMonth.startOf("week");
  const endGrid = endOfMonth.endOf("week");

  const days = [];
  let cur = startGrid.clone();
  while (cur.isBefore(endGrid) || cur.isSame(endGrid, "day")) {
    days.push({
      fullDate: cur.format("YYYY-MM-DD"),
      day: cur.format("D"),
      month: cur.format("MM"),
      year: cur.format("YYYY"),
      isCurrentMonth: cur.month() === d.month(),
    });
    cur = cur.add(1, "day");
  }
  return days;
};
