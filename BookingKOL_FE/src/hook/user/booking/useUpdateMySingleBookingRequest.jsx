import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { updateSingleBookingRequest } from "../../../services/booking/BookingAPI";

export const useUpdateMySingleBookingRequest = (
  {
    onSuccess: onSuccessCallback,
    onError: onErrorCallback,
    successToastMessage = null,
    errorToastMessage = null,
  } = {}
) => {
  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["user", "single-booking-requests", "update"],
    mutationFn: updateSingleBookingRequest,
    onSuccess: (data, variables, context) => {
      onSuccessCallback?.(data, variables, context);
      if (successToastMessage) {
        toast.success(successToastMessage);
      }
    },
    onError: (error) => {
      if (onErrorCallback) {
        onErrorCallback(error);
        return;
      }
      if (errorToastMessage) {
        toast.error(errorToastMessage);
      }
    },
  });

  const handleUpdateMySingleBookingRequest = (payload) =>
    mutateAsync(payload);

  return {
    isUpdatingMySingleBookingRequest: isPending,
    handleUpdateMySingleBookingRequest,
  };
};

