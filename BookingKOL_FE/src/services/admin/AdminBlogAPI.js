import { get, patch, remove2 } from "../../config/axios-config";
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

export const adminUpdateBlog = async (blogId, body, { signal } = {}) => {
  const id = ensureBlogId(blogId);
  if (!body || typeof body !== "object") {
    throw new Error("body is required");
  }
  const payload = await patch({
    url: BLOG_PATHS.adminUpdate(id),
    data: body,
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
  adminDeleteBlog,
};
