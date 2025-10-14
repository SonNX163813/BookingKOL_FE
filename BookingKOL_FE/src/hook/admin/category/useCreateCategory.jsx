import { useMutation } from "@tanstack/react-query";
import { createCategory } from "../../../services/CategoryServices";
import { toast } from "react-toastify";

export const useCreateCategory = (onSuccessCallBack) => {
  const {
    isPending: isLoadingCreateCategory,
    mutateAsync: handleCreateCategoryMutation,
  } = useMutation({
    mutationKey: ["useCreateCategory"],
    mutationFn: createCategory,
    onError: (err) => {
      toast.error(err.message || "Có lỗi xảy ra vui lòng thử lại sau ít phút.");
    },
    onSuccess: (data) => {
      toast.success(data?.message?.[0] || "Tạo category thành công.");
      onSuccessCallBack?.();
    },
  });

  const handleCreateCategory = (value) => {
    handleCreateCategoryMutation(value);
  };

  return {
    isLoadingCreateCategory,
    handleCreateCategory,
  };
};
