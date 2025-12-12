import { get } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";

const ensureNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const normalizeWorkTime = (item = {}) => ({
  bookingId: item.bookingId ?? "",
  requestNumber: item.requestNumber ?? "",
  kolWorkTimeId: item.kolWorkTimeId ?? "",
  startAt: item.startAt ?? null,
  endAt: item.endAt ?? null,
  status: item.status ?? "",
});

const normalizeSummary = (payload = {}) => {
  const stats = payload.stats && typeof payload.stats === "object" ? payload.stats : {};
  const timeAndValue =
    payload.timeAndValue && typeof payload.timeAndValue === "object"
      ? payload.timeAndValue
      : {};
  const feedbackStats =
    payload.feedbackStats && typeof payload.feedbackStats === "object"
      ? payload.feedbackStats
      : {};

  return {
    stats: {
      totalWorkTimesCount: ensureNumber(stats.totalWorkTimesCount),
      completedWorkTimesCount: ensureNumber(stats.completedWorkTimesCount),
      recentWorkTimesCount: ensureNumber(stats.recentWorkTimesCount),
      upcomingWorkTimesCount: ensureNumber(stats.upcomingWorkTimesCount),
    },
    timeAndValue: {
      totalHoursAvailable: ensureNumber(timeAndValue.totalHoursAvailable),
      totalHoursCompleted: ensureNumber(timeAndValue.totalHoursCompleted),
      totalHoursUpcoming: ensureNumber(timeAndValue.totalHoursUpcoming),
      utilizationRate: ensureNumber(timeAndValue.utilizationRate),
      averageTimeAvailablePerDay: ensureNumber(
        timeAndValue.averageTimeAvailablePerDay
      ),
      averageWorkTimePerDay: ensureNumber(timeAndValue.averageWorkTimePerDay),
    },
    feedbackStats: {
      averageOverallRating: ensureNumber(feedbackStats.averageOverallRating),
      totalReviews: ensureNumber(feedbackStats.totalReviews),
      rehireRate: ensureNumber(feedbackStats.rehireRate),
      averageProfessionalismRating: ensureNumber(
        feedbackStats.averageProfessionalismRating
      ),
      averageCommunicationRating: ensureNumber(
        feedbackStats.averageCommunicationRating
      ),
      averageTimelineRating: ensureNumber(feedbackStats.averageTimelineRating),
      averageContentQualityRating: ensureNumber(
        feedbackStats.averageContentQualityRating
      ),
    },
    completedWorkTimes: ensureArray(payload.completedWorkTimes).map(
      normalizeWorkTime
    ),
    upcomingWorkTimes: ensureArray(payload.upcomingWorkTimes).map(
      normalizeWorkTime
    ),
    recentWorkTimes: ensureArray(payload.recentWorkTimes).map(normalizeWorkTime),
    timestamp: payload.timestamp ?? null,
  };
};

export const getKolDashboardSummary = async ({ signal } = {}) => {
  const payload = await get({
    url: API_PATHS.DASHBOARD.kolSummary,
    config: signal ? { signal } : undefined,
  });

  const dataContainer = payload?.data ?? payload ?? {};
  return normalizeSummary(dataContainer);
};
