import { get } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";
const COURSE_LIST_ALLOWED_PARAMS = new Set([
  "minPrice",
  "maxPrice",
  "minDiscount",
  "maxDiscount",
  "page",
  "size",
  "sortBy",
  "sortDir",
]);
const COURSE_LIST_DEFAULT_PARAMS = {
  page: 0,
  size: 10,
  sortBy: "price",
  sortDir: "asc",
};
const buildCourseListParams = (params = {}) => {
  const mergedParams = {
    ...COURSE_LIST_DEFAULT_PARAMS,
    ...(params ?? {}),
  };
  return Object.entries(mergedParams).reduce((accumulator, [key, value]) => {
    if (!COURSE_LIST_ALLOWED_PARAMS.has(key)) {
      return accumulator;
    }
    if (value === undefined || value === null || value === "") {
      return accumulator;
    }
    accumulator[key] = value;
    return accumulator;
  }, {});
};
export const getCoursePackages = async ({ signal, params } = {}) => {
  const config = signal ? { signal } : undefined;
  const payload = await get({
    url: CLIENT_API_PATHS.COURSE.getAll,
    params: buildCourseListParams(params),
    config,
  });
  const data = payload?.data;
  if (!data) {
    return { content: [] };
  }
  const content = Array.isArray(data.content) ? data.content : [];
  return { ...data, content };
};

export const getCoursePackageById = async (courseId, { signal } = {}) => {
  if (!courseId) {
    throw new Error("courseId is required");
  }
  const config = signal ? { signal } : undefined;
  const payload = await get({
    url: `${CLIENT_API_PATHS.COURSE.getDetail}/${courseId}`,
    config,
  });
  return payload?.data ?? null;
};

export const adaptCourseMedia = (course) => {
  if (!Array.isArray(course?.fileUsageDtos)) {
    return { cover: null, gallery: [] };
  }
  const gallery = course.fileUsageDtos
    .map((usage) => {
      const file = usage?.file ?? {};
      const url = file?.fileUrl;
      if (!url) {
        return null;
      }
      return {
        id: usage?.id ?? file?.id ?? url,
        url,
        isCover: Boolean(usage?.isCover),
        name: file?.fileName ?? "",
      };
    })
    .filter(Boolean);
  const cover =
    gallery.find((item) => item.isCover)?.url ?? gallery[0]?.url ?? null;
  return { cover, gallery };
};
export default {
  getCoursePackages,
  getCoursePackageById,
  adaptCourseMedia,
};
