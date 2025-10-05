import React from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import HeadsetMicIcon from "@mui/icons-material/HeadsetMic";
import InsightsIcon from "@mui/icons-material/Insights";
import ChecklistIcon from "@mui/icons-material/Checklist";
import SpeedIcon from "@mui/icons-material/Speed";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { processSteps } from "./data";

const iconList = [
  HeadsetMicIcon,
  InsightsIcon,
  ChecklistIcon,
  SpeedIcon,
  TrendingUpIcon,
];

const sectionSx = {
  overflow: "hidden",
  // backgroundColor: "#ffffff",
  // backgroundImage: `
  //   radial-gradient(circle at 18% 18%, rgba(141, 226, 237, 0.55), rgba(255, 255, 255, 0) 58%),
  //   radial-gradient(circle at 82% 0%, rgba(147, 206, 246, 0.5), rgba(255, 255, 255, 0) 55%),
  //   radial-gradient(circle at 50% 100%, rgba(74, 116, 218, 0.25), rgba(255, 255, 255, 0.92) 70%)
  // `,
  // boxShadow: "0 18px 42px rgba(74, 116, 218, 0.12)",
  color: "#0f172a",
};

const stepsGridSx = {
  display: "grid",
  gridTemplateColumns: {
    xs: "repeat(1, minmax(0, 1fr))",
    sm: "repeat(2, minmax(0, 1fr))",
    md: "repeat(auto-fit, minmax(260px, 1fr))",
  },
  gap: { xs: 2.5, md: 3.5 },
  alignItems: "stretch",
  justifyItems: "stretch",
  // Center the fifth step when there are 5 items
  "& > :nth-child(5)": {
    gridColumn: {
      md: "2 / 4", // Centers the fifth step in a 4-column grid on medium screens and up
    },
    justifySelf: "center",
    maxWidth: { xs: "auto", md: "270px" }, // Optional: limit width for better centering
  },
};

const stepCardSx = {
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  backgroundImage:
    "radial-gradient(circle at top left, rgba(147, 206, 246, 0.35), rgba(255, 255, 255, 0.93))",
  borderRadius: 4,
  p: { xs: 2.5, md: 3 },
  border: "1px solid rgba(147, 206, 246, 0.4)",
  boxShadow: "0 12px 28px rgba(74, 116, 218, 0.12)",
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  gap: { xs: 2, md: 2.25 },
  minHeight: { xs: 160, md: 180 },
  height: "100%",
  transition:
    "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 18px 36px rgba(74, 116, 218, 0.18)",
    borderColor: "rgba(74, 116, 218, 0.5)",
  },
};

const iconBoxSx = {
  width: 56,
  height: 56,
  minWidth: 56,
  borderRadius: 3,
  backgroundImage:
    "radial-gradient(circle at 50% 50%, rgba(141, 226, 237, 0.7), rgba(147, 206, 246, 0.2))",
  display: "grid",
  placeItems: "center",
  color: "#4a74da",
  fontWeight: 700,
  flexShrink: 0,
};

const ProcessSection = () => {
  return (
    <Box component="section" id="process" sx={sectionSx}>
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        {/* Header */}
        <Stack
          spacing={2}
          sx={{ textAlign: "center", mb: 6, color: "#0f172a" }}
        >
          <Typography
            variant="overline"
            sx={{ letterSpacing: 2, color: "rgba(15, 23, 42, 0.55)" }}
          >
            Quy trình 5 bước
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Triển khai từ đầu đến cuối, minh bạch từng giai đoạn
          </Typography>
        </Stack>

        {/* Steps */}
        <Box sx={stepsGridSx}>
          {processSteps.map((step, index) => {
            const IconComponent = iconList[index] ?? HeadsetMicIcon;

            return (
              <Box key={step.title} sx={{ display: "block", height: "100%" }}>
                <Box sx={stepCardSx}>
                  <Box sx={iconBoxSx}>
                    <IconComponent sx={{ fontSize: 30 }} />
                  </Box>
                  <Stack spacing={1} sx={{ color: "#0f172a", flex: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, lineHeight: 1.3 }}
                    >
                      {index + 1}. {step.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(15, 23, 42, 0.68)" }}
                    >
                      {step.description}
                    </Typography>
                  </Stack>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
};

export default ProcessSection;
