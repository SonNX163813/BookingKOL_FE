import { useMutation } from "@tanstack/react-query";
import { deleteCategoryById } from "../../../services/CategoryServices";
import { toast } from "react-toastify";
import { useState } from "react";

export const useRemoveCategory = (onSuccessCallBack) => {
  const [idCategoryRemove, setIsCategoryRemove] = useState(null);
  const {
    isPending: isLoadingRemoveCategory,
    mutateAsync: useRemoveCategoryMutation,
  } = useMutation({
    mutationKey: ["useRemoveCategory"],
    mutationFn: deleteCategoryById,
    onError: (err) => {
      toast.error(
        err.message || "Có lỗi xảy ra vui lòng quay lại sau ít phút."
      );
    },
    onSuccess: () => {
      toast.success("Thay đổi trạng thái thành công.");
      onSuccessCallBack?.();
      setIsCategoryRemove(null);
    },
  });

  const handleUpdateStatus = (id) => {
    setIsCategoryRemove(id);
    useRemoveCategoryMutation(id);
  };

  return {
    isLoadingRemoveCategory,
    handleUpdateStatus,
    idCategoryRemove,
  };
};
