import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
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
  Alert,
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
import { useReleaseBookingSlot } from "../../../hook/booking_single/useReleaseBookingSlot";
import { BOOKING_SINGLE_REVIEW_STORAGE_KEY } from "../../../constants/storageKeys";
import { useGetPlatforms } from "../../../hook/platform/useGetPlatforms";
import { loadAuth } from "../../../utils/auth";
import { getMyUserProfile } from "../../../services/user/UserService";

/* ------------------------- HẰNG SỐ & HÀM HỖ TRỢ ------------------------- */

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE_MB = 10;
const MAX_ATTACHMENT_SIZE_BYTES = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024;
const HOLD_DURATION_SECONDS = 15 * 60;

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatCountdown = (totalSeconds) => {
  const safeSeconds = Math.max(Number(totalSeconds) || 0, 0);
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(safeSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

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
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);
  const [holdCountdown, setHoldCountdown] = useState(null);
  const [myUserProfile, setMyUserProfile] = useState(null);

  const { isLoadingCreateBooking: submitting, handleCreateBooking } =
    useCreateSingleBooking(null, {
      successToastMessage: null,
      errorToastMessage: null,
    });
  const { isHoldingBookingSlot: holdingSlot, handleHoldBookingSlot } =
    useHoldBookingSlot();
  const { handleReleaseBookingSlot } = useReleaseBookingSlot();
  const {
    platforms,
    isLoadingPlatforms,
    isFetchingPlatforms,
    refetchPlatforms,
    platformsError,
  } = useGetPlatforms();

  // Guard để tránh release nhiều lần và tránh toast hết hạn nhiều lần
  const hasReleasedSlotRef = useRef(false);
  const hasHoldExpiredRef = useRef(false);

  /* ---------------------- Reset khi mở ---------------------- */
  useEffect(() => {
    if (!open) return;

    const now = dayjs();
    const tomorrow = now.add(1, "day");
    const profileSource = myUserProfile || userProfile;

    setActiveStep(0);
    setStartDateTime(now);
    setEndDateTime(tomorrow.hour(now.hour()).minute(now.minute()));
    setContact({
      fullName:
        profileSource?.fullName ??
        profileSource?.name ??
        profileSource?.displayName ??
        "",
      email:
        profileSource?.email ??
        profileSource?.contactEmail ??
        profileSource?.username ??
        "",
      phone: profileSource?.phone ?? profileSource?.phoneNumber ?? "",
      note: "",
      location:
        profileSource?.address ??
        profileSource?.location ??
        profileSource?.cityAddress ??
        "",
      platform: "",
      platformCustom: "",
    });
    setAttachments([]);
    setErrors({});
    setHeldSlot(null);
    setHoldExpiresAt(null);
    setHoldCountdown(null);
    hasReleasedSlotRef.current = false;
    hasHoldExpiredRef.current = false;
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const fetchProfile = async () => {
      try {
        const data = await getMyUserProfile({ signal: controller.signal });
        const profileData = data?.data ?? data ?? null;
        if (!profileData) return;
        setMyUserProfile(profileData);
        setContact((prev) => {
          const updates = {};
          const mapIfEmpty = (key, value) => {
            if (!prev[key] && value) {
              updates[key] = value;
            }
          };
          const fullName =
            profileData.fullName ??
            profileData.name ??
            profileData.displayName ??
            "";
          const email =
            profileData.email ??
            profileData.contactEmail ??
            profileData.username ??
            "";
          const phone = profileData.phone ?? profileData.phoneNumber ?? "";
          const location =
            profileData.address ??
            profileData.location ??
            profileData.cityAddress ??
            "";

          mapIfEmpty("fullName", fullName);
          mapIfEmpty("email", email);
          mapIfEmpty("phone", phone);
          mapIfEmpty("location", location);

          if (!Object.keys(updates).length) return prev;
          return { ...prev, ...updates };
        });
      } catch (error) {
        const aborted =
          controller.signal.aborted || error?.code === "ERR_CANCELED";
        if (aborted) return;
      }
    };

    fetchProfile();
    return () => controller.abort();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const profileSource = myUserProfile || userProfile;
    if (!profileSource) return;

    setContact((prev) => {
      const updates = {};
      const mapIfEmpty = (key, value) => {
        if (!prev[key] && value) {
          updates[key] = value;
        }
      };

      const fullName =
        profileSource.fullName ??
        profileSource.name ??
        profileSource.displayName ??
        "";
      const email =
        profileSource.email ??
        profileSource.contactEmail ??
        profileSource.username ??
        "";
      const phone = profileSource.phone ?? profileSource.phoneNumber ?? "";
      const location =
        profileSource.address ??
        profileSource.location ??
        profileSource.cityAddress ??
        "";

      mapIfEmpty("fullName", fullName);
      mapIfEmpty("email", email);
      mapIfEmpty("phone", phone);
      mapIfEmpty("location", location);

      if (!Object.keys(updates).length) return prev;
      return { ...prev, ...updates };
    });
  }, [open, userProfile, myUserProfile]);

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
  const currentUserId = useMemo(() => {
    const profileSource = myUserProfile || userProfile;
    const fromProfile =
      profileSource?.id ||
      profileSource?.userId ||
      profileSource?.user_id ||
      profileSource?.userID;
    if (fromProfile) return fromProfile;

    const { user } = loadAuth();
    return user?.id || user?.userId || user?.user_id || user?.userID || "";
  }, [userProfile, myUserProfile]);

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

  /* ---------------------- Guard release slot ---------------------- */

  // reset guard mỗi lần giữ slot mới
  useEffect(() => {
    if (heldSlot) {
      hasReleasedSlotRef.current = false;
      hasHoldExpiredRef.current = false;
    }
  }, [heldSlot]);

  const safeReleaseSlot = useCallback(
    async (slot) => {
      if (!slot) return;
      if (hasReleasedSlotRef.current) return; // đã release rồi
      hasReleasedSlotRef.current = true;
      return handleReleaseBookingSlot(slot);
    },
    [handleReleaseBookingSlot]
  );

  /* ---------------------- Chuyển bước ---------------------- */

  const handleBack = async () => {
    if (activeStep === 0) {
      onClose?.();
      return;
    }

    const slot = heldSlot;
    if (slot?.kolId && slot?.startTimeIso && slot?.endTimeIso) {
      try {
        await safeReleaseSlot(slot);
        setHeldSlot(null);
        setHoldExpiresAt(null);
        setHoldCountdown(null);
      } catch (error) {
        toast.error("Không thể hoàn tác khung giờ. Vui lòng thử lại.");
      }
    }

    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleHoldExpiration = useCallback(async () => {
    // tránh xử lý hết hạn nhiều lần (và toast nhiều lần)
    if (hasHoldExpiredRef.current) return;
    hasHoldExpiredRef.current = true;

    const slot = heldSlot;
    if (!slot) return;

    try {
      await safeReleaseSlot(slot);
    } catch (error) {
      // ignore
    } finally {
      setHeldSlot(null);
      setHoldExpiresAt(null);
      setHoldCountdown(null);
      setStartDateTime(null);
      setEndDateTime(null);
      setActiveStep(0);
      toast.warn("Khung giờ giữ đã hết hạn. Vui lòng chọn lại khung giờ.");
    }
  }, [heldSlot, safeReleaseSlot]);

  useEffect(() => {
    if (!heldSlot || !holdExpiresAt) {
      setHoldCountdown(null);
      return;
    }

    let handled = false;
    const tick = () => {
      const remainingMs = holdExpiresAt - Date.now();
      const next = Math.max(Math.floor(remainingMs / 1000), 0);
      setHoldCountdown(next);
      if (next <= 0 && !handled) {
        handled = true;
        handleHoldExpiration();
      }
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [heldSlot, holdExpiresAt, handleHoldExpiration]);

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
      setHoldExpiresAt(Date.now() + HOLD_DURATION_SECONDS * 1000);
      setHoldCountdown(HOLD_DURATION_SECONDS);
      setActiveStep((prev) => Math.min(prev + 1, TEXT.steps.length - 1));
    } catch (err) {
      const errorMsg =
        err?.response?.message ?? "Không thể giữ chỗ. Vui lòng thử lại.";
      // toast.error(errorMsg);
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

  const handleModalClose = (_, reason) => {
    if (reason === "backdropClick" || reason === "escapeKeyDown") return;
    onClose?.();
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

      setHeldSlot(null);
      setHoldExpiresAt(null);
      setHoldCountdown(null);

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
  const renderStepContent = () => {
    if (activeStep === 0) {
      return (
        <BookingScheduleStep
          kolId={kolId}
          STYLE={STYLE}
          TEXT={TEXT}
          currentUserId={currentUserId}
          isOpen={open}
          onSelectSchedule={(start, end) => {
            setStartDateTime(start);
            setEndDateTime(end);
          }}
        />
      );
    }

    return (
      <Stack spacing={2}>
        {heldSlot && holdCountdown !== null && (
          <Alert
            severity="warning"
            sx={{
              borderRadius: "14px",
              backgroundColor: STYLE.subtleSurface,
              border: `1px solid ${STYLE.border}`,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
              sx={{ width: "100%" }}
              spacing={1.5}
            >
              <Box>
                <Typography
                  sx={{
                    fontWeight: 700,
                    mb: 0.5,
                    color: STYLE.textPrimary,
                  }}
                >
                  Bạn đang giữ khung giờ này
                </Typography>
                <Typography sx={{ color: STYLE.textSecondary, fontSize: 14 }}>
                  Sau 15 phút, hệ thống sẽ tự động quay về bước chọn khung giờ
                  và giải phóng slot nếu bạn chưa hoàn tất đặt lịch.
                </Typography>
              </Box>

              <Box
                sx={{
                  minWidth: 150,
                  p: 3,
                  borderRadius: "999px",
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  boxShadow: "0 0 0 1px rgba(255,193,7,0.3)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 22,
                    fontWeight: 700,
                    lineHeight: 1.1,
                  }}
                >
                  {formatCountdown(holdCountdown)}
                </Typography>
              </Box>
            </Stack>
          </Alert>
        )}

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
      </Stack>
    );
  };

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
          onClose={handleModalClose}
          ModalProps={{ disableEscapeKeyDown: true }}
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
          onClose={handleModalClose}
          fullWidth
          maxWidth="md"
          disableEscapeKeyDown
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
