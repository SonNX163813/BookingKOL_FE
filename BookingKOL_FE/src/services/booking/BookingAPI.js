import { post } from "../../config/axios-config";
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
  formData.append(
    "bookingSingleReqDTO",
    JSON.stringify(bookingSingleReqDTO ?? {})
  );

  return post({
    url: CLIENT_API_PATHS.BOOKING.createSingle,
    data: formData,
    config: {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  });
};

