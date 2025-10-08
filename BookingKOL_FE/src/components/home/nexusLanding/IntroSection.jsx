import React from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { introHighlights } from "./data";

const introSectionSx = {
  overflow: "hidden",
  // backgroundColor: "#ffffff",
  // backgroundImage: `
  //   radial-gradient(circle at 18% 22%, rgba(141, 226, 237, 0.6), rgba(255, 255, 255, 0) 60%),
  //   radial-gradient(circle at 82% 0%, rgba(147, 206, 246, 0.5), rgba(255, 255, 255, 0) 55%),
  //   radial-gradient(circle at 50% 100%, rgba(74, 116, 218, 0.2), rgba(255, 255, 255, 0.9) 72%)
  // `,
  // boxShadow: "0 16px 40px rgba(74, 116, 218, 0.1)",
  color: "#0f172a",
};

const highlightCardSx = {
  px: 3,
  py: 2.75,
  borderRadius: 3,
  backgroundColor: "rgba(255, 255, 255, 0.92)",
  // backgroundImage:
  //   "radial-gradient(circle at top left, rgba(147, 206, 246, 0.4), rgba(255, 255, 255, 0.95))",
  border: "1px solid rgba(147, 206, 246, 0.45)",
  color: "#0f172a",
  boxShadow: "0 12px 24px rgba(74, 116, 218, 0.12)",
};

const IntroSection = () => {
  return (
    <Box component="section" sx={introSectionSx}>
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Grid container spacing={{ xs: 5, md: 6 }} alignItems="center">
          <Grid item flex={{ xs: "auto", md: "auto", lg: "1" }} xs={12} md={6}>
            <Typography
              variant="h4"
              sx={{ fontWeight: 700, mb: 2, color: "#0f172a" }}
            >
              Nexus Agency là đơn vị tiên phong cung cấp giải pháp KOL/KOC
              Marketing & Livestream Commerce trọn gói tại Việt Nam.
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "rgba(15, 23, 42, 0.72)" }}
            >
              Xuất phát từ đội ngũ từng trực tiếp vận hành GMV trên 100 tỷ,
              chúng tôi hiểu cách biến Livestream và Influencer Marketing thành
              đòn bẩy doanh số và tăng trưởng thương hiệu.
            </Typography>
            <Button
              component="a"
              href="#services"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              sx={{
                mt: 3,
                borderRadius: "999px",
                px: 3,
                backgroundImage: "linear-gradient(135deg, #4a74da, #93cef6)",
                boxShadow: "0px 16px 28px rgba(74, 116, 218, 0.22)",
              }}
            >
              Khám phá dịch vụ
            </Button>
          </Grid>
          <Grid
            item
            xs={12}
            md={6}
            width={{ xs: "100%", md: "100%", lg: "auto" }}
          >
            <Stack spacing={2.5}>
              {introHighlights.map((item) => (
                <Paper key={item} elevation={0} sx={highlightCardSx}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {item}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default IntroSection;
