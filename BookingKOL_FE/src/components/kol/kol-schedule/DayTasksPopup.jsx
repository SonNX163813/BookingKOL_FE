import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import TaskPopup from "./TaskPopup";

export default function DayTasksPopup({ details, onClose }) {
  const [selectedTask, setSelectedTask] = useState(null);
  if (!details) return null;

  const { tasks, weekDate } = details;
  const sorted = [...tasks].sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );

  return (
    <div>
      {/* Popup task chi tiết (nổi trên) */}
      <div className="fixed z-[9999] flex justify-center items-center right-[40%] top-[40%]">
        {selectedTask && (
          <TaskPopup
            isDisplay={true}
            goalDetails={selectedTask}
            dayInfo={weekDate}
            onClose={() => setSelectedTask(null)}
            range="month"
            isLastCol={false}
            readOnly
          />
        )}
      </div>

      {/* Overlay + card danh sách */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-[9998]"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-6">
            <div className="w-full">
              <p className="text-xl font-bold text-center uppercase">
                {weekDate.weekday}
              </p>
              <p className="text-xl font-bold text-center -mt-2">
                {weekDate.day}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-800"
            >
              <IoClose size={28} />
            </button>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {sorted.map((task) => {
              const isBooking =
                task?.isBooking ||
                String(task?.status || "")
                  .toLowerCase()
                  .includes("book");
              const hhmm = (t) => (t ? t.slice(0, 5) : "");

              return (
                <div
                  key={task.id}
                  className="flex items-start gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => setSelectedTask(task)}
                >
                  <div
                    className="w-3 h-3 rounded-full mt-1.5"
                    style={{ backgroundColor: task.colorCode }}
                  />
                  <div className="flex-1">
                    {isBooking ? (
                      <span className="text-sm">
                        <span className="font-semibold mr-2">
                          {hhmm(task.startTime)}–{hhmm(task.endTime)}
                        </span>
                        {task.description}
                      </span>
                    ) : (
                      <span className="text-sm">
                        Rảnh từ{" "}
                        <span className="font-semibold">
                          {hhmm(task.startTime)} đến {hhmm(task.endTime)}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {!sorted.length && (
              <div className="text-center text-gray-500">
                Không có lịch trong ngày
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
