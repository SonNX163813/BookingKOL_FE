import { post, get } from "../config/axios-config";
import { API_PATHS } from "../constants/apiPath";

export const postCallSendAI = async ({ question }) => {
  return await post({
    url: API_PATHS.AI.chatAI,
    data: {
      question,
    },
  });
};

export const getLogChatAI = async (
  page,
  size,
  search,
  startDate,
  endDate,
  sort
) => {
  return await get({
    url: API_PATHS.AI.getLogChat,
    params: {
      page,
      size,
      search: search ?? null,
      startDate: startDate ?? null,
      endDate: endDate ?? null,
      sort: sort ?? null,
    },
  });
};
