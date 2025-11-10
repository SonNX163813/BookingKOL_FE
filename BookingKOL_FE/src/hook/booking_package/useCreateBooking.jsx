import { useMutation } from "@tanstack/react-query";
import { createBookingPackage } from "../../services/booking/BookingServices";
import { toast } from "react-toastify";

export const useCreateBooking = (onSuccessCallBack) => {
  const {
    isPending: isLoadingCreateBooking,
    mutateAsync: handleCreateBookingMutation,
  } = useMutation({
    mutationKey: ["useCreateBooking"],
    mutationFn: createBookingPackage,
    onError: (err) => {
      toast.error("Có lỗi xảy ra vui lòng thử lại sau ít phút.");
    },
    onSuccess: () => {
      onSuccessCallBack?.();
    },
  });

  const handleCreateBooking = (value) => {
    handleCreateBookingMutation(value);
  };

  return {
    isLoadingCreateBooking,
    handleCreateBooking,
  };
};
