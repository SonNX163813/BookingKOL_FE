export const BOOKING_STATUS_OPTIONS = [
  { label: "Chờ Thanh Toán", value: "DRAFT" },
  { label: "Đã yêu cầu", value: "REQUESTED" },
  { label: "Đang thực hiện", value: "IN_PROGRESS" },
  { label: "Đã hoàn thành", value: "COMPLETED" },
  { label: "Đã hết hạn", value: "EXPIRED" },
  { label: "Đã hủy", value: "CANCELLED" },
  { label: "Đã thanh toán", value: "PAID" },
  { label: "Đợi hoàn tiền", value: "WAIT_FOR_REFUND" },
];

export const BOOKING_STATUS_LABEL = {
  DRAFT: "Bản nháp",
  REQUESTED: "Đã yêu cầu",
  PENDING: "Chờ xử lý",
  NEGOTIATING: "Đang đàm phán",
  APPROVED: "Đã phê duyệt",
  ACCEPTED: "Đã chấp nhận",
  CONFIRMED: "Đã xác nhận",
  IN_PROGRESS: "Đang thực hiện",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  DISPUTED: "Đang tranh chấp",
  REJECTED: "Đã từ chối",
  CANCELLED: "Đã hủy",
  CONTRACT_SIGNED: "Đã ký hợp đồng",
  EXPIRED: "Hết hạn",
  PAID: "Đã thanh toán",
  WAIT_FOR_REFUND: "Đợi hoàn tiền",
  REFUNDED: "Đã hoàn tiền",
  OVERPAID: "Thanh toán thừa",
};

export const STATUS_TAG_COLOR = {
  DRAFT: "default",
  REQUESTED: "processing",
  PENDING: "processing",
  NEGOTIATING: "cyan",
  APPROVED: "success",
  ACCEPTED: "success",
  CONFIRMED: "blue",
  IN_PROGRESS: "processing",
  DELIVERED: "gold",
  COMPLETED: "success",
  DISPUTED: "magenta",
  REJECTED: "error",
  CANCELLED: "error",
  CONTRACT_SIGNED: "purple",
  EXPIRED: "volcano",
  PAID: "success",
  WAIT_FOR_REFUND: "cyan",
  REFUNDED: "purple",
};

export const PAYMENT_STATUS_OPTIONS = [
  { label: "Đợi hoàn tiền", value: "WAIT_FOR_REFUND" },
  { label: "Nháp", value: "DRAFT" },
  { label: "Đợi thanh toán", value: "PENDING" },
  { label: "Thanh toán chưa đủ", value: "UNDERPAID" },
  { label: "Đã thanh toán", value: "PAID" },
  { label: "Thanh toán thừa", value: "OVERPAID" },
  { label: "Đã hết hạn thanh toán", value: "EXPIRED" },
  { label: "Đã hủy thanh toán", value: "CANCELLED" },
  { label: "Đã hoàn tiền", value: "REFUNDED" },
];

export const PAYMENT_STATUS_LABEL = {
  PAID: "Đã thanh toán",
  PENDING: "Chờ thanh toán",
  PROCESSING: "Đang xử lý thanh toán",
  COMPLETED: "Hoàn tất thanh toán",
  FAILED: "Thanh toán thất bại",
  EXPIRED: "Hết hạn thanh toán",
  CANCELLED: "Đã huỷ thanh toán",
  REFUNDED: "Đã hoàn tiền",
  WAIT_FOR_REFUND: "Đợi hoàn tiền",
  OVERPAID: "Thanh toán thừa",
  DRAFT: "Nháp",
};

export const PAYMENT_STATUS_COLOR = {
  PENDING: "processing",
  UNDERPAID: "warning",
  PAID: "success",
  OVERPAID: "purple",
  EXPIRED: "volcano",
  CANCELLED: "error",
  WAIT_FOR_REFUND: "cyan",
  REFUNDED: "purple",
  DRAFT: "default",
};

export const REFUND_REQUEST_STATUS_OPTIONS = [
  { label: "Chờ xử lý", value: "PENDING" },
  { label: "Đang xử lý", value: "PROCESSING" },
  { label: "Đã chấp thuận", value: "APPROVED" },
  { label: "Đã hoàn tất", value: "COMPLETED" },
  { label: "Từ chối", value: "REJECTED" },
  { label: "Đã hủy", value: "CANCELLED" },
  { label: "Đã hoàn tiền", value: "REFUNDED" },
];

export const REFUND_REQUEST_STATUS_COLOR = {
  PENDING: "processing",
  PROCESSING: "processing",
  APPROVED: "success",
  COMPLETED: "success",
  REJECTED: "error",
  CANCELLED: "warning",
  REFUNDED: "purple",
};
