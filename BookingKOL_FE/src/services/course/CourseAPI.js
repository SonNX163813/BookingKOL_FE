import { get, patch, post } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";
const COURSE_LIST_ALLOWED_PARAMS = new Set([
  "name",
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

export const createCoursePurchase = async (
  coursePackageId,
  { phone, email, signal } = {}
) => {
  if (!coursePackageId) {
    throw new Error("coursePackageId is required");
  }
  const config = signal ? { signal } : undefined;
  const data = {};
  if (phone !== undefined) {
    data.phone = phone;
  }
  if (email !== undefined) {
    data.email = email;
  }
  const payload = await post({
    url: CLIENT_API_PATHS.COURSE.purchase(coursePackageId),
    data,
    config,
  });
  return payload?.data ?? null;
};

export const confirmCoursePurchase = async (purchaseId, { signal } = {}) => {
  if (!purchaseId) {
    throw new Error("purchaseId is required");
  }
  const config = signal ? { signal } : undefined;
  const payload = await post({
    url: CLIENT_API_PATHS.COURSE.confirmPurchase(purchaseId),
    data: {},
    config,
  });
  return payload?.data ?? null;
};

export const cancelCoursePurchase = async (purchaseId, { signal } = {}) => {
  if (!purchaseId) {
    throw new Error("purchaseId is required");
  }
  const config = signal ? { signal } : undefined;
  const payload = await patch({
    url: CLIENT_API_PATHS.COURSE.cancelPurchase(purchaseId),
    data: {},
    config,
  });
  return payload?.data ?? null;
};

const normalizeHistoryParams = ({
  page = 0,
  size = 10,
  search,
  startDate,
  endDate,
} = {}) => {
  const params = { page, size };
  if (search) {
    params.search = search;
  }
  if (startDate) {
    params.startDate = startDate;
  }
  if (endDate) {
    params.endDate = endDate;
  }
  return params;
};

export const getCoursePurchaseHistory = async ({
  signal,
  ...restParams
} = {}) => {
  const config = signal ? { signal } : undefined;
  return await get({
    url: CLIENT_API_PATHS.COURSE.history,
    params: normalizeHistoryParams(restParams),
    config,
  });
};

const normalizeMediaType = (usage) => {
  const file = usage?.file ?? {};
  const rawType = (file?.fileType || usage?.fileType || usage?.type || "")
    .toString()
    .toUpperCase();

  if (rawType.includes("VIDEO")) {
    return "VIDEO";
  }

  const contentType =
    file?.contentType ||
    file?.mimeType ||
    file?.mimetype ||
    file?.fileContentType ||
    "";

  if (
    typeof contentType === "string" &&
    contentType.toLowerCase().startsWith("video/")
  ) {
    return "VIDEO";
  }

  return "IMAGE";
};

export const adaptCourseMedia = (course) => {
  if (!Array.isArray(course?.fileUsageDtos)) {
    return { cover: null, gallery: [] };
  }

  const normalizedItems = course.fileUsageDtos
    .filter((usage) => usage?.isActive)
    .map((usage) => {
      const file = usage?.file ?? {};
      const url = file?.fileUrl;
      if (!url) {
        return null;
      }
      const type = normalizeMediaType(usage);
      return {
        id: usage?.id ?? file?.id ?? url,
        url,
        isCover: Boolean(usage?.isCover),
        name: file?.fileName ?? "",
        type,
        thumbnail: file?.thumbnailUrl ?? file?.previewUrl ?? null,
        contentType:
          file?.contentType ?? file?.mimeType ?? file?.mimetype ?? null,
      };
    })
    .filter(Boolean);

  const imageItems = normalizedItems.filter((item) => item.type !== "VIDEO");
  const videoItems = normalizedItems.filter((item) => item.type === "VIDEO");
  const gallery = [...imageItems, ...videoItems];

  const coverItem =
    gallery.find((item) => item.isCover) ?? imageItems[0] ?? gallery[0] ?? null;
  const cover = coverItem ? coverItem.url : null;

  return { cover, gallery };
};
export default {
  getCoursePackages,
  getCoursePackageById,
  adaptCourseMedia,
  createCoursePurchase,
  confirmCoursePurchase,
  cancelCoursePurchase,
  getCoursePurchaseHistory,
};
