// src/pages/admin/booking-campaign/BookingCampaignDetail.jsx
import React, { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Divider,
  Empty,
  Grid,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import { ArrowLeft, CalendarRange, FileText, Layers } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  BOOKING_STATUS_LABEL,
  STATUS_TAG_COLOR,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_COLOR,
} from "../../../constants/mySingleBookingStatuses";
import {
  adminGetCampaignBookingDetail,
  adminGetCampaignInfo,
} from "../../../services/admin/AdminBookingCampaignAPI";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") => {
  if (!value) return "--";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : String(value);
};

const formatDate = (value, pattern = "DD/MM/YYYY") => {
  if (!value) return "--";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : String(value);
};

const formatCurrency = (value, currency = "VND") => {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  const numeric = typeof value === "number" ? value : Number.parseFloat(value);
  if (Number.isNaN(numeric)) return "--";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numeric);
};

const normalizeStatus = (status) =>
  status && typeof status === "string" ? status.toUpperCase() : status;

const formatArrayText = (items) => {
  if (!Array.isArray(items) || !items.length) return "--";
  return items
    .map((x) => x?.displayName || x?.name || x?.id)
    .filter(Boolean)
    .join(", ");
};

// mapping nhỏ cho status campaign
const CAMPAIGN_STATUS_LABEL = {
  REQUESTED: "Đang yêu cầu",
  NEGOTIATING: "Đang thương lượng",
  APPROVED: "Đã phê duyệt",
  REJECTED: "Đã từ chối",
  COMPLETED: "Hoàn tất",
};

const CAMPAIGN_STATUS_COLOR = {
  REQUESTED: "gold",
  NEGOTIATING: "orange",
  APPROVED: "green",
  REJECTED: "red",
  COMPLETED: "blue",
};

const BookingCampaignDetail = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const screens = useBreakpoint();

  // 1) API lấy danh sách bookingRequests theo campaign
  const {
    data: bookingsResponse,
    isLoading: isLoadingBookings,
    isFetching: isFetchingBookings,
    error: errorBookings,
    refetch: refetchBookings,
  } = useQuery({
    queryKey: ["admin-campaign-booking-detail", campaignId],
    queryFn: () => adminGetCampaignBookingDetail(campaignId),
    enabled: !!campaignId,
    retry: false,
  });

  // 2) API mới /campaigns/{id} cho phần "Thông tin Campaign"
  const {
    data: campaignResponse,
    isLoading: isLoadingCampaign,
    isFetching: isFetchingCampaign,
    error: errorCampaign,
    refetch: refetchCampaign,
  } = useQuery({
    queryKey: ["admin-campaign-info", campaignId],
    queryFn: () => adminGetCampaignInfo(campaignId),
    enabled: !!campaignId,
    retry: false,
  });

  const campaignInfo = campaignResponse?.data ?? campaignResponse ?? null;
  const bookingsDetail = bookingsResponse?.data ?? bookingsResponse ?? null;

  const bookingRequests = useMemo(
    () =>
      Array.isArray(bookingsDetail?.bookingRequests)
        ? bookingsDetail.bookingRequests
        : [],
    [bookingsDetail?.bookingRequests]
  );

  const normalizedStatus = normalizeStatus(campaignInfo?.status);
  const statusLabel =
    CAMPAIGN_STATUS_LABEL[normalizedStatus] ?? normalizedStatus ?? "--";

  const responseTimestamp = campaignResponse?.timestamp ?? null;

  const isLoadingAll = isLoadingBookings || isLoadingCampaign;
  const isFetchingAll = isFetchingBookings || isFetchingCampaign;
  const errorAll = errorCampaign || errorBookings;

  const handleRefresh = () => {
    refetchCampaign();
    refetchBookings();
  };

  // Table: lịch thanh toán
  const paymentScheduleColumns = useMemo(
    () => [
      {
        title: "Lần thanh toán",
        dataIndex: "installmentNumber",
        key: "installmentNumber",
        width: 120,
      },
      {
        title: "Số tiền",
        dataIndex: "amount",
        key: "amount",
        render: (v) => formatCurrency(v),
      },
      {
        title: "Hạn thanh toán",
        dataIndex: "dueDate",
        key: "dueDate",
        render: (v) => formatDate(v),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (v) => {
          const s = normalizeStatus(v);
          if (!s) return "--";
          return (
            <Tag color={PAYMENT_STATUS_COLOR[s] ?? "default"}>
              {PAYMENT_STATUS_LABEL[s] ?? s}
            </Tag>
          );
        },
      },
      {
        title: "Mã giao dịch",
        dataIndex: "transactionId",
        key: "transactionId",
        width: 220,
      },
      {
        title: "Trạng thái giao dịch",
        dataIndex: "transactionStatus",
        key: "transactionStatus",
        render: (v) => normalizeStatus(v) ?? "--",
      },
    ],
    []
  );

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Space size="middle" wrap>
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate("/admin/management-booking-campaigns")}
          >
            Quay lại danh sách
          </Button>
          <Button
            icon={<CalendarRange size={16} />}
            onClick={handleRefresh}
            loading={isFetchingAll}
          >
            Làm mới
          </Button>
        </Space>

        <div className="text-right">
          <Title level={4} className="!mb-1">
            Chi tiết Booking Campaign
          </Title>
          <Text type="secondary">
            Tên Campaign: <Text strong>{campaignInfo?.name ?? "--"}</Text>
          </Text>
        </div>
      </div>

      {/* Error */}
      {errorAll ? (
        <Card>
          <Alert
            type="error"
            showIcon
            message="Không thể tải chi tiết booking campaign."
            description={String(errorAll?.message ?? "")}
          />
        </Card>
      ) : (
        <>
          {/* Thông tin Campaign từ /campaigns/{id} */}
          <Card
            className="shadow-sm"
            bordered={false}
            title={
              <Space>
                <Layers size={18} />
                <span>Thông tin yêu cầu từ khách hàng</span>
              </Space>
            }
            loading={isLoadingAll}
          >
            <Space size="middle" wrap className="justify-between w-full mb-4">
              <Tag color={CAMPAIGN_STATUS_COLOR[normalizedStatus] ?? "default"}>
                {statusLabel}
              </Tag>

              {responseTimestamp && (
                <Text type="secondary">
                  Thời gian phản hồi: {formatDateTime(responseTimestamp)}
                </Text>
              )}
            </Space>

            <Descriptions
              bordered
              size="middle"
              column={screens.lg ? 3 : screens.md ? 2 : 1}
              styles={{
                label: { width: 180 },
              }}
            >
              <Descriptions.Item label="Tên Campaign">
                {campaignInfo?.name ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Người tạo (email)">
                <Text copyable>{campaignInfo?.createdBy ?? "--"}</Text>
              </Descriptions.Item>

              <Descriptions.Item label="Mục tiêu" span={screens.lg ? 3 : 1}>
                <Text style={{ whiteSpace: "pre-wrap" }}>
                  {campaignInfo?.objective ?? "--"}
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label="Giá mục tiêu">
                {formatCurrency(campaignInfo?.targetPrice)}
              </Descriptions.Item>

              <Descriptions.Item label="Ngày bắt đầu">
                {formatDate(campaignInfo?.startDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày kết thúc">
                {formatDate(campaignInfo?.endDate)}
              </Descriptions.Item>

              {/* ✅ ĐÃ BỎ 3 field: Tổng booking / Tổng KOL / Tổng Livestream */}

              <Descriptions.Item label="KOL tham gia" span={screens.lg ? 3 : 1}>
                {formatArrayText(campaignInfo?.kols)}
              </Descriptions.Item>

              <Descriptions.Item
                label="Trợ Live tham gia"
                span={screens.lg ? 3 : 1}
              >
                {formatArrayText(campaignInfo?.lives)}
              </Descriptions.Item>

              <Descriptions.Item label="Tạo lúc">
                {formatDateTime(campaignInfo?.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lúc">
                {formatDateTime(campaignInfo?.updatedAt)}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Các Booking thuộc Campaign – vẫn dùng /admin/bookings/admin/{campaignId} */}
          <Card
            className="shadow-sm"
            bordered={false}
            title={
              <Space>
                <FileText size={18} />
                <span>Thông tin Booking Campaign</span>
              </Space>
            }
          >
            {bookingRequests.length ? (
              bookingRequests.map((record, index) => {
                const schedules = Array.isArray(record?.paymentSchedules)
                  ? record.paymentSchedules
                  : [];

                const bookingStatus = normalizeStatus(record?.status);

                const bookingStatusLabel =
                  bookingStatus === "NEGOTIATING"
                    ? CAMPAIGN_STATUS_LABEL.NEGOTIATING
                    : BOOKING_STATUS_LABEL[bookingStatus] ??
                      bookingStatus ??
                      "--";

                const bookingStatusColor =
                  bookingStatus === "NEGOTIATING"
                    ? CAMPAIGN_STATUS_COLOR.NEGOTIATING
                    : STATUS_TAG_COLOR[bookingStatus] ?? "default";

                const contractStatus = normalizeStatus(record?.contractStatus);

                const contractFileUrl =
                  record?.contractFileUrl?.match(/https?:\/\/\S+/)?.[0] ??
                  record?.contractFileUrl ??
                  "";

                const contractFileName = contractFileUrl
                  ? decodeURIComponent(
                      contractFileUrl.split("/").pop().split("?")[0]
                    )
                  : null;

                return (
                  <Card
                    key={record?.id ?? index}
                    type="inner"
                    className="mb-4 last:mb-0"
                    title={`Booking ${
                      record?.bookingNumber ?? `#${index + 1}`
                    }`}
                  >
                    {/* THÔNG TIN CHUNG CỦA BOOKING */}
                    <Descriptions
                      bordered
                      size="middle"
                      column={screens.lg ? 3 : screens.md ? 2 : 1}
                      styles={{ label: { width: 200 } }}
                    >
                      <Descriptions.Item label="Mã booking">
                        {record?.bookingNumber ?? "--"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Trạng thái">
                        {bookingStatus ? (
                          <Tag color={bookingStatusColor}>
                            {bookingStatusLabel}
                          </Tag>
                        ) : (
                          "--"
                        )}
                      </Descriptions.Item>

                      <Descriptions.Item
                        label="Mô tả"
                        span={screens.lg ? 3 : 1}
                      >
                        <Text style={{ whiteSpace: "pre-wrap" }}>
                          {record?.description ?? "--"}
                        </Text>
                      </Descriptions.Item>

                      <Descriptions.Item label="Kiểu lặp">
                        {record?.repeatType ?? "--"}
                      </Descriptions.Item>

                      <Descriptions.Item label="Lặp đến">
                        {formatDate(record?.repeatUntil)}
                      </Descriptions.Item>

                      <Descriptions.Item label="Giá trị hợp đồng">
                        {formatCurrency(record?.contractAmount)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Tổng giá trị booking">
                        {formatCurrency(record?.amount)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Người tạo (email)">
                        <Text copyable>{record?.createdByEmail ?? "--"}</Text>
                      </Descriptions.Item>

                      <Descriptions.Item label="KOL">
                        {formatArrayText(record?.kols)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Livestream">
                        {formatArrayText(record?.lives)}
                      </Descriptions.Item>

                      <Descriptions.Item label="Tạo lúc">
                        {formatDateTime(record?.createdAt)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Cập nhật lúc">
                        {formatDateTime(record?.updatedAt)}
                      </Descriptions.Item>
                    </Descriptions>

                    <Divider />

                    {/* HỢP ĐỒNG – 1 hàng 2 ô */}
                    <Title level={5} className="!mb-2">
                      Hợp đồng
                    </Title>

                    <Descriptions
                      bordered
                      size="middle"
                      column={screens.lg ? 2 : 1}
                      styles={{ label: { width: 200 } }}
                    >
                      <Descriptions.Item label="Mã hợp đồng">
                        {record?.contractNumber ?? "--"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Trạng thái hợp đồng">
                        {contractStatus ?? "--"}
                      </Descriptions.Item>

                      <Descriptions.Item label="File hợp đồng">
                        {contractFileUrl ? (
                          <a
                            href={contractFileUrl}
                            download
                            className="text-blue-600 hover:text-blue-500"
                          >
                            {contractFileName || "Tải hợp đồng"}
                          </a>
                        ) : (
                          "--"
                        )}
                      </Descriptions.Item>

                      <Descriptions.Item label="Ký bởi thương hiệu">
                        {formatDateTime(record?.signedAtBrand)}
                      </Descriptions.Item>
                    </Descriptions>

                    <Divider />

                    {/* LỊCH THANH TOÁN */}
                    <Title level={5} className="!mb-2">
                      Lịch thanh toán
                    </Title>

                    {schedules.length ? (
                      <Table
                        columns={paymentScheduleColumns}
                        dataSource={schedules}
                        rowKey={(s) => s?.id ?? s?.installmentNumber}
                        pagination={false}
                        size="small"
                        scroll={{ x: 720 }}
                      />
                    ) : (
                      <Empty description="Không có lịch thanh toán" />
                    )}
                  </Card>
                );
              })
            ) : (
              <Empty description="Không có booking nào trong campaign này" />
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default BookingCampaignDetail;
