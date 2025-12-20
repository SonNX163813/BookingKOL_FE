import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { createSingleBooking } from "../../services/booking/BookingAPI";

export const useCreateBooking = (
  onSuccessCallBack,
  {
    onError: onErrorCallBack,
    successToastMessage = "Tạo đặt lịch thành công.",
    errorToastMessage = "Có lỗi xảy ra, vui lòng thử lại sau ít phút.",
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
      // if (errorToastMessage) {
      //   toast.error(errorToastMessage);
      // }
    },
    onSuccess: (data) => {
      onSuccessCallBack?.(data);
      // if (successToastMessage) {
      //   toast.success(successToastMessage);
      // }
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
