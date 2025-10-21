// src/utils/date.js
import dayjs from "dayjs";

// --- Đổi "Mon/Tue..." -> "Thứ 2/3...", và xử lý cả "T2/T3/CN" ---
export const convertToFullWeekday = (weekday, locale = "vi") => {
  if (!weekday) return "";
  const w = String(weekday).trim().toLowerCase();

  // chuẩn hoá vài biến thể thường gặp
  const mapVi = {
    t2: "Thứ 2",
    mon: "Thứ 2",
    monday: "Thứ 2",
    t3: "Thứ 3",
    tue: "Thứ 3",
    tuesday: "Thứ 3",
    t4: "Thứ 4",
    wed: "Thứ 4",
    wednesday: "Thứ 4",
    t5: "Thứ 5",
    thu: "Thứ 5",
    thursday: "Thứ 5",
    t6: "Thứ 6",
    fri: "Thứ 6",
    friday: "Thứ 6",
    t7: "Thứ 7",
    sat: "Thứ 7",
    saturday: "Thứ 7",
    cn: "Chủ nhật",
    sun: "Chủ nhật",
    sunday: "Chủ nhật",
  };

  const mapEn = {
    t2: "Mon",
    mon: "Mon",
    monday: "Mon",
    t3: "Tue",
    tue: "Tue",
    tuesday: "Tue",
    t4: "Wed",
    wed: "Wed",
    wednesday: "Wed",
    t5: "Thu",
    thu: "Thu",
    thursday: "Thu",
    t6: "Fri",
    fri: "Fri",
    friday: "Fri",
    t7: "Sat",
    sat: "Sat",
    saturday: "Sat",
    cn: "Sun",
    sun: "Sun",
    sunday: "Sun",
  };

  if (locale === "en") return mapEn[w] || weekday;
  return mapVi[w] || weekday;
};

// Trả về mảng 1 phần tử: hôm nay, đủ day/month/year
export const getTodayLabel = (locale = "vi", ref = new Date()) => {
  const d = dayjs(ref);
  return [
    {
      weekday: d.format("ddd"), // "Mon" / "T2"... (tuỳ cấu hình locale dayjs)
      day: d.format("DD"),
      month: d.format("MM"),
      year: d.format("YYYY"),
    },
  ];
};

// Trả về 7 ngày của tuần chứa 'ref'
// Nếu muốn tuần bắt đầu Thứ 2 thì dùng startOf("week").add(1,"day")
export const getWeekDays = (ref = new Date(), startOnMonday = false) => {
  let start = dayjs(ref).startOf("week");
  if (startOnMonday) start = start.add(1, "day");
  return Array.from({ length: 7 }, (_, i) => {
    const d = start.add(i, "day");
    return {
      weekday: d.format("ddd"),
      day: d.format("DD"),
      month: d.format("MM"),
      year: d.format("YYYY"),
    };
  });
};

// Lưới tháng 6x7, đủ fullDate + cờ isCurrentMonth
export const getCalendarGridDays = (anchorIso) => {
  const anchor = anchorIso ? dayjs(anchorIso) : dayjs();
  // nếu muốn lưới bắt đầu T2: .startOf("month").startOf("week").add(1,"day")
  const start = anchor.startOf("month").startOf("week");
  const cells = 42; // 6 hàng x 7 cột
  return Array.from({ length: cells }, (_, i) => {
    const d = start.add(i, "day");
    return {
      fullDate: d.format("YYYY-MM-DD"),
      day: d.format("DD"),
      month: d.format("MM"),
      year: d.format("YYYY"),
      isCurrentMonth: d.month() === anchor.month(),
    };
  });
};
