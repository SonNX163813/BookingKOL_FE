// src/services/kol/LiveMetricQueryAPI.js
import { get } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

const normalizeMessage = (message) => {
  if (Array.isArray(message)) return message.filter(Boolean).join(" ");
  if (typeof message === "string") return message;
  if (message == null) return "";
  return String(message);
};

const isNoLivestreamMetricPayload = (payload) => {
  const msg = normalizeMessage(payload?.message);
  return /không tìm thấy\s+livestream\s+metric/i.test(msg);
};

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

  try {
    const res = await get({
      url: builder(worktimeId),
      config: {
        ...(signal ? { signal } : {}),
        // ✅ không cho interceptor toast lỗi ở endpoint này
        skipErrorToast: true,
      },
    });

    // get() trả response.data
    // nếu BE bọc {status,message,data} => lấy res.data
    if (res && typeof res === "object" && "status" in res && "data" in res) {
      return res.data ?? null;
    }

    // nếu BE trả thẳng object metric => trả luôn
    return res ?? null;
  } catch (err) {
    const status = err?.response?.status;
    const payload = err?.response?.data;

    // ✅ 400 "Không tìm thấy Livestream Metric..." => coi như chưa có dữ liệu
    if (status === 400 && isNoLivestreamMetricPayload(payload)) return null;

    // (tuỳ BE) 404 cũng coi như chưa có
    if (status === 404) return null;

    throw err;
  }
}
