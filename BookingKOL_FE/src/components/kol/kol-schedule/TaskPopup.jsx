import React, { useEffect, useState } from "react";
import { Modal, Spin } from "antd";
import { IoCloseOutline } from "react-icons/io5";
import { CiClock2 } from "react-icons/ci";
import { GoGoal } from "react-icons/go";
import dayjs from "dayjs";
import { getKolMySingleRequestDetail } from "../../../services/kol/KolAPI";
import { getAvailabilityTimelineById } from "../../../services/kol/AvailabilityAPI";

export default function TaskPopup({
  isDisplay,
  goalDetails,
  dayInfo,
  onClose,
  // ✅ NEW: cho phép set zIndex khi popup bị “đè”
  zIndex = 5000,
  // ✅ NEW: trong case đang có overlay khác (Xem thêm), có thể tắt mask của modal này
  mask = true,
}) {
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detail, setDetail] = useState(null);
  const [err, setErr] = useState("");

  const hhmm = (t) => (t ? t.slice(0, 5) : "");
  const isBooking =
    goalDetails?.isBooking ||
    String(goalDetails?.status || "")
      .toLowerCase()
      .includes("book");

  const titleText = isBooking
    ? goalDetails?.description || "Booking"
    : "Lịch rảnh";

  useEffect(() => {
    let mounted = true;
    setDetail(null);
    setErr("");

    if (!isDisplay || !isBooking) return;

    const availabilityId =
      goalDetails?.availabilityId ||
      goalDetails?.parentId ||
      goalDetails?.availabilityTimelineId ||
      null;

    const requestId =
      goalDetails?.bookingRequestId || goalDetails?.requestId || null;

    (async () => {
      try {
        setLoadingDetail(true);

        if (availabilityId) {
          const rec = await getAvailabilityTimelineById(availabilityId);
          if (!mounted) return;

          const firstWork = Array.isArray(rec?.workTimes)
            ? rec.workTimes[0]
            : null;

          const normalized = {
            source: "availability",
            id: rec?.id,
            status: firstWork?.status || rec?.status,
            requestNumber: rec?.requestNumber || rec?.bookingCode || null,
            customerName: rec?.customerName || rec?.brandName || null,
            price: rec?.price ?? null,
            note: rec?.note ?? null,
            startAt: firstWork?.startAt || rec?.startAt || null,
            endAt: firstWork?.endAt || rec?.endAt || null,
          };

          setDetail(normalized);
          return;
        }

        if (requestId) {
          const rec = await getKolMySingleRequestDetail(requestId);
          if (!mounted) return;

          setDetail({
            source: "request",
            id: rec?.id,
            status: rec?.status,
            requestNumber: rec?.requestNumber,
            customerName: rec?.customerName || rec?.brandName || null,
            price: rec?.price ?? null,
            note: rec?.note ?? null,
            startAt: rec?.startAt || null,
            endAt: rec?.endAt || null,
          });
          return;
        }
      } catch (e) {
        if (mounted) setErr(e?.message || "Không tải được chi tiết.");
      } finally {
        if (mounted) setLoadingDetail(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [
    isDisplay,
    isBooking,
    goalDetails?.availabilityId,
    goalDetails?.parentId,
    goalDetails?.availabilityTimelineId,
    goalDetails?.bookingRequestId,
    goalDetails?.requestId,
  ]);

  if (!isDisplay) return null;

  return (
    <Modal
      open={isDisplay}
      onCancel={onClose}
      title={null}
      closable={false}
      maskClosable
      keyboard
      destroyOnClose
      centered
      width={"min(92vw, 500px)"}
      // ✅ quan trọng: nâng zIndex để nằm trên overlay “Xem thêm”
      zIndex={zIndex}
      // ✅ tuỳ chọn: tránh bị tối 2 lớp khi đang có overlay khác
      mask={mask}
      styles={{
        content: {
          background: "#fff",
          borderRadius: 24,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        },
        body: { padding: 0 },
      }}
      footer={null}
    >
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

      <div className="px-5 pt-4 pb-5 text-gray-700">
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

        <div className="mt-4 flex items-center gap-2 text-[15px]">
          <GoGoal className="text-xl text-gray-600" />
          <span className="font-medium">Mục tiêu:</span>
          <span className="font-semibold">
            {goalDetails?.goalsTitle || (isBooking ? "Booking" : "Lịch rảnh")}
          </span>
        </div>

        {isBooking && (
          <div className="mt-5 rounded-xl border border-gray-200 p-4 bg-gray-50">
            {loadingDetail ? (
              <div className="flex items-center gap-2 text-gray-600">
                <Spin size="small" />
                <span>Đang tải chi tiết booking…</span>
              </div>
            ) : err ? (
              <div className="text-red-500 text-sm">{err}</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 text-[14px]">
                  <div>
                    <div className="text-gray-500">Mã đơn</div>
                    <div className="font-semibold">
                      {detail?.requestNumber || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Trạng thái</div>
                    <div className="font-semibold">{detail?.status || "—"}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Bắt đầu</div>
                    <div className="font-semibold">
                      {detail?.startAt
                        ? dayjs(detail.startAt).format("HH:mm DD/MM/YYYY")
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Kết thúc</div>
                    <div className="font-semibold">
                      {detail?.endAt
                        ? dayjs(detail.endAt).format("HH:mm DD/MM/YYYY")
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Khách hàng</div>
                    <div className="font-semibold">
                      {detail?.customerName || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Giá trị</div>
                    <div className="font-semibold">
                      {detail?.price != null ? `${detail.price}` : "—"}
                    </div>
                  </div>
                </div>

                {detail?.note && (
                  <div className="mt-3">
                    <div className="text-gray-500 text-[13px]">Ghi chú</div>
                    <div className="text-[14px]">{detail.note}</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

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
