import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useLocation, useNavigate } from "react-router-dom";
import { BOOKING_FLOW_STYLE } from "../../constants/bookingFlowTextStyles";

const dinhDangTien = (value) =>
  new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0) + " VND";

const normalizeIdentifier = (value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (
    value !== null &&
    value !== undefined &&
    (typeof value === "number" || typeof value === "bigint")
  ) {
    return String(value);
  }
  return null;
};

const BookingSinglePaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const paymentInfo = location.state?.payment;
  const bookingRequest =
    location.state?.bookingRequest &&
    typeof location.state.bookingRequest === "object"
      ? location.state.bookingRequest
      : null;
  const bookingSingleReqDTO =
    location.state?.bookingSingleReqDTO &&
    typeof location.state.bookingSingleReqDTO === "object"
      ? location.state.bookingSingleReqDTO
      : null;
  const stateContracts = Array.isArray(location.state?.contracts)
    ? location.state.contracts
    : [];
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (!paymentInfo) {
      navigate("/", { replace: true });
      return;
    }

    const redirectTimeout = setTimeout(() => {
      navigate("/", { replace: true });
    }, 15000);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => {
      clearTimeout(redirectTimeout);
      clearInterval(countdownInterval);
    };
  }, [navigate, paymentInfo]);

  if (!paymentInfo) {
    return null;
  }

  const contractsFromPayment = Array.isArray(paymentInfo?.contracts)
    ? paymentInfo.contracts
    : [];
  const mergedContracts =
    contractsFromPayment.length > 0 ? contractsFromPayment : stateContracts;

  const primaryContract =
    mergedContracts.find(
      (contract) =>
        contract &&
        (contract.contractNumber || contract.contractCode || contract.code)
    ) ?? mergedContracts[0];

  const requestNumberCandidates = [
    bookingRequest?.requestNumber,
    bookingSingleReqDTO?.requestNumber,
    paymentInfo?.bookingRequest?.requestNumber,
    paymentInfo?.requestNumber,
    primaryContract?.requestNumber,
  ];

  const requestNumber =
    requestNumberCandidates
      .map((value) => normalizeIdentifier(value))
      .find((value) => value !== null) ?? null;

  const detailRows = [
    {
      label: "Số tiền",
      value: dinhDangTien(paymentInfo.amount),
    },
    {
      label: "Nội dung chuyển khoản",
      value: paymentInfo.transferContent,
    },
    {
      label: "Mã yêu cầu",
      value: requestNumber,
    },
  ].filter((row) => Boolean(row.value));

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
          // background: `
          //   radial-gradient(80% 80% at 15% 20%, rgba(74, 116, 218, 0.25) 0%, rgba(74, 116, 218, 0) 60%),
          //   radial-gradient(75% 75% at 85% 80%, rgba(255, 161, 218, 0.18) 0%, rgba(255, 161, 218, 0) 65%),
          //   linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(147, 206, 246, 0.15) 100%)
          // `,
        }}
      />

      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
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
          <Stack spacing={4} alignItems="center">
            <Box
              sx={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, rgba(74,116,218,0.12), rgba(74,116,218,0.04))",
                border: "1px solid rgba(74, 116, 218, 0.24)",
              }}
            >
              <CheckCircleOutlineIcon
                sx={{ fontSize: 52, color: BOOKING_FLOW_STYLE.accent }}
                data-testid="payment-success-icon"
              />
            </Box>

            <Stack spacing={1.5} textAlign="center">
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: BOOKING_FLOW_STYLE.textPrimary }}
              >
                Thanh toán thành công
              </Typography>
              <Typography
                sx={{
                  color: BOOKING_FLOW_STYLE.textSecondary,
                  maxWidth: 420,
                  mx: "auto",
                }}
              >
                Cảm ơn bạn đã tin tưởng lựa chọn dịch vụ của KOL Booking. Hệ
                thống sẽ tự động chuyển bạn về trang chủ sau{" "}
                <Typography component="span" sx={{ fontWeight: 600 }}>
                  {countdown} giây
                </Typography>
                .
              </Typography>
            </Stack>

            <Paper
              variant="outlined"
              sx={{
                width: "100%",
                borderRadius: "22px",
                borderColor: BOOKING_FLOW_STYLE.border,
                backgroundColor: BOOKING_FLOW_STYLE.subtleSurface,
                px: { xs: 3, md: 4 },
                py: { xs: 3, md: 3.5 },
              }}
            >
              <Stack spacing={2.5}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: BOOKING_FLOW_STYLE.textPrimary,
                    textAlign: "left",
                  }}
                >
                  Chi tiết thanh toán
                </Typography>
                <Stack spacing={1.75}>
                  {detailRows.map((row) => (
                    <Stack
                      key={row.label}
                      direction="row"
                      justifyContent="space-between"
                      spacing={2}
                    >
                      <Typography
                        sx={{
                          color: BOOKING_FLOW_STYLE.textSecondary,
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        {row.label}
                      </Typography>
                      <Typography
                        sx={{
                          color: BOOKING_FLOW_STYLE.textPrimary,
                          fontWeight: 600,
                          textAlign: "right",
                          flex: 1,
                          wordBreak: "break-word",
                        }}
                      >
                        {row.value}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </Paper>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ width: "100%" }}
            >
              <Button
                fullWidth
                variant="contained"
                onClick={() => navigate("/", { replace: true })}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "16px",
                  backgroundColor: BOOKING_FLOW_STYLE.accent,
                  "&:hover": {
                    backgroundColor: "#3a5ec4",
                  },
                }}
              >
                Về trang chủ
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate("/danh-sach-kol", { replace: true })}
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
                Khám phá thêm KOL
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default BookingSinglePaymentSuccess;
