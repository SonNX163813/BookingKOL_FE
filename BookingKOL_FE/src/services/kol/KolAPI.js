import { BASE_URL } from "../../utils/config";

const KOL_PROFILES_BASE = `${BASE_URL}/kol-profiles`;
const KOL_PROFILES_ENDPOINT = `${KOL_PROFILES_BASE}/all-available`;

const parseJsonSafely = async (response) => {
  const rawText = await response.text();

  if (!rawText) {
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch (error) {
    console.error("Failed to parse KOL API response", error);
    throw new Error("Failed to parse server response");
  }
};

const ensureSuccess = async (response) => {
  if (response.ok) {
    return response;
  }

  let message = `Request failed with status ${response.status}`;

  try {
    const payload = await parseJsonSafely(response);
    const payloadMessage = Array.isArray(payload?.message)
      ? payload.message.join(" ")
      : payload?.message;

    if (payloadMessage) {
      message = payloadMessage;
    }
  } catch (error) {
    console.error("Failed to read error payload", error);
  }

  throw new Error(message);
};

export const getKolProfiles = async ({ signal } = {}) => {
  const response = await fetch(KOL_PROFILES_ENDPOINT, { signal });
  await ensureSuccess(response);

  const payload = await parseJsonSafely(response);
  const { data } = payload ?? {};

  return Array.isArray(data) ? data : [];
};

export const getKolProfileById = async (kolId, { signal } = {}) => {
  if (!kolId) {
    throw new Error("kolId is required");
  }

  const response = await fetch(`${KOL_PROFILES_BASE}/kol-id/${kolId}`, {
    signal,
  });
  await ensureSuccess(response);

  const payload = await parseJsonSafely(response);
  return payload?.data ?? null;
};
