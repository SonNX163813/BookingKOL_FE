import React, { useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  Grid,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AdsClickIcon from "@mui/icons-material/AdsClick";
import LiveTvIcon from "@mui/icons-material/LiveTv";
import BuildIcon from "@mui/icons-material/Build";
import SpeedIcon from "@mui/icons-material/Speed";
import HandshakeIcon from "@mui/icons-material/Handshake";
import { servicesTabs } from "./data";

const iconMapper = {
  booking: AdsClickIcon,
  training: LiveTvIcon,
  studio: BuildIcon,
  operation: SpeedIcon,
  affiliate: HandshakeIcon,
};

const sectionSx = {
  // mx: { xs: 2, md: 4 },
  // borderRadius: { xs: 3, md: 4 },
  overflow: "hidden",
  // backgroundColor: "#ffffff",
  // backgroundImage: `
  //   radial-gradient(circle at 18% 20%, rgba(141, 226, 237, 0.52), rgba(255, 255, 255, 0) 58%),
  //   radial-gradient(circle at 82% 6%, rgba(147, 206, 246, 0.5), rgba(255, 255, 255, 0) 56%),
  //   radial-gradient(circle at 50% 100%, rgba(74, 116, 218, 0.25), rgba(255, 255, 255, 0.92) 70%)
  // `,
  // boxShadow: "0 18px 42px rgba(74, 116, 218, 0.12)",
};

const tabStyles = {
  mb: 4,
  borderRadius: 3,
  backgroundColor: "rgba(255, 255, 255, 0.75)",
  boxShadow: "0 14px 28px rgba(74, 116, 218, 0.08)",
  px: { xs: 1.5, md: 2 },
  "& .MuiTab-root": {
    textTransform: "none",
    fontWeight: 600,
    color: "#0f172a",
    minHeight: 48,
  },
  "& .MuiTabs-indicator": {
    height: 3,
    borderRadius: 3,
    backgroundImage: "linear-gradient(135deg, #4a74da, #93cef6)",
  },
};

const contentCardSx = {
  borderRadius: 4,
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  // backgroundImage:
  //   "radial-gradient(circle at top left, rgba(147, 206, 246, 0.35), rgba(255, 255, 255, 0.95))",
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
  border: "1px dashed rgba(74, 116, 218, 0.28)",
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

const ServicesSection = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [activeTab, setActiveTab] = useState(servicesTabs[0]?.key ?? "");

  const activeService = useMemo(
    () =>
      servicesTabs.find((item) => item.key === activeTab) ?? servicesTabs[0],
    [activeTab]
  );

  if (!activeService) {
    return null;
  }

  const renderServiceContent = (service) => {
    const IconComponent = iconMapper[service.key] ?? AdsClickIcon;

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
        {/* Right: Hình ảnh / Video */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              ...rightPanelSx,
              width: "100%",
              minHeight: 280,
            }}
          >
            <Typography variant="body2" textAlign="center">
              Placeholder hình ảnh / video demo dịch vụ.
              <br />
              Có thể cập nhật visual thực tế sau.
            </Typography>
          </Box>
        </Box>

        {/* Left: Thông tin */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
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
                sx={{ fontWeight: 700, color: "#0f172a" }}
              >
                {service.title}
              </Typography>
            </Stack>

            <Typography
              variant="body1"
              sx={{ color: "rgba(15, 23, 42, 0.72)" }}
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
                    sx={{ color: "rgba(15, 23, 42, 0.68)" }}
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
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Stack
          spacing={2}
          sx={{ textAlign: "center", mb: 4, color: "#0f172a" }}
        >
          <Typography
            variant="overline"
            sx={{
              fontSize: "1rem",
              letterSpacing: 2,
              color: "rgba(15, 23, 42, 0.55)",
            }}
          >
            Dịch vụ nổi bật
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Giải pháp KOL/KOC &amp; Livestream Commerce trọn gói
          </Typography>
        </Stack>

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
                    {renderServiceContent(service)}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Stack>
        ) : (
          <Box>
            <Tabs
              value={activeTab}
              onChange={(_, value) => setActiveTab(value)}
              variant="scrollable"
              scrollButtons
              allowScrollButtonsMobile
              sx={tabStyles}
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
            <Box sx={contentCardSx}>{renderServiceContent(activeService)}</Box>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default ServicesSection;
