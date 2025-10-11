import { useQuery } from "@tanstack/react-query";
import { getAdminViewProfileUserId } from "../../../services/ManagementUserService";

export const useAdminGetViewProfileUser = (id) => {
  const {
    isPending: isLoadingGetViewProfileUser,
    data: ResponseGetViewProfileUser,
  } = useQuery({
    queryKey: ["useAdminGetViewProfileUser", id],
    queryFn: () => getAdminViewProfileUserId(id),
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  return {
    isLoadingGetViewProfileUser,
    ResponseGetViewProfileUser,
  };
};
