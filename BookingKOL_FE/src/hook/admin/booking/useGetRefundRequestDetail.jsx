import { useQuery } from "@tanstack/react-query";
import { getRefundRequestDetail } from "../../../services/booking/RefundAdminService";

export const useGetRefundRequestDetail = (refundId, options = {}) => {
  const query = useQuery({
    queryKey: ["admin", "refunds", "detail", refundId ?? null],
    queryFn: () => getRefundRequestDetail(refundId),
    enabled: Boolean(refundId),
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    ...options,
  });

  return {
    refundDetailResponse: query.data,
    isLoadingRefundDetail: query.isPending,
    isFetchingRefundDetail: query.isFetching,
    refetchRefundDetail: query.refetch,
    errorRefundDetail: query.error,
  };
};
