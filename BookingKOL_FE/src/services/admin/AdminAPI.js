// src/services/admin/AdminAPI.js
import { get, post, patch, remove2, update } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";
import { useQuery } from "@tanstack/react-query";
const PATHS = API_PATHS.MANAGEMENT_USER;

/* ================== KOL CREATE (ADMIN) ================== */
export const adminCreateKol = async ({ fileAvatar, newKolDTO }) => {
  if (!fileAvatar) throw new Error("fileAvatar is required");
  if (!newKolDTO || typeof newKolDTO !== "object")
    throw new Error("newKolDTO object is required");

  const form = new FormData();
  form.append("fileAvatar", fileAvatar);

  const kolPayload = {
    ...newKolDTO,
    minBookingPrice:
      typeof newKolDTO.minBookingPrice === "number"
        ? newKolDTO.minBookingPrice
        : Number(newKolDTO.minBookingPrice ?? 0) || 0,
  };

  form.append(
    "newKolDTO",
    new Blob([JSON.stringify(kolPayload)], {
      type: "application/json",
    })
  );

  const payload = await post({
    url: PATHS.adminKolCreate,
    data: form,
    config: {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  });

  return payload?.data ?? payload ?? null;
};

const PATH = API_PATHS.MANAGEMENT_COURSE_LIST || "/v1/admin/course";

/* ================== KOL LIST (ADMIN) ================== */
const ADMIN_KOL_LIST_ALLOWED_PARAMS = new Set([
  "page",
  "size",
  "minBookingPrice",
  "minRating",
  "isAvailable",
  "search",
]);
const ADMIN_KOL_LIST_DEFAULT_PARAMS = { page: 0, size: 20 };

const toBool = (v) => {
  if (v === true || v === "true" || v === 1 || v === "1") return true;
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return undefined;
};

const buildAdminKolListParams = (params = {}) => {
  const merged = { ...ADMIN_KOL_LIST_DEFAULT_PARAMS, ...(params ?? {}) };
  return Object.entries(merged).reduce((acc, [key, value]) => {
    const skip =
      !ADMIN_KOL_LIST_ALLOWED_PARAMS.has(key) ||
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "");
    if (skip) return acc;

    if (key === "isAvailable") {
      const b = toBool(value);
      if (b === undefined) return acc; // không phải boolean -> bỏ
      acc[key] = b;
      return acc;
    }

    if (key === "minBookingPrice" || key === "minRating") {
      const n = Number(value);
      if (Number.isFinite(n)) acc[key] = n;
      return acc;
    }

    acc[key] = value; // search giữ nguyên string
    return acc;
  }, {});
};

export const adminGetKols = async ({ signal, params } = {}) => {
  const payload = await get({
    url: PATHS.managementKOL, // "/v1/admin/kol/all"
    params: buildAdminKolListParams(params),
    config: signal ? { signal } : undefined,
  });
  const data = payload?.data ?? payload;
  const content = Array.isArray(data?.content)
    ? data.content
    : Array.isArray(data)
    ? data
    : [];
  return { ...(typeof data === "object" ? data : {}), content };
};

/* ==== NEW: Lấy KOL theo category (FE sẽ tự lọc thêm theo tên/giá/rating) ==== */
const KOL_CATEGORY_BASE = "/v1/kol-profiles/category"; // axios-config sẽ tự thêm '/api' nếu có

export const adminGetKolsByCategory = async (
  categoryId,
  { page, size, signal } = {}
) => {
  if (!categoryId) throw new Error("categoryId is required");
  const payload = await get({
    url: `${KOL_CATEGORY_BASE}/${encodeURIComponent(categoryId)}`,
    // Nếu BE có hỗ trợ page/size thì truyền; nếu không có, axios sẽ gửi nhưng BE ignore cũng không sao
    params:
      Number.isFinite(page) && Number.isFinite(size)
        ? { page, size }
        : undefined,
    config: signal ? { signal } : undefined,
  });
  const data = payload?.data ?? payload;
  // Trả về mảng thuần cho dễ dùng
  return Array.isArray(data?.content)
    ? data.content
    : Array.isArray(data)
    ? data
    : [];
};

/* ================== KOL DETAIL (ADMIN) ================== */
export const adminGetKolDetail = async (kolId, { signal } = {}) => {
  if (!kolId) throw new Error("kolId is required");
  const payload = await get({
    url: `${PATHS.adminViewProfileUser}/${encodeURIComponent(kolId)}`,
    config: signal ? { signal } : undefined,
  });
  return payload?.data ?? payload ?? null;
};

/* ================== BRANDS LIST (ADMIN) ================== */
const ADMIN_BRAND_LIST_ALLOWED_PARAMS = new Set(["page", "size", "search"]);
const ADMIN_BRAND_LIST_DEFAULT_PARAMS = { page: 0, size: 20 };

const buildAdminBrandListParams = (params = {}) => {
  const merged = { ...ADMIN_BRAND_LIST_DEFAULT_PARAMS, ...(params ?? {}) };
  return Object.entries(merged).reduce((acc, [key, value]) => {
    const skip =
      !ADMIN_BRAND_LIST_ALLOWED_PARAMS.has(key) ||
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "");
    if (!skip) acc[key] = value;
    return acc;
  }, {});
};

export const adminGetBrands = async ({ signal, params } = {}) => {
  const payload = await get({
    url: PATHS.managementBrands,
    params: buildAdminBrandListParams(params),
    config: signal ? { signal } : undefined,
  });
  const data = payload?.data ?? payload;
  const content = Array.isArray(data?.content)
    ? data.content
    : Array.isArray(data)
    ? data
    : [];
  return { ...(typeof data === "object" ? data : {}), content };
};

/* ================== ACCOUNT STATUS (ADMIN) ================== */
export const adminPatchAccountStatus = async ({ id, status }) => {
  if (!id) throw new Error("id is required");
  const payload = await patch({
    url: `${PATHS.adminUpdateStatusAccount}/${encodeURIComponent(id)}/status`,
    data: { status },
  });
  return payload?.data ?? payload ?? null;
};

/* ================== KOL CATEGORY (ADMIN) ================== */
export const adminAddKolCategory = async (
  kolId,
  categoryId,
  { signal } = {}
) => {
  if (!kolId) throw new Error("kolId is required");
  if (!categoryId) throw new Error("categoryId is required");
  const url = `${PATHS.adminKolCategoryAdd}/${encodeURIComponent(kolId)}`;
  const payload = await post({
    url,
    data: null,
    config: { params: { categoryId }, ...(signal ? { signal } : {}) },
  });
  return payload?.data ?? payload ?? null;
};

export const adminRemoveKolCategory = async (
  kolId,
  categoryId,
  { signal } = {}
) => {
  if (!kolId) throw new Error("kolId is required");
  if (!categoryId) throw new Error("categoryId is required");
  const url = `${PATHS.adminKolCategoryRemove}/${encodeURIComponent(kolId)}`;
  const payload = await remove2({
    url,
    data: null,
    config: { params: { categoryId }, ...(signal ? { signal } : {}) },
  });
  return payload?.data ?? payload ?? null;
};

/* ================== KOL MEDIAS (ADMIN) ================== */
export const adminGetKolMediasAll = async (kolId, { signal } = {}) => {
  if (!kolId) throw new Error("kolId is required");
  const payload = await get({
    url: `${PATHS.adminKolMediasAll}/${encodeURIComponent(kolId)}`,
    config: signal ? { signal } : undefined,
  });
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.content) ? data.content : [];
};

export const adminUploadKolMedias = async (kolId, files, opts = {}) => {
  if (!kolId) throw new Error("kolId is required");
  const { onUploadProgress, signal, fileType, isCover, targetType } = opts;
  const form = new FormData();
  (Array.isArray(files) ? files : [files]).forEach(
    (f) => f && form.append("files", f)
  );
  if (fileType) form.append("fileType", fileType);
  if (typeof isCover === "boolean") form.append("isCover", String(isCover));
  if (targetType) form.append("targetType", targetType);

  const payload = await post({
    url: `${PATHS.adminKolMediasUpload}/${encodeURIComponent(kolId)}`,
    data: form,
    config: {
      signal,
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    },
  });
  return payload?.data ?? payload ?? null;
};

export const adminDeleteKolMedia = async (fileId, { signal } = {}) => {
  if (!fileId) throw new Error("fileId is required");
  const payload = await patch({
    url: `${PATHS.adminKolMediaDelete}/${encodeURIComponent(fileId)}`,
    data: null,
    config: signal ? { signal } : undefined,
  });
  return payload?.data ?? payload ?? null;
};

export const adminSetCoverImage = async (kolId, fileId, { signal } = {}) => {
  if (!kolId || !fileId) throw new Error("kolId & fileId are required");
  const payload = await update({
    url: `${PATHS.adminKolCoverChange}/${encodeURIComponent(kolId)}`,
    data: null,
    config: { params: { fileId }, ...(signal ? { signal } : {}) },
  });
  return payload?.data ?? payload ?? null;
};

/* ================== UPDATE KOL PROFILE (ADMIN) ================== */
const ADMIN_KOL_UPDATE_ALLOWED_FIELDS = new Set([
  "displayName",
  "dob",
  "experience",
  "role",
  "city",
  "country",
  "bio",
  "minBookingPrice",
  "isAvailable",
]);
const buildAdminKolUpdatePayload = (body = {}) =>
  Object.fromEntries(
    Object.entries(body).filter(
      ([k, v]) => ADMIN_KOL_UPDATE_ALLOWED_FIELDS.has(k) && v !== undefined
    )
  );

export const adminUpdateKolProfile = async (kolId, body, { signal } = {}) => {
  if (!kolId) throw new Error("kolId is required");
  const data = buildAdminKolUpdatePayload(body);
  const payload = await update({
    url: `${PATHS.adminKolUpdate}/${encodeURIComponent(kolId)}`,
    data,
    config: signal ? { signal } : undefined,
  });
  return payload?.data ?? payload ?? null;
};

/* ===================================================================
 *                         COURSE (ADMIN)
 * =================================================================== */

// PUT /v1/admin/course/update/{courseId}
export const adminCourseUpdate = async (courseId, body, { signal } = {}) => {
  if (!courseId) throw new Error("courseId is required");
  const payload = await update({
    url: `${API_PATHS.COURSE.adminCourseUpdate}/${encodeURIComponent(
      courseId
    )}`,
    data: body,
    config: signal ? { signal } : undefined,
  });
  return payload?.data ?? payload ?? null;
};

// DELETE /v1/admin/course/delete/{courseId}
export const adminCourseDelete = async (courseId, { signal } = {}) => {
  if (!courseId) throw new Error("courseId is required");
  const payload = await remove2({
    url: `${API_PATHS.COURSE.adminCourseDelete}/${encodeURIComponent(
      courseId
    )}`,
    config: signal ? { signal } : undefined,
  });
  return payload?.data ?? payload ?? null;
};

// POST /v1/admin/course/medias/upload/{courseId}
export const adminCourseMediasUpload = async (courseId, files, opts = {}) => {
  if (!courseId) throw new Error("courseId is required");
  const { onUploadProgress, signal, fileType, isCover } = opts;

  const form = new FormData();
  (Array.isArray(files) ? files : [files]).forEach(
    (f) => f && form.append("files", f)
  );
  if (fileType) form.append("fileType", fileType); // "IMAGE" | "VIDEO"
  if (typeof isCover === "boolean") form.append("isCover", String(isCover));

  const payload = await post({
    url: `${API_PATHS.COURSE.adminCourseMediasUpload}/${encodeURIComponent(
      courseId
    )}`,
    data: form,
    config: {
      signal,
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    },
  });
  return payload?.data ?? payload ?? null;
};

// PUT /v1/admin/course/medias/remove/{courseId}?fileUsageIds=...
export const adminRemoveCourseMedias = async (
  courseId,
  fileUsageIds,
  { signal } = {}
) => {
  if (!courseId) throw new Error("courseId is required");
  const ids = (
    Array.isArray(fileUsageIds) ? fileUsageIds : [fileUsageIds]
  ).filter(Boolean);
  if (!ids.length) throw new Error("fileUsageIds is required");

  const payload = await update({
    url: `${API_PATHS.COURSE.adminCourseMediasRemove}/${encodeURIComponent(
      courseId
    )}`,
    data: null,
    config: {
      signal,
      params: { fileUsageIds: ids },
      paramsSerializer: (params) => {
        const usp = new URLSearchParams();
        (params.fileUsageIds || []).forEach((v) =>
          usp.append("fileUsageIds", v)
        );
        return usp.toString();
      },
    },
  });
  return payload?.data ?? payload ?? null;
};

export const adminCourseSetCoverImage = async (
  courseId,
  fileId,
  { signal } = {}
) => {
  if (!courseId || !fileId) throw new Error("courseId & fileId are required");
  const payload = await update({
    url: `${API_PATHS.COURSE.adminCourseCoverImageSet}/${encodeURIComponent(
      courseId
    )}`,
    data: null,
    config: { params: { fileId }, ...(signal ? { signal } : {}) },
  });
  return payload?.data ?? payload ?? null;
};

export const useGetAllCourse = (
  page = 0,
  size = 20,
  minPrice,
  maxPrice,
  isAvailable, // boolean | undefined
  search
) => {
  return useQuery({
    queryKey: [
      "admin-courses",
      { page, size, minPrice, maxPrice, isAvailable, search },
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", page);
      params.set("size", size);
      if (minPrice != null && minPrice !== "") params.set("minPrice", minPrice);
      if (maxPrice != null && maxPrice !== "") params.set("maxPrice", maxPrice);
      if (typeof isAvailable === "boolean")
        params.set("isAvailable", String(isAvailable));
      if (search) params.set("search", search);

      const { data } = await get(`${PATH}?${params.toString()}`);
      return data;
    },
    keepPreviousData: true,
  });
};
