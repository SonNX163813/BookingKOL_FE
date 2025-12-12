// src/components/home/nexusLanding/TeamCoverflow7Fixed.jsx
import React, { useMemo, useRef } from "react";
import { Box, Container, IconButton, Stack, Typography } from "@mui/material";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";

import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";

// ✅ 5 ảnh local
import m01 from "../../../assets/team/1.jpg";
import m02 from "../../../assets/team/2.jpg";
import m03 from "../../../assets/team/3.jpg";
import m04 from "../../../assets/team/44.png";
import m05 from "../../../assets/team/55.png";

const sectionSx = {
  position: "relative",
  overflow: "hidden",
  py: { xs: 8, md: 10 },
  backgroundColor: "#fff",
  backgroundImage: `
    radial-gradient(circle at 25% 35%, rgba(113, 201, 249, 0.18), rgba(255,255,255,0) 55%),
    radial-gradient(circle at 75% 20%, rgba(167, 139, 250, 0.14), rgba(255,255,255,0) 55%),
    radial-gradient(circle at 65% 80%, rgba(236, 72, 153, 0.10), rgba(255,255,255,0) 60%)
  `,
};

const titleSx = {
  fontWeight: 800,
  letterSpacing: 2,
  lineHeight: 1.05,
  fontSize: { xs: 32, md: 44 },
  backgroundImage: "linear-gradient(90deg, #71c9f9, #a78bfa, #ec72d1)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

const cardOuterSx = {
  width: "100%", // ✅ full chiều rộng slide
  borderRadius: "22px",
  p: "5px",
  background:
    "linear-gradient(180deg, rgba(167,139,250,0.95), rgba(236,72,153,0.70), rgba(113,201,249,0.55))",
  boxShadow: "0 18px 46px rgba(15,23,42,0.14)",
};

const cardInnerSx = {
  width: "100%",
  position: "relative",
  borderRadius: "16px",
  overflow: "hidden",
  height: { xs: 260, md: 340 },
  backgroundColor: "#0b1020",
};

const heartSx = {
  position: "absolute",
  top: 12,
  left: 12,
  width: 34,
  height: 34,
  borderRadius: 999,
  background: "rgba(255,255,255,0.28)",
  display: "grid",
  placeItems: "center",
  color: "rgba(255,255,255,0.95)",
  zIndex: 3,
};

const labelSx = {
  position: "absolute",
  left: "50%",
  bottom: 12,
  transform: "translateX(-50%)",
  width: "86%",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.92)",
  border: "1px solid rgba(148,163,184,0.35)",
  boxShadow: "0 10px 22px rgba(15,23,42,0.10)",
  px: 2,
  py: 1.1,
  textAlign: "center",
  zIndex: 3,
};

export default function TeamCoverflow7Fixed() {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const swiperRef = useRef(null);

  // ✅ 5 ảnh thật (không lặp)
  const teamMembers = useMemo(
    () => [
      { name: "Tên 1", role: "Chức vụ", exp: "Kinh nghiệm", photo: m01 },
      { name: "Tên 2", role: "Chức vụ", exp: "Kinh nghiệm", photo: m02 },
      { name: "Tên 3", role: "Chức vụ", exp: "Kinh nghiệm", photo: m03 },
      { name: "Tên 4", role: "Chức vụ", exp: "Kinh nghiệm", photo: m04 },
      { name: "Tên 5", role: "Chức vụ", exp: "Kinh nghiệm", photo: m05 },
    ],
    []
  );

  // ✅ luôn chọn phần tử giữa mảng làm slide trung tâm
  const DEFAULT_INDEX = Math.floor(teamMembers.length / 2); // 5 -> 2

  return (
    <Box component="section" id="team" sx={sectionSx}>
      <Container maxWidth={false} sx={{ px: { xs: 1, md: 4 } }}>
        <Stack spacing={2} textAlign="center" alignItems="center">
          <Typography sx={titleSx}>ĐỘI NGŨ CỦA NEXUS</Typography>
        </Stack>

        {/* ✅ Giới hạn chiều ngang slider để nút không dạt sát mép màn hình */}
        <Box
          sx={{
            mt: { xs: 3, md: 4 },
            position: "relative",
            maxWidth: { xs: "100%", md: 1100 },
            mx: "auto",
            px: { xs: 1, md: 4 },
          }}
        >
          {/* Nút trái – ôm sát cụm thẻ */}
          <IconButton
            ref={prevRef}
            sx={{
              position: "absolute",
              top: "50%",
              left: { xs: 0, md: 4 },
              transform: "translateY(-50%)",
              zIndex: 10,
              width: 44,
              height: 44,
              borderRadius: 999,
              background: "rgba(255,255,255,0.96)",
              border: "1px solid rgba(37, 99, 235, 0.22)",
              boxShadow: "0 10px 22px rgba(15,23,42,0.15)",
            }}
          >
            <ArrowBackIosNewRoundedIcon
              sx={{ fontSize: 18, color: "#2563eb" }}
            />
          </IconButton>

          {/* Nút phải – ôm sát cụm thẻ */}
          <IconButton
            ref={nextRef}
            sx={{
              position: "absolute",
              top: "50%",
              right: { xs: 0, md: 4 },
              transform: "translateY(-50%)",
              zIndex: 10,
              width: 44,
              height: 44,
              borderRadius: 999,
              background: "rgba(255,255,255,0.96)",
              border: "1px solid rgba(37, 99, 235, 0.22)",
              boxShadow: "0 10px 22px rgba(15,23,42,0.15)",
            }}
          >
            <ArrowForwardIosRoundedIcon
              sx={{ fontSize: 18, color: "#2563eb" }}
            />
          </IconButton>

          <Box
            sx={{
              "& .swiper": {
                width: "100%",
                paddingTop: 18,
                paddingBottom: 18,
              },

              // ✅ width cố định cho slide + canh giữa
              "& .swiper-slide": {
                width: {
                  xs: "70%", // mobile: 1 card
                  sm: "40%", // tablet: khoảng 2–3 card
                  md: "22%", // desktop: ~5 card
                },
                maxWidth: 260,
                display: "flex",
                justifyContent: "center",
                transition: "transform 200ms ease",
                willChange: "transform",
                opacity: 0.6,
              },
              "& .swiper-slide-active": {
                opacity: 1,
              },
              "& .swiper-slide-prev, & .swiper-slide-next": {
                opacity: 0.85,
              },

              "& .swiper-slide .teamCard": {
                transform: "scale(0.96)",
                transition: "transform 200ms ease",
                willChange: "transform",
              },
              "& .swiper-slide-active .teamCard": {
                transform: "scale(1.03)",
              },
            }}
          >
            <Swiper
              modules={[EffectCoverflow, Navigation]}
              effect="coverflow"
              centeredSlides
              slidesPerView="auto"
              spaceBetween={16}
              grabCursor
              slideToClickedSlide
              loop
              loopAdditionalSlides={teamMembers.length}
              navigation={{
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              }}
              onBeforeInit={(swiper) => {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
              }}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
                // ✅ Khi mount xong, ép slide giữa (Tên 3) nằm đúng giữa
                requestAnimationFrame(() => {
                  swiper.slideToLoop(DEFAULT_INDEX, 0);
                });
              }}
              coverflowEffect={{
                rotate: 0,
                stretch: 0,
                depth: 140,
                modifier: 1,
                slideShadows: false,
              }}
              speed={450}
              resistanceRatio={0.75}
            >
              {teamMembers.map((m, idx) => (
                <SwiperSlide key={`${m.name}-${idx}`}>
                  <Box className="teamCard" sx={cardOuterSx}>
                    <Box sx={cardInnerSx}>
                      {/* ẢNH RÕ, FULL CARD */}
                      <Box
                        component="img"
                        src={m.photo}
                        alt={m.name}
                        loading="lazy"
                        sx={{
                          position: "absolute",
                          inset: 0,
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                          zIndex: 1,
                        }}
                      />

                      {/* overlay nhẹ cho chữ dễ đọc */}
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          background:
                            "linear-gradient(to top, rgba(0,0,0,0.12), rgba(0,0,0,0.02) 55%, rgba(0,0,0,0.05))",
                          zIndex: 2,
                        }}
                      />

                      <Box sx={heartSx}>
                        <FavoriteBorderRoundedIcon sx={{ fontSize: 18 }} />
                      </Box>

                      <Box sx={labelSx}>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            color: "#2563eb",
                            fontSize: 15,
                          }}
                        >
                          {m.name} + {m.role}/{m.exp}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </SwiperSlide>
              ))}
            </Swiper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
