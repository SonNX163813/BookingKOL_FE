import { get } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

export const getServicePackages = async ({ signal } = {}) => {
  const config = signal ? { signal } : undefined;
  const payload = await get({
    url: CLIENT_API_PATHS.SERVICE_PACKAGES.list,
    config,
  });

  if (Array.isArray(payload)) {
    return payload;
  }

  const data = payload?.data;
  if (Array.isArray(data)) {
    return data;
  }

  return [];
};

export default {
  getServicePackages,
};
