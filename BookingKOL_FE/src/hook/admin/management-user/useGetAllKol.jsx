import { useQuery } from "@tanstack/react-query";
import { getAllKol } from "../../../services/ManagementUserService";

export const useGetAllKol = (
  page,
  size,
  minBookingPrice,
  minRating,
  nameKeyword // ✅ đổi từ isAvailable -> nameKeyword
) => {
  const {
    isPending: isLoadingGetALlKol,
    data: ResponseGetAllKol,
    refetch: refetchGetAllKol,
  } = useQuery({
    queryKey: [
      "useGetAllKol",
      page,
      size,
      minBookingPrice,
      minRating,
      nameKeyword, // ✅
    ],
    queryFn: () =>
      getAllKol(page, size, minBookingPrice, minRating, nameKeyword), // ✅
    retry: false,
    enabled: false,
    keepPreviousData: true,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  return {
    isLoadingGetALlKol,
    ResponseGetAllKol,
    refetchGetAllKol,
  };
};
