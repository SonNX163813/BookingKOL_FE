import React, { useEffect, useState, useMemo } from "react";
import { IoClose } from "react-icons/io5";
import TaskPopup from "./TaskPopup";

export default function DayTasksPopup({ details, onClose }) {
  const [selectedTask, setSelectedTask] = useState(null);

  // ✅ tạo key ổn định để biết “đang xem ngày nào”
  const dayKey = useMemo(() => {
    const wd = details?.weekDate;
    if (!wd) return "";
    return `${wd.year}-${wd.month}-${wd.day}`;
  }, [
    details?.weekDate?.year,
    details?.weekDate?.month,
    details?.weekDate?.day,
  ]);

  // ✅ Hook luôn nằm top-level, KHÔNG đặt sau "return null"
  useEffect(() => {
    if (!details) return;
    setSelectedTask(null);
  }, [dayKey, details]);

  // ✅ giờ mới return
  if (!details) return null;

  const { tasks = [], weekDate } = details;

  const sorted = [...tasks].sort((a, b) =>
    (a.startTime || "").localeCompare(b.startTime || "")
  );
  const hhmm = (t) => (t ? t.slice(0, 5) : "");

  const handleBackdropClick = () => {
    if (selectedTask) setSelectedTask(null);
    else onClose?.();
  };

  const handleCloseButton = () => {
    if (selectedTask) setSelectedTask(null);
    else onClose?.();
  };

  return (
    <div>
      {/* ✅ TaskPopup luôn nổi trên overlay “Xem thêm” */}
      {selectedTask && (
        <TaskPopup
          isDisplay={true}
          goalDetails={selectedTask}
          dayInfo={weekDate}
          onClose={() => setSelectedTask(null)}
          zIndex={10050} // > 9999
          mask={false} // tránh tối 2 lớp
        />
      )}

      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center z-[9998]"
        onClick={handleBackdropClick}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative z-[9999]"
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
              onClick={handleCloseButton}
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
