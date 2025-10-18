import { get, post, remove, remove2, update } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

// ================== GIỮ NGUYÊN CŨ ==================
const KOL_LIST_ALLOWED_PARAMS = new Set([
  "minRating",
  "categoryId",
  "minPrice",
  "page",
  "size",
]);

const KOL_LIST_DEFAULT_PARAMS = { page: 0, size: 10 };

const buildKolListParams = (params = {}) => {
  const mergedParams = { ...KOL_LIST_DEFAULT_PARAMS, ...(params ?? {}) };
  return Object.entries(mergedParams).reduce((acc, [key, value]) => {
    if (!KOL_LIST_ALLOWED_PARAMS.has(key)) return acc;
    const skip =
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "");
    if (!skip) acc[key] = value;
    return acc;
  }, {});
};

export const getKolProfiles = async ({ signal, params } = {}) => {
  const config = signal ? { signal } : undefined;
  const payload = await get({
    url: CLIENT_API_PATHS.KOL.getAllAvailable,
    params: buildKolListParams(params),
    config,
  });
  const data = payload?.data;
  if (!data) return { content: [] };
  const content = Array.isArray(data.content) ? data.content : [];
  return { ...data, content };
};

export const getKolProfileById = async (kolId, { signal } = {}) => {
  if (!kolId) throw new Error("kolId is required");
  const config = signal ? { signal } : undefined;
  const payload = await get({
    url: `${CLIENT_API_PATHS.KOL.getDetailByKolId}/${kolId}`,
    config,
  });
  return payload?.data ?? null;
};
// ====================================================

// ===== NEW: chỉ định rõ các field cho phép update (KHÔNG có giá) =====
const KOL_UPDATE_ALLOWED_FIELDS = new Set([
  "displayName",
  "dob",
  "experience",
  "role",
  "city",
  "country",
  "bio",
  // nếu BE cho phép cập nhật list chuỗi: điểm mạnh, nền tảng, v.v.
  "strengths", // array<string>
  "platformProficiency", // array<object> (nếu bạn cần)
  "categories", // array<{id|name...}> (tuỳ BE)
  "avatarUrl", // nếu BE cho phép đổi metadata, KHÔNG upload file
  // … thêm field nào BE cho phép, nhưng KHÔNG thêm giá
]);

const buildUpdatePayload = (body = {}) => {
  const cleaned = {};
  Object.entries(body).forEach(([k, v]) => {
    if (!KOL_UPDATE_ALLOWED_FIELDS.has(k)) return; // bỏ hết field lạ
    if (v === undefined) return;
    // chuẩn hoá mảng: nếu BE mong đợi [], đừng gửi null
    if (Array.isArray(v)) cleaned[k] = v.filter((x) => x != null);
    else cleaned[k] = v;
  });
  return cleaned;
};

/**
 * Update hồ sơ KOL của chính user đang đăng nhập.
 * KHÔNG gửi các trường giá (minBookingPrice, rateCard...) – đã loại bằng buildUpdatePayload.
 */
export const updateMyKolProfile = async (body, { signal } = {}) => {
  const config = signal ? { signal } : undefined;
  const payload = await update({
    url: CLIENT_API_PATHS.KOL.updateMyProfile, // -> /api/v1/kol/profile/update
    data: buildUpdatePayload(body),
    config,
  });
  return payload?.data ?? null;
};
export const getKolProfileByUserId = async (userId, { signal } = {}) => {
  if (!userId) throw new Error("userId is required");

  const config = signal ? { signal } : undefined;
  const payload = await get({
    url: `${CLIENT_API_PATHS.KOL.getDetailByUserId}/${userId}`,
    config,
  });

  return payload?.data ?? null;
};

export const uploadKolMedias = async (files, opts = {}) => {
  const { onUploadProgress, signal, fileType, isCover, targetType } = opts;
  const form = new FormData();

  if (Array.isArray(files)) files.forEach((f) => f && form.append("files", f));
  else if (files) form.append("files", files);

  // Nếu BE yêu cầu thêm metadata
  if (fileType) form.append("fileType", fileType); // "IMAGE" | "VIDEO" (nếu cần)
  if (typeof isCover === "boolean") form.append("isCover", String(isCover));
  if (targetType) form.append("targetType", targetType); // "PORTFOLIO" | ...

  return await post({
    url: CLIENT_API_PATHS.KOL.medias.upload, // /v1/kol/medias/upload
    data: form,
    config: {
      signal,
      headers: { "Content-Type": "multipart/form-data" }, // override JSON
      onUploadProgress,
    },
  });
};

export const addKolCategories = async (categoryIds, { signal } = {}) => {
  const ids = (Array.isArray(categoryIds) ? categoryIds : [categoryIds]).filter(
    Boolean
  );
  if (!ids.length) return null;
  return await post({
    url: CLIENT_API_PATHS.KOL.categoryAdd,
    data: { categoryIds: ids },
    config: signal ? { signal } : undefined,
  });
};

export const removeKolCategories = async (categoryIds, { signal } = {}) => {
  const ids = (Array.isArray(categoryIds) ? categoryIds : [categoryIds]).filter(
    Boolean
  );
  if (!ids.length) return null;
  return await remove2({
    url: CLIENT_API_PATHS.KOL.categoryRemove,
    data: { categoryIds: ids }, // gửi body
    config: signal ? { signal } : undefined,
  });
};
export const setCoverImage = async (fileId, { signal } = {}) => {
  if (!fileId) throw new Error("fileId is required");
  const payload = await update({
    url: CLIENT_API_PATHS.KOL.medias.changeCover, // "/v1/kol/cover-image/change"
    data: null, // không cần body
    config: { params: { fileId }, signal }, // fileId ở query string
  });
  // interceptor trả {status, message, data}; ta trả về 'data' cho tiện dùng ở UI
  return payload?.data ?? null;
};

/** Deactivate media (xoá khỏi hồ sơ mà không xoá file vật lý)
 *  /api/v1/kol/medias/deactivate  body: { fileUsageIds: [...] }
 */
export const deactivateKolMedias = async (fileUsageIds, { signal } = {}) => {
  const ids = (
    Array.isArray(fileUsageIds) ? fileUsageIds : [fileUsageIds]
  ).filter(Boolean);
  if (!ids.length) return null;
  return await update({
    url: CLIENT_API_PATHS.KOL.medias.deactivate, // /v1/kol/medias/deactivate
    data: { fileUsageIds: ids },
    config: signal ? { signal } : undefined,
  });
};
export const getKolTimeline = async ({
  kolId,
  startDate,
  endDate,
  page = 0,
  size = 500,
  signal,
} = {}) => {
  if (!kolId) throw new Error("kolId is required");
  const url = `/v1/kol/availabilities/time-line/kol/${encodeURIComponent(
    kolId
  )}`;
  const payload = await get({
    url,
    params: { startDate, endDate, page, size },
    config: signal ? { signal } : undefined,
  });
  // interceptor của bạn thường trả {status, message, data}
  // ở đây mình trả về payload.data (danh sách timeline)
  return payload?.data ?? [];
};
