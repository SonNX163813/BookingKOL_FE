// src/services/admin/booking/AdminBookingSingleRequestAPI.js
import { post } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";

const extractFileList = (files) => {
  if (!files) return [];

  if (files instanceof FileList) {
    return Array.from(files);
  }

  if (Array.isArray(files)) {
    return files.flatMap((item) => {
      if (item instanceof File || item instanceof Blob) return item;
      if (item?.file instanceof File || item?.file instanceof Blob)
        return item.file;
      if (typeof item === "string") return item;
      return [];
    });
  }

  if (files instanceof File || files instanceof Blob || typeof files === "string") {
    return [files];
  }

  return [];
};

/**
 * ✅ POST /v1/admin/booking/single-requests/create
 * Payload (multipart/form-data):
 * - bookingSingleReqByAdmin: JSON blob (application/json) {
 *     userId, kolId, fullName, phone, email, startAt, endAt, platform, description, location
 *   }
 * - attachedFiles: File[] | FileList | string[]
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

  const formData = new FormData();

  extractFileList(payload?.attachedFiles).forEach((file) => {
    formData.append("attachedFiles", file);
  });

  const bookingJson = JSON.stringify(p ?? {});
  const bookingBlob = new Blob([bookingJson], {
    type: "application/json",
  });
  formData.append("bookingSingleReqByAdmin", bookingBlob);

  const res = await post({
    url,
    data: formData,
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
