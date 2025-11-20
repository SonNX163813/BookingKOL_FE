import { useQuery } from "@tanstack/react-query";
import { getHistoryBookingPackage } from "../../services/booking/BookingServices";

export const useGetHistoryBookingBackage = (page, size, filters = {}) => {
  const {
    isPending: isGetHistoryBookingBackage,
    data: ResponseGetHistoryBookingPackage,
    refetch: refetchHistoryBookingPackage,
  } = useQuery({
    queryKey: ["useGetHistoryBookingBackage", page, size, filters],
    queryFn: () => getHistoryBookingPackage({ page, size, filters }),
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  return {
    isGetHistoryBookingBackage,
    ResponseGetHistoryBookingPackage,
    refetchHistoryBookingPackage,
  };
};
