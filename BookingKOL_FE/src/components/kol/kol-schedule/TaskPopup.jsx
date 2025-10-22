// src/components/kol/kol-schedule/TaskPopup.jsx
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
}) {
  if (!isDisplay) return null;

  const hhmm = (t) => (t ? t.slice(0, 5) : "");
  const isBooking =
    goalDetails?.isBooking ||
    String(goalDetails?.status || "")
      .toLowerCase()
      .includes("book");

  const titleText = isBooking
    ? goalDetails?.description || "Booking"
    : "Lịch rảnh";

  return (
    <Modal
      open={isDisplay}
      onCancel={onClose}
      title={null} // tự render header để canh lề đẹp
      closable={false} // dùng nút X tự làm
      maskClosable
      keyboard
      destroyOnClose
      centered
      width={"min(92vw, 500px)"} // hẹp ngang, cao vừa nội dung
      styles={{
        content: {
          background: "#ffffff",
          borderRadius: 24,
          border: "1px solid #e5e7eb", // xám nhạt, nhẹ mắt
          overflow: "hidden",
        },
        body: { padding: 0 },
      }}
      zIndex={2000}
      footer={null}
    >
      {/* Header */}
      <div className="px-5 pt-3 pb-2 border-b border-gray-200 flex items-start justify-between">
        <h3 className="font-semibold text-[18px] leading-none mt-1">
          {titleText}
        </h3>
        <button
          aria-label="Đóng"
          onClick={onClose}
          className="p-1 -mt-1 rounded hover:bg-gray-100 transition"
        >
          <IoCloseOutline className="text-2xl text-gray-600" />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 pt-4 pb-5 text-gray-700">
        {/* Thời gian */}
        <div className="flex items-start justify-between gap-3 text-[15px] flex-wrap">
          <div className="flex items-center gap-2">
            <CiClock2 className="text-xl text-gray-600" />
            <span className="font-medium">
              {dayInfo?.weekday}, {dayInfo?.day}/{dayInfo?.month}/
              {dayInfo?.year}
            </span>
          </div>
          <div className="font-semibold">
            {isBooking
              ? `${hhmm(goalDetails?.startTime)} - ${hhmm(
                  goalDetails?.endTime
                )}`
              : `Rảnh từ ${hhmm(goalDetails?.startTime)} đến ${hhmm(
                  goalDetails?.endTime
                )}`}
          </div>
        </div>

        {/* Mục tiêu */}
        <div className="mt-4 flex items-center gap-2 text-[15px]">
          <GoGoal className="text-xl text-gray-600" />
          <span className="font-medium">Mục tiêu:</span>
          <span className="font-semibold">
            {goalDetails?.goalsTitle || (isBooking ? "Booking" : "Lịch rảnh")}
          </span>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition text-[14px]"
          >
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
