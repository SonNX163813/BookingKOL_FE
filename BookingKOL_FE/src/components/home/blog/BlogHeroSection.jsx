import React from "react";
import { Box, Stack, Typography } from "@mui/material";

const BlogHeroSection = () => (
  <Stack
    spacing={3}
    sx={{
      borderRadius: { xs: 3, md: 4 },
      background: "rgba(255,255,255,0.95)",
      boxShadow: "0 50px 90px rgba(15, 23, 42, 0.12)",
      backdropFilter: "blur(18px)",
      px: { xs: 3, md: 4 },
      py: { xs: 3, md: 4 },
      position: "relative",
      overflow: "hidden",
    }}
  >
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(135deg, rgba(74,116,218,0.18), rgba(255,161,218,0.12))",
        opacity: 0.85,
      }}
    />
    <Stack spacing={2} sx={{ position: "relative", zIndex: 1 }}>
      <Typography
        component="h1"
        variant="h3"
        sx={{ fontWeight: 800, letterSpacing: -0.5 }}
      >
        Blog & Tin tức
      </Typography>
      <Typography variant="body1">
        Cập nhật liên tục xu hướng, câu chuyện thành công và kinh nghiệm từ
        BookingKOL để giúp chiến dịch của bạn bứt phá.
      </Typography>
    </Stack>
  </Stack>
);

export default BlogHeroSection;
