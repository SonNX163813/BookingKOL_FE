import { patch, post } from "../../config/axios-config";
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
