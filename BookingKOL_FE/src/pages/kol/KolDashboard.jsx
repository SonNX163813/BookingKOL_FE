import { ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { useMemo } from "react";
import { useKolDashboardSummary } from "../../hook/kol/useKolDashboardSummary";

const EMPTY_SUMMARY = {
  stats: {
    totalWorkTimesCount: 0,
    completedWorkTimesCount: 0,
    recentWorkTimesCount: 0,
    upcomingWorkTimesCount: 0,
  },
  timeAndValue: {
    totalHoursAvailable: 0,
    totalHoursCompleted: 0,
    totalHoursUpcoming: 0,
    utilizationRate: 0,
    averageTimeAvailablePerDay: 0,
    averageWorkTimePerDay: 0,
  },
  feedbackStats: {
    averageOverallRating: 0,
    totalReviews: 0,
    rehireRate: 0,
    averageProfessionalismRating: 0,
    averageCommunicationRating: 0,
    averageTimelineRating: 0,
    averageContentQualityRating: 0,
  },
  completedWorkTimes: [],
  upcomingWorkTimes: [],
  recentWorkTimes: [],
  timestamp: null,
};

const formatNumber = (value) =>
  Number.isFinite(value) ? value.toLocaleString("vi-VN") : "0";
const formatPercent = (value, digits = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? `${num.toFixed(digits)}%` : "0%";
};
const formatHour = (value) => `${formatNumber(value)}h`;
const formatDateTime = (value) =>
  value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "--";

const statusTone = {
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  IN_PROGRESS: "bg-sky-100 text-sky-700 border-sky-200",
  UPCOMING: "bg-amber-100 text-amber-700 border-amber-200",
};

const getStatusTone = (status) =>
  statusTone[status?.toUpperCase()] ||
  "bg-slate-100 text-slate-700 border-slate-200";

const StatusBadge = ({ status }) => (
  <span
    className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusTone(
      status
    )}`}
  >
    {status || "N/A"}
  </span>
);

const MetricTile = ({ title, value, hint, accent }) => (
  <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 flex flex-col gap-1">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
      {title}
    </p>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
    {hint && <p className="text-sm text-slate-500">{hint}</p>}
    {accent && (
      <span className="mt-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full w-fit">
        {accent}
      </span>
    )}
  </div>
);

const WorkTimeCard = ({ item }) => (
  <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 flex flex-col gap-2">
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm font-semibold text-slate-900">
        {item.bookingId
          ? `Booking ${item.bookingId.slice(0, 8)}...`
          : "Đặt lịch"}
      </p>
      <StatusBadge status={item.status} />
    </div>
    <p className="text-sm text-slate-600">
      {formatDateTime(item.startAt)} - {formatDateTime(item.endAt)}
    </p>
    {item.requestNumber && (
      <p className="text-xs text-slate-500">Mã yêu cầu: {item.requestNumber}</p>
    )}
  </div>
);

const Skeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-12 bg-slate-100 rounded-2xl" />
    <div className="h-64 bg-slate-100 rounded-3xl" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="h-40 bg-slate-100 rounded-2xl" />
      ))}
    </div>
  </div>
);

const KolDashboard = () => {
  const { data, isLoading, isError, refetch, isFetching, error } =
    useKolDashboardSummary();

  const summary = data ?? EMPTY_SUMMARY;

  const featuredMetrics = useMemo(
    () => [
      {
        title: "Giờ khả dụng",
        value: formatHour(summary.timeAndValue.totalHoursAvailable),
        hint: "Tổng thời gian rảnh nhận job",
      },
      {
        title: "Giờ đã hoàn thành",
        value: formatHour(summary.timeAndValue.totalHoursCompleted),
        hint: "Đã thực hiện cho khách hàng",
      },
      {
        title: "Giờ sắp tới",
        value: formatHour(summary.timeAndValue.totalHoursUpcoming),
        hint: "Đã lên lịch trong tương lai gần",
      },
      {
        title: "Tỷ lệ sử dụng",
        value: formatPercent(summary.timeAndValue.utilizationRate, 0),
        hint: "Số giờ bận / tổng giờ khả dụng",
      },
    ],
    [summary.timeAndValue]
  );

  const workloadBadges = [
    {
      label: "Tổng lịch làm việc",
      value: summary.stats.totalWorkTimesCount,
    },
    {
      label: "Hoàn thành",
      value: summary.stats.completedWorkTimesCount,
    },
    {
      label: "Đang diễn ra",
      value: summary.stats.recentWorkTimesCount,
    },
    {
      label: "Sắp diễn ra",
      value: summary.stats.upcomingWorkTimesCount,
    },
  ];

  const feedbackTiles = [
    {
      title: "Đánh giá tổng",
      value: summary.feedbackStats.averageOverallRating?.toFixed?.(1) ?? "0.0",
      hint: `${formatNumber(summary.feedbackStats.totalReviews)} lượt đánh giá`,
      accent: "Chất lượng tổng thể",
    },
    {
      title: "Tỷ lệ thuê lại",
      value: formatPercent(summary.feedbackStats.rehireRate, 0),
      hint: "Khách quay lại đặt lịch",
    },
    {
      title: "Tương tác & trao đổi",
      value:
        summary.feedbackStats.averageCommunicationRating?.toFixed?.(1) ?? "0.0",
      hint: "Điểm giao tiếp",
    },
    {
      title: "Chuyên nghiệp & tiến độ",
      value:
        summary.feedbackStats.averageProfessionalismRating?.toFixed?.(1) ??
        "0.0",
      hint: `Tiến độ: ${
        summary.feedbackStats.averageTimelineRating?.toFixed?.(1) ?? "0.0"
      } / 5`,
    },
    {
      title: "Chất lượng nội dung",
      value:
        summary.feedbackStats.averageContentQualityRating?.toFixed?.(1) ??
        "0.0",
      hint: "Phản hồi từ brand",
    },
  ];

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center p-6">
        <p className="text-xl font-semibold text-rose-500">
          Không thể tải dữ liệu dashboard
        </p>
        <p className="text-slate-500 text-sm max-w-md">
          {(error && error.message) || "Vui lòng thử lại sau ít phút."}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fb] p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-500 font-semibold">
            KOL Dashboard
          </p>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">
            Bảng điều khiển KOL
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Cập nhật lần cuối:{" "}
            {summary.timestamp
              ? formatDateTime(summary.timestamp)
              : "Chưa có dữ liệu"}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-600 transition bg-white"
          disabled={isFetching}
        >
          <ReloadOutlined className={isFetching ? "animate-spin" : undefined} />
          Làm mới
        </button>
      </div>

      {isLoading ? (
        <Skeleton />
      ) : (
        <>
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-orange-400 to-rose-500 text-white shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.18),transparent_35%)]" />
            <div className="relative p-6 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80">
                    Thông tin theo thời gian thực
                  </p>
                  <p className="text-4xl font-black drop-shadow-sm mt-2">
                    {formatHour(summary.timeAndValue.totalHoursAvailable)}
                  </p>
                  <p className="text-sm text-white/80">
                    Tổng giờ bạn sẵn sàng nhận booking
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
                  {workloadBadges.map((item) => (
                    <div
                      key={item.label}
                      className="backdrop-blur-sm bg-white/10 rounded-2xl px-4 py-3 border border-white/20"
                    >
                      <p className="text-xs text-white/80">{item.label}</p>
                      <p className="text-2xl font-semibold drop-shadow-sm">
                        {formatNumber(item.value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {featuredMetrics.map((metric) => (
                  <div
                    key={metric.title}
                    className="bg-white/10 rounded-2xl px-4 py-3 border border-white/15"
                  >
                    <p className="text-xs text-white/80">{metric.title}</p>
                    <p className="text-2xl font-semibold drop-shadow-sm">
                      {metric.value}
                    </p>
                    <p className="text-[13px] text-white/80">{metric.hint}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricTile
                  title="Giờ rảnh mỗi ngày"
                  value={formatHour(
                    summary.timeAndValue.averageTimeAvailablePerDay
                  )}
                  hint="Trung bình theo lịch"
                />
                <MetricTile
                  title="Giờ làm việc mỗi ngày"
                  value={formatHour(summary.timeAndValue.averageWorkTimePerDay)}
                  hint="Đã hoặc sẽ thực hiện"
                />
                <MetricTile
                  title="Hiệu suất"
                  value={formatPercent(summary.timeAndValue.utilizationRate, 0)}
                  hint="Tối ưu thời gian cho booking"
                  accent="Real-time"
                />
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Lịch sắp tới
                    </p>
                    <p className="text-xs text-slate-500">
                      Công việc đã nhận trong tương lai gần
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    {formatNumber(summary.upcomingWorkTimes.length)} lịch
                  </span>
                </div>
                {summary.upcomingWorkTimes.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {summary.upcomingWorkTimes.map((item) => (
                      <WorkTimeCard
                        key={item.kolWorkTimeId || item.bookingId}
                        item={item}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Chưa có lịch sắp tới.
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Lịch vừa thực hiện
                    </p>
                    <p className="text-xs text-slate-500">
                      Đối soát nhanh các buổi đã hoàn thành gần đây
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    {formatNumber(summary.recentWorkTimes.length)} lịch
                  </span>
                </div>
                {summary.recentWorkTimes.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {summary.recentWorkTimes.map((item) => (
                      <WorkTimeCard
                        key={item.kolWorkTimeId || item.bookingId}
                        item={item}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    Chưa có lịch gần đây.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Điểm & phản hồi
                    </p>
                    <p className="text-xs text-slate-500">
                      Đánh giá chất lượng theo từng tiêu chí
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-semibold">
                    {formatNumber(summary.feedbackStats.totalReviews)} reviews
                  </span>
                </div>
                <div className="space-y-3">
                  {feedbackTiles.map((tile) => (
                    <div
                      key={tile.title}
                      className="p-3 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {tile.title}
                        </p>
                        <p className="text-xs text-slate-500">{tile.hint}</p>
                      </div>
                      <p className="text-xl font-bold text-indigo-600">
                        {tile.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-900">
                  Hoàn thành
                </p>
                {summary.completedWorkTimes.length ? (
                  summary.completedWorkTimes.slice(0, 4).map((item) => (
                    <div
                      key={item.kolWorkTimeId || item.bookingId}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {item.bookingId
                            ? `Booking ${item.bookingId.slice(0, 6)}...`
                            : "Lịch đã hoàn thành"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(item.endAt)}
                        </p>
                      </div>
                      <StatusBadge status={item.status || "COMPLETED"} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">
                    Chưa có lịch hoàn thành.
                  </p>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default KolDashboard;
