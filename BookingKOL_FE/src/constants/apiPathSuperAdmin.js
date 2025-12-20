export const API_PATHS_SUPERADMIN = {
  ACCOUNT: {
    getAll: "/v1/superadmin/account/all",
    createAdmin: "/v1/superadmin/account/admin/create",
  },
  MERCHANT: {
    getAll: "/v1/superadmin/merchant/all",
    getDetail: "/v1/superadmin/merchant/detail",
    create: "/v1/superadmin/merchant/create",
    activate: "/v1/superadmin/merchant/active",
  },
  DASHBOARD: {
    superAdminSummary: "/v1/superadmin/dashboard/summary",
  },
  TRANSACTION: {
    getAll: "/v1/superadmin/transactions/all",
    getDetail: "/v1/superadmin/transactions/detail",
  },
  SERVICE_PACKAGE: {
    getAll: "v1/service-packages/all",
    update: (packageId) =>
      `v1/service-packages/update/${encodeURIComponent(packageId)}`,
  },
};
