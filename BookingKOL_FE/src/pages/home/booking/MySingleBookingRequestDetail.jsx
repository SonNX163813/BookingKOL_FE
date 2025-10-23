import { useMemo, useCallback } from "react";
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
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

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

const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") =>
  value ? (dayjs(value).isValid() ? dayjs(value).format(pattern) : "--") : "--";

const formatCurrency = (value, currency = "VND") =>
  value
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(value)
    : "--";

const composeExecutionTime = (record) => {
  const start = record?.startAt ?? record?.startTime;
  const end = record?.endAt ?? record?.endTime;
  if (!start && !end) return "--";
  const startLabel = formatDateTime(start);
  const endLabel = formatDateTime(end);
  const sameDay =
    dayjs(start).isValid() &&
    dayjs(end).isValid() &&
    dayjs(start).isSame(dayjs(end), "day");

  return sameDay
    ? `${dayjs(start).format("DD/MM/YYYY HH:mm")} → ${dayjs(end).format(
        "HH:mm"
      )}`
    : `${startLabel} → ${endLabel}`;
};

const formatArray = (v) => (Array.isArray(v) && v.length ? v.join(", ") : "--");

const normalizeStatus = (s) =>
  s && typeof s === "string" ? s.toUpperCase() : s;

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
  const statusLabel = status ? BOOKING_STATUS_LABEL[status] ?? status : "--";

  const handleBack = useCallback(() => {
    navigate("/don-booking-kol");
  }, [navigate]);

  const attachedFileColumns = useMemo(
    () => [
      {
        title: "Tên tệp",
        dataIndex: ["file", "fileName"],
        key: "fileName",
        render: (_, r) => r?.file?.fileName ?? "--",
      },
      {
        title: "Loại",
        dataIndex: ["file", "fileType"],
        key: "fileType",
        render: (_, r) => r?.file?.fileType ?? "--",
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (v) => formatDateTime(v),
      },
      {
        title: "Liên kết",
        key: "link",
        render: (_, r) =>
          r?.file?.fileUrl ? (
            <Typography.Link
              href={r.file.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Mở
            </Typography.Link>
          ) : (
            "--"
          ),
      },
    ],
    []
  );

  const isLoading =
    isLoadingMyBookingRequestDetail || isFetchingMyBookingRequestDetail;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-pink-50 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 rounded-full bg-purple-300/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 md:px-6 lg:px-8 flex flex-col gap-10">
        {/* Header */}
        <div>
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={handleBack}
            className="!flex !items-center !gap-2 !h-11 !rounded-xl !border !border-slate-200 !bg-white !text-indigo-600 !font-semibold !shadow-sm hover:!border-indigo-500/60 hover:!text-indigo-700 hover:!bg-indigo-50 transition-all duration-300"
          >
            Trở về đơn đặt KOL
          </Button>
        </div>
        <section className="rounded-3xl border border-white/40 bg-white/90 shadow-[0_40px_80px_-50px_rgba(79,70,229,0.6)] backdrop-blur p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                <CalendarRange size={16} />
                <span>Chi tiết booking KOL</span>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Xem chi tiết thông tin đơn, hợp đồng và thanh toán.
              </p>
            </div>
          </div>
        </section>

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
            <>
              {/* Booking Info */}
              <section className="rounded-3xl border border-white/40 bg-white/95 shadow-[0_45px_90px_-55px_rgba(15,23,42,0.45)] backdrop-blur p-6">
                <Space direction="vertical" size="large" className="w-full">
                  <Descriptions bordered size="middle" column={1}>
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
                </Space>
              </section>

              {/* User Info */}
              <section className="rounded-3xl border border-white/40 bg-white/95 shadow-[0_45px_90px_-55px_rgba(15,23,42,0.45)] backdrop-blur p-6">
                <Space>
                  <UserCircle2 size={18} />
                  <span className="text-lg font-semibold text-slate-900">
                    Thông tin người đặt
                  </span>
                </Space>
                {detail?.user ? (
                  <Descriptions
                    bordered
                    size="middle"
                    column={1}
                    className="mt-4"
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
              </section>

              {/* KOL Info */}
              <section className="rounded-3xl border border-white/40 bg-white/95 shadow-[0_45px_90px_-55px_rgba(15,23,42,0.45)] backdrop-blur p-6">
                <Space>
                  <UserCircle2 size={18} />
                  <span className="text-lg font-semibold text-slate-900">
                    Thông tin KOL
                  </span>
                </Space>
                {detail?.kol ? (
                  <Descriptions
                    bordered
                    size="middle"
                    column={1}
                    className="mt-4"
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
                        detail.kol.categories
                          ?.map((c) => c?.name)
                          .filter(Boolean)
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
                ) : (
                  <Empty description="Không có thông tin KOL" />
                )}
              </section>

              {/* Contract & Payment */}
              <section className="rounded-3xl border border-white/40 bg-white/95 shadow-[0_45px_90px_-55px_rgba(15,23,42,0.45)] backdrop-blur p-6">
                <Space>
                  <Layers size={18} />
                  <span className="text-lg font-semibold text-slate-900">
                    Hợp đồng & thanh toán
                  </span>
                </Space>
                {contracts.length > 0 ? (
                  <Space
                    direction="vertical"
                    size="large"
                    className="w-full mt-4"
                  >
                    {contracts.map((c) => {
                      const paymentStatus = normalizeStatus(
                        c?.paymentDTO?.status
                      );
                      return (
                        <Card
                          key={c?.id}
                          type="inner"
                          title={`Hợp đồng ${c?.id ?? ""}`}
                          className="shadow-sm"
                        >
                          <Descriptions bordered size="middle" column={1}>
                            <Descriptions.Item label="Trạng thái hợp đồng">
                              <Tag
                                color={
                                  STATUS_TAG_COLOR[c?.status?.toUpperCase()] ??
                                  "default"
                                }
                              >
                                {BOOKING_STATUS_LABEL[
                                  c?.status?.toUpperCase()
                                ] ?? c?.status}
                              </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Thanh toán">
                              {paymentStatus ? (
                                <Tag
                                  color={PAYMENT_STATUS_COLOR[paymentStatus]}
                                >
                                  {PAYMENT_STATUS_LABEL[paymentStatus]}
                                </Tag>
                              ) : (
                                "--"
                              )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Tổng tiền">
                              {formatCurrency(
                                c?.paymentDTO?.totalAmount,
                                c?.paymentDTO?.currency ?? "VND"
                              )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Đã thanh toán">
                              {formatCurrency(
                                c?.paymentDTO?.paidAmount,
                                c?.paymentDTO?.currency ?? "VND"
                              )}
                            </Descriptions.Item>
                            <Descriptions.Item label="Hết hạn thanh toán">
                              {formatDateTime(c?.paymentDTO?.expiresAt)}
                            </Descriptions.Item>
                          </Descriptions>
                        </Card>
                      );
                    })}
                  </Space>
                ) : (
                  <Empty description="Không có thông tin hợp đồng" />
                )}
              </section>

              {/* Attached Files */}
              <section className="rounded-3xl border border-white/40 bg-white/95 shadow-[0_45px_90px_-55px_rgba(15,23,42,0.45)] backdrop-blur p-6">
                <Space>
                  <FileText size={18} />
                  <span className="text-lg font-semibold text-slate-900">
                    Tệp đính kèm
                  </span>
                </Space>
                {attachedFiles.length > 0 ? (
                  <Table
                    columns={attachedFileColumns}
                    dataSource={attachedFiles}
                    pagination={false}
                    rowKey={(r) => r?.id ?? Math.random()}
                    className="mt-4"
                  />
                ) : (
                  <Empty description="Không có tệp đính kèm" />
                )}
              </section>
            </>
          ) : (
            <Empty description="Không tìm thấy dữ liệu" />
          )}
        </Skeleton>
      </div>
    </div>
  );
};

export default MySingleBookingRequestDetail;
