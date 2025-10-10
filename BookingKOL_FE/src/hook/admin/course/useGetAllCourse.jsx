import { useQuery } from "@tanstack/react-query";
import { getAllCourse } from "../../../services/CourseServices";

export const useGetAllCourse = (
  page,
  size,
  minPrice,
  maxPrice,
  minDiscount,
  maxDiscount,
  sortBy,
  sortDir
) => {
  const {
    isPending: isLoadingGetAllCourse,
    data: ResponseGetAllCourse,
    refetch: refetchGetAllCourse,
  } = useQuery({
    queryKey: [
      "useGetAllCourse",
      page,
      size,
      minPrice,
      maxPrice,
      minDiscount,
      maxDiscount,
      sortBy,
      sortDir,
    ],
    queryFn: () =>
      getAllCourse(
        page,
        size,
        minPrice,
        maxPrice,
        minDiscount,
        maxDiscount,
        sortBy,
        sortDir
      ),
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  return {
    isLoadingGetAllCourse,
    ResponseGetAllCourse,
    refetchGetAllCourse,
  };
};
