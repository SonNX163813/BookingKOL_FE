import { useQuery } from "@tanstack/react-query";
import { getKolDashboardSummary } from "../../services/kol/KolDashboardAPI";

const DASHBOARD_QUERY_KEY = "kol-dashboard-summary";

export const useKolDashboardSummary = (options = {}) =>
  useQuery({
    queryKey: [DASHBOARD_QUERY_KEY],
    queryFn: ({ signal }) => getKolDashboardSummary({ signal }),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...options,
  });
