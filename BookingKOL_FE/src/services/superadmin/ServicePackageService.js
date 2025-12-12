// src/services/superadmin/SuperAdminServicePackageAPI.js
import { get, patch } from "../../config/axios-config";
import { API_PATHS_SUPERADMIN } from "../../constants/apiPathSuperAdmin";

export const getSuperAdminServicePackages = async ({ signal } = {}) => {
  // get() đã return payload luôn
  return await get({
    url: API_PATHS_SUPERADMIN.SERVICE_PACKAGE.getAll,
    config: signal ? { signal } : undefined,
  });
};

export const patchSuperAdminServicePackage = async ({
  packageId,
  newPrice,
  body,
  signal,
} = {}) => {
  if (!packageId) throw new Error("packageId is required");
  if (newPrice === undefined || newPrice === null || newPrice === "")
    throw new Error("newPrice is required");

  // ✅ newPrice phải đặt trong config.params
  return await patch({
    url: API_PATHS_SUPERADMIN.SERVICE_PACKAGE.update(packageId),
    data: body ?? {}, // nếu BE không nhận body thì vẫn OK (quan trọng là params)
    config: {
      params: { newPrice },
      ...(signal ? { signal } : {}),
    },
  });
};
