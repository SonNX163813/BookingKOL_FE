import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";
import { getMySingleBookingRequests } from "../../../services/booking/BookingRequestUserService";

export const useGetMySingleBookingRequests = (filters = {}) => {
  const auth = useAuth();
  const userId = auth?.user?.id ?? null;
  const hasToken = Boolean(auth?.token);

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
      "user",
      "single-booking-requests",
      userId,
      page,
      size,
      status ?? null,
      startAt ?? null,
      endAt ?? null,
      createdAtFrom ?? null,
      createdAtTo ?? null,
    ],
    queryFn: () =>
      getMySingleBookingRequests({
        page,
        size,
        status,
        startAt,
        endAt,
        createdAtFrom,
        createdAtTo,
      }),
    keepPreviousData: true,
    retry: false,
    enabled: hasToken && Boolean(userId),
    refetchOnMount: "always",
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  return {
    isLoadingMyBookingRequests: query.isPending,
    isFetchingMyBookingRequests: query.isFetching,
    myBookingRequestsResponse: query.data,
    refetchMyBookingRequests: query.refetch,
    myBookingRequestsError: query.error,
  };
};
