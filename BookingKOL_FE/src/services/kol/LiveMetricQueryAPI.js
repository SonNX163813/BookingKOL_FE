// src/services/kol/LiveMetricQueryAPI.js
import { get } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

/** ✅ (GET) /v1/kol/requests/worktime/livestream-metrics/{worktimeId} */
export async function getKolLivestreamMetrics(worktimeId, { signal } = {}) {
  if (!worktimeId) throw new Error("worktimeId is required");

  const builder =
    CLIENT_API_PATHS?.BOOKING?.kolWorktimeLivestreamMetrics ??
    CLIENT_API_PATHS?.kolWorktimeLivestreamMetrics;

  if (typeof builder !== "function") {
    throw new Error(
      "Missing CLIENT_API_PATHS.{BOOKING.}kolWorktimeLivestreamMetrics"
    );
  }

  const res = await get({
    url: builder(worktimeId),
    config: signal ? { signal } : undefined,
  });

  return res?.data ?? null;
}
