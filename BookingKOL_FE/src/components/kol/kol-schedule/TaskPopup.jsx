import React from "react";
import { Modal } from "antd";
import { IoCloseOutline } from "react-icons/io5";
import { CiClock2 } from "react-icons/ci";
import { GoGoal } from "react-icons/go";

export default function TaskPopup({
  isDisplay,
  goalDetails,
  dayInfo,
  onClose,
  range,
  isLastCol,
  readOnly = true,
}) {
  if (!isDisplay) return null;

  return (
    <Modal
      open={isDisplay}
      onCancel={onClose}
      closable={false}
      footer={null}
      centered
      width={360}
      classNames={{ content: "!p-0" }}
    >
      <div className="px-4 py-3 rounded-2xl w-full bg-white flex flex-col gap-3">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="font-semibold truncate">
            {goalDetails.description}
          </div>
          <IoCloseOutline
            className="text-2xl text-gray-500 cursor-pointer"
            onClick={onClose}
          />
        </div>

        {/* Time */}
        <div className="flex justify-between mt-2 text-[14px] gap-6 text-gray-700">
          <div className="flex items-center gap-2">
            <CiClock2 className="text-lg" />
            <span>
              {dayInfo.weekday}, {dayInfo.day}/{dayInfo.month}/{dayInfo.year}
            </span>
          </div>
          <div>
            {goalDetails.startTime?.slice(0, 5)} -{" "}
            {goalDetails.endTime?.slice(0, 5)}
          </div>
        </div>

        {/* Goal */}
        <div className="flex items-center gap-2 text-gray-700 text-sm mt-2">
          <GoGoal className="text-lg" />
          <span>Mục tiêu:</span>
          <span className="font-semibold">
            {goalDetails.goalsTitle || "Lịch làm"}
          </span>
        </div>

        {/* Color */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm text-gray-600">Màu:</span>
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: goalDetails.colorCode }}
          />
        </div>

        {readOnly && (
          <div className="text-xs text-gray-500 mt-2 italic">
            *Chế độ xem (read-only).
          </div>
        )}
      </div>
    </Modal>
  );
}
