// src/services/kol/KolCampaignWorktimeAPI.js
import { get } from "../../config/axios-config";
import { CLIENT_API_PATHS } from "../../constants/apiPathClient";

const normalizePage = (payload, fallbackPage = 0, fallbackSize = 20) => {
  const raw = payload?.data;
  const data = raw?.data ?? raw;

  const content = Array.isArray(data?.content)
    ? data.content
    : Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
    ? data.items
    : [];

  const total =
    typeof data?.totalElements === "number"
      ? data.totalElements
      : typeof data?.total === "number"
      ? data.total
      : Array.isArray(data)
      ? data.length
      : content.length;

  const page =
    typeof data?.page === "number"
      ? data.page
      : typeof data?.number === "number"
      ? data.number
      : fallbackPage;

  const size =
    typeof data?.size === "number"
      ? data.size
      : Number.isFinite(Number(fallbackSize))
      ? Number(fallbackSize)
      : 20;

  const normalized = { content, totalElements: total, page, size };
  const obj =
    data && typeof data === "object" && !Array.isArray(data) ? data : {};

  return { ...obj, ...normalized, data: { ...obj, ...normalized } };
};

export const getKolCampaignWorktimes = async ({
  kolId,
  params,
  signal,
} = {}) => {
  if (!kolId) throw new Error("kolId is required");

  const payload = await get({
    url: CLIENT_API_PATHS.BOOKING.kolCampaignWorktimes(kolId),
    params: params ?? { page: 0, size: 20 },
    config: signal ? { signal } : undefined,
  });

  const fallbackPage = typeof params?.page === "number" ? params.page : 0;
  const fallbackSize = typeof params?.size === "number" ? params.size : 20;
  return normalizePage(payload, fallbackPage, fallbackSize);
};
