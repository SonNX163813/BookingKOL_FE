// src/components/kol/kol-schedule/BookingPopup.jsx
import React, { useMemo } from "react";
import { Modal, Spin, Alert, Button, Descriptions } from "antd";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { getAvailabilityTimelineById } from "../../../services/kol/AvailabilityAPI";

export default function BookingPopup({ isOpen, availabilityId, onClose }) {
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["availability-timeline", availabilityId],
    enabled: isOpen && !!availabilityId,
    queryFn: async () => {
      const res = await getAvailabilityTimelineById(availabilityId);
      // API có thể trả về object HOẶC array => chuẩn hóa về object
      const raw = res?.data?.data ?? res?.data;
      if (Array.isArray(raw)) return raw[0] ?? null;
      return raw ?? null;
    },
  });

  const record = data || {};
  const firstWork = useMemo(
    () => (record?.workTimes || [])[0] || null,
    [record]
  );

  const statusText = firstWork?.status || record?.status || "UNKNOWN";

  const startAt = firstWork?.startAt || record?.startAt;
  const endAt = firstWork?.endAt || record?.endAt;

  const timeRange = useMemo(() => {
    if (!startAt || !endAt) return "";
    const s = dayjs(startAt).format("HH:mm");
    const e = dayjs(endAt).format("HH:mm");
    const d = dayjs(startAt).format("DD/MM/YYYY");
    return `${s} - ${e} (${d})`;
  }, [startAt, endAt]);

  const handleGoDetail = () => {
    if (!firstWork?.bookingRequestId) return;
    // Nếu route detail của bạn khác, sửa path dưới đây cho đúng:
    navigate(`/kol/single-requests/detail/${firstWork.bookingRequestId}`);
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={null}
      closable={false}
      maskClosable
      keyboard
      destroyOnClose
      centered
      width={520}
      styles={{
        content: {
          background: "#ffffff",
          borderRadius: 24,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
        },
        body: { padding: 0 },
      }}
      zIndex={2100}
      footer={null}
    >
      <div className="px-5 pt-4 pb-4 border-b border-gray-200 flex items-start justify-between">
        <h3 className="font-semibold text-[18px] leading-none">
          Chi tiết đơn booking
        </h3>
        <button
          aria-label="Đóng"
          onClick={onClose}
          className="p-1 -mt-1 rounded hover:bg-gray-100 transition"
        >
          ✕
        </button>
      </div>

      <div className="px-5 py-5">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Spin />
          </div>
        )}

        {isError && (
          <Alert
            type="error"
            showIcon
            message="Không tải được chi tiết booking"
            description={String(error?.message || "Vui lòng thử lại.")}
          />
        )}

        {!isLoading && !isError && !record?.id && (
          <Alert type="info" showIcon message="Không có dữ liệu booking." />
        )}

        {!isLoading && !isError && record?.id && (
          <>
            <Descriptions
              bordered
              size="small"
              column={1}
              labelStyle={{ width: 160 }}
            >
              <Descriptions.Item label="Availability ID">
                {record.id}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {statusText}
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian">
                {timeRange}
              </Descriptions.Item>
              <Descriptions.Item label="KOL">
                {record.fullName || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {record.email || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="SĐT">
                {record.phone || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Booking Request ID">
                {firstWork?.bookingRequestId || "-"}
              </Descriptions.Item>
              {record?.note && (
                <Descriptions.Item label="Ghi chú">
                  {record.note}
                </Descriptions.Item>
              )}
            </Descriptions>

            <div className="mt-5 flex justify-end gap-2">
              {firstWork?.bookingRequestId && (
                <Button type="primary" onClick={handleGoDetail}>
                  Xem chi tiết đơn
                </Button>
              )}
              <Button onClick={onClose}>Đóng</Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
