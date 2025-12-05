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
      config: signal ? { signal } : undefined,
    });
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

    const isNotFoundCancel =
      status === 404 ||
      (status === 400 && /không\s*tìm\s*thấy|not\s*found/i.test(msg));

    if (isNotFoundCancel) return null;

    throw err;
  }
}
