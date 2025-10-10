import { useQuery } from "@tanstack/react-query";
import { getAllBrands } from "../../../services/ManagementUserService";

export const useGetAllBrands = (page, size, search) => {
  const {
    isPending: isLoadingGetAllBrands,
    data: ResponseGetAllBrands,
    refetch: refetchGetAllBrands,
  } = useQuery({
    queryKey: ["useGetAllBrands", page, size, search],
    queryFn: () => getAllBrands(page, size, search),
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  return {
    isLoadingGetAllBrands,
    ResponseGetAllBrands,
    refetchGetAllBrands,
  };
};
