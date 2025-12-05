import { useQuery } from "@tanstack/react-query";
import { getSuperAdminAccounts } from "../../services/superadmin/SuperAdminAccountAPI";

export const useGetSuperAdminAccounts = ({
  page = 0,
  size = 20,
  status,
  role,
  search,
} = {}) => {
  return useQuery({
    queryKey: [
      "superAdminAccounts",
      page,
      size,
      status ?? null,
      role ?? null,
      search ?? null,
    ],
    queryFn: ({ signal }) =>
      getSuperAdminAccounts({ page, size, status, role, search, signal }),
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });
};

export default useGetSuperAdminAccounts;
