import { useMutation } from "@tanstack/react-query";
import { confirmMyWorktimeLivestreamMetrics } from "../../../services/booking/WorktimeLivestreamMetricUserService";

export const useConfirmMyWorktimeLivestreamMetrics = ({
  onSuccess,
  onError,
} = {}) => {
  const { mutateAsync, isPending } = useMutation({
    mutationKey: [
      "user",
      "single-booking-requests",
      "worktime-livestream-metrics",
      "confirm",
    ],
    mutationFn: (worktimeId) => confirmMyWorktimeLivestreamMetrics(worktimeId),
    onSuccess,
    onError,
  });

  const handleConfirmWorktimeLivestreamMetrics = (worktimeId) =>
    mutateAsync(worktimeId);

  return {
    isConfirmingWorktimeLivestreamMetrics: isPending,
    handleConfirmWorktimeLivestreamMetrics,
  };
};
