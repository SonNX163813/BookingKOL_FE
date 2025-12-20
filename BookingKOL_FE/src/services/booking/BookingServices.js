import { get, post, update } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

const extractFileList = (files) => {
  if (!files) return [];
  if (files instanceof FileList) return Array.from(files);
  if (Array.isArray(files)) {
    return files.flatMap((item) => {
      if (item instanceof File || item instanceof Blob) return item;
      if (item?.file instanceof File || item?.file instanceof Blob) return item.file;
      if (item?.originFileObj) return item.originFileObj;
      return [];
    });
  }
  if (files instanceof File || files instanceof Blob) return [files];
  return [];
};

export const createBookingPackage = async (value) => {
  const data = {
    packageId: value.packageId,
    campaignName: value.campaignName,
    objective: value.objective,
    targetPrice: value.targetPrice,
    startDate: value.startDate,
    endDate: value.endDate,
    recurrencePattern: value.recurrencePattern,
    repeatType: value?.repeatType ?? undefined,
    livestreamHours: value?.livestreamHours ?? undefined,
    livestreamAddress: value?.livestreamAddress ?? undefined,
    permanentAddress: value?.permanentAddress ?? undefined,
    ordererFullName: value?.ordererFullName ?? undefined,
    ordererPhone: value?.ordererPhone ?? undefined,
    taxCode: value?.taxCode ?? undefined,
    liveIds: value?.liveIds ?? undefined,
    kolIds: value?.kolIds ?? undefined,
    attachments: value?.attachment ?? value?.attachments ?? undefined,
  };

  const formData = new FormData();

  formData.append("packageId", value.packageId);
  formData.append("campaignName", value.campaignName);
  formData.append("objective", value.objective);
  formData.append("targetPrice", value.targetPrice);
  formData.append("startDate", new Date(value.startDate).toISOString());
  formData.append("endDate", new Date(value.endDate).toISOString());
  formData.append("recurrencePattern", value.recurrencePattern ? "WEEKLY" : "");
  formData.append("repeatType", value.repeatType ?? "");
  if (value?.livestreamHours !== undefined && value?.livestreamHours !== null) {
    formData.append("livestreamHours", value.livestreamHours);
  }
  if (value?.livestreamAddress) {
    formData.append("livestreamAddress", value.livestreamAddress);
  }
  if (value?.permanentAddress) {
    formData.append("permanentAddress", value.permanentAddress);
  }
  if (value?.ordererFullName) {
    formData.append("ordererFullName", value.ordererFullName);
  }
  if (value?.ordererPhone) {
    formData.append("ordererPhone", value.ordererPhone);
  }
  if (value?.taxCode) {
    formData.append("taxCode", value.taxCode);
  }
  if (value?.liveIds) {
    formData.append("liveIds", value.liveIds);
  }
  if (value?.kolIds) {
    formData.append("kolIds", value.kolIds);
  }
  const filesToAppend = value?.attachment ?? value?.attachments;
  extractFileList(filesToAppend).forEach((file) => {
    formData.append("attachment", file);
  });

  return await post({
    url: CLIENT_API_PATHS.BOOKINGPACKAGE.createBookingPackage,
    data: formData,
  });
};

export const getHistoryBookingPackage = async ({
  page,
  size,
  filters = {},
} = {}) => {
  return await get({
    url: CLIENT_API_PATHS.BOOKINGPACKAGE.getHistoryBookingPackage,
    params: {
      page,
      size,
      ...(filters ?? {}),
    },
  });
};

export const getUserCampaignDetail = async (campaignId) => {
  if (!campaignId) {
    throw new Error("campaignId is required to fetch campaign detail");
  }

  return await get({
    url: CLIENT_API_PATHS.BOOKINGPACKAGE.getUserCampaignDetail(campaignId),
  });
};

export const signUserContract = async ({
  contractId,
  bookingRequestId,
} = {}) => {
  if (!contractId) {
    throw new Error("contractId is required to sign contract");
  }
  if (!bookingRequestId) {
    throw new Error("bookingRequestId is required to sign contract");
  }

  return update({
    url: `${CLIENT_API_PATHS.BOOKINGPACKAGE.signContract}/${encodeURIComponent(
      contractId
    )}`,
    data: {
      bookingRequestId,
    },
  });
};

export const rejectUserContract = async ({
  contractId,
  bookingRequestId,
  reason,
} = {}) => {
  if (!contractId) {
    throw new Error("contractId is required to reject contract");
  }
  if (!bookingRequestId) {
    throw new Error("bookingRequestId is required to reject contract");
  }
  const normalizedReason =
    typeof reason === "string" ? reason.trim() : reason ?? "";

  if (!normalizedReason) {
    throw new Error("reason is required to reject contract");
  }

  return update({
    url: `${
      CLIENT_API_PATHS.BOOKINGPACKAGE.rejectContract
    }/${encodeURIComponent(contractId)}`,
    data: {
      bookingRequestId,
      reason: normalizedReason,
    },
  });
};

export const cancelUserContract = async (bookingRequestId) => {
  if (!bookingRequestId) {
    throw new Error("bookingRequestId is required to cancel contract");
  }

  return post({
    url: `${
      CLIENT_API_PATHS.BOOKINGPACKAGE.cancelContract
    }/${encodeURIComponent(bookingRequestId)}`,
  });
};

export const cancelUserBookingRequest = async (bookingRequestId) => {
  if (!bookingRequestId) {
    throw new Error("bookingRequestId is required to cancel booking request");
  }

  return post({
    url: CLIENT_API_PATHS.BOOKINGPACKAGE.cancelBookingRequest(
      bookingRequestId
    ),
  });
};

export const initiateCampaignPayment = async (paymentScheduleId) => {
  if (!paymentScheduleId) {
    throw new Error("paymentScheduleId is required to create payment");
  }

  return post({
    url: CLIENT_API_PATHS.BOOKINGPACKAGE.initiateCampaignPayment(
      paymentScheduleId
    ),
  });
};

export const checkCampaignPaymentStatus = async (
  contractPaymentScheduleId
) => {
  if (!contractPaymentScheduleId) {
    throw new Error(
      "contractPaymentScheduleId is required to check payment status"
    );
  }

  return get({
    url: CLIENT_API_PATHS.BOOKINGPACKAGE.checkCampaignPaymentStatus(
      contractPaymentScheduleId
    ),
  });
};

export const getUserBookingStatus = async (bookingRequestId) => {
  if (!bookingRequestId) {
    throw new Error("bookingRequestId is required to fetch booking status");
  }

  return get({
    url: CLIENT_API_PATHS.BOOKINGPACKAGE.getUserBookingStatus(
      bookingRequestId
    ),
  });
};

export const completeUserWorkTime = async (workTimeId) => {
  if (!workTimeId) {
    throw new Error("workTimeId is required to complete work time");
  }

  return update({
    url: CLIENT_API_PATHS.BOOKINGPACKAGE.completeWorkTime(workTimeId),
  });
};
