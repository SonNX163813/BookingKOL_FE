import { get, post, update } from "../../config/axios-config";
import { API_PATHS_SUPERADMIN } from "../../constants/apiPathSuperAdmin";

const buildDetailUrl = (merchantId, basePath) => {
  if (!merchantId) {
    throw new Error("Merchant ID is required");
  }
  return `${basePath}/${encodeURIComponent(merchantId)}`;
};

export const getSuperAdminMerchants = async ({ page = 0, size = 10, signal } = {}) => {
  const params = { page, size };

  return get({
    url: API_PATHS_SUPERADMIN.MERCHANT.getAll,
    params,
    config: signal ? { signal } : undefined,
  });
};

export const getSuperAdminMerchantDetail = async ({ merchantId, signal } = {}) => {
  return get({
    url: buildDetailUrl(merchantId, API_PATHS_SUPERADMIN.MERCHANT.getDetail),
    config: signal ? { signal } : undefined,
  });
};

export const createSuperAdminMerchant = async (payload) => {
  return post({
    url: API_PATHS_SUPERADMIN.MERCHANT.create,
    data: payload,
  });
};

export const activateSuperAdminMerchant = async (merchantId) => {
  return update({
    url: buildDetailUrl(merchantId, API_PATHS_SUPERADMIN.MERCHANT.activate),
  });
};

export default getSuperAdminMerchants;
