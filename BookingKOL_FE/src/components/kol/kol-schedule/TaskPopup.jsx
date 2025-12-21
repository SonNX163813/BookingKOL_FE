// src/components/kol/kol-schedule/TaskPopup.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Modal, Spin } from "antd";
import { IoCloseOutline } from "react-icons/io5";
import { CiClock2 } from "react-icons/ci";
import { GoGoal } from "react-icons/go";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

// ✅ NEW: gọi API detail theo kolWorkTimeId
import { getBookingRequestByWorktimeId } from "../../../services/kol/ScheduleAPI";

/** ✅ SINGLE booking status label (theo bạn gửi) */
const BOOKING_STATUS_OPTIONS = [
  { label: "Chờ Thanh Toán", value: "DRAFT" },
  { label: "Đã yêu cầu", value: "REQUESTED" },
  { label: "Đang thực hiện", value: "IN_PROGRESS" },
  { label: "Đã hoàn thành", value: "COMPLETED" },
  { label: "Đã hết hạn", value: "EXPIRED" },
  { label: "Đã hủy", value: "CANCELLED" },
  { label: "Đang chờ thực hiện", value: "PAID" },
  { label: "Đang chờ thực hiện", value: "ACCEPTED" },
  { label: "Đã hoàn tiền", value: "REFUNDED" },
];

const SINGLE_STATUS_LABEL = BOOKING_STATUS_OPTIONS.reduce((acc, it) => {
  acc[String(it.value || "").toUpperCase()] = it.label;
  return acc;
}, {});

/** ✅ CAMPAIGN (worktime) status label (theo bạn gửi) */
const CAMPAIGN_STATUS_LABEL = {
  AVAILABLE: "Sẵn sàng",
  ASSIGNED: "Đã gán",
  IN_PROGRESS: "Đang thực hiện",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  PENDING_ASSIGNMENT: "Chưa có KOL",
  PENDING: "Chờ thực hiện",
};

const getStatusLabel = (bookingType, status) => {
  const type = String(bookingType || "").toUpperCase();
  const k = String(status || "").toUpperCase();

  if (!k) return "—";

  // CAMPAIGN dùng map riêng
  if (type === "CAMPAIGN") return CAMPAIGN_STATUS_LABEL[k] || k;

  // SINGLE dùng BOOKING_STATUS_OPTIONS
  return SINGLE_STATUS_LABEL[k] || k;
};

/** ✅ BOOKING TYPE label (SINGLE/CAMPAIGN -> Tiếng Việt) */
const BOOKING_TYPE_LABEL = {
  SINGLE: "Đơn lẻ",
  CAMPAIGN: "Chiến dịch",
};

const getBookingTypeLabel = (type) => {
  const k = String(type || "").toUpperCase();
  return BOOKING_TYPE_LABEL[k] || (type ? String(type) : "—");
};

export default function TaskPopup({
  isDisplay,
  goalDetails,
  dayInfo,
  onClose,
  zIndex = 5000,
  mask = true,
  readOnly,
}) {
  const navigate = useNavigate();

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailRaw, setDetailRaw] = useState(null);
  const [err, setErr] = useState("");

  const hhmm = (t) => (t ? t.slice(0, 5) : "");
  const isBooking =
    goalDetails?.isBooking ||
    String(goalDetails?.status || "")
      .toLowerCase()
      .includes("book");

  const titleText = isBooking
    ? goalDetails?.description || "Đã đặt lịch"
    : "Lịch rảnh";

  const kolWorkTimeId =
    goalDetails?.kolWorkTimeId || goalDetails?.workTimeId || null;

  // ✅ chuẩn hoá 2 shape CAMPAIGN / SINGLE để render dễ
  const detail = useMemo(() => {
    const r = detailRaw || null;
    if (!r) return null;

    const bookingType = String(r?.bookingType || "SINGLE").toUpperCase();

    if (bookingType === "CAMPAIGN") {
      return {
        bookingType: "CAMPAIGN",
        requestNumber: r?.requestNumber,
        // status CAMPAIGN = status worktime/campaign
        status: r?.status,
        bookingStatus: r?.bookingStatus,
        bookingRequestId: r?.bookingRequestId,
        startAt: r?.startAt,
        endAt: r?.endAt,
        description: r?.description,
        livestreamAddress: r?.livestreamAddress,
        campaignId: r?.campaignId,
        campaignName: r?.campaignName,
        campaignObjective: r?.campaignObjective,
        campaignStartDate: r?.campaignStartDate,
        campaignEndDate: r?.campaignEndDate,
      };
    }

    // SINGLE
    return {
      bookingType: "SINGLE",
      id: r?.id,
      requestNumber: r?.requestNumber,
      status: r?.status,
      startAt: r?.startAt,
      endAt: r?.endAt,
      description: r?.description,
      platform: r?.platform,
      location: r?.location,
      fullName: r?.fullName || r?.user?.fullName,
      phone: r?.phone || r?.user?.phone,
      email: r?.email || r?.user?.email,
      attachedFiles: r?.attachedFiles || [],
      contracts: r?.contracts || [],
    };
  }, [detailRaw]);

  useEffect(() => {
    let mounted = true;
    setDetailRaw(null);
    setErr("");

    if (!isDisplay || !isBooking) return;

    (async () => {
      try {
        setLoadingDetail(true);

        if (!kolWorkTimeId) {
          throw new Error(
            "Không tìm thấy kolWorkTimeId/workTimeId để xem chi tiết."
          );
        }

        const res = await getBookingRequestByWorktimeId(kolWorkTimeId);
        if (!mounted) return;
        setDetailRaw(res || null);
      } catch (e) {
        if (mounted) setErr(e?.message || "Không tải được chi tiết.");
      } finally {
        if (mounted) setLoadingDetail(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isDisplay, isBooking, kolWorkTimeId]);

  const handleGoDetail = () => {
    if (!detail) return;

    if (detail.bookingType === "SINGLE" && detail.id) {
      navigate(`/kol/single-requests/detail/${detail.id}`);
      return;
    }

    if (detail.bookingType === "CAMPAIGN" && detail.campaignId) {
      // TODO: route campaign detail theo dự án bạn
      return;
    }
  };

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
      width={"min(92vw, 520px)"}
      zIndex={zIndex}
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
          <span className="font-medium">Note:</span>
          <span className="font-semibold">
            {goalDetails?.goalsTitle ||
              (isBooking ? "Đã được đặt lịch" : "Lịch rảnh")}
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
            ) : !detail ? (
              <div className="text-gray-500 text-sm">Không có dữ liệu.</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 text-[14px]">
                  <div>
                    <div className="text-gray-500">Loại</div>
                    <div className="font-semibold">
                      {getBookingTypeLabel(detail.bookingType)}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500">Trạng thái</div>
                    <div className="font-semibold">
                      {/* ✅ CAMPAIGN dùng CAMPAIGN_STATUS_LABEL, SINGLE dùng BOOKING_STATUS_OPTIONS */}
                      {getStatusLabel(
                        detail.bookingType,
                        // nếu BE trả status campaign ở bookingStatus thì vẫn bắt được
                        detail.status || detail.bookingStatus
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500">Mã đơn</div>
                    <div className="font-semibold">
                      {detail.requestNumber || "—"}
                    </div>
                  </div>

                  {/* <div>
                    <div className="text-gray-500">WorkTime ID</div>
                    <div className="font-semibold">{kolWorkTimeId || "—"}</div>
                  </div> */}

                  <div>
                    <div className="text-gray-500">Bắt đầu</div>
                    <div className="font-semibold">
                      {detail.startAt
                        ? dayjs(detail.startAt).format("HH:mm DD/MM/YYYY")
                        : "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500">Kết thúc</div>
                    <div className="font-semibold">
                      {detail.endAt
                        ? dayjs(detail.endAt).format("HH:mm DD/MM/YYYY")
                        : "—"}
                    </div>
                  </div>

                  {detail.bookingType === "CAMPAIGN" ? (
                    <>
                      <div className="col-span-2">
                        <div className="text-gray-500">Chiến dịch</div>
                        <div className="font-semibold">
                          {detail.campaignName || "—"}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="text-gray-500">Mục tiêu</div>
                        <div className="font-semibold">
                          {detail.campaignObjective ||
                            detail.description ||
                            "—"}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="text-gray-500">Địa chỉ livestream</div>
                        <div className="font-semibold">
                          {detail.livestreamAddress || "—"}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="text-gray-500">Khách hàng</div>
                        <div className="font-semibold">
                          {detail.fullName || "—"}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-500">Nền tảng</div>
                        <div className="font-semibold">
                          {detail.platform || "—"}
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="text-gray-500">Địa điểm</div>
                        <div className="font-semibold">
                          {detail.location || "—"}
                        </div>
                      </div>

                      {/* <div className="col-span-2">
                        <div className="text-gray-500">Tệp đính kèm</div>
                        <div className="font-semibold">
                          {detail.attachedFiles?.length ?? 0}
                        </div>
                      </div> */}
                    </>
                  )}
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  {/* <Button type="primary" onClick={handleGoDetail}>Xem chi tiết</Button> */}
                </div>
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
