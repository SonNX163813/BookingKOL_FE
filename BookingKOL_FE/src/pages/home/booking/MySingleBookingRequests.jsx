import { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import {
  Button,
  DatePicker,
  Form,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import {
  BadgeCheck,
  CalendarRange,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  RefreshCcw,
  RotateCcw,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useGetMySingleBookingRequests } from "../../../hook/user/booking/useGetMySingleBookingRequests";
import { useCancelMySingleBookingRequest } from "../../../hook/user/booking/useCancelMySingleBookingRequest";

const { RangePicker } = DatePicker;

/* ------------------- CONSTANTS ------------------- */

const BOOKING_STATUS_OPTIONS = [
  { label: "Bản nháp", value: "DRAFT" },
  { label: "Đang yêu cầu", value: "REQUESTED" },
  { label: "Chờ xử lý", value: "PENDING" },
  { label: "Đang đàm phán", value: "NEGOTIATING" },
  { label: "Đã chấp nhận", value: "ACCEPTED" },
  { label: "Đã xác nhận", value: "CONFIRMED" },
  { label: "Đang thực hiện", value: "IN_PROGRESS" },
  { label: "Đã giao", value: "DELIVERED" },
  { label: "Hoàn thành", value: "COMPLETED" },
  { label: "Đang tranh chấp", value: "DISPUTED" },
  { label: "Đã từ chối", value: "REJECTED" },
  { label: "Đã huỷ", value: "CANCELLED" },
  { label: "Đã ký hợp đồng", value: "CONTRACT_SIGNED" },
  { label: "Hết hạn", value: "EXPIRED" },
];

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

const PAYMENT_STATUS_OPTIONS = [
  { label: "Đã thanh toán", value: "PAID" },
  { label: "Chờ thanh toán", value: "PENDING" },
  { label: "Đang xử lý", value: "PROCESSING" },
  { label: "Hoàn tất", value: "COMPLETED" },
  { label: "Thất bại", value: "FAILED" },
  { label: "Hết hạn", value: "EXPIRED" },
  { label: "Đã huỷ", value: "CANCELLED" },
  { label: "Đã hoàn tiền", value: "REFUNDED" },
];

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

const CANCELABLE_BOOKING_STATUSES = new Set([
  // "DRAFT",
  // "REQUESTED",
  // "PENDING",
  // "NEGOTIATING",
  // "ACCEPTED",
  // "CONFIRMED",
  // "CONTRACT_SIGNED",
  "IN_PROGRESS",
]);

/* ------------------- HELPERS ------------------- */

const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") =>
  value ? (dayjs(value).isValid() ? dayjs(value).format(pattern) : "--") : "--";

const composeExecutionTime = (record) => {
  const start = record?.startAt ?? record?.startTime;
  const end = record?.endAt ?? record?.endTime;
  if (!start && !end) return "--";

  const startLabel = formatDateTime(start);
  const endLabel = formatDateTime(end);
  const sameDay =
    dayjs(start).isValid() &&
    dayjs(end).isValid() &&
    dayjs(start).isSame(end, "day");

  return sameDay
    ? `${dayjs(start).format("DD/MM/YYYY HH:mm")} → ${dayjs(end).format(
        "HH:mm"
      )}`
    : `${startLabel} → ${endLabel}`;
};

const formatCurrency = (value) =>
  value
    ? new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
      }).format(value)
    : "--";

const deriveRowKey = (record) =>
  record?.id ??
  record?.code ??
  `booking-${Math.random().toString(36).slice(2, 10)}`;

const getPrimaryContract = (r) => r?.contracts?.find(Boolean) ?? null;
const getPrimaryPayment = (r) => getPrimaryContract(r)?.paymentDTO ?? null;

const canCancelBookingRequest = (status) =>
  status ? CANCELABLE_BOOKING_STATUSES.has(status.toUpperCase()) : false;

/* ------------------- COMPONENT ------------------- */

const MySingleBookingRequests = () => {
  const [form] = Form.useForm();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [filters, setFilters] = useState({});
  const navigate = useNavigate();
  const [cancellingRequestId, setCancellingRequestId] = useState(null);

  const {
    isCancellingMySingleBookingRequest,
    handleCancelMySingleBookingRequest,
  } = useCancelMySingleBookingRequest({
    successToastMessage: "Huỷ đơn booking thành công",
    errorToastMessage: "Huỷ đơn booking thất bại",
  });

  const {
    isLoadingMyBookingRequests,
    isFetchingMyBookingRequests,
    myBookingRequestsResponse,
    refetchMyBookingRequests,
  } = useGetMySingleBookingRequests({
    page,
    size,
    ...filters,
  });

  const rawData = myBookingRequestsResponse?.data;
  const dataSource = Array.isArray(rawData)
    ? rawData
    : rawData?.content ?? rawData?.items ?? [];

  const explicitTotal =
    typeof rawData?.totalElements === "number"
      ? rawData.totalElements
      : typeof rawData?.total === "number"
      ? rawData.total
      : undefined;

  const inferredTotal =
    page * size +
    dataSource.length +
    (explicitTotal === undefined && dataSource.length === size ? 1 : 0);

  const totalElements =
    explicitTotal ??
    Math.max(
      Array.isArray(rawData) ? rawData.length : dataSource.length,
      inferredTotal
    );

  const pageRange = useMemo(() => {
    if (!totalElements) return null;
    const start = page * size + 1;
    const end = Math.min((page + 1) * size, totalElements);
    return { start, end };
  }, [page, size, totalElements]);

  useEffect(() => {
    if (page > 0 && dataSource.length === 0) {
      setPage((prev) => Math.max(0, prev - 1));
    }
  }, [dataSource.length, page]);

  const summaryCards = useMemo(() => {
    const counts = dataSource.reduce((acc, item) => {
      const key = item?.status?.toUpperCase();
      if (!key) return acc;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const total = Number.isFinite(totalElements) ? totalElements : 0;
    const workingCount =
      (counts.ACCEPTED ?? 0) +
      (counts.CONTRACT_SIGNED ?? 0) +
      (counts.CONFIRMED ?? 0) +
      (counts.IN_PROGRESS ?? 0);
    const pendingCount =
      (counts.REQUESTED ?? 0) +
      (counts.PENDING ?? 0) +
      (counts.NEGOTIATING ?? 0);
    const completedCount = (counts.COMPLETED ?? 0) + (counts.DELIVERED ?? 0);
    const cancelledCount =
      (counts.CANCELLED ?? 0) + (counts.REJECTED ?? 0) + (counts.EXPIRED ?? 0);

    return [
      {
        key: "total",
        label: "Tổng đơn",
        value: total.toLocaleString("vi-VN"),
        caption: `Đã huỷ/hết hạn: ${cancelledCount.toLocaleString(
          "vi-VN"
        )} đơn`,
        gradient: "from-indigo-500/70 via-sky-500/60 to-cyan-500/50",
        icon: ClipboardList,
      },
      {
        key: "completed",
        label: "Hoàn tất",
        value: completedCount.toLocaleString("vi-VN"),
        caption: "Đơn đã giao và hoàn thành",
        gradient: "from-emerald-500/70 via-teal-500/60 to-sky-500/50",
        icon: CheckCircle2,
      },
      {
        key: "working",
        label: "Đang làm việc",
        value: workingCount.toLocaleString("vi-VN"),
        caption: "Đã chấp nhận hoặc đang thực hiện",
        gradient: "from-violet-500/70 via-indigo-500/60 to-blue-500/50",
        icon: BadgeCheck,
      },
      {
        key: "pending",
        label: "Chờ xử lý",
        value: pendingCount.toLocaleString("vi-VN"),
        caption: "Đang chờ duyệt hoặc đàm phán",
        gradient: "from-amber-500/70 via-orange-500/60 to-rose-500/40",
        icon: Clock3,
      },
    ];
  }, [dataSource, totalElements]);

  const handleFilter = (values) => {
    const { status, executionRange, createdRange } = values ?? {};
    setFilters({
      status,
      startAt: executionRange?.[0]?.toISOString(),
      endAt: executionRange?.[1]?.toISOString(),
      createdAtFrom: createdRange?.[0]?.startOf("day").format("YYYY-MM-DD"),
      createdAtTo: createdRange?.[1]?.endOf("day").format("YYYY-MM-DD"),
    });
    setPage(0);
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({});
    setPage(0);
  };

  const handleViewDetail = useCallback(
    (record) => {
      const requestId = record?.id;
      if (!requestId) return;
      navigate(`/don-booking-kol/${requestId}`);
    },
    [navigate]
  );

  const handleCancelRequest = useCallback(
    async (requestId) => {
      if (!requestId) return;
      try {
        setCancellingRequestId(requestId);
        await handleCancelMySingleBookingRequest({ requestId });
        await refetchMyBookingRequests();
      } catch (error) {
        // toast is handled globally
      } finally {
        setCancellingRequestId(null);
      }
    },
    [handleCancelMySingleBookingRequest, refetchMyBookingRequests]
  );

  const columns = useMemo(
    () => [
      {
        title: "Mã đơn",
        key: "requestNumber",
        width: 150,
        render: (_, record) => record?.requestNumber ?? "--",
        // render: (_, record) => record?.contracts?.[0]?.contractNumber ?? "--",
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 150,
        render: (v) => {
          const normalized = v?.toUpperCase();
          const label =
            BOOKING_STATUS_OPTIONS.find((s) => s.value === normalized)?.label ??
            normalized;
          return (
            <Tag color={STATUS_TAG_COLOR[normalized] ?? "default"}>{label}</Tag>
          );
        },
      },
      {
        title: "Thời gian thực hiện",
        key: "executionTime",
        width: 120,
        render: (_, r) => composeExecutionTime(r),
      },
      {
        title: "Địa điểm",
        dataIndex: "location",
        key: "location",
        width: 200,
        render: (v) => v || "--",
      },
      {
        title: "Thanh toán",
        key: "paymentStatus",
        width: 160,
        render: (_, r) => {
          const payment = getPrimaryPayment(r);
          const normalized = payment?.status?.toUpperCase();
          const label =
            PAYMENT_STATUS_OPTIONS.find((s) => s.value === normalized)?.label ??
            normalized ??
            "--";
          return (
            <Tag color={PAYMENT_STATUS_COLOR[normalized] ?? "default"}>
              {label}
            </Tag>
          );
        },
      },
      {
        title: "Tổng tiền",
        key: "totalAmount",
        width: 150,
        render: (_, r) => {
          const payment = getPrimaryPayment(r);
          const amount =
            payment?.totalAmount ??
            payment?.paidAmount ??
            r?.totalAmount ??
            r?.budget ??
            null;
          return formatCurrency(amount);
        },
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        key: "createdAt",
        width: 120,
        render: (v) => formatDateTime(v),
      },
      {
        title: "Ghi chú",
        dataIndex: "description",
        key: "description",
        ellipsis: true,
        render: (v) => v?.trim() || "--",
      },
      {
        title: "Thao tác",
        key: "actions",
        fixed: "right",
        width: 190,
        render: (_, record) => {
          const requestId = record?.id;
          const isCancelable = canCancelBookingRequest(record?.status);
          const isProcessingThisRow =
            isCancellingMySingleBookingRequest &&
            cancellingRequestId === requestId;
          const disableCancel =
            !requestId ||
            (isCancellingMySingleBookingRequest && !isProcessingThisRow);
          const cancelButton = (
            <Button
              type="link"
              danger
              disabled={disableCancel}
              loading={isProcessingThisRow}
              className="!h-10 !rounded-xl !px-3 !text-red-600 hover:!bg-red-50 focus:!bg-red-100"
            >
              <XCircle size={18} />
            </Button>
          );

          return (
            <Space size="small">
              <Button
                type="link"
                onClick={() => handleViewDetail(record)}
                className="!h-10 !bg-blue-600 !text-white !border-none hover:!bg-blue-700 transition-all"
              >
                <Eye size={18} />
              </Button>
              {isCancelable && requestId ? (
                <Popconfirm
                  title="Huỷ đơn booking"
                  description="Bạn có chắc chắn muốn huỷ đơn này? Thao tác không thể hoàn tác."
                  okText="Huỷ đơn"
                  cancelText="Bỏ qua"
                  okButtonProps={{
                    danger: true,
                    loading: isProcessingThisRow,
                  }}
                  placement="left"
                  onConfirm={() => handleCancelRequest(requestId)}
                >
                  {cancelButton}
                </Popconfirm>
              ) : null}
            </Space>
          );
        },
      },
    ],
    [
      handleViewDetail,
      handleCancelRequest,
      cancellingRequestId,
      isCancellingMySingleBookingRequest,
    ]
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden py-12 flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full " />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 rounded-full " />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-10 px-4 md:px-6 lg:px-8">
        {/* ---------- HEADER ---------- */}
        {/* <section className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/90 shadow-[0_40px_80px_-50px_rgba(79,70,229,0.6)] backdrop-blur">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-rose-500/10" />
          <div className="relative p-8 sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-indigo-600">
                  <CalendarRange size={16} />
                  <span>Đơn dặt KOL</span>
                </div>
                <h1 className="mt-5 text-3xl font-semibold text-slate-900 sm:text-4xl">
                  Quản lý đơn đặt KOL
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
                  Theo dõi trạng thái, thời gian thực hiện và thanh toán cho các
                  đơn đặt KOL của bạn. Giữ thông tin luôn được cập nhật để không
                  bỏ lỡ buổi làm việc quan trọng.
                </p>
              </div>

              <div className="self-start rounded-2xl border border-white/40 bg-white/70 px-6 py-4 shadow-inner shadow-slate-900/5">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <Sparkles size={18} className="text-indigo-500" />
                  <span>Cập nhật lúc: {formatDateTime(new Date())}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Sử dụng bộ lọc bên dưới để tìm nhanh đơn phù hợp.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {summaryCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.key}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/90 p-5 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_-35px_rgba(79,70,229,0.45)]"
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                    />
                    <div className="relative flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 transition-colors duration-300 group-hover:text-white/80">
                        {card.label}
                      </span>
                      <span className="rounded-full bg-slate-900/5 p-2 text-slate-600 transition-colors duration-300 group-hover:bg-white/20 group-hover:text-white">
                        <Icon size={18} />
                      </span>
                    </div>
                    <div className="relative mt-3 text-3xl font-semibold text-slate-900 transition-colors duration-300 group-hover:text-white">
                      {card.value}
                    </div>
                    {card.caption ? (
                      <p className="relative mt-2 text-xs text-slate-500 transition-colors duration-300 group-hover:text-white/90">
                        {card.caption}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section> */}

        {/* ---------- FILTER ---------- */}
        <section className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/90 shadow-[0_40px_80px_-50px_rgba(79,70,229,0.5)] backdrop-blur">
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col gap-2 border-b border-slate-200/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Bộ lọc thông minh
                </h2>
                <p className="text-sm text-slate-500">
                  Kiểm soát danh sách đơn theo trạng thái và thời gian.
                </p>
              </div>
              <Space size="middle" className="flex flex-wrap">
                <Button
                  icon={<RotateCcw size={16} />}
                  onClick={handleReset}
                  className="!h-11 !rounded-xl !border-slate-200 !bg-white hover:!border-indigo-500/60 hover:!text-indigo-600"
                >
                  Đặt lại
                </Button>
                <Button
                  icon={<RefreshCcw size={16} />}
                  onClick={() => refetchMyBookingRequests()}
                  loading={isFetchingMyBookingRequests}
                  className="!h-11 !rounded-xl !border-transparent !bg-indigo-500 !text-white hover:!bg-indigo-600"
                >
                  Làm mới
                </Button>
              </Space>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleFilter}
              className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-12"
            >
              <Form.Item
                label="Trạng thái booking"
                name="status"
                className="lg:col-span-4"
              >
                <Select
                  placeholder="Chọn trạng thái"
                  allowClear
                  options={BOOKING_STATUS_OPTIONS}
                  className="w-full"
                />
              </Form.Item>
              <Form.Item
                label="Thời gian thực hiện"
                name="executionRange"
                className="lg:col-span-4"
              >
                <RangePicker
                  showTime
                  className="w-full"
                  placeholder={["Bắt đầu", "Kết thúc"]}
                />
              </Form.Item>
              <Form.Item
                label="Ngày tạo"
                name="createdRange"
                className="lg:col-span-4"
              >
                <RangePicker
                  className="w-full"
                  placeholder={["Từ ngày", "Đến ngày"]}
                />
              </Form.Item>
              <div className="md:col-span-2 lg:col-span-12 flex flex-wrap justify-end gap-3">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<Search size={16} />}
                  className="!h-11 !rounded-xl !bg-slate-900 !px-6 hover:!bg-slate-800"
                >
                  Áp dụng bộ lọc
                </Button>
              </div>
            </Form>
          </div>
        </section>

        {/* ---------- TABLE ---------- */}
        <section className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/90 shadow-[0_40px_80px_-50px_rgba(79,70,229,0.5)] backdrop-blur">
          <div className="relative p-4 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-slate-200/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Danh sách đơn booking
                </h2>
                <p className="text-sm text-slate-500">
                  Bấm nút Chi tiết để xem thông tin đầy đủ của từng đơn.
                </p>
              </div>
              {pageRange ? (
                <Space size="small" className="text-sm text-slate-500">
                  <span>Hiển thị</span>
                  <strong className="text-slate-900">
                    {pageRange.start.toLocaleString("vi-VN")}-
                    {pageRange.end.toLocaleString("vi-VN")}
                  </strong>
                  <span>trong</span>
                  <strong className="text-slate-900">
                    {totalElements.toLocaleString("vi-VN")}
                  </strong>
                </Space>
              ) : (
                <div className="text-sm text-slate-500">
                  Không có dữ liệu để hiển thị.
                </div>
              )}
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200/70 shadow-sm">
              <Table
                columns={columns}
                dataSource={dataSource}
                loading={isLoadingMyBookingRequests}
                pagination={false}
                rowKey={deriveRowKey}
                scroll={{ x: "auto" }}
                locale={{ emptyText: "Không có dữ liệu" }}
                className="modern-soft-table"
              />
            </div>

            <div className="mt-6 flex justify-center">
              <Pagination
                current={page + 1}
                pageSize={size}
                total={totalElements}
                showSizeChanger
                pageSizeOptions={["10", "20", "50"]}
                onChange={(p, s) => {
                  const sizeChanged = s !== size;
                  setSize(s);
                  setPage(sizeChanged ? 0 : p - 1);
                }}
                className="rounded-full border border-slate-200/70 bg-white px-3 py-2 shadow-sm"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MySingleBookingRequests;
