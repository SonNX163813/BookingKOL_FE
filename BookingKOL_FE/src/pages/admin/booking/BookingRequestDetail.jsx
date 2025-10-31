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

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const BOOKING_STATUS_LABEL = {
  DRAFT: "Bản nháp",
  REQUESTED: "Đã yêu cầu",
  NEGOTIATING: "Đang thương lượng",
  ACCEPTED: "Đã chấp nhận",
  REJECTED: "Từ chối",
  CANCELLED: "Đã hủy",
  CONTRACT_SIGNED: "Hợp đồng đã ký",
  IN_PROGRESS: "Đang thực hiện",
  DELIVERED: "Đã bàn giao",
  COMPLETED: "Hoàn thành",
  DISPUTED: "Tranh chấp",
  EXPIRED: "Hết hạn",
};

const STATUS_TAG_COLOR = {
  DRAFT: "default",
  REQUESTED: "processing",
  NEGOTIATING: "cyan",
  ACCEPTED: "success",
  REJECTED: "error",
  CANCELLED: "warning",
  CONTRACT_SIGNED: "blue",
  IN_PROGRESS: "processing",
  DELIVERED: "gold",
  COMPLETED: "success",
  DISPUTED: "magenta",
  EXPIRED: "volcano",
};

const PAYMENT_STATUS_LABEL = {
  PAID: "Đã thanh toán",
  PENDING: "Đang chờ",
  PROCESSING: "Đang xử lý",
  COMPLETED: "Hoàn tất",
  FAILED: "Thất bại",
  EXPIRED: "Hết hạn",
  CANCELLED: "Đã hủy",
  REFUNDED: "Đã hoàn tiền",
};

const PAYMENT_STATUS_COLOR = {
  PAID: "success",
  PENDING: "processing",
  PROCESSING: "processing",
  COMPLETED: "success",
  FAILED: "error",
  EXPIRED: "volcano",
  CANCELLED: "warning",
  REFUNDED: "purple",
};

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
      {/* <Text copyable style={{ wordBreak: "break-all" }}>
        {fileUrl}
      </Text> */}
    </Space>
  );
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
  const responseMessage = bookingRequestDetailResponse?.message ?? null;
  const responseTimestamp = bookingRequestDetailResponse?.timestamp ?? null;

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
      { title: "Loại đối tượng", dataIndex: "targetType", key: "targetType" },
      {
        title: "ID đối tượng",
        dataIndex: "targetId",
        key: "targetId",
        width: 220,
      },
      // {
      //   title: "Ảnh bìa",
      //   dataIndex: "isCover",
      //   key: "isCover",
      //   render: formatBoolean,
      // },
      // {
      //   title: "Hoạt động",
      //   dataIndex: "isActive",
      //   key: "isActive",
      //   render: formatBoolean,
      // },
      {
        title: "Tạo lúc",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (v) => formatDateTime(v),
      },
      // {
      //   title: "Tên tệp",
      //   key: "fileName",
      //   render: (_, r) => r?.file?.fileName ?? "--",
      // },
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
      // {
      //   title: "Kích thước (bytes)",
      //   key: "sizeBytes",
      //   render: (_, r) =>
      //     r?.file?.sizeBytes !== undefined && r?.file?.sizeBytes !== null
      //       ? r.file.sizeBytes
      //       : "--",
      // },
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
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (v) => normalizeStatus(v) ?? "--",
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
        render: (_, r) => normalizeStatus(r?.paymentDTO?.status) ?? "--",
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
                {detail?.bookingType && (
                  <Tag color="blue">{normalizeStatus(detail.bookingType)}</Tag>
                )}
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
              <Descriptions.Item label="Mã chiến dịch">
                {detail?.campaignId ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Mã khuyến mãi KOL">
                {detail?.kolPromoId ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Loại đặt chỗ">
                {normalizeStatus(detail?.bookingType) ?? "--"}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {statusLabel}
              </Descriptions.Item>
              <Descriptions.Item label="Đã xác nhận điều khoản">
                {formatBoolean(detail?.isConfirmWithTerms)}
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
              {/* <Descriptions.Item label="Mã người dùng">
                {detail?.kol?.userId ?? "--"}
              </Descriptions.Item> */}
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

            {/* <Divider />

            <Title level={5} className="!mb-2 flex items-center gap-2">
              <Layers size={16} /> Danh mục
            </Title>
            <Space size={[8, 8]} wrap>
              {detail?.kol?.categories && detail.kol.categories.length > 0 ? (
                detail.kol.categories.map((category) => (
                  <Tag color="blue" key={category?.id ?? category?.key}>
                    {category?.name ?? category?.key ?? "--"}
                  </Tag>
                ))
              ) : (
                <Text type="secondary">Không có danh mục</Text>
              )}
            </Space> */}

            {/* <Divider /> */}

            {/* <Title level={5} className="!mb-2 flex items-center gap-2">
              <FileText size={16} /> Sử dụng tệp
            </Title>
            {detail?.kol?.fileUsageDtos && detail.kol.fileUsageDtos.length ? (
              <Table
                columns={fileUsageColumns}
                dataSource={detail.kol.fileUsageDtos}
                rowKey={(record) =>
                  record?.id ?? record?.file?.id ?? Math.random()
                }
                pagination={false}
                scroll={{ x: 960 }}
              />
            ) : (
              <Empty description="Không có dữ liệu tệp" />
            )} */}
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
                {detail?.user?.gender ?? "--"}
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
                        <Descriptions.Item label="Trạng thái">
                          {normalizeStatus(contract?.status) ?? "--"}
                        </Descriptions.Item>
                        <Descriptions.Item
                          label="Điều khoản"
                          span={screens.lg ? 3 : 1}
                        >
                          <Text style={{ whiteSpace: "pre-wrap" }}>
                            {contract?.terms ?? "--"}
                          </Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ký bởi thương hiệu">
                          {formatDateTime(contract?.signedAtBrand)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ký bởi KOL">
                          {formatDateTime(contract?.signedAtKol)}
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
                        {/* <Descriptions.Item label="Mã thanh toán">
                          {contract?.paymentDTO?.id ?? "--"}
                        </Descriptions.Item> */}
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
                rowKey={(record) => record?.id ?? Math.random()}
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
