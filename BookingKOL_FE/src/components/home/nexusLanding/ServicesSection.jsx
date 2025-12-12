import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import AdsClickIcon from "@mui/icons-material/AdsClick";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import BuildIcon from "@mui/icons-material/Build";
import SpeedIcon from "@mui/icons-material/Speed";
import HandshakeIcon from "@mui/icons-material/Handshake";

import QueryStatsIcon from "@mui/icons-material/QueryStats";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";

import ArrowBackIosNewRoundedIcon from "@mui/icons-material/ArrowBackIosNewRounded";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";

import { servicesTabs } from "./data";

const iconMapper = {
  booking: AdsClickIcon,
  training: LiveTvIcon,
  studio: BuildIcon,
  operation: SpeedIcon,
  affiliate: HandshakeIcon,
  tracking: QueryStatsIcon,
  crm: SpaceDashboardIcon,
};

// ✅ Font giống Hero Banner
const FONT_FAMILY = "Interdisplay, Arial, sans-serif";

// ✅ Màu chủ đạo giống Hero
const PRIMARY = "#0a3b8f";

const sectionSx = {
  overflow: "hidden",
  background: "transparent",
  fontFamily: FONT_FAMILY,
  "& *": {
    fontFamily: `${FONT_FAMILY} !important`,
  },
};

const tabStyles = {
  mb: { xs: 3, md: 6 },
  borderRadius: 3,
  backgroundColor: "rgba(255, 255, 255, 0.75)",
  boxShadow: "0 14px 28px rgba(74, 116, 218, 0.08)",
  px: { xs: 1.5, md: 2 },
  py: 1.25,
  "& .MuiTab-root": {
    textTransform: "none",
    fontWeight: 700,
    color: "#0f172a",
    minHeight: 48,
    minWidth: 0,
  },
  "& .MuiTab-root.Mui-selected": {
    color: "#4a74da",
  },
  "& .MuiTabs-indicator": {
    height: 3,
    borderRadius: 3,
    backgroundImage: "linear-gradient(135deg, #4a74da, #93cef6)",
  },
};

const tabsRowSx = {
  minHeight: 48,
  "& .MuiTabs-flexContainer": { gap: 0.5 },
};

const contentCardSx = {
  borderRadius: 4,
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  border: "1px solid rgba(147, 206, 246, 0.4)",
  boxShadow: "0 16px 32px rgba(74, 116, 218, 0.12)",
  p: { xs: 3, md: 4 },
};

const rightPanelSx = {
  height: "100%",
  borderRadius: 4,
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  backgroundImage: `
    radial-gradient(circle at 30% 25%, rgba(141, 226, 237, 0.45), rgba(141, 226, 237, 0) 65%),
    radial-gradient(circle at 70% 70%, rgba(147, 206, 246, 0.35), rgba(147, 206, 246, 0) 60%),
    radial-gradient(circle at 50% 110%, rgba(74, 116, 218, 0.25), rgba(74, 116, 218, 0) 80%)
  `,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  px: 4,
  py: 6,
  color: "rgba(15, 23, 42, 0.7)",
};

const primaryButtonSx = {
  alignSelf: "flex-start",
  borderRadius: "999px",
  px: 3,
  backgroundImage: "linear-gradient(135deg, #4a74da, #93cef6)",
  boxShadow: "0px 16px 30px rgba(74, 116, 218, 0.22)",
  textTransform: "none", // ✅ không uppercase
  fontWeight: 700,
  fontSize: 15,
};

const accordionSx = {
  borderRadius: 3,
  backgroundColor: "rgba(255, 255, 255, 0.92)",
  border: "1px solid rgba(147, 206, 246, 0.4)",
  boxShadow: "0 12px 24px rgba(74, 116, 218, 0.12)",
  "&:before": { display: "none" },
};

const accordionSummarySx = {
  px: 3,
  "& .MuiAccordionSummary-content": { alignItems: "center" },
};

/**
 * ✅ SpotlightBox: blob màu #71c9f9 đi theo chuột (chỉ trong box)
 */
const SpotlightBox = ({ children, sx }) => {
  const ref = useRef(null);
  const rafRef = useRef(null);

  const setVar = (name, value) => {
    if (!ref.current) return;
    ref.current.style.setProperty(name, value);
  };

  const handleEnter = () => {
    setVar("--spot-op", "1");
  };

  const handleLeave = () => {
    setVar("--spot-op", "0");
  };

  const handleMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      setVar("--mx", `${x}px`);
      setVar("--my", `${y}px`);
    });
  };

  return (
    <Box
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onMouseMove={handleMove}
      sx={{
        position: "relative",
        overflow: "hidden",
        "--mx": "50%",
        "--my": "50%",
        "--spot-op": "0",
        cursor: "default",
        "&::after": {
          content: '""',
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: "var(--spot-op)",
          transition: "opacity 180ms ease",
          background:
            "radial-gradient(220px circle at var(--mx) var(--my), rgba(113, 201, 249, 0.55), rgba(113, 201, 249, 0) 60%)",
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

const ServicesSection = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const [activeTab, setActiveTab] = useState(servicesTabs[0]?.key ?? "");
  const [imageHover, setImageHover] = useState(false); // ✅ dùng cho opacity nút

  // index hiện tại
  const activeIndex = useMemo(
    () => servicesTabs.findIndex((s) => s.key === activeTab),
    [activeTab]
  );

  const handlePrev = () => {
    if (!servicesTabs.length) return;
    const idx = activeIndex < 0 ? 0 : activeIndex;
    const newIndex = (idx - 1 + servicesTabs.length) % servicesTabs.length;
    setActiveTab(servicesTabs[newIndex].key);
  };

  const handleNext = () => {
    if (!servicesTabs.length) return;
    const idx = activeIndex < 0 ? 0 : activeIndex;
    const newIndex = (idx + 1) % servicesTabs.length;
    setActiveTab(servicesTabs[newIndex].key);
  };

  // ✅ Title animation
  const titleRef = useRef(null);
  const [titleInView, setTitleInView] = useState(false);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;

    if (reduceMotion) {
      setTitleInView(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTitleInView(true);
          io.disconnect();
        }
      },
      {
        threshold: 0.25,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [reduceMotion]);

  const activeService = useMemo(
    () =>
      servicesTabs.find((item) => item.key === activeTab) ?? servicesTabs[0],
    [activeTab]
  );

  if (!activeService) return null;

  const renderServiceContent = (service, { showNav } = { showNav: false }) => {
    const IconComponent = iconMapper[service.key] ?? AdsClickIcon;
    const imageSrc = service?.image;

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "stretch",
          justifyContent: "space-between",
          gap: { xs: 4, md: 5 },
        }}
      >
        {/* Ảnh / Video */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SpotlightBox
            sx={{
              ...rightPanelSx,
              width: "100%",
              p: 0,
              borderRadius: 4,
              display: "block",
            }}
          >
            {imageSrc ? (
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  maxWidth: { xs: "100%", md: 640 },
                  aspectRatio: { xs: "4 / 3", md: "16 / 10" }, // ✅ khung cố định
                  mx: "auto",
                }}
                onMouseEnter={() => setImageHover(true)}
                onMouseLeave={() => setImageHover(false)}
              >
                <Box
                  component="img"
                  src={imageSrc}
                  alt={service.title}
                  loading="lazy"
                  decoding="async"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />

                {showNav && (
                  <>
                    {/* Nút trái/phải với opacity theo hover */}
                    <IconButton
                      onClick={handlePrev}
                      size="small"
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: 12,
                        transform: "translateY(-50%)",
                        backgroundColor: "rgba(255,255,255,0.9)",
                        boxShadow: "0 8px 16px rgba(15, 23, 42, 0.18)",
                        opacity: imageHover ? 1 : 0.35,
                        transition:
                          "opacity 160ms ease, background-color 160ms ease, box-shadow 160ms ease",
                        "&:hover": {
                          backgroundColor: "rgba(255,255,255,1)",
                          opacity: 1,
                        },
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
                        backgroundColor: "rgba(255,255,255,0.9)",
                        boxShadow: "0 8px 16px rgba(15, 23, 42, 0.18)",
                        opacity: imageHover ? 1 : 0.35,
                        transition:
                          "opacity 160ms ease, background-color 160ms ease, box-shadow 160ms ease",
                        "&:hover": {
                          backgroundColor: "rgba(255,255,255,1)",
                          opacity: 1,
                        },
                      }}
                    >
                      <ArrowForwardIosRoundedIcon fontSize="small" />
                    </IconButton>

                    {/* ✅ Dots nằm TRÊN ẢNH */}
                    <Box
                      sx={{
                        position: "absolute",
                        left: "50%",
                        bottom: 12,
                        transform: "translateX(-50%)",
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      {servicesTabs.map((s) => {
                        const isActive = s.key === service.key;
                        return (
                          <Box
                            key={s.key}
                            onClick={() => setActiveTab(s.key)}
                            sx={{
                              cursor: "pointer",
                              height: 8,
                              borderRadius: 999,
                              width: isActive ? 24 : 8, // active kéo dài
                              transition: "all 200ms ease",
                              bgcolor: isActive
                                ? "rgba(255,255,255,0.95)"
                                : "rgba(148,163,184,0.7)",
                              boxShadow: isActive
                                ? "0 0 0 1px rgba(15,23,42,0.18)"
                                : "none",
                            }}
                          />
                        );
                      })}
                    </Box>
                  </>
                )}
              </Box>
            ) : (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 4,
                  py: 6,
                }}
              >
                <Typography variant="body2" textAlign="center">
                  Placeholder hình ảnh / video demo dịch vụ.
                  <br />
                  Có thể cập nhật visual thực tế sau.
                </Typography>
              </Box>
            )}
          </SpotlightBox>
        </Box>

        {/* ✅ Phần thông tin bên phải */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "flex-start", // đẩy cụm chữ lên trên
            pt: { xs: 1, md: 2 },
          }}
        >
          <Stack spacing={2.5} sx={{ flex: 1 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: 3,
                  backgroundImage:
                    "radial-gradient(circle at 50% 50%, rgba(141, 226, 237, 0.6), rgba(147, 206, 246, 0.15))",
                  display: "grid",
                  placeItems: "center",
                  color: "#4a74da",
                }}
              >
                <IconComponent fontSize="large" />
              </Box>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 750,
                  color: "#0f172a",
                  fontSize: { xs: "0.98rem", md: "1.8rem" }, // ✅ size lớn hơn
                  lineHeight: 1.7,
                }}
              >
                {service.title}
              </Typography>
            </Stack>

            <Typography
              variant="body1"
              sx={{
                color: "rgba(15, 23, 42, 0.72)",
                fontSize: { xs: "0.98rem", md: "1.25rem" }, // ✅ size lớn hơn
                lineHeight: 1.7,
              }}
            >
              {service.description}
            </Typography>

            <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
              {service.bullets.map((bullet) => (
                <Stack
                  key={bullet}
                  direction="row"
                  spacing={1.5}
                  alignItems="flex-start"
                >
                  <CheckCircleIcon sx={{ color: "#4a74da", mt: "2px" }} />
                  <Typography
                    variant="body2"
                    sx={{
                      color: "rgba(15, 23, 42, 0.68)",
                      fontSize: { xs: "0.98rem", md: "1.1rem" }, // ✅ size lớn hơn
                      lineHeight: 1.7,
                    }}
                  >
                    {bullet}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            <Button
              component="a"
              href="#lead-forms"
              variant="contained"
              sx={primaryButtonSx}
            >
              Tìm hiểu thêm
            </Button>
          </Stack>
        </Box>
      </Box>
    );
  };

  return (
    <Box component="section" id="services" sx={sectionSx}>
      <Container
        maxWidth={false}
        sx={{
          py: { xs: 8, md: 10 },
          maxWidth: 1560,
          mx: "auto",
          px: { xs: 2, md: 3 },
        }}
      >
        {/* TITLE */}
        <Box ref={titleRef} sx={{ textAlign: "center", mb: { xs: 3, md: 4 } }}>
          <Typography
            component="h2"
            sx={{
              fontFamily: FONT_FAMILY,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              fontSize: { xs: "2.1rem", md: "2.8rem" },
              lineHeight: 1.2,
              color: PRIMARY,
              opacity: titleInView ? 1 : 0,
              transform: titleInView ? "translateY(0)" : "translateY(18px)",
              transition:
                "transform 800ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 800ms ease",
              willChange: "transform, opacity",
              "@media (prefers-reduced-motion: reduce)": {
                transition: "none",
                transform: "none",
                opacity: 1,
              },
            }}
          >
            Hệ sinh thái dịch vụ
          </Typography>
        </Box>

        {isMobile ? (
          <Stack spacing={2.5}>
            {servicesTabs.map((service) => {
              const IconComponent = iconMapper[service.key] ?? AdsClickIcon;
              return (
                <Accordion
                  key={service.key}
                  defaultExpanded={service.key === servicesTabs[0].key}
                  sx={accordionSx}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={accordionSummarySx}
                  >
                    <Stack
                      direction="row"
                      spacing={2}
                      alignItems="center"
                      sx={{ color: "#0f172a" }}
                    >
                      <IconComponent />
                      <Typography sx={{ fontWeight: 600 }}>
                        {service.title}
                      </Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    {renderServiceContent(service, { showNav: false })}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Stack>
        ) : (
          <Box>
            {/* Tabs 1 hàng */}
            <Box sx={tabStyles}>
              <Tabs
                value={activeTab}
                onChange={(_, value) => setActiveTab(value)}
                variant="fullWidth"
                sx={tabsRowSx}
              >
                {servicesTabs.map((service) => {
                  const IconComponent = iconMapper[service.key] ?? AdsClickIcon;
                  return (
                    <Tab
                      key={service.key}
                      value={service.key}
                      iconPosition="start"
                      icon={<IconComponent />}
                      label={service.title}
                    />
                  );
                })}
              </Tabs>
            </Box>

            {/* Desktop: có nút trái/phải + dots trên ảnh */}
            <Box
              sx={{
                ...contentCardSx,
                width: { xs: "100%", md: "90%" },
                mx: "auto",
              }}
            >
              {renderServiceContent(activeService, { showNav: true })}
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default ServicesSection;
