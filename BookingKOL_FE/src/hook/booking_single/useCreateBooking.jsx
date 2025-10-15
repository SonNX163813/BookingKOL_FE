import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { createSingleBooking } from "../../services/booking/BookingAPI";

export const useCreateBooking = (
  onSuccessCallBack,
  {
    onError: onErrorCallBack,
    successToastMessage = "Tao booking thanh cong.",
    errorToastMessage = "Co loi xay ra, vui long thu lai sau it phut.",
  } = {}
) => {
  const {
    isPending: isLoadingCreateBooking,
    mutateAsync: handleCreateBookingMutation,
  } = useMutation({
    mutationKey: ["booking_single", "createBooking"],
    mutationFn: createSingleBooking,
    onError: (error) => {
      if (onErrorCallBack) {
        onErrorCallBack(error);
        return;
      }
      if (errorToastMessage) {
        toast.error(errorToastMessage);
      }
    },
    onSuccess: (data) => {
      onSuccessCallBack?.(data);
      if (successToastMessage) {
        toast.success(successToastMessage);
      }
    },
  });

  const handleCreateBooking = (value) => {
    return handleCreateBookingMutation(value);
  };

  return {
    isLoadingCreateBooking,
    handleCreateBooking,
  };
};
