import { get, post } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";

const buildHistoryParams = ({
  page = 0,
  size = 10,
  search,
  startDate,
  endDate,
} = {}) => {
  const normalizedPage = Number(page);
  const normalizedSize = Number(size);
  const params = {
    page: Number.isFinite(normalizedPage) ? normalizedPage : 0,
    size: Number.isFinite(normalizedSize) ? normalizedSize : 10,
  };

  if (typeof search === "string" && search.trim()) {
    params.search = search.trim();
  }
  if (startDate) {
    params.startDate = startDate;
  }
  if (endDate) {
    params.endDate = endDate;
  }

  return params;
};

export const getAdminCourseHistory = async ({ signal, ...params } = {}) => {
  return await get({
    url: API_PATHS.COURSE.adminCourseHistory,
    params: buildHistoryParams(params),
    config: signal ? { signal } : undefined,
  });
};

export const confirmAdminCoursePurchase = async (
  purchasedCourseId,
  { signal } = {}
) => {
  if (!purchasedCourseId) {
    throw new Error("purchasedCourseId is required");
  }

  return await post({
    url: `${API_PATHS.COURSE.adminCourseConfirm}/${encodeURIComponent(
      purchasedCourseId
    )}`,
    data: {},
    config: signal ? { signal } : undefined,
  });
};

export default {
  getAdminCourseHistory,
  confirmAdminCoursePurchase,
};
