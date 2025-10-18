import React from "react";
import { HOURS, PX_PER_HOUR, HEADER_H } from "../../../utils/schedule";

export default function TimeColumn() {
  return (
    <div className="w-16 shrink-0 text-[11px] text-gray-500 box-border">
      {/* spacer để khớp header cột ngày */}
      <div
        style={{ height: HEADER_H }}
        className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b"
      />
      <div className="relative">
        {HOURS.map((h) => (
          <div
            key={h}
            style={{ height: PX_PER_HOUR }}
            className="relative border-b"
          >
            <div className="absolute -top-2 right-1">
              {String(h).padStart(2, "0")}:00
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
