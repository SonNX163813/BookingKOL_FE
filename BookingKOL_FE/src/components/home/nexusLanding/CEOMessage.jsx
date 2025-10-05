import React from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";

const sectionSx = {
  // mx: { xs: 2, md: 4 },
  // borderRadius: { xs: 3, md: 4 },
  overflow: "hidden",
  // backgroundColor: "#ffffff",
  // backgroundImage: `
  //   radial-gradient(circle at 16% 18%, rgba(147, 206, 246, 0.6), rgba(255, 255, 255, 0) 60%),
  //   radial-gradient(circle at 84% 0%, rgba(74, 116, 218, 0.35), rgba(255, 255, 255, 0) 55%),
  //   radial-gradient(circle at 50% 100%, rgba(74, 116, 218, 0.25), rgba(255, 255, 255, 0.85) 70%)
  // `,
  // boxShadow: "0 18px 42px rgba(74, 116, 218, 0.12)",
  color: "#0f172a",
};

const cardSx = {
  borderRadius: 5,
  backgroundColor: "rgba(255, 255, 255, 0.9)",
  backgroundImage:
    "radial-gradient(circle at top left, rgba(147, 206, 246, 0.4), rgba(74, 116, 218, 0.16))",
  border: "1px solid rgba(147, 206, 246, 0.4)",
  backdropFilter: "blur(12px)",
};

const buttonSx = {
  alignSelf: { xs: "stretch", sm: "flex-start" },
  borderRadius: "14px",
  px: 3,
  backgroundImage: "linear-gradient(135deg, #4a74da, #93cef6)",
  boxShadow: "0px 16px 30px rgba(74, 116, 218, 0.22)",
};

const CEOMessage = () => {
  return (
    <Box component="section" sx={sectionSx}>
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Card elevation={0} sx={cardSx}>
          <CardContent sx={{ p: { xs: 3.5, md: 6 } }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={{ xs: 4, md: 5 }}
              alignItems="center"
            >
              <Box sx={{ textAlign: "center" }}>
                <Avatar
                  src="https://via.placeholder.com/160"
                  alt="CEO Nexus Agency"
                  sx={{
                    width: 140,
                    height: 140,
                    mx: "auto",
                    border: "4px solid rgba(74, 116, 218, 0.35)",
                  }}
                />
                {/* <Box
                  sx={{
                    mt: 3,
                    width: 160,
                    height: 52,
                    borderRadius: 2,
                    backgroundImage:
                      "radial-gradient(circle at top, rgba(141, 226, 237, 0.4), rgba(255, 255, 255, 0.85))",
                    mx: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid rgba(147, 206, 246, 0.4)",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(15, 23, 42, 0.6)" }}
                  >
                    Signature.svg
                  </Typography>
                </Box> */}
              </Box>

              <Stack
                spacing={{ xs: 3, md: 3.5 }}
                sx={{ flex: 1, color: "#0f172a" }}
              >
                <FormatQuoteIcon
                  sx={{ fontSize: 40, color: "rgba(74, 116, 218, 0.75)" }}
                />
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 600, lineHeight: 1.6 }}
                >
                  "Chúng tôi biến mỗi phiên livestream thành một chiến dịch tăng
                  trưởng lấy dữ liệu làm trung tâm, đảm bảo thương hiệu kiểm
                  soát được ROI theo thời gian thực."
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{ color: "rgba(15, 23, 42, 0.6)", fontStyle: "italic" }}
                >
                  - CEO, Nexus Agency
                </Typography>
                <Button
                  component="a"
                  href="#lead-forms"
                  variant="contained"
                  startIcon={<CalendarMonthIcon />}
                  sx={buttonSx}
                >
                  Hẹn lịch trao đổi với CEO
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default CEOMessage;
