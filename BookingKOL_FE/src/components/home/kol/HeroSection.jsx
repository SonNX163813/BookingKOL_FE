import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Container,
  IconButton,
  Stack,
  Chip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StarIcon from "@mui/icons-material/Star";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { motion, AnimatePresence } from "framer-motion";

/** Animations tối giản hơn */
const textVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};
const imageVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

const HeroSection = () => {
  const slides = useMemo(
    () => [
      {
        id: "nexus-01",
        title: "Thế Giới Livestream Trong Tay Bạn",
        description:
          "Nexus Social giúp thương hiệu kết nối với người xem qua livestream chuyên nghiệp, giúp tăng trưởng doanh thu và trải nghiệm thật.",
        ctaLabel: "Book KOL Ngay",
        secondaryLabel: "Xem Demo",
        stats: { value: "10M+", label: "Người xem" },
        image:
          "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
      },
      {
        id: "nexus-02",
        title: "Xây Dựng Chiến Dịch KOC Đa Nền Tảng",
        description:
          "Từ sáng tạo nội dung, quản lý KOL đến tổng hợp dữ liệu, chúng tôi đồng hành để bạn tập trung chốt đơn.",
        ctaLabel: "Nhận Tư Vấn",
        secondaryLabel: "Tìm Hiểu Thêm",
        stats: { value: "500+", label: "KOL Partner" },
        image:
          "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
      },
      {
        id: "nexus-03",
        title: "Tối Ưu Đường Đại Cho Thương Hiệu",
        description:
          "Hệ sinh thái partner của Nexus Social giúp bạn tìm đúng giọng nói cho từng nhóm khách hàng mục tiêu.",
        ctaLabel: "Xem KOL Nổi Bật",
        secondaryLabel: "Liên Hệ Ngay",
        stats: { value: "300%", label: "ROI Trung Bình" },
        image:
          "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
      },
    ],
    []
  );

  const [currentSlide, setCurrentSlide] = useState(0);
  const theme = useTheme();
  const upLg = useMediaQuery(theme.breakpoints.up("lg"));
  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)"
  ); // responsive: tôn trọng reduce motion

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };
  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const slide = slides[currentSlide];

  return (
    // <Box
    //   sx={{
    //     position: "relative",
    //     // responsive: dùng minHeight + clamp thay vì fixed height
    //     minHeight: { xs: 520, sm: 560, md: 620 },
    //     display: "flex",
    //     alignItems: "center",
    //     overflow: "hidden",
    //     bgcolor:
    //       "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
    //     background:
    //       "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
    //     borderRadius: { xs: 3, md: 4 },
    //     mx: { xs: 2, md: 4 },
    //     my: { xs: 3, md: 6 },
    //     boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
    //   }}
    // >
    <Box
      sx={{
        position: "relative",
        // responsive: dùng minHeight + clamp thay vì fixed height
        minHeight: { xs: 520, sm: 560, md: 620 },
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        bgcolor:
          "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
        background:
          "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
        borderRadius: { xs: 3, md: 4 },
        maxWidth: { xs: 500, sm: 900, md: 1500 },
        mx: "auto", // 👈 Căn giữa ngang
        my: { xs: 3, md: 3 },
        px: { xs: 2, md: 4 }, // 👈 padding ngang thay vì margin ngang
        boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
      }}
    >
      {/* Nền động nhẹ nhàng */}
      <Box
        component={motion.div}
        style={{ position: "absolute", inset: 0 }}
        animate={prefersReducedMotion ? {} : { opacity: [0.9, 1, 0.9] }} // responsive
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 10, repeat: Infinity, ease: "easeInOut" }
        }
        sx={{
          background:
            "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.15), transparent 45%), radial-gradient(circle at 75% 20%, rgba(255,255,255,0.08), transparent 45%)",
        }}
      />

      <Container
        maxWidth="xl"
        sx={{
          position: "relative",
          py: { xs: 4, md: 6 },
          height: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1.1fr 1fr" },
            alignItems: "center",
            gap: { xs: 3, sm: 4, md: 6 }, // responsive: gap mềm hơn
            width: "100%",
          }}
        >
          {/* Content */}
          <Box sx={{ maxWidth: { xs: 800, xl: 760 } }}>
            <AnimatePresence mode="wait">
              <Stack
                key={slide.id}
                component={motion.div}
                variants={textVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: prefersReducedMotion ? 0 : 0.5 }} // responsive
                spacing={{ xs: 2.25, md: 3 }} // responsive
              >
                {/* <Chip
                  label={slide.badge}
                  sx={{
                    alignSelf: "flex-start",
                    background: "rgba(255,255,255,0.18)",
                    backdropFilter: "blur(8px)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: { xs: "0.8rem", md: "0.85rem" }, // responsive
                    px: 1,
                    border: "1px solid rgba(255,255,255,0.25)",
                  }}
                /> */}

                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 800,
                    // responsive: clamp để tiêu đề xuống dòng đẹp hơn
                    fontSize: "clamp(1.75rem, 3.8vw + 0.5rem, 3.6rem)",
                    lineHeight: { xs: 1.15, md: 1.1 },
                    background:
                      "linear-gradient(135deg, #ffffff 0%, #f3f5f8 60%, #dfe6ee 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    letterSpacing: "-0.01em",
                    textShadow: "0 3px 14px rgba(0,0,0,0.08)",
                    wordBreak: "break-word", // responsive
                  }}
                >
                  {slide.title}
                </Typography>

                <Typography
                  variant="h6"
                  sx={{
                    color: "rgba(255,255,255,0.92)",
                    fontSize: { xs: "0.95rem", md: "1.1rem" }, // responsive
                    lineHeight: 1.7,
                    maxWidth: 680,
                    fontWeight: 400,
                  }}
                >
                  {slide.description}
                </Typography>

                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1.25,
                    // responsive: bỏ width cứng 32%
                    width: "fit-content",
                    maxWidth: { xs: "100%", sm: "unset" },
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    backdropFilter: "blur(10px)",
                    borderRadius: 2,
                    px: 2.25,
                    py: 1.1,
                  }}
                >
                  <TrendingUpIcon
                    sx={{ color: "#4ade80", fontSize: { xs: 20, md: 24 } }}
                  />
                  <Typography
                    variant="subtitle1"
                    sx={{
                      color: "white",
                      fontWeight: 700,
                      fontSize: { xs: "0.95rem", md: "1rem" },
                    }}
                  >
                    {slide.stats.value}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.85)" }}
                  >
                    {slide.stats.label}
                  </Typography>
                </Box>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  sx={{ pt: 1 }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      background:
                        "linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 80%)",
                      borderRadius: 999,
                      // responsive: full width trên mobile
                      width: { xs: "100%", sm: "auto" },
                      px: { xs: 3, md: 5 },
                      py: { xs: 1.25, md: 1.75 },
                      fontSize: { xs: "0.95rem", md: "1.05rem" },
                      fontWeight: 700,
                      textTransform: "none",
                      boxShadow: "0 8px 24px rgba(255, 107, 107, 0.35)",
                      "&:hover": { transform: "translateY(-2px)" },
                      transition: "all .25s ease",
                    }}
                  >
                    <StarIcon sx={{ mr: 1 }} />
                    {slide.ctaLabel}
                  </Button>

                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      color: "white",
                      borderColor: "rgba(255,255,255,0.35)",
                      borderRadius: 999,
                      width: { xs: "100%", sm: "auto" }, // responsive
                      px: { xs: 3, md: 4.25 },
                      py: { xs: 1.25, md: 1.75 },
                      fontSize: { xs: "0.95rem", md: "1rem" },
                      fontWeight: 600,
                      textTransform: "none",
                      background: "rgba(255,255,255,0.05)",
                      backdropFilter: "blur(8px)",
                      "&:hover": {
                        borderColor: "rgba(255,255,255,0.6)",
                        background: "rgba(255,255,255,0.12)",
                        transform: "translateY(-2px)",
                      },
                      transition: "all .25s ease",
                    }}
                  >
                    <PlayArrowIcon sx={{ mr: 1 }} />
                    {slide.secondaryLabel}
                  </Button>
                </Stack>

                {/* Navigation + Indicators */}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{ pt: { xs: 2, md: 3 }, flexWrap: "wrap", rowGap: 1.5 }} // responsive
                >
                  <IconButton
                    onClick={handlePrev}
                    sx={{
                      color: "white",
                      background: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      width: 44,
                      height: 44,
                      "&:hover": { background: "rgba(255,255,255,0.2)" },
                      transition: "all .2s",
                    }}
                    aria-label="Previous slide" // a11y
                  >
                    <ChevronLeftIcon />
                  </IconButton>

                  <IconButton
                    onClick={handleNext}
                    sx={{
                      color: "white",
                      background: "rgba(255,255,255,0.12)",
                      border: "1px solid rgba(255,255,255,0.25)",
                      width: 44,
                      height: 44,
                      "&:hover": { background: "rgba(255,255,255,0.2)" },
                      transition: "all .2s",
                    }}
                    aria-label="Next slide" // a11y
                  >
                    <ChevronRightIcon />
                  </IconButton>

                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {" "}
                    {/* responsive */}
                    {slides.map((item, index) => {
                      const active = index === currentSlide;
                      return (
                        <Box
                          key={item.id}
                          onClick={() => setCurrentSlide(index)}
                          role="button"
                          aria-label={`Go to slide ${index + 1}`}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ")
                              setCurrentSlide(index);
                          }}
                          sx={{
                            width: active ? 28 : 10,
                            height: 8,
                            borderRadius: 999,
                            cursor: "pointer",
                            background: active
                              ? "linear-gradient(90deg, #ff6b6b, #4ecdc4)"
                              : "rgba(255,255,255,0.55)",
                            transition: "all .3s cubic-bezier(.4,0,.2,1)",
                          }}
                        />
                      );
                    })}
                  </Box>
                </Stack>
              </Stack>
            </AnimatePresence>
          </Box>

          {/* Image */}
          <Box sx={{ position: "relative", width: "100%" }}>
            <AnimatePresence mode="wait">
              <Box
                key={slide.image}
                component={motion.div}
                variants={imageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: prefersReducedMotion ? 0 : 0.6 }} // responsive
                sx={{
                  position: "relative",
                  width: "100%",
                  maxWidth: { xs: "100%", lg: 620 }, // responsive
                  ml: { lg: "auto" },
                  // responsive: áp tỷ lệ ảnh để tránh nhảy layout
                  aspectRatio: { xs: "4 / 3", sm: "16 / 10", md: "16 / 9" },
                }}
              >
                <Box
                  component="img"
                  src={slide.image}
                  alt={slide.title}
                  loading="lazy" // responsive: hiệu năng
                  srcSet={`${slide.image} 1x`}
                  sizes="(max-width: 600px) 100vw, 50vw"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    borderRadius: 4,
                    boxShadow: "0 18px 48px rgba(0,0,0,0.28)",
                    border: "2px solid rgba(255,255,255,0.18)",
                  }}
                />
                {/* Card nhỏ – chỉ hiển thị ở lg trở lên để gọn gàng */}
                {upLg && (
                  <Box
                    sx={{
                      position: "absolute",
                      right: { lg: -20, xl: -10 }, // responsive
                      top: "12%",
                      background: "rgba(255,255,255,0.95)",
                      border: "1px solid rgba(0,0,0,0.06)",
                      borderRadius: 2,
                      p: { lg: 1.75, xl: 2 }, // responsive
                      boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
                      minWidth: 180,
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ color: "#444", fontWeight: 700 }}
                    >
                      Live Views
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ color: "#ff6b6b", fontWeight: 800 }}
                    >
                      2.5M
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#666" }}>
                      Đang xem trực tiếp
                    </Typography>
                  </Box>
                )}
              </Box>
            </AnimatePresence>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default HeroSection;
