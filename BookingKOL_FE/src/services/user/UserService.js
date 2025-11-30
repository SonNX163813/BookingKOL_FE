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

export const updateMyUserProfile = async ({ data, config } = {}) => {
  const response = await patch({
    url: CLIENT_API_PATHS.USER.updateProfile,
    data,
    config,
  });
  return response?.data ?? response ?? null;
};

export const createKolFeedback = async ({
  contractId,
  data,
  config,
} = {}) => {
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

export const updateKolFeedback = async ({
  feedbackId,
  data,
  config,
} = {}) => {
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
