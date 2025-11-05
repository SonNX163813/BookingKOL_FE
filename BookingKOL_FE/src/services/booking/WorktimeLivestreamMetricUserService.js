import { get, patch } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

const resolveWorktimeMetricPathBuilder = (builder) => {
  if (typeof builder !== "function") {
    throw new Error(
      "Missing CLIENT_API_PATHS.BOOKING.worktimeLivestreamMetrics builder"
    );
  }
  return builder;
};

const resolveWorktimeMetricConfirmBuilder = (builder) => {
  if (typeof builder !== "function") {
    throw new Error(
      "Missing CLIENT_API_PATHS.BOOKING.worktimeLivestreamMetricsConfirm builder"
    );
  }
  return builder;
};

const ensureWorktimeId = (worktimeId) => {
  if (!worktimeId && worktimeId !== 0) {
    throw new Error(
      "worktimeId is required to interact with livestream metrics API"
    );
  }
  return worktimeId;
};

export const getMyWorktimeLivestreamMetrics = async (
  worktimeId,
  { signal } = {}
) => {
  const normalizedId = ensureWorktimeId(worktimeId);
  const pathBuilder = resolveWorktimeMetricPathBuilder(
    CLIENT_API_PATHS?.BOOKING?.worktimeLivestreamMetrics
  );

  const requestConfig = {
    skipErrorToast: true,
  };

  if (signal) {
    requestConfig.signal = signal;
  }

  return await get({
    url: pathBuilder(normalizedId),
    config: requestConfig,
  });
};

export const confirmMyWorktimeLivestreamMetrics = async (
  worktimeId,
  { signal } = {}
) => {
  const normalizedId = ensureWorktimeId(worktimeId);
  const pathBuilder = resolveWorktimeMetricConfirmBuilder(
    CLIENT_API_PATHS?.BOOKING?.worktimeLivestreamMetricsConfirm
  );

  return await patch({
    url: pathBuilder(normalizedId),
    data: {},
    config: signal ? { signal } : undefined,
  });
};
