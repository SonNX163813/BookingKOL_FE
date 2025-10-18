// src/components/scheduler/DayGrid.jsx
import React, { useMemo, useState } from "react";
import clsx from "clsx";
import dayjs from "dayjs";
import {
  convertToFullWeekday,
  getTodayLabel,
  getWeekDays,
} from "../../../utils/date";
import TaskPopup from "./TaskPopup";

const HOUR_CELL_HEIGHT = 60;
const GAP = 2;
const TOTAL_SLOT_HEIGHT = HOUR_CELL_HEIGHT + GAP;

const timeToMinutes = (time) => {
  const [hh, mm] = (time || "00:00").split(":").map((n) => parseInt(n, 10));
  return (hh || 0) * 60 + (mm || 0);
};
const minutesToPixels = (mins) => (mins / 60) * TOTAL_SLOT_HEIGHT;

export default function DayGrid({ range, dayDuties }) {
  const [popupIndex, setPopupIndex] = useState("");
  const hours = Array.from(
    { length: 24 },
    (_, i) => `${String(i).padStart(2, "0")}:00`
  );

  const refDate = dayjs().toDate();
  const weekDates = useMemo(() => {
    if (range === "week") return getWeekDays(refDate, "vi");
    return getTodayLabel("vi", refDate);
  }, [range]);

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
        .map((t) => ({
          ...t,
          startMinutes: timeToMinutes((t.startTime || "00:00:00").slice(0, 5)),
          endMinutes: timeToMinutes((t.endTime || "00:00:00").slice(0, 5)),
          collisions: [],
          columnIndex: null,
        }))
        .sort((a, b) => a.startMinutes - b.startMinutes);

      // overlap
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
      // column
      for (const e of events) {
        const occupied = e.collisions
          .map((c) => c.columnIndex)
          .filter((x) => x !== null);
        let col = 0;
        while (occupied.includes(col)) col++;
        e.columnIndex = col;
      }
      // layout
      const finalTasks = events.map((e) => {
        const allInvolved = [e, ...e.collisions];
        const totalColumns =
          1 + Math.max(-1, ...allInvolved.map((x) => x.columnIndex));
        const width = 100 / totalColumns;
        const left = e.columnIndex * width;
        const top = minutesToPixels(e.startMinutes);
        const duration = Math.max(15, e.endMinutes - e.startMinutes);
        const height = minutesToPixels(duration);
        return { ...e, top, height, left, width, zIndex: e.columnIndex };
      });

      layouts.set(weekDate.day, finalTasks);
    });

    return layouts;
  }, [dayDuties, weekDates]);

  const handleClosePopup = () => setPopupIndex("");

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
              className={`w-full min-h-[1600px] ${
                i > 0 ? "border-l-[2px] border-l-gray-300" : ""
              }`}
              key={`${weekDate.day}-${weekDate.month}`}
            >
              {weekDates.length <= 1 ? null : (
                <div className="flex flex-col justify-center items-center text-xl font-bold">
                  <p className="uppercase whitespace-nowrap">
                    {convertToFullWeekday(weekDate.weekday)}
                  </p>
                  <p>{weekDate.day}</p>
                </div>
              )}

              <div
                className={`relative w-full ${
                  range === "day" ? "mt-[118px]" : "mt-[63px]"
                }`}
              >
                <div className="flex flex-col w-full gap-1 items-center">
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="border-t-[2.5px] border-t-gray-300 flex items-start w-full relative"
                      style={{ minHeight: `${HOUR_CELL_HEIGHT}px` }}
                    >
                      {i === 0 && (
                        <div
                          className={`min-w-[100px] flex gap-3 justify-between items-center absolute top-[-15px] ${
                            range === "day" ? "left-[-70px]" : "left-[-100px]"
                          }`}
                        >
                          <p className="min-w-[45px] !text-xl flex-1">{hour}</p>
                          {range === "week" && (
                            <div className="border-t-[2.5px] border-t-gray-300 w-[15%]"></div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* layer events */}
                <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none">
                  <div
                    className={`relative h-full ${
                      range === "day" ? "ml-13 lg:ml-5" : ""
                    }`}
                  >
                    {laidOut.map((item) => (
                      <div
                        key={item.id}
                        role="button"
                        tabIndex={0}
                        className="absolute pointer-events-auto cursor-pointer"
                        style={{
                          top: `${item.top}px`,
                          height: `${item.height}px`,
                          minHeight: "22.5px",
                          left: `${item.left}%`,
                          width: `${item.width}%`,
                          zIndex: item.zIndex,
                        }}
                        onClick={() => setPopupIndex(item.id)}
                      >
                        <div
                          className="h-full w-full rounded-md p-2 text-white overflow-hidden border-2 border-white"
                          style={{ backgroundColor: item.colorCode }}
                        >
                          <p className="font-bold !text-xs truncate">
                            {item.description}
                          </p>
                          <p className="text-xs truncate">
                            {item.startTime.slice(0, 5)} -{" "}
                            {item.endTime.slice(0, 5)}
                          </p>
                        </div>
                        {popupIndex === item.id && (
                          <TaskPopup
                            isDisplay={true}
                            onClose={handleClosePopup}
                            goalDetails={item}
                            dayInfo={weekDate}
                            range={range}
                            isLastCol={i >= 5}
                            readOnly
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Header GMT line */}
      <div
        className={
          "mt-3 w-full flex flex-col gap-8 absolute left-2 lg:left-[-22px] top-23 z-0"
        }
      >
        <div
          className={`absolute h-[1580px] border-l-[2px] border-l-gray-300 left-31 top-[-76px]  ${
            weekDates.length <= 1 ? "" : "top-12"
          }`}
        ></div>
        <div
          className={
            "flex justify-center items-center gap-3 h-[56px] w-full !w-[calc(100%-40px)] absolute top-[-48px] lg:left-[30px]"
          }
        >
          <p className={"text-[14px] !-mt-12"}>{gmtString}</p>
          <div
            className={
              "border-t-[2.5px] border-t-gray-300 flex-1 mr-2 lg:mr-4.5 -mt-12"
            }
          ></div>
        </div>
      </div>
    </div>
  );
}
