import React from "react";
import { Box, Container } from "@mui/material";
import ProfileHeader from "../../../components/home/kol-detail/ProfileHeader";
import Introduction from "../../../components/home/kol-detail/Introduction";
import ReviewsSection from "../../../components/home/kol-detail/ReviewsSection";

const KOLDetail = () => {
  const kolData = {
    id: "KOL001",
    name: "Sarah Chen",
    gender: "female",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=face",
    thumbnails: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=face",
    ],
    isOnline: true,
    stats: {
      followers: "2.5M",
      fans: "850K",
      orders: "1.234",
      rating: 4.8,
    },
    achievements: [
      "Top 1% Influencer Thời trang 2024",
      "Đại sứ thương hiệu của năm",
    ],
  };

  const pricingData = {
    hourlyRate: "250.000đ",
    currency: "VND",
    originalPrice: "300.000đ",
    hasGuarantee: true,
  };

  const platformsData = [
    { name: "TikTok", icon: "tiktok", verified: true },
    { name: "Facebook", icon: "facebook", verified: true },
    { name: "Instagram", icon: "instagram", verified: false },
  ];

  const profileData = {
    dateOfBirth: "15/03/1995",
    experience: "Hơn 5 năm trong lĩnh vực thời trang & lifestyle",
    strengths: [
      "Trình diễn livestream chuyên nghiệp, dẫn dắt cảm xúc",
      "Kể chuyện thương hiệu thuyết phục, chân thực",
      "Tối ưu nội dung đa nền tảng và chuyển đổi",
      "Hợp tác linh hoạt, quy trình nhanh gọn",
    ],
    platformProficiency: [
      { platform: "TikTok", level: "Chuyên gia" },
      { platform: "Instagram", level: "Nâng cao" },
      { platform: "Facebook", level: "Khá" },
      { platform: "YouTube", level: "Nâng cao" },
    ],
  };

  const reviewsData = [
    {
      id: "1",
      name: "Alex Johnson",
      time: "2 ngày trước",
      rating: 5,
      content:
        "Sarah phối hợp rất chuyên nghiệp, kịch bản livestream rõ ràng và xử lý tình huống linh hoạt. Chúng tôi ghi nhận doanh thu tăng vượt kỳ vọng sau buổi phát sóng.",
    },
    {
      id: "2",
      name: "Maria Rodriguez",
      time: "1 tuần trước",
      rating: 5,
      content:
        "Tỷ lệ giữ chân người xem cao, nội dung chân thật và có chiều sâu. Sarah giúp thương hiệu lan tỏa mạnh trên TikTok Shop chỉ sau 2 chiến dịch.",
    },
    {
      id: "3",
      name: "David Kim",
      time: "2 tuần trước",
      rating: 4,
      content:
        "Quản lý thời gian tốt, chủ động đề xuất concept phù hợp sản phẩm. Chúng tôi sẽ tiếp tục hợp tác cho các chiến dịch tới.",
    },
  ];

  const ratingDistribution = [
    { stars: 5, count: 156, percentage: 78 },
    { stars: 4, count: 32, percentage: 16 },
    { stars: 3, count: 8, percentage: 4 },
    { stars: 2, count: 3, percentage: 1.5 },
    { stars: 1, count: 1, percentage: 0.5 },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#0B0F0E",
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
          background:
            "radial-gradient(60% 60% at 20% 20%, rgba(22, 249, 138, 0.18) 0%, rgba(5, 34, 11, 0) 70%), \
   radial-gradient(50% 50% at 80% 10%, rgba(19, 67, 56, 0.22) 0%, rgba(5, 34, 11, 0) 65%), \
   linear-gradient(160deg, rgba(5, 34, 11, 1) 0%, rgba(19, 67, 56, 0.92) 55%, rgba(22, 249, 138, 0.18) 100%)",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: { xs: 4, md: 5 },
          }}
        >
          <ProfileHeader
            kol={kolData}
            pricing={pricingData}
            platforms={platformsData}
          />

          <Introduction profile={profileData} />

          <ReviewsSection
            reviews={reviewsData}
            overallRating={4.8}
            ratingDistribution={ratingDistribution}
          />
        </Box>
      </Container>
    </Box>
  );
};

export default KOLDetail;
