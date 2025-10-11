import { useQuery } from "@tanstack/react-query";
import { getAllKol } from "../../../services/ManagementUserService";

export const useGetAllKol = (
  page,
  size,
  minBookingPrice,
  minRating,
  isAvailable
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
      isAvailable,
    ],
    queryFn: () =>
      getAllKol(page, size, minBookingPrice, minRating, isAvailable),
    retry: false,
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
