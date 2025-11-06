import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { confirmRefundRequest } from "../../../services/booking/RefundAdminService";

const resolveSuccessMessage = (rawMessage) => {
  if (Array.isArray(rawMessage)) {
    return rawMessage.filter(Boolean).join(" ");
  }
  if (typeof rawMessage === "string") {
    return rawMessage;
  }
  if (rawMessage === null || rawMessage === undefined) {
    return undefined;
  }
  return String(rawMessage);
};

const DEFAULT_SUCCESS_MESSAGE = "Hoàn tiền đã được xác nhận thành công.";

export const useConfirmRefundRequest = ({ onSuccess, onError } = {}) => {
  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["admin", "refunds", "confirm"],
    mutationFn: confirmRefundRequest,
    onSuccess: (data, variables, context) => {
      const toastMessage = resolveSuccessMessage(data?.message);
      toast.success(toastMessage || DEFAULT_SUCCESS_MESSAGE);
      onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      onError?.(error, variables, context);
    },
  });

  const handleConfirmRefundRequest = (payload) => mutateAsync(payload);

  return {
    isConfirmingRefundRequest: isPending,
    handleConfirmRefundRequest,
  };
};
