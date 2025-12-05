// src/services/kol/KolCancelBookingRequestAPI.js
import { post } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

/**
 * POST /v1/requests/kol/request
 * body: { kolId, workTimeId, reason }
 */
export async function createKolCancelBookingRequest(
  { kolId, workTimeId, reason },
  { signal } = {}
) {
  if (!kolId) throw new Error("kolId is required");
  if (!workTimeId) throw new Error("workTimeId is required");

  const url =
    CLIENT_API_PATHS?.BOOKING?.kolCancelBookingRequest ??
    "/v1/requests/kol/request";

  const res = await post({
    url,
    data: {
      kolId,
      workTimeId,
      reason: (reason ?? "").toString().trim(),
    },
    config: signal ? { signal } : undefined,
  });

  return res?.data ?? null;
}
