import { get } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

const normalizeQueryParam = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  return value;
};

export const getMySingleBookingRequests = async ({
  page = 0,
  size = 20,
  status,
  startAt,
  endAt,
  createdAtFrom,
  createdAtTo,
} = {}) => {
  return await get({
    url: CLIENT_API_PATHS.BOOKING.getMySingleRequests,
    params: {
      page,
      size,
      status: normalizeQueryParam(status),
      startAt: normalizeQueryParam(startAt),
      endAt: normalizeQueryParam(endAt),
      createdAtFrom: normalizeQueryParam(createdAtFrom),
      createdAtTo: normalizeQueryParam(createdAtTo),
    },
  });
};
