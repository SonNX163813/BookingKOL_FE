import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Empty,
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
import { useGetMySingleBookingRequestDetail } from "../../../hook/user/booking/useGetMySingleBookingRequestDetail";

const { Text } = Typography;

const BOOKING_STATUS_LABEL = {
  DRAFT: "Bản nháp",
  REQUESTED: "Đang yêu cầu",
  PENDING: "Chờ xử lý",
  NEGOTIATING: "Đang đàm phán",
  ACCEPTED: "Đã chấp nhận",
  CONFIRMED: "Đã xác nhận",
  IN_PROGRESS: "Đang thực hiện",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  DISPUTED: "Đang tranh chấp",
  REJECTED: "Đã từ chối",
  CANCELLED: "Đã hủy",
  CONTRACT_SIGNED: "Đã ký hợp đồng",
  EXPIRED: "Hết hạn",
};

const STATUS_TAG_COLOR = {
  DRAFT: "default",
  REQUESTED: "processing",
  PENDING: "processing",
  NEGOTIATING: "cyan",
  ACCEPTED: "success",
  CONFIRMED: "blue",
  IN_PROGRESS: "processing",
  DELIVERED: "gold",
  COMPLETED: "success",
  DISPUTED: "magenta",
  REJECTED: "error",
  CANCELLED: "warning",
  CONTRACT_SIGNED: "purple",
  EXPIRED: "volcano",
};

const PAYMENT_STATUS_LABEL = {
  PAID: "Đã thanh toán",
  PENDING: "Chờ thanh toán",
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
  return parsed.isValid() ? parsed.format(pattern) : "--";
};

const formatCurrency = (value, currency = "VND") => {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  const numeric =
    typeof value === "number" ? value : Number.parseFloat(String(value));

  if (!Number.isFinite(numeric)) {
    return "--";
  }

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numeric);
};

const composeExecutionTime = (record) => {
  const start = record?.startAt ?? record?.startTime;
  const end = record?.endAt ?? record?.endTime;

  if (!start && !end) {
    return "--";
  }

  const startLabel = formatDateTime(start);
  const endLabel = formatDateTime(end);

  const sameDay =
    dayjs(start).isValid() &&
    dayjs(end).isValid() &&
    dayjs(start).isSame(dayjs(end), "day");

  if (!start) {
    return endLabel;
  }
  if (!end) {
    return startLabel;
  }

  return sameDay
    ? `${dayjs(start).format("DD/MM/YYYY HH:mm")} → ${dayjs(end).format(
        "HH:mm"
      )}`
    : `${startLabel} → ${endLabel}`;
};

const formatArray = (value) => {
  if (!Array.isArray(value)) {
    return value ?? "--";
  }

  return value.length > 0 ? value.join(", ") : "--";
};

const normalizeStatus = (status) =>
  status && typeof status === "string" ? status.toUpperCase() : status;

const MySingleBookingRequestDetail = () => {
  const navigate = useNavigate();
  const { requestId } = useParams();

  const {
    isLoadingMyBookingRequestDetail,
    isFetchingMyBookingRequestDetail,
    myBookingRequestDetailResponse,
    myBookingRequestDetailError,
  } = useGetMySingleBookingRequestDetail(requestId);

  const detail = myBookingRequestDetailResponse?.data ?? null;
  const contracts = Array.isArray(detail?.contracts)
    ? detail.contracts.filter(Boolean)
    : [];
  const attachedFiles = Array.isArray(detail?.attachedFiles)
    ? detail.attachedFiles.filter(Boolean)
    : [];

  const status = normalizeStatus(detail?.status);
  const statusLabel = status
    ? BOOKING_STATUS_LABEL[status] ?? status
    : "--";

  const isLoading =
    isLoadingMyBookingRequestDetail || isFetchingMyBookingRequestDetail;

  const attachedFileColumns = useMemo(
    () => [
      {
        title: "Tên tệp",
        dataIndex: ["file", "fileName"],
        key: "fileName",
        render: (_, record) => record?.file?.fileName ?? "--",
      },
      {
        title: "Loại",
        dataIndex: ["file", "fileType"],
        key: "fileType",
        render: (_, record) => record?.file?.fileType ?? "--",
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (value) => value ?? "--",
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (value) => formatDateTime(value),
      },
      {
        title: "Liên kết",
        key: "link",
        render: (_, record) => {
          const url = record?.file?.fileUrl;
          return url ? (
            <Typography.Link
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Mở
            </Typography.Link>
          ) : (
            "--"
          );
        },
      },
    ],
    []
  );

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8">
      <div className="w-full max-w-[1200px] flex flex-col gap-4">
        <Button
          type="link"
          icon={<ArrowLeft size={16} />}
          onClick={() => navigate(-1)}
          className="self-start px-0"
        >
          Quay lại
        </Button>

        <div className="flex flex-col items-center text-center gap-2">
          <div className="inline-flex items-center gap-2 border-2 border-gray-300 p-2 rounded-md">
            <CalendarRange className="text-gray-500" size={18} />
            <Text strong className="uppercase text-[15px]">
              Chi tiết đơn booking KOL
            </Text>
          </div>
          <Text type="secondary">
            Xem đầy đủ thông tin của đơn booking KOL đã tạo.
          </Text>
        </div>

        {myBookingRequestDetailError ? (
          <Alert
            type="error"
            showIcon
            message="Không thể tải chi tiết đơn booking"
            description={
              myBookingRequestDetailError?.message ?? "Vui lòng thử lại sau."
            }
          />
        ) : null}

        <Skeleton active loading={isLoading}>
          {detail ? (
            <Space direction="vertical" size="large" className="w-full">
              <Card
                bordered={false}
                className="shadow-sm"
                title={
                  <Space>
                    <FileText size={18} />
                    <span>Thông tin booking</span>
                  </Space>
                }
              >
                <Descriptions
                  bordered
                  size="middle"
                  column={1}
                  labelStyle={{ width: 180 }}
                >
                  <Descriptions.Item label="Mã đơn">
                    {detail?.id ?? "--"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    {status ? (
                      <Tag color={STATUS_TAG_COLOR[status] ?? "default"}>
                        {statusLabel}
                      </Tag>
                    ) : (
                      "--"
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời gian thực hiện">
                    {composeExecutionTime(detail)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Địa điểm">
                    {detail?.location?.trim?.() || "--"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày tạo">
                    {formatDateTime(detail?.createdAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ghi chú">
                    <Text style={{ whiteSpace: "pre-wrap" }}>
                      {detail?.description?.trim?.() || "--"}
                    </Text>
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              <Card
                bordered={false}
                className="shadow-sm"
                title={
                  <Space>
                    <UserCircle2 size={18} />
                    <span>Thông tin người đặt</span>
                  </Space>
                }
              >
                {detail?.user ? (
                  <Descriptions
                    bordered
                    size="middle"
                    column={1}
                    labelStyle={{ width: 180 }}
                  >
                    <Descriptions.Item label="Tên">
                      {detail.user.fullName ?? "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      {detail.user.email ?? "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">
                      {detail.user.phone ?? "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ">
                      {detail.user.address ?? "--"}
                    </Descriptions.Item>
                  </Descriptions>
                ) : (
                  <Empty description="Không có thông tin người đặt" />
                )}
              </Card>

              <Card
                bordered={false}
                className="shadow-sm"
                title={
                  <Space>
                    <UserCircle2 size={18} />
                    <span>Thông tin KOL</span>
                  </Space>
                }
              >
                {detail?.kol ? (
                  <Space direction="vertical" size="large" className="w-full">
                    <Descriptions
                      bordered
                      size="middle"
                      column={1}
                      labelStyle={{ width: 180 }}
                    >
                      <Descriptions.Item label="Tên KOL">
                        {detail.kol.displayName ?? detail.kol.fullName ?? "--"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Quốc gia">
                        {detail.kol.country ?? "--"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Thành phố">
                        {detail.kol.city ?? "--"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Danh mục">
                        {formatArray(
                          detail.kol.categories?.map((c) => c?.name).filter(Boolean)
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="Kinh nghiệm">
                        {detail.kol.experience ?? "--"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Mô tả">
                        <Text style={{ whiteSpace: "pre-wrap" }}>
                          {detail.kol.bio ?? "--"}
                        </Text>
                      </Descriptions.Item>
                    </Descriptions>
                  </Space>
                ) : (
                  <Empty description="Không có thông tin KOL" />
                )}
              </Card>

              <Card
                bordered={false}
                className="shadow-sm"
                title={
                  <Space>
                    <Layers size={18} />
                    <span>Hợp đồng & thanh toán</span>
                  </Space>
                }
              >
                {contracts.length > 0 ? (
                  <Space direction="vertical" size="large" className="w-full">
                    {contracts.map((contract) => {
                      const normalizedContractStatus = normalizeStatus(
                        contract?.status
                      );
                      const paymentStatus = normalizeStatus(
                        contract?.paymentDTO?.status
                      );

                      return (
                        <Card
                          key={contract?.id ?? Math.random()}
                          type="inner"
                          title={`Hợp đồng ${contract?.id ?? ""}`.trim()}
                        >
                          <Descriptions
                            bordered
                            size="middle"
                            column={1}
                            labelStyle={{ width: 180 }}
                          >
                            <Descriptions.Item label="Trạng thái hợp đồng">
                              {normalizedContractStatus ? (
                                <Tag
                                  color={
                                    STATUS_TAG_COLOR[normalizedContractStatus] ??
                                    "default"
                                  }
                                >
                                  {BOOKING_STATUS_LABEL[normalizedContractStatus] ??
                                    normalizedContractStatus}
                                </Tag>
                              ) : (
                                "--"
                              )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày tạo">
                              {formatDateTime(contract?.createdAt)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày cập nhật">
                              {formatDateTime(contract?.updatedAt)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Thanh toán">
                              {paymentStatus ? (
                                <Tag
                                  color={
                                    PAYMENT_STATUS_COLOR[paymentStatus] ??
                                    "default"
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
                              {formatCurrency(
                                contract?.paymentDTO?.totalAmount,
                                contract?.paymentDTO?.currency ?? "VND"
                              )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Đã thanh toán">
                              {formatCurrency(
                                contract?.paymentDTO?.paidAmount,
                                contract?.paymentDTO?.currency ?? "VND"
                              )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Hết hạn thanh toán">
                              {formatDateTime(contract?.paymentDTO?.expiresAt)}
                            </Descriptions.Item>
                          </Descriptions>
                        </Card>
                      );
                    })}
                  </Space>
                ) : (
                  <Empty description="Không có thông tin hợp đồng" />
                )}
              </Card>

              <Card
                bordered={false}
                className="shadow-sm"
                title={
                  <Space>
                    <FileText size={18} />
                    <span>Tệp đính kèm</span>
                  </Space>
                }
              >
                {attachedFiles.length > 0 ? (
                  <Table
                    columns={attachedFileColumns}
                    dataSource={attachedFiles}
                    rowKey={(record) => record?.id ?? Math.random().toString(36)}
                    pagination={false}
                    scroll={{ x: 720 }}
                  />
                ) : (
                  <Empty description="Không có tệp đính kèm" />
                )}
              </Card>
            </Space>
          ) : myBookingRequestDetailError ? null : (
            <Empty description="Không tìm thấy dữ liệu" />
          )}
        </Skeleton>
      </div>
    </div>
  );
};

export default MySingleBookingRequestDetail;
