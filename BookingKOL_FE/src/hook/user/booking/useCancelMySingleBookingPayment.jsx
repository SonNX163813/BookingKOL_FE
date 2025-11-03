import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { cancelSingleBookingPayment } from "../../../services/booking/BookingAPI";

export const useCancelMySingleBookingPayment = (
  {
    onSuccess: onSuccessCallback,
    onError: onErrorCallback,
    successToastMessage = null,
    errorToastMessage = null,
  } = {}
) => {
  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["user", "single-booking-requests", "payment", "cancel"],
    mutationFn: cancelSingleBookingPayment,
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

  const handleCancelMySingleBookingPayment = (payload) => mutateAsync(payload);

  return {
    isCancellingMySingleBookingPayment: isPending,
    handleCancelMySingleBookingPayment,
  };
};
