import { useQuery } from "@tanstack/react-query";
import { getLogChatAI } from "../../services/AIServices";

export const useGetLogChatAI = (
  page,
  size,
  search,
  startDate,
  endDate,
  sort
) => {
  const { isPending: isLoadingGetLogChatAI, data: ResponseGetLogChatAI } =
    useQuery({
      queryKey: [
        "useGetLogChatAI",
        page,
        size,
        search,
        startDate,
        endDate,
        sort,
      ],
      queryFn: () => getLogChatAI(page, size, search, startDate, endDate, sort),
      retry: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    });

  return {
    isLoadingGetLogChatAI,
    ResponseGetLogChatAI,
  };
};
