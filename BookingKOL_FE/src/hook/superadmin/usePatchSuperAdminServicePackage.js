import { message } from "antd";
import { useMutation } from "@tanstack/react-query";
import { patchSuperAdminServicePackage } from "../../services/superadmin/ServicePackageService";

export const usePatchSuperAdminServicePackage = (refetchList) => {
  const mutation = useMutation({
    mutationFn: ({ packageId, newPrice, body }) =>
      patchSuperAdminServicePackage({ packageId, newPrice, body }),
    onSuccess: () => {
      message.success("Cập nhật gói thành công");
      refetchList?.();
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message || err?.message || "Cập nhật thất bại";
      message.error(Array.isArray(msg) ? msg.join(" | ") : String(msg));
    },
  });

  return {
    isLoadingPatchServicePackage: mutation.isPending,
    handlePatchServicePackage: mutation.mutate,
  };
};

export default usePatchSuperAdminServicePackage;
