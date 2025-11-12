import { get, post } from "../../config/axios-config";
import { API_PATHS_SUPERADMIN } from "../../constants/apiPathSuperAdmin";

export const getSuperAdminAccounts = async ({
  page = 0,
  size = 20,
  status,
  role,
  search,
  signal,
} = {}) => {
  const params = { page, size };

  if (status) {
    params.status = status;
  }

  if (role) {
    params.role = role;
  }

  if (search) {
    params.search = search;
  }

  return get({
    url: API_PATHS_SUPERADMIN.ACCOUNT.getAll,
    params,
    config: signal ? { signal } : undefined,
  });
};

export const createSuperAdminAdminAccount = async (payload) => {
  return post({
    url: API_PATHS_SUPERADMIN.ACCOUNT.createAdmin,
    data: payload,
  });
};

export default getSuperAdminAccounts;
