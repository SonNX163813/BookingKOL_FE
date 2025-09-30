import { useMutation } from "@tanstack/react-query";
import { postCallSendAI } from "../../services/AIServices";
import { toast } from "react-toastify";
import { useState } from "react";

export const useSendChatAI = () => {
  const [ResponseSendChatAI, setResponseSendChatAI] = useState(null);
  const { isPending: isLoadingSendChatAI, mutateAsync: sendChatAI } =
    useMutation({
      mutationKey: ["useSendChatAI"],
      mutationFn: postCallSendAI,
      onError: (err) => {
        toast.error(
          err.message || "Có lỗi xảy ra vui lòng thử lại sau ít phút."
        );
      },
      onSuccess: (data) => {
        setResponseSendChatAI(data);
      },
    });

  const handleSendChatAI = (value) => {
    sendChatAI(value);
  };

  const clearResponse = () => setResponseSendChatAI(null);

  return {
    isLoadingSendChatAI,
    handleSendChatAI,
    ResponseSendChatAI,
    clearResponse,
  };
};
