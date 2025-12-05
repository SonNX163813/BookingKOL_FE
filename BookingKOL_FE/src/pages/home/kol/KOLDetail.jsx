import React, { useCallback, useEffect, useMemo, useState } from "react";
// import {
//   Box,
//   Container,
//   Typography,
//   CircularProgress,
//   Stack,
//   Alert,
//   Snackbar,
//   IconButton,
// } from "@mui/material";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Stack,
  Button,
} from "@mui/material";
import AppSnackbar from "../../../components/UI/AppSnackbar";
import IconButton from "@mui/material/IconButton";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate, useParams } from "react-router-dom";
import ProfileHeader from "../../../components/home/kol-detail/ProfileHeader";
import Introduction from "../../../components/home/kol-detail/Introduction";
import BookingFlow from "../../../components/home/book-kol/BookingFlow";
import { getKolProfileById } from "../../../services/kol/KolAPI";
import hotkolimg from "../../../assets/hotkol.png";
import ReviewsSection from "../../../components/home/kol-detail/ReviewsSection";
import { buildKolReviewsData } from "../../../utils/kolFeedback";

const ROLE_LABELS = {
  LIVE: "Trợ live",
  KOL: "Host chính",
};

const buildRoleInfo = (role) => {
  if (role == null || role === "") {
    return { roleKey: "KOL", roleLabel: ROLE_LABELS.KOL };
  }
  const roleString = role.toString().trim();
  if (!roleString) {
    return { roleKey: "KOL", roleLabel: ROLE_LABELS.KOL };
  }
  const normalized = roleString.toUpperCase();
  if (ROLE_LABELS[normalized]) {
    return { roleKey: normalized, roleLabel: ROLE_LABELS[normalized] };
  }
  return { roleKey: normalized, roleLabel: roleString };
};

const formatDateOfBirth = (dob) => {
  if (!dob) {
    return null;
  }
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return null;
  }
};

const LANGUAGE_LABELS = {
  vi: "Tiếng Việt",
  en: "Tiếng Anh",
  ko: "Tiếng Hàn",
  ja: "Tiếng Nhật",
  zh: "Tiếng Trung",
  fr: "Tiếng Pháp",
  de: "Tiếng Đức",
  th: "Tiếng Thái",
  id: "Tiếng Indonesia",
  es: "Tiếng Tây Ban Nha",
};

const formatLanguages = (languages) => {
  if (!languages) {
    return null;
  }
  const items = Array.isArray(languages)
    ? languages
    : languages.toString().split(/[,;\n]/);

  const formatted = items
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const lower = item.toLowerCase();
      const base = lower.split(/[-_]/)[0];
      if (LANGUAGE_LABELS[lower]) {
        return LANGUAGE_LABELS[lower];
      }
      if (LANGUAGE_LABELS[base]) {
        return LANGUAGE_LABELS[base];
      }
      return item;
    });

  if (formatted.length === 0) {
    return null;
  }
  return formatted.join(", ");
};

const buildHeaderData = (kol) => {
  if (!kol) {
    return null;
  }
  const categoryNames = Array.isArray(kol.categories)
    ? kol.categories.map((category) => category?.name).filter(Boolean)
    : [];
  const location = [kol?.city, kol?.country].filter(Boolean).join(", ");
  const achievements = [];
  if (categoryNames.length > 0) {
    achievements.push(`Chuyên mục: ${categoryNames.join(", ")}`);
  }
  if (location) {
    achievements.push(`Khu vực hoạt động: ${location}`);
  }
  // if (kol?.rateCardNote) {
  //   achievements.push(`Lưu ý: ${kol.rateCardNote}`);
  // }
  const primaryAvatarUrl =
    typeof kol?.avatarUrl === "string" && kol.avatarUrl.trim().length > 0
      ? kol.avatarUrl
      : null;
  const fallbackAvatar =
    kol?.profileImage || kol?.imageUrl || kol?.thumbnailUrl || null;

  const mediaItems = Array.isArray(kol?.fileUsageDtos)
    ? kol.fileUsageDtos
        .map((usage) => {
          const file = usage?.file ?? {};
          const rawType = file?.fileType?.toUpperCase();
          const url = file?.fileUrl;
          if (!url) {
            return null;
          }
          const type = rawType === "VIDEO" ? "VIDEO" : "IMAGE";
          return {
            id: usage?.id ?? file?.id ?? url,
            url,
            type,
            name: file?.fileName ?? "",
            previewUrl: file?.thumbnailUrl ?? file?.previewUrl ?? null,
            isCover: Boolean(usage?.isCover),
          };
        })
        .filter(Boolean)
    : [];

  const imageItems = mediaItems.filter((item) => item.type === "IMAGE");
  const videoItems = mediaItems.filter((item) => item.type === "VIDEO");
  const { roleKey, roleLabel } = buildRoleInfo(kol?.role);

  const avatar =
    primaryAvatarUrl ||
    imageItems.find((item) => item.isCover)?.url ||
    imageItems[0]?.url ||
    fallbackAvatar ||
    hotkolimg;

  let thumbnails = [...imageItems, ...videoItems];

  if (primaryAvatarUrl) {
    const existingIndex = thumbnails.findIndex(
      (item) => item.url === primaryAvatarUrl
    );
    if (existingIndex >= 0) {
      const [existingAvatar] = thumbnails.splice(existingIndex, 1);
      thumbnails = [{ ...existingAvatar, isCover: true }, ...thumbnails];
    } else {
      thumbnails = [
        {
          id: `avatar-${kol.id ?? primaryAvatarUrl}`,
          type: "IMAGE",
          url: primaryAvatarUrl,
          name: "Avatar",
          previewUrl: null,
          isCover: true,
        },
        ...thumbnails,
      ];
    }
  }

  if (thumbnails.length === 0) {
    thumbnails = [
      {
        id: "default-avatar",
        type: "IMAGE",
        url: avatar,
        name: "Avatar",
        previewUrl: null,
        isCover: true,
      },
    ];
  }
  return {
    id: kol.id,
    name: kol.displayName ?? "Đang cập nhật",
    gender: kol.gender ?? null,
    avatar,
    thumbnails: thumbnails,
    isOnline: Boolean(kol.isAvailable),
    roleKey,
    roleLabel,
    stats: {
      followers: kol.followersCount ?? "--",
      fans: kol.followersCount ? `${kol.followersCount}` : "--",
      orders: kol.completedOrders ?? "--",
      rating: Number.isFinite(Number(kol.overallRating))
        ? Number(kol.overallRating)
        : 0,
    },
    achievements,
    bio: kol.bio ?? "",
    shortDescription: kol.bio ?? "",
    tagline: categoryNames.length > 0 ? `Chuyên gia ${categoryNames[0]}` : "",
  };
};

const buildPricingData = (kol) => ({
  hourlyRate: kol?.minBookingPrice ?? null,
  currency: "VND",
  originalPrice: null,
  hasGuarantee: false,
});

const buildPlatformChips = (kol) => {
  if (!Array.isArray(kol?.categories)) {
    return [];
  }
  return kol.categories
    .map((category) => ({
      name: category?.name ?? "Danh mục",
      icon: "tiktok",
      verified: true,
    }))
    .filter((item) => Boolean(item.name));
};

const buildLivestreamVideos = (kol) => {
  if (!Array.isArray(kol?.fileUsageDtos)) {
    return [];
  }

  return kol.fileUsageDtos
    .map((usage) => {
      const file = usage?.file ?? {};
      const rawType = (file?.fileType || usage?.fileType || "")
        .toString()
        .toUpperCase();
      if (rawType !== "VIDEO") {
        return null;
      }

      const url = file?.fileUrl ?? usage?.fileUrl ?? "";
      if (!url) {
        return null;
      }

      return {
        id: usage?.id ?? file?.id ?? url,
        url,
        title: file?.fileName ?? usage?.title ?? "Video livestream",
        thumbnail: file?.thumbnailUrl ?? file?.previewUrl ?? null,
        description: usage?.description ?? file?.description ?? "",
        externalUrl:
          usage?.metadata?.externalUrl ??
          usage?.externalUrl ??
          file?.externalUrl ??
          null,
      };
    })
    .filter(Boolean);
};

const buildIntroductionData = (kol) => {
  const categoryNames = Array.isArray(kol?.categories)
    ? kol.categories.map((category) => category?.name).filter(Boolean)
    : [];
  const location = [kol?.city, kol?.country].filter(Boolean).join(", ");
  const strengths = [kol?.bio, location]
    .flatMap((value) => {
      if (!value) {
        return [];
      }
      if (typeof value === "string") {
        return value
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean);
      }
      return [];
    })
    .slice(0, 5);
  const platformProficiency = categoryNames.map((name) => ({
    platform: name,
    level: "Chuyên gia",
  }));
  const formattedDob = formatDateOfBirth(kol?.dob ?? kol?.dateOfBirth);
  const experienceText =
    typeof kol?.experience === "string"
      ? kol.experience.trim() || null
      : kol?.experience ?? null;
  const languages = formatLanguages(kol?.languages);
  const { roleLabel } = buildRoleInfo(kol?.role);
  const rateCardNote =
    typeof kol?.rateCardNote === "string"
      ? kol.rateCardNote.trim() || null
      : kol?.rateCardNote ?? null;
  return {
    dateOfBirth: formattedDob,
    experience: experienceText,
    strengths: strengths.length > 0 ? strengths : ["Đang cập nhật"],
    platformProficiency:
      platformProficiency.length > 0
        ? platformProficiency
        : [{ platform: "Danh mục", level: "Đang cập nhật" }],
    location: location || null,
    languages,
    roleLabel,
    rateCardNote,
  };
};

const KOLDetail = () => {
  const { kolId } = useParams();
  const [kolData, setKolData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [showNotFoundSnackbar, setShowNotFoundSnackbar] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const navigate = useNavigate();

  const handleCloseErrorSnackbar = () => {
    setShowErrorSnackbar(false);
  };

  const handleCloseNotFoundSnackbar = () => {
    setShowNotFoundSnackbar(false);
  };

  const handleBack = useCallback(() => {
    navigate("/danh-sach-kol");
  }, [navigate]);

  const handleOpenBooking = () => {
    setIsBookingOpen(true);
  };

  const handleCloseBooking = () => {
    setIsBookingOpen(false);
  };

  const handleRetry = () => {
    setShowErrorSnackbar(false);
    fetchKolData();
  };

  const fetchKolData = async () => {
    if (!kolId) {
      setKolData(null);
      setShowNotFoundSnackbar(true);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    setShowErrorSnackbar(false);
    setShowNotFoundSnackbar(false);

    try {
      const response = await getKolProfileById(kolId, {
        signal: controller.signal,
      });

      if (!response) {
        setShowNotFoundSnackbar(true);
        return;
      }

      setKolData(response);
    } catch (err) {
      if (err?.name === "AbortError") {
        return;
      }
      console.error("Failed to fetch KOL detail", err);
      setError("Không thể tải thông tin KOL. Vui lòng thử lại sau.");
      setShowErrorSnackbar(true);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchKolData();
  }, [kolId]);

  const headerData = useMemo(() => buildHeaderData(kolData), [kolData]);
  const pricingData = useMemo(() => buildPricingData(kolData), [kolData]);
  const platformChips = useMemo(() => buildPlatformChips(kolData), [kolData]);
  const introductionData = useMemo(
    () => buildIntroductionData(kolData),
    [kolData]
  );
  const reviewsData = useMemo(() => buildKolReviewsData(kolData), [kolData]);
  const livestreamVideos = useMemo(
    () => buildLivestreamVideos(kolData),
    [kolData]
  );
  const bookingPackages = useMemo(() => {
    if (!kolData) {
      return [];
    }
    if (Array.isArray(kolData.packages)) {
      return kolData.packages;
    }
    if (Array.isArray(kolData.packageDtos)) {
      return kolData.packageDtos;
    }
    if (Array.isArray(kolData.rateCards)) {
      return kolData.rateCards;
    }
    return [];
  }, [kolData]);
  const bookingSlots = useMemo(() => {
    if (!kolData) {
      return {};
    }
    return (
      kolData.availableSlots ??
      kolData.slotCalendar ??
      kolData.schedule ??
      kolData.calendar ??
      {}
    );
  }, [kolData]);
  const bookingProfile = useMemo(() => {
    if (!kolData) {
      return null;
    }
    return (
      kolData.currentUserProfile ??
      kolData.customerProfile ??
      kolData.viewerProfile ??
      kolData.clientProfile ??
      null
    );
  }, [kolData]);
  const shouldShowContent = !isLoading && !error && headerData;
  const bgcolor = `
    radial-gradient(90% 90% at 15% 50%, rgba(74, 116, 218, 0.45) 0%, rgba(147, 206, 246, 0.1) 60%, rgba(147, 206, 246, 0) 80%),
    radial-gradient(90% 90% at 85% 50%, rgba(74, 116, 218, 0.45) 0%, rgba(147, 206, 246, 0.1) 60%, rgba(147, 206, 246, 0) 80%),
    linear-gradient(180deg, rgba(147, 206, 246, 0.18) 0%, rgba(255, 255, 255, 1) 48%, rgba(147, 206, 246, 0.18) 100%)
  `;
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#ffffff",
        position: "relative",
        overflow: "hidden",
        py: { xs: 4, md: 6 },
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          // background: bgcolor,
        }}
      />
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        {isLoading && (
          <Box
            sx={{
              minHeight: "60vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Stack spacing={2} alignItems="center">
              <CircularProgress sx={{ color: "#4a74da" }} />
              <Typography sx={{ color: "#2f3c8c" }}>
                Đang tải thông tin KOL...
              </Typography>
            </Stack>
          </Box>
        )}

        {!isLoading && !kolData && (
          <Box
            sx={{
              minHeight: "60vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ color: "#2f3c8c", fontWeight: 600 }}>
              Không có dữ liệu hiển thị.
            </Typography>
          </Box>
        )}

        {shouldShowContent && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: { xs: 4, md: 5 },
            }}
          >
            <Button
              onClick={handleBack}
              startIcon={<ArrowBackRoundedIcon />}
              sx={{
                alignSelf: "flex-start",
                textTransform: "none",
                fontWeight: 600,
                color: "#4a74da",
                borderRadius: 2,
                border: "1px solid rgba(74, 116, 218, 0.24)",
                px: 2.5,
                py: 1,
                bgcolor: "rgba(74, 116, 218, 0.08)",
                "&:hover": {
                  bgcolor: "rgba(74, 116, 218, 0.16)",
                  borderColor: "rgba(74, 116, 218, 0.32)",
                },
              }}
            >
              Trở về danh sách KOL
            </Button>
            <ProfileHeader
              kol={headerData}
              pricing={pricingData}
              platforms={platformChips}
              onBook={handleOpenBooking}
            />
            <Introduction
              profile={introductionData}
              livestreamVideos={livestreamVideos}
              // feedback={reviewsData}
            />
            <ReviewsSection
              reviews={reviewsData.reviews}
              overallRating={reviewsData.overallRating}
              ratingDistribution={reviewsData.ratingDistribution}
              reviewCount={reviewsData.reviewCount}
            />
          </Box>
        )}

        {/* Thông báo lỗi */}
        {/* <Snackbar
          open={showErrorSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseErrorSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseErrorSnackbar}
            severity="error"
            variant="outlined"
            sx={{
              width: "100%",
              bgcolor: "rgba(11, 15, 14, 0.95)",
              color: "#E6F4EF",
              borderColor: "#f44336",
              "& .MuiAlert-icon": {
                color: "#f44336",
              },
              "& .MuiIconButton-root": {
                color: "#E6F4EF",
                "&:hover": {
                  bgcolor: "rgba(244, 67, 54, 0.1)",
                },
              },
            }}
            action={
              <>
                <IconButton
                  size="small"
                  aria-label="retry"
                  color="inherit"
                  onClick={handleRetry}
                  sx={{ mr: 1 }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Thử lại
                  </Typography>
                </IconButton>
                <IconButton
                  size="small"
                  aria-label="close"
                  color="inherit"
                  onClick={handleCloseErrorSnackbar}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </>
            }
          >
            {error}
          </Alert>
        </Snackbar> */}

        {/* <AppSnackbar
          open={showErrorSnackbar}
          onClose={handleCloseErrorSnackbar}
          autoHideDuration={6000}
          severity="error"
          message={error}
          action={
            <>
              <IconButton
                size="small"
                aria-label="retry"
                color="inherit"
                onClick={handleRetry}
                sx={{ mr: 1 }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Thử lại
                </Typography>
              </IconButton>
            </>
          }
        /> */}

        {/* Thông báo không tìm thấy */}
        {/* <Snackbar
          open={showNotFoundSnackbar}
          autoHideDuration={4000}
          onClose={handleCloseNotFoundSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseNotFoundSnackbar}
            severity="info"
            variant="outlined"
            sx={{
              width: "100%",
              bgcolor: "rgba(11, 15, 14, 0.95)",
              color: "#E6F4EF",
              borderColor: "#2196f3",
              "& .MuiAlert-icon": {
                color: "#2196f3",
              },
              "& .MuiIconButton-root": {
                color: "#E6F4EF",
                "&:hover": {
                  bgcolor: "rgba(33, 150, 243, 0.1)",
                },
              },
            }}
          >
            Không tìm thấy thông tin KOL.
          </Alert>
        </Snackbar> */}

        {/* <AppSnackbar
          open={showNotFoundSnackbar}
          onClose={handleCloseNotFoundSnackbar}
          autoHideDuration={4000}
          severity="info"
          message="Không tìm thấy thông tin KOL."
        /> */}
        <BookingFlow
          open={isBookingOpen}
          onClose={handleCloseBooking}
          kolId={headerData?.id ?? kolId}
          kolName={headerData?.name ?? kolData?.displayName ?? ""}
          packages={bookingPackages}
          availableSlots={bookingSlots}
          userProfile={bookingProfile}
          kolMinPrice={pricingData?.hourlyRate}
          onViewSchedule={handleCloseBooking}
        />
      </Container>
    </Box>
  );
};

export default KOLDetail;
