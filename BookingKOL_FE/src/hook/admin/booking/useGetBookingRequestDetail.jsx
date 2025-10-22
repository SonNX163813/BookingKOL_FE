import { useQuery } from "@tanstack/react-query";
import { getBookingRequestDetail } from "../../../services/booking/BookingRequestAdminService";

export const useGetBookingRequestDetail = (requestId, options = {}) => {
  const query = useQuery({
    queryKey: ["admin", "booking-requests", "detail", requestId ?? null],
    queryFn: () => getBookingRequestDetail(requestId),
    enabled: Boolean(requestId),
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    ...options,
  });

  return {
    isLoadingBookingRequestDetail: query.isPending,
    isFetchingBookingRequestDetail: query.isFetching,
    bookingRequestDetailResponse: query.data,
    refetchBookingRequestDetail: query.refetch,
    errorBookingRequestDetail: query.error,
  };
};
