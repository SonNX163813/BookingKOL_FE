import { useQuery } from "@tanstack/react-query";
import { getMySingleBookingRequestDetail } from "../../../services/booking/BookingRequestUserService";

export const useGetMySingleBookingRequestDetail = (requestId, options = {}) => {
  const query = useQuery({
    queryKey: [
      "user",
      "single-booking-requests",
      "detail",
      requestId ?? null,
    ],
    queryFn: () => getMySingleBookingRequestDetail(requestId),
    enabled: Boolean(requestId),
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    ...options,
  });

  return {
    isLoadingMyBookingRequestDetail: query.isPending,
    isFetchingMyBookingRequestDetail: query.isFetching,
    myBookingRequestDetailResponse: query.data,
    refetchMyBookingRequestDetail: query.refetch,
    myBookingRequestDetailError: query.error,
  };
};
