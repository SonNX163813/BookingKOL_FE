import { useQuery } from "@tanstack/react-query";
import { getSuperAdminTransactions } from "../../services/superadmin/SuperAdminTransactionAPI";

export const useGetSuperAdminTransactions = ({
  page = 0,
  size = 10,
  status,
  search,
  startDate,
  endDate,
} = {}) => {
  return useQuery({
    queryKey: [
      "superAdminTransactions",
      page,
      size,
      status ?? null,
      search ?? null,
      startDate ?? null,
      endDate ?? null,
    ],
    queryFn: ({ signal }) =>
      getSuperAdminTransactions({
        page,
        size,
        status,
        search,
        startDate,
        endDate,
        signal,
      }),
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });
};

export default useGetSuperAdminTransactions;
