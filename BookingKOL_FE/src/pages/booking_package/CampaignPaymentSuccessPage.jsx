import React, { useEffect, useMemo, useState } from "react";
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

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const CampaignPaymentSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const paymentInfo = location.state?.payment ?? null;
  const campaignInfo = location.state?.campaign ?? null;
  const scheduleInfo = location.state?.paymentSchedule ?? null;
  const [countdown, setCountdown] = useState(15);

  const campaignId =
    campaignInfo?.id ??
    paymentInfo?.campaignId ??
    location.state?.campaignId ??
    null;

  useEffect(() => {
    if (!paymentInfo) {
      navigate("/", { replace: true });
      return;
    }

    const redirectTimeout = setTimeout(() => {
      if (campaignId) {
        navigate(`/don-booking-chien-dich/${campaignId}`, { replace: true });
      } else {
        navigate("/don-booking-chien-dich", { replace: true });
      }
    }, 15000);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => {
      clearTimeout(redirectTimeout);
      clearInterval(countdownInterval);
    };
  }, [campaignId, navigate, paymentInfo]);

  const amount = paymentInfo?.amount;
  const transferContent = paymentInfo?.transferContent;
  const contractNumber = paymentInfo?.contractNumber;
  const contractId = paymentInfo?.contractId;

  const campaignName =
    campaignInfo?.name ??
    paymentInfo?.campaignName ??
    location.state?.campaignName ??
    "--";
  const installmentLabel = scheduleInfo?.installmentNumber
    ? `Đợt ${scheduleInfo.installmentNumber}`
    : paymentInfo?.installmentNumber
    ? `Đợt ${paymentInfo.installmentNumber}`
    : null;

  const detailRows = useMemo(
    () =>
      [
        { label: "Chiến dịch", value: campaignName },
        {
          label: "Số tiền",
          value: formatCurrency(amount),
        },
        {
          label: "Nội dung chuyển khoản",
          value: transferContent,
        },
        {
          label: "Mã hợp đồng",
          value: contractNumber ?? contractId ?? "--",
        },
        {
          label: "Đợt thanh toán",
          value: installmentLabel,
        },
      ].filter((row) => Boolean(row.value)),
    [amount, campaignName, contractId, contractNumber, installmentLabel, transferContent]
  );

  if (!paymentInfo) {
    return null;
  }

  const handleBackToCampaign = () => {
    if (campaignId) {
      navigate(`/don-booking-chien-dich/${campaignId}`, { replace: true });
    } else {
      navigate("/don-booking-chien-dich", { replace: true });
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: { xs: 8, md: 12 },
        px: { xs: 2, md: 4 },
        background:
          "radial-gradient(circle at top, rgba(79,70,229,0.15), transparent 60%), #f8fafc",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={4}
          sx={{
            borderRadius: "28px",
            p: { xs: 4, md: 5 },
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(79,70,229,0.06), rgba(147,51,234,0.08))",
            }}
          />
          <Stack spacing={4} sx={{ position: "relative", zIndex: 1 }}>
            <Stack spacing={2} alignItems="center">
              <CheckCircleOutlineIcon
                sx={{ fontSize: 64, color: BOOKING_FLOW_STYLE.accent }}
              />
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: BOOKING_FLOW_STYLE.textPrimary }}
              >
                Thanh toán thành công
              </Typography>
              <Typography
                sx={{
                  color: BOOKING_FLOW_STYLE.textSecondary,
                  maxWidth: 420,
                }}
              >
                Cảm ơn bạn đã hoàn tất thanh toán.
                {campaignId
                  ? " Hệ thống sẽ đưa bạn về trang chi tiết chiến dịch"
                  : " Hệ thống sẽ đưa bạn về danh sách chiến dịch"}{" "}
                sau <strong>{countdown}s</strong>.
              </Typography>
            </Stack>

            <Paper
              variant="outlined"
              sx={{
                borderRadius: "20px",
                borderColor: BOOKING_FLOW_STYLE.border,
                backgroundColor: "#fff",
                px: { xs: 3, md: 4 },
                py: { xs: 3, md: 3.5 },
                textAlign: "left",
              }}
            >
              <Stack spacing={2}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: BOOKING_FLOW_STYLE.textPrimary,
                  }}
                >
                  Thông tin giao dịch
                </Typography>
                <Stack spacing={1.5}>
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
                onClick={handleBackToCampaign}
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
                Xem lại chiến dịch
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() =>
                  navigate("/don-booking-chien-dich", { replace: true })
                }
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
                Về lịch sử chi tiết
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default CampaignPaymentSuccessPage;
