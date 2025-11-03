import { useQuery } from "@tanstack/react-query";
import { getAllRefundRequests } from "../../../services/booking/RefundAdminService";

export const useGetRefundRequests = (filters = {}) => {
  const { page = 0, size = 10, status } = filters;

  const query = useQuery({
    queryKey: ["admin", "refunds", page, size, status ?? null],
    queryFn: () =>
      getAllRefundRequests({
        page,
        size,
        status,
      }),
    retry: false,
    keepPreviousData: true,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  return {
    refundsResponse: query.data,
    isLoadingRefunds: query.isPending,
    isFetchingRefunds: query.isFetching,
    refetchRefunds: query.refetch,
    errorRefunds: query.error,
  };
};
