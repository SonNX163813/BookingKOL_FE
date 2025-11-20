import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
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

import { BOOKING_FLOW_STYLE } from "../../constants/bookingFlowTextStyles";
import { CAMPAIGN_PAYMENT_STORAGE_KEY } from "../../constants/storageKeys";
import { BASE_URL } from "../../utils/config";

const COUNTDOWN_DURATION_MS = 15 * 60 * 1000;

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatCountdown = (remainingMs) => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

const ensureCountdownDeadline = (payment) => {
  if (!payment) return null;

  const candidate =
    payment.expiresAt ?? payment.localCountdownDeadline ?? null;

  if (candidate && dayjs(candidate).isValid()) {
    return payment;
  }

  return {
    ...payment,
    localCountdownDeadline: dayjs().add(15, "minute").toISOString(),
  };
};

const CampaignPaymentPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [campaignInfo, setCampaignInfo] = useState(
    () => location.state?.campaign ?? null
  );
  const [bookingRequest, setBookingRequest] = useState(
    () => location.state?.bookingRequest ?? null
  );
  const [scheduleInfo, setScheduleInfo] = useState(
    () => location.state?.paymentSchedule ?? null
  );
  const [remainingMs, setRemainingMs] = useState(COUNTDOWN_DURATION_MS);

  useEffect(() => {
    const statePayment = location.state?.payment;
    const stateCampaign = location.state?.campaign ?? null;
    const stateRequest = location.state?.bookingRequest ?? null;
    const stateSchedule = location.state?.paymentSchedule ?? null;

    if (statePayment) {
      const normalizedPayment = ensureCountdownDeadline(statePayment);
      setPaymentInfo(normalizedPayment);
      setCampaignInfo(stateCampaign);
      setBookingRequest(stateRequest);
      setScheduleInfo(stateSchedule);

      try {
        sessionStorage.setItem(
          CAMPAIGN_PAYMENT_STORAGE_KEY,
          JSON.stringify({
            payment: normalizedPayment,
            campaign: stateCampaign,
            bookingRequest: stateRequest,
            paymentSchedule: stateSchedule,
          })
        );
      } catch (error) {
        console.error("Unable to persist campaign payment payload", error);
      }
      return;
    }

    const cached = sessionStorage.getItem(CAMPAIGN_PAYMENT_STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed?.payment) {
          const normalizedPayment = ensureCountdownDeadline(parsed.payment);
          setPaymentInfo(normalizedPayment);
          setCampaignInfo(parsed?.campaign ?? null);
          setBookingRequest(parsed?.bookingRequest ?? null);
          setScheduleInfo(parsed?.paymentSchedule ?? null);
          return;
        }
      } catch (error) {
        console.error("Unable to restore campaign payment payload", error);
      }
    }

    navigate("/don-booking-chien-dich", { replace: true });
  }, [location.state, navigate]);

  useEffect(() => {
    if (!paymentInfo) return;

    const deadline = paymentInfo.expiresAt
      ? dayjs(paymentInfo.expiresAt)
      : paymentInfo.localCountdownDeadline
      ? dayjs(paymentInfo.localCountdownDeadline)
      : null;

    if (!deadline || !deadline.isValid()) return;

    const updateDiff = () => {
      const diff = deadline.diff(dayjs());
      setRemainingMs(diff > 0 ? diff : 0);
    };

    updateDiff();
    const intervalId = setInterval(updateDiff, 1000);
    return () => clearInterval(intervalId);
  }, [paymentInfo]);

  useEffect(() => {
    if (!paymentInfo || remainingMs > 0) return;

    sessionStorage.removeItem(CAMPAIGN_PAYMENT_STORAGE_KEY);
    toast.error("Mã thanh toán đã hết hạn. Vui lòng thử lại.");

    navigate("/don-booking-chien-dich/thanh-toan/that-bai", {
      replace: true,
      state: {
        campaign: campaignInfo,
        bookingRequest,
        paymentSchedule: scheduleInfo,
      },
    });
  }, [
    bookingRequest,
    campaignInfo,
    navigate,
    paymentInfo,
    remainingMs,
    scheduleInfo,
  ]);

  useEffect(() => {
    const scheduleId =
      paymentInfo?.contractPaymentScheduleId ??
      paymentInfo?.contractPaymentScheduleID ??
      scheduleInfo?.id ??
      paymentInfo?.id;

    if (!scheduleId) return;

    let isActive = true;
    let intervalId;

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/v1/payment/check/campaign/${scheduleId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) {
          console.error(
            "Unable to check campaign payment status:",
            response.status
          );
          return;
        }

        const result = await response.json();
        if (!isActive) return;

        const isPaid =
          typeof result === "boolean"
            ? result
            : typeof result?.data === "boolean"
            ? result.data
            : typeof result?.paid === "boolean"
            ? result.paid
            : typeof result?.isPaid === "boolean"
            ? result.isPaid
            : typeof result?.status === "string"
            ? result.status.toLowerCase() === "paid"
            : false;

        if (isPaid) {
          sessionStorage.removeItem(CAMPAIGN_PAYMENT_STORAGE_KEY);
          toast.success("Thanh toán chiến dịch thành công!");

          navigate("/don-booking-chien-dich/thanh-toan/thanh-cong", {
            replace: true,
            state: {
              payment: paymentInfo,
              campaign: campaignInfo,
              bookingRequest,
              paymentSchedule: scheduleInfo,
            },
          });
        }
      } catch (error) {
        console.error("Failed to check campaign payment status:", error);
      }
    };

    checkPaymentStatus();
    intervalId = setInterval(checkPaymentStatus, 5000);

    return () => {
      isActive = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [bookingRequest, campaignInfo, navigate, paymentInfo, scheduleInfo]);

  if (!paymentInfo) {
    return null;
  }

  const campaignName =
    campaignInfo?.name ??
    paymentInfo?.campaignName ??
    bookingRequest?.campaignName;
  const installmentNumber =
    scheduleInfo?.installmentNumber ?? paymentInfo?.installmentNumber;
  const dueDateLabel = scheduleInfo?.dueDate
    ? dayjs(scheduleInfo.dueDate).format("DD/MM/YYYY")
    : paymentInfo?.dueDate
    ? dayjs(paymentInfo.dueDate).format("DD/MM/YYYY")
    : "--";
  const countdownLabel = formatCountdown(remainingMs);
  const scheduleLabel = installmentNumber
    ? `Đợt ${installmentNumber}`
    : "Đợt thanh toán";
  const campaignId =
    campaignInfo?.id ??
    paymentInfo?.campaignId ??
    bookingRequest?.campaignId;

  const handleBackToDetail = () => {
    if (campaignId) {
      navigate(`/don-booking-chien-dich/${campaignId}`);
    } else {
      navigate("/don-booking-chien-dich");
    }
  };

  return (
    <Container
      maxWidth="md"
      sx={{
        minHeight: "100vh",
        py: { xs: 6, md: 10 },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          borderRadius: "28px",
          p: { xs: 3, md: 5 },
          boxShadow:
            "0 40px 80px -40px rgba(79, 70, 229, 0.2), 0 10px 40px -25px rgba(15, 23, 42, 0.45)",
        }}
      >
        <Stack spacing={4}>
          <Stack spacing={1}>
            <Typography
              variant="overline"
              sx={{ color: BOOKING_FLOW_STYLE.accent, fontWeight: 600 }}
            >
              Thanh toán chiến dịch
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: BOOKING_FLOW_STYLE.textPrimary }}
            >
              {campaignName ?? "Chiến dịch không tên"}
            </Typography>
            <Typography sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}>
              Quét mã QR để hoàn tất {scheduleLabel.toLowerCase()} cho chiến
              dịch. Thời hạn thanh toán kết thúc lúc{" "}
              <strong>{dueDateLabel}</strong>.
            </Typography>
          </Stack>

          <Alert severity="info" sx={{ borderRadius: 3 }}>
            <Typography fontWeight={600}>
              Mã thanh toán sẽ hết hạn sau {countdownLabel}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1.5 }}>
              Đảm bảo nhập chính xác <strong>SỐ TIỀN</strong> và{" "}
              <strong>NỘI DUNG CHUYỂN KHOẢN</strong> để hệ thống tự động xác
              nhận. Không đóng trình duyệt cho tới khi hoàn thành thanh toán.
            </Typography>
          </Alert>

          <Paper
            variant="outlined"
            sx={{
              borderRadius: "24px",
              borderColor: BOOKING_FLOW_STYLE.border,
              backgroundColor: BOOKING_FLOW_STYLE.subtleSurface,
              p: { xs: 3, md: 4 },
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={{ xs: 3, md: 4 }}
              alignItems="stretch"
            >
              <Stack spacing={2} flex={1}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: BOOKING_FLOW_STYLE.textSecondary,
                    fontWeight: 600,
                  }}
                >
                  Thông tin thanh toán
                </Typography>

                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Số tiền</Typography>
                    <Typography fontWeight={700} color="primary">
                      {formatCurrency(paymentInfo.amount)}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.5}>
                    <Typography color="text.secondary" variant="body2">
                      Nội dung chuyển khoản
                    </Typography>
                    <Typography fontWeight={600}>
                      {paymentInfo.transferContent}
                    </Typography>
                  </Stack>

                  <Divider />

                  <Stack spacing={0.5}>
                    <Typography color="text.secondary" variant="body2">
                      Chủ tài khoản
                    </Typography>
                    <Typography fontWeight={600}>
                      {paymentInfo.name}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.5}>
                    <Typography color="text.secondary" variant="body2">
                      Ngân hàng
                    </Typography>
                    <Typography fontWeight={600}>
                      {paymentInfo.bank}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.5}>
                    <Typography color="text.secondary" variant="body2">
                      Số tài khoản
                    </Typography>
                    <Typography fontWeight={600}>
                      {paymentInfo.accountNumber}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>

              <Divider
                orientation="vertical"
                flexItem
                sx={{ display: { xs: "none", md: "block" } }}
              />

              <Stack
                spacing={2}
                alignItems="center"
                justifyContent="center"
                flex={1}
              >
                <Typography color="text.secondary">
                  Quét mã QR để thanh toán
                </Typography>
                <Box
                  sx={{
                    width: { xs: 220, md: 260 },
                    height: { xs: 220, md: 260 },
                    borderRadius: 4,
                    p: 2,
                    backgroundColor: "#fff",
                    boxShadow:
                      "0 24px 48px rgba(15,23,42,0.08), 0 2px 8px rgba(15,23,42,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    component="img"
                    src={paymentInfo.qrUrl}
                    alt="QR thanh toán chiến dịch"
                    sx={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Mã sẽ hết hạn sau {countdownLabel}
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          <Alert severity="warning" sx={{ borderRadius: 3 }}>
            <Typography fontWeight={600}>Lưu ý quan trọng</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              - Không chỉnh sửa nội dung chuyển khoản.
            </Typography>
            <Typography variant="body2">
              - Hệ thống tự động đối soát trong 1 - 5 phút kể từ khi thanh toán.
            </Typography>
            <Typography variant="body2">
              - Nếu giao dịch thất bại hoặc nhập sai thông tin, vui lòng quay
              lại chi tiết chiến dịch để nhận mã mới.
            </Typography>
          </Alert>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleBackToDetail}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "16px",
                backgroundColor: BOOKING_FLOW_STYLE.accent,
                "&:hover": { backgroundColor: "#3a5ec4" },
              }}
            >
              Quay lại chi tiết chiến dịch
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate("/don-booking-chien-dich")}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "16px",
                borderColor: BOOKING_FLOW_STYLE.accent,
                color: BOOKING_FLOW_STYLE.accent,
                bgcolor: "rgba(74, 116, 218, 0.06)",
                "&:hover": {
                  borderColor: "#3a5ec4",
                  color: "#3a5ec4",
                  bgcolor: "rgba(74, 116, 218, 0.12)",
                },
              }}
            >
              Xem danh sách chiến dịch
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
};

export default CampaignPaymentPage;
