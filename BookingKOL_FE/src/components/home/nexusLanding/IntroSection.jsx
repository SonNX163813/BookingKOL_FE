import React from "react";
import { Box, Container, Stack, Typography } from "@mui/material";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import ceoImage from "../../../assets/ceo.svg";
import { introHighlights, introQuoteLines, ceoInfo } from "./data";

const introSectionSx = {
  position: "relative",
  overflow: "hidden",
  color: "#0f172a",
  background: "transparent",
};

const dividerSx = {
  display: { xs: "none", md: "block" },
  position: "absolute",
  top: { md: 70 },
  bottom: { md: 70 },
  left: "50%",
  width: "2px",
  transform: "translateX(-1px)",
  borderRadius: 999,
  background:
    "linear-gradient(180deg, rgba(74,116,218,0.9), rgba(74,116,218,0.25))",
};

const pillOuterSx = {
  borderRadius: "999px",
  p: "2px",
  background:
    "linear-gradient(90deg, rgba(113,201,249,0.95), rgba(236,72,153,0.75))",
  boxShadow: "0 14px 30px rgba(74, 116, 218, 0.10)",
};

const pillInnerSx = {
  borderRadius: "999px",
  backgroundColor: "rgba(255,255,255,0.92)",
  px: { xs: 2.5, md: 4.25 },
  py: { xs: 1.6, md: 2.15 },
  textAlign: "center",
};

export default function IntroSection() {
  const CEO_SRC = "/ceo.png"; // ✅ ảnh nằm trong public/ceo.png

  return (
    <Box component="section" sx={introSectionSx}>
      <Container
        maxWidth="lg"
        sx={{ position: "relative", py: { xs: 1, md: 2.5 } }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 5, md: 6 },
            alignItems: "center",
          }}
        >
          {/* LEFT */}
          <Box sx={{ flex: { xs: "1 1 auto", md: "2 1 0%" }, pr: { md: 5 } }}>
            <FormatQuoteRoundedIcon
              sx={{ fontSize: 54, color: "rgba(30, 102, 213, 0.95)", mb: 1 }}
            />

            <Typography
              sx={{
                fontSize: { xs: 26, md: 34 },
                fontWeight: 800,
                fontStyle: "italic",
                lineHeight: 1.2,
                color: "#0b4aa2",
                mb: 3,
              }}
            >
              {introQuoteLines?.[0] ||
                "Chúng tôi không chỉ vận hành livestream."}
              <br />
              {introQuoteLines?.[1] ||
                "Chúng tôi xây dựng tương lai của Livestream Commerce."}
            </Typography>

            <Stack spacing={2.4} sx={{ maxWidth: 640 }}>
              {(introHighlights || []).map((h, idx) => (
                <Box key={`${h?.title}-${idx}`} sx={pillOuterSx}>
                  <Box sx={pillInnerSx}>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: 18, md: 16 },
                        color: "rgba(74,116,218,0.95)",
                        mb: 0.4,
                      }}
                    >
                      {h?.title}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: { xs: 14, md: 14 },
                        color: "rgba(15, 23, 42, 0.72)",
                      }}
                    >
                      {h?.desc}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* RIGHT = ẢNH */}
          <Box
            sx={{
              flex: { xs: "1 1 auto", md: "1 1 0%" },
              position: "relative",
              minHeight: { xs: 380, md: 430 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              component="img"
              src={ceoImage}
              alt={ceoInfo?.name || "CEO"}
              sx={{
                height: { xs: 520, md: 600 },
                objectFit: "contain",
                transform: { xs: "scale(4)", md: "scale(4)" }, // ✅ phóng to
                transformOrigin: "center",
              }}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
