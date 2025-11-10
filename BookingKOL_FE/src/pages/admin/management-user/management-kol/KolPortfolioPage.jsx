import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Stack,
  Button,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";

import ProfileHeader from "../../../../components/home/kol-detail/ProfileHeader";
import Introduction from "../../../../components/home/kol-detail/Introduction";
import ReviewsSection from "../../../../components/home/kol-detail/ReviewsSection";
import { buildKolReviewsData } from "../../../../utils/kolFeedback";

import { getKolProfileById } from "../../../../services/kol/KolAPI";
import hotkolimg from "../../../../assets/hotkol.png";

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
          const rawType = (f?.fileType || usage?.fileType || "")
            .toString()
            .toUpperCase();
          const type = rawType === "VIDEO" ? "VIDEO" : "IMAGE";
          const url = f?.fileUrl ?? usage?.fileUrl;
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
  if (!Array.isArray(kol?.categories)) return [];
  return kol.categories
    .map((c) => ({
      name: c?.name ?? "Danh mục",
      icon: "tiktok",
      verified: true,
    }))
    .filter((x) => Boolean(x.name));
};

const buildLivestreamVideos = (kol) => {
  if (!Array.isArray(kol?.fileUsageDtos)) return [];
  return kol.fileUsageDtos
    .map((usage) => {
      const file = usage?.file ?? {};
      const rawType = (file?.fileType || usage?.fileType || "")
        .toString()
        .toUpperCase();
      if (rawType !== "VIDEO") return null;
      const url = file?.fileUrl ?? usage?.fileUrl ?? "";
      if (!url) return null;
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
    ? kol.categories.map((c) => c?.name).filter(Boolean)
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

/* ================= Page Component ================= */
export default function KolPortfolioPage() {
  const { kolId } = useParams();
  const navigate = useNavigate();

  const [kolData, setKolData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchKolData = async () => {
    if (!kolId) return;
    const controller = new AbortController();
    setIsLoading(true);
    try {
      const response = await getKolProfileById(kolId, {
        signal: controller.signal,
      });
      setKolData(response || null);
    } catch (err) {
      console.error("Failed to fetch KOL detail", err);
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKolData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kolId]);

  const headerData = useMemo(() => buildHeaderData(kolData), [kolData]);
  const pricingData = useMemo(() => buildPricingData(kolData), [kolData]);
  const platformChips = useMemo(() => buildPlatformChips(kolData), [kolData]);
  const introductionData = useMemo(
    () => buildIntroductionData(kolData),
    [kolData]
  );
  const feedback = useMemo(() => buildKolReviewsData(kolData), [kolData]);
  const livestreamVideos = useMemo(
    () => buildLivestreamVideos(kolData),
    [kolData]
  );

  const shouldShowContent = !isLoading && headerData;

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
      {/* Ẩn các action trong ProfileHeader */}
      <style>{`
        [aria-label="Tư vấn thêm"],
        [aria-label="Thuê KOL này"],
        [aria-label="Thuê ngay"] { display: none !important; }
      `}</style>

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        {/* Nút quay lại danh sách (style giống CTA Thuê ngay) */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mb: 2,
          }}
        >
          <Button
            onClick={() => navigate("/admin/management-kol")}
            variant="contained"
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.25,
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "0 8px 20px rgba(74,116,218,0.35)",
              background:
                "linear-gradient(90deg, rgba(74,116,218,1) 0%, rgba(84,130,247,1) 100%)",
              "&:hover": {
                boxShadow: "0 10px 22px rgba(74,116,218,0.45)",
                filter: "brightness(0.98)",
                background:
                  "linear-gradient(90deg, rgba(64,106,208,1) 0%, rgba(74,120,237,1) 100%)",
              },
            }}
          >
            Quay lại danh sách
          </Button>
        </Box>

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
              showActions={false} // phòng khi component hỗ trợ prop ẩn action
              pricingLocked
            />

            <Introduction
              profile={introductionData}
              livestreamVideos={livestreamVideos}
              feedback={feedback}
            />

            {/* Feedback ở dưới cùng */}
            <ReviewsSection
              reviews={feedback.reviews}
              overallRating={feedback.overallRating}
              ratingDistribution={feedback.ratingDistribution}
              reviewCount={feedback.reviewCount}
            />
          </Box>
        )}
      </Container>
    </Box>
  );
}
