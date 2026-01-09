import { get, patch, post } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

export const changeMyPassword = async ({ data, config } = {}) => {
  const response = await post({
    url: CLIENT_API_PATHS.AUTH.changePassword,
    data,
    config,
  });
  return response?.data ?? response ?? null;
};

export const getMyUserProfile = async ({ signal } = {}) => {
  const config = signal ? { signal } : undefined;
  const response = await get({
    url: CLIENT_API_PATHS.USER.profile,
    config,
  });
  return response?.data ?? response ?? null;
};

export const updateMyUserProfile = async ({
  data,
  fileAvatar,
  config,
} = {}) => {
  const formData = new FormData();

  // JSON request
  formData.append(
    "request",
    new Blob([JSON.stringify(data)], {
      type: "application/json",
    })
  );

  // Avatar (chỉ ảnh)
  if (fileAvatar instanceof File) {
    if (!fileAvatar.type.startsWith("image/")) {
      throw new Error("fileAvatar phải là hình ảnh");
    }
    formData.append("fileAvatar", fileAvatar);
  }

  const response = await patch({
    url: CLIENT_API_PATHS.USER.updateProfile,
    data: formData,
    config: {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      ...config,
    },
  });

  return response?.data ?? response ?? null;
};

export const createKolFeedback = async ({ contractId, data, config } = {}) => {
  if (!contractId) {
    throw new Error("contractId is required to create KOL feedback");
  }

  const response = await post({
    url: CLIENT_API_PATHS.USER.feedbacks.create(contractId),
    data,
    config,
  });
  return response?.data ?? response ?? null;
};

export const updateKolFeedback = async ({ feedbackId, data, config } = {}) => {
  if (!feedbackId) {
    throw new Error("feedbackId is required to update KOL feedback");
  }

  const response = await patch({
    url: CLIENT_API_PATHS.USER.feedbacks.update(feedbackId),
    data,
    config,
  });
  return response?.data ?? response ?? null;
};

export const getKolFeedbackDetail = async ({ feedbackId, signal } = {}) => {
  if (!feedbackId) {
    throw new Error("feedbackId is required to fetch KOL feedback detail");
  }

  const config = signal ? { signal } : undefined;
  const response = await get({
    url: CLIENT_API_PATHS.USER.feedbacks.detail(feedbackId),
    config,
  });
  return response?.data ?? response ?? null;
};
