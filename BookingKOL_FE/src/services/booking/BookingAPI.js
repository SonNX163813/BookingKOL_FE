import { get, patch, post, remove2 } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

const extractFileList = (files) => {
  if (!files) {
    return [];
  }
  if (files instanceof FileList) {
    return Array.from(files);
  }
  if (Array.isArray(files)) {
    return files.flatMap((item) => {
      if (item instanceof File || item instanceof Blob) {
        return item;
      }
      if (item?.file instanceof File || item?.file instanceof Blob) {
        return item.file;
      }
      return [];
    });
  }
  if (files instanceof File || files instanceof Blob) {
    return [files];
  }
  return [];
};

export const createSingleBooking = async ({
  bookingSingleReqDTO,
  attachedFiles,
} = {}) => {
  if (!bookingSingleReqDTO) {
    throw new Error("bookingSingleReqDTO is required");
  }

  const formData = new FormData();
  extractFileList(attachedFiles).forEach((file) => {
    formData.append("attachedFiles", file);
  });
  const bookingJson = JSON.stringify(bookingSingleReqDTO ?? {});
  const bookingBlob = new Blob([bookingJson], {
    type: "application/json",
  });
  formData.append("bookingSingleReqDTO", bookingBlob);

  return post({
    url: CLIENT_API_PATHS.BOOKING.createSingle,
    data: formData,
  });
};

export const confirmSingleBookingRequest = async ({ requestId } = {}) => {
  if (!requestId) {
    throw new Error("requestId is required to confirm single booking request");
  }

  return post({
    url: `${CLIENT_API_PATHS.BOOKING.confirmSingleRequest}/${requestId}`,
  });
};

export const cancelSingleBookingRequestById = async ({ requestId } = {}) => {
  if (!requestId) {
    throw new Error("requestId is required to cancel single booking request");
  }

  return patch({
    url: `${CLIENT_API_PATHS.BOOKING.cancelSingleRequest}/${requestId}`,
  });
};

export const cancelSingleBookingPayment = async ({ requestId } = {}) => {
  if (!requestId) {
    throw new Error("requestId is required to cancel single booking payment");
  }
  return patch({
    url: `${CLIENT_API_PATHS.BOOKING.cancelSinglePayment}/${requestId}`,
  });
};

export const continueSingleBookingPayment = async ({ requestId } = {}) => {
  if (!requestId) {
    throw new Error("requestId is required to continue single booking payment");
  }
  return post({
    url: `${CLIENT_API_PATHS.BOOKING.continueSinglePayment}/${requestId}`,
  });
};

export const holdBookingSlot = async ({
  kolId,
  startTimeIso,
  endTimeIso,
} = {}) => {
  if (!kolId || !startTimeIso || !endTimeIso) {
    throw new Error("kolId, startTimeIso and endTimeIso are required");
  }

  return post({
    url: CLIENT_API_PATHS.BOOKING.holdSlot,
    data: {
      kolId,
      startTimeIso,
      endTimeIso,
    },
  });
};

export const releaseBookingSlot = async ({
  kolId,
  startTimeIso,
  endTimeIso,
} = {}) => {
  if (!kolId || !startTimeIso || !endTimeIso) {
    throw new Error("kolId, startTimeIso and endTimeIso are required");
  }

  return remove2({
    url: CLIENT_API_PATHS.BOOKING.releaseSlot,
    data: {
      kolId,
      startTimeIso,
      endTimeIso,
    },
  });
};

export const getHeldBookingSlots = async ({ kolId, signal } = {}) => {
  if (!kolId) {
    throw new Error("kolId is required to fetch held booking slots");
  }

  const payload = await get({
    url: CLIENT_API_PATHS.BOOKING.listHoldSlot(kolId),
    config: signal ? { signal } : undefined,
  });

  const extractList = (data) => {
    const candidates = [
      data?.data?.data,
      data?.data?.content,
      data?.data?.items,
      data?.data?.records,
      data?.data,
      data,
    ];
    return candidates.find((item) => Array.isArray(item)) || [];
  };

  const toIso = (value) => {
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number" && Number.isFinite(value)) {
      return new Date(value).toISOString();
    }
    return null;
  };

  const normalizeUserId = (value) =>
    typeof value === "string" && value.trim() ? value.trim() : null;

  const rawData = extractList(payload);

  return rawData
    .map((item) => ({
      userId:
        normalizeUserId(item?.userId) ??
        normalizeUserId(item?.user_id) ??
        normalizeUserId(item?.userID) ??
        null,
      startAt:
        toIso(item?.startAt) ??
        toIso(item?.start_at) ??
        toIso(item?.start_time) ??
        null,
      endAt:
        toIso(item?.endAt) ??
        toIso(item?.end_at) ??
        toIso(item?.end_time) ??
        null,
    }))
    .filter((slot) => slot.startAt && slot.endAt);
};

export const updateSingleBookingRequest = async ({
  requestId,
  updateBookingReqDTO,
  attachedFiles,
  fileIdsToDelete,
} = {}) => {
  if (!requestId) {
    throw new Error("requestId is required to update single booking request");
  }

  const formData = new FormData();

  extractFileList(attachedFiles).forEach((file) => {
    formData.append("attachedFiles", file);
  });

  if (updateBookingReqDTO !== undefined && updateBookingReqDTO !== null) {
    const bookingJson = JSON.stringify(updateBookingReqDTO);
    const bookingBlob = new Blob([bookingJson], {
      type: "application/json",
    });
    formData.append("updateBookingReqDTO", bookingBlob);
  }

  const idsToDelete = Array.isArray(fileIdsToDelete)
    ? fileIdsToDelete
    : fileIdsToDelete
    ? [fileIdsToDelete]
    : [];

  idsToDelete
    .filter((id) => typeof id === "string" && id.trim().length > 0)
    .forEach((id) => {
      formData.append("fileIdsToDelete", id);
    });

  return patch({
    url: `${CLIENT_API_PATHS.BOOKING.updateMySingleRequest}/${requestId}`,
    data: formData,
  });
};

export const cancelSingleBookingRequest = async ({
  requestId,
  cancelReason,
  bankName,
  bankNumber,
  bankShortName,
  ownerName,
  reason,
} = {}) => {
  if (!requestId) {
    throw new Error("requestId is required to cancel single booking request");
  }

  const payload =
    typeof cancelReason === "string" && cancelReason.trim().length > 0
      ? { cancelReason: cancelReason.trim() }
      : typeof cancelReason === "object" && cancelReason !== null
      ? cancelReason
      : null;

  const data = {
    ...(payload ?? {}),
  };

  const normalizedOwnerName =
    typeof ownerName === "string" && ownerName.trim().length > 0
      ? ownerName.trim()
      : typeof data.ownerName === "string" && data.ownerName.trim().length > 0
      ? data.ownerName.trim()
      : "";

  if (!normalizedOwnerName) {
    throw new Error("ownerName is required to cancel single booking request");
  }

  if (normalizedOwnerName.length > 255) {
    throw new Error("ownerName must not exceed 255 characters");
  }

  data.ownerName = normalizedOwnerName;

  const normalizedReasonCandidate =
    typeof reason === "string" && reason.trim().length > 0
      ? reason.trim()
      : typeof data.reason === "string" && data.reason.trim().length > 0
      ? data.reason.trim()
      : typeof data.cancelReason === "string" &&
        data.cancelReason.trim().length > 0
      ? data.cancelReason.trim()
      : "";

  if (!normalizedReasonCandidate) {
    throw new Error("reason is required to cancel single booking request");
  }

  if (normalizedReasonCandidate.length > 1000) {
    throw new Error("reason must not exceed 1000 characters");
  }

  data.reason = normalizedReasonCandidate;
  delete data.cancelReason;

  const normalizedBankName =
    typeof bankName === "string" && bankName.trim().length > 0
      ? bankName.trim()
      : "";

  const normalizedBankShortName =
    typeof bankShortName === "string" && bankShortName.trim().length > 0
      ? bankShortName.trim()
      : "";

  if (normalizedBankName) {
    data.bankName = normalizedBankShortName
      ? `${normalizedBankShortName} - ${normalizedBankName}`
      : normalizedBankName;
  }

  if (typeof bankNumber === "string" && bankNumber.trim().length > 0) {
    data.bankNumber = bankNumber.trim();
  }

  return post({
    url: `${CLIENT_API_PATHS.BOOKING.cancelMySingleRequest}/${requestId}`,
    data,
  });
};

export const getKolFreeTimeSlots = async ({ kolId, signal } = {}) => {
  if (!kolId) {
    throw new Error("kolId is required to fetch KOL free time slots");
  }

  const payload = await get({
    url: CLIENT_API_PATHS.SCHEDULE_KOL_FREETIME.kolFreeTime(kolId),
    config: signal ? { signal } : undefined,
  });

  const rawData = Array.isArray(payload?.data) ? payload.data : [];

  return rawData
    .map((item) => ({
      startAt:
        typeof item?.startAt === "string"
          ? item.startAt
          : typeof item?.start_at === "string"
          ? item.start_at
          : null,
      endAt:
        typeof item?.endAt === "string"
          ? item.endAt
          : typeof item?.end_at === "string"
          ? item.end_at
          : null,
    }))
    .filter((slot) => slot.startAt && slot.endAt);
};
