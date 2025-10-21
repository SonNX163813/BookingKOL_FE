// src/pages/kol/KolPortfolio.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Stack,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AppSnackbar from "../../components/UI/AppSnackbar";

// Reuse UI components từ KOL Detail
import ProfileHeader from "../../components/home/kol-detail/ProfileHeader";
import Introduction from "../../components/home/kol-detail/Introduction";

import {
  getKolProfileById,
  getKolProfileByUserId,
} from "../../services/kol/KolAPI";
import hotkolimg from "../../assets/hotkol.png";

/* ================= Helpers ================= */
const formatDOB = (value) => {
  if (!value) return "Đang cập nhật";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "Đang cập nhật";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const buildHeaderData = (kol) => {
  if (!kol) return null;

  const categoryNames = Array.isArray(kol.categories)
    ? kol.categories.map((c) => c?.name).filter(Boolean)
    : [];
  const location = [kol?.city, kol?.country].filter(Boolean).join(", ");

  const achievements = [];
  if (categoryNames.length)
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
          const f = usage?.file ?? {};
          const type =
            (f?.fileType || "").toUpperCase() === "VIDEO" ? "VIDEO" : "IMAGE";
          const url = f?.fileUrl;
          if (!url) return null;
          return {
            id: usage?.id ?? f?.id ?? url,
            url,
            type,
            name: f?.fileName ?? "",
            previewUrl: f?.thumbnailUrl ?? f?.previewUrl ?? null,
            isCover: Boolean(usage?.isCover),
          };
        })
        .filter(Boolean)
    : [];

  const imageItems = mediaItems.filter((i) => i.type === "IMAGE");
  const videoItems = mediaItems.filter((i) => i.type === "VIDEO");

  const avatar =
    imageItems.find((i) => i.isCover)?.url ||
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
    .flatMap((v) => {
      if (!v) return [];
      if (typeof v === "string") {
        return v
          .split("\n")
          .map((s) => s.trim())
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
    dateOfBirth: formatDOB(kol?.dateOfBirth ?? kol?.dob),
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

/* ================= Component ================= */
export default function KolPortfolio() {
  const { kolId } = useParams();
  const navigate = useNavigate();
  const auth = useAuth?.() || {};
  const userId = auth?.user?.id;

  const [kolData, setKolData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [showNotFoundSnackbar, setShowNotFoundSnackbar] = useState(false);

  const fetchByKolId = async (id, controller) => {
    const res = await getKolProfileById(id, { signal: controller.signal });
    return res;
  };

  const fetchByUserId = async (uid, controller) => {
    const res = await getKolProfileByUserId(uid, { signal: controller.signal });
    return res;
  };

  const fetchKolData = async () => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    setShowErrorSnackbar(false);
    setShowNotFoundSnackbar(false);

    try {
      // 1) Có kolId trên URL -> call by id
      if (kolId) {
        const response = await fetchByKolId(kolId, controller);
        if (!response) {
          setShowNotFoundSnackbar(true);
          return;
        }
        setKolData(response);
        return;
      }

      // 2) Không có kolId nhưng có userId -> lấy hồ sơ theo userId, rồi điều hướng sang URL chuẩn
      if (userId) {
        const me = await fetchByUserId(userId, controller);
        if (!me || !me.id) {
          setShowNotFoundSnackbar(true);
          return;
        }
        // Điều hướng sang URL chuẩn để đồng bộ với KOL Detail
        navigate(`/kol/portfolio/${me.id}`, { replace: true });
        return;
      }

      // 3) Chưa có gì (chưa load auth) -> show thông báo nhẹ
      setShowNotFoundSnackbar(true);
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.error("Failed to fetch KOL detail", err);
      setError("Không thể tải thông tin KOL. Vui lòng thử lại sau.");
      setShowErrorSnackbar(true);
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKolData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kolId, userId]);

  const headerData = useMemo(() => buildHeaderData(kolData), [kolData]);
  const pricingData = useMemo(() => buildPricingData(kolData), [kolData]);
  const platformChips = useMemo(() => buildPlatformChips(kolData), [kolData]);
  const introductionData = useMemo(
    () => buildIntroductionData(kolData),
    [kolData]
  );
  const reviewsData = useMemo(() => buildReviewsData(kolData), [kolData]);
  const livestreamVideos = useMemo(
    () => buildLivestreamVideos(kolData),
    [kolData]
  );

  const shouldShowContent = !isLoading && !error && headerData;

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
      {/* Ẩn các action trong ProfileHeader nếu component gốc đặt aria-label như sau */}
      <style>{`
        [aria-label="Tư vấn thêm"],
        [aria-label="Thuê KOL này"],
        [aria-label="Thuê ngay"] { display: none !important; }
      `}</style>

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
            <ProfileHeader
              kol={headerData}
              pricing={pricingData}
              platforms={platformChips}
              showActions={false}
              pricingLocked
            />
            <Introduction
              profile={introductionData}
              livestreamVideos={livestreamVideos}
              feedback={reviewsData}
            />
          </Box>
        )}

        {/* <AppSnackbar
          open={showErrorSnackbar}
          onClose={() => setShowErrorSnackbar(false)}
          autoHideDuration={6000}
          severity="error"
          message={error}
        /> */}
        {/* <AppSnackbar
          open={showNotFoundSnackbar}
          onClose={() => setShowNotFoundSnackbar(false)}
          autoHideDuration={4000}
          severity="info"
          message="Không tìm thấy thông tin KOL."
        /> */}
      </Container>
    </Box>
  );
}
