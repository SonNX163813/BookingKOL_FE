import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { getMyWorktimeLivestreamMetrics } from "../../../services/booking/WorktimeLivestreamMetricUserService";

const normalizeWorktimeIds = (worktimeIds) => {
  if (!Array.isArray(worktimeIds)) {
    return [];
  }

  const uniqueIds = [];
  const seen = new Set();

  worktimeIds.forEach((rawId) => {
    if (rawId === null || rawId === undefined) {
      return;
    }

    const normalized = String(rawId).trim();
    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    uniqueIds.push(rawId);
  });

  return uniqueIds;
};

export const useGetWorktimeLivestreamMetrics = (
  worktimeIds,
  queryOptions = {}
) => {
  const normalizedIds = useMemo(
    () => normalizeWorktimeIds(worktimeIds),
    [worktimeIds]
  );

  const { enabled: optionEnabled, ...restOptions } = queryOptions ?? {};

  const queries = useQueries({
    queries: normalizedIds.map((worktimeId) => ({
      queryKey: [
        "user",
        "single-booking-requests",
        "worktime-livestream-metrics",
        worktimeId,
      ],
      queryFn: () => getMyWorktimeLivestreamMetrics(worktimeId),
      enabled: Boolean(worktimeId) && (optionEnabled ?? true),
      ...restOptions,
    })),
  });

  const metricsMap = useMemo(() => {
    const map = new Map();

    queries.forEach((query, index) => {
      const worktimeId = normalizedIds[index];
      if (!worktimeId) {
        return;
      }

      map.set(worktimeId, query?.data?.data ?? null);
    });

    return map;
  }, [queries, normalizedIds]);

  const isLoading = queries.some((query) => query.isPending);
  const isFetching = queries.some((query) => query.isFetching);
  const errors = queries.map((query) => query.error).filter(Boolean);

  return {
    worktimeLivestreamMetricsMap: metricsMap,
    worktimeLivestreamMetricQueries: queries,
    worktimeLivestreamMetricErrors: errors,
    isLoadingWorktimeLivestreamMetrics: isLoading,
    isFetchingWorktimeLivestreamMetrics: isFetching,
    resolvedWorktimeIds: normalizedIds,
  };
};
