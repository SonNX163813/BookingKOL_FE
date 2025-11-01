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
import { BOOKING_FLOW_STYLE } from "../../../constants/bookingFlowTextStyles";

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

const resolveBookingStatus = (status) => {
  const normalized = status?.toUpperCase();
  const label =
    BOOKING_STATUS_OPTIONS.find((option) => option.value === normalized)
      ?.label ??
    normalized ??
    "--";
  const color = STATUS_TAG_COLOR[normalized] ?? "default";
  return { label, color };
};

const resolvePaymentStatus = (status) => {
  const normalized = status?.toUpperCase();
  const label =
    PAYMENT_STATUS_OPTIONS.find((option) => option.value === normalized)
      ?.label ??
    normalized ??
    "--";
  const color = PAYMENT_STATUS_COLOR[normalized] ?? "default";
  return { label, color };
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

  const hasData = Array.isArray(dataSource) && dataSource.length > 0;
  const isInitialLoading = isLoadingMyBookingRequests && !hasData;
  const skeletonItems = useMemo(
    () => Array.from({ length: Math.min(size, 6) }, (_, index) => index),
    [size]
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

  const renderBookingActions = useCallback(
    (record) => {
      const requestId = record?.id;
      const isCancelable = canCancelBookingRequest(record?.status);
      const isProcessingThisRow =
        isCancellingMySingleBookingRequest && cancellingRequestId === requestId;
      const disableCancel =
        !requestId ||
        (isCancellingMySingleBookingRequest && !isProcessingThisRow);

      const cancelButton = (
        <Button
          danger
          disabled={disableCancel}
          loading={isProcessingThisRow}
          style={{
            height: "2.5rem",
            fontWeight: 600,
            borderRadius: "16px",
            color: "#dc2626",
            "&:hover": { backgroundColor: "#dc2626" },
          }}
        >
          {/* <XCircle size={18} /> */}
          Hủy đơn
        </Button>
      );

      return (
        <Space size="small">
          <Button
            onClick={() => handleViewDetail(record)}
            style={{
              color: "#ffffff",
              height: "2.5rem",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "16px",
              backgroundColor: BOOKING_FLOW_STYLE.accent,
              "&:hover": { backgroundColor: "#3a5ec4" },
            }}
          >
            {/* <Eye size={18} /> */}
            Xem chi tiết
          </Button>
          {isCancelable && requestId ? (
            <Popconfirm
              title="Hủy đơn booking"
              description="Bạn có chắc chắn muốn hủy đơn này? Thao tác không thể hoàn tác."
              okText="Hủy đơn"
              cancelText="Bỏ qua"
              okButtonProps={{ danger: true, loading: isProcessingThisRow }}
              placement="left"
              onConfirm={() => handleCancelRequest(requestId)}
            >
              {cancelButton}
            </Popconfirm>
          ) : null}
        </Space>
      );
    },
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

        {/* ---------- REQUESTS ---------- */}
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

            <div className="mt-4">
              {isInitialLoading ? (
                <div className="grid grid-cols-1 gap-4">
                  {skeletonItems.map((index) => (
                    <div
                      key={`booking-skeleton-${index}`}
                      className="animate-pulse rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm"
                    >
                      <div className="mb-4 h-5 w-32 rounded bg-slate-200/80" />
                      <div className="mb-3 h-4 w-24 rounded bg-slate-200/70" />
                      <div className="space-y-3">
                        <div className="h-4 w-full rounded bg-slate-200/60" />
                        <div className="h-4 w-3/4 rounded bg-slate-200/60" />
                        <div className="h-4 w-2/3 rounded bg-slate-200/60" />
                      </div>
                      <div className="mt-6 h-10 w-28 rounded bg-slate-200/70" />
                    </div>
                  ))}
                </div>
              ) : hasData ? (
                <div className="grid grid-cols-1 gap-4">
                  {dataSource.map((record) => {
                    const key = deriveRowKey(record);
                    const statusMeta = resolveBookingStatus(record?.status);
                    const payment = getPrimaryPayment(record);
                    const paymentMeta = resolvePaymentStatus(payment?.status);
                    const totalAmount =
                      payment?.totalAmount ??
                      payment?.paidAmount ??
                      record?.totalAmount ??
                      record?.budget ??
                      null;
                    const description = record?.description?.trim();
                    const executionTime = composeExecutionTime(record);
                    const createdAtLabel = formatDateTime(record?.createdAt);
                    const updatedAtLabel = formatDateTime(
                      record?.updatedAt ??
                        record?.modifiedAt ??
                        record?.createdAt
                    );
                    const locationLabel = record?.location?.trim() || "--";
                    return (
                      <article
                        key={key}
                        className="group flex h-full flex-col justify-between gap-5 rounded-2xl border border-slate-200/70 bg-white/95 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_40px_80px_-40px_rgba(79,70,229,0.5)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                              Mã đơn
                            </p>
                            <h3 className="text-xl font-semibold text-slate-900">
                              {record?.requestNumber ?? "--"}
                            </h3>
                            <p className="text-xs text-slate-500">
                              Tạo lúc {createdAtLabel}
                            </p>
                          </div>
                          <Tag
                            color={statusMeta.color}
                            className="rounded-full px-3 py-1 text-sm font-medium"
                          >
                            {statusMeta.label}
                          </Tag>
                        </div>

                        <div className="grid gap-3 text-sm text-slate-600">
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-slate-500">Thời gian</span>
                            <span className="text-right font-medium text-slate-900">
                              {executionTime}
                            </span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-slate-500">Địa điểm</span>
                            <span className="text-right font-medium text-slate-900">
                              {locationLabel}
                            </span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-slate-500">Thanh toán</span>
                            <Tag
                              color={paymentMeta.color}
                              className="rounded-full px-3 py-1 text-sm font-medium"
                            >
                              {paymentMeta.label}
                            </Tag>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-slate-500">Tổng tiền</span>
                            <span className="text-right font-semibold text-indigo-600">
                              {formatCurrency(totalAmount)}
                            </span>
                          </div>
                        </div>

                        {description ? (
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            {description}
                          </div>
                        ) : null}

                        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="text-xs text-slate-500">
                            Cập nhật:{" "}
                            <span className="font-medium text-slate-700">
                              {updatedAtLabel}
                            </span>
                          </div>
                          {renderBookingActions(record)}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
                  <Sparkles size={28} className="mb-3 text-indigo-500" />
                  <p className="text-sm font-medium text-slate-600">
                    Bạn chưa có đơn booking nào phù hợp.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Hãy thử điều chỉnh bộ lọc hoặc nhấn Làm mới để lấy dữ liệu
                    mới nhất.
                  </p>
                </div>
              )}
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
