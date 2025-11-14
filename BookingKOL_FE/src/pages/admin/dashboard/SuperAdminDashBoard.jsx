import { useMemo } from "react";
import dayjs from "dayjs";
import { ReloadOutlined } from "@ant-design/icons";
import ReactECharts from "echarts-for-react";
import useSuperAdminDashboardSummary from "../../../hook/superadmin/dashboard/useAdminDashboardSummary";
import { BOOKING_STATUS_LABEL } from "../../../constants/mySingleBookingStatuses";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const formatCurrency = (value) => currencyFormatter.format(value || 0);
const formatInteger = (value) =>
  Number.isFinite(value) ? value.toLocaleString("vi-VN") : "0";

const formatDateLabel = (value) =>
  dayjs(value).isValid() ? dayjs(value).format("DD/MM") : value || "--";

const formatFullDate = (value) =>
  dayjs(value).isValid() ? dayjs(value).format("DD/MM/YYYY HH:mm") : "--";

const formatBookingRange = (startAt, endAt) => {
  const start = formatFullDate(startAt);
  const end = dayjs(endAt).isValid()
    ? dayjs(endAt).format("HH:mm, DD/MM")
    : undefined;
  return end ? `${start} -> ${end}` : start;
};

const bookingStatusClass = (status) => {
  switch (status) {
    case "PAID":
      return "bg-emerald-100 text-emerald-700";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-700";
    case "CANCELLED":
      return "bg-rose-100 text-rose-700";
    case "WAIT_FOR_REFUND":
      return "bg-sky-100 text-sky-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

const normalizeStatusKey = (status) =>
  status ? status.toString().trim().toUpperCase() : "";

const formatStatusLabel = (status) => {
  const key = normalizeStatusKey(status);
  if (!key) return "N/A";
  return BOOKING_STATUS_LABEL[key] || key;
};

const PIE_COLORS = [
  "#4f46e5",
  "#0ea5e9",
  "#f59e0b",
  "#10b981",
  "#ec4899",
  "#9333ea",
  "#14b8a6",
];

const STAT_CARDS = [
  { key: "totalBookings", label: "Tổng số booking", type: "number" },
  { key: "completedBookings", label: "Đã hoàn thành", type: "number" },
  { key: "inProgressBookings", label: "Đang xử lý", type: "number" },
  { key: "totalRevenue", label: "Tổng doanh thu", type: "currency" },
  { key: "earnedRevenue", label: "Đã ghi nhận", type: "currency" },
  { key: "pendingRevenue", label: "Doanh thu chờ", type: "currency" },
  { key: "cancelledLoss", label: "Tổn thất do huỷ", type: "currency" },
];

const EMPTY_SUMMARY = {
  stats: STAT_CARDS.reduce(
    (acc, card) => ({ ...acc, [card.key]: 0 }),
    Object.create(null)
  ),
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
};

const DashboardSkeleton = () => (
  <div className="flex flex-col gap-6 p-6 animate-pulse">
    <div className="flex flex-col gap-2">
      <div className="h-8 w-64 bg-slate-100 rounded-lg" />
      <div className="h-5 w-80 bg-slate-100 rounded" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 7 }).map((_, idx) => (
        <div
          key={`stat-skeleton-${idx}`}
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

const TopKolList = ({ title, items, valueKey, valueFormatter }) => (
  <div className="bg-white rounded-2xl border border-slate-100 p-5 flex-1 min-w-[240px]">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <span className="text-sm text-slate-500">{items.length} KOL</span>
    </div>
    <div className="space-y-4">
      {items.length ? (
        items.map((item, index) => (
          <div
            key={item.kolId || item.kolName || index}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-semibold">
                {index + 1}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-slate-900 truncate">
                  {item.kolName || "Không rõ"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {item.kolId?.slice(0, 8) ?? "—"}
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold text-slate-900">
              {valueFormatter(item[valueKey])}
            </span>
          </div>
        ))
      ) : (
        <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
      )}
    </div>
  </div>
);

const SectionTitle = ({ title, subtitle }) => (
  <div>
    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
    {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
  </div>
);

const SuperAdminDashBoard = () => {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useSuperAdminDashboardSummary();

  const summary = data ?? EMPTY_SUMMARY;

  const revenueSeries = useMemo(
    () =>
      summary.revenueChart.map((item, idx) => ({
        ...item,
        label: item.label ? formatDateLabel(item.label) : `Ngày ${idx + 1}`,
      })),
    [summary.revenueChart]
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

  const courseRevenueData = summary.courseRevenue.map((item) => ({
    ...item,
    courseName: item.courseName || "Không rõ",
  }));

  const overviewCards = [
    {
      label: "Doanh thu khoá học",
      value: summary.revenueOverview.totalRevenue,
      type: "currency",
    },
    {
      label: "Số giao dịch",
      value: summary.revenueOverview.totalPurchases,
      type: "number",
    },
    {
      label: "Người mua duy nhất",
      value: summary.revenueOverview.uniqueUsers,
      type: "number",
    },
    {
      label: "Đơn chưa gán KOL",
      value: summary.revenueOverview.notAssignedPurchase,
      type: "number",
    },
  ];

  const revenueOption = useMemo(() => {
    const labels = revenueSeries.map((item) => item.label);
    const values = revenueSeries.map((item) => item.value);

    return {
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      tooltip: {
        trigger: "axis",
        formatter: (params = []) => {
          const [point] = Array.isArray(params) ? params : [params];
          if (!point) return "";
          const val = Array.isArray(point.value)
            ? point.value.at(-1)
            : point.value;
          return `${point.axisValueLabel}<br/>${formatCurrency(val)}`;
        },
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: labels,
        axisLabel: { color: "#64748b" },
        axisLine: { lineStyle: { color: "#cbd5f5" } },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: "#64748b",
          formatter: (value) => `${Math.round(value / 1000)}k`,
        },
        splitLine: { lineStyle: { type: "dashed", color: "#e2e8f0" } },
      },
      series: [
        {
          name: "Doanh thu",
          type: "line",
          smooth: true,
          symbolSize: 8,
          lineStyle: { color: "#4f46e5", width: 3 },
          areaStyle: { color: "rgba(79, 70, 229, 0.18)" },
          itemStyle: { color: "#4f46e5" },
          data: values,
        },
      ],
    };
  }, [revenueSeries]);

  const totalStatusContracts = useMemo(
    () => statusPieData.reduce((sum, item) => sum + item.value, 0),
    [statusPieData]
  );

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
      // graphic: [
      //   {
      //     type: "text",
      //     left: "center",
      //     top: "center",
      //     style: {
      //       text: `${formatInteger(totalStatusContracts)}\nTong so`,
      //       textAlign: "center",
      //       fill: "#0f172a",
      //       fontWeight: 700,
      //       fontSize: 16,
      //     },
      //   },
      // ],
      series: [
        {
          name: "Trạng thái hợp đồng",
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: true,
          label: { formatter: "{b}\n{d}%", fontSize: 12 },
          labelLine: { smooth: true },
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
  const courseRevenueOption = useMemo(
    () => ({
      grid: { left: 120, right: 20, top: 20, bottom: 20 },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: ({ 0: point }) =>
          point ? `${point.name}<br/>${formatCurrency(point.value)}` : "",
      },
      xAxis: {
        type: "value",
        axisLabel: {
          color: "#64748b",
          formatter: (value) => `${Math.round(value / 1000)}k`,
        },
        splitLine: { lineStyle: { type: "dashed", color: "#e2e8f0" } },
      },
      yAxis: {
        type: "category",
        data: courseRevenueData.map((item) => item.courseName),
        axisLabel: { color: "#475569" },
      },
      series: [
        {
          type: "bar",
          data: courseRevenueData.map((item) => item.totalRevenue),
          barWidth: 18,
          itemStyle: {
            color: "#0ea5e9",
            borderRadius: [6, 6, 6, 6],
          },
        },
      ],
    }),
    [courseRevenueData]
  );

  const showSkeleton = isLoading && !data;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-xl font-semibold text-rose-500">
          Không thể tải dữ liệu Dashboard
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
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-indigo-500 font-semibold">
            Báo cáo tổng quan
          </p>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">
            Dashboard quản trị viên
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Dữ liệu mới nhất từ hệ thống Nexus Social.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-sm font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-600 transition"
          disabled={isFetching}
        >
          <ReloadOutlined className={isFetching ? "animate-spin" : undefined} />
          Làm mới
        </button>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col gap-2"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="text-3xl font-semibold text-slate-900">
              {card.type === "currency"
                ? formatCurrency(summary.stats[card.key])
                : formatInteger(summary.stats[card.key])}
            </p>
          </div>
        ))}
      </section>

      <section className=" gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 xl:col-span-2">
          <SectionTitle
            title="Biểu đồ doanh thu"
            subtitle="Tổng hợp doanh thu theo ngày"
          />
          <div className="h-80 mt-4">
            {revenueSeries.length ? (
              <ReactECharts
                option={revenueOption}
                style={{ width: "100%", height: "100%" }}
                notMerge
                lazyUpdate
              />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Chưa có dữ liệu biểu đồ.
              </div>
            )}
          </div>
        </div>
      </section>
      <section className="gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <SectionTitle
            title="Trạng thái hợp đồng"
            subtitle="Phân bổ theo trạng thái"
          />
          <div className="h-80 mt-4">
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
        </div>
      </section>
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 xl:col-span-2">
          <SectionTitle
            title="Lịch booking sắp tới"
            subtitle="Theo múi giờ hệ thống"
          />
          <div className="mt-4 divide-y divide-slate-100">
            {summary.upcomingBookingRequests.length ? (
              summary.upcomingBookingRequests.map((booking) => (
                <div
                  key={booking.bookingId}
                  className="py-4 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {booking.clientName || "Khách lẻ"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {booking.location || "Không rõ địa điểm"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatBookingRange(booking.startAt, booking.endAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${bookingStatusClass(
                        booking.status
                      )}`}
                    >
                      {formatStatusLabel(booking.status)}
                    </span>
                    <p className="text-xs text-slate-400">
                      {booking.requestNumber || booking.bookingId}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-10">
                Chưa có yêu cầu booking mới.
              </p>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <SectionTitle
            title="Hoạt động gần đây"
            subtitle="Các booking mới nhất"
          />
          <div className="mt-4 space-y-4">
            {summary.recentBookingRequests.length ? (
              summary.recentBookingRequests.map((booking) => (
                <div
                  key={booking.bookingId}
                  className="border border-slate-100 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">
                      {booking.clientName || "Khách lẻ"}
                    </p>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${bookingStatusClass(
                        booking.status
                      )}`}
                    >
                      {formatStatusLabel(booking.status)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    {booking.location || "Không rõ địa điểm"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatBookingRange(booking.startAt, booking.endAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-12">
                Chưa có hoạt động mới.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="flex flex-col gap-4 xl:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {overviewCards.map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-2xl border border-slate-100 p-4"
              >
                <p className="text-sm text-slate-500">{card.label}</p>
                <p className="text-2xl font-semibold text-slate-900 mt-2">
                  {card.type === "currency"
                    ? formatCurrency(card.value)
                    : formatInteger(card.value)}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <SectionTitle
              title="Doanh thu theo khoá học"
              subtitle="Top khoá học mang lại doanh thu"
            />
            <div className="h-72 mt-6">
              {courseRevenueData.length ? (
                <ReactECharts
                  option={courseRevenueOption}
                  style={{ width: "100%", height: "100%" }}
                  notMerge
                  lazyUpdate
                />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  Chưa có số liệu doanh thu khoá học.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <TopKolList
            title="Top KOL theo lượt booking"
            items={summary.topKolsByBookings}
            valueKey="bookingCount"
            valueFormatter={(value) => `${formatInteger(value)} lượt`}
          />
          <TopKolList
            title="Top KOL theo doanh thu"
            items={summary.topKolsByRevenue}
            valueKey="totalRevenue"
            valueFormatter={(value) => formatCurrency(value)}
          />
        </div>
      </section>
    </div>
  );
};

export default SuperAdminDashBoard;
