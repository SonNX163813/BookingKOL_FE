// src/components/scheduler/MonthGrid.jsx
import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import TaskPopup from "./TaskPopup";
import DayTasksPopup from "./DayTasksPopup";
import clsx from "clsx";
import { Tooltip } from "antd";
import { useTranslation } from "react-i18next";

dayjs.extend(isoWeek);

const BORDER = "#93cef6";
const OUTER_BG = "#eef6ff";

const WEEKDAYS_MON2SUN = [
  "THỨ HAI",
  "THỨ BA",
  "THỨ TƯ",
  "THỨ NĂM",
  "THỨ SÁU",
  "THỨ BẢY",
  "CHỦ NHẬT",
];

// Tạo grid tháng bắt đầu từ THỨ HAI (isoWeek)
function buildMonthDaysMondayFirst(fromDate) {
  const m = dayjs(fromDate);
  const start = m.startOf("month").startOf("isoWeek");
  const end = m.endOf("month").endOf("isoWeek");
  const days = [];
  for (
    let d = start;
    d.isBefore(end) || d.isSame(end, "day");
    d = d.add(1, "day")
  ) {
    days.push({
      fullDate: d.format("YYYY-MM-DD"),
      day: d.format("DD"),
      month: d.format("MM"),
      year: d.format("YYYY"),
      isCurrentMonth: d.month() === m.month(),
      isoWeekday: d.isoWeekday(), // 1..7 (Mon..Sun)
    });
  }
  return days;
}

export default function MonthGrid({ dayDuties, range, fromDate }) {
  const days = buildMonthDaysMondayFirst(fromDate);

  const { t } = useTranslation();
  const tWeekdays = t("calendar.weekdaysUpperMon2Sun", { returnObjects: true });
  const weekdays =
    Array.isArray(tWeekdays) && tWeekdays.length === 7
      ? tWeekdays
      : WEEKDAYS_MON2SUN;

  const [popupIndex, setPopupIndex] = useState("");
  const [viewedDay, setViewedDay] = useState(null);

  // Chia theo tuần & bỏ hàng cuối nếu toàn ngày ngoài tháng
  const weeks = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < days.length; i += 7) chunks.push(days.slice(i, i + 7));
    if (
      chunks.length &&
      chunks[chunks.length - 1].every((d) => !d.isCurrentMonth)
    ) {
      chunks.pop();
    }
    return chunks;
  }, [days]);

  if (!dayDuties) return null;

  const handleCloseAllPopups = (e) => {
    if (e) e.stopPropagation();
    setPopupIndex("");
  };

  return (
    <>
      <div className="w-full">
        <div
          className="w-full rounded-3xl p-3 md:p-4"
          style={{
            border: `2px solid ${BORDER}`,
            background: OUTER_BG,
            height: "calc(100vh - 180px)",
            minHeight: 480,
          }}
        >
          {/* Header thứ (Mon→Sun) */}
          <div className="grid grid-cols-7 gap-2 md:gap-3 px-1 pb-2">
            {weekdays.map((day) => (
              <div
                key={day}
                className="text-center font-bold text-[12px] md:text-[13px] leading-tight text-[#1f4e8c]"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Lưới theo tuần (Mon→Sun) */}
          <div className="flex flex-col gap-2 md:gap-3 h-[calc(100%-40px)]">
            {weeks.map((row, rowIdx) => (
              <div
                key={rowIdx}
                className="grid grid-cols-7 gap-2 md:gap-3 flex-1 min-h-0"
              >
                {row.map((day, colIdx) => {
                  const allDescriptions =
                    dayDuties.goalList
                      .find((it) => it.day === day.day && day.isCurrentMonth)
                      ?.task.flatMap((it) => it.description)
                      .sort((a, b) => a.startTime.localeCompare(b.startTime)) ||
                    [];

                  const visible = allDescriptions.slice(0, 3);
                  const hiddenCount = allDescriptions.length - 3;

                  const weekDate = {
                    weekday: weekdays[colIdx], // Mon..Sun
                    day: day.day,
                    month: day.month,
                    year: day.year,
                  };

                  return (
                    <div
                      key={day.fullDate}
                      className={clsx(
                        "rounded-xl bg-white flex flex-col p-1.5 md:p-2 min-h-0 overflow-hidden transition-shadow",
                        !day.isCurrentMonth && "opacity-45",
                        "hover:shadow-sm"
                      )}
                      style={{ border: `1.5px solid ${BORDER}` }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-[12px] md:text-[13px] text-[#1f4e8c]">
                          {day.day}
                        </p>
                      </div>

                      <div className="flex flex-col gap-0.5 mt-1 flex-1 min-h-0">
                        {visible.map((item) => {
                          const isBooking =
                            item?.isBooking ||
                            String(item?.status || "")
                              .toLowerCase()
                              .includes("book");
                          const hhmm = (t) => (t ? t.slice(0, 5) : "");

                          return (
                            <div
                              key={item.id}
                              className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-gray-50 cursor-pointer"
                              onClick={() => setPopupIndex(item.id)}
                              role="button"
                              tabIndex={0}
                            >
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: item.colorCode }}
                              />
                              <Tooltip title={item.description}>
                                <p className="truncate text-[11px] md:text-[12px] font-medium text-[#1f335c]">
                                  {isBooking
                                    ? `${hhmm(item.startTime)}–${hhmm(
                                        item.endTime
                                      )} ${item.description}`
                                    : `Rảnh từ ${hhmm(
                                        item.startTime
                                      )} đến ${hhmm(item.endTime)}`}
                                </p>
                              </Tooltip>
                            </div>
                          );
                        })}
                      </div>

                      {hiddenCount > 0 && (
                        <div className="mt-2 pl-[12px]">
                          <p
                            className="text-[11px] md:text-[12px] leading-1 text-[#0b60d0] cursor-pointer font-semibold"
                            onClick={() =>
                              setViewedDay({ tasks: allDescriptions, weekDate })
                            }
                          >
                            Xem thêm...
                          </p>
                        </div>
                      )}

                      {popupIndex ===
                        visible.find((t) => t.id === popupIndex)?.id && (
                        <TaskPopup
                          range={range}
                          onClose={handleCloseAllPopups}
                          isDisplay={true}
                          goalDetails={visible.find((t) => t.id === popupIndex)}
                          dayInfo={weekDate}
                          isLastCol={colIdx >= 5}
                          readOnly
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <DayTasksPopup details={viewedDay} onClose={() => setViewedDay(null)} />
    </>
  );
}
