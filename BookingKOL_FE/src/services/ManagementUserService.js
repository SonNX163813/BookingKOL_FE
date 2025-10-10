import { get, patch } from "../config/axios-config";
import { API_PATHS } from "../constants/apiPath";

export const getAllBrands = async (page, size, search) => {
  return await get({
    url: API_PATHS.MANAGEMENT_USER.managementBrands,
    params: {
      page,
      size,
      search: search ?? null,
    },
  });
};

export const patchAdminUpdateStatusAccount = async ({ id, status }) => {
  return await patch({
    url: `${API_PATHS.MANAGEMENT_USER.adminUpdateStatusAccount}/${id}/status`,
    data: {
      status: status,
    },
  });
};

export const getAdminViewProfileUserId = async (id) => {
  return await get({
    url: `${API_PATHS.MANAGEMENT_USER.adminViewProfileUser}/${id}`,
  });
};

export const getAllKol = async (
  page,
  size,
  minBookingPrice,
  minRating,
  isAvailable
) => {
  return await get({
    url: API_PATHS.MANAGEMENT_USER.managementKOL,
    params: {
      page: page,
      size: size,
      minBookingPrice: minBookingPrice ?? null,
      minRating: minRating ?? null,
      isAvailable: isAvailable ?? null,
    },
  });
};
