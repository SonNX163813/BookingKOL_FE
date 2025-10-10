import React from "react";
import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import InsightsIcon from "@mui/icons-material/Insights";
import BuildIcon from "@mui/icons-material/Build";
import GroupsIcon from "@mui/icons-material/Groups";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import { whyChooseCards } from "./data";

const iconMap = [InsightsIcon, BuildIcon, GroupsIcon, AutoGraphIcon];

const sectionSx = {
  overflow: "hidden",
  // backgroundColor: "#ffffff",
  //   backgroundImage: `
  //   radial-gradient(circle at 50% 50%, rgba(141, 226, 237, 0.85) 0%, rgba(255, 255, 255, 0.9) 65%),
  //   radial-gradient(circle at 15% 20%, rgba(147, 206, 246, 0.55) 0%, rgba(255, 255, 255, 0) 60%),
  //   radial-gradient(circle at 85% 10%, rgba(74, 116, 218, 0.45) 0%, rgba(255, 255, 255, 0) 70%)
  // `,
  // boxShadow: "0 18px 42px rgba(74, 116, 218, 0.12)",
  color: "#0f172a",
};

const cardsGridSx = {
  display: "grid",
  gridTemplateColumns: {
    xs: "repeat(1, minmax(0, 1fr))",
    sm: "repeat(2, minmax(0, 1fr))",
    lg: "repeat(4, minmax(0, 1fr))",
  },
  gap: { xs: 3, md: 3 },
  alignItems: "stretch",
};

const cardSx = {
  borderRadius: 4,
  p: 3,
  backgroundColor: "rgba(255, 255, 255, 0.92)",
  // backgroundImage:
  //   "radial-gradient(circle at top, rgba(147, 206, 246, 0.35), rgba(255, 255, 255, 0.95))",
  border: "1px solid rgba(147, 206, 246, 0.4)",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 12px 28px rgba(74, 116, 218, 0.12)",
  height: "100%",
};

const iconWrapperSx = {
  width: 58,
  height: 58,
  borderRadius: 3,
  backgroundImage:
    "radial-gradient(circle at 50% 50%, rgba(141, 226, 237, 0.7), rgba(147, 206, 246, 0.2))",
  display: "grid",
  placeItems: "center",
  color: "#4a74da",
  mb: 1.2,
};

const WhyChooseSection = () => {
  return (
    <Box component="section" id="why" sx={sectionSx}>
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Stack
          spacing={2.5}
          textAlign="center"
          sx={{ mb: 4, color: "#0f172a" }}
        >
          <Typography
            variant="overline"
            sx={{
              fontSize: "1rem",
              letterSpacing: 2,
              color: "rgba(15, 23, 42, 0.55)",
            }}
          >
            Vì sao chọn Nexus
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Lợi thế giúp thương hiệu tăng trưởng bền vững
          </Typography>
        </Stack>
        <Box sx={cardsGridSx}>
          {whyChooseCards.map((card, index) => {
            const IconComponent = iconMap[index] ?? InsightsIcon;
            return (
              <Paper key={card.title} elevation={0} sx={cardSx}>
                {/* Wrapper giúp căn giữa nội dung */}
                <Box
                  sx={{
                    textAlign: { xs: "center", md: "left" }, // căn giữa trên mobile, trái trên desktop
                    display: "flex",
                    flexDirection: "column",
                    alignItems: { xs: "center", md: "flex-start" }, // căn giữa icon và text
                    height: "100%",
                  }}
                >
                  <Box sx={iconWrapperSx}>
                    <IconComponent />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: "#0f172a", mb: 1.2 }}
                  >
                    {card.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(15, 23, 42, 0.6)", mb: "auto", pb: 1.2 }}
                  >
                    {card.description}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 600, color: "#4a74da" }}
                  >
                    {card.metric}
                  </Typography>
                </Box>
              </Paper>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
};

export default WhyChooseSection;
