import React, { useEffect, useMemo, useState } from "react";
import { Box, Container, Stack, Typography, IconButton } from "@mui/material";

import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";

/** ✅ 4 ảnh (có thể trùng cũng không sao) */
import img01 from "../../../assets/services/5.jpg";
import img02 from "../../../assets/15.jpg";
import img03 from "../../../assets/16.jpg";
import img04 from "../../../assets/services/1.jpg";

/** ✅ DƯỚI */
const THUMB_HEIGHT = { xs: 200, md: 220 };
/** ✅ TRÊN: cao hơn DƯỚI */
const TOP_HEIGHT = { xs: 320, md: 360 };

/** ✅ chỉnh time animation ở đây */
const TITLE_DURATION = "0.75s";
const FRAME_DURATION = "0.95s";
const ENTER_DURATION = "0.85s";

/** ✅ màu chủ đạo */
const PRIMARY = { color: "#0b4aa2" };

const sectionSx = {
  position: "relative",
  overflow: "hidden",
  color: "#0f172a",
};

const frameSx = {
  borderRadius: { xs: 4, md: 6 },
  overflow: "hidden",
  border: "1px solid rgba(147, 206, 246, 0.55)",
  background:
    "linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(210,240,255,0.92) 100%)",
  boxShadow: "0 22px 60px rgba(15, 23, 42, 0.10)",
};

const heroImageWrapSx = {
  position: "relative",
  flex: { xs: "1 1 auto", md: "0 0 62%" },
  height: TOP_HEIGHT,
  overflow: "hidden",
  backgroundColor: "rgba(15, 23, 42, 0.04)",
};

const heroTextWrapSx = {
  flex: 1,
  height: TOP_HEIGHT,
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "flex-start",
  px: { xs: 3, md: 5 },
  py: { xs: 3, md: 4 },
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.70) 0%, rgba(207,236,255,0.78) 100%)",
};

const thumbWrapSx = {
  borderRadius: { xs: 3, md: 4 },
  overflow: "hidden",
  border: "1px solid rgba(147, 206, 246, 0.50)",
  backgroundColor: "rgba(255,255,255,0.75)",
  boxShadow: "0 14px 30px rgba(15, 23, 42, 0.08)",
  cursor: "pointer",
  position: "relative",
  transition:
    "transform .18s ease, box-shadow .18s ease, border-color .18s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
  },
};

const overlaySx = {
  position: "absolute",
  inset: 0,
  background:
    "linear-gradient(90deg, rgba(147,206,246,0.18), rgba(74,116,218,0.08))",
  zIndex: 2,
};

const CEOMessage = () => {
  const slides = useMemo(
    () => [
      {
        id: "01",
        img: img01,
        alt: "Partner 01",
        title: "Các đối tác hàng đầu tham gia",
        titleColor: "#4a74da",
        desc: "Đồng bộ vận hành đa kênh, xử lý đơn nhanh gọn với các thao tác gộp đơn, giao hàng hàng loạt...",
        ctaText: "Tìm hiểu thêm",
        href: "#",
      },
      {
        id: "02",
        img: img02,
        alt: "Partner 02",
        title: "Tăng trưởng doanh thu bền vững",
        titleColor: "#4a74da",
        desc: "Tối ưu phễu bán hàng, đo lường hiệu quả theo từng chiến dịch và cải thiện tỉ lệ chuyển đổi nhờ dữ liệu realtime.",
        ctaText: "Xem giải pháp",
        href: "#",
      },
      {
        id: "03",
        img: img03,
        alt: "Partner 03",
        title: "Vận hành tập trung – kiểm soát dễ dàng",
        titleColor: "#4a74da",
        desc: "Quản lý quy trình từ yêu cầu đến triển khai, phân quyền rõ ràng, theo dõi tiến độ và giảm sai sót trong vận hành.",
        ctaText: "Khám phá ngay",
        href: "#",
      },
      {
        id: "04",
        img: img04,
        alt: "Partner 04",
        title: "Báo cáo & KPI trực quan",
        titleColor: "#4a74da",
        desc: "Dashboard rõ ràng, thống kê theo ngày/tuần/tháng, giúp ra quyết định nhanh và tối ưu hiệu suất đội nhóm.",
        ctaText: "Xem dashboard",
        href: "#",
      },
    ],
    []
  );

  const [active, setActive] = useState(0);
  const [hovering, setHovering] = useState(false); // dừng auto slide khi hover toàn khung trên
  const [imageHover, setImageHover] = useState(false); // chỉ để control opacity nút trên ảnh

  // auto slide
  useEffect(() => {
    if (hovering) return;
    const t = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(t);
  }, [hovering, slides.length]);

  const hero = slides[active];

  // list 3 thumb phía dưới
  const thumbs = useMemo(() => {
    const n = slides.length;
    const order = [1, 2, 3].map((k) => (active + k) % n);
    return order.map((idx) => ({ ...slides[idx], index: idx }));
  }, [active, slides]);

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setActive((prev) => (prev + 1) % slides.length);
  };

  return (
    <Box component="section" sx={sectionSx}>
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 7 } }}>
        {/* ====== TITLE ====== */}
        <Box sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
          <Typography
            sx={{
              fontWeight: 700,
              letterSpacing: 0.2,
              color: PRIMARY,
              fontSize: { xs: 28, md: 38 },
              lineHeight: 1.12,
              animation: `caseRise ${TITLE_DURATION} cubic-bezier(.2,.8,.2,1) both`,
              "@keyframes caseRise": {
                from: { opacity: 0, transform: "translateY(18px)" },
                to: { opacity: 1, transform: "translateY(0)" },
              },
            }}
          >
            Case Study
          </Typography>
        </Box>

        {/* ====== TOP ====== */}
        <Box
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          sx={{
            ...frameSx,
            willChange: "transform, opacity",
            animation: `frameFly ${FRAME_DURATION} cubic-bezier(.16,1,.3,1) both`,
            "@keyframes frameFly": {
              "0%": { opacity: 0, transform: "translateY(70px) scale(0.985)" },
              "60%": {
                opacity: 1,
                transform: "translateY(-8px) scale(1.006)",
              },
              "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
            },
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }}>
            {/* Left Image */}
            <Box
              sx={heroImageWrapSx}
              onMouseEnter={() => setImageHover(true)}
              onMouseLeave={() => setImageHover(false)}
            >
              <Box
                key={hero.id}
                component="img"
                src={hero.img}
                alt={hero.alt}
                loading="eager"
                decoding="async"
                sx={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  willChange: "transform, opacity",
                  animation: `imgIn ${ENTER_DURATION} cubic-bezier(.2,.8,.2,1) both`,
                  "@keyframes imgIn": {
                    from: {
                      opacity: 0,
                      transform: "translateX(-34px) scale(1.01)",
                    },
                    to: { opacity: 1, transform: "translateX(0) scale(1)" },
                  },
                }}
              />

              {/* ✅ Nút trái/phải trên ảnh, mờ khi không hover ảnh */}
              <IconButton
                onClick={handlePrev}
                size="small"
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: 12,
                  transform: "translateY(-50%)",
                  backgroundColor: "rgba(255,255,255,0.94)",
                  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.28)",
                  opacity: imageHover ? 1 : 0.35, // ✅ mờ khi không hover
                  transition:
                    "opacity 160ms ease, background-color 160ms ease, box-shadow 160ms ease",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,1)",
                    opacity: 1,
                  },
                  zIndex: 3,
                }}
              >
                <ArrowBackIosNewRoundedIcon fontSize="small" />
              </IconButton>

              <IconButton
                onClick={handleNext}
                size="small"
                sx={{
                  position: "absolute",
                  top: "50%",
                  right: 12,
                  transform: "translateY(-50%)",
                  backgroundColor: "rgba(255,255,255,0.94)",
                  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.28)",
                  opacity: imageHover ? 1 : 0.35, // ✅ mờ khi không hover
                  transition:
                    "opacity 160ms ease, background-color 160ms ease, box-shadow 160ms ease",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,1)",
                    opacity: 1,
                  },
                  zIndex: 3,
                }}
              >
                <ArrowForwardIosRoundedIcon fontSize="small" />
              </IconButton>

              {/* ✅ Dot ở dưới cùng ảnh, dot active kéo dài */}
              <Box
                sx={{
                  position: "absolute",
                  left: "50%",
                  bottom: 12,
                  transform: "translateX(-50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  zIndex: 3,
                }}
              >
                {slides.map((slide, index) => {
                  const isActive = index === active;
                  return (
                    <Box
                      key={slide.id}
                      onClick={() => setActive(index)}
                      sx={{
                        cursor: "pointer",
                        height: 8,
                        borderRadius: 999,
                        width: isActive ? 24 : 8, // ✅ active kéo dài
                        transition: "all 200ms ease",
                        bgcolor: isActive
                          ? "rgba(255,255,255,0.98)"
                          : "rgba(148,163,184,0.7)",
                        boxShadow: isActive
                          ? "0 0 0 1px rgba(15,23,42,0.28)"
                          : "none",
                      }}
                    />
                  );
                })}
              </Box>
            </Box>

            {/* Right Text */}
            <Box sx={heroTextWrapSx}>
              <Box
                key={`${hero.id}-text`}
                sx={{
                  maxWidth: 420,
                  willChange: "transform, opacity",
                  animation: `textIn ${ENTER_DURATION} cubic-bezier(.2,.8,.2,1) both`,
                  "@keyframes textIn": {
                    from: { opacity: 0, transform: "translateX(34px)" },
                    to: { opacity: 1, transform: "translateX(0)" },
                  },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 900,
                    lineHeight: 1.2,
                    color: hero.titleColor || "#0b4aa2",
                    fontSize: { xs: 24, md: 30 },
                  }}
                >
                  {hero.title}
                </Typography>

                <Typography
                  sx={{
                    mt: 1.3,
                    color: "rgba(15, 23, 42, 0.65)",
                    lineHeight: 1.65,
                    fontSize: { xs: 14.5, md: 16 },
                  }}
                >
                  {hero.desc}
                </Typography>

                <Box
                  component="a"
                  href={hero.href || "#"}
                  sx={{
                    mt: 2.2,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    textDecoration: "none",
                    color: "#4a74da",
                    fontWeight: 700,
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  <span>{hero.ctaText || "Tìm hiểu thêm"}</span>
                  <span style={{ fontSize: 20, lineHeight: 1 }}>›</span>
                </Box>
              </Box>
            </Box>
          </Stack>
        </Box>

        {/* ====== BOTTOM (3 ảnh) ====== */}
        <Box
          sx={{
            mt: { xs: 2, md: 2.4 },
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(3, 1fr)",
              md: "repeat(3, 1fr)",
            },
            gap: { xs: 1.2, md: 2 },
          }}
        >
          {thumbs.map((t) => (
            <Box key={t.id} onClick={() => setActive(t.index)} sx={thumbWrapSx}>
              <Box sx={{ position: "relative", height: THUMB_HEIGHT }}>
                <Box
                  component="img"
                  src={t.img}
                  alt={t.alt}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <Box sx={{ ...overlaySx, opacity: 0.28 }} />
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default CEOMessage;
