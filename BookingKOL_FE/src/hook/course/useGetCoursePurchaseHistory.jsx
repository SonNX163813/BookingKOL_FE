import { useQuery } from "@tanstack/react-query";
import { getCoursePurchaseHistory } from "../../services/course/CourseAPI";

export const useGetCoursePurchaseHistory = ({
  page = 0,
  size = 10,
  search,
  startDate,
  endDate,
} = {}) => {
  return useQuery({
    queryKey: [
      "coursePurchaseHistory",
      page,
      size,
      search ?? null,
      startDate ?? null,
      endDate ?? null,
    ],
    queryFn: ({ signal }) =>
      getCoursePurchaseHistory({
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

export default useGetCoursePurchaseHistory;
