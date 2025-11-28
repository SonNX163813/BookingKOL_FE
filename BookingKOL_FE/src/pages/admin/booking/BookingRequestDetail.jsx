// src/pages/admin/booking/BookingRequestDetail.jsx
import { useMemo } from "react";
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
  Image,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  Tooltip,
} from "antd";
import {
  ArrowLeft,
  CalendarRange,
  FileText,
  Layers,
  UserCircle2,
} from "lucide-react";
import { useGetBookingRequestDetail } from "../../../hook/admin/booking/useGetBookingRequestDetail";
import {
  BOOKING_STATUS_LABEL,
  STATUS_TAG_COLOR,
  PAYMENT_STATUS_LABEL,
  PAYMENT_STATUS_COLOR,
} from "../../../constants/mySingleBookingStatuses";
import { useGetWorktimeLivestreamMetrics } from "../../../hook/admin/booking/useGetWorktimeLivestreamMetrics";

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") => {
  if (!value) return "--";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : String(value);
};

const formatBoolean = (value) => {
  if (value === null || value === undefined) return "--";
  return value ? "Yes" : "No";
};

const formatCurrency = (value, currency = "VND") => {
  if (value === null || value === undefined || value === "") return "--";

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

const formatArrayOrValue = (value) => {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "--";
  if (value === null || value === undefined || value === "") return "--";
  return String(value);
};

const renderMessage = (message) => {
  if (!message) return null;

  if (Array.isArray(message)) {
    return message.map((item, index) => (
      <Paragraph key={index} className="mb-1">
        - {String(item)}
      </Paragraph>
    ));
  }

  return <Paragraph>{String(message)}</Paragraph>;
};

const normalizeFileType = (fileType) =>
  fileType && typeof fileType === "string" ? fileType.toUpperCase() : "";

/** Cắt chuỗi + tooltip */
const renderEllipsisText = (text, maxLength = 42) => {
  const raw = text ?? "";
  const str = String(raw);
  if (!str) return "--";
  if (str.length <= maxLength) return str;

  const short = `${str.slice(0, maxLength)}...`;
  return (
    <Tooltip title={str}>
      <span>{short}</span>
    </Tooltip>
  );
};

const renderFilePreviewCell = ({ fileType, fileUrl, fileName }) => {
  if (!fileUrl) return "--";

  const normalizedType = normalizeFileType(fileType);

  // ưu tiên tên file để hiển thị
  const displayText = fileName || fileUrl;

  if (normalizedType === "IMAGE") {
    return (
      <Image
        src={fileUrl}
        alt={fileName ?? "image-preview"}
        width={96}
        height={96}
        style={{ objectFit: "cover", borderRadius: 8 }}
        preview={{ mask: "Xem ảnh" }}
      />
    );
  }

  if (normalizedType === "VIDEO") {
    return (
      <Tooltip title={fileUrl}>
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:text-blue-500"
        >
          Xem video
        </a>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={fileUrl}>
      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        className="text-blue-600 hover:text-blue-500"
      >
        {renderEllipsisText(displayText, 48)}
      </a>
    </Tooltip>
  );
};

const renderImageField = (fileUrl, label) => {
  if (!fileUrl) return "--";

  return (
    <Space direction="vertical" size={8}>
      <Image
        src={fileUrl}
        alt={label ?? "image-preview"}
        width={140}
        height={140}
        style={{ objectFit: "cover", borderRadius: 12 }}
        preview={{ mask: "Xem ảnh" }}
      />
    </Space>
  );
};

const LIVESTREAM_METRIC_LABELS = [
  { key: "revenue", label: "Tổng doanh thu" },
  { key: "gpm", label: "GPM" },
  { key: "avgOrderValue", label: "Giá trị TB mỗi đơn" },
  { key: "totalOrders", label: "Tổng đơn hàng" },
  { key: "buyers", label: "Số người mua" },
  { key: "productsSold", label: "Các mặt hàng được bán" },
  { key: "totalViews", label: "Tổng lượt xem" },
  { key: "liveViewsOver1min", label: "Lượt xem live > 1 phút" },
  { key: "viewsUnder1min", label: "Lượt xem < 1 phút" },
  { key: "pcu", label: "PCU (đồng xem cao nhất)" },
  { key: "avgViewDuration", label: "Thời gian xem TB (giây)" },
  { key: "commentsIn1min", label: "BL trong 1 phút" },
  { key: "totalComments", label: "Tổng bình luận" },
  { key: "productClickRate", label: "Tỷ lệ click SP" },
  { key: "orderConversionRate", label: "Tỷ lệ chuyển đổi đơn" },
];

const formatLivestreamMetricValue = (key, value) => {
  if (value === null || value === undefined || value === "") return "--";
  if (key === "revenue" || key === "avgOrderValue")
    return formatCurrency(value);
  if (key === "isConfirmed") return formatBoolean(value);
  if (key === "createdAt" || key === "confirmedAt")
    return formatDateTime(value);
  return value;
};

const getFileNameFromUrl = (url) => {
  if (!url || typeof url !== "string") return "";
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || url;
  } catch (e) {
    const parts = url.split("/").filter(Boolean);
    return parts[parts.length - 1] || url;
  }
};

const hasAnyLivestreamMetricValue = (metrics) => {
  if (!metrics || typeof metrics !== "object") return false;
  return LIVESTREAM_METRIC_LABELS.some(({ key }) => {
    const v = metrics?.[key];
    return !(v === null || v === undefined || v === "");
  });
};

const hasMeaningfulValue = (v) => {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.filter(Boolean).length > 0;
  return true;
};

const BookingRequestDetail = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const screens = useBreakpoint();

  const {
    isLoadingBookingRequestDetail,
    isFetchingBookingRequestDetail,
    bookingRequestDetailResponse,
    errorBookingRequestDetail,
    refetchBookingRequestDetail,
  } = useGetBookingRequestDetail(requestId);

  const detail = bookingRequestDetailResponse?.data ?? null;
  const responseTimestamp = bookingRequestDetailResponse?.timestamp ?? null;

  const worktimeIds = useMemo(
    () =>
      Array.isArray(detail?.kolWorkTimes)
        ? detail.kolWorkTimes
            .map((worktime) => worktime?.id)
            .filter((id) => id !== null && id !== undefined)
        : [],
    [detail?.kolWorkTimes]
  );

  const {
    worktimeLivestreamMetricsMap,
    worktimeLivestreamMetricQueries,
    resolvedWorktimeIds,
  } = useGetWorktimeLivestreamMetrics(worktimeIds, {
    enabled: worktimeIds.length > 0,
    retry: false,
  });

  const worktimeMetricsQueryMap = useMemo(() => {
    const queryMap = new Map();
    resolvedWorktimeIds.forEach((id, index) => {
      queryMap.set(id, worktimeLivestreamMetricQueries[index]);
    });
    return queryMap;
  }, [resolvedWorktimeIds, worktimeLivestreamMetricQueries]);

  const normalizedStatus = normalizeStatus(detail?.status);
  const statusLabel =
    BOOKING_STATUS_LABEL[normalizedStatus] ?? normalizedStatus ?? "--";

  // ✅ Tệp đính kèm: đổi ID -> STT + ellipsis cho tên/link
  const attachedFileColumns = useMemo(
    () => [
      {
        title: "STT",
        key: "stt",
        width: 70,
        align: "center",
        render: (_v, _r, index) => index + 1,
      },
      {
        title: "Tên tệp",
        key: "fileName",
        render: (_v, record) => {
          const name = record?.file?.fileName ?? record?.fileName;
          // nếu không có name thì thử lấy từ url
          const url = record?.file?.fileUrl ?? record?.fileUrl;
          const fallback = url ? getFileNameFromUrl(url) : "";
          return renderEllipsisText(name || fallback || "--", 50);
        },
      },
      {
        title: "Liên kết tệp",
        key: "fileUrl",
        render: (_v, record) =>
          renderFilePreviewCell({
            fileType: record?.file?.fileType ?? record?.fileType,
            fileUrl: record?.file?.fileUrl ?? record?.fileUrl,
            fileName: record?.file?.fileName ?? record?.fileName,
          }),
      },
      {
        title: "Loại tệp",
        key: "fileType",
        width: 120,
        render: (_v, record) =>
          record?.file?.fileType ?? record?.fileType ?? "--",
      },
      {
        title: "Tạo lúc",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 180,
        render: (v) => formatDateTime(v),
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
            onClick={() => navigate("/admin/management-booking-requests")}
          >
            Quay lại danh sách
          </Button>
          <Button
            icon={<CalendarRange size={16} />}
            onClick={() => refetchBookingRequestDetail()}
            loading={isFetchingBookingRequestDetail}
          >
            Làm mới
          </Button>
        </Space>

        <div className="text-right">
          <Title level={4} className="!mb-1">
            Chi tiết yêu cầu đặt chỗ
          </Title>
          <Text type="secondary">
            Mã yêu cầu:{" "}
            <Text strong>
              {detail?.requestNumber ?? detail?.id ?? requestId ?? "--"}
            </Text>
          </Text>
        </div>
      </div>

      {errorBookingRequestDetail ? (
        <Card>
          <Alert
            type="error"
            message="Không thể tải chi tiết yêu cầu đặt chỗ."
            description={String(errorBookingRequestDetail?.message ?? "")}
            showIcon
          />
        </Card>
      ) : (
        <Skeleton
          loading={isLoadingBookingRequestDetail}
          active
          paragraph={{ rows: 6 }}
        >
          {/* --- Thông tin yêu cầu đặt chỗ --- */}
          <Card className="shadow-sm" bordered={false}>
            <Space size="middle" wrap className="justify-between w-full">
              <Space size="middle" wrap>
                <Tag color={STATUS_TAG_COLOR[normalizedStatus] ?? "default"}>
                  {statusLabel}
                </Tag>
              </Space>
              <Space size="small" direction="vertical" className="text-right">
                {responseTimestamp && (
                  <Text type="secondary">
                    Thời gian phản hồi: {formatDateTime(responseTimestamp)}
                  </Text>
                )}
              </Space>
            </Space>

            <Divider />

            <Descriptions
              bordered
              size="middle"
              title={
                <Space>
                  <UserCircle2 size={18} />
                  <span>Thông tin Booking</span>
                </Space>
              }
              column={screens.lg ? 3 : screens.md ? 2 : 1}
              labelStyle={{ width: 180 }}
            >
              <Descriptions.Item label="Mã yêu cầu">
                {detail?.requestNumber ?? detail?.id ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {statusLabel}
              </Descriptions.Item>

              <Descriptions.Item label="Mô tả" span={screens.lg ? 3 : 1}>
                <Text style={{ whiteSpace: "pre-wrap" }}>
                  {detail?.description || "--"}
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label="Địa điểm" span={screens.lg ? 3 : 1}>
                {detail?.location || "--"}
              </Descriptions.Item>

              <Descriptions.Item label="Bắt đầu lúc">
                {formatDateTime(detail?.startAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Kết thúc lúc">
                {formatDateTime(detail?.endAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Tạo lúc">
                {formatDateTime(detail?.createdAt)}
              </Descriptions.Item>

              {hasMeaningfulValue(detail?.updatedAt) && (
                <Descriptions.Item label="Cập nhật lúc">
                  {formatDateTime(detail?.updatedAt)}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* --- Thông tin người yêu cầu --- */}
          <Card
            className="shadow-sm"
            bordered={false}
            title={
              <Space>
                <UserCircle2 size={18} />
                <span>Thông tin người yêu cầu</span>
              </Space>
            }
          >
            <Descriptions
              bordered
              size="middle"
              column={screens.lg ? 3 : screens.md ? 2 : 1}
              labelStyle={{ width: 180 }}
            >
              <Descriptions.Item label="Họ tên đầy đủ">
                {detail?.user?.fullName ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                <Text copyable>{detail?.user?.email ?? "--"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {detail?.user?.phone ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Giới tính">
                {detail?.user?.gender === "Male"
                  ? "Nam"
                  : detail?.user?.gender === "Female"
                  ? "Nữ"
                  : "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">
                {detail?.user?.address ?? "--"}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* --- Thông tin KOL --- */}
          <Card
            className="shadow-sm"
            bordered={false}
            title={
              <Space>
                <UserCircle2 size={18} />
                <span>Thông tin KOL</span>
              </Space>
            }
          >
            <Descriptions
              bordered
              size="middle"
              column={screens.lg ? 3 : screens.md ? 2 : 1}
              labelStyle={{ width: 180 }}
            >
              <Descriptions.Item label="Họ tên đầy đủ">
                {detail?.kol?.fullName ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Tên hiển thị">
                {detail?.kol?.displayName ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Ảnh đại diện" span={screens.lg ? 3 : 1}>
                {renderImageField(
                  detail?.kol?.avatarUrl,
                  detail?.kol?.displayName ?? detail?.kol?.fullName
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">
                {formatDateTime(detail?.kol?.dob, "DD/MM/YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="Tiểu sử" span={screens.lg ? 3 : 1}>
                <Text style={{ whiteSpace: "pre-wrap" }}>
                  {detail?.kol?.bio ?? "--"}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Kinh nghiệm" span={screens.lg ? 3 : 1}>
                <Text style={{ whiteSpace: "pre-wrap" }}>
                  {detail?.kol?.experience ?? "--"}
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label="Thành phố">
                {detail?.kol?.city ?? "--"}
              </Descriptions.Item>

              <Descriptions.Item label="Giá đặt tối thiểu">
                {formatCurrency(detail?.kol?.minBookingPrice)}
              </Descriptions.Item>
              <Descriptions.Item label="Khả dụng">
                {formatBoolean(detail?.kol?.isAvailable)}
              </Descriptions.Item>
              <Descriptions.Item label="Đánh giá">
                {detail?.kol?.overallRating ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Số lượng phản hồi">
                {detail?.kol?.feedbackCount ?? "--"}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* ✅ Hợp đồng & Thanh toán (ẩn các field nếu null) */}
          <Card
            className="shadow-sm"
            bordered={false}
            title={
              <Space>
                <FileText size={18} />
                <span>Hợp đồng & Thanh toán</span>
              </Space>
            }
          >
            {detail?.contracts && detail.contracts.length > 0 ? (
              detail.contracts.map((contract) => {
                const paymentStatus = normalizeStatus(
                  contract?.paymentDTO?.status
                );
                const contractFileUrl = contract?.terms;
                const contractFileName = contractFileUrl
                  ? getFileNameFromUrl(contractFileUrl)
                  : "";

                const failureReason = contract?.paymentDTO?.failureReason;
                const transactionIds = contract?.paymentDTO?.transactionIds;
                const refundIds = contract?.paymentDTO?.refundIds;

                return (
                  <Card
                    key={
                      contract?.contractNumber ?? contract?.id ?? Math.random()
                    }
                    className="mb-4 last:mb-0"
                    type="inner"
                    title={`Hợp đồng ${
                      contract?.contractNumber ?? contract?.id ?? ""
                    }`}
                  >
                    <Descriptions
                      bordered
                      size="middle"
                      column={screens.lg ? 3 : screens.md ? 2 : 1}
                      labelStyle={{ width: 180 }}
                    >
                      <Descriptions.Item
                        label="File hợp đồng"
                        span={screens.lg ? 3 : 1}
                      >
                        {contractFileUrl ? (
                          <a
                            href={contractFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            download={contractFileName || true}
                            className="text-blue-600 hover:text-blue-500"
                          >
                            {renderEllipsisText(contractFileName, 60)}
                          </a>
                        ) : (
                          "--"
                        )}
                      </Descriptions.Item>

                      <Descriptions.Item label="Tạo lúc">
                        {formatDateTime(contract?.createdAt)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Cập nhật lúc">
                        {formatDateTime(contract?.updatedAt)}
                      </Descriptions.Item>
                    </Descriptions>

                    <Divider />

                    <Title level={5} className="!mb-2 flex items-center gap-2">
                      <Layers size={16} /> Thanh toán
                    </Title>

                    <Descriptions
                      bordered
                      size="middle"
                      column={screens.lg ? 3 : screens.md ? 2 : 1}
                      labelStyle={{ width: 180 }}
                    >
                      <Descriptions.Item label="Trạng thái">
                        {paymentStatus ? (
                          <Tag
                            color={
                              PAYMENT_STATUS_COLOR[paymentStatus] ?? "default"
                            }
                          >
                            {PAYMENT_STATUS_LABEL[paymentStatus] ??
                              paymentStatus}
                          </Tag>
                        ) : (
                          "--"
                        )}
                      </Descriptions.Item>

                      <Descriptions.Item label="Tổng tiền">
                        {formatCurrency(contract?.paymentDTO?.totalAmount)}
                      </Descriptions.Item>

                      <Descriptions.Item label="Đã thanh toán">
                        {formatCurrency(contract?.paymentDTO?.paidAmount)}
                      </Descriptions.Item>

                      {hasMeaningfulValue(failureReason) && (
                        <Descriptions.Item
                          label="Lý do thất bại"
                          span={screens.lg ? 3 : 1}
                        >
                          {String(failureReason)}
                        </Descriptions.Item>
                      )}

                      <Descriptions.Item label="Tạo lúc">
                        {formatDateTime(contract?.paymentDTO?.createdAt)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Cập nhật lúc">
                        {formatDateTime(contract?.paymentDTO?.updatedAt)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Hết hạn lúc">
                        {formatDateTime(contract?.paymentDTO?.expiresAt)}
                      </Descriptions.Item>

                      {hasMeaningfulValue(transactionIds) && (
                        <Descriptions.Item
                          label="Mã giao dịch"
                          span={screens.lg ? 3 : 1}
                        >
                          <Text style={{ whiteSpace: "pre-wrap" }}>
                            {formatArrayOrValue(transactionIds)}
                          </Text>
                        </Descriptions.Item>
                      )}

                      {hasMeaningfulValue(refundIds) && (
                        <Descriptions.Item
                          label="Mã hoàn tiền"
                          span={screens.lg ? 3 : 1}
                        >
                          <Text style={{ whiteSpace: "pre-wrap" }}>
                            {formatArrayOrValue(refundIds)}
                          </Text>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Card>
                );
              })
            ) : (
              <Empty description="Không có hợp đồng" />
            )}
          </Card>

          {/* --- Livestream Metrics --- */}
          <Card
            className="shadow-sm"
            bordered={false}
            title={
              <Space>
                <Layers size={18} />
                <span>Thống kê Livestream</span>
              </Space>
            }
          >
            {detail?.kolWorkTimes && detail.kolWorkTimes.length > 0 ? (
              detail.kolWorkTimes.map((worktime, index) => {
                const worktimeId = worktime?.id;

                const metrics = worktimeId
                  ? worktimeLivestreamMetricsMap.get(worktimeId)
                  : null;

                const queryState = worktimeId
                  ? worktimeMetricsQueryMap.get(worktimeId)
                  : null;

                const isMetricsLoading =
                  queryState?.isPending || queryState?.isFetching;

                const metricsError = queryState?.error;

                const rawMessage = metricsError?.response?.data?.message;
                const statusCode = metricsError?.response?.status;

                const messageText = Array.isArray(rawMessage)
                  ? rawMessage.filter(Boolean).join(" | ")
                  : rawMessage ?? metricsError?.message ?? "";

                const isNoMetricsError =
                  !!metricsError &&
                  statusCode === 400 &&
                  /không tìm thấy\s+livestream\s+metric/i.test(
                    String(messageText)
                  );

                const shouldShowEmptyForNoData =
                  !metrics || !hasAnyLivestreamMetricValue(metrics);

                return (
                  <Card
                    key={worktimeId ?? index}
                    className="mb-4 last:mb-0"
                    type="inner"
                    title={`Ca làm việc ${index + 1}`}
                  >
                    <Divider />
                    <Title level={5} className="!mb-2">
                      Thống kê chi tiết
                    </Title>

                    {isMetricsLoading ? (
                      <Skeleton active paragraph={{ rows: 6 }} />
                    ) : metricsError && !isNoMetricsError ? (
                      <Alert
                        type="error"
                        showIcon
                        message="Không thể tải thống kê livestream."
                        description={
                          messageText ? String(messageText) : undefined
                        }
                      />
                    ) : isNoMetricsError || shouldShowEmptyForNoData ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Không có dữ liệu"
                      />
                    ) : (
                      <Descriptions
                        bordered
                        size="middle"
                        column={screens.lg ? 3 : screens.md ? 2 : 1}
                        labelStyle={{ width: 200 }}
                      >
                        {LIVESTREAM_METRIC_LABELS.map(({ key, label }) => (
                          <Descriptions.Item key={key} label={label}>
                            {formatLivestreamMetricValue(key, metrics?.[key])}
                          </Descriptions.Item>
                        ))}
                      </Descriptions>
                    )}
                  </Card>
                );
              })
            ) : (
              <Empty description="Không có phiên làm việc" />
            )}
          </Card>

          {/* --- Tệp đính kèm --- */}
          <Card
            className="shadow-sm"
            bordered={false}
            title={
              <Space>
                <FileText size={18} />
                <span>Tệp đính kèm</span>
              </Space>
            }
          >
            {detail?.attachedFiles && detail.attachedFiles.length > 0 ? (
              <Table
                columns={attachedFileColumns}
                dataSource={detail.attachedFiles}
                // ✅ rowKey vẫn dùng id (ẩn khỏi UI), fallback tránh lỗi nếu thiếu id
                rowKey={(record, idx) => record?.id ?? `file-${idx}`}
                pagination={false}
                scroll={{ x: 720 }}
              />
            ) : (
              <Empty description="Không có tệp đính kèm" />
            )}
          </Card>
        </Skeleton>
      )}
    </div>
  );
};

export default BookingRequestDetail;
