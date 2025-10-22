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

const dinhDangTien = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const BookingSinglePaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const paymentInfo = location.state?.payment;
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!paymentInfo) {
      navigate("/", { replace: true });
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      navigate("/", { replace: true });
    }, 3000);

    const intervalId = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [navigate, paymentInfo]);

  if (!paymentInfo) {
    return null;
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 8, md: 12 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, md: 6 },
          borderRadius: 4,
          textAlign: "center",
          bgcolor: "background.paper",
          boxShadow:
            "0 24px 48px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.08)",
        }}
      >
        <Stack spacing={3} alignItems="center">
          <Box
            sx={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              bgcolor: "success.light",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircleOutlineIcon
              color="success"
              sx={{ fontSize: 48 }}
              data-testid="payment-success-icon"
            />
          </Box>

          <Stack spacing={1}>
            <Typography variant="h5" fontWeight={700}>
              Thanh toán thành công
            </Typography>
            <Typography color="text.secondary">
              Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của KOL Booking. Hệ thống
              sẽ tự động chuyển về trang chủ sau {countdown} giây.
            </Typography>
          </Stack>

          <Paper
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 3,
              width: "100%",
              bgcolor: "background.default",
              textAlign: "left",
            }}
          >
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Số tiền</Typography>
                <Typography fontWeight={700}>
                  {dinhDangTien(paymentInfo.amount)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Nội dung</Typography>
                <Typography fontWeight={600}>
                  {paymentInfo.transferContent}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography color="text.secondary">Mã hợp đồng</Typography>
                <Typography fontWeight={600}>{paymentInfo.contractId}</Typography>
              </Stack>
            </Stack>
          </Paper>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/", { replace: true })}
            >
              Về trang chủ ngay
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate("/danh-sach-kol", { replace: true })}
            >
              Khám phá thêm KOL
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Container>
  );
};

export default BookingSinglePaymentSuccess;

