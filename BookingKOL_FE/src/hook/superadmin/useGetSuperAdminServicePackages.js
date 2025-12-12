import { useQuery } from "@tanstack/react-query";
import { getSuperAdminServicePackages } from "../../services/superadmin/ServicePackageService";

export const useGetSuperAdminServicePackages = ({ search } = {}) => {
  return useQuery({
    queryKey: ["superAdminServicePackages", search ?? null],
    queryFn: ({ signal }) =>
      getSuperAdminServicePackages({
        signal,
      }),
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });
};

export default useGetSuperAdminServicePackages;
