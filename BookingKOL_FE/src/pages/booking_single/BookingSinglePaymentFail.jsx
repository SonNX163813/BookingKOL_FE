import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import { useLocation, useNavigate } from "react-router-dom";
import { BOOKING_FLOW_STYLE } from "../../constants/bookingFlowTextStyles";

const BookingSinglePaymentFail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(15);

  const isExpired = location.state?.reason === "EXPIRED";
  const titleText = isExpired ? "Đơn đã quá hạn" : "Yêu cầu đặt lịch đã bị hủy";
  const descriptionText = isExpired
    ? "Đơn đã quá 15 phút nhưng chưa Xác nhận & Thanh toán nên đã chuyển sang trạng thái quá hạn và không thể tiếp tục thanh toán."
    : "Bạn đã hủy yêu cầu đặt lịch.";

  useEffect(() => {
    if (!location.state?.bookingRequest) {
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
  }, [location.state, navigate]);

  if (!location.state?.bookingRequest) {
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

      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 5 },
            borderRadius: "28px",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(246,147,147,0.18) 45%, rgba(255,255,255,0.92) 100%)",
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
                  "linear-gradient(135deg, rgba(218,74,74,0.12), rgba(218,74,74,0.04))",
                border: "1px solid rgba(218, 74, 74, 0.24)",
              }}
            >
              <HighlightOffRoundedIcon
                sx={{ fontSize: 52, color: "#d03737" }}
                data-testid="payment-fail-icon"
              />
            </Box>

            <Stack spacing={1.5} textAlign="center">
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: BOOKING_FLOW_STYLE.textPrimary }}
              >
                {titleText}
              </Typography>
              <Typography
                sx={{
                  color: BOOKING_FLOW_STYLE.textSecondary,
                  maxWidth: 420,
                  mx: "auto",
                }}
              >
                {descriptionText} Hệ thống sẽ tự động chuyển bạn về trang chủ sau{" "}
                <Typography component="span" sx={{ fontWeight: 600 }}>
                  {countdown} giây
                </Typography>
                .
              </Typography>
            </Stack>

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
                Xem danh sách KOL
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default BookingSinglePaymentFail;
