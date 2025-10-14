import React from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DiscountRoundedIcon from "@mui/icons-material/DiscountRounded";
import PaymentRoundedIcon from "@mui/icons-material/PaymentRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";

const BookingPaymentStep = ({
  paymentMethod,
  onChangePaymentMethod,
  paymentOptions,
  couponInput,
  onChangeCouponInput,
  onApplyCoupon,
  discountState,
  pricing,
  submitting,
  onPay,
  STYLE,
  TEXT,
  formatCurrency,
}) => (
  <Stack spacing={3}>
    <FormControl component="fieldset">
      <FormLabel sx={{ color: STYLE.textPrimary, fontWeight: 600 }}>
        {TEXT.form.paymentTitle}
      </FormLabel>
      <RadioGroup
        value={paymentMethod}
        onChange={(event) => onChangePaymentMethod(event.target.value)}
        sx={{ mt: 1.5, gap: 1 }}
      >
        {paymentOptions.map((option) => (
          <Card
            key={option.value}
            variant="outlined"
            sx={{
              borderRadius: "18px",
              borderColor:
                paymentMethod === option.value ? STYLE.accent : STYLE.border,
              backgroundColor:
                paymentMethod === option.value
                  ? "rgba(74, 116, 218, 0.08)"
                  : STYLE.surface,
            }}
          >
            <CardContent sx={{ py: 1 }}>
              <FormControlLabel
                value={option.value}
                control={
                  <Radio
                    sx={{
                      color: STYLE.accent,
                      "&.Mui-checked": { color: STYLE.accent },
                    }}
                  />
                }
                label={
                  <Typography
                    sx={{ color: STYLE.textPrimary, fontWeight: 500 }}
                  >
                    {option.label}
                  </Typography>
                }
              />
            </CardContent>
          </Card>
        ))}
      </RadioGroup>
    </FormControl>
    <Stack direction="row" spacing={1.5}>
      <TextField
        label={TEXT.form.coupon}
        value={couponInput}
        onChange={(event) => onChangeCouponInput(event.target.value)}
        sx={{
          flex: 1,
          "& .MuiOutlinedInput-root": {
            borderRadius: "16px",
            backgroundColor: STYLE.subtleSurface,
          },
        }}
      />
      <Button
        variant="outlined"
        startIcon={<DiscountRoundedIcon />}
        onClick={onApplyCoupon}
        disabled={!couponInput}
        sx={{
          textTransform: "none",
          borderRadius: "14px",
          borderColor: STYLE.border,
          color: STYLE.textPrimary,
          "&:hover": { borderColor: STYLE.accent },
          px: 2.5,
        }}
      >
        {TEXT.actions.apply}
      </Button>
    </Stack>
    {discountState.status === "success" && (
      <Alert severity="success" sx={{ borderRadius: "16px" }}>
        {discountState.message}
      </Alert>
    )}
    {discountState.status === "error" && (
      <Alert severity="error" sx={{ borderRadius: "16px" }}>
        {discountState.message}
      </Alert>
    )}
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
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PaymentRoundedIcon sx={{ color: STYLE.accent }} />
            <Typography sx={{ color: STYLE.textPrimary, fontWeight: 600 }}>
              {TEXT.form.paymentTitle}
            </Typography>
          </Stack>
          <Stack spacing={0.5}>
            <Typography sx={{ color: STYLE.textSecondary }}>
              {TEXT.summary.subtotal}: {formatCurrency(pricing.subtotal)}
            </Typography>
            {pricing.extra > 0 && (
              <Typography sx={{ color: STYLE.textSecondary }}>
                {TEXT.summary.extraFee}: +{formatCurrency(pricing.extra)}
              </Typography>
            )}
            {pricing.discount > 0 && (
              <Typography sx={{ color: "#ffa1da" }}>
                {TEXT.summary.discount}: -{formatCurrency(pricing.discount)}
              </Typography>
            )}
            <Divider sx={{ my: 1 }} />
            <Typography
              variant="h5"
              sx={{
                color: STYLE.textPrimary,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              {formatCurrency(pricing.total)}
              {submitting && (
                <CircularProgress size={18} sx={{ color: STYLE.accent }} />
              )}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
    <Button
      variant="contained"
      onClick={onPay}
      disabled={submitting}
      startIcon={<ReceiptLongRoundedIcon />}
      sx={{
        textTransform: "none",
        borderRadius: "16px",
        py: 1.4,
        fontWeight: 600,
        boxShadow: STYLE.shadow,
        background:
          "linear-gradient(145deg, rgba(74,116,218,1) 0%, rgba(147,206,246,1) 100%)",
        "&:hover": {
          background:
            "linear-gradient(145deg, rgba(62,100,196,1) 0%, rgba(132,190,230,1) 100%)",
        },
      }}
    >
      {TEXT.actions.pay}
    </Button>
  </Stack>
);

export default BookingPaymentStep;
