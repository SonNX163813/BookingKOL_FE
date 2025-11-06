import React, { useMemo, useState } from "react";
import clsx from "clsx";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
dayjs.extend(isoWeek);

import TaskPopup from "./TaskPopup";

const HOUR_CELL_HEIGHT = 56;
const GAP = 0;
const TOTAL_SLOT_HEIGHT = HOUR_CELL_HEIGHT + GAP;

const WEEKDAY_LABEL = [
  "",
  "THỨ HAI",
  "THỨ BA",
  "THỨ TƯ",
  "THỨ NĂM",
  "THỨ SÁU",
  "THỨ BẢY",
  "CHỦ NHẬT",
];

const timeToMinutes = (time) => {
  if (!time) return 0;
  const [hh, mm] = time.split(":").map((n) => parseInt(n, 10));
  return (isNaN(hh) ? 0 : hh) * 60 + (isNaN(mm) ? 0 : mm);
};
const minutesToPixels = (mins) => (mins / 60) * TOTAL_SLOT_HEIGHT;

export default function DayGrid({ range, dayDuties, fromDate }) {
  const [popupItem, setPopupItem] = useState(null);
  const [popupDayInfo, setPopupDayInfo] = useState(null);

  const hours = Array.from(
    { length: 24 },
    (_, i) => `${String(i).padStart(2, "0")}:00`
  );
  const refDate = dayjs(fromDate);

  const weekDates = useMemo(() => {
    if (range === "week") {
      const start = refDate.startOf("isoWeek");
      return Array.from({ length: 7 }, (_, i) => {
        const d = start.add(i, "day");
        return {
          day: d.format("DD"),
          month: d.format("MM"),
          year: d.format("YYYY"),
          weekday: d.isoWeekday(),
        };
      });
    }
    const d = refDate;
    return [
      {
        day: d.format("DD"),
        month: d.format("MM"),
        year: d.format("YYYY"),
        weekday: d.isoWeekday(),
      },
    ];
  }, [range, refDate]);

  const allLaidOutTasksByDay = useMemo(() => {
    const layouts = new Map();
    weekDates.forEach((weekDate) => {
      const tasksForThisDay =
        dayDuties?.goalList
          ?.find((d) => d?.day === weekDate.day)
          ?.task?.flatMap((g) => g.description) || [];

      if (!tasksForThisDay.length) {
        layouts.set(weekDate.day, []);
        return;
      }

      const events = tasksForThisDay
        .map((t) => {
          const s = (t.startTime || "00:00:00").slice(0, 5);
          const e = (t.endTime || "00:00:00").slice(0, 5);
          return {
            ...t,
            startMinutes: timeToMinutes(s),
            endMinutes: timeToMinutes(e),
            collisions: [],
            columnIndex: null,
          };
        })
        .sort((a, b) => a.startMinutes - b.startMinutes);

      for (let i = 0; i < events.length; i++) {
        for (let j = i + 1; j < events.length; j++) {
          const a = events[i],
            b = events[j];
          if (a.startMinutes < b.endMinutes && a.endMinutes > b.startMinutes) {
            a.collisions.push(b);
            b.collisions.push(a);
          }
        }
      }

      for (const e of events) {
        const occupied = e.collisions
          .map((c) => c.columnIndex)
          .filter((x) => x !== null);
        let col = 0;
        while (occupied.includes(col)) col++;
        e.columnIndex = col;
      }

      const finalTasks = events.map((e) => {
        const top = minutesToPixels(e.startMinutes);
        const duration = Math.max(15, e.endMinutes - e.startMinutes);
        const height = minutesToPixels(duration);

        if (range === "week") {
          const allInvolved = [e, ...e.collisions];
          const totalColumns =
            1 + Math.max(-1, ...allInvolved.map((x) => x.columnIndex));
          const widthPercent = 100 / totalColumns;
          const leftPercent = (e.columnIndex ?? 0) * widthPercent;
          return {
            ...e,
            top,
            height,
            left: `calc(${leftPercent}% - 1px)`,
            width: `calc(${100 - leftPercent}% + 1px)`,
            zIndex: Math.max(10, e.columnIndex ?? 1),
          };
        }
        return {
          ...e,
          top,
          height,
          left: "-1px",
          width: "calc(100% + 2px)",
          zIndex: 10,
        };
      });

      layouts.set(weekDate.day, finalTasks);
    });

    return layouts;
  }, [dayDuties, weekDates, range]);

  const openPopup = (item, weekDate) => {
    setPopupItem(item);
    setPopupDayInfo({
      weekday: WEEKDAY_LABEL[weekDate.weekday],
      day: weekDate.day,
      month: weekDate.month,
      year: weekDate.year,
    });
  };

  const handleClosePopup = () => {
    setPopupItem(null);
    setPopupDayInfo(null);
  };

  const timeZoneOffset = new Date().getTimezoneOffset();
  const offsetHours = -timeZoneOffset / 60;
  const gmtString = `GMT${offsetHours >= 0 ? " +" : ""}${String(
    offsetHours
  ).padStart(2, "0")}`;

  return (
    <div
      className={clsx(
        "w-full flex justify-between px-12 relative",
        range === "week" && "mt-5"
      )}
    >
      <div
        className={`!w-full flex z-10 ${
          range === "day" ? "pl-8" : "pl-21 lg:pl-13"
        }`}
      >
        {weekDates.map((weekDate, i) => {
          const laidOut = allLaidOutTasksByDay.get(weekDate.day) || [];
          return (
            <div
              key={`${weekDate.day}-${weekDate.month}`}
              className={clsx(
                "relative w-full min-h-[1600px]",
                i > 0 && "border-l-[2px] border-l-gray-300"
              )}
              style={{ overflow: "visible" }}
            >
              {weekDates.length <= 1 ? null : (
                <div className="flex flex-col justify-center items-center text-lg font-bold">
                  <p className="uppercase whitespace-nowrap">
                    {WEEKDAY_LABEL[weekDate.weekday]}
                  </p>
                  <p>{weekDate.day}</p>
                </div>
              )}

              <div
                className={clsx(
                  "absolute left-0 right-0 pointer-events-none",
                  range === "day" ? "top-[118px]" : "top-[63px]"
                )}
                style={{
                  bottom: 0,
                  zIndex: 0,
                  backgroundImage:
                    "linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)",
                  backgroundSize: `100% ${TOTAL_SLOT_HEIGHT}px`,
                }}
              />

              <div
                className={clsx(
                  "relative w-full",
                  range === "day" ? "mt-[118px]" : "mt-[63px]"
                )}
              >
                <div className="flex flex-col w-full items-center">
                  {hours.map((hour) => (
                    <div
                      key={`${weekDate.day}-${hour}`}
                      className="relative w-full z-0"
                      style={{ minHeight: `${HOUR_CELL_HEIGHT}px` }}
                    >
                      {i === 0 && (
                        <div
                          className={clsx(
                            "min-w-[100px] flex gap-3 justify-between items-center absolute top-[-15px]",
                            range === "day" ? "left-[-70px]" : "left-[-100px]"
                          )}
                        >
                          <p className="min-w-[45px] !text-[15px] flex-1">
                            {hour}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="absolute top-0 left-0 right-0 bottom-0 z-10">
                  <div
                    className={clsx(
                      "relative h-full",
                      range === "day" ? "ml-13 lg:ml-5" : ""
                    )}
                  >
                    {laidOut.map((item) => {
                      const isBooking =
                        item?.isBooking ||
                        String(item?.status || "")
                          .toLowerCase()
                          .includes("book");
                      const hhmm = (t) => (t ? t.slice(0, 5) : "");
                      return (
                        <div
                          key={item.id}
                          role="button"
                          tabIndex={0}
                          className="absolute cursor-pointer"
                          style={{
                            top: `${item.top}px`,
                            height: `${item.height}px`,
                            minHeight: "22.5px",
                            left: item.left,
                            width: item.width,
                            zIndex: item.zIndex,
                          }}
                          onClick={() => openPopup(item, weekDate)}
                          onKeyDown={(e) =>
                            (e.key === "Enter" || e.key === " ") &&
                            openPopup(item, weekDate)
                          }
                        >
                          <div
                            className="h-full w-full rounded-xl p-2 text-white overflow-hidden border-2 border-white/60 shadow-sm"
                            style={{ backgroundColor: item.colorCode }}
                          >
                            <p className="font-bold text-xs truncate text-white">
                              {isBooking ? item.description : "Lịch rảnh"}
                            </p>
                            {isBooking ? (
                              <p className="text-xs text-white truncate mt-0.5">
                                {hhmm(item.startTime)} – {hhmm(item.endTime)}
                              </p>
                            ) : (
                              <p className="text-xs text-white truncate mt-0.5">
                                Rảnh từ {hhmm(item.startTime)} đến{" "}
                                {hhmm(item.endTime)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 w-full flex flex-col gap-8 absolute left-2 lg:left-[-22px] top-23 z-0">
        <div className="flex justify-center items-center gap-3 h-[56px] w-full !w-[calc(100%-40px)] absolute top-[-48px] lg:left-[30px]">
          <p className="text-[14px] !-mt-12">{gmtString}</p>
          <div className="border-t border-gray-300 flex-1 -mt-12" />
        </div>
      </div>

      <TaskPopup
        isDisplay={!!popupItem}
        goalDetails={popupItem}
        dayInfo={popupDayInfo}
        onClose={handleClosePopup}
        range={range}
        isLastCol={false}
        readOnly
      />
    </div>
  );
}
