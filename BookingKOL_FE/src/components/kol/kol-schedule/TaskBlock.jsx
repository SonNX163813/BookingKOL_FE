import React from "react";
import { blockStyle } from "../../../utils/schedule";

export default function TaskBlock({ task }) {
  const st = blockStyle(task.startTime, task.endTime);
  return (
    <div
      className="absolute left-1 right-1 rounded-md px-2 py-1 text-white text-xs shadow"
      style={{
        top: st.top,
        height: st.height,
        background: task.color || "#6b9cff",
      }}
      title={`${task.description} • ${task.startTime?.slice(
        0,
        5
      )} - ${task.endTime?.slice(0, 5)}`}
    >
      <div className="font-semibold truncate">{task.description}</div>
      <div className="opacity-90">
        {task.startTime?.slice(0, 5)} - {task.endTime?.slice(0, 5)}
      </div>
    </div>
  );
}
