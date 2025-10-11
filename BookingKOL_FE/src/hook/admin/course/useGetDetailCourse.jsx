import { useQuery } from "@tanstack/react-query";
import { getDetailCourse } from "../../../services/CourseServices";

export const useGetDetailCourse = (id) => {
  const { isPending: isLoadingGetDetailCourse, data: ResponseGetDetailCourse } =
    useQuery({
      queryKey: ["useGetDetailCourse", id],
      queryFn: () => getDetailCourse(id),
      retry: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    });

  return {
    isLoadingGetDetailCourse,
    ResponseGetDetailCourse,
  };
};
