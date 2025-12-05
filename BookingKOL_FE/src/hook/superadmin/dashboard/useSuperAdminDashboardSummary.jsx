import { useQuery } from "@tanstack/react-query";
import { getSuperAdminDashboardSummary } from "../../../services/superadmin/SuperAdminDashboardAPI";

const DASHBOARD_QUERY_KEY = "super-admin-dashboard-summary";

/**
 * Shared React Query hook for the admin dashboard summary endpoint.
 * Accepts the same options as useQuery so callers can override defaults.
 */
export const useSuperAdminDashboardSummary = (
  { startDate, endDate } = {},
  options = {}
) => {
  return useQuery({
    queryKey: [DASHBOARD_QUERY_KEY, startDate ?? null, endDate ?? null],
    queryFn: ({ signal }) =>
      getSuperAdminDashboardSummary({ signal, startDate, endDate }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
