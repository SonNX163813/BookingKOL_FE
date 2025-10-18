// src/components/scheduler/MonthGrid.jsx
import React, { useState } from "react";
import clsx from "clsx";
import { Tooltip } from "antd";
import TaskPopup from "./TaskPopup";
import DayTasksPopup from "./DayTasksPopup";
import { getCalendarGridDays } from "../../../utils/date";

export default function MonthGrid({ dayDuties, range }) {
  const calendarDays = getCalendarGridDays();
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const [popupIndex, setPopupIndex] = useState("");
  const [viewedDay, setViewedDay] = useState(null);

  if (!dayDuties) return null;

  const handleCloseAllPopups = () => {
    setPopupIndex("");
    setViewedDay(null);
  };

  return (
    <>
      <div className="w-full">
        <div className="w-full rounded-2xl p-4 min-w-[900px]">
          <div className="grid grid-cols-7 gap-2">
            {weekdays.map((day) => (
              <div
                key={day}
                className="text-center font-bold text-xl pb-2 uppercase"
              >
                {day}
              </div>
            ))}

            {calendarDays.map((day, i) => {
              const allDescriptions =
                dayDuties.goalList
                  ?.find((it) => it.day === day.day && day.isCurrentMonth)
                  ?.task?.flatMap((it) => it.description)
                  ?.sort((a, b) => a.startTime.localeCompare(b.startTime)) ||
                [];

              const visibleDescriptions = allDescriptions.slice(0, 3);
              const hiddenCount = allDescriptions.length - 3;

              const weekDate = {
                weekday: weekdays[i % 7] || "",
                day: day.day,
                month: day.month,
                year: day.year,
              };

              return (
                <div
                  key={day.fullDate}
                  className={clsx(
                    "relative bg-white rounded-xl flex flex-col p-2 min-h-[120px] transition-all cursor-default",
                    !day.isCurrentMonth && "opacity-40"
                  )}
                >
                  <p className="font-bold text-sm">{day.day}</p>
                  <div className="flex flex-col gap-0.5 mt-1">
                    {visibleDescriptions.map((item) => (
                      <div
                        key={item.id}
                        className="relative flex items-center gap-1 w-full rounded p-0.5"
                        onClick={() => setPopupIndex(item.id)}
                        role="button"
                        tabIndex={0}
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.colorCode }}
                        />
                        <Tooltip title={item.description}>
                          <p className="truncate text-xs font-semibold">
                            {item.description}
                          </p>
                        </Tooltip>
                      </div>
                    ))}
                  </div>

                  {hiddenCount > 0 && (
                    <p
                      className="!text-xs mt-auto text-blue-600 cursor-pointer font-semibold"
                      onClick={() =>
                        setViewedDay({ tasks: allDescriptions, weekDate })
                      }
                    >
                      Xem thêm...
                    </p>
                  )}

                  {popupIndex ===
                    visibleDescriptions.find((t) => t.id === popupIndex)
                      ?.id && (
                    <TaskPopup
                      range={range}
                      onClose={handleCloseAllPopups}
                      isDisplay={true}
                      goalDetails={visibleDescriptions.find(
                        (t) => t.id === popupIndex
                      )}
                      dayInfo={weekDate}
                      isLastCol={i % 7 >= 5}
                      readOnly
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <DayTasksPopup details={viewedDay} onClose={() => setViewedDay(null)} />
    </>
  );
}
