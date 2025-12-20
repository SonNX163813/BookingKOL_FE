// src/pages/admin/booking-campaign/BookingCampaignDetail.jsx
import React, { useMemo, useState } from "react";
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
import {
  ArrowLeft,
  CalendarRange,
  FileText,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
  if (value === null || value === undefined || value === "") return "--";
  const numeric = typeof value === "number" ? value : Number.parseFloat(value);
  if (Number.isNaN(numeric)) return "--";
  return (
    new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 0,
    }).format(numeric) + " VND"
  );
};

const normalizeUpper = (val) =>
  val && typeof val === "string" ? val.toUpperCase() : val;

const formatArrayText = (items) => {
  if (!Array.isArray(items) || !items.length) return "--";
  return items
    .map((x) => x?.displayName || x?.name || x?.id)
    .filter(Boolean)
    .join(", ");
};

// ✅ repeatType label (giống BookingCampaignSchedule)
const REPEAT_TYPE_LABEL = {
  WEEKLY: "Hàng tuần",
  DAILY: "Hàng ngày",
  MONTHLY: "Hàng tháng",
  ONCE: "Một lần",
  NONE: "Không lặp",
};

const formatRepeatType = (value) => {
  if (value === null || value === undefined || value === "") return "--";
  const raw = String(value).trim();
  const upper = normalizeUpper(raw);
  return REPEAT_TYPE_LABEL[upper] ?? raw;
};

const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") return "--";
  const n = typeof value === "number" ? value : Number.parseFloat(value);
  if (Number.isNaN(n)) return String(value);
  return `${n}%`;
};

// mapping nhỏ cho status campaign
const CAMPAIGN_STATUS_LABEL = {
  REQUESTED: "Đang yêu cầu",
  NEGOTIATING: "Đang thương lượng",
  ACCEPTED: "Đã chấp nhận",
  REJECTED: "Đã từ chối",
  CANCELLED: "Đã hủy",
  IN_PROGRESS: "Đang triển khai",
  COMPLETED: "Hoàn tất",
};

const CAMPAIGN_STATUS_COLOR = {
  REQUESTED: "gold",
  NEGOTIATING: "purple",
  ACCEPTED: "green",
  REJECTED: "red",
  CANCELLED: "default",
  IN_PROGRESS: "geekblue",
  COMPLETED: "blue",
};

/** ✅ NEW: Package type label ngay trong file */
const PACKAGE_TYPE_LABEL = {
  normal: "Gói thường",
  vip: "Gói VIP",
};

const normalizePackageType = (value) => {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (raw === "vip") return "vip";
  return "normal"; // ✅ default
};

const formatPackageType = (value) => {
  const key = normalizePackageType(value);
  return PACKAGE_TYPE_LABEL[key] ?? key;
};

const BookingCampaignDetail = () => {
  const { campaignId } = useParams();
  const navigate = useNavigate();
  const screens = useBreakpoint();

  // ✅ Thu gọn/mở rộng phần “Thông tin Booking Campaign” (giống Schedule)
  const [campaignInfoCollapsed, setCampaignInfoCollapsed] = useState(false);

  // ✅ Thu gọn/mở rộng phần “Thông tin yêu cầu từ khách hàng”
  const [collapseCampaignInfo, setCollapseCampaignInfo] = useState(false);

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

  const hasCampaignKols =
    Array.isArray(campaignInfo?.kols) && campaignInfo.kols.length > 0;
  const hasCampaignLives =
    Array.isArray(campaignInfo?.lives) && campaignInfo.lives.length > 0;

  const bookingRequests = useMemo(
    () =>
      Array.isArray(bookingsDetail?.bookingRequests)
        ? bookingsDetail.bookingRequests
        : [],
    [bookingsDetail?.bookingRequests]
  );

  const isLoadingAll = isLoadingBookings || isLoadingCampaign;
  const isFetchingAll = isFetchingBookings || isFetchingCampaign;
  const errorAll = errorCampaign || errorBookings;

  const handleRefresh = () => {
    refetchCampaign();
    refetchBookings();
  };

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
          const s = normalizeUpper(v);
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
        render: (v) => normalizeUpper(v) ?? "--",
      },
    ],
    []
  );

  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
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
        </div>
      </div>

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
          {/* ✅ UPDATED: Thông tin yêu cầu từ khách hàng */}
          <Card
            className="shadow-sm"
            bordered={false}
            loading={isLoadingAll}
            title={
              <Space>
                <Layers size={18} />
                <span>Thông tin yêu cầu từ khách hàng</span>
              </Space>
            }
            extra={
              <Button
                size="small"
                type="default"
                onClick={() => setCollapseCampaignInfo((v) => !v)}
                icon={
                  collapseCampaignInfo ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronUp size={16} />
                  )
                }
              >
                {collapseCampaignInfo ? "Mở rộng" : "Thu gọn"}
              </Button>
            }
          >
            {errorCampaign ? (
              <Alert
                type="error"
                showIcon
                message="Không thể tải thông tin campaign."
                description={String(errorCampaign?.message ?? "")}
              />
            ) : campaignInfo ? (
              <>
                <Space
                  size="middle"
                  wrap
                  className="justify-between w-full mb-4"
                >
                  <Tag
                    color={
                      CAMPAIGN_STATUS_COLOR[
                        normalizeUpper(campaignInfo?.status)
                      ] ?? "default"
                    }
                  >
                    {CAMPAIGN_STATUS_LABEL[
                      normalizeUpper(campaignInfo?.status)
                    ] ??
                      normalizeUpper(campaignInfo?.status) ??
                      "--"}
                  </Tag>
                </Space>

                {collapseCampaignInfo ? (
                  <Descriptions
                    bordered
                    size="middle"
                    column={screens.lg ? 3 : screens.md ? 2 : 1}
                    styles={{ label: { width: 180 } }}
                  >
                    <Descriptions.Item label="Tên chiến dịch">
                      {campaignInfo?.name ?? "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Thời gian">
                      {formatDate(campaignInfo?.startDate)} -{" "}
                      {formatDate(campaignInfo?.endDate)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người đặt">
                      {campaignInfo?.ordererFullName ?? "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Số điện thoại">
                      {campaignInfo?.ordererPhone ? (
                        <Text copyable>{campaignInfo.ordererPhone}</Text>
                      ) : (
                        "--"
                      )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Số giờ livestream">
                      {campaignInfo?.livestreamHours ?? "--"}
                    </Descriptions.Item>

                    {/* ✅ NEW: packageType */}
                    <Descriptions.Item label="Gói dịch vụ">
                      {formatPackageType(campaignInfo?.packageType ?? "normal")}
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <Descriptions
                    bordered
                    size="middle"
                    column={screens.lg ? 3 : screens.md ? 2 : 1}
                    styles={{ label: { width: 180 } }}
                  >
                    <Descriptions.Item label="Tên Campaign">
                      {campaignInfo?.name ?? "--"}
                    </Descriptions.Item>

                    {/* ✅ NEW: packageType */}
                    <Descriptions.Item label="Gói dịch vụ">
                      {formatPackageType(campaignInfo?.packageType ?? "normal")}
                    </Descriptions.Item>

                    <Descriptions.Item label="Họ và tên người đặt">
                      {campaignInfo?.ordererFullName ?? "--"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Số điện thoại">
                      {campaignInfo?.ordererPhone ? (
                        <Text copyable>{campaignInfo.ordererPhone}</Text>
                      ) : (
                        "--"
                      )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Email">
                      <Text copyable>{campaignInfo?.createdBy ?? "--"}</Text>
                    </Descriptions.Item>

                    <Descriptions.Item
                      label="Mục tiêu"
                      span={screens.lg ? 3 : 1}
                    >
                      <Text style={{ whiteSpace: "pre-wrap" }}>
                        {campaignInfo?.objective ?? "--"}
                      </Text>
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày bắt đầu">
                      {formatDate(campaignInfo?.startDate)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày kết thúc">
                      {formatDate(campaignInfo?.endDate)}
                    </Descriptions.Item>

                    <Descriptions.Item label="Số giờ livestream">
                      {campaignInfo?.livestreamHours ?? "--"}
                    </Descriptions.Item>

                    <Descriptions.Item
                      label="Địa chỉ livestream"
                      span={screens.lg ? 3 : 1}
                    >
                      <Text style={{ whiteSpace: "pre-wrap" }}>
                        {campaignInfo?.livestreamAddress ?? "--"}
                      </Text>
                    </Descriptions.Item>

                    <Descriptions.Item
                      label="Địa chỉ thường trú"
                      span={screens.lg ? 3 : 1}
                    >
                      <Text style={{ whiteSpace: "pre-wrap" }}>
                        {campaignInfo?.permanentAddress ?? "--"}
                      </Text>
                    </Descriptions.Item>

                    <Descriptions.Item label="Mã số thuế">
                      {campaignInfo?.taxCode ? (
                        <Text copyable>{campaignInfo.taxCode}</Text>
                      ) : (
                        "--"
                      )}
                    </Descriptions.Item>

                    {hasCampaignKols && (
                      <Descriptions.Item
                        label="KOL tham gia"
                        span={screens.lg ? 3 : 1}
                      >
                        {formatArrayText(campaignInfo?.kols)}
                      </Descriptions.Item>
                    )}

                    {hasCampaignLives && (
                      <Descriptions.Item
                        label="Trợ Live tham gia"
                        span={screens.lg ? 3 : 1}
                      >
                        {formatArrayText(campaignInfo?.lives)}
                      </Descriptions.Item>
                    )}

                    <Descriptions.Item label="Tạo lúc">
                      {formatDateTime(campaignInfo?.createdAt)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Cập nhật lúc">
                      {formatDateTime(campaignInfo?.updatedAt)}
                    </Descriptions.Item>
                  </Descriptions>
                )}
              </>
            ) : (
              <Text type="secondary">Không có dữ liệu campaign.</Text>
            )}
          </Card>

          {/* ✅ Thông tin Booking Campaign */}
          <Card
            className="shadow-sm"
            bordered={false}
            title={
              <Space>
                <FileText size={18} />
                <span>Thông tin Booking Campaign</span>
              </Space>
            }
            extra={
              <Button
                size="small"
                type="default"
                icon={
                  campaignInfoCollapsed ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronUp size={16} />
                  )
                }
                onClick={() => setCampaignInfoCollapsed((p) => !p)}
              >
                {campaignInfoCollapsed ? "Mở rộng" : "Thu gọn"}
              </Button>
            }
            loading={isLoadingAll}
          >
            {campaignInfoCollapsed ? null : errorBookings ? (
              <Alert
                type="error"
                showIcon
                message="Không thể tải chi tiết booking campaign."
                description={String(errorBookings?.message ?? "")}
              />
            ) : bookingRequests.length ? (
              bookingRequests.map((record, index) => {
                const bookingStatus = normalizeUpper(record?.status);

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

                const kolsForBooking = Array.isArray(record?.campaignKols)
                  ? record.campaignKols
                  : Array.isArray(record?.kols)
                  ? record.kols
                  : [];

                const livesForBooking = Array.isArray(record?.campaignLives)
                  ? record.campaignLives
                  : Array.isArray(record?.lives)
                  ? record.lives
                  : [];

                const campaignObjective =
                  record?.campaignObjective ??
                  record?.objective ??
                  record?.campaign?.objective ??
                  "--";

                const hours =
                  record?.hours ??
                  record?.liveHours ??
                  record?.livestreamHours ??
                  null;

                const unitPrice =
                  record?.unitPrice ?? record?.pricePerHour ?? null;

                const discount =
                  record?.discount ??
                  record?.discountPercent ??
                  record?.discount_rate ??
                  null;

                const totalAmount =
                  record?.totalAmount ?? record?.amount ?? null;

                const livestreamAddress =
                  record?.livestreamAddress ??
                  record?.liveStreamAddress ??
                  record?.livestream_address ??
                  record?.live_address ??
                  record?.campaign?.livestreamAddress ??
                  record?.campaign?.liveStreamAddress ??
                  null;

                // ✅ NEW: packageType per booking (fallback normal)
                const packageType =
                  record?.packageType ??
                  record?.campaignPackageType ??
                  record?.campaign?.packageType ??
                  campaignInfo?.packageType ??
                  "normal";

                const schedules = (
                  Array.isArray(record?.paymentSchedules)
                    ? record.paymentSchedules
                    : []
                )
                  .slice()
                  .sort((a, b) => {
                    const da = a?.dueDate ? dayjs(a.dueDate) : null;
                    const db = b?.dueDate ? dayjs(b.dueDate) : null;

                    const va =
                      da && da.isValid()
                        ? da.valueOf()
                        : Number.POSITIVE_INFINITY;
                    const vb =
                      db && db.isValid()
                        ? db.valueOf()
                        : Number.POSITIVE_INFINITY;

                    return va - vb;
                  });

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
                    <Descriptions
                      bordered
                      size="middle"
                      column={screens.lg ? 3 : screens.md ? 2 : 1}
                      styles={{ label: { width: 200 } }}
                    >
                      <Descriptions.Item label="Trạng thái">
                        {bookingStatus ? (
                          <Tag color={bookingStatusColor}>
                            {bookingStatusLabel}
                          </Tag>
                        ) : (
                          "--"
                        )}
                      </Descriptions.Item>

                      <Descriptions.Item label="Tần suất lặp">
                        {formatRepeatType(record?.repeatType)}
                      </Descriptions.Item>

                      {/* ✅ NEW: packageType */}
                      <Descriptions.Item label="Gói dịch vụ">
                        {formatPackageType(packageType)}
                      </Descriptions.Item>

                      <Descriptions.Item
                        label="Mục tiêu chiến dịch"
                        span={screens.lg ? 3 : 1}
                      >
                        <Text style={{ whiteSpace: "pre-wrap" }}>
                          {campaignObjective}
                        </Text>
                      </Descriptions.Item>

                      <Descriptions.Item label="Ngày bắt đầu chiến dịch">
                        {formatDate(record?.startDate)}
                      </Descriptions.Item>

                      <Descriptions.Item label="Ngày kết thúc">
                        {formatDate(record?.endDate)}
                      </Descriptions.Item>

                      <Descriptions.Item label="Tổng số giờ">
                        {hours != null && hours !== "" ? `${hours} giờ` : "--"}
                      </Descriptions.Item>

                      <Descriptions.Item label="Đơn giá">
                        {unitPrice != null && unitPrice !== ""
                          ? formatCurrency(unitPrice)
                          : "--"}
                      </Descriptions.Item>

                      <Descriptions.Item label="Giảm giá (%)">
                        {discount != null && discount !== ""
                          ? formatPercent(discount)
                          : "0"}
                      </Descriptions.Item>

                      <Descriptions.Item label="Tổng tiền">
                        {totalAmount != null && totalAmount !== ""
                          ? formatCurrency(totalAmount)
                          : "--"}
                      </Descriptions.Item>

                      <Descriptions.Item
                        label="Địa điểm livestream"
                        span={screens.lg ? 3 : 1}
                      >
                        <Text style={{ whiteSpace: "pre-wrap" }}>
                          {livestreamAddress ?? "--"}
                        </Text>
                      </Descriptions.Item>

                      <Descriptions.Item label="Người tạo (email)">
                        <Text copyable>{record?.createdByEmail ?? "--"}</Text>
                      </Descriptions.Item>

                      {kolsForBooking.length > 0 && (
                        <Descriptions.Item label="KOL Livestream">
                          {formatArrayText(kolsForBooking)}
                        </Descriptions.Item>
                      )}

                      {livesForBooking.length > 0 && (
                        <Descriptions.Item label="Livestream">
                          {formatArrayText(livesForBooking)}
                        </Descriptions.Item>
                      )}

                      <Descriptions.Item label="Tạo lúc">
                        {formatDateTime(record?.createdAt)}
                      </Descriptions.Item>

                      <Descriptions.Item label="Cập nhật lúc">
                        {formatDateTime(record?.updatedAt)}
                      </Descriptions.Item>
                    </Descriptions>

                    <Divider />

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

                      <Descriptions.Item label="Giá trị hợp đồng">
                        {formatCurrency(record?.contractAmount)}
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
                    </Descriptions>

                    <Divider />

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
