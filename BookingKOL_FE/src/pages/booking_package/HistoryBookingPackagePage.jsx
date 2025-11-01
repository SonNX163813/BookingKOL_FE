import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Button, Pagination, Space, Tag } from "antd";
import {
  CalendarRange,
  ClipboardList,
  RefreshCcw,
  Sparkles,
} from "lucide-react";

import { useGetHistoryBookingBackage } from "../../hook/booking_package/useGetHistoryBookingBackage";

const STATUS_META = {
  REQUESTED: { label: "Đang yêu cầu", color: "gold" },
  APPROVED: { label: "Đã phê duyệt", color: "green" },
  REJECTED: { label: "Đã từ chối", color: "red" },
  COMPLETED: { label: "Hoàn tất", color: "blue" },
};

const resolvePackageStatus = (status) => {
  const normalized = status?.toUpperCase();
  const meta = STATUS_META[normalized];
  return {
    label: meta?.label ?? normalized ?? "--",
    color: meta?.color ?? "default",
  };
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return "--";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "--";
  return `${new Intl.NumberFormat("vi-VN").format(numeric)} ₫`;
};

const composeBudgetRange = (min, max) => {
  if (min === null || min === undefined || max === null || max === undefined) {
    return "--";
  }
  return `${formatCurrency(min)} - ${formatCurrency(max)}`;
};

const formatDateTime = (value, pattern = "DD/MM/YYYY HH:mm") => {
  if (!value) return "--";
  const date = dayjs(value);
  return date.isValid() ? date.format(pattern) : "--";
};

const composeCampaignDuration = (start, end) => {
  if (!start && !end) return "--";
  const startLabel = formatDateTime(start, "DD/MM/YYYY");
  const endLabel = formatDateTime(end, "DD/MM/YYYY");
  if (!startLabel || startLabel === "--") return endLabel;
  if (!endLabel || endLabel === "--") return startLabel;
  if (dayjs(start).isValid() && dayjs(start).isSame(end, "day")) {
    return startLabel;
  }
  return `${startLabel} → ${endLabel}`;
};

const HistoryBookingPackagePage = () => {
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const {
    isGetHistoryBookingBackage,
    ResponseGetHistoryBookingPackage,
    refetchHistoryBookingPackage,
  } = useGetHistoryBookingBackage(page, size);

  const data =
    ResponseGetHistoryBookingPackage?.data?.content &&
    Array.isArray(ResponseGetHistoryBookingPackage.data.content)
      ? ResponseGetHistoryBookingPackage.data.content
      : [];
  const totalElements =
    ResponseGetHistoryBookingPackage?.data?.totalElements ?? 0;

  const hasData = data.length > 0;
  const isInitialLoading = isGetHistoryBookingBackage && !hasData;
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
    if (!isGetHistoryBookingBackage && page > 0 && !hasData) {
      setPage((prev) => Math.max(0, prev - 1));
    }
  }, [hasData, isGetHistoryBookingBackage, page]);

  const summaryCards = useMemo(() => {
    const counts = data.reduce((acc, item) => {
      const key = item?.status?.toUpperCase();
      if (!key) return acc;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const total = Number.isFinite(totalElements) ? totalElements : 0;
    const completed = counts.COMPLETED ?? 0;
    const approved = counts.APPROVED ?? 0;
    const requested = counts.REQUESTED ?? 0;
    const rejected = counts.REJECTED ?? 0;

    return [
      {
        key: "total",
        label: "Tổng chiến dịch",
        value: total.toLocaleString("vi-VN"),
        caption: `Hoàn tất: ${completed.toLocaleString("vi-VN")} chiến dịch`,
        gradient: "from-indigo-500/70 via-sky-500/60 to-cyan-500/50",
        icon: ClipboardList,
      },
      {
        key: "approved",
        label: "Đã phê duyệt",
        value: approved.toLocaleString("vi-VN"),
        caption: "Chiến dịch đang triển khai",
        gradient: "from-emerald-500/70 via-teal-500/60 to-sky-500/50",
        icon: CalendarRange,
      },
      {
        key: "requested",
        label: "Chờ xác nhận",
        value: requested.toLocaleString("vi-VN"),
        caption: "Đang đợi phê duyệt từ quản trị",
        gradient: "from-amber-500/70 via-orange-500/60 to-rose-500/40",
        icon: RefreshCcw,
      },
      {
        key: "rejected",
        label: "Từ chối",
        value: rejected.toLocaleString("vi-VN"),
        caption: "Chiến dịch bị từ chối hoặc hủy",
        gradient: "from-rose-500/70 via-red-500/60 to-orange-500/40",
        icon: Sparkles,
      },
    ];
  }, [data, totalElements]);

  const handlePaginationChange = (nextPage, nextSize) => {
    const sizeChanged = nextSize !== size;
    setSize(nextSize);
    setPage(sizeChanged ? 0 : nextPage - 1);
  };

  const handleRefresh = () => {
    refetchHistoryBookingPackage?.();
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden py-12 flex items-center justify-center">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/3 rounded-full bg-sky-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-10 px-4 md:px-6 lg:px-8">
        {/* <section className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/90 shadow-[0_40px_80px_-50px_rgba(79,70,229,0.6)] backdrop-blur">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-rose-500/10" />
          <div className="relative p-8 sm:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.26em] text-indigo-600">
                  <CalendarRange size={16} />
                  <span>Đơn chiến dịch</span>
                </div>
                <h1 className="mt-5 text-3xl font-semibold text-slate-900 sm:text-4xl">
                  Quản lý đơn đặt theo chiến dịch
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
                  Theo dõi tiến độ, ngân sách và trạng thái của từng đơn chiến
                  dịch bạn đã đặt. Giữ thông tin luôn cập nhật để phối hợp cùng
                  đội ngũ KOL hiệu quả nhất.
                </p>
              </div>

              <div className="self-start rounded-2xl border border-white/40 bg-white/70 px-6 py-4 shadow-inner shadow-slate-900/5">
                <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
                  <Sparkles size={18} className="text-indigo-500" />
                  <span>Cập nhật lúc: {formatDateTime(new Date())}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Dùng danh sách dưới đây để kiểm tra nhanh các yêu cầu gần đây.
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

        <section className="relative overflow-hidden rounded-3xl border border-white/40 bg-white/90 shadow-[0_40px_80px_-50px_rgba(79,70,229,0.5)] backdrop-blur">
          <div className="relative p-4 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-slate-200/60 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Danh sách đơn chiến dịch
                </h2>
                <p className="text-sm text-slate-500">
                  Xem nhanh ngân sách, thời gian triển khai và trạng thái của
                  từng đơn.
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

            <div className="mt-6 flex justify-end">
              <Button
                icon={<RefreshCcw size={16} />}
                onClick={handleRefresh}
                loading={isGetHistoryBookingBackage}
                className="!h-11 !rounded-xl !border-slate-200 !bg-white hover:!border-indigo-500/60 hover:!text-indigo-600"
              >
                Làm mới
              </Button>
            </div>

            <div className="mt-4">
              {isInitialLoading ? (
                <div className="grid grid-cols-1 gap-4">
                  {skeletonItems.map((index) => (
                    <div
                      key={`package-skeleton-${index}`}
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
                  {data.map((record) => {
                    const key =
                      record?.id ?? record?.campaignId ?? Math.random();
                    const statusMeta = resolvePackageStatus(record?.status);
                    const kolNames = Array.isArray(record?.kols)
                      ? record.kols
                          .map((kol) => kol?.displayName)
                          .filter(Boolean)
                      : [];
                    return (
                      <article
                        key={key}
                        className="group flex h-full flex-col justify-between gap-5 rounded-2xl border border-slate-200/70 bg-white/95 p-6 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_40px_80px_-40px_rgba(79,70,229,0.5)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                              Chiến dịch
                            </p>
                            <h3 className="text-xl font-semibold text-slate-900">
                              {record?.campaignName ?? "--"}
                            </h3>
                            <p className="text-xs text-slate-500">
                              Tạo lúc {formatDateTime(record?.createdAt)}
                            </p>
                          </div>
                          <Tag
                            color={statusMeta.color}
                            className="rounded-full px-3 py-1 text-sm font-medium"
                          >
                            {statusMeta.label}
                          </Tag>
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm">
                          <Tag
                            color="purple"
                            className="rounded-full px-3 py-1 text-sm font-medium"
                          >
                            Gói: {record?.packageName ?? "--"}
                          </Tag>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                            {composeBudgetRange(
                              record?.budgetMin,
                              record?.budgetMax
                            )}
                          </span>
                        </div>

                        <div className="grid gap-3 text-sm text-slate-600">
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-slate-500">Thời gian</span>
                            <span className="text-right font-medium text-slate-900">
                              {composeCampaignDuration(
                                record?.startDate,
                                record?.endDate
                              )}
                            </span>
                          </div>
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-slate-500">
                              Số KOL tham gia
                            </span>
                            <span className="text-right font-semibold text-indigo-600">
                              {kolNames.length}
                            </span>
                          </div>
                        </div>

                        {kolNames.length ? (
                          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            <span className="font-semibold text-slate-700">
                              Danh sách KOL:
                            </span>{" "}
                            {kolNames.join(", ")}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
                  <Sparkles size={28} className="mb-3 text-indigo-500" />
                  <p className="text-sm font-medium text-slate-600">
                    Bạn chưa có đơn chiến dịch nào.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Hãy thử đặt gói chiến dịch mới hoặc tải lại để cập nhật dữ
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
                pageSizeOptions={["10", "20", "50", "100"]}
                onChange={handlePaginationChange}
                className="rounded-full border border-slate-200/70 bg-white px-3 py-2 shadow-sm"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HistoryBookingPackagePage;
