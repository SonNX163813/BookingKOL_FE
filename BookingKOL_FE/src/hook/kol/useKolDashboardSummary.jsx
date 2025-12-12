import { useQuery } from "@tanstack/react-query";
import { getKolDashboardSummary } from "../../services/kol/KolDashboardAPI";

const DASHBOARD_QUERY_KEY = "kol-dashboard-summary";

export const useKolDashboardSummary = (
  { startDate, endDate } = {},
  options = {}
) =>
  useQuery({
    queryKey: [DASHBOARD_QUERY_KEY, startDate ?? null, endDate ?? null],
    queryFn: ({ signal }) =>
      getKolDashboardSummary({ signal, startDate, endDate }),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
    ...options,
  });
