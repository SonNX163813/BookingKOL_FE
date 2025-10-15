import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Drawer,
  IconButton,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

import BookingScheduleStep from "./BookingScheduleStep";
import BookingContactStep from "./BookingContactStep";
import BookingReceipt from "./BookingReceipt";

import {
  BOOKING_FLOW_STYLE as STYLE,
  BOOKING_FLOW_TEXT as TEXT,
} from "../../../constants/bookingFlowTextStyles";
import { useCreateBooking as useCreateSingleBooking } from "../../../hook/booking_single/useCreateBooking";
import { useHoldBookingSlot } from "../../../hook/booking_single/useHoldBookingSlot";

/* ------------------------- CONSTANTS & HELPERS ------------------------- */

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE_MB = 10;
const MAX_ATTACHMENT_SIZE_BYTES = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024;

const PAYMENT_OPTIONS = [
  { value: "momo", label: "MoMo" },
  { value: "zalopay", label: "ZaloPay" },
  { value: "vnpay", label: "VNPay" },
  { value: "stripe", label: "Thẻ/Stripe (test)" },
  { value: "bank", label: "Chuyển khoản" },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const getScheduleLabel = (start, end) => {
  if (!start) return "Chưa chọn";
  const s = dayjs(start);
  const e = end ? dayjs(end) : null;
  if (!e || !e.isValid()) return s.format("DD/MM/YYYY HH:mm");
  if (e.isSame(s, "day"))
    return `${s.format("DD/MM/YYYY HH:mm")} → ${e.format("HH:mm")}`;
  return `${s.format("DD/MM/YYYY HH:mm")} → ${e.format("DD/MM/YYYY HH:mm")}`;
};

/* ------------------------- MAIN COMPONENT ------------------------- */

const BookingFlow = ({
  open,
  onClose,
  kolId,
  kolName,
  userProfile,
  onSubmit,
  onViewSchedule,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  /* ---------------------- STATE ---------------------- */
  const [activeStep, setActiveStep] = useState(0);
  const [startDateTime, setStartDateTime] = useState(null);
  const [endDateTime, setEndDateTime] = useState(null);
  const [contact, setContact] = useState({
    fullName: "",
    email: "",
    phone: "",
    note: "",
  });
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_OPTIONS[0].value);
  const [paymentResult, setPaymentResult] = useState(null);
  const [heldSlot, setHeldSlot] = useState(null);

  const { isLoadingCreateBooking: submitting, handleCreateBooking } =
    useCreateSingleBooking(null, {
      successToastMessage: null,
      errorToastMessage: null,
    });
  const { isHoldingBookingSlot: holdingSlot, handleHoldBookingSlot } =
    useHoldBookingSlot();

  /* ---------------------- EFFECT: Reset when open ---------------------- */
  useEffect(() => {
    if (!open) return;

    const now = dayjs();
    const tomorrow = now.add(1, "day");

    setActiveStep(0);
    setStartDateTime(now);
    setEndDateTime(tomorrow.hour(now.hour()).minute(now.minute()));
    setContact({
      fullName: userProfile?.fullName ?? userProfile?.name ?? "",
      email: userProfile?.email ?? userProfile?.contactEmail ?? "",
      phone: userProfile?.phone ?? userProfile?.phoneNumber ?? "",
      note: "",
    });
    setAttachments([]);
    setErrors({});
    setAgreeTerms(false);
    setTermsOpen(false);
    setPaymentMethod(PAYMENT_OPTIONS[0].value);
    setPaymentResult(null);
    setHeldSlot(null);
  }, [open, userProfile]);

  /* ---------------------- VALIDATION ---------------------- */
  const validateStep = (stepIndex = activeStep, touchErrors = false) => {
    if (paymentResult) return true;
    const newErrors = {};

    if (stepIndex === 0) {
      if (!startDateTime || !endDateTime) {
        newErrors.schedule = "Vui lòng chọn ngày giờ hợp lệ";
      } else if (!endDateTime.isAfter(startDateTime)) {
        newErrors.schedule = "Thời gian kết thúc phải sau thời gian bắt đầu";
      }
    } else if (stepIndex === 1) {
      if (!contact.fullName.trim())
        newErrors.fullName = "Tên không được để trống";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email))
        newErrors.email = "Email chưa hợp lệ";
      if (!/^\d{10,11}$/.test(contact.phone))
        newErrors.phone = "Số điện thoại gồm 10–11 số";
      if (!agreeTerms) newErrors.terms = "Vui lòng đồng ý điều khoản";
    }

    if (touchErrors) setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------------------- STEP HANDLERS ---------------------- */
  const handleBack = () => {
    if (activeStep === 0) onClose?.();
    else setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleContinue = () => {
    if (!validateStep(activeStep, true)) return;
    setActiveStep((prev) => Math.min(prev + 1, TEXT.steps.length - 1));
  };

  const handleHoldSlotClick = async () => {
    if (!validateStep(0, true)) return;

    const startIso = startDateTime?.toISOString?.();
    const endIso = endDateTime?.toISOString?.();

    if (!startIso || !endIso) {
      toast.error("Không thể xác định khung giờ. Vui lòng thử lại.");
      return;
    }

    try {
      const response = await handleHoldBookingSlot({
        kolId,
        startTimeIso: startIso,
        endTimeIso: endIso,
      });

      const data = response?.data ?? response;
      const nextSlot = {
        kolId,
        startTimeIso: data?.startTimeIso ?? startIso,
        endTimeIso: data?.endTimeIso ?? endIso,
      };

      setHeldSlot(nextSlot);
      toast.success("Đã giữ chỗ thành công!");
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ?? "Không thể giữ chỗ. Vui lòng thử lại.";
      toast.error(errorMsg);
    }
  };

  /* ---------------------- CONTACT HANDLERS ---------------------- */
  const handleContactChange = (field, value) => {
    setContact((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleToggleTerms = (checked) => {
    setAgreeTerms(checked);
    if (errors.terms) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.terms;
        return next;
      });
    }
  };

  /* ---------------------- FILE HANDLERS ---------------------- */
  const handleAttachmentAdd = (fileList) => {
    const incoming = Array.isArray(fileList)
      ? fileList
      : Array.from(fileList ?? []);
    if (!incoming.length) return;

    const validFiles = incoming.filter(
      (f) => f.size <= MAX_ATTACHMENT_SIZE_BYTES
    );
    if (validFiles.length < incoming.length)
      toast.warn(`Mỗi file phải nhỏ hơn ${MAX_ATTACHMENT_SIZE_MB}MB`);

    setAttachments((prev) => {
      const available = MAX_ATTACHMENTS - prev.length;
      if (available <= 0) {
        toast.warn(`Chỉ đính kèm tối đa ${MAX_ATTACHMENTS} file`);
        return prev;
      }
      const deduped = validFiles.filter(
        (f) =>
          !prev.some((p) => p.file.name === f.name && p.file.size === f.size)
      );
      const accepted = deduped.slice(0, available).map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()
          .toString(36)
          .slice(2, 10)}`,
        file,
        name: file.name,
        size: file.size,
      }));
      return [...prev, ...accepted];
    });
  };

  const handleAttachmentRemove = (id) => {
    setAttachments((prev) => prev.filter((x) => x.id !== id));
  };

  /* ---------------------- PAYMENT ---------------------- */
  const buildDescription = () => {
    const info = [
      `Tên: ${contact.fullName}`,
      `Email: ${contact.email}`,
      `Điện thoại: ${contact.phone}`,
      `Lịch: ${getScheduleLabel(startDateTime, endDateTime)}`,
      `Thanh toán: ${
        PAYMENT_OPTIONS.find((o) => o.value === paymentMethod)?.label ??
        paymentMethod
      }`,
    ];
    if (contact.note?.trim()) info.unshift(contact.note.trim(), "");
    return info.join("\n");
  };

  const handlePayment = async () => {
    if (submitting) return;
    // 🔹 Nếu chưa đồng ý điều khoản thì báo lỗi và dừng
    if (!agreeTerms) {
      toast.error("Vui lòng đồng ý với điều khoản trước khi thanh toán!");
      return;
    }

    if (!validateStep(1, true)) return;

    const startIso = startDateTime?.toISOString?.();
    const endIso = endDateTime?.toISOString?.();

    if (!startIso || !endIso) {
      toast.error("Kh?ng th? x?c d?nh khung gi?. Vui l?ng th? l?i.");
      return;
    }

    const contactName = contact.fullName?.trim();
    const contactEmail = contact.email?.trim();
    const contactPhone = contact.phone?.trim();
    const note = contact.note?.trim();

    try {
      const req = {
        kolId,
        description: buildDescription(),
        startAt: startIso,
        endAt: endIso,
        paymentMethod,
        contactName: contactName || undefined,
        contactEmail: contactEmail || undefined,
        contactPhone: contactPhone || undefined,
        note: note || undefined,
        isConfirmWithTerms: agreeTerms ? "true" : "false",
      };

      const res = await handleCreateBooking({
        bookingSingleReqDTO: req,
        attachedFiles: attachments.map((a) => a.file),
      });

      const data = res?.data ?? res;
      const payment = data?.data ?? data;
      if (!payment) throw new Error("Thiếu dữ liệu thanh toán");

      const normalizedPayment = {
        contractId: payment.contractId ?? "",
        amount: payment.amount ?? 0,
        qrUrl: payment.qrUrl ?? "",
        transferContent: payment.transferContent ?? "",
        expiresAt: payment.expiresAt ?? null,
        accountName: payment.name ?? "",
        bank: payment.bank ?? "",
        accountNumber: payment.accountNumber ?? "",
      };

      const bookingSummary = {
        kolName: kolName || "KOL",
        schedule: getScheduleLabel(startDateTime, endDateTime),
        startAt: startDateTime.format(),
        endAt: endDateTime.format(),
        total: payment.amount ?? 0,
        paymentMethod:
          PAYMENT_OPTIONS.find((x) => x.value === paymentMethod)?.label ??
          paymentMethod,
      };

      setPaymentResult({ booking: bookingSummary, payment: normalizedPayment });
      onSubmit?.({
        booking: bookingSummary,
        payment: normalizedPayment,
        req,
        attachments,
      });
    } catch (e) {
      toast.error(
        e?.response?.data?.message ?? "Không thể tạo booking. Vui lòng thử lại."
      );
    }
  };

  /* ---------------------- COMPUTED VALUES ---------------------- */
  const summary = useMemo(() => {
    return {
      schedule: getScheduleLabel(startDateTime, endDateTime),
      subtotal: 0,
      extra: 0,
      discount: 0,
      total: 0,
    };
  }, [startDateTime, endDateTime]);

  /* ---------------------- RENDER ---------------------- */
  const isLastStep = activeStep === TEXT.steps.length - 1;
  const primaryAction = isLastStep ? handlePayment : handleContinue;
  const primaryLabel = isLastStep
    ? (submitting ? "Dang xu ly..." : TEXT.actions.pay)
    : TEXT.actions.continue;
  const primaryDisabled = useMemo(() => {
    if (isLastStep) {
      return !agreeTerms || submitting;
    }
    return !validateStep(activeStep);
  });

  const renderStepContent = () => {
    if (paymentResult) {
      return (
        <BookingReceipt
          result={paymentResult}
          onClose={onClose}
          onViewSchedule={
            onViewSchedule ? () => onViewSchedule(paymentResult) : undefined
          }
          STYLE={STYLE}
          TEXT={TEXT}
          formatCurrency={formatCurrency}
        />
      );
    }

    if (activeStep === 0) {
      return (
        <BookingScheduleStep
          startDateTime={startDateTime}
          endDateTime={endDateTime}
          onStartDateTimeChange={setStartDateTime}
          onEndDateTimeChange={setEndDateTime}
          STYLE={STYLE}
          TEXT={TEXT}
        />
      );
    }

    return (
      <BookingContactStep
        contact={contact}
        errors={errors}
        onContactChange={handleContactChange}
        summary={summary}
        agreeTerms={agreeTerms}
        onToggleTerms={handleToggleTerms}
        onOpenTerms={() => setTermsOpen(true)}
        attachments={attachments}
        onAddAttachments={handleAttachmentAdd}
        onRemoveAttachment={handleAttachmentRemove}
        attachmentLimit={MAX_ATTACHMENTS}
        maxAttachmentSizeMb={MAX_ATTACHMENT_SIZE_MB}
        STYLE={STYLE}
        TEXT={TEXT}
        formatCurrency={formatCurrency}
      />
    );
  };

  const renderFooter = () => {
    if (paymentResult) return null;

    return (
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
        <Button
          variant="text"
          onClick={handleBack}
          startIcon={
            activeStep === 0 ? <CloseRoundedIcon /> : <ArrowBackRoundedIcon />
          }
          sx={{
            color: STYLE.textSecondary,
            fontWeight: 500,
            textTransform: "none",
          }}
        >
          {activeStep === 0 ? TEXT.actions.close : TEXT.actions.back}
        </Button>
        <Stack direction="row" spacing={2}>
          {activeStep === 0 && (
            <Button
              variant="outlined"
              onClick={handleHoldSlotClick}
              disabled={!validateStep(0) || holdingSlot}
              sx={{
                textTransform: "none",
                borderRadius: "16px",
                px: 3,
                py: 1.2,
                fontWeight: 600,
                borderColor: STYLE.accent,
                color: STYLE.accent,
                "&:hover": {
                  borderColor: STYLE.accent,
                  backgroundColor: STYLE.accentSoft,
                },
              }}
            >
              {holdingSlot ? "Đang giữ..." : TEXT.actions.hold}
            </Button>
          )}
          <Button
            variant="contained"
            onClick={primaryAction}
            disabled={primaryDisabled}
            sx={{
              textTransform: "none",
              borderRadius: "16px",
              px: 4,
              py: 1.2,
              fontWeight: 600,
              background:
                "linear-gradient(145deg, rgba(74,116,218,1) 0%, rgba(147,206,246,1) 100%)",
              "&:hover": {
                background:
                  "linear-gradient(145deg, rgba(62,100,196,1) 0%, rgba(132,190,230,1) 100%)",
              },
            }}
          >
            {primaryLabel}
          </Button>
        </Stack>
      </Stack>
    );
  };

  const header = (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography
          variant="h6"
          sx={{ color: STYLE.textPrimary, fontWeight: 700 }}
        >
          Đặt lịch với {kolName || "KOL"}
        </Typography>
        <IconButton onClick={onClose}>
          <CloseRoundedIcon />
        </IconButton>
      </Stack>
      {!paymentResult && !isMobile && (
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 1 }}>
          {TEXT.steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}
    </Stack>
  );

  const body = (
    <Stack spacing={3} sx={{ py: 2 }}>
      {header}
      <Box>{renderStepContent()}</Box>
      {renderFooter()}
    </Stack>
  );

  return (
    <>
      {isMobile ? (
        <Drawer
          anchor="bottom"
          open={open}
          onClose={onClose}
          PaperProps={{
            sx: {
              height: "100vh",
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              p: 3,
              backgroundColor: STYLE.surface,
            },
          }}
        >
          {body}
        </Drawer>
      ) : (
        <Dialog
          open={open}
          onClose={onClose}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: {
              borderRadius: "28px",
              backgroundColor: STYLE.surface,
              boxShadow: STYLE.shadow,
              p: 3,
            },
          }}
        >
          <DialogContent sx={{ p: 0 }}>{body}</DialogContent>
        </Dialog>
      )}

      {/* Điều khoản */}
      <Dialog
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: "24px" } }}
      >
        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                variant="h6"
                sx={{ color: STYLE.textPrimary, fontWeight: 700 }}
              >
                {TEXT.terms.heading}
              </Typography>
              <IconButton onClick={() => setTermsOpen(false)}>
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
            <Typography
              sx={{
                color: STYLE.textSecondary,
                lineHeight: 1.7,
                whiteSpace: "pre-line",
              }}
            >
              {TEXT.terms.body}
            </Typography>
            <Button
              variant="contained"
              onClick={() => setTermsOpen(false)}
              sx={{
                alignSelf: "flex-end",
                textTransform: "none",
                borderRadius: "14px",
                backgroundColor: STYLE.accent,
              }}
            >
              {TEXT.terms.agree}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingFlow;
