import { get, patch } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

export const getMyUserProfile = async ({ signal } = {}) => {
  const config = signal ? { signal } : undefined;
  const response = await get({
    url: CLIENT_API_PATHS.USER.profile,
    config,
  });
  return response?.data ?? response ?? null;
};

export const updateMyUserProfile = async ({ data, config } = {}) => {
  const response = await patch({
    url: CLIENT_API_PATHS.USER.updateProfile,
    data,
    config,
  });
  return response?.data ?? response ?? null;
};
