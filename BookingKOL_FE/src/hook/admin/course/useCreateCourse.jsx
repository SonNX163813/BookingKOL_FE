import { useMutation } from "@tanstack/react-query";
import { createCourse } from "../../../services/CourseServices";
import { toast } from "react-toastify";

export const useCreateCourse = (onSuccessCallBack) => {
  const {
    isPending: isLoadingCreateCourse,
    mutateAsync: createCourseMutation,
  } = useMutation({
    mutationKey: ["useCreateCourse"],
    mutationFn: createCourse,
    onError: (err) => {
      toast.error(err.message || "Có lỗi xảy ra, vui lòng thử lại sau.");
    },
    onSuccess: () => {
      toast.success("Tạo khóa học thành công!");
      onSuccessCallBack?.();
    },
  });

  const handleCreateCourse = async (values) => {
    await createCourseMutation(values);
  };

  return {
    isLoadingCreateCourse,
    handleCreateCourse,
  };
};
