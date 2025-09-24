import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  IconButton,
  Grid,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import KOLCard from "./KOLCard";

const HottestKOLs = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const theme = useTheme();
  const reduce = useReducedMotion();

  // Breakpoints → items per page
  const isXs = useMediaQuery(theme.breakpoints.only("xs"));
  const isSm = useMediaQuery(theme.breakpoints.only("sm"));
  const isMd = useMediaQuery(theme.breakpoints.only("md"));
  const itemsPerPage = isXs ? 1 : isSm ? 2 : isMd ? 3 : 4;

  const hottestKOLs = useMemo(
    () => [
      {
        id: "1",
        name: "Sarah Chen",
        field: "Fashion & Lifestyle",
        price: "$2,500",
        rating: 5,
        image:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "2",
        name: "Alex Rodriguez",
        field: "Tech & Gaming",
        price: "$3,200",
        rating: 5,
        image:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "3",
        name: "Emma Thompson",
        field: "Beauty & Wellness",
        price: "$1,800",
        rating: 5,
        image:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "4",
        name: "Marcus Johnson",
        field: "Fitness & Health",
        price: "$2,100",
        rating: 5,
        image:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      },
      {
        id: "5",
        name: "Lily Wang",
        field: "Food & Travel",
        price: "$2,800",
        rating: 5,
        image:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      },
    ],
    []
  );

  // Nhân đôi mảng để slice qua ranh giới
  const extended = useMemo(
    () => [...hottestKOLs, ...hottestKOLs],
    [hottestKOLs]
  );

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % hottestKOLs.length);
  }, [hottestKOLs.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex(
      (prev) => (prev - 1 + hottestKOLs.length) % hottestKOLs.length
    );
  }, [hottestKOLs.length]);

  // Auto-slide mỗi 4s, tắt nếu paused hoặc reduce motion
  useEffect(() => {
    if (paused || reduce) return;
    const interval = setInterval(nextSlide, 4000);
    return () => clearInterval(interval);
  }, [paused, reduce, nextSlide]);

  // Lấy danh sách card hiển thị đủ itemsPerPage
  const visible = useMemo(() => {
    const start = currentIndex;
    const end = start + itemsPerPage;
    // slice trên extended, nhưng key mỗi phần tử nên ổn định → thêm index phụ
    return extended
      .slice(start, end)
      .map((item, i) => ({ ...item, _k: `${item.id}-${start + i}` }));
  }, [extended, currentIndex, itemsPerPage]);

  // Kéo (drag) để chuyển slide
  const handleDragEnd = (_e, info) => {
    const offsetX = info.offset.x;
    const velocityX = info.velocity.x;
    const threshold = 60; // px
    if (offsetX < -threshold || velocityX < -300) nextSlide();
    else if (offsetX > threshold || velocityX > 300) prevSlide();
  };

  return (
    <Box sx={{ py: 8, backgroundColor: "#f9fafb" }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <Typography
              variant="h3"
              sx={{ fontWeight: "bold", color: "#1e293b", mb: 2 }}
            >
              🔥 Hottest KOLs
            </Typography>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <Typography
              variant="h5"
              sx={{ color: "#475569", maxWidth: "42rem", mx: "auto" }}
            >
              Discover the most popular and trending influencers on our platform
            </Typography>
          </motion.div>
        </Box>

        <Box
          sx={{ position: "relative" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Navigation buttons */}
          <IconButton
            onClick={prevSlide}
            sx={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%) translateX(-16px)",
              zIndex: 10,
              backgroundColor: "white",
              "&:hover": { backgroundColor: "#f9fafb" },
              boxShadow: 2,
              border: "1px solid #e5e7eb",
            }}
            aria-label="Previous KOLs"
          >
            <ChevronLeftIcon sx={{ color: "#475569" }} />
          </IconButton>

          <IconButton
            onClick={nextSlide}
            sx={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%) translateX(16px)",
              zIndex: 10,
              backgroundColor: "white",
              "&:hover": { backgroundColor: "#f9fafb" },
              boxShadow: 2,
              border: "1px solid #e5e7eb",
            }}
            aria-label="Next KOLs"
          >
            <ChevronRightIcon sx={{ color: "#475569" }} />
          </IconButton>

          {/* Carousel container */}
          <Box sx={{ overflow: "hidden" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentIndex}-${itemsPerPage}`}
                initial={{ opacity: 0, x: reduce ? 0 : 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: reduce ? 0 : -100 }}
                transition={{ duration: 0.45 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                style={{ cursor: "grab" }}
              >
                <Grid container spacing={3}>
                  {visible.map((kol) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={kol._k}>
                      <KOLCard {...kol} isHot />
                    </Grid>
                  ))}
                </Grid>
              </motion.div>
            </AnimatePresence>
          </Box>

          {/* Dots indicator (bước = 1 phần tử, nên để số dot = tổng item) */}
          <Box
            sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 4 }}
          >
            {hottestKOLs.map((_, index) => (
              <Box
                key={index}
                onClick={() => setCurrentIndex(index)}
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor:
                    index === currentIndex ? "#c026d3" : "#d1d5db",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default HottestKOLs;
