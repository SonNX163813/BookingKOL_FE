import { useQuery } from "@tanstack/react-query";
import { getHistoryBookingPackage } from "../../services/booking/BookingServices";

export const useGetHistoryBookingBackage = (page, size) => {
  const {
    isPending: isGetHistoryBookingBackage,
    data: ResponseGetHistoryBookingPackage,
  } = useQuery({
    queryKey: ["useGetHistoryBookingBackage", page, size],
    queryFn: () => getHistoryBookingPackage(page, size),
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  return {
    isGetHistoryBookingBackage,
    ResponseGetHistoryBookingPackage,
  };
};
