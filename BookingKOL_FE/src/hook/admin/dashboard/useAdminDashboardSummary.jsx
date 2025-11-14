import { useQuery } from "@tanstack/react-query";
import { getAdminDashboardSummary } from "../../../services/superadmin/SuperAdminDashboardAPI";

const DASHBOARD_QUERY_KEY = ["admin-dashboard-summary"];

/**
 * Shared React Query hook for the admin dashboard summary endpoint.
 * Accepts the same options as useQuery so callers can override defaults.
 */
const useSuperAdminDashboardSummary = (options = {}) => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: ({ signal }) => getAdminDashboardSummary({ signal }),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    ...options,
  });
};

export default useSuperAdminDashboardSummary;
