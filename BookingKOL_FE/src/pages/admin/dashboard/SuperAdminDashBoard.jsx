import { useMemo } from "react";
import dayjs from "dayjs";
import { ReloadOutlined } from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import { useSuperAdminDashboardSummary } from "../../../hook/superadmin/dashboard/useSuperAdminDashboardSummary";
import { BOOKING_STATUS_LABEL } from "../../../constants/mySingleBookingStatuses";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const formatCurrency = (value) => currencyFormatter.format(value || 0);
const formatInteger = (value) =>
  Number.isFinite(value) ? value.toLocaleString("vi-VN") : "0";
const formatPercent = (value, digits = 1) => {
  const num = Number(value);
  return Number.isFinite(num) ? `${num.toFixed(digits)}%` : "0%";
};
const formatDateTime = (value) =>
  dayjs(value).isValid() ? dayjs(value).format("DD/MM/YYYY HH:mm") : "--";

const ensureNumber = (value) => (Number.isFinite(value) ? value : 0);
const normalizeStatusKey = (status) =>
  status ? status.toString().trim().toUpperCase() : "";
const formatStatusLabel = (status) => {
  const key = normalizeStatusKey(status);
  if (!key) return "N/A";
  return BOOKING_STATUS_LABEL[key] || status || key;
};

const PIE_COLORS = ["#4f8dfd", "#f6c358", "#f97316", "#22c55e", "#a855f7"];

const EMPTY_ANALYSIS = {
  financialOverview: {
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
    totalGpm: 0,
    totalProductsSold: 0,
  },
  engagementOverview: {
    totalViews: 0,
    pcuPeak: 0,
    totalComments: 0,
    avgViewDurationSeconds: 0,
  },
  conversionFunnel: {
    totalViews: 0,
    clickRate: 0,
    addToCartShortTerm: 0,
    buyers: 0,
    viewerToBuyerRate: 0,
  },
  qualityScore: {
    retentionRate: 0,
    earlyEngagementRate: 0,
    revenuePerView: 0,
  },
  charts: {
    revenueByPlatform: [],
    durationByPlatform: [],
    revenueOverTime: [],
  },
};

const EMPTY_SUMMARY = {
  stats: {
    totalBookings: 0,
    completedBookings: 0,
    inProgressBookings: 0,
    totalRevenue: 0,
    earnedRevenue: 0,
    pendingRevenue: 0,
    cancelledLoss: 0,
  },
  revenueChart: [],
  statusContractBreakdown: [],
  upcomingBookingRequests: [],
  recentBookingRequests: [],
  topKolsByBookings: [],
  topKolsByRevenue: [],
  statusDistribution: [],
  platformDistribution: [],
  bookingTrend: [],
  revenueOverview: {
    totalRevenue: 0,
    totalPurchases: 0,
    uniqueUsers: 0,
    notAssignedPurchase: 0,
  },
  courseRevenue: [],
  revenueByDate: [],
  dashboardAnalysis: EMPTY_ANALYSIS,
  timestamp: null,
};

const DashboardSkeleton = () => (
  <div className="flex flex-col gap-6 p-6 animate-pulse">
    <div className="flex flex-col gap-2">
      <div className="h-8 w-64 bg-slate-100 rounded-lg" />
      <div className="h-5 w-80 bg-slate-100 rounded" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={`metric-skeleton-${idx}`}
          className="h-28 bg-slate-100 rounded-2xl"
        />
      ))}
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="h-80 bg-slate-100 rounded-2xl xl:col-span-2" />
      <div className="h-80 bg-slate-100 rounded-2xl" />
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="h-80 bg-slate-100 rounded-2xl" />
      <div className="h-80 bg-slate-100 rounded-2xl" />
    </div>
  </div>
);

const MetricCard = ({ label, value, formatter, gradient, icon }) => (
  <div
    className="relative overflow-hidden rounded-2xl text-white p-5 shadow-sm"
    style={{
      background: gradient,
    }}
  >
    <div className="flex items-start justify-between">
      <div className="text-2xl">{icon}</div>
      <span className="text-[11px] px-2 py-1 rounded-full bg-white/25 font-semibold">
        Số liệu thời gian thực
      </span>
    </div>
    <p className="mt-6 text-sm font-semibold opacity-80">{label}</p>
    <p className="text-3xl font-bold mt-1 drop-shadow-sm">
      {formatter ? formatter(value) : value}
    </p>
  </div>
);

const ChartCard = ({ title, subtitle, children, className = "" }) => (
  <div
    className={`bg-white rounded-2xl border border-slate-100 p-5 shadow-sm ${className}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {subtitle ? (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        ) : null}
      </div>
    </div>
    <div className="mt-4">{children}</div>
  </div>
);

const SuperAdminDashBoard = () => {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useSuperAdminDashboardSummary();

  const summary = data ?? EMPTY_SUMMARY;
  const analysis = summary.dashboardAnalysis || EMPTY_ANALYSIS;

  const revenueTrend = useMemo(
    () =>
      analysis.charts.revenueOverTime.map((item) => ({
        time: item.timePoint || "--",
        value: ensureNumber(item.value),
      })),
    [analysis.charts.revenueOverTime]
  );

  const breakdownMap = summary.statusContractBreakdown.reduce((acc, item) => {
    const key = normalizeStatusKey(item.label);
    if (!key) return acc;
    acc[key] = {
      value: Number(item.value) || 0,
      percentage: Number(item.percentage) || 0,
    };
    return acc;
  }, {});

  const statusPieData = Object.entries(BOOKING_STATUS_LABEL)
    .map(([statusKey, label]) => {
      const dataPoint = breakdownMap[statusKey];
      return {
        rawStatus: statusKey,
        label,
        value: dataPoint?.value ?? 0,
        percentage: dataPoint?.percentage ?? 0,
      };
    })
    .filter((item) => item.value > 0);

  summary.statusContractBreakdown.forEach((item) => {
    const key = normalizeStatusKey(item.label);
    if (!key || BOOKING_STATUS_LABEL[key]) return;
    const value = Number(item.value) || 0;
    if (!value) return;
    statusPieData.push({
      rawStatus: key,
      label: item.label || key,
      value,
      percentage: Number(item.percentage) || 0,
    });
  });

  const platformPieOption = useMemo(() => {
    const data = analysis.charts.revenueByPlatform;
    return {
      tooltip: {
        trigger: "item",
        formatter: ({ name, value, percent }) =>
          `${name || "Không xác định"}<br/>${formatCurrency(value)} (${
            percent?.toFixed?.(1) || 0
          }%)`,
      },
      legend: {
        bottom: 0,
        left: "center",
        textStyle: { color: "#475569" },
      },
      series: [
        {
          type: "pie",
          radius: ["45%", "70%"],
          label: { formatter: "{b}\n{d}%", fontSize: 12 },
          itemStyle: { borderColor: "#fff", borderWidth: 2 },
          data: data.map((item, idx) => ({
            value: ensureNumber(item.value),
            name: item.platform || `Nền tảng ${idx + 1}`,
          })),
        },
      ],
      color: ["#4f8dfd", "#f6c358", "#4ade80", "#f97316", "#a855f7"],
    };
  }, [analysis.charts.revenueByPlatform]);

  const statusPieOption = useMemo(
    () => ({
      tooltip: {
        trigger: "item",
        formatter: ({ name, value, percent }) =>
          `${name}<br/>${formatInteger(value)} hợp đồng (${percent}%)`,
      },
      legend: {
        top: 0,
        left: "center",
        textStyle: { color: "#475569" },
      },
      series: [
        {
          name: "Trạng thái hợp đồng",
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: true,
          label: {
            show: true,
            position: "inside",
            formatter: ({ percent }) => `${percent}%`,
            fontSize: 10,
            color: "#fff",
          },
          labelLine: { show: false },
          itemStyle: {
            borderRadius: 10,
            borderColor: "#fff",
            borderWidth: 2,
          },
          data: statusPieData.map((item, index) => ({
            value: item.value,
            name: item.label,
            rawStatus: item.rawStatus,
            itemStyle: {
              color: PIE_COLORS[index % PIE_COLORS.length],
            },
          })),
        },
      ],
    }),
    [statusPieData]
  );

  const revenueLineOption = useMemo(
    () => ({
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      tooltip: {
        trigger: "axis",
        formatter: (params = []) => {
          const [point] = Array.isArray(params) ? params : [params];
          if (!point) return "";
          return `${point.axisValueLabel}<br/>${formatCurrency(point.value)}`;
        },
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: revenueTrend.map((item) => item.time),
        axisLabel: { color: "#94a3b8" },
        axisLine: { lineStyle: { color: "#e2e8f0" } },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: "#94a3b8",
          formatter: (value) => `${Math.round(value / 1000)}k`,
        },
        splitLine: { lineStyle: { type: "dashed", color: "#e2e8f0" } },
      },
      series: [
        {
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 8,
          lineStyle: { color: "#4f8dfd", width: 3 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(79, 141, 253, 0.25)" },
                { offset: 1, color: "rgba(79, 141, 253, 0.03)" },
              ],
            },
          },
          itemStyle: { color: "#4f8dfd" },
          data: revenueTrend.map((item) => item.value),
        },
      ],
    }),
    [revenueTrend]
  );

  const conversionBarOption = useMemo(() => {
    const clickCount =
      analysis.conversionFunnel.totalViews *
      (analysis.conversionFunnel.clickRate / 100);
    const rows = [
      {
        label: "Lượt xem",
        value: ensureNumber(analysis.conversionFunnel.totalViews),
      },
      { label: "Lượt nhấp", value: ensureNumber(clickCount) },
      {
        label: "Thêm vào giỏ",
        value: ensureNumber(analysis.conversionFunnel.addToCartShortTerm),
      },
      {
        label: "Người mua",
        value: ensureNumber(analysis.conversionFunnel.buyers),
      },
    ];
    const maxVal = Math.max(...rows.map((row) => row.value), 1);
    return {
      grid: { left: 100, right: 20, top: 10, bottom: 10 },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: ({ 0: point }) =>
          point
            ? `${point.name}: ${formatInteger(point.value)}`
            : "Không có dữ liệu",
      },
      xAxis: {
        type: "value",
        max: Math.ceil(maxVal * 1.1),
        axisLabel: { color: "#94a3b8" },
        splitLine: { lineStyle: { type: "dashed", color: "#e2e8f0" } },
      },
      yAxis: {
        type: "category",
        data: rows.map((row) => row.label),
        axisLabel: { color: "#475569", fontWeight: 600 },
      },
      series: [
        {
          type: "bar",
          data: rows.map((row) => row.value),
          barWidth: 16,
          itemStyle: {
            borderRadius: [8, 8, 8, 8],
            color: (params) =>
              ["#4f8dfd", "#f59e0b", "#22c55e", "#f97316"][params.dataIndex] ||
              "#4f8dfd",
          },
        },
      ],
    };
  }, [analysis.conversionFunnel]);

  const qualityRadarOption = useMemo(() => {
    const metrics = [
      {
        name: "Giữ chân",
        value: ensureNumber(analysis.qualityScore.retentionRate),
      },
      {
        name: "Tương tác sớm",
        value: ensureNumber(analysis.qualityScore.earlyEngagementRate),
      },
      {
        name: "Doanh thu / lượt xem",
        value: ensureNumber(analysis.qualityScore.revenuePerView),
      },
    ];
    const maxValue = Math.max(...metrics.map((item) => item.value), 1);
    return {
      radar: {
        indicator: metrics.map((item) => ({
          name: item.name,
          max: Math.ceil(maxValue * 1.2),
        })),
        splitLine: { lineStyle: { color: "#e2e8f0" } },
        splitArea: { areaStyle: { color: ["#f8fafc", "#f1f5f9"] } },
        axisLine: { lineStyle: { color: "#cbd5e1" } },
      },
      series: [
        {
          type: "radar",
          data: [
            {
              value: metrics.map((item) => item.value),
              areaStyle: { color: "rgba(79, 141, 253, 0.25)" },
              lineStyle: { color: "#4f8dfd", width: 2 },
              itemStyle: { color: "#4f8dfd" },
            },
          ],
        },
      ],
    };
  }, [analysis.qualityScore]);

  const miniMetrics = useMemo(
    () => [
      {
        label: "Giá trị đơn hàng TB (AOV)",
        value: analysis.financialOverview.avgOrderValue,
        formatter: formatCurrency,
      },
      {
        label: "Sản phẩm đã bán",
        value: analysis.financialOverview.totalProductsSold,
        formatter: formatInteger,
      },
      {
        label: "Số người xem đồng thời cao nhất",
        value: analysis.engagementOverview.pcuPeak,
        formatter: formatInteger,
      },
      {
        label: "Tỷ lệ xem → mua",
        value: analysis.conversionFunnel.viewerToBuyerRate,
        formatter: (val) => formatPercent(val, 1),
      },
    ],
    [analysis]
  );

  const highlightCards = [
    {
      label: "Tổng doanh thu",
      value:
        analysis.financialOverview.totalRevenue || summary.stats.totalRevenue,
      formatter: formatCurrency,
      gradient: "linear-gradient(135deg, #5b8def 0%, #8bc6fd 100%)",
      icon: "💰",
    },
    {
      label: "Đơn hàng",
      value:
        analysis.financialOverview.totalOrders ||
        summary.stats.completedBookings,
      formatter: formatInteger,
      gradient: "linear-gradient(135deg, #c084fc 0%, #e2c8ff 100%)",
      icon: "🧾",
    },
    {
      label: "Tổng lượt xem",
      value: analysis.engagementOverview.totalViews,
      formatter: formatInteger,
      gradient: "linear-gradient(135deg, #f8d66d 0%, #ffe8a3 100%)",
      icon: "👀",
    },
    {
      label: "Tỷ lệ xem → mua",
      value: analysis.conversionFunnel.viewerToBuyerRate,
      formatter: (val) => formatPercent(val, 1),
      gradient: "linear-gradient(135deg, #f9a8a0 0%, #ffd0c7 100%)",
      icon: "🎯",
    },
  ];

  const showSkeleton = isLoading && !data;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-xl font-semibold text-rose-500">
          Không thể tải dữ liệu bảng điều khiển
        </p>
        <p className="text-sm text-slate-500 max-w-sm">
          {(error && error.message) || "Vui lòng thử lại sau."}
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

  if (showSkeleton) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#f6f8fb] min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-indigo-500 font-semibold">
            Báo cáo livestream
          </p>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">
            Bảng điều khiển Super Admin
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ảnh & màu sắc tương tự mẫu tham khảo – số liệu live và booking mới
            nhất.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Cập nhật: {formatDateTime(summary.timestamp)}
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

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {highlightCards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <ChartCard
          title="Trạng thái hợp đồng"
          subtitle="Phân bổ hợp đồng theo trạng thái"
        >
          <div className="h-80">
            {statusPieData.length ? (
              <ReactECharts
                option={statusPieOption}
                style={{ width: "100%", height: "100%" }}
                notMerge
                lazyUpdate
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Chưa có dữ liệu phân bổ trạng thái.
              </div>
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="Doanh thu theo nền tảng"
          subtitle="Tỷ trọng doanh thu trên từng sàn"
        >
          <div className="h-80">
            {analysis.charts.revenueByPlatform.length ? (
              <ReactECharts
                option={platformPieOption}
                style={{ width: "100%", height: "100%" }}
                notMerge
                lazyUpdate
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Chưa có dữ liệu nền tảng.
              </div>
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="Doanh thu theo thời gian"
          subtitle="Biến động GMV theo mốc thời gian live"
          className="xl:col-span-1"
        >
          <div className="h-80">
            {revenueTrend.length ? (
              <ReactECharts
                option={revenueLineOption}
                style={{ width: "100%", height: "100%" }}
                notMerge
                lazyUpdate
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Chưa có dữ liệu thời gian.
              </div>
            )}
          </div>
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard
          title="Phễu chuyển đổi"
          subtitle="Từ lượt xem tới hành động mua"
        >
          <div className="h-72">
            {analysis.conversionFunnel.totalViews ? (
              <ReactECharts
                option={conversionBarOption}
                style={{ width: "100%", height: "100%" }}
                notMerge
                lazyUpdate
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Chưa có dữ liệu phễu chuyển đổi.
              </div>
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="Điểm chất lượng"
          subtitle="Giữ chân, tương tác sớm và doanh thu / lượt xem"
        >
          <div className="h-72">
            {analysis.qualityScore.retentionRate ||
            analysis.qualityScore.earlyEngagementRate ||
            analysis.qualityScore.revenuePerView ? (
              <ReactECharts
                option={qualityRadarOption}
                style={{ width: "100%", height: "100%" }}
                notMerge
                lazyUpdate
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Chưa có dữ liệu chất lượng phiên live.
              </div>
            )}
          </div>
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {miniMetrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col gap-1"
          >
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="text-2xl font-semibold text-slate-900">
              {metric.formatter
                ? metric.formatter(metric.value)
                : formatInteger(metric.value)}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default SuperAdminDashBoard;
