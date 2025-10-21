import React, { useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/vi";
import TimeColumn from "./TimeColumn";
import DayColumn from "./DayColumn";
import { buildWeekDays } from "../../../utils/schedule";

dayjs.locale("vi");

/** props:
 *  - anchor: "YYYY-MM-DD"
 *  - dataByDate: { 'YYYY-MM-DD': Task[] }
 */
export default function WeekGrid({ anchor, dataByDate = {} }) {
  const days = useMemo(() => buildWeekDays(anchor), [anchor]);

  return (
    <div className="flex border rounded-lg overflow-hidden">
      {/* Time column sticky bên trái */}
      <div className="sticky left-0 top-0 z-20 bg-white">
        <TimeColumn />
      </div>

      {/* Khối ngày có thể scroll nếu cần */}
      <div className="flex-1 flex overflow-auto">
        {days.map((d, idx) => {
          const key = d.format("YYYY-MM-DD");
          return (
            <DayColumn
              key={key}
              isFirst={idx === 0}
              // "ddd" (vi) -> "Th 2", "Th 3"...
              dateLabel={`${d.format("ddd")} ${d.format("DD/MM")}`}
              tasks={dataByDate[key] || []}
              dateISO={key} // (tùy, nếu DayColumn cần)
            />
          );
        })}
      </div>
    </div>
  );
}
