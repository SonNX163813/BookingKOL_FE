import { useQuery } from "@tanstack/react-query";
import { getAdminDashboardSummary } from "../../../services/admin/AdminDashboardAPI";

const DASHBOARD_QUERY_KEY = "admin-dashboard-summary";

/**
 * Shared React Query hook for the admin dashboard summary endpoint.
 * Accepts the same options as useQuery so callers can override defaults.
 */
export const useAdminDashboardSummary = (
  { startDate, endDate } = {},
  options = {}
) => {
  return useQuery({
    queryKey: [DASHBOARD_QUERY_KEY, startDate ?? null, endDate ?? null],
    queryFn: ({ signal }) =>
      getAdminDashboardSummary({ signal, startDate, endDate }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};
