import { useQuery } from "@tanstack/react-query";
import { getLogChatAI } from "../../services/AIServices";

export const useGetLogChatAI = () => {
  const { isPending: isLoadingGetLogChatAI, data: ResponseGetLogChatAI } =
    useQuery({
      queryKey: ["useGetLogChatAI"],
      queryFn: getLogChatAI,
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
