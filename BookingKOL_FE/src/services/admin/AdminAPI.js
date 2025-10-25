// src/services/admin/AdminAPI.js
import { get, post, patch, remove2, update } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";

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

const buildAdminKolListParams = (params = {}) => {
  const merged = { ...ADMIN_KOL_LIST_DEFAULT_PARAMS, ...(params ?? {}) };
  return Object.entries(merged).reduce((acc, [key, value]) => {
    const skip =
      !ADMIN_KOL_LIST_ALLOWED_PARAMS.has(key) ||
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "");
    if (!skip) acc[key] = value;
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

/* ================== KOL DETAIL (ADMIN) ================== */
export const adminGetKolDetail = async (kolId, { signal } = {}) => {
  if (!kolId) throw new Error("kolId is required");
  const payload = await get({
    url: `${PATHS.adminViewProfileUser}/${encodeURIComponent(kolId)}`, // "/v1/users/profile/admin/{id}"
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
    url: PATHS.managementBrands, // "/v1/admin/brands"
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
    url: `${PATHS.adminUpdateStatusAccount}/${encodeURIComponent(id)}/status`, // "/v1/admin/users/{id}/status"
    data: { status },
  });
  return payload?.data ?? payload ?? null;
};

/* ================== CATEGORY (ADMIN) ================== */
// POST /v1/admin/kol/category/add/{kolId}?categoryId=...
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

// DELETE /v1/admin/kol/category/remove/{kolId}?categoryId=...
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

/* ================== MEDIAS (ADMIN) ================== */
// GET /v1/admin/kol/medias/all/{kolId}
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

// POST /v1/admin/kol/medias/upload/{kolId}
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

// PATCH /v1/admin/kol/medias/delete/{fileId}
export const adminDeleteKolMedia = async (fileId, { signal } = {}) => {
  if (!fileId) throw new Error("fileId is required");
  const payload = await patch({
    url: `${PATHS.adminKolMediaDelete}/${encodeURIComponent(fileId)}`,
    data: null,
    config: signal ? { signal } : undefined,
  });
  return payload?.data ?? payload ?? null;
};

// PUT /v1/admin/kol/cover-image/{kolId}?fileId=...
export const adminSetCoverImage = async (kolId, fileId, { signal } = {}) => {
  if (!kolId || !fileId) throw new Error("kolId & fileId are required");
  const payload = await update({
    url: `${PATHS.adminKolCoverChange}/${encodeURIComponent(kolId)}`,
    data: null,
    config: { params: { fileId }, ...(signal ? { signal } : {}) },
  });
  return payload?.data ?? payload ?? null;
};

/* ================== UPDATE PROFILE (ADMIN) ================== */
const ADMIN_KOL_UPDATE_ALLOWED_FIELDS = new Set([
  "displayName",
  "dob", // "YYYY-MM-DD"
  "experience",
  "role", // ví dụ: "LIVE"
  "city",
  "country",
  "bio",
  "minBookingPrice", // number
  "isAvailable", // boolean
]);
const buildAdminKolUpdatePayload = (body = {}) =>
  Object.fromEntries(
    Object.entries(body).filter(
      ([k, v]) => ADMIN_KOL_UPDATE_ALLOWED_FIELDS.has(k) && v !== undefined
    )
  );

// PUT /v1/admin/kol/update/{kolId}
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
