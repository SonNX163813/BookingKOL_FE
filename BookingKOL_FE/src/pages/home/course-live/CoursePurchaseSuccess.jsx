import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
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

import { BOOKING_FLOW_STYLE } from "../../../constants/bookingFlowTextStyles";

/* ------------------------- ĐỊNH DẠNG TIỀN TỆ ------------------------- */
const formatCurrency = (value) => {
  if (value == null) return "";
  const number = Number(value) || 0;

  return (
    new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 0,
    }).format(number) + " VND"
  );
};

/* ------------------------- COMPONENT CHÍNH ------------------------- */
const CoursePurchaseSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const purchase = location?.state?.purchase ?? null;
  const payment = location?.state?.payment ?? null;
  const course = location?.state?.course ?? null;

  const [redirectCountdown, setRedirectCountdown] = useState(15);

  useEffect(() => {
    if (!purchase || !payment) {
      navigate("/", { replace: true });
      return;
    }

    const timeout = setTimeout(() => {
      navigate("/", { replace: true });
    }, 15000);

    const interval = setInterval(() => {
      setRedirectCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [navigate, payment, purchase]);

  const amount = formatCurrency(
    payment?.amount ?? purchase?.currentPrice ?? purchase?.price ?? 0
  );

  const purchaseStartDate = (() => {
    if (!purchase?.startDate) return null;
    const parsed = dayjs(purchase.startDate);
    return parsed.isValid() ? parsed.format("HH:mm:ss DD/MM/YYYY") : null;
  })();

  const courseName =
    course?.name ??
    course?.title ??
    purchase?.courseName ??
    purchase?.courseTitle ??
    null;

  const purchaseNumber = purchase?.purchasedCourseNumber ?? null;
  const purchaseEmail = purchase?.email ?? null;

  if (!purchase || !payment) {
    return null;
  }

  const detailRows = [
    { label: "Số tiền", value: amount },
    { label: "Khóa học", value: courseName },
    { label: "Mã yêu cầu", value: purchaseNumber },
    { label: "Email nhận thông tin", value: purchaseEmail },
    { label: "Bắt đầu từ", value: purchaseStartDate },
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
            {/* Icon thành công */}
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
              />
            </Box>

            {/* Tiêu đề và mô tả */}
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
                Cảm ơn bạn đã hoàn tất thanh toán khóa học. Hệ thống sẽ tự động
                chuyển bạn về trang chủ sau{" "}
                <Typography component="span" sx={{ fontWeight: 600 }}>
                  {redirectCountdown} giây
                </Typography>
                .
              </Typography>
            </Stack>

            {/* Thông tin chi tiết khóa học */}
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
                  Thông tin khóa học
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

            {/* Nút điều hướng */}
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
                onClick={() =>
                  navigate("/danh-sach-khoa-hoc", { replace: true })
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
                Xem thêm khóa học
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default CoursePurchaseSuccess;
