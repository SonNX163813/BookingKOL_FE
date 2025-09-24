import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Container,
  IconButton,
  Stack,
  Chip,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StarIcon from "@mui/icons-material/Star";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { motion, AnimatePresence } from "framer-motion";

const textVariants = {
  initial: { opacity: 0, y: 30, x: -20 },
  animate: { opacity: 1, y: 0, x: 0 },
  exit: { opacity: 0, y: -30, x: 20 },
};

const imageVariants = {
  initial: { opacity: 0, scale: 0.9, rotate: -2 },
  animate: { opacity: 1, scale: 1, rotate: 0 },
  exit: { opacity: 0, scale: 0.9, rotate: 2 },
};

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const HeroSection = () => {
  const slides = useMemo(
    () => [
      {
        id: "nexus-01",
        badge: "🔥 HOT TREND",
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
        badge: "⚡ AI POWERED",
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
        badge: "🚀 GROWTH",
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
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
      }}
    >
      {/* Animated Background */}
      <Box
        component={motion.div}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 30% 40%, rgba(120, 119, 198, 0.3), transparent 50%), radial-gradient(circle at 80% 10%, rgba(255, 255, 255, 0.15), transparent 50%), radial-gradient(circle at 40% 80%, rgba(132, 90, 223, 0.3), transparent 50%)",
          willChange: "transform",
        }}
        animate={{
          scale: [1, 1.05, 1],
          rotate: [0, 1, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* Floating Elements */}
      <Box
        component={motion.div}
        sx={{
          position: "absolute",
          top: "20%",
          right: "10%",
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(10px)",
          display: { xs: "none", md: "block" },
        }}
        animate={{ y: [-10, 10, -10], rotate: [0, 180, 360] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <Box
        component={motion.div}
        sx={{
          position: "absolute",
          top: "60%",
          left: "5%",
          width: 60,
          height: 60,
          borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%",
          background: "rgba(251, 146, 60, 0.2)",
          display: { xs: "none", lg: "block" },
        }}
        animate={{ x: [-5, 5, -5], scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <Container
        maxWidth="xl"
        sx={{
          position: "relative",
          py: { xs: 6, md: 10 },
          height: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            minHeight: "80vh",
            gap: { xs: 4, md: 6, lg: 8 },
            flexDirection: { xs: "column", lg: "row" },
          }}
        >
          {/* Content Section */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              maxWidth: { xs: "100%", lg: "50%" },
              pr: { lg: 4 },
            }}
          >
            <AnimatePresence mode="wait">
              <Stack
                key={slide.id}
                component={motion.div}
                variants={textVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.8, ease: "easeOut" }}
                spacing={4}
              >
                {/* Badge */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <Chip
                    label={slide.badge}
                    sx={{
                      alignSelf: "flex-start",
                      background:
                        "linear-gradient(45deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))",
                      backdropFilter: "blur(10px)",
                      color: "white",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      px: 2,
                      border: "1px solid rgba(255,255,255,0.2)",
                      "& .MuiChip-label": {
                        px: 1,
                      },
                    }}
                  />
                </motion.div>

                {/* Title */}
                <Typography
                  variant="h1"
                  sx={{
                    fontWeight: 800,
                    fontSize: {
                      xs: "2.5rem",
                      sm: "3.2rem",
                      md: "4rem",
                      lg: "4.5rem",
                      xl: "5rem",
                    },
                    lineHeight: { xs: 1.1, md: 1.05 },
                    background:
                      "linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    letterSpacing: "-0.02em",
                    textShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }}
                >
                  {slide.title}
                </Typography>

                {/* Description */}
                <Typography
                  variant="h6"
                  sx={{
                    color: "rgba(255,255,255,0.9)",
                    fontSize: { xs: "1.15rem", md: "1.3rem" },
                    lineHeight: 1.7,
                    maxWidth: { xs: "100%", lg: "85%" },
                    fontWeight: 400,
                  }}
                >
                  {slide.description}
                </Typography>

                {/* Stats Card */}
                <motion.div
                  variants={cardVariants}
                  initial="initial"
                  animate="animate"
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 2,
                      background: "rgba(255,255,255,0.15)",
                      backdropFilter: "blur(15px)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "20px",
                      px: 3,
                      py: 2,
                      mb: 2,
                    }}
                  >
                    <TrendingUpIcon sx={{ color: "#4ade80", fontSize: 28 }} />
                    <Box>
                      <Typography
                        variant="h5"
                        sx={{ color: "white", fontWeight: 700 }}
                      >
                        {slide.stats.value}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255,255,255,0.8)" }}
                      >
                        {slide.stats.label}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>

                {/* CTA Buttons */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={3}
                  sx={{ pt: 2 }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    sx={{
                      background:
                        "linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 50%, #ffa8a8 100%)",
                      borderRadius: "50px",
                      px: { xs: 4, md: 6 },
                      py: { xs: 2, md: 2.5 },
                      fontSize: { xs: "1.1rem", md: "1.2rem" },
                      fontWeight: 700,
                      textTransform: "none",
                      boxShadow: "0 8px 32px rgba(255, 107, 107, 0.4)",
                      border: "2px solid rgba(255,255,255,0.2)",
                      "&:hover": {
                        background:
                          "linear-gradient(135deg, #ff5252 0%, #ff7979 50%, #ff9ff3 100%)",
                        transform: "translateY(-3px)",
                        boxShadow: "0 12px 40px rgba(255, 107, 107, 0.6)",
                      },
                      transition:
                        "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
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
                      borderColor: "rgba(255,255,255,0.3)",
                      borderRadius: "50px",
                      px: { xs: 4, md: 5 },
                      py: { xs: 2, md: 2.5 },
                      fontSize: { xs: "1rem", md: "1.1rem" },
                      fontWeight: 600,
                      textTransform: "none",
                      background: "rgba(255,255,255,0.05)",
                      backdropFilter: "blur(10px)",
                      "&:hover": {
                        borderColor: "rgba(255,255,255,0.6)",
                        background: "rgba(255,255,255,0.15)",
                        transform: "translateY(-2px)",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    <PlayArrowIcon sx={{ mr: 1 }} />
                    {slide.secondaryLabel}
                  </Button>
                </Stack>
              </Stack>
            </AnimatePresence>

            {/* Navigation */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                mt: { xs: 6, md: 8 },
              }}
            >
              <Box sx={{ display: "flex", gap: 2 }}>
                <IconButton
                  onClick={handlePrev}
                  sx={{
                    color: "white",
                    background: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    width: 50,
                    height: 50,
                    "&:hover": {
                      background: "rgba(255,255,255,0.2)",
                      transform: "scale(1.1)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  <ChevronLeftIcon fontSize="large" />
                </IconButton>

                <IconButton
                  onClick={handleNext}
                  sx={{
                    color: "white",
                    background: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    width: 50,
                    height: 50,
                    "&:hover": {
                      background: "rgba(255,255,255,0.2)",
                      transform: "scale(1.1)",
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  <ChevronRightIcon fontSize="large" />
                </IconButton>
              </Box>

              {/* Slide Indicators */}
              <Box sx={{ display: "flex", gap: 2 }}>
                {slides.map((item, index) => (
                  <Box
                    key={item.id}
                    onClick={() => setCurrentSlide(index)}
                    sx={{
                      width: index === currentSlide ? 40 : 12,
                      height: 12,
                      borderRadius: "6px",
                      cursor: "pointer",
                      background:
                        index === currentSlide
                          ? "linear-gradient(90deg, #ff6b6b, #4ecdc4)"
                          : "rgba(255,255,255,0.4)",
                      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&:hover": {
                        background:
                          index === currentSlide
                            ? "linear-gradient(90deg, #ff6b6b, #4ecdc4)"
                            : "rgba(255,255,255,0.7)",
                        transform: "scale(1.2)",
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>{" "}
          {/* <-- đúng: đóng Content Box */}
          {/* Image Section */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <AnimatePresence mode="wait">
              <Box
                key={slide.image}
                component={motion.div}
                variants={imageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{
                  duration: 1,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                sx={{
                  position: "relative",
                  width: "100%",
                  maxWidth: 600,
                  height: { xs: 400, md: 500, lg: 600 },
                }}
              >
                {/* Main Image */}
                <Box
                  component="img"
                  src={slide.image}
                  alt={slide.title}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "30px",
                    boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
                    border: "3px solid rgba(255,255,255,0.2)",
                  }}
                />

                {/* Overlay */}
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "30px",
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.4), transparent 60%)",
                  }}
                />

                {/* Floating Cards */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  style={{
                    position: "absolute",
                    top: "20%",
                    right: "-15%",
                    display: window.innerWidth > 1200 ? "block" : "none",
                  }}
                >
                  <Box
                    sx={{
                      background: "rgba(255,255,255,0.95)",
                      backdropFilter: "blur(20px)",
                      borderRadius: "20px",
                      p: 3,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      minWidth: 200,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: "#333", fontWeight: 700 }}
                    >
                      Live Views
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ color: "#ff6b6b", fontWeight: 800 }}
                    >
                      2.5M
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#666" }}>
                      Đang xem trực tiếp
                    </Typography>
                  </Box>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1, duration: 0.6 }}
                  style={{
                    position: "absolute",
                    bottom: "15%",
                    left: "-12%",
                    display: window.innerWidth > 1200 ? "block" : "none",
                  }}
                >
                  <Box
                    sx={{
                      background: "rgba(255,255,255,0.95)",
                      backdropFilter: "blur(20px)",
                      borderRadius: "20px",
                      p: 3,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      minWidth: 180,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ color: "#333", fontWeight: 700 }}
                    >
                      Revenue
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ color: "#4ecdc4", fontWeight: 800 }}
                    >
                      +150%
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#666" }}>
                      Tăng trưởng tháng này
                    </Typography>
                  </Box>
                </motion.div>
              </Box>
            </AnimatePresence>
          </Box>{" "}
          {/* <-- đúng: đóng Image Section Box */}
        </Box>{" "}
        {/* <-- đóng khối flex container */}
      </Container>
    </Box>
  );
};

export default HeroSection;
