import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Button, DatePicker, Form, Input, Pagination, Space, Tag } from "antd";
import {
  CalendarRange,
  ClipboardList,
  RotateCcw,
  RefreshCcw,
  Search,
  Sparkles,
} from "lucide-react";

import { useGetCoursePurchaseHistory } from "../../../hook/course/useGetCoursePurchaseHistory";

const { RangePicker } = DatePicker;

const COURSE_STATUS_META = {
  COURSEASSIGNED: { label: "Khóa học đã được gửi", color: "success" },
  NOTASSIGNED: { label: "Khóa học chưa được gửi", color: "blue" },
};

const PAYMENT_STATUS_META = {
  paid: { label: "Đã thanh toán", color: "success" },
  unpaid: { label: "Chưa thanh toán", color: "default" },
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return "--";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "--";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(parsed);
};

const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") => {
  if (!value) return "--";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : "--";
};

const formatDateRange = (start, end) => {
  if (!start && !end) return "--";
  const startLabel = formatDateTime(start, "DD/MM/YYYY");
  if (!end) return `${startLabel} → Chưa cập nhật`;
  const endLabel = formatDateTime(end, "DD/MM/YYYY");
  if (startLabel === "--") return endLabel;
  if (endLabel === "--") return startLabel;
  if (dayjs(start).isValid() && dayjs(start).isSame(end, "day")) {
    return startLabel;
  }
  return `${startLabel} → ${endLabel}`;
};

const resolveCourseStatus = (status) => {
  const normalized = status?.toUpperCase();
  return (
    COURSE_STATUS_META[normalized] ?? {
      label: normalized ?? "--",
      color: "default",
    }
  );
};

const resolvePaymentStatus = (isPaid) =>
  isPaid ? PAYMENT_STATUS_META.paid : PAYMENT_STATUS_META.unpaid;

const buildSkeletonItems = (size) =>
  Array.from({ length: Math.min(size, 6) }, (_, index) => index);

const CourseBookingHistory = () => {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateRange, setDateRange] = useState([null, null]);

  const normalizedSearch = debouncedSearch.trim();
  const startDateParam = dateRange?.[0]
    ? dayjs(dateRange[0]).startOf("day").toISOString()
    : undefined;
  const endDateParam = dateRange?.[1]
    ? dayjs(dateRange[1]).endOf("day").toISOString()
    : undefined;

  const {
    data: historyResponse,
    isPending: isLoadingHistory,
    refetch,
  } = useGetCoursePurchaseHistory({
    page,
    size,
    search: normalizedSearch || undefined,
    startDate: startDateParam,
    endDate: endDateParam,
  });

  const historyData = historyResponse?.data ?? {};
  const bookings = Array.isArray(historyData.content)
    ? historyData.content.filter(Boolean)
    : [];
  const totalElements = Number(historyData.totalElements) || 0;

  const hasData = bookings.length > 0;
  const isInitialLoading = isLoadingHistory && !hasData;
  const skeletonItems = useMemo(() => buildSkeletonItems(size), [size]);

  const pageRange = useMemo(() => {
    if (!totalElements) return null;
    const start = page * size + 1;
    const end = Math.min((page + 1) * size, totalElements);
    return { start, end };
  }, [page, size, totalElements]);

  const summaryCards = useMemo(() => {
    const counts = bookings.reduce(
      (acc, booking) => {
        const statusKey = booking?.status?.toUpperCase();
        if (statusKey) {
          acc.status[statusKey] = (acc.status[statusKey] ?? 0) + 1;
        }
        const paymentKey = booking?.isPaid ? "paid" : "unpaid";
        acc.payment[paymentKey] = (acc.payment[paymentKey] ?? 0) + 1;
        return acc;
      },
      { status: {}, payment: { paid: 0, unpaid: 0 } }
    );

    return [
      {
        key: "total",
        label: "Tổng đơn học",
        value: totalElements.toLocaleString("vi-VN"),
        caption: "Tất cả đơn đặt khóa học của bạn",
        icon: ClipboardList,
        gradient: "from-indigo-500/70 via-violet-500/60 to-fuchsia-500/50",
      },
      {
        key: "paid",
        label: "Đã thanh toán",
        value: counts.payment.paid.toLocaleString("vi-VN"),
        caption: "Số đơn đã được thanh toán",
        icon: CalendarRange,
        gradient: "from-emerald-500/70 via-teal-500/60 to-sky-500/50",
      },
      {
        key: "assigned",
        label: "Đang học",
        value: (counts.status.COURSEASSIGNED ?? 0).toLocaleString("vi-VN"),
        caption: "Đơn đã được kích hoạt học",
        icon: Sparkles,
        gradient: "from-amber-500/70 via-orange-500/60 to-rose-500/50",
      },
    ];
  }, [bookings, totalElements]);

  const handleSearchChange = (event) => {
    setSearchValue(event.target.value);
    setPage(0);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchValue]);

  const handleDateRangeChange = (values) => {
    setDateRange(values ?? [null, null]);
    setPage(0);
  };

  const handleResetFilters = () => {
    setSearchValue("");
    setDebouncedSearch("");
    setDateRange([null, null]);
    setPage(0);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden py-12 flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 rounded-full bg-purple-300/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-10 px-4 md:px-6 lg:px-8">
        {/* 
        <section className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/90 shadow-[0_40px_80px_-50px_rgba(79,70,229,0.6)] backdrop-blur">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-rose-500/10" />
          <div className="relative p-8 sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-indigo-600">
                  <CalendarRange size={16} />
                  <span>Lịch sử khóa học</span>
                </div>
                <h1 className="mt-5 text-3xl font-semibold text-slate-900 sm:text-4xl">
                  Quản lý đơn đặt khóa học
                </h1>
                <p className="mt-3 max-w-3xl text-sm text-slate-600 sm:text-base">
                  Theo dõi trạng thái ghép lớp, lịch học và tiến độ thanh toán của các khóa
                  học đã mua. Thông tin được đồng bộ liên tục giúp bạn kiểm soát tiến độ học tập.
                </p>
              </div>

              <div className="self-start rounded-2xl border border-white/40 bg-white/70 px-6 py-4 shadow-inner shadow-slate-900/5">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <Sparkles size={18} className="text-indigo-500" />
                  <span>Cập nhật lúc: {formatDateTime(new Date())}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Sử dụng bộ lọc bên dưới để tìm nhanh những đơn phù hợp như mong muốn.
                </p>
                <Button
                  icon={<RefreshCcw size={16} />}
                  onClick={() => refetch?.()}
                  className="mt-4 !h-11 !rounded-xl !border-transparent !bg-indigo-500 !text-white hover:!bg-indigo-600"
                >
                  Đồng bộ dữ liệu
                </Button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {summaryCards.map(({ key, label, value, caption, icon: Icon, gradient }) => (
                <div
                  key={key}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/90 p-5 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_-35px_rgba(79,70,229,0.45)]"
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                  />
                  <div className="relative flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 transition-colors duration-300 group-hover:text-white/80">
                      {label}
                    </span>
                    <span className="rounded-full bg-slate-900/5 p-2 text-slate-600 transition-colors duration-300 group-hover:bg-white/20 group-hover:text-white">
                      <Icon size={18} />
                    </span>
                  </div>
                  <div className="relative mt-3 text-3xl font-semibold text-slate-900 transition-colors duration-300 group-hover:text-white">
                    {value}
                  </div>
                  <p className="relative mt-2 text-xs text-slate-500 transition-colors duration-300 group-hover:text-white/90">
                    {caption}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section> 
        */}

        <section className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/90 shadow-[0_40px_80px_-50px_rgba(79,70,229,0.5)] backdrop-blur">
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col gap-2 border-b border-slate-200/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Bộ lọc thông minh
                </h2>
                <p className="text-sm text-slate-500">
                  Điều chỉnh theo từ khóa và thời gian tạo đơn học.
                </p>
              </div>
              <Space size="middle" className="flex flex-wrap">
                <Button
                  icon={<RotateCcw size={16} />}
                  onClick={handleResetFilters}
                  className="!h-11 !rounded-xl !border-slate-200 !bg-white hover:!border-indigo-500/60 hover:!text-indigo-600"
                >
                  Đặt lại
                </Button>
                <Button
                  icon={<RefreshCcw size={16} />}
                  onClick={() => refetch?.()}
                  className="!h-11 !rounded-xl !border-transparent !bg-indigo-500 !text-white hover:!bg-indigo-600"
                >
                  Làm mới
                </Button>
              </Space>
            </div>

            <Form
              layout="vertical"
              className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-12"
            >
              <Form.Item
                label="Từ khóa khóa học"
                className="lg:col-span-4"
                colon={false}
              >
                <Input
                  allowClear
                  size="large"
                  placeholder="Nhập tên khóa học"
                  prefix={<Search size={16} className="text-slate-400" />}
                  value={searchValue}
                  onChange={handleSearchChange}
                  className="rounded-2xl border-slate-200 px-4 py-2"
                />
              </Form.Item>
              <Form.Item
                label="Khoảng ngày mua"
                className="lg:col-span-4"
                colon={false}
              >
                <RangePicker
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  className="w-full rounded-2xl border-slate-200 px-3 py-2"
                  size="large"
                  format="DD/MM/YYYY"
                  placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
                />
              </Form.Item>
              <div className="md:col-span-2 lg:col-span-12 flex flex-wrap justify-end gap-3">
                <Button
                  type="primary"
                  icon={<Search size={16} />}
                  className="!h-11 !rounded-xl !bg-slate-900 !px-6 hover:!bg-slate-800"
                  onClick={() => {
                    setDebouncedSearch(searchValue);
                    refetch?.();
                  }}
                >
                  Tìm nhanh
                </Button>
              </div>
            </Form>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/90 shadow-[0_40px_80px_-50px_rgba(79,70,229,0.5)] backdrop-blur">
          <div className="relative p-4 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-slate-200/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Danh sách đơn khóa học
                </h2>
                <p className="text-sm text-slate-500">
                  Bấm nút chi tiết trong từng thẻ để xem thông tin giao dịch đầy
                  đủ.
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
                  {skeletonItems.map((item) => (
                    <div
                      key={`course-booking-skeleton-${item}`}
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
                  {bookings.map((booking) => {
                    const statusMeta = resolveCourseStatus(booking?.status);
                    const paymentMeta = resolvePaymentStatus(booking?.isPaid);
                    const periodLabel = formatDateRange(
                      booking?.startDate,
                      booking?.endDate
                    );
                    const startLabel = formatDateTime(
                      booking?.startDate,
                      "DD/MM/YYYY HH:mm"
                    );
                    const endLabel = booking?.endDate
                      ? formatDateTime(booking.endDate, "DD/MM/YYYY HH:mm")
                      : "Chưa cập nhật";
                    const orderCode =
                      booking?.purchasedCourseNumber ??
                      booking?.orderCode ??
                      booking?.code ??
                      booking?.id ??
                      "--";
                    const createdAtLabel = formatDateTime(
                      booking?.createdAt ?? booking?.orderDate
                    );
                    const updatedAtLabel = formatDateTime(
                      booking?.updatedAt ??
                        booking?.modifiedAt ??
                        booking?.createdAt
                    );
                    const mentorLabel =
                      booking?.mentorName ??
                      booking?.kolName ??
                      booking?.instructorName ??
                      "--";
                    const customerEmail =
                      booking?.email ??
                      booking?.user?.email ??
                      booking?.user?.emailAddress ??
                      "--";
                    const customerPhone =
                      booking?.phoneNumber ??
                      booking?.phone ??
                      booking?.user?.phone ??
                      booking?.user?.phoneNumber ??
                      "--";
                    const note =
                      typeof booking?.note === "string"
                        ? booking.note.trim()
                        : typeof booking?.description === "string"
                        ? booking.description.trim()
                        : "";

                    return (
                      <article
                        key={
                          booking?.id ?? booking?.courseName ?? Math.random()
                        }
                        className="group flex h-full flex-col justify-between gap-5 rounded-2xl border border-slate-200/70 bg-white/95 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_40px_80px_-40px_rgba(79,70,229,0.5)]"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                              Khóa học
                            </p>
                            <h3 className="text-xl font-semibold text-slate-900">
                              {booking?.courseName ?? "--"}
                            </h3>
                            <p className="text-xs text-slate-500">
                              Mua lúc {createdAtLabel}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-3 text-right sm:flex-row sm:text-left lg:flex-col lg:text-right">
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                Trạng thái khóa học
                              </p>
                              <Tag
                                color={statusMeta.color}
                                className="rounded-full px-3 py-1 text-sm font-medium"
                              >
                                {statusMeta.label}
                              </Tag>
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                Thanh toán
                              </p>
                              <Tag
                                color={paymentMeta.color}
                                className="rounded-full px-3 py-1 text-sm font-medium"
                              >
                                {paymentMeta.label}
                              </Tag>
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-3 text-sm text-slate-600">
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-slate-500">Mã đơn</span>
                            <span className="text-right font-medium text-slate-900">
                              {orderCode}
                            </span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-slate-500">Học phí</span>
                            <span className="text-right font-semibold text-indigo-600">
                              {formatCurrency(booking?.currentPrice)}
                            </span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-slate-500">Lịch học</span>
                            <span className="text-right font-medium text-slate-900">
                              {periodLabel}
                            </span>
                          </div>
                          {/* <div className="flex items-start justify-between gap-3">
                            <span className="text-slate-500">Giảng viên</span>
                            <span className="text-right font-medium text-slate-900">
                              {mentorLabel}
                            </span>
                          </div> */}
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-slate-500">Email</span>
                            <span className="text-right font-medium text-slate-900 break-all">
                              {customerEmail}
                            </span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-slate-500">
                              Số điện thoại
                            </span>
                            <span className="text-right font-medium text-slate-900">
                              {customerPhone}
                            </span>
                          </div>
                          {/* <div className="flex items-start justify-between gap-3">
                            <span className="text-slate-500">Ghi chú</span>
                          </div>
                          {note ? (
                            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                              {note}
                            </div>
                          ) : null} */}
                        </div>

                        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                          {/* <div>
                            Cập nhật:{" "}
                            <span className="font-medium text-slate-700">
                              {updatedAtLabel}
                            </span>
                          </div> */}
                          <div className="flex flex-wrap gap-4">
                            <span>
                              Bắt đầu:{" "}
                              <span className="font-medium text-slate-700">
                                {startLabel}
                              </span>
                            </span>
                            <span>
                              Kết thúc:{" "}
                              <span className="font-medium text-slate-700">
                                {endLabel}
                              </span>
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
                  <Sparkles size={28} className="mb-3 text-indigo-500" />
                  <p className="text-sm font-medium text-slate-600">
                    Không tìm thấy đơn đặt khóa học phù hợp.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Vui lòng điều chỉnh bộ lọc hoặc nhấn “Làm mới” để đồng bộ dữ
                    liệu mới nhất.
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
                onChange={(nextPage, nextSize) => {
                  const sizeChanged = nextSize !== size;
                  setSize(nextSize);
                  setPage(sizeChanged ? 0 : nextPage - 1);
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

export default CourseBookingHistory;
