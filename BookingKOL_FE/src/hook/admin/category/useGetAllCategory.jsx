import { useQuery } from "@tanstack/react-query";
import { getAllCategory } from "../../../services/CategoryServices";

export const useGetAllCategory = () => {
  const {
    isPending: isLoadingGetAllCategory,
    data: ResponseGetAllCategory,
    refetch: refetchGetAllCategory,
  } = useQuery({
    queryKey: ["useGetAllCategory"],
    queryFn: getAllCategory,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  return {
    isLoadingGetAllCategory,
    ResponseGetAllCategory,
    refetchGetAllCategory,
  };
};
