import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";

const getSecondsLeft = (expiresAt) => {
  if (!expiresAt) {
    return 0;
  }
  const diff = dayjs(expiresAt).diff(dayjs(), "second");
  return diff > 0 ? diff : 0;
};

const formatCountdown = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
};

const BookingReceipt = ({
  result,
  onDownloadInvoice,
  onClose,
  onViewSchedule,
  STYLE,
  TEXT,
  formatCurrency,
}) => {
  const payment = result?.payment ?? {};
  const booking = result?.booking ?? {};

  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    getSecondsLeft(payment.expiresAt)
  );

  useEffect(() => {
    if (!payment.expiresAt) {
      setRemainingSeconds(0);
      return undefined;
    }
    setRemainingSeconds(getSecondsLeft(payment.expiresAt));
    const interval = setInterval(() => {
      setRemainingSeconds(getSecondsLeft(payment.expiresAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [payment.expiresAt]);

  const isExpired = Boolean(payment.expiresAt) && remainingSeconds <= 0;

  const scheduleLabel = useMemo(() => {
    if (booking.schedule) {
      return booking.schedule;
    }
    if (booking.startAt && booking.endAt) {
      const start = dayjs(booking.startAt).format("DD/MM/YYYY HH:mm");
      const end = dayjs(booking.endAt).format("HH:mm");
      return `${start} - ${end}`;
    }
    return "--";
  }, [booking.schedule, booking.startAt, booking.endAt]);

  const amountLabel = formatCurrency(payment.amount ?? booking.total ?? 0);

  const countdownLabel = payment.expiresAt
    ? isExpired
      ? TEXT.receipt.countdownExpired
      : (TEXT.receipt.countdown ?? "{time}").replace(
          "{time}",
          formatCountdown(remainingSeconds)
        )
    : TEXT.receipt.countdownUnavailable ?? "";

  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="center">
          <CheckCircleRoundedIcon sx={{ fontSize: 56, color: "#52b09b" }} />
        </Stack>
        <Typography
          variant="h5"
          align="center"
          sx={{ color: STYLE.textPrimary, fontWeight: 700 }}
        >
          {TEXT.receipt.title}
        </Typography>
        <Typography align="center" sx={{ color: STYLE.textSecondary }}>
          {TEXT.receipt.description}
        </Typography>
        {(payment.expiresAt || TEXT.receipt.countdownUnavailable) && (
          <Stack
            direction="row"
            spacing={1}
            justifyContent="center"
            alignItems="center"
          >
            <AccessTimeRoundedIcon sx={{ color: isExpired ? "#f44336" : STYLE.accent }} />
            <Typography
              variant="body2"
              sx={{
                color: isExpired ? "#f44336" : STYLE.textSecondary,
                fontWeight: 600,
              }}
            >
              {countdownLabel}
            </Typography>
          </Stack>
        )}
      </Stack>
      <Card
        variant="outlined"
        sx={{
          borderRadius: STYLE.radius,
          borderColor: STYLE.border,
          background:
            "linear-gradient(140deg, rgba(255,255,255,0.96) 0%, rgba(147,206,246,0.25) 55%, rgba(255,161,218,0.18) 100%)",
          boxShadow: STYLE.shadow,
        }}
      >
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <ReceiptLongRoundedIcon sx={{ color: STYLE.accent }} />
              <Typography sx={{ color: STYLE.textPrimary, fontWeight: 600 }}>
                {TEXT.receipt.invoice}
              </Typography>
            </Stack>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={3}
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              {payment.qrUrl && (
                <Box
                  component="img"
                  src={payment.qrUrl}
                  alt={TEXT.receipt.qrAlt ?? "QR code"}
                  sx={{
                    width: { xs: "100%", sm: 220 },
                    height: { xs: "auto", sm: 220 },
                    borderRadius: "18px",
                    border: `1px solid ${STYLE.border}`,
                    objectFit: "cover",
                  }}
                />
              )}
              <Stack spacing={1} sx={{ flex: 1 }}>
                <Typography sx={{ color: STYLE.textSecondary }}>
                  <strong>{TEXT.receipt.contractId}:</strong> {payment.contractId ?? "--"}
                </Typography>
                <Typography sx={{ color: STYLE.textSecondary }}>
                  <strong>{TEXT.receipt.transferContent}:</strong> {payment.transferContent ?? "--"}
                </Typography>
                <Typography sx={{ color: STYLE.textSecondary }}>
                  <strong>{TEXT.receipt.bank}:</strong> {payment.bank ?? "--"}
                </Typography>
                <Typography sx={{ color: STYLE.textSecondary }}>
                  <strong>{TEXT.receipt.accountName}:</strong> {payment.accountName ?? "--"}
                </Typography>
                <Typography sx={{ color: STYLE.textSecondary }}>
                  <strong>{TEXT.receipt.accountNumber}:</strong> {payment.accountNumber ?? "--"}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography
                  variant="h6"
                  sx={{ color: STYLE.textPrimary, fontWeight: 700 }}
                >
                  {TEXT.receipt.amount}: {amountLabel}
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
      <Card
        variant="outlined"
        sx={{
          borderRadius: STYLE.radius,
          borderColor: STYLE.border,
          backgroundColor: STYLE.surface,
        }}
      >
        <CardContent>
          <Stack spacing={1.25}>
            <Typography sx={{ color: STYLE.textPrimary, fontWeight: 600 }}>
              {TEXT.receipt.summaryHeading}
            </Typography>
            <Typography sx={{ color: STYLE.textSecondary }}>
              <strong>{TEXT.summary.kol}:</strong> {booking.kolName ?? "--"}
            </Typography>
            <Typography sx={{ color: STYLE.textSecondary }}>
              <strong>{TEXT.summary.package}:</strong> {booking.packageName ?? "--"}
            </Typography>
            <Typography sx={{ color: STYLE.textSecondary }}>
              <strong>{TEXT.summary.duration}:</strong> {booking.duration ?? "--"}
            </Typography>
            <Typography sx={{ color: STYLE.textSecondary }}>
              <strong>{TEXT.summary.schedule}:</strong> {scheduleLabel}
            </Typography>
            <Typography sx={{ color: STYLE.textSecondary }}>
              <strong>{TEXT.receipt.method}:</strong> {booking.paymentMethod ?? "--"}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
      <Stack spacing={1.5}>
        <Button
          variant="contained"
          onClick={onDownloadInvoice}
          sx={{
            textTransform: "none",
            borderRadius: "16px",
            py: 1.3,
            fontWeight: 600,
            background:
              "linear-gradient(145deg, rgba(74,116,218,1) 0%, rgba(147,206,246,1) 100%)",
            "&:hover": {
              background:
                "linear-gradient(145deg, rgba(62,100,196,1) 0%, rgba(132,190,230,1) 100%)",
            },
          }}
        >
          {TEXT.receipt.download}
        </Button>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            textTransform: "none",
            borderRadius: "16px",
            py: 1.2,
            borderColor: STYLE.border,
            color: STYLE.textPrimary,
            "&:hover": { borderColor: STYLE.accent },
          }}
        >
          {TEXT.receipt.back}
        </Button>
        <Button
          variant="text"
          onClick={onViewSchedule}
          disabled={!onViewSchedule}
          sx={{
            textTransform: "none",
            borderRadius: "16px",
            py: 1.2,
            color: STYLE.accent,
            fontWeight: 600,
          }}
        >
          {TEXT.receipt.schedule}
        </Button>
      </Stack>
    </Stack>
  );
};

export default BookingReceipt;
