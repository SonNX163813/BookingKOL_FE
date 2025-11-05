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
import { BOOKING_SINGLE_REVIEW_STORAGE_KEY } from "../../../constants/storageKeys";
import { useGetPlatforms } from "../../../hook/platform/useGetPlatforms";

/* ------------------------- HẰNG SỐ & HÀM HỖ TRỢ ------------------------- */

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

/* ------------------------- THÀNH PHẦN CHÍNH ------------------------- */

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
    platform: "",
    platformCustom: "",
  });
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [heldSlot, setHeldSlot] = useState(null);

  const { isLoadingCreateBooking: submitting, handleCreateBooking } =
    useCreateSingleBooking(null, {
      successToastMessage: null,
      errorToastMessage: null,
    });
  const { isHoldingBookingSlot: holdingSlot, handleHoldBookingSlot } =
    useHoldBookingSlot();
  const {
    platforms,
    isLoadingPlatforms,
    isFetchingPlatforms,
    refetchPlatforms,
    platformsError,
  } = useGetPlatforms();

  /* ---------------------- Reset khi mở ---------------------- */
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
      platform: "",
      platformCustom: "",
    });
    setAttachments([]);
    setErrors({});
    setHeldSlot(null);
  }, [open, userProfile]);

  const platformOptions = useMemo(() => {
    if (!Array.isArray(platforms)) return [];
    return platforms
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const name = typeof item.name === "string" ? item.name.trim() : "";
        const key = typeof item.key === "string" ? item.key.trim() : "";
        const id = typeof item.id === "string" ? item.id.trim() : "";
        const label = name || key || id || "";
        if (!label) return null;
        const value = key || id || label;
        const upperKey = key ? key.toUpperCase() : "";
        return {
          value,
          label,
          key,
          id,
          name: label,
          isOther: upperKey === "OTHER",
        };
      })
      .filter(Boolean);
  }, [platforms]);

  const platformLoading = isLoadingPlatforms || isFetchingPlatforms;

  useEffect(() => {
    if (!open) return;
    if (!platformOptions.length) return;

    setContact((prev) => {
      const current = prev?.platform?.trim();
      if (current) return prev;
      const fallback =
        platformOptions.find((option) => !option.isOther) ?? platformOptions[0];
      if (!fallback) return prev;
      return {
        ...prev,
        platform: fallback.value,
        platformCustom: "",
      };
    });
  }, [open, platformOptions]);

  /* ---------------------- Xác thực dữ liệu ---------------------- */
  const validateStep = (stepIndex = activeStep, touchErrors = false) => {
    const newErrors = {};

    if (stepIndex === 0) {
      if (!startDateTime || !endDateTime) {
        newErrors.schedule = "Vui lòng chọn ngày và giờ hợp lệ.";
      } else if (!endDateTime.isAfter(startDateTime)) {
        newErrors.schedule = "Thời gian kết thúc phải sau thời gian bắt đầu.";
      }
    } else if (stepIndex === 1) {
      const fullName = contact.fullName?.trim() ?? "";
      const email = contact.email?.trim() ?? "";
      const phone = contact.phone?.trim() ?? "";
      const location = contact.location?.trim() ?? "";
      const note = contact.note?.trim() ?? "";
      const platform = contact.platform?.trim() ?? "";
      const platformCustom = contact.platformCustom?.trim() ?? "";
      const selectedPlatformOption = platformOptions.find(
        (option) => option.value === platform
      );
      const isOtherPlatform = selectedPlatformOption?.isOther === true;

      if (!fullName) {
        newErrors.fullName = "Vui lòng nhập họ và tên.";
      }
      if (!email) {
        newErrors.email = "Vui lòng nhập email.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = "Email không hợp lệ.";
        toast.error("Email không hợp lệ.");
      }
      if (!phone) {
        newErrors.phone = "Vui lòng nhập số điện thoại.";
      } else if (!/^\d{9,15}$/.test(phone)) {
        newErrors.phone = "Số điện thoại không hợp lệ.";
      }
      if (!location) {
        newErrors.location = "Vui lòng nhập địa chỉ / khu vực.";
      }
      // if (!note) {
      //   newErrors.note = "Vui lòng nhập ghi chú cho buổi làm việc.";
      // }
      if (!platform) {
        newErrors.platform = "Vui lòng chọn nền tảng.";
      } else if (isOtherPlatform && !platformCustom) {
        newErrors.platformCustom = "Vui lòng nhập nền tảng khác.";
      }
      if (!attachments.length) {
        newErrors.attachments = "Vui lòng đính kèm ít nhất 1 tệp.";
      }
    }

    if (touchErrors) setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------------------- Chuyển bước ---------------------- */
  const handleBack = () => {
    if (activeStep === 0) onClose?.();
    else setActiveStep((prev) => Math.max(prev - 1, 0));
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
      // toast.success("Đã giữ chỗ thành công!");
      setActiveStep((prev) => Math.min(prev + 1, TEXT.steps.length - 1));
    } catch (err) {
      const errorMsg =
        err?.response?.message ?? "Không thể giữ chỗ. Vui lòng thử lại.";
      toast.error(errorMsg);
    }
  };

  /* ---------------------- Form liên hệ ---------------------- */
  const handleContactChange = (field, value) => {
    setContact((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  /* ---------------------- Xử lý tệp đính kèm ---------------------- */
  const handleAttachmentAdd = (fileList) => {
    const incoming = Array.isArray(fileList)
      ? fileList
      : Array.from(fileList ?? []);
    if (!incoming.length) return;

    const validFiles = incoming.filter(
      (f) => f.size <= MAX_ATTACHMENT_SIZE_BYTES
    );
    if (validFiles.length < incoming.length)
      toast.warn(`Mỗi tệp phải nhỏ hơn ${MAX_ATTACHMENT_SIZE_MB}MB.`);

    const available = MAX_ATTACHMENTS - attachments.length;
    if (available <= 0) {
      toast.warn(`Bạn chỉ có thể đính kèm tối đa ${MAX_ATTACHMENTS} tệp.`);
      return;
    }

    const deduped = validFiles.filter(
      (f) =>
        !attachments.some(
          (p) => p.file.name === f.name && p.file.size === f.size
        )
    );
    const accepted = deduped.slice(0, available).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()
        .toString(36)
        .slice(2, 10)}`,
      file,
      name: file.name,
      size: file.size,
    }));

    if (!accepted.length) return;

    const nextAttachments = [...attachments, ...accepted];
    setAttachments(nextAttachments);
    setErrors((prev) => {
      if (!prev?.attachments) return prev;
      const { attachments: _ignored, ...rest } = prev;
      return rest;
    });
  };

  const handleAttachmentRemove = (id) => {
    setAttachments((prev) => prev.filter((x) => x.id !== id));
  };

  /* ---------------------- Gửi yêu cầu ---------------------- */
  const handleSubmit = async () => {
    if (submitting) return;
    if (!validateStep(1, true)) return;

    const startIso = startDateTime?.toISOString?.();
    const endIso = endDateTime?.toISOString?.();

    if (!startIso || !endIso) {
      toast.error("Không thể xác định khung giờ. Vui lòng thử lại.");
      return;
    }

    const note = contact.note?.trim();
    const location = contact.location?.trim();
    const fullName = contact.fullName?.trim();
    const email = contact.email?.trim();
    const phone = contact.phone?.trim();
    const platform = contact.platform?.trim();
    const platformCustom = contact.platformCustom?.trim();
    const matchedPlatformOption = platformOptions.find(
      (option) => option.value === platform
    );
    const resolvedPlatform =
      matchedPlatformOption?.isOther === true
        ? platformCustom || ""
        : matchedPlatformOption?.label ?? platform ?? "";

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
        platform: resolvedPlatform || "",
      };

      const payload = {
        bookingSingleReqDTO,
        attachedFiles: attachments.map((a) => a.file),
      };

      const response = await handleCreateBooking(payload);
      const responseData = response?.data ?? null;
      const bookingRequestData = responseData?.data ?? responseData ?? null;

      if (!bookingRequestData?.id) {
        toast.error("Không tìm thấy thông tin yêu cầu đặt lịch.");
        return;
      }

      sessionStorage.setItem(
        BOOKING_SINGLE_REVIEW_STORAGE_KEY,
        JSON.stringify({
          bookingRequest: bookingRequestData,
          bookingSingleReqDTO,
        })
      );

      onSubmit?.({
        response,
        bookingSingleReqDTO,
        attachments,
      });

      onClose?.();
      navigate("/xac-nhan-dat-lich-kol-le", {
        state: {
          bookingRequest: bookingRequestData,
          bookingSingleReqDTO,
        },
      });
    } catch (e) {
      toast.error(
        e?.response?.data?.message ??
          "Không thể gửi yêu cầu đặt lịch. Vui lòng thử lại."
      );
    }
  };

  /* ---------------------- Tính toán tổng hợp ---------------------- */
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
        duration = `${hours} tiếng`;
        if (minutes > 0) duration = `${duration} ${minutes} phút`;
      } else if (minutes > 0) {
        duration = `${minutes} phút`;
      }
    }

    const normalizedRate =
      typeof kolMinPrice === "number"
        ? kolMinPrice
        : Number(String(kolMinPrice).replace(/[^\d.-]/g, "")) || 0;

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
      duration: duration || "Chưa xác định",
      schedule: getScheduleLabel(startDateTime, endDateTime),
      subtotal,
      extra,
      discount,
      total,
      hourlyRate: normalizedRate,
      billableHours,
    };
  }, [kolName, startDateTime, endDateTime, kolMinPrice]);

  /* ---------------------- Giao diện ---------------------- */
  const renderStepContent = () =>
    activeStep === 0 ? (
      <BookingScheduleStep
        kolId={kolId}
        STYLE={STYLE}
        TEXT={TEXT}
        onSelectSchedule={(start, end) => {
          setStartDateTime(start);
          setEndDateTime(end);
        }}
      />
    ) : (
      <BookingContactStep
        contact={contact}
        errors={errors}
        onContactChange={handleContactChange}
        summary={summary}
        attachments={attachments}
        onAddAttachments={handleAttachmentAdd}
        onRemoveAttachment={handleAttachmentRemove}
        attachmentLimit={MAX_ATTACHMENTS}
        maxAttachmentSizeMb={MAX_ATTACHMENT_SIZE_MB}
        STYLE={STYLE}
        TEXT={TEXT}
        formatCurrency={formatCurrency}
        platformOptions={platformOptions}
        platformLoading={platformLoading}
        platformError={platformsError}
        onReloadPlatforms={refetchPlatforms}
      />
    );

  const renderFooter = () => (
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
        {activeStep === 0 ? "Đóng" : "Quay lại"}
      </Button>
      <Stack direction="row" spacing={2}>
        {activeStep === 0 && (
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
            Tiếp tục
          </Button>
        )}
        {activeStep === 1 && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
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
            {submitting ? "Đang xử lý..." : "Xác nhận đặt lịch"}
          </Button>
        )}
      </Stack>
    </Stack>
  );

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
          {["Chọn lịch", "Nhập thông tin"].map((label) => (
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
    </>
  );
};

export default BookingFlow;
