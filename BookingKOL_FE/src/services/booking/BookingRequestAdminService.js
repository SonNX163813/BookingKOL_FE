import { get } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";

const normalizeParam = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  return value;
};

export const getAllBookingRequests = async ({
  page = 0,
  size = 20,
  status,
  startAt,
  endAt,
  createdAtFrom,
  createdAtTo,
  requestNumber,
} = {}) => {
  return await get({
    url: API_PATHS.BOOKING_REQUEST.getAll,
    params: {
      page,
      size,
      status: normalizeParam(status),
      startAt: normalizeParam(startAt),
      endAt: normalizeParam(endAt),
      createdAtFrom: normalizeParam(createdAtFrom),
      createdAtTo: normalizeParam(createdAtTo),
      requestNumber: normalizeParam(requestNumber),
    },
  });
};

export const getBookingRequestDetail = async (requestId) => {
  if (!requestId) {
    throw new Error("requestId is required to fetch booking request detail");
  }

  return await get({
    url: `${API_PATHS.BOOKING_REQUEST.getDetail}/${requestId}`,
  });
};

export const getWorktimeLivestreamMetrics = async (worktimeId) => {
  if (!worktimeId) {
    throw new Error(
      "worktimeId is required to fetch worktime livestream metrics"
    );
  }

  return await get({
    url: API_PATHS.BOOKING_REQUEST.getWorktimeLivestreamMetrics(worktimeId),
  });
};
