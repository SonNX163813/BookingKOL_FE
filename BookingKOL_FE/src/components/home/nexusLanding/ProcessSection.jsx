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
    xs: "repeat(1, minmax(0, 1fr))", // 1 cột trên mobile
    sm: "repeat(2, minmax(0, 1fr))", // 2 cột tablet
    md: "repeat(5, minmax(0, 1fr))", // 5 cột ngang hàng cho desktop
  },
  gap: { xs: 2.5, md: 3.5 },
  alignItems: "stretch",
  justifyItems: "stretch",
};

const stepCardSx = {
  backgroundColor: "rgba(255, 255, 255, 0.96)",
  // backgroundImage:
  //   "radial-gradient(circle at top left, rgba(147, 206, 246, 0.25), rgba(255, 255, 255, 0.96))",
  borderRadius: 4,
  p: { xs: 2.5, md: 3 },
  border: "1px solid rgba(147, 206, 246, 0.35)",
  boxShadow: "0 8px 24px rgba(74, 116, 218, 0.12)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-between",
  textAlign: "center",
  minHeight: { xs: 200, md: 220 },
  height: "100%",
  transition:
    "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 16px 40px rgba(74, 116, 218, 0.18)",
    borderColor: "rgba(74, 116, 218, 0.5)",
  },
};

const iconBoxSx = {
  width: 64,
  height: 64,
  borderRadius: "16px",
  backgroundImage:
    "radial-gradient(circle at 50% 50%, rgba(141, 226, 237, 0.75), rgba(147, 206, 246, 0.25))",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#4a74da",
  mb: 2,
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
            sx={{
              fontSize: "1rem",
              letterSpacing: 2,
              color: "rgba(15, 23, 42, 0.55)",
            }}
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
