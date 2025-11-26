// src/services/admin/AdminLivestreamMetricAPI.js
import { get } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";

export async function adminGetKolLivestreamMetricsByKolId(
  kolId,
  { page = 0, size = 20 } = {},
  { signal } = {}
) {
  if (!kolId) throw new Error("kolId is required");

  const builder = API_PATHS?.BOOKING_REQUEST?.getLivestreamMetricsByKol;
  if (typeof builder !== "function") {
    throw new Error(
      "Missing API_PATHS.BOOKING_REQUEST.getLivestreamMetricsByKol"
    );
  }

  const res = await get({
    url: builder(kolId),
    config: {
      params: { page, size },
      ...(signal ? { signal } : {}),
      // 👇 Không cho axios interceptor hiển thị toast lỗi cho API này
      skipErrorToast: true,
    },
  });

  // tuỳ backend, đa số sẽ là { data: { content, totalElements, ... } }
  return res?.data ?? null;
}
