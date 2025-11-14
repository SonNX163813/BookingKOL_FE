import { get } from "../../config/axios-config";
import { API_PATHS_SUPERADMIN } from "../../constants/apiPathSuperAdmin";

const ensureNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const normalizeStats = (stats) => {
  const defaults = {
    totalBookings: 0,
    completedBookings: 0,
    inProgressBookings: 0,
    totalRevenue: 0,
    earnedRevenue: 0,
    pendingRevenue: 0,
    cancelledLoss: 0,
  };

  if (!stats || typeof stats !== "object") return defaults;

  return Object.entries(defaults).reduce(
    (acc, [key]) => ({
      ...acc,
      [key]: ensureNumber(stats[key]),
    }),
    defaults
  );
};

const normalizeList = (list, mapper) => ensureArray(list).map(mapper);

const normalizeSummary = (rawData) => {
  const summary = rawData && typeof rawData === "object" ? rawData : {};

  return {
    stats: normalizeStats(summary.stats),
    revenueChart: normalizeList(summary.revenueChart, (item = {}) => ({
      label: item.label ?? "",
      value: ensureNumber(item.value),
      percentage: ensureNumber(item.percentage),
    })),
    statusContractBreakdown: normalizeList(
      summary.statusContractBreakdown,
      (item = {}) => ({
        label: item.label ?? "",
        value: ensureNumber(item.value),
        percentage: ensureNumber(item.percentage),
      })
    ),
    upcomingBookingRequests: ensureArray(summary.upcomingBookingRequests),
    recentBookingRequests: ensureArray(summary.recentBookingRequests),
    topKolsByBookings: normalizeList(
      summary.topKolsByBookings,
      (item = {}) => ({
        bookingCount: ensureNumber(item.bookingCount),
        kolName: item.kolName ?? "",
        kolId: item.kolId ?? "",
      })
    ),
    topKolsByRevenue: normalizeList(summary.topKolsByRevenue, (item = {}) => ({
      totalRevenue: ensureNumber(item.totalRevenue),
      kolName: item.kolName ?? "",
      kolId: item.kolId ?? "",
    })),
    statusDistribution: ensureArray(summary.statusDistribution),
    platformDistribution: ensureArray(summary.platformDistribution),
    bookingTrend: normalizeList(summary.bookingTrend, (item = {}) => ({
      count: ensureNumber(item.count),
      year: ensureNumber(item.year),
      month: ensureNumber(item.month),
    })),
    revenueOverview:
      summary.revenueOverview && typeof summary.revenueOverview === "object"
        ? {
            totalRevenue: ensureNumber(summary.revenueOverview.totalRevenue),
            totalPurchases: ensureNumber(
              summary.revenueOverview.totalPurchases
            ),
            uniqueUsers: ensureNumber(summary.revenueOverview.uniqueUsers),
            notAssignedPurchase: ensureNumber(
              summary.revenueOverview.notAssignedPurchase
            ),
          }
        : {
            totalRevenue: 0,
            totalPurchases: 0,
            uniqueUsers: 0,
            notAssignedPurchase: 0,
          },
    courseRevenue: normalizeList(summary.courseRevenue, (item = {}) => ({
      courseName: item.courseName ?? "",
      totalSales: ensureNumber(item.totalSales),
      totalRevenue: ensureNumber(item.totalRevenue),
    })),
    revenueByDate: normalizeList(summary.revenueByDate, (item = {}) => ({
      totalRevenue: ensureNumber(item.totalRevenue),
      date: item.date ?? "",
    })),
  };
};

export const getSuperAdminDashboardSummary = async ({ signal } = {}) => {
  const payload = await get({
    url: API_PATHS_SUPERADMIN.DASHBOARD.superAdminSummary,
    config: signal ? { signal } : undefined,
  });

  const dataContainer = payload?.data ?? payload ?? {};
  const summaryPayload =
    dataContainer && typeof dataContainer === "object" && dataContainer.data
      ? dataContainer.data
      : dataContainer;

  return normalizeSummary(summaryPayload);
};
