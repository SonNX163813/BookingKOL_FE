import { get } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

const DEFAULT_PARAMS = {
  page: 0,
  size: 10,
};

const normalizePagingParams = (params = {}) => {
  const merged = { ...DEFAULT_PARAMS, ...(params ?? {}) };
  const payload = {};
  if (Number.isInteger(merged.page) && merged.page >= 0) {
    payload.page = merged.page;
  } else {
    payload.page = DEFAULT_PARAMS.page;
  }
  if (Number.isInteger(merged.size) && merged.size > 0) {
    payload.size = merged.size;
  } else {
    payload.size = DEFAULT_PARAMS.size;
  }
  return payload;
};

export const fetchBlogs = async ({ signal, ...params } = {}) => {
  const pagingParams = normalizePagingParams(params);
  const config = signal ? { signal } : undefined;
  const response = await get({
    url: CLIENT_API_PATHS.BLOG.getAll,
    params: pagingParams,
    config,
  });
  const data = response?.data ?? {};
  const content = Array.isArray(data.content) ? data.content : [];
  return {
    ...data,
    content,
  };
};

export const fetchBlogDetail = async (blogId, { signal } = {}) => {
  if (!blogId) {
    throw new Error("blogId is required");
  }
  const config = signal ? { signal } : undefined;
  const response = await get({
    url: CLIENT_API_PATHS.BLOG.getDetail(blogId),
    config,
  });
  return response?.data ?? null;
};

export default {
  fetchBlogs,
  fetchBlogDetail,
};
