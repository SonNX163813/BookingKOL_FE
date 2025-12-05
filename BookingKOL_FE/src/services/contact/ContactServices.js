import { post } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

const normalizeString = (value) =>
  typeof value === "string" ? value.trim() : value ?? "";

export const submitClientContact = async (payload = {}) => {
  const data = {
    name: normalizeString(payload.name),
    email: normalizeString(payload.email),
    phone: normalizeString(payload.phone),
    service: normalizeString(payload.service),
    note: normalizeString(payload.note || payload.message),
  };

  if (!data.name || !data.email || !data.phone || !data.service) {
    throw new Error("Missing required lead contact fields");
  }

  return post({
    url: CLIENT_API_PATHS.CONTACT.lead,
    data,
    config: { skipSuccessToast: true },
  });
};

export const submitKolContact = async (payload = {}) => {
  const followerCount =
    payload.followerCount === "" || payload.followerCount === undefined
      ? 0
      : Number(payload.followerCount);

  if (!Number.isFinite(followerCount)) {
    throw new Error("Follower count must be a number");
  }

  const data = {
    name: normalizeString(payload.name),
    major: normalizeString(payload.major),
    platform: normalizeString(payload.platform),
    experience: normalizeString(payload.experience),
    followerCount,
  };

  if (!data.name || !data.major || !data.platform || !data.experience) {
    throw new Error("Missing required KOL contact fields");
  }

  return post({
    url: CLIENT_API_PATHS.CONTACT.kol,
    data,
    config: { skipSuccessToast: true },
  });
};
