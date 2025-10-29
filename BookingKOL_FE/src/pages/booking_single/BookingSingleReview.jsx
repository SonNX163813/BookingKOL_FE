import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  confirmSingleBookingRequest,
  cancelSingleBookingRequestById,
} from "../../services/booking/BookingAPI";
import { BOOKING_FLOW_STYLE } from "../../constants/bookingFlowTextStyles";
import {
  BOOKING_SINGLE_PAYMENT_STORAGE_KEY,
  BOOKING_SINGLE_REVIEW_STORAGE_KEY,
} from "../../constants/storageKeys";

const FALLBACK_TEXT = "---";

const formatDateTime = (value) => {
  if (!value) return FALLBACK_TEXT;
  const parsed = dayjs(value);
  if (!parsed.isValid()) return FALLBACK_TEXT;
  return parsed.format("DD/MM/YYYY HH:mm");
};

const STATUS_LABELS = {
  DRAFT: "Chờ thanh toán",
  WAITING_FOR_PAYMENT: "Chờ thanh toán",
  PENDING: "Đang xử lý",
  CONFIRMED: "Đã xác nhận",
  APPROVED: "Đã duyệt",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  REJECTED: "Từ chối",
};

const CONTRACT_STATUS_LABELS = {
  DRAFT: "Chờ thanh toán",
  PENDING: "Đang xử lý",
  ACTIVE: "Đang hiệu lực",
  SIGNED: "Đã ký",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const getStatusLabel = (status) => {
  if (!status) return FALLBACK_TEXT;
  return STATUS_LABELS[status] ?? status;
};

const getContractStatusLabel = (status) => {
  if (!status) return FALLBACK_TEXT;
  return CONTRACT_STATUS_LABELS[status] ?? status;
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const formatCurrency = (value) => {
  if (value === null || value === undefined) {
    return FALLBACK_TEXT;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return FALLBACK_TEXT;
  }
  return currencyFormatter.format(numeric);
};

const formatFileSize = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null;
  }
  if (numeric < 1024) {
    return `${numeric} B`;
  }
  const kb = numeric / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
};

const formatLanguages = (languages) => {
  if (!languages) return FALLBACK_TEXT;
  if (Array.isArray(languages)) {
    const joined = languages
      .filter(Boolean)
      .map((item) => item.trim())
      .filter(Boolean)
      .join(", ");
    return joined.length ? joined : FALLBACK_TEXT;
  }
  if (typeof languages === "string") {
    return languages.trim().length ? languages : FALLBACK_TEXT;
  }
  return FALLBACK_TEXT;
};

const formatKolLocation = (city, country) => {
  const parts = [city, country]
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());
  return parts.length ? parts.join(", ") : FALLBACK_TEXT;
};

const formatKolRating = (rating, feedbackCount) => {
  const totalFeedback = Number(feedbackCount) || 0;
  const numericRating = Number(rating);
  if (totalFeedback === 0 || Number.isNaN(numericRating)) {
    return "Chưa có đánh giá";
  }
  return `${numericRating.toFixed(1)}/5 (${totalFeedback} lượt)`;
};

const safeText = (value) => {
  if (value === null || value === undefined) return FALLBACK_TEXT;
  if (typeof value === "string" && value.trim().length === 0)
    return FALLBACK_TEXT;
  return value;
};

const BookingSingleReview = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [bookingRequest, setBookingRequest] = useState(null);
  const [bookingSingleReqDTO, setBookingSingleReqDTO] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const stateRequest = location.state?.bookingRequest;
    const stateDTO = location.state?.bookingSingleReqDTO;

    if (stateRequest) {
      setBookingRequest(stateRequest);
      setBookingSingleReqDTO(stateDTO ?? null);

      try {
        sessionStorage.setItem(
          BOOKING_SINGLE_REVIEW_STORAGE_KEY,
          JSON.stringify({
            bookingRequest: stateRequest,
            bookingSingleReqDTO: stateDTO ?? null,
          })
        );
      } catch (storageError) {
        console.error("Không thể lưu dữ liệu xem trước booking", storageError);
      }
      return;
    }

    const stored = sessionStorage.getItem(BOOKING_SINGLE_REVIEW_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.bookingRequest) {
          setBookingRequest(parsed.bookingRequest);
          setBookingSingleReqDTO(parsed.bookingSingleReqDTO ?? null);
          return;
        }
      } catch (error) {
        console.error("Không thể đọc dữ liệu xem trước booking", error);
      }
    }

    navigate("/", { replace: true });
  }, [location.state, navigate]);

  const kolInfo = bookingRequest?.kol ?? null;

  const scheduleInfo = useMemo(() => {
    if (!bookingRequest) return null;

    return {
      startAt: bookingRequest.startAt ?? bookingSingleReqDTO?.startAt ?? null,
      endAt: bookingRequest.endAt ?? bookingSingleReqDTO?.endAt ?? null,
    };
  }, [bookingRequest, bookingSingleReqDTO]);

  const contactInfo = useMemo(() => {
    if (!bookingRequest) return null;

    return {
      fullName: bookingRequest.fullName ?? bookingSingleReqDTO?.fullName ?? "",
      phone: bookingRequest.phone ?? bookingSingleReqDTO?.phone ?? "",
      email: bookingRequest.email ?? bookingSingleReqDTO?.email ?? "",
      location: bookingRequest.location ?? bookingSingleReqDTO?.location ?? "",
      description:
        bookingRequest.description ?? bookingSingleReqDTO?.description ?? "",
      status: getStatusLabel(bookingRequest.status),
      requestNumber:
        bookingRequest.requestNumber ??
        bookingSingleReqDTO?.requestNumber ??
        null,
    };
  }, [bookingRequest, bookingSingleReqDTO]);

  const attachments = useMemo(() => {
    const fromRequest = Array.isArray(bookingRequest?.attachedFiles)
      ? bookingRequest.attachedFiles
          .filter(Boolean)
          .map((item, index) => {
            const fileMeta = item?.file ?? item;
            const fileUrl = fileMeta?.fileUrl ?? item?.fileUrl ?? "";
            const fileName =
              fileMeta?.fileName ??
              fileMeta?.name ??
              item?.fileName ??
              `Tệp đính kèm ${index + 1}`;
            return {
              id: item?.id ?? fileMeta?.id ?? index,
              name: fileName,
              url: fileUrl,
              size: fileMeta?.sizeBytes ?? item?.sizeBytes ?? null,
            };
          })
          .filter((file) => file.name)
      : [];
    if (fromRequest.length > 0) {
      return fromRequest;
    }

    const fromDto = Array.isArray(bookingSingleReqDTO?.attachedFiles)
      ? bookingSingleReqDTO.attachedFiles
          .filter(Boolean)
          .map((item, index) => ({
            id: item?.id ?? index,
            name:
              item?.fileName ??
              item?.name ??
              `Tệp đính kèm ${fromRequest.length + index + 1}`,
            url: item?.fileUrl ?? item?.url ?? "",
            size: item?.sizeBytes ?? item?.size ?? null,
          }))
          .filter((file) => file.name)
      : [];

    return fromDto;
  }, [bookingRequest, bookingSingleReqDTO]);
  const kolDetails = useMemo(() => {
    if (!kolInfo) return [];

    return [
      { label: "Họ tên", value: safeText(kolInfo.displayName) },
      { label: "Kinh nghiệm", value: safeText(kolInfo.experience) },
      {
        label: "Khu vực",
        value: formatKolLocation(kolInfo.city, kolInfo.country),
      },
      // { label: "Ngôn ngữ", value: formatLanguages(kolInfo.languages) },
      {
        label: "Giá booking tối thiểu",
        value: formatCurrency(kolInfo.minBookingPrice),
      },
      {
        label: "Đánh giá",
        value: formatKolRating(kolInfo.overallRating, kolInfo.feedbackCount),
      },
    ];
  }, [kolInfo]);

  const contractInfo = useMemo(() => {
    if (!bookingRequest?.contracts || bookingRequest.contracts.length === 0) {
      return [];
    }

    return bookingRequest.contracts.map((contract) => {
      const contractNumber = safeText(contract.contractNumber);
      const requestNumber = safeText(
        contract.requestNumber ?? bookingRequest.requestNumber
      );
      return {
        id: contract.id ?? contract.contractNumber ?? requestNumber,
        contractNumber,
        requestNumber,
        status: getContractStatusLabel(contract.status),
        createdAt: contract.createdAt ?? null,
      };
    });
  }, [bookingRequest]);

  const errorMessageFromResponse = (error) => {
    const serverMessage =
      error?.response?.data?.message ??
      error?.response?.data?.error ??
      error?.message;
    if (Array.isArray(serverMessage)) {
      return serverMessage.filter(Boolean).join(" ");
    }
    if (typeof serverMessage === "string" && serverMessage.trim().length > 0) {
      return serverMessage;
    }
    return "Đã có lỗi xảy ra. Vui lòng thử lại.";
  };

  const handleConfirm = async () => {
    if (!bookingRequest?.id || confirming) return;
    setConfirming(true);
    try {
      const response = await confirmSingleBookingRequest({
        requestId: bookingRequest.id,
      });
      const responseData = response?.data ?? null;
      const paymentData = responseData?.data ?? responseData ?? null;

      if (!paymentData) {
        toast.error("Không tìm thấy thông tin thanh toán.");
        return;
      }

      try {
        sessionStorage.setItem(
          BOOKING_SINGLE_PAYMENT_STORAGE_KEY,
          JSON.stringify({ payment: paymentData })
        );
      } catch (storageError) {
        console.error("Không thể lưu dữ liệu thanh toán", storageError);
      }

      sessionStorage.removeItem(BOOKING_SINGLE_REVIEW_STORAGE_KEY);
      navigate("/thanh-toan-kol-le", {
        replace: true,
        state: {
          payment: paymentData,
          bookingRequest,
        },
      });
    } catch (error) {
      toast.error(errorMessageFromResponse(error));
    } finally {
      setConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (!bookingRequest?.id || cancelling) return;
    setCancelling(true);
    try {
      await cancelSingleBookingRequestById({
        requestId: bookingRequest.id,
      });
      sessionStorage.removeItem(BOOKING_SINGLE_REVIEW_STORAGE_KEY);
      sessionStorage.removeItem(BOOKING_SINGLE_PAYMENT_STORAGE_KEY);

      navigate("/thanh-toan-kol-le/that-bai", {
        replace: true,
        state: {
          bookingRequest,
        },
      });
    } catch (error) {
      toast.error(errorMessageFromResponse(error));
    } finally {
      setCancelling(false);
    }
  };

  if (!bookingRequest) {
    return null;
  }

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        py: { xs: 8, md: 12 },
        px: { xs: 2, md: 4 },
        bgcolor: "#f5f7ff",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#ffffff",
        }}
      />

      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 5 },
            borderRadius: "28px",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(147,206,246,0.18) 45%, rgba(255,255,255,0.92) 100%)",
            border: `1px solid ${BOOKING_FLOW_STYLE.border}`,
            boxShadow: BOOKING_FLOW_STYLE.shadow,
          }}
        >
          <Stack spacing={4}>
            <Stack spacing={1}>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: BOOKING_FLOW_STYLE.textPrimary }}
              >
                Xác nhận yêu cầu đặt lịch
              </Typography>
              <Typography
                sx={{
                  color: BOOKING_FLOW_STYLE.textSecondary,
                  maxWidth: 520,
                }}
              >
                Vui lòng kiểm tra lại thông tin đặt lịch trước khi xác nhận. Bạn
                có thể hủy nếu cần chỉnh sửa thêm.
              </Typography>
            </Stack>

            <Paper
              variant="outlined"
              sx={{
                borderRadius: "22px",
                borderColor: BOOKING_FLOW_STYLE.border,
                backgroundColor: BOOKING_FLOW_STYLE.subtleSurface,
                px: { xs: 3, md: 4 },
                py: { xs: 3, md: 3.5 },
              }}
            >
              <Stack spacing={3}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={{ xs: 3, md: 4 }}
                  alignItems={{ xs: "flex-start", md: "center" }}
                >
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    flex={1}
                  >
                    <Avatar
                      src={kolInfo?.avatarUrl ?? ""}
                      alt={kolInfo?.displayName ?? kolInfo?.fullName ?? "KOL"}
                      sx={{ width: 64, height: 64 }}
                    />
                    <Stack spacing={0.5}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          color: BOOKING_FLOW_STYLE.textPrimary,
                        }}
                      >
                        {kolInfo?.displayName ??
                          kolInfo?.fullName ??
                          "KOL đang cập nhật"}
                      </Typography>
                      {kolInfo?.bio ? (
                        <Typography
                          variant="body2"
                          sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                        >
                          {kolInfo.bio}
                        </Typography>
                      ) : null}
                    </Stack>
                  </Stack>
                  <Stack
                    spacing={1}
                    alignItems={{ xs: "flex-start", md: "flex-end" }}
                    sx={{ minWidth: { md: 220 } }}
                  >
                    <Stack
                      spacing={0.25}
                      alignItems={{ xs: "flex-start", md: "flex-end" }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                      >
                        Mã yêu cầu
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: BOOKING_FLOW_STYLE.textPrimary,
                        }}
                      >
                        {contactInfo?.requestNumber ?? FALLBACK_TEXT}
                      </Typography>
                    </Stack>
                    <Stack
                      spacing={0.25}
                      alignItems={{ xs: "flex-start", md: "flex-end" }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                      >
                        Trạng thái
                      </Typography>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: BOOKING_FLOW_STYLE.accent,
                        }}
                      >
                        {contactInfo?.status ?? FALLBACK_TEXT}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>

                <Divider />

                <Stack spacing={2}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: BOOKING_FLOW_STYLE.textPrimary,
                    }}
                  >
                    Thông tin KOL
                  </Typography>
                  <Stack spacing={1.5}>
                    {kolDetails.map((detail) => (
                      <Stack
                        key={detail.label}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                      >
                        <Typography
                          sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                        >
                          {detail.label}
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 600,
                            maxWidth: { xs: "60%", md: "55%" },
                            textAlign: "right",
                          }}
                        >
                          {detail.value}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>

                <Divider />

                <Stack spacing={2}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: BOOKING_FLOW_STYLE.textPrimary,
                    }}
                  >
                    Thông tin liên hệ
                  </Typography>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography
                        sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                      >
                        Họ tên
                      </Typography>
                      <Typography sx={{ fontWeight: 600 }}>
                        {contactInfo?.fullName || FALLBACK_TEXT}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography
                        sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                      >
                        Số điện thoại
                      </Typography>
                      <Typography sx={{ fontWeight: 600 }}>
                        {contactInfo?.phone || FALLBACK_TEXT}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography
                        sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                      >
                        Email
                      </Typography>
                      <Typography sx={{ fontWeight: 600 }}>
                        {contactInfo?.email || FALLBACK_TEXT}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography
                        sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                      >
                        Địa điểm
                      </Typography>
                      <Typography sx={{ fontWeight: 600 }}>
                        {contactInfo?.location || FALLBACK_TEXT}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>

                <Divider />

                <Stack spacing={2}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: BOOKING_FLOW_STYLE.textPrimary,
                    }}
                  >
                    Tệp đính kèm
                  </Typography>
                  {attachments.length > 0 ? (
                    <Stack spacing={1.5}>
                      {attachments.map((file) => (
                        <Stack
                          key={file.id ?? file.url ?? file.name}
                          direction={{ xs: "column", sm: "row" }}
                          spacing={{ xs: 1, sm: 2 }}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", sm: "center" }}
                        >
                          <Stack spacing={0.25}>
                            <Typography sx={{ fontWeight: 600 }}>
                              {file.name}
                            </Typography>
                            {file.size ? (
                              <Typography
                                variant="caption"
                                sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                              >
                                {formatFileSize(file.size)}
                              </Typography>
                            ) : null}
                          </Stack>
                          {file.url ? (
                            <Button
                              component="a"
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="small"
                              variant="outlined"
                              sx={{
                                textTransform: "none",
                                borderRadius: "12px",
                              }}
                            >
                              Xem tệp
                            </Button>
                          ) : (
                            <Typography
                              sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                            >
                              Không có liên kết tệp
                            </Typography>
                          )}
                        </Stack>
                      ))}
                    </Stack>
                  ) : (
                    <Typography
                      sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                    >
                      Không có tệp đính kèm
                    </Typography>
                  )}
                </Stack>

                <Divider />

                <Stack spacing={2}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: BOOKING_FLOW_STYLE.textPrimary,
                    }}
                  >
                    Lịch trình dự kiến
                  </Typography>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography
                        sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                      >
                        Bắt đầu
                      </Typography>
                      <Typography sx={{ fontWeight: 600 }}>
                        {formatDateTime(scheduleInfo?.startAt)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography
                        sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                      >
                        Kết thúc
                      </Typography>
                      <Typography sx={{ fontWeight: 600 }}>
                        {formatDateTime(scheduleInfo?.endAt)}
                      </Typography>
                    </Stack>
                  </Stack>
                </Stack>

                {contractInfo.length > 0 ? (
                  <>
                    <Divider />
                    <Stack spacing={2}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 600,
                          color: BOOKING_FLOW_STYLE.textPrimary,
                        }}
                      >
                        Hợp đồng
                      </Typography>

                      <Stack spacing={1.5}>
                        {contractInfo.map((contract) => (
                          <Stack
                            key={contract.id}
                            spacing={1}
                            // sx={{
                            //   p: 2,
                            //   borderRadius: "16px",
                            //   border: `1px solid ${BOOKING_FLOW_STYLE.border}`,
                            //   backgroundColor: "#ffffff",
                            // }}
                          >
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                            >
                              <Typography
                                sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                              >
                                Số hợp đồng
                              </Typography>
                              <Typography sx={{ fontWeight: 600 }}>
                                {contract.contractNumber}
                              </Typography>
                            </Stack>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                            >
                              <Typography
                                sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                              >
                                Mã yêu cầu
                              </Typography>
                              <Typography sx={{ fontWeight: 600 }}>
                                {contract.requestNumber}
                              </Typography>
                            </Stack>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                            >
                              <Typography
                                sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                              >
                                Trạng thái
                              </Typography>
                              <Typography sx={{ fontWeight: 600 }}>
                                {contract.status}
                              </Typography>
                            </Stack>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                            >
                              <Typography
                                sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                              >
                                Ngày tạo
                              </Typography>
                              <Typography sx={{ fontWeight: 600 }}>
                                {formatDateTime(contract.createdAt)}
                              </Typography>
                            </Stack>
                          </Stack>
                        ))}
                      </Stack>
                    </Stack>
                  </>
                ) : null}

                <Divider />

                <Stack spacing={1}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: 600,
                      color: BOOKING_FLOW_STYLE.textPrimary,
                    }}
                  >
                    Ghi chú
                  </Typography>
                  <Typography
                    sx={{
                      color: contactInfo?.description
                        ? BOOKING_FLOW_STYLE.textPrimary
                        : BOOKING_FLOW_STYLE.textSecondary,
                    }}
                  >
                    {contactInfo?.description || "Không có ghi chú bổ sung"}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>

            <Alert
              severity="warning"
              sx={{
                borderRadius: "18px",
                backgroundColor: "#fff8e1",
                fontSize: 16,
              }}
            >
              Lưu ý: Vui lòng không thoát khỏi trình duyệt hoặc tắt tab trong
              quá trình thanh toán để tránh gián đoạn. Nếu có vấn đề xảy ra, bạn
              có thể hủy yêu cầu và tạo lại yêu cầu mới.
            </Alert>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="flex-end"
            >
              <Button
                variant="outlined"
                color="error"
                onClick={handleCancel}
                disabled={confirming || cancelling}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "16px",
                }}
              >
                {cancelling ? "Đang hủy..." : "Hủy yêu cầu"}
              </Button>
              <Button
                variant="contained"
                onClick={handleConfirm}
                disabled={confirming || cancelling}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "16px",
                  backgroundColor: BOOKING_FLOW_STYLE.accent,
                  "&:hover": { backgroundColor: "#3a5ec4" },
                }}
              >
                {confirming ? "Đang xác nhận..." : "Xác nhận & Thanh toán"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default BookingSingleReview;
