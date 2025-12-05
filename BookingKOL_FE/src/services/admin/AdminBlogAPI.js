import { get, patch, post, remove2 } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";

const BLOG_PATHS = API_PATHS.BLOG;

const DEFAULT_PAGING = { page: 0, size: 10 };

const normalizeListParams = (params = {}) => {
  const merged = { ...DEFAULT_PAGING, ...(params ?? {}) };
  return Object.entries(merged).reduce((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc;
    }

    if (key === "page") {
      acc.page =
        Number.isInteger(value) && value >= 0 ? value : DEFAULT_PAGING.page;
      return acc;
    }

    if (key === "size") {
      acc.size =
        Number.isInteger(value) && value > 0 ? value : DEFAULT_PAGING.size;
      return acc;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) acc[key] = trimmed;
      return acc;
    }

    acc[key] = value;
    return acc;
  }, {});
};

const ensureBlogId = (blogId) => {
  const normalized =
    typeof blogId === "string" ? blogId.trim() : blogId ?? undefined;
  if (normalized === undefined || normalized === "") {
    throw new Error("blogId is required");
  }
  return normalized;
};

export const adminFetchBlogList = async ({ params, signal } = {}) => {
  const payload = await get({
    url: BLOG_PATHS.adminGetAll,
    params: normalizeListParams(params),
    config: signal ? { signal } : undefined,
  });
  const data = payload?.data ?? payload ?? {};
  const content = Array.isArray(data.content) ? data.content : [];
  return { ...data, content };
};

export const adminFetchBlogDetail = async (blogId, { signal } = {}) => {
  const id = ensureBlogId(blogId);
  const payload = await get({
    url: BLOG_PATHS.adminGetDetail(id),
    config: signal ? { signal } : undefined,
  });
  return payload?.data ?? payload ?? null;
};

const sanitizeString = (value) =>
  typeof value === "string" ? value.trim() : value;

const buildCreatePayload = (body = {}) => {
  const payload = {
    title: sanitizeString(body.title),
    author: sanitizeString(body.author),
    content: body.content,
    isPublish: Boolean(body.isPublish),
  };

  if (!payload.title) {
    throw new Error("title is required");
  }
  if (!payload.author) {
    throw new Error("author is required");
  }
  if (
    payload.content === undefined ||
    payload.content === null ||
    payload.content === ""
  ) {
    throw new Error("content is required");
  }

  return payload;
};

const buildUpdatePayload = (body = {}) => {
  const payload = {};

  if (body.title !== undefined) {
    payload.title = sanitizeString(body.title);
  }
  if (body.author !== undefined) {
    payload.author = sanitizeString(body.author);
  }
  if (body.content !== undefined) {
    payload.content = body.content;
  }
  if (body.isPublish !== undefined) {
    payload.isPublish = Boolean(body.isPublish);
  }

  if (!Object.keys(payload).length) {
    throw new Error("At least one editable field is required");
  }

  return payload;
};

export const adminUpdateBlog = async (blogId, body, { signal } = {}) => {
  const id = ensureBlogId(blogId);
  if (!body || typeof body !== "object") {
    throw new Error("body is required");
  }
  const data = buildUpdatePayload(body);
  const payload = await patch({
    url: BLOG_PATHS.adminUpdate(id),
    data,
    config: signal ? { signal } : undefined,
  });
  return payload?.data ?? payload ?? null;
};

export const adminCreateBlog = async (body, { signal } = {}) => {
  if (!body || typeof body !== "object") {
    throw new Error("body is required");
  }
  const data = buildCreatePayload(body);
  const payload = await post({
    url: BLOG_PATHS.adminCreate,
    data,
    config: signal ? { signal } : undefined,
  });
  return payload?.data ?? payload ?? null;
};

export const adminUploadBlogThumbnail = async (
  blogId,
  thumbnail,
  { signal, onUploadProgress } = {}
) => {
  const id = ensureBlogId(blogId);
  if (!thumbnail) {
    throw new Error("thumbnail is required");
  }

  const form = new FormData();
  form.append("thumbnail", thumbnail, thumbnail.name || "thumbnail.jpg");

  const payload = await post({
    url: BLOG_PATHS.adminThumbnailUpload(id),
    data: form,
    config: {
      headers: { "Content-Type": "multipart/form-data" },
      ...(signal ? { signal } : {}),
      ...(onUploadProgress ? { onUploadProgress } : {}),
    },
  });

  return payload?.data ?? payload ?? null;
};

export const adminDeleteBlogThumbnail = async (blogId, { signal } = {}) => {
  const id = ensureBlogId(blogId);
  const payload = await remove2({
    url: BLOG_PATHS.adminThumbnailDelete(id),
    config: signal ? { signal } : undefined,
  });
  return payload?.data ?? payload ?? null;
};

export const adminDeleteBlog = async (blogId, { signal } = {}) => {
  const id = ensureBlogId(blogId);
  const payload = await remove2({
    url: BLOG_PATHS.adminDelete(id),
    config: signal ? { signal } : undefined,
  });
  return payload?.data ?? payload ?? null;
};

export default {
  adminFetchBlogList,
  adminFetchBlogDetail,
  adminUpdateBlog,
  adminCreateBlog,
  adminUploadBlogThumbnail,
  adminDeleteBlogThumbnail,
  adminDeleteBlog,
};
