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
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  const numeric = typeof value === "number" ? value : Number.parseFloat(value);

  if (Number.isNaN(numeric)) {
    return "--";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numeric);
};

const normalizeStatus = (status) =>
  status && typeof status === "string" ? status.toUpperCase() : status;

const formatArrayOrValue = (value) => {
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : "--";
  }

  if (value === null || value === undefined || value === "") {
    return "--";
  }

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

const renderFilePreviewCell = ({ fileType, fileUrl, fileName }) => {
  if (!fileUrl) {
    return "--";
  }

  const normalizedType = normalizeFileType(fileType);

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
      <a
        href={fileUrl}
        target="_blank"
        rel="noreferrer"
        className="text-blue-600 hover:text-blue-500"
      >
        Xem video
      </a>
    );
  }

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noreferrer"
      className="text-blue-600 hover:text-blue-500"
    >
      {fileName ?? fileUrl}
    </a>
  );
};

const renderImageField = (fileUrl, label) => {
  if (!fileUrl) {
    return "--";
  }

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
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  if (key === "revenue" || key === "avgOrderValue") {
    return formatCurrency(value);
  }

  if (key === "isConfirmed") {
    return formatBoolean(value);
  }

  if (key === "createdAt" || key === "confirmedAt") {
    return formatDateTime(value);
  }

  return value;
};

// 🔹 Helper: lấy tên file từ URL
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

  const primaryPaymentStatus = normalizeStatus(
    detail?.contracts?.find((contract) => contract?.paymentDTO?.status)
      ?.paymentDTO?.status
  );
  const primaryPaymentColor = primaryPaymentStatus
    ? PAYMENT_STATUS_COLOR[primaryPaymentStatus] ?? "purple"
    : undefined;
  const primaryPaymentLabel = primaryPaymentStatus
    ? PAYMENT_STATUS_LABEL[primaryPaymentStatus] ?? primaryPaymentStatus
    : null;

  const fileUsageColumns = useMemo(
    () => [
      { title: "ID", dataIndex: "id", key: "id", width: 220 },
      {
        title: "Loại đối tượng",
        dataIndex: "targetType",
        key: "targetType",
      },
      {
        title: "ID đối tượng",
        dataIndex: "targetId",
        key: "targetId",
        width: 220,
      },
      {
        title: "Tạo lúc",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (v) => formatDateTime(v),
      },
      {
        title: "Loại tệp",
        key: "fileType",
        render: (_, r) => r?.file?.fileType ?? "--",
      },
      {
        title: "Liên kết tệp",
        key: "fileUrl",
        render: (_, record) =>
          renderFilePreviewCell({
            fileType: record?.file?.fileType,
            fileUrl: record?.file?.fileUrl,
            fileName: record?.file?.fileName,
          }),
      },
      {
        title: "Trạng thái tệp",
        key: "fileStatus",
        render: (_, r) => r?.file?.status ?? "--",
      },
    ],
    []
  );

  const contractColumns = useMemo(
    () => [
      {
        title: "Mã hợp đồng",
        key: "contractNumber",
        width: 220,
        render: (_, record) => record?.contractNumber ?? record?.id ?? "--",
      },
      {
        title: "Tạo lúc",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (v) => formatDateTime(v),
      },
      {
        title: "Trạng thái thanh toán",
        key: "paymentStatus",
        render: (_, r) => {
          const status = r?.paymentDTO?.status;
          if (!status) return "--";

          return (
            <Tag color={PAYMENT_STATUS_COLOR[status] ?? "default"}>
              {PAYMENT_STATUS_LABEL[status] ?? status}
            </Tag>
          );
        },
      },
      {
        title: "Tổng tiền",
        key: "totalAmount",
        render: (_, r) => formatCurrency(r?.paymentDTO?.totalAmount),
      },
      {
        title: "Đã thanh toán",
        key: "paidAmount",
        render: (_, r) => formatCurrency(r?.paymentDTO?.paidAmount),
      },
    ],
    []
  );

  const attachedFileColumns = useMemo(
    () => [
      { title: "ID", dataIndex: "id", key: "id", width: 220 },
      {
        title: "Tên tệp",
        key: "fileName",
        render: (_, record) =>
          record?.file?.fileName ?? record?.fileName ?? "--",
      },
      {
        title: "Liên kết tệp",
        key: "fileUrl",
        render: (_, record) =>
          renderFilePreviewCell({
            fileType: record?.file?.fileType ?? record?.fileType,
            fileUrl: record?.file?.fileUrl ?? record?.fileUrl,
            fileName: record?.file?.fileName ?? record?.fileName,
          }),
      },
      {
        title: "Loại tệp",
        key: "fileType",
        render: (_, record) =>
          record?.file?.fileType ?? record?.fileType ?? "--",
      },
      {
        title: "Tạo lúc",
        dataIndex: "createdAt",
        key: "createdAt",
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
                {primaryPaymentLabel && (
                  <Tag color={primaryPaymentColor ?? "purple"}>
                    {primaryPaymentLabel}
                  </Tag>
                )}
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
              column={screens.lg ? 3 : screens.md ? 2 : 1}
              labelStyle={{ width: 180 }}
            >
              <Descriptions.Item label="Mã yêu cầu">
                {detail?.requestNumber ?? detail?.id ?? "--"}
              </Descriptions.Item>

              {/* Đã bỏ "Loại đặt chỗ" */}
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
              <Descriptions.Item label="Cập nhật lúc">
                {formatDateTime(detail?.updatedAt)}
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
              <Descriptions.Item label="Mã KOL">
                {detail?.kol?.id ?? "--"}
              </Descriptions.Item>

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

              <Descriptions.Item label="Quốc gia">
                {detail?.kol?.country ?? "--"}
              </Descriptions.Item>

              <Descriptions.Item label="Thành phố">
                {detail?.kol?.city ?? "--"}
              </Descriptions.Item>

              <Descriptions.Item label="Ngôn ngữ">
                {detail?.kol?.languages ?? "--"}
              </Descriptions.Item>

              <Descriptions.Item
                label="Ghi chú bảng giá"
                span={screens.lg ? 3 : 1}
              >
                <Text style={{ whiteSpace: "pre-wrap" }}>
                  {detail?.kol?.rateCardNote ?? "--"}
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label="Giá đặt tối thiểu">
                {formatCurrency(detail?.kol?.minBookingPrice)}
              </Descriptions.Item>

              <Descriptions.Item label="Khả dụng">
                {formatBoolean(detail?.kol?.isAvailable)}
              </Descriptions.Item>

              <Descriptions.Item label="Đánh giá tổng thể">
                {detail?.kol?.overallRating ?? "--"}
              </Descriptions.Item>

              <Descriptions.Item label="Số lượng phản hồi">
                {detail?.kol?.feedbackCount ?? "--"}
              </Descriptions.Item>

              <Descriptions.Item label="Vai trò">
                {detail?.kol?.role ?? "--"}
              </Descriptions.Item>

              <Descriptions.Item label="Tạo lúc">
                {formatDateTime(detail?.kol?.createdAt)}
              </Descriptions.Item>

              <Descriptions.Item label="Cập nhật lúc">
                {formatDateTime(detail?.kol?.updatedAt)}
              </Descriptions.Item>

              <Descriptions.Item label="Xóa lúc">
                {formatDateTime(detail?.kol?.deletedAt)}
              </Descriptions.Item>
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
              <Descriptions.Item label="Mã người dùng">
                {detail?.user?.id ?? "--"}
              </Descriptions.Item>
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
              <Descriptions.Item label="Ảnh đại diện" span={screens.lg ? 3 : 1}>
                {renderImageField(
                  detail?.user?.avatarUrl,
                  detail?.user?.fullName ?? detail?.user?.email
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {detail?.user?.status ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Đăng nhập gần nhất">
                {formatDateTime(detail?.user?.lastLoginAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Múi giờ">
                {detail?.user?.timezone ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Tạo lúc">
                {formatDateTime(detail?.user?.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lúc">
                {formatDateTime(detail?.user?.updatedAt)}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* --- Hợp đồng & Thanh toán --- */}
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
              <>
                <Table
                  columns={contractColumns}
                  dataSource={detail.contracts}
                  rowKey={(record) =>
                    record?.contractNumber ?? record?.id ?? Math.random()
                  }
                  pagination={false}
                  scroll={{ x: 720 }}
                />
                <Divider />
                {detail.contracts.map((contract) => {
                  const paymentStatus = normalizeStatus(
                    contract?.paymentDTO?.status
                  );

                  // 🔹 URL file hợp đồng (hiện giờ bạn đang lưu trong `terms`)
                  const contractFileUrl = contract?.terms;
                  const contractFileName = contractFileUrl
                    ? getFileNameFromUrl(contractFileUrl)
                    : "";

                  return (
                    <Card
                      key={
                        contract?.contractNumber ??
                        contract?.id ??
                        Math.random()
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
                              {contractFileName}
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

                      <Title
                        level={5}
                        className="!mb-2 flex items-center gap-2"
                      >
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
                        <Descriptions.Item
                          label="Lý do thất bại"
                          span={screens.lg ? 3 : 1}
                        >
                          {contract?.paymentDTO?.failureReason ?? "--"}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tạo lúc">
                          {formatDateTime(contract?.paymentDTO?.createdAt)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Cập nhật lúc">
                          {formatDateTime(contract?.paymentDTO?.updatedAt)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Hết hạn lúc">
                          {formatDateTime(contract?.paymentDTO?.expiresAt)}
                        </Descriptions.Item>
                        <Descriptions.Item
                          label="Mã giao dịch"
                          span={screens.lg ? 3 : 1}
                        >
                          <Text style={{ whiteSpace: "pre-wrap" }}>
                            {formatArrayOrValue(
                              contract?.paymentDTO?.transactionIds
                            )}
                          </Text>
                        </Descriptions.Item>
                        <Descriptions.Item
                          label="Mã hoàn tiền"
                          span={screens.lg ? 3 : 1}
                        >
                          <Text style={{ whiteSpace: "pre-wrap" }}>
                            {formatArrayOrValue(
                              contract?.paymentDTO?.refundIds
                            )}
                          </Text>
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  );
                })}
              </>
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
                const errorMessage =
                  metricsError?.response?.data?.message ??
                  metricsError?.message;

                const isNotFoundMetricsError =
                  !!metricsError &&
                  (metricsError?.response?.status === 404 ||
                    metricsError?.response?.data?.code === "NOT_FOUND" ||
                    /Không tìm thấy Livestream Metric/i.test(
                      metricsError?.response?.data?.message ??
                        metricsError?.message ??
                        ""
                    ));

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
                    ) : metricsError && !isNotFoundMetricsError ? (
                      <Alert
                        type="error"
                        showIcon
                        message="Không thể tải thống kê livestream."
                        description={
                          errorMessage ? String(errorMessage) : undefined
                        }
                      />
                    ) : metrics ? (
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
                    ) : (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={null}
                      />
                    )}
                  </Card>
                );
              })
            ) : (
              <Empty description="Không có phiên làm việc" />
            )}
          </Card>

          {/* ---------------------- TỆP ĐÍNH KÈM ---------------------- */}
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
                rowKey={(record) => record?.id}
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
