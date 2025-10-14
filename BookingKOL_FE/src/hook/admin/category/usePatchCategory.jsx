import { useMutation } from "@tanstack/react-query";
import { patchCategory } from "../../../services/CategoryServices";
import { toast } from "react-toastify";

export const usePatchCategory = (onSuccessCallBack) => {
  const {
    isPending: isLoadingPatchCategory,
    mutateAsync: handlePatchCategoryMutation,
  } = useMutation({
    mutationKey: ["usePatchCategory"],
    mutationFn: patchCategory,
    onError: (err) => {
      toast.error(err.message || "Có lỗi xảy ra vui lòng thử lại sau ít phút.");
    },
    onSuccess: (data) => {
      toast.success(data?.message?.[0] || "Cập nhật category thành công.");
      onSuccessCallBack?.();
    },
  });

  const handlePatchCategory = (value) => {
    handlePatchCategoryMutation(value);
  };

  return {
    isLoadingPatchCategory,
    handlePatchCategory,
  };
};
