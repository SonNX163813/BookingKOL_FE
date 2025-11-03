import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { continueSingleBookingPayment } from "../../../services/booking/BookingAPI";

export const useContinueMySingleBookingPayment = (
  {
    onSuccess: onSuccessCallback,
    onError: onErrorCallback,
    successToastMessage = null,
    errorToastMessage = null,
  } = {}
) => {
  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["user", "single-booking-requests", "payment", "continue"],
    mutationFn: continueSingleBookingPayment,
    onSuccess: (data, variables, context) => {
      onSuccessCallback?.(data, variables, context);
      if (successToastMessage) {
        toast.success(successToastMessage);
      }
    },
    onError: (error, variables, context) => {
      if (onErrorCallback) {
        onErrorCallback(error, variables, context);
        return;
      }
      if (errorToastMessage) {
        toast.error(errorToastMessage);
      }
    },
  });

  const handleContinueMySingleBookingPayment = (payload) => mutateAsync(payload);

  return {
    isContinuingMySingleBookingPayment: isPending,
    handleContinueMySingleBookingPayment,
  };
};
