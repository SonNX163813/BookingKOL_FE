import { get, post } from "../../config/axios-config";
import { API_PATHS } from "../../constants/apiPath";

export const createBookingPackage = async (value) => {
  const data = {
    packageId: value.packageId,
    campaignName: value.campaignName,
    objective: value.objective,
    targetPrice: value.targetPrice,
    startDate: value.startDate,
    endDate: value.endDate,
    recurrencePattern: value.recurrencePattern,
    liveIds: value?.liveIds ?? undefined,
    kolIds: value?.kolIds ?? undefined,
    attachment: value?.attachment ?? undefined,
  };

  const formData = new FormData();

  formData.append("packageId", value.packageId);
  formData.append("campaignName", value.campaignName);
  formData.append("objective", value.objective);
  formData.append("targetPrice", value.targetPrice);
  formData.append("startDate", new Date(value.startDate).toISOString());
  formData.append("endDate", new Date(value.endDate).toISOString());
  formData.append("recurrencePattern", value.recurrencePattern ? "WEEKLY" : "");
  if (value?.liveIds) {
    formData.append("liveIds", value.liveIds);
  }
  if (value?.kolIds) {
    formData.append("kolIds", value.kolIds);
  }
  if (value?.attachment) {
    formData.append("attachment", value.attachment);
  }

  return await post({
    url: API_PATHS.BOOKINGPACKAGE.createBookingPackage,
    data: formData,
  });
};

export const getHistoryBookingPackage = async (page, size) => {
  return await get({
    url: API_PATHS.BOOKINGPACKAGE.getHistoryBookingPackage,
    params: {
      page,
      size,
    },
  });
};
