import { useQuery } from "@tanstack/react-query";

import { getUserCampaignDetail } from "../../services/booking/BookingServices";

export const useGetCampaignBookingDetail = (
  campaignId,
  queryOptions = {}
) => {
  const {
    isPending: isGettingCampaignDetail,
    isFetching: isFetchingCampaignDetail,
    error: campaignDetailError,
    data: campaignDetailResponse,
    refetch: refetchCampaignDetail,
  } = useQuery({
    queryKey: ["useGetCampaignBookingDetail", campaignId],
    queryFn: () => getUserCampaignDetail(campaignId),
    enabled: Boolean(campaignId),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    ...queryOptions,
  });

  return {
    isGettingCampaignDetail,
    isFetchingCampaignDetail,
    campaignDetailError,
    campaignDetailResponse,
    refetchCampaignDetail,
  };
};

