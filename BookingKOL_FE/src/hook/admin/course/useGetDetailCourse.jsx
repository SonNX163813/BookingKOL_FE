import { useQuery } from "@tanstack/react-query";
import { getDetailCourse } from "../../../services/CourseServices";

export const useGetDetailCourse = (id) => {
  const {
    isPending: isLoadingGetDetailCourse,
    data: ResponseGetDetailCourse,
    refetch,
  } = useQuery({
    queryKey: ["useGetDetailCourse", id],
    queryFn: () => getDetailCourse(id),
    enabled: !!id,
    retry: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  return {
    isLoadingGetDetailCourse,
    ResponseGetDetailCourse,
    refetchDetailCourse: refetch,
  };
};
