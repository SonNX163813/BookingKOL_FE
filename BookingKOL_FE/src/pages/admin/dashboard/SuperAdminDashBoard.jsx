import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import { useSuperAdminDashboardSummary } from "../../../hook/superadmin/dashboard/useSuperAdminDashboardSummary";
import {
  BOOKING_STATUS_LABEL,
  STATUS_TAG_COLOR,
} from "../../../constants/mySingleBookingStatuses";

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
const PIE_COLORS = ["#4f8dfd", "#f6c358", "#f97316", "#22c55e", "#a855f7"];
const { RangePicker } = DatePicker;

// Map Ant Design tag colors to hex codes for chart usage.
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

const getStatusColor = (statusKey, fallbackIndex = 0) => {
  const tagColor = STATUS_TAG_COLOR[statusKey];
  if (tagColor && TAG_COLOR_TO_HEX[tagColor]) {
    return TAG_COLOR_TO_HEX[tagColor];
  }
  return PIE_COLORS[fallbackIndex % PIE_COLORS.length];
};

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
  </div>
);

const MetricCard = ({ label, value, formatter, gradient, icon }) => (
  <div
    className="relative overflow-hidden rounded-2xl text-white p-5 shadow-sm"
    style={{ background: gradient }}
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
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    <div className="mt-4">{children}</div>
  </div>
);

const SimpleCard = ({ label, value, formatter }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col gap-1">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="text-2xl font-semibold text-slate-900">
      {formatter ? formatter(value) : value}
    </p>
  </div>
);

const DataTable = ({ columns, data, emptyText }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-left">
        <thead>
          <tr className="text-slate-500">
            {columns.map((col) => (
              <th key={col.key} className="py-2 pr-4 font-semibold">
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length ? (
            data.map((row, idx) => (
              <tr key={row.key || idx} className="border-t border-slate-100">
                {columns.map((col) => (
                  <td key={col.key} className="py-2 pr-4 text-slate-900">
                    {col.render
                      ? col.render(row[col.dataIndex], row)
                      : row[col.dataIndex]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="py-3 text-slate-400" colSpan={columns.length}>
                {emptyText}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const SuperAdminDashBoard = () => {
  const [dateRange, setDateRange] = useState(null);

  const startDateParam = dateRange?.[0]
    ? dayjs(dateRange[0]).startOf("day").toISOString()
    : undefined;
  const endDateParam = dateRange?.[1]
    ? dayjs(dateRange[1]).endOf("day").toISOString()
    : undefined;

  const { data, isLoading, isError, error, refetch, isFetching } =
    useSuperAdminDashboardSummary(
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
              color: getStatusColor(item.rawStatus, index),
            },
          })),
        },
      ],
    }),
    [statusPieData]
  );

  const revenueChartOption = useMemo(
    () => ({
      grid: { left: 40, right: 10, top: 20, bottom: 40 },
      tooltip: {
        trigger: "axis",
        formatter: ({ 0: point }) =>
          point ? `${point.name}<br/>${formatCurrency(point.value)}` : "",
      },
      xAxis: {
        type: "category",
        data: summary.revenueChart.map((item) => item.label || "--"),
        axisLabel: { color: "#94a3b8", rotate: 25 },
        axisLine: { lineStyle: { color: "#e2e8f0" } },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: "#94a3b8",
          formatter: (val) => `${Math.round(val / 1000)}k`,
        },
        splitLine: { lineStyle: { type: "dashed", color: "#e2e8f0" } },
      },
      series: [
        {
          type: "bar",
          data: summary.revenueChart.map((item) => ensureNumber(item.value)),
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: "#4f8dfd",
          },
        },
      ],
    }),
    [summary.revenueChart]
  );

  const durationByPlatformOption = useMemo(() => {
    const pieData = analysis.charts.durationByPlatform;
    return {
      tooltip: {
        trigger: "item",
        formatter: ({ name, value, percent }) =>
          `${name || "Nền tảng"}<br/>${formatInteger(value)} phút (${
            percent?.toFixed?.(1) || 0
          }%)`,
      },
      legend: {
        top: 0,
        left: "center",
        textStyle: { color: "#475569" },
      },
      series: [
        {
          type: "pie",
          radius: ["45%", "70%"],
          label: { formatter: "{b}\n{d}%", fontSize: 12 },
          itemStyle: { borderColor: "#fff", borderWidth: 2 },
          data: pieData.map((item, idx) => ({
            value: ensureNumber(item.value),
            name: item.platform || `Nền tảng ${idx + 1}`,
          })),
        },
      ],
      color: ["#a855f7", "#4f8dfd", "#10b981", "#f97316", "#facc15"],
    };
  }, [analysis.charts.durationByPlatform]);

  const platformPieOption = useMemo(() => {
    const pieData = analysis.charts.revenueByPlatform;
    return {
      tooltip: {
        trigger: "item",
        formatter: ({ name, value, percent }) =>
          `${name || "Không xác định"}<br/>${formatCurrency(value)} (${
            percent?.toFixed?.(1) || 0
          }%)`,
      },
      legend: {
        top: 0,
        left: "center",
        textStyle: { color: "#475569" },
      },
      series: [
        {
          type: "pie",
          radius: ["45%", "70%"],
          label: { formatter: "{b}\n{d}%", fontSize: 12 },
          itemStyle: { borderColor: "#fff", borderWidth: 2 },
          data: pieData.map((item, idx) => ({
            value: ensureNumber(item.value),
            name: item.platform || `Nền tảng ${idx + 1}`,
          })),
        },
      ],
      color: ["#4f8dfd", "#f6c358", "#4ade80", "#f97316", "#a855f7"],
    };
  }, [analysis.charts.revenueByPlatform]);

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

  const platformDistributionOption = useMemo(
    () => ({
      grid: { left: 40, right: 10, top: 25, bottom: 30 },
      tooltip: {
        trigger: "axis",
        formatter: ({ 0: point }) =>
          point ? `${point.name}: ${formatInteger(point.value)} booking` : "",
      },
      xAxis: {
        type: "category",
        data: summary.platformDistribution.map((item) => item.platform || "--"),
        axisLabel: { color: "#475569", fontWeight: 600 },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "#94a3b8" },
        splitLine: { lineStyle: { type: "dashed", color: "#e2e8f0" } },
      },
      series: [
        {
          type: "bar",
          barWidth: 22,
          data: summary.platformDistribution.map((item) =>
            ensureNumber(item.count)
          ),
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: "#10b981",
          },
          label: {
            show: true,
            position: "top",
            formatter: ({ value }) => formatInteger(value),
            color: "#0f172a",
            fontWeight: 600,
          },
        },
      ],
    }),
    [summary.platformDistribution]
  );

  const bookingTrendOption = useMemo(
    () => ({
      grid: { left: 40, right: 10, top: 20, bottom: 40 },
      tooltip: {
        trigger: "axis",
        formatter: ({ 0: point }) =>
          point
            ? `${point.name}<br/>${formatInteger(point.value)} booking`
            : "",
      },
      xAxis: {
        type: "category",
        data: summary.bookingTrend.map(
          (item) => `${item.month}/${item.year || ""}`
        ),
        axisLabel: { color: "#94a3b8" },
        axisLine: { lineStyle: { color: "#e2e8f0" } },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "#94a3b8" },
        splitLine: { lineStyle: { type: "dashed", color: "#e2e8f0" } },
      },
      series: [
        {
          type: "line",
          smooth: true,
          data: summary.bookingTrend.map((item) => ensureNumber(item.count)),
          itemStyle: { color: "#6366f1" },
          lineStyle: { color: "#6366f1", width: 3 },
          symbolSize: 8,
        },
      ],
    }),
    [summary.bookingTrend]
  );

  const conversionBarOption = useMemo(() => {
    const clickCount =
      analysis.conversionFunnel.totalViews *
      (analysis.conversionFunnel.clickRate / 100);
    const addToCartShortTerm = ensureNumber(
      analysis.conversionFunnel.addToCartShortTerm
    );
    const rows = [
      {
        label: "Lượt xem",
        value: ensureNumber(analysis.conversionFunnel.totalViews),
      },
      { label: "Tỷ lệ xem sản phẩm", value: ensureNumber(clickCount) },
      // {
      //   label: "Thêm vào giỏ",
      //   value: ensureNumber(analysis.conversionFunnel.addToCartShortTerm),
      // },
      {
        label: "Người mua",
        value: ensureNumber(analysis.conversionFunnel.buyers),
      },
    ];
    const maxVal = Math.max(...rows.map((row) => row.value), 1);
    return {
      grid: { left: 100, right: 20, top: 50, bottom: 10 },
      graphic: [
        {
          type: "text",
          left: "center",
          top: 10,
          style: {
            text: `Số lượt thêm vào giỏ hàng: ${addToCartShortTerm}`,
            fill: "#0f172a",
            fontSize: 14,
            fontWeight: 700,
          },
        },
      ],
      tooltip: {
        trigger: "axis",
        // axisPointer: { type: "shadow" },
        formatter: ({ 0: point }) =>
          point
            ? `${point.name}: ${formatInteger(point.value)}`
            : "Không có dữ liệu",
      },
      xAxis: {
        type: "category",
        data: rows.map((row) => row.label),
        axisLabel: { color: "#475569", fontWeight: 600 },
      },
      yAxis: {
        type: "value",
        max: Math.ceil(maxVal * 1.1),
        axisLabel: { color: "#94a3b8" },
        splitLine: { lineStyle: { type: "dashed", color: "#e2e8f0" } },
      },
      series: [
        {
          type: "bar",
          barWidth: 22,
          data: rows.map((r, idx) => ({
            value: r.value,
            itemStyle: {
              color:
                ["#4f8dfd", "#a855f7", "#22c55e", "#f59e0b"][idx] || "#4f8dfd",
            },
          })),
          itemStyle: { borderRadius: [6, 6, 0, 0] },
          label: {
            show: true,
            position: "top",
            formatter: ({ value }) => formatInteger(value),
            color: "#0f172a",
            fontWeight: 600,
          },
        },
      ],
    };
  }, [analysis.conversionFunnel]);

  const qualityRadarOption = useMemo(() => {
    const metrics = [
      {
        key: "retentionRate",
        name: "Giữ chân",
        value: ensureNumber(analysis.qualityScore.retentionRate),
      },
      {
        key: "earlyEngagementRate",
        name: "Tương tác sớm",
        value: ensureNumber(analysis.qualityScore.earlyEngagementRate),
      },
      {
        key: "revenuePerView",
        name: "Doanh thu / lượt xem",
        value: ensureNumber(analysis.qualityScore.revenuePerView),
      },
    ];

    const maxValue = Math.max(...metrics.map((item) => item.value), 1);

    return {
      tooltip: {
        formatter: () =>
          metrics
            .map((m) => `${m.name}: ${formatInteger(Math.round(m.value))}`)
            .join("<br/>"),
      },

      radar: {
        center: ["50%", "65%"], // [ngang, dọc]
        radius: "95%",
        indicator: metrics.map((item) => ({
          name: `${item.name}\n${formatInteger(Math.round(item.value))}`,
          max: Math.ceil(maxValue * 1.2),
        })),
        splitLine: { lineStyle: { color: "#e2e8f0" } },
        splitArea: { areaStyle: { color: ["#f8fafc", "#f1f5f9"] } },
        axisLine: { lineStyle: { color: "#cbd5e1" } },
        axisName: {
          color: "#475569",
          fontSize: 12,
          fontWeight: 600,
        },
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
              // label: {
              //   show: true,
              //   formatter: ({ value }) => formatInteger(Math.round(value)),
              //   color: "#1e293b",
              //   fontWeight: 600,
              // },
            },
          ],
        },
      ],
    };
  }, [analysis.qualityScore]);

  const financialBarOption = useMemo(() => {
    const revenueValue = ensureNumber(analysis.financialOverview.totalRevenue);
    const rows = [
      {
        label: "Đơn hàng",
        value: ensureNumber(analysis.financialOverview.totalOrders),
      },
      {
        label: "AOV",
        value: ensureNumber(analysis.financialOverview.avgOrderValue),
      },
      {
        label: "GPM",
        value: ensureNumber(analysis.financialOverview.totalGpm),
      },
      {
        label: "SP bán",
        value: ensureNumber(analysis.financialOverview.totalProductsSold),
      },
    ];
    const maxVal = Math.max(...rows.map((r) => r.value), 1);
    return {
      grid: { left: 40, right: 20, top: 60, bottom: 40 },
      graphic: [
        {
          type: "text",
          left: "center",
          top: 10,
          style: {
            text: `Doanh thu: ${formatCurrency(revenueValue)}`,
            fill: "#0f172a",
            fontSize: 14,
            fontWeight: 700,
          },
        },
      ],
      tooltip: {
        trigger: "axis",
        formatter: ({ 0: point }) =>
          point ? `${point.name}<br/>${formatInteger(point.value)}` : "",
      },
      xAxis: {
        type: "category",
        data: rows.map((r) => r.label),
        axisLabel: { color: "#475569" },
        axisLine: { lineStyle: { color: "#e2e8f0" } },
      },
      yAxis: {
        type: "value",
        max: Math.ceil(maxVal * 1.1),
        axisLabel: { color: "#94a3b8" },
        splitLine: { lineStyle: { type: "dashed", color: "#e2e8f0" } },
      },
      series: [
        {
          type: "bar",
          barWidth: 22,
          data: rows.map((r, idx) => ({
            value: r.value,
            itemStyle: {
              color:
                ["#4f8dfd", "#a855f7", "#22c55e", "#f59e0b"][idx] || "#4f8dfd",
            },
          })),
          itemStyle: { borderRadius: [6, 6, 0, 0] },
          label: {
            show: true,
            position: "top",
            formatter: ({ value }) => formatInteger(value),
            color: "#0f172a",
            fontWeight: 600,
          },
        },
      ],
    };
  }, [analysis.financialOverview]);

  const engagementBarOption = useMemo(() => {
    const rows = [
      {
        label: "Lượt xem",
        value: ensureNumber(analysis.engagementOverview.totalViews),
      },
      {
        label: "PCU cao nhất",
        value: ensureNumber(analysis.engagementOverview.pcuPeak),
      },
      {
        label: "Bình luận",
        value: ensureNumber(analysis.engagementOverview.totalComments),
      },
      {
        label: "TG xem TB (s)",
        value: ensureNumber(analysis.engagementOverview.avgViewDurationSeconds),
      },
    ];
    const maxVal = Math.max(...rows.map((r) => r.value), 1);
    return {
      grid: { left: 40, right: 20, top: 20, bottom: 40 },
      tooltip: {
        trigger: "axis",
        formatter: ({ 0: point }) =>
          point ? `${point.name}<br/>${formatInteger(point.value)}` : "",
      },
      xAxis: {
        type: "category",
        data: rows.map((r) => r.label),
        axisLabel: { color: "#475569" },
        axisLine: { lineStyle: { color: "#e2e8f0" } },
      },
      yAxis: {
        type: "value",
        max: Math.ceil(maxVal * 1.1),
        axisLabel: { color: "#94a3b8" },
        splitLine: { lineStyle: { type: "dashed", color: "#e2e8f0" } },
      },
      series: [
        {
          type: "bar",
          barWidth: 22,
          data: rows.map((r, idx) => ({
            value: r.value,
            itemStyle: {
              color:
                ["#22c55e", "#10b981", "#06b6d4", "#0ea5e9"][idx] || "#22c55e",
            },
          })),
          itemStyle: { borderRadius: [6, 6, 0, 0] },
          label: {
            show: true,
            position: "top",
            formatter: ({ value }) => formatInteger(value),
            color: "#0f172a",
            fontWeight: 600,
          },
        },
      ],
    };
  }, [analysis.engagementOverview]);

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

  const handleDateRangeChange = (range) => {
    if (!range || range.length < 2 || !range[0] || !range[1]) {
      setDateRange(null);
      return;
    }
    setDateRange(range);
  };

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
    <div className="flex flex-col gap-8 p-6 bg-[#f6f8fb] min-h-screen">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-indigo-500 font-semibold">
            Tổng quan hệ thống & livestream
          </p>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">
            Bảng điều khiển Super Admin
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Báo cáo hệ thống, khóa học và hiệu suất livestream.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Cập nhật: {formatDateTime(summary.timestamp)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RangePicker
            value={dateRange || []}
            onChange={handleDateRangeChange}
            format="DD/MM/YYYY"
            allowClear
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

      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-semibold">
            Báo cáo hệ thống
          </p>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Booking, doanh thu và khóa học
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Số liệu tổng quan trước phân tích livestream.
          </p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Tổng booking", value: summary.stats.totalBookings },
            { label: "Hoàn thành", value: summary.stats.completedBookings },
            { label: "Đang xử lý", value: summary.stats.inProgressBookings },
            {
              label: "Doanh thu",
              value: summary.stats.totalRevenue,
              formatter: formatCurrency,
            },
            {
              label: "Đã thu",
              value: summary.stats.earnedRevenue,
              formatter: formatCurrency,
            },
            {
              label: "Chờ thu",
              value: summary.stats.pendingRevenue,
              formatter: formatCurrency,
            },
            {
              label: "Hủy / thất thoát",
              value: summary.stats.cancelledLoss,
              formatter: formatCurrency,
            },
          ].map((card, idx) => (
            <SimpleCard key={`${card.label}-${idx}`} {...card} />
          ))}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <ChartCard
            title="Trạng thái hợp đồng"
            subtitle="Phân bổ hợp đồng theo trạng thái"
            className="xl:col-span-2"
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
            title="Xu hướng booking"
            subtitle="Tổng booking theo tháng/năm"
          >
            <div className="h-80">
              {summary.bookingTrend.length ? (
                <ReactECharts
                  option={bookingTrendOption}
                  style={{ width: "100%", height: "100%" }}
                  notMerge
                  lazyUpdate
                />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Chưa có dữ liệu xu hướng booking.
                </div>
              )}
            </div>
          </ChartCard>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-1 gap-6">
          <ChartCard
            title="Doanh thu theo mốc ngày"
            subtitle="Toàn bộ dữ liệu doanh thu theo mốc ngày"
            className="xl:col-span-2"
          >
            <div className="h-80">
              {summary.revenueChart.length ? (
                <ReactECharts
                  option={revenueChartOption}
                  style={{ width: "100%", height: "100%" }}
                  notMerge
                  lazyUpdate
                />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Chưa có dữ liệu revenueChart.
                </div>
              )}
            </div>
          </ChartCard>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ChartCard title="Nền tảng được đặt" subtitle="Phân bố theo nền tảng">
            <div className="h-72">
              {summary.platformDistribution.length ? (
                <ReactECharts
                  option={platformDistributionOption}
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
            title="Tổng quan doanh thu"
            subtitle="Tổng hợp lượt mua khóa học"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  label: "Tổng doanh thu",
                  value: summary.revenueOverview.totalRevenue,
                  formatter: formatCurrency,
                },
                {
                  label: "Tổng đơn hàng",
                  value: summary.revenueOverview.totalPurchases,
                  formatter: formatInteger,
                },
                {
                  label: "Người dùng duy nhất",
                  value: summary.revenueOverview.uniqueUsers,
                  formatter: formatInteger,
                },
                {
                  label: "Chưa gán KOL",
                  value: summary.revenueOverview.notAssignedPurchase,
                  formatter: formatInteger,
                },
              ].map((item) => (
                <SimpleCard key={item.label} {...item} />
              ))}
            </div>
          </ChartCard>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <DataTable
            columns={[
              { key: "kol", title: "KOL", dataIndex: "kolName" },
              {
                key: "bookingCount",
                title: "Số booking",
                dataIndex: "bookingCount",
                render: formatInteger,
              },
            ]}
            data={summary.topKolsByBookings}
            emptyText="Chưa có top KOL theo booking."
          />

          <DataTable
            columns={[
              { key: "kol", title: "KOL", dataIndex: "kolName" },
              {
                key: "revenue",
                title: "Doanh thu",
                dataIndex: "totalRevenue",
                render: formatCurrency,
              },
            ]}
            data={summary.topKolsByRevenue}
            emptyText="Chưa có top KOL theo doanh thu."
          />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <DataTable
            columns={[
              { key: "course", title: "Khóa học", dataIndex: "courseName" },
              {
                key: "sales",
                title: "Số lượng",
                dataIndex: "totalSales",
                render: formatInteger,
              },
              {
                key: "rev",
                title: "Doanh thu",
                dataIndex: "totalRevenue",
                render: formatCurrency,
              },
            ]}
            data={summary.courseRevenue}
            emptyText="Chưa có dữ liệu courseRevenue."
          />

          <DataTable
            columns={[
              { key: "date", title: "Ngày", dataIndex: "date" },
              {
                key: "rev",
                title: "Doanh thu",
                dataIndex: "totalRevenue",
                render: formatCurrency,
              },
            ]}
            data={summary.revenueByDate}
            emptyText="Chưa có dữ liệu revenueByDate."
          />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <DataTable
            columns={[
              { key: "label", title: "Trạng thái", dataIndex: "label" },
              {
                key: "value",
                title: "Số lượng",
                dataIndex: "value",
                render: formatInteger,
              },
              {
                key: "percentage",
                title: "Tỷ lệ (%)",
                dataIndex: "percentage",
                render: (val) => formatPercent(val, 2),
              },
            ]}
            data={summary.statusDistribution}
            emptyText="Chưa có statusDistribution."
          />

          {/* <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3">
            <p className="text-sm font-semibold text-slate-900">
              Booking sắp tới
            </p>
            {summary.upcomingBookingRequests.length ? (
              <div className="space-y-2 max-h-72 overflow-auto text-xs">
                {summary.upcomingBookingRequests.map((item, idx) => (
                  <pre
                    key={idx}
                    className="bg-slate-50 rounded-lg p-2 text-slate-700 whitespace-pre-wrap break-words"
                  >
                    {JSON.stringify(item, null, 2)}
                  </pre>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Chưa có booking sắp tới.</p>
            )}

            <p className="text-sm font-semibold text-slate-900">
              Booking gần nhất
            </p>
            {summary.recentBookingRequests.length ? (
              <div className="space-y-2 max-h-72 overflow-auto text-xs">
                {summary.recentBookingRequests.map((item, idx) => (
                  <pre
                    key={idx}
                    className="bg-slate-50 rounded-lg p-2 text-slate-700 whitespace-pre-wrap break-words"
                  >
                    {JSON.stringify(item, null, 2)}
                  </pre>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">
                Chưa có booking gần nhất.
              </p>
            )}
          </div> */}
        </section>
      </div>

      <div className="h-px bg-slate-200" />

      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-indigo-500 font-semibold">
            Báo cáo sau livestream
          </p>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Dashboard Analysis
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Kết quả phân tích sau phiên livestream.
          </p>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {highlightCards.map((card) => (
            <MetricCard key={card.label} {...card} />
          ))}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ChartCard
            title="Tài chính tổng quan"
            subtitle="Doanh thu, đơn hàng, AOV, GPM, sản phẩm bán"
          >
            <div className="h-72">
              {analysis.financialOverview.totalRevenue ||
              analysis.financialOverview.totalOrders ||
              analysis.financialOverview.totalGpm ||
              analysis.financialOverview.totalProductsSold ? (
                <ReactECharts
                  option={financialBarOption}
                  style={{ width: "100%", height: "100%" }}
                  notMerge
                  lazyUpdate
                />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Chưa có dữ liệu tài chính.
                </div>
              )}
            </div>
          </ChartCard>

          <ChartCard
            title="Tương tác & phiên live"
            subtitle="Lượt xem, PCU, bình luận, thời gian xem TB"
          >
            <div className="h-72">
              {analysis.engagementOverview.totalViews ||
              analysis.engagementOverview.pcuPeak ||
              analysis.engagementOverview.totalComments ||
              analysis.engagementOverview.avgViewDurationSeconds ? (
                <ReactECharts
                  option={engagementBarOption}
                  style={{ width: "100%", height: "100%" }}
                  notMerge
                  lazyUpdate
                />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Chưa có dữ liệu tương tác.
                </div>
              )}
            </div>
          </ChartCard>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
            title="Thời lượng theo nền tảng"
            subtitle="Phân bố thời lượng xem/stream theo sàn"
          >
            <div className="h-80">
              {analysis.charts.durationByPlatform.length ? (
                <ReactECharts
                  option={durationByPlatformOption}
                  style={{ width: "100%", height: "100%" }}
                  notMerge
                  lazyUpdate
                />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Chưa có dữ liệu thời lượng.
                </div>
              )}
            </div>
          </ChartCard>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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

        <section className="grid grid-cols-1 xl:grid-cols-1 gap-6">
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
        </section>
      </div>
    </div>
  );
};

export default SuperAdminDashBoard;
