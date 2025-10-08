import { BASE_URL } from "../../utils/config";

const COURSE_BASE = `${BASE_URL}/courses`;
const COURSE_LIST_ENDPOINT = `${COURSE_BASE}/all`;
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

const parseJsonSafely = async (response) => {
  const rawText = await response.text();

  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch (error) {
    console.error("Failed to parse Course API response", error);
    throw new Error("Failed to parse server response");
  }
};

const ensureSuccess = async (response) => {
  if (response.ok) {
    return response;
  }

  let message = `Request failed with status ${response.status}`;

  try {
    const payload = await parseJsonSafely(response);
    const payloadMessage = Array.isArray(payload?.message)
      ? payload.message.join(" ")
      : payload?.message;

    if (payloadMessage) {
      message = payloadMessage;
    }
  } catch (error) {
    console.error("Failed to read course error payload", error);
  }

  throw new Error(message);
};

const buildCourseListUrl = (params = {}) => {
  const searchParams = new URLSearchParams();
  const mergedParams = {
    ...COURSE_LIST_DEFAULT_PARAMS,
    ...params,
  };

  Object.entries(mergedParams).forEach(([key, value]) => {
    if (!COURSE_LIST_ALLOWED_PARAMS.has(key)) {
      return;
    }

    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, value);
  });

  const queryString = searchParams.toString();
  return queryString
    ? `${COURSE_LIST_ENDPOINT}?${queryString}`
    : COURSE_LIST_ENDPOINT;
};

export const getCoursePackages = async ({ signal, params } = {}) => {
  const response = await fetch(buildCourseListUrl(params), { signal });
  await ensureSuccess(response);

  const payload = await parseJsonSafely(response);
  const { data } = payload ?? {};

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

  const response = await fetch(`${COURSE_BASE}/${courseId}`, { signal });
  await ensureSuccess(response);

  const payload = await parseJsonSafely(response);
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
