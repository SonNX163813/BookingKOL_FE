import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useLocation, useNavigate } from "react-router-dom";
import { BOOKING_SINGLE_PAYMENT_STORAGE_KEY } from "../../constants/storageKeys";

const DEFAULT_COUNTDOWN_MS = 15 * 60 * 1000;

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

const BookingSinglePayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [remainingMs, setRemainingMs] = useState(DEFAULT_COUNTDOWN_MS);

  useEffect(() => {
    const statePayment = location.state?.payment;

    if (statePayment) {
      setPaymentInfo(statePayment);
      try {
        sessionStorage.setItem(
          BOOKING_SINGLE_PAYMENT_STORAGE_KEY,
          JSON.stringify({ payment: statePayment })
        );
      } catch (storageError) {
        console.error("Cannot persist booking payment data", storageError);
      }
      return;
    }

    const storedPayload = sessionStorage.getItem(
      BOOKING_SINGLE_PAYMENT_STORAGE_KEY
    );
    if (storedPayload) {
      try {
        const parsed = JSON.parse(storedPayload);
        if (parsed?.payment) {
          setPaymentInfo(parsed.payment);
          return;
        }
      } catch (error) {
        console.error("Cannot parse booking payment data", error);
      }
    }

    navigate("/", { replace: true });
  }, [location.state, navigate]);

  useEffect(() => {
    if (!paymentInfo) {
      return;
    }

    const expiryMoment = paymentInfo.expiresAt
      ? dayjs(paymentInfo.expiresAt)
      : dayjs().add(15, "minute");

    const updateCountdown = () => {
      const diff = expiryMoment.diff(dayjs());
      setRemainingMs(diff > 0 ? diff : 0);
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, [paymentInfo]);

  const formattedExpiresAt = useMemo(() => {
    const target = paymentInfo?.expiresAt
      ? dayjs(paymentInfo.expiresAt)
      : dayjs().add(15, "minute");
    return target.isValid() ? target.format("DD/MM/YYYY HH:mm:ss") : "--";
  }, [paymentInfo]);

  const countdownLabel = useMemo(
    () => formatCountdown(remainingMs),
    [remainingMs]
  );

  if (!paymentInfo) {
    return null;
    // Optional: show a loading state here if needed.
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={4}>
        <Button
          variant="text"
          startIcon={<ArrowBackRoundedIcon />}
          onClick={() => navigate(-1)}
          sx={{ alignSelf: "flex-start" }}
        >
          Quay lai
        </Button>

        <Stack spacing={1}>
          <Typography variant="h4" fontWeight={700}>
            Thanh toan booking KOL le
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Vui long hoan tat thanh toan trong {countdownLabel}. Ma QR het han
            vao {formattedExpiresAt}.
          </Typography>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            background:
              "linear-gradient(135deg, rgba(247,249,252,0.8), rgba(255,255,255,0.9))",
          }}
        >
          <Stack spacing={4}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={{ xs: 3, md: 4 }}
            >
              <Stack spacing={2} flex={1}>
                <Typography variant="overline" color="primary" fontWeight={600}>
                  Thong tin thanh toan
                </Typography>

                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">So tien</Typography>
                    <Typography fontWeight={700} color="primary">
                      {formatCurrency(paymentInfo.amount)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">
                      Noi dung chuyen khoan
                    </Typography>
                    <Typography fontWeight={600}>
                      {paymentInfo.transferContent}
                    </Typography>
                  </Stack>
                  <Divider />
                  <Stack spacing={1}>
                    <Typography color="text.secondary">
                      Chu tai khoan
                    </Typography>
                    <Typography fontWeight={600}>{paymentInfo.name}</Typography>
                  </Stack>
                  <Stack spacing={1}>
                    <Typography color="text.secondary">Ngan hang</Typography>
                    <Typography fontWeight={600}>{paymentInfo.bank}</Typography>
                  </Stack>
                  <Stack spacing={1}>
                    <Typography color="text.secondary">
                      So tai khoan nhan
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
                  Quet ma QR de thanh toan
                </Typography>
                <Box
                  sx={{
                    width: { xs: 220, md: 260 },
                    height: { xs: 220, md: 260 },
                    borderRadius: 3,
                    p: 2,
                    bgcolor: "background.paper",
                    boxShadow:
                      "0 24px 48px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    component="img"
                    src={paymentInfo.qrUrl}
                    alt="QR thanh toan"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Ma se het han sau {countdownLabel}
                </Typography>
              </Stack>
            </Stack>

            <Alert severity="warning" sx={{ borderRadius: 3 }}>
              <Stack spacing={1}>
                <Typography fontWeight={600}>Luu y khi thanh toan</Typography>
                <Typography variant="body2">
                  - Nhap dung SO TIEN va NOI DUNG chuyen tien de he thong tu
                  dong kiem tra sau tu 1 - 5 phut.
                </Typography>
                <Typography variant="body2">
                  - Thong tin nap tien o tren chi dung duoc 1 lan. Neu ban su
                  dung lai thong tin nay o giao dich khac thi he thong se khong
                  xu ly.
                </Typography>
                <Typography variant="body2">
                  - Trang web khong ho tro hoan tien neu nhap sai thong tin, vui
                  long kiem tra ky truoc khi chuyen tien.
                </Typography>
              </Stack>
            </Alert>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};

export default BookingSinglePayment;
