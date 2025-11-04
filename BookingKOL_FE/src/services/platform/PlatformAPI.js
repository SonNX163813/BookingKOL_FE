import { get } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

const normalizePlatform = (item) => {
  if (!item || typeof item !== "object") return null;
  const name = typeof item.name === "string" ? item.name.trim() : "";
  const key = typeof item.key === "string" ? item.key.trim() : "";
  const id = typeof item.id === "string" ? item.id.trim() : "";

  if (!name && !key) return null;

  return {
    id: id || null,
    key: key || null,
    name: name || key || "",
  };
};

export const getAllPlatforms = async ({ signal } = {}) => {
  const payload = await get({
    url: CLIENT_API_PATHS.PLATFORM.all,
    config: signal ? { signal } : undefined,
  });

  const raw = payload?.data ?? payload;
  const data = Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw)
    ? raw
    : [];

  return data.map(normalizePlatform).filter(Boolean);
};

export default getAllPlatforms;
