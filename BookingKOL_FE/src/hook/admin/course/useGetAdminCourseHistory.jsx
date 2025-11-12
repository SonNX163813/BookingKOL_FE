import { useQuery } from "@tanstack/react-query";
import { getAdminCourseHistory } from "../../../services/admin/AdminCourseHistoryAPI";

export const useGetAdminCourseHistory = ({
  page = 0,
  size = 10,
  search,
  startDate,
  endDate,
} = {}) => {
  return useQuery({
    queryKey: [
      "adminCourseHistory",
      page,
      size,
      search ?? null,
      startDate ?? null,
      endDate ?? null,
    ],
    queryFn: ({ signal }) =>
      getAdminCourseHistory({
        page,
        size,
        search,
        startDate,
        endDate,
        signal,
      }),
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });
};

export default useGetAdminCourseHistory;
