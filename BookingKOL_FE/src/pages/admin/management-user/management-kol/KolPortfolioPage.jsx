// src/pages/admin/kol/management/KolPortfolioModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "antd";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Stack,
  IconButton,
} from "@mui/material";

import AppSnackbar from "../../../../components/UI/AppSnackbar";
import ProfileHeader from "../../../../components/home/kol-detail/ProfileHeader";
import Introduction from "../../../../components/home/kol-detail/Introduction";
import ReviewsSection from "../../../../components/home/kol-detail/ReviewsSection";
import BookingFlow from "../../../../components/home/book-kol/BookingFlow";

import { getKolProfileById } from "../../../../services/kol/KolAPI";
import hotkolimg from "../../../../assets/hotkol.png";

/* ================= Helpers (bám theo file bạn gửi) ================= */
const buildHeaderData = (kol) => {
  if (!kol) return null;

  const categoryNames = Array.isArray(kol.categories)
    ? kol.categories.map((category) => category?.name).filter(Boolean)
    : [];

  const location = [kol?.city, kol?.country].filter(Boolean).join(", ");

  const achievements = [];
  if (categoryNames.length > 0)
    achievements.push(`Chuyên mục: ${categoryNames.join(", ")}`);
  if (location) achievements.push(`Khu vực hoạt động: ${location}`);

  const fallbackAvatar =
    kol?.avatarUrl ||
    kol?.profileImage ||
    kol?.imageUrl ||
    kol?.thumbnailUrl ||
    null;

  const mediaItems = Array.isArray(kol?.fileUsageDtos)
    ? kol.fileUsageDtos
        .map((usage) => {
          const file = usage?.file ?? {};
          const rawType = file?.fileType?.toUpperCase();
          const url = file?.fileUrl;
          if (!url) return null;
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

  const avatar =
    imageItems.find((item) => item.isCover)?.url ||
    imageItems[0]?.url ||
    fallbackAvatar ||
    hotkolimg;

  const thumbnails =
    mediaItems.length > 0
      ? [...imageItems, ...videoItems]
      : [
          {
            id: "default-avatar",
            type: "IMAGE",
            url: avatar,
            name: "Avatar",
            previewUrl: null,
            isCover: true,
          },
        ];

  return {
    id: kol.id,
    name: kol.displayName ?? "Đang cập nhật",
    gender: kol.gender ?? null,
    avatar,
    thumbnails,
    isOnline: Boolean(kol.isAvailable),
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
  if (!Array.isArray(kol?.categories)) return [];
  return kol.categories
    .map((category) => ({
      name: category?.name ?? "Danh mục",
      icon: "tiktok",
      verified: true,
    }))
    .filter((item) => Boolean(item.name));
};

const buildIntroductionData = (kol) => {
  const categoryNames = Array.isArray(kol?.categories)
    ? kol.categories.map((category) => category?.name).filter(Boolean)
    : [];
  const location = [kol?.city, kol?.country].filter(Boolean).join(", ");

  const strengths = [kol?.bio, location]
    .flatMap((value) => {
      if (!value) return [];
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

  return {
    dateOfBirth: kol?.dateOfBirth ?? "Đang cập nhật",
    experience: kol?.experience ?? "Đang cập nhật",
    strengths: strengths.length > 0 ? strengths : ["Đang cập nhật"],
    platformProficiency:
      platformProficiency.length > 0
        ? platformProficiency
        : [{ platform: "Danh mục", level: "Đang cập nhật" }],
  };
};

const buildReviewsData = (kol) => {
  const reviewCount = Number.isFinite(Number(kol?.feedbackCount))
    ? Number(kol.feedbackCount)
    : 0;
  const rating = Number.isFinite(Number(kol?.overallRating))
    ? Number(kol.overallRating)
    : 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: 0,
    percentage: 0,
  }));
  return {
    reviews: [],
    overallRating: rating,
    ratingDistribution,
    reviewCount,
  };
};

/* ================= Modal Component ================= */
export default function KolPortfolioModal({ open, onClose, kolId }) {
  const [kolData, setKolData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [showNotFoundSnackbar, setShowNotFoundSnackbar] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const handleOpenBooking = () => setIsBookingOpen(true);
  const handleCloseBooking = () => setIsBookingOpen(false);

  const handleCloseErrorSnackbar = () => setShowErrorSnackbar(false);
  const handleCloseNotFoundSnackbar = () => setShowNotFoundSnackbar(false);
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
      if (err?.name !== "AbortError") {
        console.error("Failed to fetch KOL detail", err);
        setError("Không thể tải thông tin KOL. Vui lòng thử lại sau.");
        setShowErrorSnackbar(true);
      }
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchKolData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, kolId]);

  const headerData = useMemo(() => buildHeaderData(kolData), [kolData]);
  const pricingData = useMemo(() => buildPricingData(kolData), [kolData]);
  const platformChips = useMemo(() => buildPlatformChips(kolData), [kolData]);
  const introductionData = useMemo(
    () => buildIntroductionData(kolData),
    [kolData]
  );
  const reviewsData = useMemo(() => buildReviewsData(kolData), [kolData]);

  const bookingPackages = useMemo(() => {
    if (!kolData) return [];
    if (Array.isArray(kolData.packages)) return kolData.packages;
    if (Array.isArray(kolData.packageDtos)) return kolData.packageDtos;
    if (Array.isArray(kolData.rateCards)) return kolData.rateCards;
    return [];
  }, [kolData]);

  const bookingSlots = useMemo(() => {
    if (!kolData) return {};
    return (
      kolData.availableSlots ??
      kolData.slotCalendar ??
      kolData.schedule ??
      kolData.calendar ??
      {}
    );
  }, [kolData]);

  const bookingProfile = useMemo(() => {
    if (!kolData) return null;
    return (
      kolData.currentUserProfile ??
      kolData.customerProfile ??
      kolData.viewerProfile ??
      kolData.clientProfile ??
      null
    );
  }, [kolData]);

  const shouldShowContent = !isLoading && !error && headerData;

  return (
    <Modal
      title="Chi tiết KOL"
      open={open}
      onCancel={onClose}
      footer={null}
      width={1100}
      destroyOnClose
      bodyStyle={{ padding: 0 }}
    >
      <Box
        sx={{
          minHeight: 400,
          bgcolor: "#ffffff",
          position: "relative",
          overflow: "hidden",
          py: { xs: 3, md: 4 },
        }}
      >
        <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
          {isLoading && (
            <Box
              sx={{
                minHeight: "40vh",
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
                minHeight: "40vh",
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
                pb: 2,
              }}
            >
              <ProfileHeader
                kol={headerData}
                pricing={pricingData}
                platforms={platformChips}
                onBook={handleOpenBooking}
              />
              <Introduction profile={introductionData} />
              <ReviewsSection
                reviews={reviewsData.reviews}
                overallRating={reviewsData.overallRating}
                ratingDistribution={reviewsData.ratingDistribution}
              />
            </Box>
          )}

          {/* Snackbar lỗi */}
          <AppSnackbar
            open={showErrorSnackbar}
            onClose={handleCloseErrorSnackbar}
            autoHideDuration={6000}
            severity="error"
            message={error}
            action={
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
            }
          />

          {/* Snackbar không tìm thấy */}
          <AppSnackbar
            open={showNotFoundSnackbar}
            onClose={handleCloseNotFoundSnackbar}
            autoHideDuration={4000}
            severity="info"
            message="Không tìm thấy thông tin KOL."
          />

          {/* Booking flow giống trang chi tiết */}
          <BookingFlow
            open={isBookingOpen}
            onClose={handleCloseBooking}
            kolId={headerData?.id ?? kolId}
            kolName={headerData?.name ?? kolData?.displayName ?? ""}
            packages={bookingPackages}
            availableSlots={bookingSlots}
            userProfile={bookingProfile}
            onViewSchedule={handleCloseBooking}
          />
        </Container>
      </Box>
    </Modal>
  );
}
