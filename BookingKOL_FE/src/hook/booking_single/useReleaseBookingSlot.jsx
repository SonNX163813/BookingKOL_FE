import { useMutation } from "@tanstack/react-query";
import { releaseBookingSlot } from "../../services/booking/BookingAPI";

export const useReleaseBookingSlot = (options = {}) => {
  const { onSuccess, onError } = options;

  const {
    isPending: isReleasingBookingSlot,
    mutateAsync: releaseSlotMutation,
  } = useMutation({
    mutationKey: ["booking_single", "releaseBookingSlot"],
    mutationFn: releaseBookingSlot,
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  const handleReleaseBookingSlot = (payload) => releaseSlotMutation(payload);

  return {
    isReleasingBookingSlot,
    handleReleaseBookingSlot,
  };
};
