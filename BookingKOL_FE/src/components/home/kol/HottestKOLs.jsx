import React, { useMemo, useState, useEffect } from "react";
import {
  Typography,
  Box,
  Paper,
  Stack,
  IconButton,
  useTheme,
  useMediaQuery,
  Chip,
  Tooltip,
} from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import KOLCard from "./KOLCard";
import hotkolimg from "../../../assets/hotkol.png";
import ElectricBorder from "../../UI/electricBorder/ElectricBorder";
import { slugify } from "../../../utils/slugify";

const HottestKOLs = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isLg = useMediaQuery(theme.breakpoints.up("lg"));
  const isMd = useMediaQuery(theme.breakpoints.up("md"));
  const isSm = useMediaQuery(theme.breakpoints.up("sm"));

  // Hiển thị 1/2/3/4 card theo breakpoint
  const visibleCount = isLg ? 4 : isMd ? 3 : isSm ? 2 : 1;

  // --- TÙY BIẾN ẢNH NGAY TẠI HottestKOLs ---
  // Media luôn đồng nhất chiều cao theo breakpoint
  const mediaContainerFixed = {
    // chiều cao cứng -> ảnh luôn bằng nhau
    height: { xs: 200, sm: 240, md: 300, lg: 320 },

    // NGĂN mọi style cũ can thiệp
    minHeight: "unset",
    maxHeight: "none",
    aspectRatio: "auto",

    // tắt fallback ::before nếu KOLCard có
    "@supports not (aspect-ratio: 1 / 1)": {
      "&::before": {
        display: "none !important",
        paddingTop: "0 !important",
        paddingBottom: "0 !important",
      },
    },

    overflow: "hidden",
  };
  // Ảnh luôn ở giữa & phủ kín khung (đẹp, không viền đen)
  const mediaFitCenter = {
    objectFit: "cover !important",
    objectPosition: "center !important",

    // tránh hở do làm tròn subpixel: phóng to 1px mỗi cạnh
    width: "calc(100% + 2px) !important",
    height: "calc(100% + 2px) !important",
    left: "-1px !important",
    top: "-1px !important",

    // giúp browser compositing mượt, tránh viền hairline khi hover/translate
    transform: "translateZ(0)",
    backfaceVisibility: "hidden",
  };
  // (Nếu muốn không cắt ảnh: dùng contain + nền)
  // const mediaFitCenter = { objectFit: "contain", objectPosition: "center", backgroundColor: "#0b1220" };

  // Demo data
  const hottestKOLsData = useMemo(
    () => [
      {
        id: "1",
        name: "Vanh >.<",
        field: "Host Streamer",
        price: "250.000đ/giờ",
        originalPrice: "280.000đ/giờ",
        rating: 4.95,
        reviewCount: 355,
        image: hotkolimg,
      },
      {
        id: "2",
        name: "Minh Anh",
        field: "Host Stream",
        price: "320.000đ/giờ",
        originalPrice: "360.000đ/giờ",
        rating: 4.87,
        reviewCount: 421,
        image: hotkolimg,
      },
      {
        id: "3",
        name: "Kiara",
        field: "Beauty Reviewer",
        price: "280.000đ/giờ",
        originalPrice: "315.000đ/giờ",
        rating: 4.9,
        reviewCount: 298,
        image: hotkolimg,
      },
      {
        id: "4",
        name: "Linh",
        field: "Twitch Streamer",
        price: "260.000đ/giờ",
        originalPrice: "290.000đ/giờ",
        rating: 4.92,
        reviewCount: 374,
        image: hotkolimg,
      },
      {
        id: "5",
        name: "Haru",
        field: "Gaming Creator",
        price: "300.000đ/giờ",
        originalPrice: "340.000đ/giờ",
        rating: 4.85,
        reviewCount: 212,
        image: hotkolimg,
      },
    ],
    []
  );

  // Sort theo rating (desc)
  const hottestKOLs = useMemo(
    () =>
      [...hottestKOLsData].sort(
        (a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0)
      ),
    [hottestKOLsData]
  );

  const [currentIndex, setCurrentIndex] = useState(0);

  // Giữ currentIndex hợp lệ khi thay đổi viewport
  useEffect(() => {
    const maxIndexForViewport = Math.max(hottestKOLs.length - visibleCount, 0);
    setCurrentIndex((prev) => Math.min(prev, maxIndexForViewport));
  }, [hottestKOLs.length, visibleCount]);

  const maxIndex = Math.max(hottestKOLs.length - visibleCount, 0);
  const itemBasis = `${(1 / visibleCount) * 100}%`;
  const translatePercentage = (100 / visibleCount) * currentIndex;

  const handlePrev = () => setCurrentIndex((p) => Math.max(p - 1, 0));
  const handleNext = () => setCurrentIndex((p) => Math.min(p + 1, maxIndex));

  return (
    <Paper
      sx={{
        p: { xs: 2.5, md: 4 },
        borderRadius: 4,
        border: "1px solid #e2e8f0",
        boxShadow:
          "0 2px 8px rgba(15,23,42,0.04), 0 20px 40px rgba(15,23,42,0.06)",
        background:
          "linear-gradient(180deg,#ffffff 0%,#fcfcff 35%,#f8fbff 100%)",
        display: "flex",
        flexDirection: "column",
        gap: { xs: 2.25, md: 4 },
        position: "relative",
        overflow: "hidden",
        // Đồng bộ chiều cao card trong slider (tham chiếu minHeight ở KOLCard)
        "--card-min": 420,
      }}
    >
      {/* Accent blur */}
      <Box
        sx={{
          position: "absolute",
          inset: "-40% -10% auto -10%",
          height: { xs: 180, md: 240 },
          background:
            "radial-gradient(60% 60% at 50% 40%, rgba(202,84,202,0.16) 0%, rgba(202,84,202,0.06) 60%, transparent 100%)",
          filter: "blur(30px)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <Stack spacing={1.25} sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Chip
              label="Tuần này"
              size="small"
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                letterSpacing: 0.2,
                bgcolor: "rgba(202,84,202,0.12)",
                color: "#8b5cf6",
                border: "1px solid rgba(139,92,246,0.18)",
                ".MuiChip-label": { px: 1.25 },
              }}
            />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: "#0f172a",
                display: "flex",
                alignItems: "baseline",
                gap: 1,
                letterSpacing: "-0.02em",
                fontSize: { xs: "1.6rem", md: "2rem" },
              }}
            >
              Hot KOLs
              <Typography
                component="span"
                variant="h6"
                sx={{
                  color: "#64748b",
                  fontWeight: 600,
                  fontSize: { xs: "1rem", md: "1.125rem" },
                }}
              >
                — Bảng xếp hạng nổi bật
              </Typography>
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Trước">
              <span>
                <IconButton
                  aria-label="Trước"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  sx={{
                    border: "1px solid #e2e8f0",
                    backgroundColor: "white",
                    "&:hover": { backgroundColor: "#f8fafc" },
                    "&.Mui-disabled": { opacity: 0.45, cursor: "not-allowed" },
                  }}
                >
                  <ChevronLeft />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Tiếp theo">
              <span>
                <IconButton
                  aria-label="Tiếp theo"
                  onClick={handleNext}
                  disabled={currentIndex === maxIndex}
                  sx={{
                    border: "1px solid #e2e8f0",
                    backgroundColor: "white",
                    "&:hover": { backgroundColor: "#f8fafc" },
                    "&.Mui-disabled": { opacity: 0.45, cursor: "not-allowed" },
                  }}
                >
                  <ChevronRight />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        <Typography
          variant="body1"
          sx={{ color: "#475569", fontSize: { xs: "0.95rem", md: "1rem" } }}
        >
          Khám phá bảng xếp hạng KOLs hot nhất tuần này. Đặt lịch nhanh, theo
          dõi đánh giá thực tế và chọn gói phù hợp.
        </Typography>
      </Stack>

      {/* Slider */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          pt: { xs: 3, md: 4.5 },
          mx: { xs: -0.5, sm: -1.5 },
        }}
      >
        <Box
          component={motion.div}
          animate={{ transform: `translateX(-${translatePercentage}%)` }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          sx={{
            display: "flex",
            width: "100%",
            alignItems: "stretch", // mọi slide cùng chiều cao
          }}
          role="list"
          aria-label="Danh sách Hot KOLs"
        >
          {hottestKOLs.map((kol, index) => {
            const rank = index + 1;
            const isTopOne = rank === 1;
            const handleCardClick = () => {
              const slug = slugify(kol.name) || kol.id;
              navigate(`/danh-sach-kol/${kol.id}/${slug}`);
            };

            return (
              <Box
                key={kol.id}
                role="listitem"
                sx={{
                  px: { xs: 0.75, sm: 1.25, md: 1.5 },
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  minHeight: "var(--card-min)px",
                }}
              >
                <Box
                  component={motion.div}
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18 }}
                  sx={{
                    position: "relative",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: "var(--card-min)px",
                  }}
                >
                  {/* Huy hiệu thứ hạng */}
                  <Box
                    sx={{
                      position: "absolute",
                      top: { xs: -16, md: -22 },
                      right: { xs: 12, md: 20 },
                      width: { xs: 42, md: 52 },
                      height: { xs: 42, md: 52 },
                      borderRadius: "50%",
                      background: isTopOne
                        ? "linear-gradient(135deg, #fb923c, #facc15)"
                        : "rgba(15,23,42,0.92)",
                      color: isTopOne ? "#1f2937" : "#f8fafc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: { xs: "1rem", md: "1.2rem" },
                      boxShadow: isTopOne
                        ? "0 18px 35px rgba(251,146,60,0.45)"
                        : "0 14px 28px rgba(15,23,42,0.25)",
                      zIndex: 2,
                      border: isTopOne
                        ? "2px solid rgba(255,255,255,0.6)"
                        : "1px solid rgba(255,255,255,0.18)",
                      backdropFilter: isTopOne ? "none" : "blur(2px)",
                    }}
                    aria-label={`Hạng ${rank}`}
                  >
                    {rank}
                  </Box>

                  {/* Thân thẻ: fill chiều cao + truyền tùy biến media */}
                  <Box
                    sx={{
                      position: "relative",
                      zIndex: 1,
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    }}
                  >
                    {isTopOne ? (
                      <ElectricBorder
                        color="#ff4500"
                        speed={1}
                        chaos={0.5}
                        thickness={2}
                        style={{
                          borderRadius: 16,
                          display: "block",
                          height: "100%",
                        }}
                      >
                        <Box
                          sx={{
                            borderRadius: 2,
                            overflow: "hidden",
                            height: "100%",
                            display: "flex",
                          }}
                        >
                          <KOLCard
                            {...kol}
                            onClick={handleCardClick}
                            mediaContainerSx={mediaContainerFixed}
                            mediaSx={mediaFitCenter}
                          />
                        </Box>
                      </ElectricBorder>
                    ) : (
                      <KOLCard
                        {...kol}
                        onClick={handleCardClick}
                        mediaContainerSx={mediaContainerFixed}
                        mediaSx={mediaFitCenter}
                      />
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Dots */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            mt: 2.5,
            justifyContent: "center",
            alignItems: "center",
            userSelect: "none",
            px: 1,
          }}
        >
          {Array.from({ length: maxIndex + 1 }).map((_, i) => {
            const active = i === currentIndex;
            return (
              <Box
                key={i}
                onClick={() => setCurrentIndex(i)}
                component={motion.div}
                initial={false}
                animate={{
                  opacity: active ? 1 : 0.35,
                  scale: active ? 1 : 0.95,
                }}
                transition={{ duration: 0.25 }}
                sx={{
                  width: active ? 24 : 8,
                  height: 8,
                  borderRadius: 8,
                  cursor: "pointer",
                  bgcolor: active ? "#0ea5e9" : "#cbd5e1",
                }}
                aria-label={`Trang ${i + 1}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setCurrentIndex(i);
                }}
              />
            );
          })}
        </Stack>
      </Box>
    </Paper>
  );
};

export default HottestKOLs;
