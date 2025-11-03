import { useQuery } from "@tanstack/react-query";
import { getBankList } from "../../services/payment/BankAPI";

export const useGetBankList = () => {
  const query = useQuery({
    queryKey: ["payment", "banks"],
    queryFn: getBankList,
    staleTime: 1000 * 60 * 60 * 24, // cache for 24h
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  return {
    bankList: query.data ?? [],
    isLoadingBankList: query.isPending,
    isFetchingBankList: query.isFetching,
    refetchBankList: query.refetch,
    bankListError: query.error ?? null,
  };
};

