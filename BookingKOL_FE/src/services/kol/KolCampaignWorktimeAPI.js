// src/services/kol/KolCampaignWorktimeAPI.js
import { get } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

/**
 * ✅ GET /v1/kol/requests/worktime/campaign-worktimes/{kolId}
 * Response thường là list hoặc dạng page (content/totalElements)
 */
export async function getKolCampaignWorktimes(kolId, { params, signal } = {}) {
  if (!kolId) throw new Error("kolId is required");

  const url =
    CLIENT_API_PATHS?.BOOKING?.kolCampaignWorktimes?.(kolId) ||
    `/v1/kol/requests/worktime/campaign-worktimes/${encodeURIComponent(kolId)}`;

  return get(url, { params, signal });
}
