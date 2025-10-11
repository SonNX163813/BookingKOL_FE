import { useMutation } from "@tanstack/react-query";
import { patchAdminUpdateStatusAccount } from "../../../services/ManagementUserService";
import { toast } from "react-toastify";
import { useState } from "react";

export const usePatchAdminUpdateStatusAccount = (onSuccessCallback) => {
  const [userIdUpdate, setUserIdUpdate] = useState(undefined);
  const {
    isPending: isLoadingAdminUpdateStatusAccount,
    mutateAsync: usePatchAdminUpdateStatusAcountMutation,
  } = useMutation({
    mutationKey: ["usePatchAdminUpdateStatusAccount"],
    mutationFn: patchAdminUpdateStatusAccount,
    onError: (err) => {
      console.log(err);

      toast.error(err.message || "Có lỗi xảy ra vui lòng thử lại sau ít phút.");
    },
    onSuccess: () => {
      onSuccessCallback?.();
      setUserIdUpdate(undefined);
      toast.success("Thay đổi trạng thái thành công.");
    },
  });

  const handleUpdateStatusAccount = (value) => {
    usePatchAdminUpdateStatusAcountMutation(value);
  };

  return {
    isLoadingAdminUpdateStatusAccount,
    handleUpdateStatusAccount,
    userIdUpdate,
    setUserIdUpdate,
  };
};
