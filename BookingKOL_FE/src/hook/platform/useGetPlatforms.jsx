import { useQuery } from "@tanstack/react-query";
import { getAllPlatforms } from "../../services/platform/PlatformAPI";

export const useGetPlatforms = () => {
  const query = useQuery({
    queryKey: ["platforms", "all"],
    queryFn: () => getAllPlatforms({}),
    staleTime: 1000 * 60 * 60, // cache for 1 hour
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    platforms: query.data ?? [],
    isLoadingPlatforms: query.isPending,
    isFetchingPlatforms: query.isFetching,
    refetchPlatforms: query.refetch,
    platformsError: query.error ?? null,
  };
};

export default useGetPlatforms;
