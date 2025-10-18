import React, { useMemo } from "react";
import dayjs from "dayjs";
import TimeColumn from "./TimeColumn";
import DayColumn from "./DayColumn";
import { buildWeekDays } from "../../../utils/schedule";

/** props:
 *  - anchor: "YYYY-MM-DD"
 *  - dataByDate: { 'YYYY-MM-DD': Task[] }
 */
export default function WeekGrid({ anchor, dataByDate = {} }) {
  const days = useMemo(() => buildWeekDays(anchor), [anchor]);

  return (
    <div className="flex border rounded-lg overflow-hidden box-border">
      <TimeColumn />
      <div className="flex-1 flex">
        {days.map((d, idx) => {
          const key = d.format("YYYY-MM-DD");
          return (
            <DayColumn
              key={key}
              isFirst={idx === 0}
              dateLabel={`${d.format("dd").toUpperCase()} ${d.format("DD/MM")}`}
              tasks={dataByDate[key] || []}
            />
          );
        })}
      </div>
    </div>
  );
}
