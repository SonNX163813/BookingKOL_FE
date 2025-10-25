import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { cancelSingleBookingRequest } from "../../../services/booking/BookingAPI";

export const useCancelMySingleBookingRequest = (
  {
    onSuccess: onSuccessCallback,
    onError: onErrorCallback,
    successToastMessage = null,
    errorToastMessage = null,
  } = {}
) => {
  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["user", "single-booking-requests", "cancel"],
    mutationFn: cancelSingleBookingRequest,
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

  const handleCancelMySingleBookingRequest = (payload) =>
    mutateAsync(payload);

  return {
    isCancellingMySingleBookingRequest: isPending,
    handleCancelMySingleBookingRequest,
  };
};
