import React from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { heroBadges } from "./data";

const heroSectionSx = {
  position: "relative",
  overflow: "hidden",
  // backgroundColor: "#ffffff",
  // backgroundImage: `
  //   radial-gradient(circle at 6% 12%, rgba(141, 226, 237, 0.8), rgba(255, 255, 255, 0) 58%),
  //   radial-gradient(circle at 94% 8%, rgba(147, 206, 246, 0.75), rgba(255, 255, 255, 0) 52%),
  //   radial-gradient(circle at 50% 95%, rgba(74, 116, 218, 0.32), rgba(255, 255, 255, 0.88) 68%)
  // `,
  // boxShadow: "0 20px 45px rgba(74, 116, 218, 0.12)",
  color: "#0f172a",
};

const primaryCtaSx = {
  borderRadius: "999px",
  px: 3,
  py: 1.5,
  backgroundImage: "linear-gradient(135deg, #4a74da 0%, #93cef6 100%)",
  boxShadow: "0px 18px 30px rgba(74, 116, 218, 0.28)",
};

const secondaryCtaSx = {
  borderRadius: "999px",
  px: 3,
  py: 1.5,
  color: "#0f172a",
  borderColor: "rgba(74, 116, 218, 0.35)",
  backgroundColor: "rgba(255, 255, 255, 0.7)",
  "&:hover": {
    borderColor: "#4a74da",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
  },
};

const HeroBanner = () => {
  return (
    <Box component="section" sx={heroSectionSx}>
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Grid container spacing={{ xs: 6, md: 8 }} alignItems="center">
          <Grid item xs={12} md={6}>
            <Stack spacing={{ xs: 3, md: 4 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                rowGap={1}
              >
                <Chip
                  label="KPI theo thời gian thực & Tối ưu ROI"
                  sx={{
                    color: "#0f172a",
                    backgroundColor: "rgba(255, 255, 255, 0.85)",
                    fontWeight: 600,
                    border: "1px solid rgba(147, 206, 246, 0.6)",
                  }}
                />
                {heroBadges.map((badge) => (
                  <Chip
                    key={badge}
                    label={badge}
                    sx={{
                      color: "#0f172a",
                      backgroundColor: "rgba(147, 206, 246, 0.25)",
                      border: "1px solid rgba(74, 116, 218, 0.25)",
                    }}
                  />
                ))}
              </Stack>

              <Box>
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: "2.4rem", md: "3.4rem" },
                    lineHeight: 1.05,
                    color: "#0f172a",
                  }}
                >
                  Tăng trưởng bền vững cùng KOL/KOC & Livestream thực chiến.
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    mt: 3,
                    color: "rgba(15, 23, 42, 0.72)",
                    fontSize: { xs: "1.05rem", md: "1.2rem" },
                  }}
                >
                  Giải pháp trọn gói từ Setup - Đào tạo - Booking - Vận hành -
                  Affiliate/MCN. KPI rõ ràng, báo cáo realtime, tối ưu chi phí.
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ mt: 1.5, color: "rgba(15, 23, 42, 0.56)" }}
                >
                  (Slogan sẽ được cập nhật sau)
                </Typography>
              </Box>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={{ xs: 2, sm: 3 }}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Button
                  component="a"
                  href="#services"
                  variant="contained"
                  endIcon={<ArrowForwardIcon />}
                  sx={primaryCtaSx}
                >
                  Khám phá dịch vụ
                </Button>
                <Button
                  component="a"
                  href="#lead-forms"
                  variant="outlined"
                  startIcon={<PlayArrowIcon />}
                  sx={secondaryCtaSx}
                >
                  Nhận tư vấn miễn phí
                </Button>
              </Stack>
            </Stack>
          </Grid>

          {/* <Grid item xs={12} md={6}>
            <Box
              sx={{
                position: "relative",
                borderRadius: 4,
                overflow: "hidden",
                minHeight: { xs: 320, md: 440 },
                backgroundColor: "rgba(147, 206, 246, 0.2)",
                backgroundImage: `
                  radial-gradient(circle at 35% 30%, rgba(141, 226, 237, 0.55), rgba(141, 226, 237, 0) 75%),
                  radial-gradient(circle at 70% 70%, rgba(147, 206, 246, 0.45), rgba(147, 206, 246, 0) 70%),
                  radial-gradient(circle at 50% 110%, rgba(74, 116, 218, 0.35), rgba(74, 116, 218, 0) 80%)
                `,
                border: "1px solid rgba(74, 116, 218, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1621609776216-1d862bf56134?auto=format&fit=crop&w=900&q=80"
                alt="Phòng livestream hiện đại"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  mixBlendMode: "multiply",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  bottom: 24,
                  left: 24,
                  right: 24,
                  backgroundColor: "rgba(255, 255, 255, 0.88)",
                  borderRadius: 3,
                  px: 3,
                  py: 2,
                  color: "#0f172a",
                  boxShadow: "0 12px 30px rgba(74, 116, 218, 0.22)",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Studio livestream chuẩn thương mại điện tử
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "rgba(15, 23, 42, 0.65)" }}
                >
                  Hình ảnh minh họa - sẽ cập nhật ảnh thực tế sau.
                </Typography>
              </Box>
            </Box>
          </Grid> */}
        </Grid>
      </Container>
    </Box>
  );
};

export default HeroBanner;
