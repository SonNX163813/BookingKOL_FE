import { useQuery } from "@tanstack/react-query";
import { getAllBookingRequests } from "../../../services/booking/BookingRequestAdminService";

export const useGetAllBookingRequests = (filters = {}) => {
  const {
    page = 0,
    size = 20,
    status,
    startAt,
    endAt,
    createdAtFrom,
    createdAtTo,
  } = filters;

  const query = useQuery({
    queryKey: [
      "admin",
      "booking-requests",
      page,
      size,
      status ?? null,
      startAt ?? null,
      endAt ?? null,
      createdAtFrom ?? null,
      createdAtTo ?? null,
    ],
    queryFn: () =>
      getAllBookingRequests({
        page,
        size,
        status,
        startAt,
        endAt,
        createdAtFrom,
        createdAtTo,
      }),
    retry: false,
    keepPreviousData: true,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  return {
    isLoadingBookingRequests: query.isPending,
    isFetchingBookingRequests: query.isFetching,
    bookingRequestsResponse: query.data,
    refetchBookingRequests: query.refetch,
    errorBookingRequests: query.error,
  };
};
