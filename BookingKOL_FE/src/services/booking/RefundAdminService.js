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

export const getAllRefundRequests = async ({
  page = 0,
  size = 10,
  status,
} = {}) => {
  return await get({
    url: API_PATHS.REFUND.getAll,
    params: {
      page,
      size,
      status: normalizeParam(status),
    },
  });
};
