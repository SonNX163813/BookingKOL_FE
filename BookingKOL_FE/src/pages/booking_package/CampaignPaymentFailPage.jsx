import React from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useLocation, useNavigate } from "react-router-dom";

import { BOOKING_FLOW_STYLE } from "../../constants/bookingFlowTextStyles";

const CampaignPaymentFailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const campaignInfo = location.state?.campaign ?? null;
  const scheduleInfo = location.state?.paymentSchedule ?? null;

  const campaignId =
    campaignInfo?.id ?? location.state?.campaignId ?? null;

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
          "radial-gradient(circle at top, rgba(248,113,113,0.12), transparent 60%), #fef2f2",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
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
                "linear-gradient(135deg, rgba(248,113,113,0.08), rgba(239,68,68,0.08))",
            }}
          />
          <Stack spacing={4} sx={{ position: "relative", zIndex: 1 }}>
            <Stack spacing={2} alignItems="center">
              <ErrorOutlineIcon
                sx={{ fontSize: 64, color: "#ef4444" }}
                data-testid="campaign-payment-fail-icon"
              />
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, color: BOOKING_FLOW_STYLE.textPrimary }}
              >
                Thanh toán chưa hoàn tất
              </Typography>
              <Typography
                sx={{
                  color: BOOKING_FLOW_STYLE.textSecondary,
                  maxWidth: 420,
                }}
              >
                Mã thanh toán đã hết hạn hoặc giao dịch chưa được ghi nhận. Bạn
                có thể quay lại trang chiến dịch để lấy mã mới và thực hiện
                lại.
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
              <Stack spacing={1.5}>
                <Typography
                  sx={{
                    color: BOOKING_FLOW_STYLE.textSecondary,
                    fontWeight: 500,
                  }}
                >
                  Chiến dịch
                </Typography>
                <Typography
                  sx={{
                    color: BOOKING_FLOW_STYLE.textPrimary,
                    fontWeight: 600,
                  }}
                >
                  {campaignInfo?.name ?? "Chưa xác định"}
                </Typography>
                {scheduleInfo?.installmentNumber ? (
                  <>
                    <Typography
                      sx={{
                        color: BOOKING_FLOW_STYLE.textSecondary,
                        fontWeight: 500,
                        mt: 2,
                      }}
                    >
                      Đợt thanh toán
                    </Typography>
                    <Typography
                      sx={{
                        color: BOOKING_FLOW_STYLE.textPrimary,
                        fontWeight: 600,
                      }}
                    >
                      Đợt {scheduleInfo.installmentNumber}
                    </Typography>
                  </>
                ) : null}
                {scheduleInfo?.dueDate ? (
                  <>
                    <Typography
                      sx={{
                        color: BOOKING_FLOW_STYLE.textSecondary,
                        fontWeight: 500,
                        mt: 2,
                      }}
                    >
                      Hạn thanh toán
                    </Typography>
                    <Typography
                      sx={{
                        color: BOOKING_FLOW_STYLE.textPrimary,
                        fontWeight: 600,
                      }}
                    >
                      {new Date(scheduleInfo.dueDate).toLocaleDateString("vi-VN")}
                    </Typography>
                  </>
                ) : null}
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
                Quay lại chiến dịch
              </Button>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate("/don-booking-chien-dich", { replace: true })}
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
                Về danh sách chiến dịch
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default CampaignPaymentFailPage;
