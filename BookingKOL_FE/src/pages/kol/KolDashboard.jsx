import { ReloadOutlined } from "@ant-design/icons";
import { ConfigProvider, DatePicker } from "antd";
import viVN from "antd/locale/vi_VN";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { useKolDashboardSummary } from "../../hook/kol/useKolDashboardSummary";
import {
  BOOKING_STATUS_LABEL,
  STATUS_TAG_COLOR,
} from "../../constants/mySingleBookingStatuses";

const { RangePicker } = DatePicker;

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

const TAG_COLOR_TO_HEX = {
  default: "#cbd5e1",
  processing: "#4f8dfd",
  cyan: "#06b6d4",
  success: "#22c55e",
  blue: "#3b82f6",
  gold: "#fbbf24",
  magenta: "#d946ef",
  error: "#ef4444",
  purple: "#a855f7",
  volcano: "#fb923c",
  warning: "#f59e0b",
};

const normalizeStatusKey = (status) =>
  status ? status.toString().trim().toUpperCase() : "";

const getStatusColor = (statusKey) => {
  const tagColor = STATUS_TAG_COLOR[statusKey];
  if (tagColor && TAG_COLOR_TO_HEX[tagColor]) return TAG_COLOR_TO_HEX[tagColor];
  return "#cbd5e1";
};

const StatusBadge = ({ status }) => (
  <span
    className="px-2.5 py-1 rounded-full text-xs font-semibold border"
    style={{
      color: getStatusColor(normalizeStatusKey(status)),
      borderColor: getStatusColor(normalizeStatusKey(status)),
      backgroundColor: `${getStatusColor(normalizeStatusKey(status))}1a`,
    }}
  >
    {BOOKING_STATUS_LABEL[normalizeStatusKey(status)] || status || "N/A"}
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
        {/* {item.bookingId ? `Booking request` : "Đặt lịch"} */}
        {item.requestNumber ? `Đơn đặt lịch` : "Đơn đặt lịch"}
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
  const [dateRange, setDateRange] = useState(null);

  const startDateParam = dateRange?.[0]
    ? dayjs(dateRange[0]).startOf("day").toISOString()
    : undefined;
  const endDateParam = dateRange?.[1]
    ? dayjs(dateRange[1]).endOf("day").toISOString()
    : undefined;

  const { data, isLoading, isError, error, refetch, isFetching } =
    useKolDashboardSummary(
      {
        startDate: startDateParam,
        endDate: endDateParam,
      },
      {
        // Initial load hits the base endpoint; range selection sends start/end.
        enabled: true,
      }
    );

  const summary = data ?? EMPTY_SUMMARY;

  const featuredMetrics = useMemo(
    () => [
      {
        title: "Giờ khả dụng",
        value: formatHour(summary.timeAndValue.totalHoursAvailable),
      },
      {
        title: "Số giờ live đã hoàn thành",
        value: formatHour(summary.timeAndValue.totalHoursCompleted),
      },
      {
        title: "Số giờ live cần thực hiện",
        value: formatHour(summary.timeAndValue.totalHoursUpcoming),
      },
      {
        title: "Tỷ lệ sử dụng",
        value: formatPercent(summary.timeAndValue.utilizationRate, 0),
      },
    ],
    [summary.timeAndValue]
  );

  const workloadBadges = [
    { label: "Tổng lịch làm việc", value: summary.stats.totalWorkTimesCount },
    { label: "Hoàn thành", value: summary.stats.completedWorkTimesCount },
    { label: "Đang diễn ra", value: summary.stats.recentWorkTimesCount },
    { label: "Sắp diễn ra", value: summary.stats.upcomingWorkTimesCount },
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
      title: "Khả năng giao tiếp",
      value:
        summary.feedbackStats.averageCommunicationRating?.toFixed?.(1) ?? "0.0",
      hint: `Trình độ: ${
        summary.feedbackStats.averageCommunicationRating?.toFixed?.(1) ?? "0.0"
      } / 5`,
    },
    {
      title: "Độ chuyên nghiệp",
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
      hint: `Chất lượng: ${
        summary.feedbackStats.averageContentQualityRating?.toFixed?.(1) ?? "0.0"
      } / 5`,
    },
  ];

  const handleDateRangeChange = (range) => {
    if (!range || range.length < 2 || !range[0] || !range[1]) {
      setDateRange(null);
      return;
    }
    setDateRange(range);
  };

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
    <ConfigProvider locale={viVN}>
      <div className="min-h-screen bg-[#f6f8fb] p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-500 font-semibold">
              KOL Dashboard
            </p>
            <h1 className="text-3xl font-bold text-slate-900 mt-1">
              Bảng điều khiển KOL
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              format="DD/MM/YYYY"
              allowClear
              placeholder={["Từ ngày", "Đến ngày"]}
            />
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-600 transition bg-white"
              disabled={isFetching}
            >
              <ReloadOutlined
                className={isFetching ? "animate-spin" : undefined}
              />
              Làm mới
            </button>
          </div>
        </div>

        {isLoading ? (
          <Skeleton />
        ) : (
          <>
            <section className="relative overflow-hidden rounded-3xl bg-white text-slate-900 shadow-xl border border-slate-100">
              <div className="relative p-6 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                      Thông tin lịch làm việc
                    </p>
                    <p className="text-4xl font-black mt-2">
                      {formatHour(summary.timeAndValue.totalHoursAvailable)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
                    {workloadBadges.map((item) => (
                      <div
                        key={item.label}
                        className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200"
                      >
                        <p className="text-xs text-slate-600">{item.label}</p>
                        <p className="text-2xl font-semibold text-slate-900">
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
                      className="bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200"
                    >
                      <p className="text-xs text-slate-600">{metric.title}</p>
                      <p className="text-2xl font-semibold text-slate-900">
                        {metric.value}
                      </p>
                      <p className="text-[13px] text-slate-600">
                        {metric.hint}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Lịch sắp tới
                      </p>
                      {/* <p className="text-xs text-slate-500">
                        Công việc đã nhận trong tương lai gần
                      </p> */}
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
                        Lịch đang thực hiện
                      </p>
                      {/* <p className="text-xs text-slate-500">
                        Đối soát nhanh các buổi đã hoàn thành gần đây
                      </p> */}
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
                        key={
                          item.kolWorkTimeId ||
                          item.bookingId ||
                          item.requestNumber
                        }
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {/* {item.bookingId
                              ? `Booking ${item.bookingId.slice(0, 6)}...`
                              : "Lịch đã hoàn thành"} */}
                            {item.requestNumber}
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
    </ConfigProvider>
  );
};

export default KolDashboard;
