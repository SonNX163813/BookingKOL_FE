import React from "react";
import { HOURS, PX_PER_HOUR, HEADER_H } from "../../../utils/schedule";
import TaskBlock from "./TaskBlock";

export default function DayColumn({ dateLabel, tasks = [], isFirst }) {
  return (
    <div
      className={`flex-1 min-w-[120px] relative box-border ${
        isFirst ? "" : "border-l"
      }`}
    >
      {/* header ngày */}
      <div
        className="sticky top-0 z-10 bg-white/80 backdrop-blur p-2 text-center font-semibold border-b"
        style={{ height: HEADER_H }}
      >
        <div className="leading-[20px]">{dateLabel}</div>
      </div>

      {/* lưới giờ */}
      <div className="relative">
        {HOURS.map((h) => (
          <div key={h} style={{ height: PX_PER_HOUR }} className="border-b" />
        ))}
        {/* tasks absolute: đẩy xuống dưới header */}
        <div className="absolute inset-x-0" style={{ top: HEADER_H }}>
          {tasks.map((t) => (
            <TaskBlock key={t.id} task={t} />
          ))}
        </div>
      </div>
    </div>
  );
}
