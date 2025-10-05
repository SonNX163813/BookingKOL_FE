export const useSubmitLead = () => {
  const submitLead = (payload) => {
    console.log("Submitting lead payload", payload);
    // TODO integrate with CRM:
    // - Gắn tag dịch vụ theo form
    // - Gửi email cảm ơn tự động
    // - Tạo deal trong CRM nội bộ
    // - Push thông báo Slack/Zalo OA cho đội vận hành
  };

  return { submitLead };
};
