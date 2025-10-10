import { get } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

const KOL_LIST_ALLOWED_PARAMS = new Set([
  "minRating",
  "categoryId",
  "minPrice",
  "page",
  "size",
]);

const KOL_LIST_DEFAULT_PARAMS = {
  page: 0,
  size: 10,
};

const buildKolListParams = (params = {}) => {
  const mergedParams = {
    ...KOL_LIST_DEFAULT_PARAMS,
    ...(params ?? {}),
  };

  return Object.entries(mergedParams).reduce(
    (accumulator, [key, value]) => {
      if (!KOL_LIST_ALLOWED_PARAMS.has(key)) {
        return accumulator;
      }

      const shouldSkip =
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "");

      if (shouldSkip) {
        return accumulator;
      }

      accumulator[key] = value;
      return accumulator;
    },
    {}
  );
};

export const getKolProfiles = async ({ signal, params } = {}) => {
  const config = signal ? { signal } : undefined;
  const payload = await get({
    url: CLIENT_API_PATHS.KOL.getAllAvailable,
    params: buildKolListParams(params),
    config,
  });

  const data = payload?.data;
  if (!data) {
    return { content: [] };
  }

  const content = Array.isArray(data.content) ? data.content : [];
  return { ...data, content };
};

export const getKolProfileById = async (kolId, { signal } = {}) => {
  if (!kolId) {
    throw new Error("kolId is required");
  }

  const config = signal ? { signal } : undefined;
  const payload = await get({
    url: `${CLIENT_API_PATHS.KOL.getDetailByKolId}/${kolId}`,
    config,
  });

  return payload?.data ?? null;
};
