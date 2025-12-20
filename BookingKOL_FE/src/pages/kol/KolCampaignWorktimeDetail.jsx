// src/pages/kol/KolCampaignWorktimeDetail.jsx
import React, { useMemo } from "react";
import dayjs from "dayjs";
import { Alert, Button, Card, Descriptions, Tag, Spin } from "antd";
import { ArrowLeft, FileText, CalendarRange } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { getKolCampaignWorktimes } from "../../services/kol/KolCampaignWorktimeAPI";

const normalize = (v) => (v == null ? "" : String(v).trim());
const toUpper = (v) => normalize(v).toUpperCase();

const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") => {
  if (!value) return "--";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : "--";
};

const WORKTIME_STATUS_META = {
  PENDING: { label: "Chờ xác nhận", color: "gold" },
  APPROVED: { label: "Đã xác nhận", color: "processing" },
  REJECTED: { label: "Từ chối", color: "error" },
  IN_PROGRESS: { label: "Đang thực hiện", color: "processing" },
  COMPLETED: { label: "Hoàn thành", color: "success" },
  CANCELLED: { label: "Đã hủy", color: "error" },
};

const BOOKING_STATUS_META = {
  DRAFT: { label: "Chờ thanh toán", color: "default" },
  REQUESTED: { label: "Đã yêu cầu", color: "default" },
  PAID: { label: "Đang chờ thực hiện", color: "processing" },
  IN_PROGRESS: { label: "Đang thực hiện", color: "processing" },
  COMPLETED: { label: "Đã hoàn thành", color: "success" },
  EXPIRED: { label: "Đã hết hạn", color: "volcano" },
  CANCELLED: { label: "Đã hủy", color: "error" },
  REFUNDED: { label: "Đã hoàn tiền", color: "error" },
};

const extractKolId = (auth) => {
  return (
    auth?.kolId ??
    auth?.user?.kolId ??
    auth?.user?.kolProfileId ??
    auth?.user?.kol_profile_id ??
    auth?.profile?.kolId ??
    auth?.profile?.kolProfileId ??
    auth?.userInfo?.kolId ??
    null
  );
};

export default function KolCampaignWorktimeDetail() {
  const { workTimeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const stateRecord = location?.state?.record ?? null;

  const auth = useAuth?.() || {};
  const token = auth?.token || null;
  const authLoading = auth?.loading ?? false;
  const kolId = extractKolId(auth);

  // Nếu có record từ state và đúng workTimeId => khỏi gọi API
  const shouldFetch =
    !!token &&
    !!kolId &&
    !authLoading &&
    (!stateRecord ||
      String(stateRecord?.workTimeId ?? stateRecord?.id ?? "") !==
        String(workTimeId));

  const { data, isLoading, error } = useQuery({
    queryKey: ["kol-campaign-worktimes", token, kolId],
    queryFn: () => getKolCampaignWorktimes(kolId),
    enabled: shouldFetch,
    staleTime: 30_000,
  });

  const raw = data?.data ?? data ?? {};
  const list = Array.isArray(raw?.content)
    ? raw.content
    : Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items)
    ? raw.items
    : [];

  const record = useMemo(() => {
    const stateId = stateRecord?.workTimeId ?? stateRecord?.id ?? null;
    if (stateRecord && String(stateId) === String(workTimeId))
      return stateRecord;

    return (
      list.find(
        (x) => String(x?.workTimeId ?? x?.id ?? "") === String(workTimeId)
      ) || null
    );
  }, [stateRecord, list, workTimeId]);

  const workStatus = toUpper(record?.status);
  const workMeta = WORKTIME_STATUS_META[workStatus];
  const bookingStatus = toUpper(record?.bookingStatus);
  const bookingMeta = BOOKING_STATUS_META[bookingStatus];

  return (
    <div className="h-full flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <Button
          onClick={() => navigate(-1)}
          icon={<ArrowLeft size={16} />}
          className="!h-9"
        >
          Quay lại
        </Button>

        <div className="ml-2 flex items-center gap-2">
          <div className="border-2 border-gray-300 p-2 rounded-md w-fit">
            <FileText className="text-gray-500" size={18} />
          </div>
          <div>
            <div className="text-[16px] font-bold">Chi tiết đơn chiến dịch</div>
            <div className="text-[13px] text-gray-600">
              WorkTime: <span className="font-semibold">{workTimeId}</span>
            </div>
          </div>
        </div>
      </div>

      {(!workTimeId || !token) && (
        <Alert
          type="warning"
          showIcon
          message="Thiếu thông tin để hiển thị"
          description="Không có workTimeId hoặc chưa đăng nhập."
        />
      )}

      {isLoading && (
        <Card>
          <div className="py-10 flex justify-center">
            <Spin />
          </div>
        </Card>
      )}

      {error && (
        <Alert
          type="error"
          showIcon
          message="Lỗi tải chi tiết"
          description={String(error?.message || "Unknown error")}
        />
      )}

      {!isLoading && !record && (
        <Alert
          type="info"
          showIcon
          message="Không tìm thấy đơn chiến dịch"
          description="Có thể workTimeId không tồn tại hoặc bạn không có quyền xem."
        />
      )}

      {!!record && (
        <>
          <Card bordered={false} className="shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[18px] font-bold flex items-center gap-2">
                  <CalendarRange size={18} />
                  {record?.campaignName || "Chiến dịch"}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Request:{" "}
                  <span className="font-semibold">
                    {record?.requestNumber || "--"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap justify-end">
                <Tag color={workMeta?.color ?? "default"}>
                  {workMeta?.label ?? workStatus ?? "--"}
                </Tag>
                <Tag color={bookingMeta?.color ?? "default"}>
                  {bookingMeta?.label ?? bookingStatus ?? "--"}
                </Tag>
                <Tag color="purple">CAMPAIGN</Tag>
              </div>
            </div>
          </Card>

          <Card bordered={false} className="shadow-sm">
            <Descriptions
              title="Thông tin lịch (Worktime)"
              bordered
              column={{ xs: 1, sm: 2, md: 2, lg: 3 }}
            >
              <Descriptions.Item label="workTimeId">
                {record?.workTimeId || "--"}
              </Descriptions.Item>
              <Descriptions.Item label="bookingRequestId">
                {record?.bookingRequestId || "--"}
              </Descriptions.Item>
              <Descriptions.Item label="bookingNumber">
                {record?.bookingNumber ?? "--"}
              </Descriptions.Item>

              <Descriptions.Item label="startAt">
                {formatDateTime(record?.startAt)}
              </Descriptions.Item>
              <Descriptions.Item label="endAt">
                {formatDateTime(record?.endAt)}
              </Descriptions.Item>
              <Descriptions.Item label="note">
                {record?.note ?? "--"}
              </Descriptions.Item>

              <Descriptions.Item label="status">
                <Tag color={workMeta?.color ?? "default"}>
                  {workMeta?.label ?? workStatus ?? "--"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="bookingStatus">
                <Tag color={bookingMeta?.color ?? "default"}>
                  {bookingMeta?.label ?? bookingStatus ?? "--"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="bookingType">
                {record?.bookingType ?? "CAMPAIGN"}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card bordered={false} className="shadow-sm">
            <Descriptions
              title="Thông tin booking"
              bordered
              column={{ xs: 1, sm: 2, md: 2, lg: 3 }}
            >
              <Descriptions.Item label="requestNumber">
                {record?.requestNumber ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="description">
                {record?.description ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="campaignObjective">
                {record?.campaignObjective ?? "--"}
              </Descriptions.Item>

              <Descriptions.Item label="bookingCreatedAt">
                {formatDateTime(record?.bookingCreatedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="bookingUpdatedAt">
                {formatDateTime(record?.bookingUpdatedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="campaignId">
                {record?.campaignId ?? "--"}
              </Descriptions.Item>

              <Descriptions.Item label="campaignStartDate">
                {formatDateTime(record?.campaignStartDate, "DD/MM/YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="campaignEndDate">
                {formatDateTime(record?.campaignEndDate, "DD/MM/YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="campaignName">
                {record?.campaignName ?? "--"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </>
      )}
    </div>
  );
}
