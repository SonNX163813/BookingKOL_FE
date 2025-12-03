// src/services/admin/AdminUpdateSingleBookingRequestStatusAPI.js
import { patch } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";

/**
 * PATCH /v1/admin/booking/single-requests/update-status
 * Query: bookingRequestId, status
 */
export async function adminUpdateSingleBookingRequestStatus(
  { bookingRequestId, status },
  { signal } = {}
) {
  if (!bookingRequestId) throw new Error("bookingRequestId is required");
  if (!status) throw new Error("status is required");

  const base =
    API_PATHS?.BOOKING_REQUEST?.updateStatus ||
    "/v1/admin/booking/single-requests/update-status";

  const url =
    `${base}` +
    `?bookingRequestId=${encodeURIComponent(bookingRequestId)}` +
    `&status=${encodeURIComponent(status)}`;

  const res = await patch({
    url,
    data: null,
    config: signal ? { signal } : undefined,
    skipToast: true,
  });

  return res?.data ?? null;
}
