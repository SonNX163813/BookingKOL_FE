import { useQuery } from "@tanstack/react-query";
import { getSuperAdminMerchants } from "../../services/superadmin/SuperAdminMerchantAPI";

export const useGetSuperAdminMerchants = ({ page = 0, size = 10 } = {}) => {
  return useQuery({
    queryKey: ["superAdminMerchants", page, size],
    queryFn: ({ signal }) => getSuperAdminMerchants({ page, size, signal }),
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });
};

export default useGetSuperAdminMerchants;
