import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
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

import {
  BOOKING_FLOW_STYLE as STYLE,
  BOOKING_FLOW_TEXT as TEXT,
} from "../../../constants/bookingFlowTextStyles";
import { useCreateBooking as useCreateSingleBooking } from "../../../hook/booking_single/useCreateBooking";
import { useHoldBookingSlot } from "../../../hook/booking_single/useHoldBookingSlot";
import { BOOKING_SINGLE_PAYMENT_STORAGE_KEY } from "../../../constants/storageKeys";

/* ------------------------- CONSTANTS & HELPERS ------------------------- */

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE_MB = 10;
const MAX_ATTACHMENT_SIZE_BYTES = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024;

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
  kolMinPrice = 0,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();

  /* ---------------------- STATE ---------------------- */
  const [activeStep, setActiveStep] = useState(0);
  const [startDateTime, setStartDateTime] = useState(null);
  const [endDateTime, setEndDateTime] = useState(null);
  const [contact, setContact] = useState({
    fullName: "",
    email: "",
    phone: "",
    note: "",
    location: "",
  });
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
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
      location: "",
    });
    setAttachments([]);
    setErrors({});
    setAgreeTerms(false);
    setTermsOpen(false);
    setHeldSlot(null);
  }, [open, userProfile]);

  /* ---------------------- VALIDATION ---------------------- */
  const validateStep = (stepIndex = activeStep, touchErrors = false) => {
    const newErrors = {};

    if (stepIndex === 0) {
      if (!startDateTime || !endDateTime) {
        newErrors.schedule = "Vui long chon ngay gio hop le";
      } else if (!endDateTime.isAfter(startDateTime)) {
        newErrors.schedule = "Thoi gian ket thuc phai sau thoi gian bat dau";
      }
    } else if (stepIndex === 1) {
      if (contact.fullName && !contact.fullName.trim()) {
        newErrors.fullName = "Ten khong hop le";
      }
      if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
        newErrors.email = "Email chua hop le";
      }
      if (contact.phone && !/^\d{9,15}$/.test(contact.phone)) {
        newErrors.phone = "So dien thoai chua hop le";
      }
      if (!agreeTerms) newErrors.terms = "Vui long dong y dieu khoan";
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
    if (!validateStep(activeStep, true)) return;

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
      // ✅ Chỉ chuyển step khi giữ chỗ thành công
      setActiveStep((prev) => Math.min(prev + 1, TEXT.steps.length - 1));
    } catch (err) {
      const errorMsg =
        err?.response?.message ?? "Không thể giữ chỗ. Vui lòng thử lại.";

      // const rawMessage = err?.response?.data?.message;
      // const errorMsg = Array.isArray(rawMessage)
      //   ? rawMessage.join("\n") // ghép nhiều dòng nếu có
      //   : rawMessage || "Không thể giữ chỗ. Vui lòng thử lại.";

      toast.error(errorMsg);
      // ❌ Không chuyển step nếu lỗi
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

  /* ---------------------- SUBMIT ---------------------- */
  const handleSubmit = async () => {
    if (submitting) return;
    if (!agreeTerms) {
      toast.error("Vui long dong y voi dieu khoan truoc khi gui!");
      return;
    }

    if (!validateStep(1, true)) return;

    const startIso = startDateTime?.toISOString?.();
    const endIso = endDateTime?.toISOString?.();

    if (!startIso || !endIso) {
      toast.error("Khong the xac dinh khung gio. Vui long thu lai.");
      return;
    }

    const note = contact.note?.trim();
    const location = contact.location?.trim();
    const fullName = contact.fullName?.trim();
    const email = contact.email?.trim();
    const phone = contact.phone?.trim();

    try {
      const bookingSingleReqDTO = {
        kolId,
        fullName: fullName || "",
        phone: phone || "",
        email: email || "",
        startAt: startIso,
        endAt: endIso,
        description: note || "",
        location: location || "",
        isConfirmWithTerms: !!agreeTerms,
      };

      const payload = {
        bookingSingleReqDTO,
        attachedFiles: attachments.map((a) => a.file),
      };

      const response = await handleCreateBooking(payload);
      const paymentData = response?.data ?? null;

      if (!paymentData) {
        toast.error("Khong tim thay thong tin thanh toan.");
        return;
      }

      if (paymentData) {
        try {
          sessionStorage.setItem(
            BOOKING_SINGLE_PAYMENT_STORAGE_KEY,
            JSON.stringify({ payment: paymentData })
          );
        } catch (storageError) {
          console.error("Cannot persist booking payment data", storageError);
        }
      }

      onSubmit?.({
        response,
        bookingSingleReqDTO,
        attachments,
      });

      onClose?.();
      navigate("/thanh-toan-kol-le", {
        state: {
          payment: paymentData,
          bookingSingleReqDTO,
        },
      });
    } catch (e) {
      toast.error(
        e?.response?.data?.message ?? "Khong the gui booking. Vui long thu lai."
      );
    }
  };

  /* ---------------------- COMPUTED VALUES ---------------------- */
  const summary = useMemo(() => {
    const start = startDateTime ? dayjs(startDateTime) : null;
    const end = endDateTime ? dayjs(endDateTime) : null;
    let duration = "";
    let totalMinutes = 0;

    if (start && end && end.isAfter(start)) {
      totalMinutes = end.diff(start, "minute");
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      if (hours > 0) {
        duration = `${hours}h`;
        if (minutes > 0) duration = `${duration} ${minutes}m`;
      } else if (minutes > 0) {
        duration = `${minutes}m`;
      }
    }

    const normalizedRate = (() => {
      if (typeof kolMinPrice === "number" && Number.isFinite(kolMinPrice)) {
        return kolMinPrice;
      }
      if (typeof kolMinPrice === "string") {
        const sanitized = kolMinPrice.replace(/[^\d.-]/g, "");
        const parsed = Number(sanitized);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    })();

    const billableHours = totalMinutes > 0 ? totalMinutes / 60 : 0;
    const subtotal =
      normalizedRate > 0 && billableHours > 0
        ? normalizedRate * billableHours
        : 0;
    const extra = 0;
    const discount = 0;
    const total = Math.max(subtotal + extra - discount, 0);

    return {
      kol: kolName || "KOL",
      duration: duration || "N/A",
      schedule: getScheduleLabel(startDateTime, endDateTime),
      subtotal,
      extra,
      discount,
      total,
      hourlyRate: normalizedRate,
      billableHours,
    };
  }, [kolName, startDateTime, endDateTime, kolMinPrice]);

  /* ---------------------- RENDER ---------------------- */
  const isLastStep = activeStep === TEXT.steps.length - 1;
  const primaryAction = isLastStep ? handleSubmit : handleHoldSlotClick;
  const primaryLabel = isLastStep
    ? submitting
      ? "Dang xu ly..."
      : TEXT.actions.apply
    : TEXT.actions.continue;
  const primaryDisabled = isLastStep
    ? !agreeTerms || submitting
    : !validateStep(activeStep);

  const renderStepContent = () => {
    if (activeStep === 0) {
      return (
        // <BookingScheduleStep
        //   startDateTime={startDateTime}
        //   endDateTime={endDateTime}
        //   onStartDateTimeChange={setStartDateTime}
        //   onEndDateTimeChange={setEndDateTime}
        //   STYLE={STYLE}
        //   TEXT={TEXT}
        // />
        <BookingScheduleStep
          kolId={kolId}
          STYLE={STYLE}
          TEXT={TEXT}
          onSelectSchedule={(start, end) => {
            setStartDateTime(start);
            setEndDateTime(end);
          }}
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
            <>
              {/* <Button
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
              </Button> */}
              <Button
                variant="contained"
                onClick={handleHoldSlotClick}
                disabled={!validateStep(activeStep)}
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
                {activeStep ? "Đang tiếp tục..." : TEXT.actions.continue}
              </Button>
            </>
          )}
          {activeStep === 1 && (
            <>
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!agreeTerms || submitting}
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
                {submitting ? "Đang chuyển trang..." : TEXT.actions.pay}
              </Button>
            </>
          )}
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
      {!isMobile && (
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
