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
  MobileStepper,
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
import BookingPackageStep from "./BookingPackageStep";
import BookingScheduleStep from "./BookingScheduleStep";
import BookingContactStep from "./BookingContactStep";
import BookingReceipt from "./BookingReceipt";
import {
  BOOKING_FLOW_STYLE as STYLE,
  BOOKING_FLOW_TEXT as TEXT,
} from "../../../constants/bookingFlowTextStyles";
import { createSingleBooking } from "../../../services/booking/BookingAPI";

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

// Định dạng tiền tệ VND
const formatCurrency = (value) => {
  const amount = Number.isFinite(Number(value)) ? Number(value) : 0;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Chuẩn hóa cấu trúc gói & thời lượng
const normalizePackages = (packages) => {
  if (!Array.isArray(packages)) {
    return [];
  }
  return packages
    .map((pkg, index) => {
      if (!pkg) {
        return null;
      }
      const pkgId = (pkg.id ?? `pkg-${index}`).toString();
      const durationOptions = Array.isArray(pkg.durationOptions)
        ? pkg.durationOptions
            .map((option, optIndex) => {
              if (option === null || option === undefined) {
                return null;
              }
              if (typeof option === "number") {
                return {
                  id: `${pkgId}-duration-${optIndex}`,
                  label: `${option} phút`,
                  minutes: option,
                  price: Number(pkg.basePrice) || 0,
                  surcharge: 0,
                  description: "",
                };
              }
              if (typeof option === "string") {
                const minutes = Number.parseInt(option, 10);
                return {
                  id: `${pkgId}-duration-${optIndex}`,
                  label: option,
                  minutes: Number.isFinite(minutes) ? minutes : null,
                  price: Number(pkg.basePrice) || 0,
                  surcharge: 0,
                  description: "",
                };
              }
              const minutes = Number(
                option.minutes ??
                  option.duration ??
                  option.durationMinutes ??
                  NaN
              );
              const normalizedMinutes = Number.isFinite(minutes)
                ? minutes
                : null;
              const label =
                option.label ||
                (normalizedMinutes
                  ? `${normalizedMinutes} phút`
                  : option.name || "Thời lượng");
              const rawPrice =
                option.price ?? option.amount ?? pkg.basePrice ?? 0;
              const rawSurcharge =
                option.surcharge ?? option.extraFee ?? option.fee ?? 0;
              return {
                id: option.id ?? `${pkgId}-duration-${optIndex}`,
                label,
                minutes: normalizedMinutes,
                price: Number(rawPrice) || 0,
                surcharge: Number(rawSurcharge) || 0,
                description: option.description ?? option.note ?? "",
              };
            })
            .filter(Boolean)
        : [];
      return {
        id: pkgId,
        name: pkg.name ?? `Gói ${index + 1}`,
        basePrice: Number(pkg.basePrice) || 0,
        description: pkg.description ?? pkg.note ?? "",
        durationOptions,
      };
    })
    .filter(Boolean);
};

const padTimeUnit = (value) => String(value).padStart(2, "0");

const toIsoDateTimeString = (instance) =>
  instance ? instance.format("YYYY-MM-DDTHH:mm:ssZ") : null;

const toDayjsInstance = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (dayjs.isDayjs?.(value)) {
    return value.isValid() ? value : null;
  }
  if (value instanceof Date || typeof value === "number") {
    const candidate = dayjs(value);
    return candidate.isValid() ? candidate : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const candidate = dayjs(trimmed);
    if (candidate.isValid() && /\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return candidate;
    }
  }
  return null;
};

const toNormalizedTime = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim();
  if (!text) {
    return null;
  }

  const colonMatch = text.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (colonMatch) {
    const hours = Number(colonMatch[1]);
    const minutes = Number(colonMatch[2]);
    const seconds = colonMatch[3] ? Number(colonMatch[3]) : 0;
    if (
      Number.isFinite(hours) &&
      Number.isFinite(minutes) &&
      Number.isFinite(seconds) &&
      hours >= 0 &&
      hours < 24 &&
      minutes >= 0 &&
      minutes < 60 &&
      seconds >= 0 &&
      seconds < 60
    ) {
      return `${padTimeUnit(hours)}:${padTimeUnit(minutes)}:${padTimeUnit(
        seconds
      )}`;
    }
  }

  const hourMatch = text.match(/(\d{1,2})h(\d{1,2})/i);
  if (hourMatch) {
    const hours = Number(hourMatch[1]);
    const minutes = Number(hourMatch[2]);
    if (
      Number.isFinite(hours) &&
      Number.isFinite(minutes) &&
      hours >= 0 &&
      hours < 24 &&
      minutes >= 0 &&
      minutes < 60
    ) {
      return `${padTimeUnit(hours)}:${padTimeUnit(minutes)}:00`;
    }
  }

  return null;
};

const resolveDateTime = (dateKey, rawValue, fallbackTime) => {
  const direct = toDayjsInstance(rawValue);
  if (direct) {
    return toIsoDateTimeString(direct);
  }

  if (typeof rawValue === "object" && rawValue !== null) {
    const nestedCandidate =
      resolveDateTime(dateKey, rawValue.iso) ??
      resolveDateTime(dateKey, rawValue.value) ??
      resolveDateTime(dateKey, rawValue.start) ??
      resolveDateTime(dateKey, rawValue.time) ??
      resolveDateTime(dateKey, rawValue.from) ??
      resolveDateTime(dateKey, rawValue.begin);
    if (nestedCandidate) {
      return nestedCandidate;
    }
  }

  const normalizedTime =
    toNormalizedTime(rawValue) ?? toNormalizedTime(fallbackTime);
  if (normalizedTime) {
    const candidate = dayjs(`${dateKey}T${normalizedTime}`);
    if (candidate.isValid()) {
      return toIsoDateTimeString(candidate);
    }
  }

  return null;
};

const extractTimeRangeFromLabel = (label) => {
  if (!label) {
    return {
      start: null,
      end: null,
    };
  }
  const text = String(label);
  const colonMatches = text.match(/\d{1,2}:\d{2}(?::\d{2})?/g);
  if (colonMatches && colonMatches.length >= 2) {
    return {
      start: colonMatches[0],
      end: colonMatches[1],
    };
  }

  const hourMatches = [];
  const hourRegex = /(\d{1,2})h(\d{1,2})/gi;
  let match = hourRegex.exec(text);
  while (match) {
    hourMatches.push(`${padTimeUnit(match[1])}:${padTimeUnit(match[2])}:00`);
    match = hourRegex.exec(text);
  }
  if (hourMatches.length >= 2) {
    return {
      start: hourMatches[0],
      end: hourMatches[1],
    };
  }

  return {
    start: null,
    end: null,
  };
};

// Chuẩn hóa map slot theo ngày
const normalizeSlots = (availableSlots) => {
  if (!availableSlots || typeof availableSlots !== "object") {
    return {};
  }
  return Object.entries(availableSlots).reduce((acc, [dateKey, value]) => {
    const slots = Array.isArray(value) ? value : [];
    acc[dateKey] = slots
      .map((slot, index) => {
        if (!slot) {
          return null;
        }
        if (typeof slot === "string") {
          const range = extractTimeRangeFromLabel(slot);
          return {
            id: slot,
            label: slot,
            remaining: null,
            isHeld: false,
            startAt: resolveDateTime(dateKey, null, range.start),
            endAt: resolveDateTime(dateKey, null, range.end),
            startLabel: range.start,
            endLabel: range.end,
            raw: slot,
          };
        }
        const start =
          slot.start ||
          slot.startTime ||
          slot.from ||
          slot.time ||
          slot.begin ||
          "";
        const end = slot.end || slot.endTime || slot.to || slot.finish || "";
        const label =
          slot.label ||
          [start, end].filter(Boolean).join(" - ") ||
          `Slot ${index + 1}`;
        const timeRange = extractTimeRangeFromLabel(label);
        const rawRemaining =
          slot.remaining ?? slot.available ?? slot.quantity ?? null;
        const remaining =
          rawRemaining === null || rawRemaining === undefined
            ? null
            : Number(rawRemaining);
        return {
          id: slot.id ?? `${dateKey}-${index}`,
          label,
          remaining,
          isHeld: Boolean(slot.isHeld || slot.onHold),
          startAt:
            resolveDateTime(
              dateKey,
              slot.startAt ?? slot.startDateTime,
              start
            ) ?? resolveDateTime(dateKey, start, timeRange.start),
          endAt:
            resolveDateTime(dateKey, slot.endAt ?? slot.endDateTime, end) ??
            resolveDateTime(dateKey, end, timeRange.end),
          startLabel: start || timeRange.start,
          endLabel: end || timeRange.end,
          raw: slot,
        };
      })
      .filter(Boolean);
    return acc;
  }, {});
};

// Nhãn hiển thị lịch gọn
const getScheduleLabel = (date, time) => {
  if (!date) return "Chưa chọn";
  const startMoment = dayjs.isDayjs(time?.start)
    ? time.start
    : time?.startAt
    ? dayjs(time.startAt)
    : null;

  const endMoment = dayjs.isDayjs(time?.end)
    ? time.end
    : time?.endAt
    ? dayjs(time.endAt)
    : null;

  if (!startMoment || !startMoment.isValid()) {
    return dayjs(date).format("DD/MM/YYYY");
  }

  const startDateLabel = startMoment.format("DD/MM/YYYY");
  const startTimeLabel = startMoment.format("HH:mm");

  if (!endMoment || !endMoment.isValid()) {
    return `${startDateLabel} ${startTimeLabel}`;
  }

  const endDateLabel = endMoment.format("DD/MM/YYYY");
  const endTimeLabel = endMoment.format("HH:mm");

  // ✅ Nếu khác ngày → hiển thị cả 2 ngày
  if (!endMoment.isSame(startMoment, "day")) {
    return `${startDateLabel} ${startTimeLabel} → ${endDateLabel} ${endTimeLabel}`;
  }

  // ✅ Cùng ngày → hiển thị giờ
  return `${startDateLabel} ${startTimeLabel} → ${endTimeLabel}`;
};

const BookingFlow = ({
  open,
  onClose,
  kolId,
  kolName,
  packages,
  availableSlots: _unusedAvailableSlots,
  userProfile,
  onSubmit,
  onViewSchedule,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Dữ liệu nguồn
  const packageOptions = useMemo(() => normalizePackages(packages), [packages]);

  // State bước & chọn lựa
  const [activeStep, setActiveStep] = useState(0);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [selectedDurationId, setSelectedDurationId] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  // Thông tin liên hệ
  const [contact, setContact] = useState({
    fullName: "",
    email: "",
    phone: "",
    note: "",
  });
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});

  // Điều khoản & thanh toán
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_OPTIONS[0].value);

  // Mã giảm giá
  const [couponInput, setCouponInput] = useState("");
  const [discountState, setDiscountState] = useState({
    code: "",
    amount: 0,
    status: "idle",
    message: "",
  });

  // Trạng thái xử lý
  const [submitting, setSubmitting] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  const selectedPackage = useMemo(
    () => packageOptions.find((pkg) => pkg.id === selectedPackageId) ?? null,
    [packageOptions, selectedPackageId]
  );

  const selectedDuration = useMemo(() => {
    if (!selectedPackage) return null;
    return (
      selectedPackage.durationOptions.find(
        (option) => option.id === selectedDurationId
      ) ?? null
    );
  }, [selectedPackage, selectedDurationId]);

  // Tính giá
  const pricing = useMemo(() => {
    const base = selectedDuration?.price ?? selectedPackage?.basePrice ?? 0;
    const extra = selectedDuration?.surcharge ?? 0;
    const subtotal = base + extra;
    const discount = Math.min(discountState.amount, subtotal);
    return {
      base,
      extra,
      subtotal,
      discount,
      total: Math.max(subtotal - discount, 0),
    };
  }, [selectedDuration, selectedPackage, discountState.amount]);

  // Reset khi mở
  useEffect(() => {
    if (!open) return;
    setActiveStep(0);
    setSelectedPackageId("");
    setSelectedDurationId("");
    setSelectedDate(null);
    setSelectedTime(null);
    setContact({
      fullName: userProfile?.fullName ?? userProfile?.name ?? "",
      email: userProfile?.email ?? userProfile?.contactEmail ?? "",
      phone:
        userProfile?.phone ??
        userProfile?.phoneNumber ??
        userProfile?.contactPhone ??
        "",
      note: "",
    });
    setAttachments([]);
    setErrors({});
    setAgreeTerms(false);
    setTermsOpen(false);
    setPaymentMethod(PAYMENT_OPTIONS[0].value);
    setCouponInput("");
    setDiscountState({ code: "", amount: 0, status: "idle", message: "" });
    setSubmitting(false);
    setPaymentResult(null);
  }, [open, userProfile]);

  // Tự chọn thời lượng nếu chỉ có 1 option
  useEffect(() => {
    if (!selectedPackage) {
      setSelectedDurationId("");
      return;
    }
    if (
      selectedPackage.durationOptions.length === 1 &&
      selectedPackage.durationOptions[0].id !== selectedDurationId
    ) {
      setSelectedDurationId(selectedPackage.durationOptions[0].id);
    }
  }, [selectedPackage, selectedDurationId]);

  // Vô hiệu ngày không còn slot
  const handleDateSelect = (value) => {
    const isSame =
      selectedDate && value
        ? dayjs(selectedDate).isSame(value, "day")
        : selectedDate === value;

    if (!isSame) {
      setSelectedTime(null);
    }

    setSelectedDate(value);
  };

  // Validate theo bước
  const validateStep = (step, { touchErrors = false } = {}) => {
    if (paymentResult) return true;
    const currentStep = typeof step === "number" ? step : activeStep;
    if (currentStep === 0) {
      return Boolean(
        selectedDate && selectedTime?.startAt && selectedTime?.endAt
      );
    }
    if (currentStep === 1) {
      const newErrors = {};
      if (!contact.fullName.trim())
        newErrors.fullName = "Tên không được để trống";
      const emailRegex =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
      if (!emailRegex.test(contact.email))
        newErrors.email = "Email chưa hợp lệ";
      const phoneRegex = /^\d{10,11}$/;
      if (!phoneRegex.test(contact.phone))
        newErrors.phone = "Số điện thoại gồm 10–11 số";
      if (!agreeTerms) newErrors.terms = TEXT.messages.infoInvalid;
      if (touchErrors) {
        setErrors(newErrors);
      }
      return Object.keys(newErrors).length === 0;
    }
    return true;
  };

  const handleContinue = () => {
    if (!validateStep(activeStep, { touchErrors: true })) {
      return;
    }
    setActiveStep((prev) => Math.min(prev + 1, TEXT.steps.length - 1));
  };

  const handleBack = () => {
    if (activeStep === 0) {
      onClose?.();
    } else {
      setActiveStep((prev) => Math.max(prev - 1, 0));
    }
  };

  const handleAttachmentAdd = (fileList) => {
    const incoming = Array.isArray(fileList)
      ? fileList
      : Array.from(fileList ?? []);
    if (!incoming.length) {
      return;
    }

    const sizeTemplate = TEXT.messages.attachmentSize ?? "";
    const sizeMessage = sizeTemplate
      ? sizeTemplate.replace("{size}", MAX_ATTACHMENT_SIZE_MB)
      : `Each file must be ${MAX_ATTACHMENT_SIZE_MB}MB or smaller.`;
    const limitTemplate = TEXT.messages.attachmentLimit ?? "";
    const limitMessage = limitTemplate
      ? limitTemplate.replace("{limit}", MAX_ATTACHMENTS)
      : `You can attach up to ${MAX_ATTACHMENTS} files.`;
    const duplicateMessage =
      TEXT.messages.attachmentDuplicate ?? "This file is already attached.";

    const validFiles = incoming.filter((file) => {
      if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
        return false;
      }
      return true;
    });

    if (validFiles.length < incoming.length) {
      toast.warn(sizeMessage);
    }

    if (!validFiles.length) {
      return;
    }

    setAttachments((prev) => {
      const available = MAX_ATTACHMENTS - prev.length;
      if (available <= 0) {
        toast.warn(limitMessage);
        return prev;
      }

      const deduped = validFiles.filter(
        (file) =>
          !prev.some(
            (item) =>
              item.file.name === file.name &&
              item.file.size === file.size &&
              item.file.lastModified === file.lastModified
          )
      );

      if (!deduped.length) {
        toast.info(duplicateMessage);
        return prev;
      }

      if (deduped.length > available) {
        toast.warn(limitMessage);
      }

      const accepted = deduped.slice(0, available);
      const entries = accepted.map((file) => ({
        id: `${file.name}-${file.lastModified}-${Math.random()
          .toString(36)
          .slice(2, 10)}`,
        file,
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
      }));

      return [...prev, ...entries];
    });
  };

  const handleAttachmentRemove = (attachmentId) => {
    setAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
  };

  const computeScheduleDateTimes = () => {
    if (!selectedDate || !selectedTime) {
      return { startAt: null, endAt: null };
    }

    const startAtMoment = selectedTime.startAt
      ? dayjs(selectedTime.startAt)
      : dayjs.isDayjs(selectedTime.start)
      ? selectedTime.start
      : null;

    if (!startAtMoment || !startAtMoment.isValid()) {
      return { startAt: null, endAt: null };
    }

    let endAtMoment = selectedTime.endAt
      ? dayjs(selectedTime.endAt)
      : dayjs.isDayjs(selectedTime.end)
      ? selectedTime.end
      : null;

    const durationMinutes = Number(selectedDuration?.minutes);

    const fallbackMinutes =
      endAtMoment && endAtMoment.isAfter(startAtMoment)
        ? endAtMoment.diff(startAtMoment, "minute")
        : 60;

    const minutes =
      Number.isFinite(durationMinutes) && durationMinutes > 0
        ? durationMinutes
        : fallbackMinutes > 0
        ? fallbackMinutes
        : 60;

    if (!endAtMoment || !endAtMoment.isAfter(startAtMoment)) {
      endAtMoment = startAtMoment.add(minutes, "minute");
    }

    return {
      startAt: startAtMoment.format("YYYY-MM-DDTHH:mm:ssZ"),
      endAt: endAtMoment.format("YYYY-MM-DDTHH:mm:ssZ"),
    };
  };

  const buildBookingDescription = () => {
    const lines = [];
    const trimmedNote = contact.note?.trim();
    if (trimmedNote) {
      lines.push(trimmedNote);
    }

    const details = [];
    if (contact.fullName) details.push(`Contact name: ${contact.fullName}`);
    if (contact.email) details.push(`Email: ${contact.email}`);
    if (contact.phone) details.push(`Phone: ${contact.phone}`);
    if (selectedPackage?.name) details.push(`Package: ${selectedPackage.name}`);
    if (selectedDuration?.label)
      details.push(`Duration: ${selectedDuration.label}`);
    const scheduleLabel = getScheduleLabel(selectedDate, selectedTime);
    if (scheduleLabel) {
      details.push(`Schedule: ${scheduleLabel}`);
    }
    if (paymentMethod) {
      const methodLabel =
        PAYMENT_OPTIONS.find((option) => option.value === paymentMethod)
          ?.label ?? paymentMethod;
      details.push(`Payment method: ${methodLabel}`);
    }

    if (details.length) {
      if (lines.length) {
        lines.push("");
      }
      lines.push("Booking details:");
      lines.push(...details);
    }
    return lines.join("\n");
  };
  // Áp dụng mã giảm giá demo
  const handleCouponApply = () => {
    if (!couponInput.trim()) {
      setDiscountState({
        code: "",
        amount: 0,
        status: "error",
        message: "Vui lòng nhập mã giảm giá",
      });
      return;
    }
    const code = couponInput.trim().toUpperCase();
    if (code === "KOL10") {
      setDiscountState({
        code,
        amount: pricing.subtotal * 0.1,
        status: "success",
        message: "Giảm 10% tự động cho đơn hàng.",
      });
    } else if (code === "VIP20") {
      setDiscountState({
        code,
        amount: Math.min(pricing.subtotal * 0.2, 300000),
        status: "success",
        message: "Giảm tối đa 300.000₫ cho đơn hàng.",
      });
    } else {
      setDiscountState({
        code: "",
        amount: 0,
        status: "error",
        message: "Mã giảm giá không hợp lệ.",
      });
    }
  };

  // Thanh toán giả lập
  const handlePayment = async () => {
    if (!validateStep(1, { touchErrors: true })) return;
    const { startAt, endAt } = computeScheduleDateTimes();
    if (!startAt || !endAt) {
      toast.error(
        TEXT.messages.scheduleTimeMissing ??
          "Unable to resolve the selected time slot."
      );
      return;
    }

    setSubmitting(true);
    try {
      const bookingSingleReqDTO = {
        kolId,
        description: buildBookingDescription(),
        startAt,
        endAt,
        isConfirmWithTerms: agreeTerms ? "true" : "false",
      };

      const response = await createSingleBooking({
        bookingSingleReqDTO,
        attachedFiles: attachments.map((item) => item.file),
      });

      const payload = response?.data ?? response;
      const paymentPayload = payload?.data ?? payload;
      if (!paymentPayload) {
        throw new Error("Missing payment payload");
      }

      const normalizedPayment = {
        contractId: paymentPayload.contractId ?? "",
        amount: paymentPayload.amount ?? pricing.total,
        qrUrl: paymentPayload.qrUrl ?? "",
        userId: paymentPayload.userId ?? null,
        transferContent: paymentPayload.transferContent ?? "",
        expiresAt: paymentPayload.expiresAt ?? null,
        accountName: paymentPayload.name ?? "",
        bank: paymentPayload.bank ?? "",
        accountNumber: paymentPayload.accountNumber ?? "",
      };

      const bookingSummary = {
        kolName: kolName || "KOL",
        packageName: selectedPackage?.name ?? "",
        duration: selectedDuration?.label ?? "",
        schedule: getScheduleLabel(selectedDate, selectedTime),
        startAt,
        endAt,
        total: pricing.total,
        paymentMethod:
          PAYMENT_OPTIONS.find((item) => item.value === paymentMethod)?.label ??
          paymentMethod,
      };

      setPaymentResult({
        booking: bookingSummary,
        payment: normalizedPayment,
      });

      onSubmit?.({
        booking: bookingSummary,
        payment: normalizedPayment,
        bookingSingleReqDTO,
        attachments,
      });
    } catch (error) {
      console.error("Failed to create booking", error);
      if (!error?.response) {
        toast.error(
          TEXT.messages.paymentFailed ??
            "Could not create booking. Please try again later."
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Tóm tắt
  const summary = {
    kol: kolName || "KOL",
    package: selectedPackage?.name ?? "Chưa chọn",
    duration: selectedDuration?.label ?? "Chưa chọn",
    schedule: getScheduleLabel(selectedDate, selectedTime),
    subtotal: pricing.subtotal,
    discount: pricing.discount,
    extra: pricing.extra,
    total: pricing.total,
  };

  const handleDownloadInvoice = () => {
    console.info(
      "Download invoice",
      paymentResult?.payment?.contractId ?? paymentResult?.payment?.userId
    );
  };

  const handleViewSchedule = () => {
    if (onViewSchedule && paymentResult) {
      onViewSchedule(paymentResult);
    }
    onClose?.();
  };

  const handleContactChange = (field, value) => {
    setContact((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleToggleTerms = (checked) => {
    setAgreeTerms(checked);
    setErrors((prev) => {
      if (!prev.terms) return prev;
      const next = { ...prev };
      delete next.terms;
      return next;
    });
  };

  // Render từng bước
  const renderPackageStep = () => (
    <BookingPackageStep
      packageOptions={packageOptions}
      selectedPackageId={selectedPackageId}
      onSelectPackage={setSelectedPackageId}
      selectedDurationId={selectedDurationId}
      onSelectDuration={setSelectedDurationId}
      selectedPackage={selectedPackage}
      selectedDuration={selectedDuration}
      formatCurrency={formatCurrency}
      STYLE={STYLE}
      TEXT={TEXT}
    />
  );

  const renderScheduleStep = () => (
    <BookingScheduleStep
      selectedDate={selectedDate}
      selectedTime={selectedTime}
      onSelectDate={handleDateSelect}
      onSelectTime={setSelectedTime}
      STYLE={STYLE}
      TEXT={TEXT}
    />
  );

  const renderContactStep = () => (
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

  const renderReceipt = () => (
    <BookingReceipt
      result={paymentResult}
      onDownloadInvoice={handleDownloadInvoice}
      onClose={onClose}
      onViewSchedule={handleViewSchedule}
      STYLE={STYLE}
      TEXT={TEXT}
      formatCurrency={formatCurrency}
    />
  );

  const renderStepContent = () => {
    if (paymentResult) {
      return renderReceipt();
    }
    switch (activeStep) {
      case 0:
        return renderScheduleStep();
      case 1:
      default:
        return renderContactStep();
    }
  };

  const renderFooterActions = () => {
    if (paymentResult) return null;
    const isLastStep = activeStep === TEXT.steps.length - 1;
    const primaryAction = isLastStep ? handlePayment : handleContinue;
    const primaryLabel = isLastStep ? TEXT.actions.pay : TEXT.actions.continue;
    const primaryDisabled =
      !validateStep(activeStep) || (isLastStep && submitting);

    return (
      <Stack direction="row" justifyContent="space-between" sx={{ mt: 3 }}>
        <Button
          variant="text"
          onClick={handleBack}
          startIcon={
            activeStep === 0 ? <CloseRoundedIcon /> : <ArrowBackRoundedIcon />
          }
          sx={{
            textTransform: "none",
            color: STYLE.textSecondary,
            fontWeight: 500,
          }}
        >
          {activeStep === 0 ? TEXT.actions.close : TEXT.actions.back}
        </Button>
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
    );
  };

  // Header
  const header = (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography
          variant="h6"
          sx={{ color: STYLE.textPrimary, fontWeight: 700 }}
        >
          Đặt lịch với {kolName || "KOL"}
        </Typography>
        <IconButton
          onClick={onClose}
          aria-label="Đóng đặt lịch"
          sx={{
            color: STYLE.textSecondary,
            "&:hover": { color: STYLE.textPrimary },
          }}
        >
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

  // Thân nội dung
  const body = (
    <Stack spacing={3} sx={{ py: 2 }}>
      {header}
      <Box>{renderStepContent()}</Box>
      {renderFooterActions()}
      {!paymentResult && isMobile && (
        <MobileStepper
          variant="dots"
          steps={TEXT.steps.length}
          position="static"
          activeStep={activeStep}
          sx={{
            borderRadius: "16px",
            backgroundColor: STYLE.subtleSurface,
            "& .MuiMobileStepper-dotActive": { backgroundColor: STYLE.accent },
          }}
          nextButton={
            activeStep < TEXT.steps.length - 1 ? (
              <Button
                size="small"
                onClick={handleContinue}
                disabled={!validateStep(activeStep)}
                sx={{ textTransform: "none", color: "#ffffff" }}
              >
                {TEXT.actions.continue}
              </Button>
            ) : (
              <Button
                size="small"
                onClick={handlePayment}
                disabled={!validateStep(activeStep) || submitting}
                sx={{ textTransform: "none", color: "#ffffff" }}
              >
                {TEXT.actions.pay}
              </Button>
            )
          }
          backButton={
            <Button
              size="small"
              onClick={handleBack}
              sx={{ textTransform: "none" }}
            >
              {activeStep === 0 ? TEXT.actions.close : TEXT.actions.back}
            </Button>
          }
        />
      )}
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

      {/* Dialog Điều khoản */}
      <Dialog
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: "24px", boxShadow: STYLE.shadow },
        }}
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
                "&:hover": { backgroundColor: "#3d5dc2" },
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
