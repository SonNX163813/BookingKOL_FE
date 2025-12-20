// src/services/admin/booking/AdminBookingSingleRequestAPI.js
import { post } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";

/**
 * ✅ POST /v1/admin/booking/single-requests/create
 * Body:
 * {
 *   bookingSingleReqByAdmin: {
 *     userId, kolId, fullName, phone, email,
 *     startAt, endAt, platform, description, location
 *   },
 *   attachedFiles: string[]
 * }
 */
export async function adminCreateBookingSingleRequest(
  payload,
  { signal, timeout } = {}
) {
  const url =
    API_PATHS?.BOOKING_REQUEST?.create ||
    "/v1/admin/booking/single-requests/create";

  if (!payload?.bookingSingleReqByAdmin) {
    throw new Error("bookingSingleReqByAdmin is required");
  }

  const p = payload.bookingSingleReqByAdmin;

  // ✅ schema đúng: có userId
  const requiredFields = [
    "userId",
    "kolId",
    "fullName",
    "phone",
    "email",
    "startAt",
    "endAt",
  ];

  const missing = requiredFields.filter((k) => !p?.[k]);
  if (missing.length) {
    throw new Error(`Missing fields: ${missing.join(", ")}`);
  }

  const res = await post({
    url,
    data: payload,
    config: {
      ...(signal ? { signal } : {}),
      ...(timeout ? { timeout } : {}),
    },
  });

  return res?.data ?? null;
}

/**
 * ✅ POST /v1/availabilities/admin/add
 * Body:
 * {
 *   kolId: string,
 *   startAt: string (ISO),
 *   endAt: string (ISO)
 * }
 */
export async function adminAddAvailabilityByAdmin(payload, { signal } = {}) {
  const url =
    API_PATHS?.SCHEDULER_ADMIN?.adminAddAvailability ||
    "/v1/availabilities/admin/add";

  if (!payload) throw new Error("Payload is required");

  const requiredFields = ["kolId", "startAt", "endAt"];
  const missing = requiredFields.filter((k) => !payload?.[k]);
  if (missing.length) {
    throw new Error(`Missing fields: ${missing.join(", ")}`);
  }

  const res = await post({
    url,
    data: payload,
    config: signal ? { signal } : undefined,
  });

  return res?.data ?? null;
}
