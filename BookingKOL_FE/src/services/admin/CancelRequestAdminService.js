// src/services/admin/cancel-request/CancelRequestAPI.js
import { get } from "../../../config/axios-config";
import { API_PATHS } from "../../../constants/apiPath";

/** GET /v1/requests/cancel/detail/{workTimeId} */
export async function getCancelRequestDetailByWorkTimeId(
  workTimeId,
  { signal } = {}
) {
  if (!workTimeId) throw new Error("workTimeId is required");

  const builder =
    API_PATHS?.CANCEL_REQUEST?.detailByWorkTime ||
    ((id) => `/v1/requests/cancel/detail/${encodeURIComponent(id)}`);

  try {
    const res = await get({
      url: builder(workTimeId),
      config: signal ? { signal, silent: true } : { silent: true }, // ✅ quan trọng
      skipToast: true, // ✅ quan trọng
    });

    // tùy BE trả về shape nào thì bạn giữ như này
    return res?.data ?? null;
  } catch (err) {
    // ✅ Không có yêu cầu hủy -> trả null để ẩn card, KHÔNG coi là lỗi
    const status = err?.response?.status;
    const rawMessage =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message;

    const msg = Array.isArray(rawMessage)
      ? rawMessage.join(" | ")
      : String(rawMessage || "");

    const msgLower = msg.toLowerCase();

    const isNotFoundCancel =
      status === 404 ||
      (status === 400 &&
        /không\s*tìm\s*thấy\s*yêu\s*cầu\s*hủy|không\s*tìm\s*thấy|not\s*found/i.test(
          msgLower
        ));

    if (isNotFoundCancel) return null;

    throw err;
  }
}
