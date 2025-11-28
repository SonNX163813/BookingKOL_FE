// src/services/admin/AdminLivestreamMetricAPI.js
import { get } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";

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

/**
 * Metrics theo WORKTIME (đúng case BE: "ca làm việc: ...")
 * - skipErrorToast: true => interceptor không toast
 * - 400 + message "Không tìm thấy Livestream Metric..." => return null (không throw)
 */
export async function adminGetLivestreamMetricByWorktimeId(
  worktimeId,
  { signal } = {}
) {
  if (!worktimeId) throw new Error("worktimeId is required");

  const builder =
    API_PATHS?.BOOKING_REQUEST?.getLivestreamMetricsByWorktime ||
    API_PATHS?.BOOKING_REQUEST?.getLivestreamMetricByWorktime ||
    API_PATHS?.LIVESTREAM_METRIC?.getByWorktime;

  if (typeof builder !== "function") {
    throw new Error(
      "Missing API_PATHS builder for metrics by worktimeId (e.g. API_PATHS.BOOKING_REQUEST.getLivestreamMetricsByWorktime)"
    );
  }

  try {
    const res = await get({
      url: builder(worktimeId),
      config: {
        ...(signal ? { signal } : {}),
        skipErrorToast: true,
      },
    });

    // axios-config GET trả response.data
    // Nếu BE bọc {status,message,data,...} thì bóc data
    if (res && typeof res === "object" && "status" in res && "data" in res) {
      return res.data ?? null;
    }
    return res ?? null;
  } catch (err) {
    const status = err?.response?.status;
    const payload = err?.response?.data;

    if (status === 400 && isNoLivestreamMetricPayload(payload)) return null;
    if (status === 404) return null;

    throw err;
  }
}

/**
 * Metrics theo KOL (giữ lại — cũng skip toast + return null cho case "no metric")
 */
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

  try {
    const res = await get({
      url: builder(kolId),
      config: {
        params: { page, size },
        ...(signal ? { signal } : {}),
        skipErrorToast: true,
      },
    });

    if (res && typeof res === "object" && "status" in res && "data" in res) {
      return res.data ?? null;
    }
    return res ?? null;
  } catch (err) {
    const status = err?.response?.status;
    const payload = err?.response?.data;

    if (status === 400 && isNoLivestreamMetricPayload(payload)) return null;
    if (status === 404) return null;

    throw err;
  }
}
