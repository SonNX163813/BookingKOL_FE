import { useMutation } from "@tanstack/react-query";
import { holdBookingSlot } from "../../services/booking/BookingAPI";

export const useHoldBookingSlot = (options = {}) => {
  const { onSuccess, onError } = options;

  const {
    isPending: isHoldingBookingSlot,
    mutateAsync: holdSlotMutation,
  } = useMutation({
    mutationKey: ["booking_single", "holdBookingSlot"],
    mutationFn: holdBookingSlot,
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  const handleHoldBookingSlot = (payload) => {
    return holdSlotMutation(payload);
  };

  return {
    isHoldingBookingSlot,
    handleHoldBookingSlot,
  };
};
