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
import { caseStudyHighlights, testimonials } from "./data";

const sectionSx = {
  overflow: "hidden",
  // backgroundColor: "#ffffff",
  // backgroundImage: `
  //   radial-gradient(circle at 18% 18%, rgba(141, 226, 237, 0.5), rgba(255, 255, 255, 0) 58%),
  //   radial-gradient(circle at 82% 0%, rgba(147, 206, 246, 0.55), rgba(255, 255, 255, 0) 55%),
  //   radial-gradient(circle at 50% 100%, rgba(74, 116, 218, 0.25), rgba(255, 255, 255, 0.9) 70%)
  // `,
  // boxShadow: "0 18px 42px rgba(74, 116, 218, 0.12)",
  color: "#0f172a",
};

const highlightsGridSx = {
  display: "grid",
  gridTemplateColumns: {
    xs: "repeat(1, minmax(0, 1fr))",
    sm: "repeat(2, minmax(0, 1fr))",
    lg: "repeat(3, minmax(0, 1fr))",
  },
  gap: { xs: 2.5, md: 3.5 },
};

const testimonialsGridSx = {
  display: "grid",
  gridTemplateColumns: {
    xs: "repeat(1, minmax(0, 1fr))",
    md: "repeat(2, minmax(0, 1fr))",
  },
  gap: { xs: 2.5, md: 3.5 },
  mt: 4,
};

const primaryCardSx = {
  height: "100%",
  borderRadius: 4,
  backgroundColor: "rgba(255, 255, 255, 0.92)",
  backgroundImage:
    "radial-gradient(circle at top left, rgba(147, 206, 246, 0.35), rgba(255, 255, 255, 0.95))",
  border: "1px solid rgba(147, 206, 246, 0.4)",
  boxShadow: "0 14px 32px rgba(74, 116, 218, 0.12)",
  display: "flex",
  flexDirection: "column",
};

const highlightPrimaryCardSx = {
  backgroundColor: "#ffffff",
  backgroundImage:
    "linear-gradient(135deg, rgba(141, 226, 237, 0.65), rgba(147, 206, 246, 0.3))",
  border: "1px solid rgba(74, 116, 218, 0.4)",
  boxShadow: "0 20px 44px rgba(74, 116, 218, 0.2)",
};

const primaryCardContentSx = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
  flexGrow: 1,
};

const testimonialCardSx = {
  borderRadius: 4,
  backgroundColor: "rgba(255, 255, 255, 0.94)",
  backgroundImage:
    "radial-gradient(circle at top right, rgba(141, 226, 237, 0.38), rgba(255, 255, 255, 0.9))",
  border: "1px solid rgba(147, 206, 246, 0.4)",
  boxShadow: "0 16px 32px rgba(74, 116, 218, 0.12)",
  height: "100%",
  display: "flex",
  flexDirection: "column",
};

const testimonialContentSx = {
  display: "flex",
  flexDirection: "column",
  gap: 16,
  flexGrow: 1,
};

const buttonSx = {
  borderRadius: "14px",
  px: 3,
  backgroundImage: "linear-gradient(135deg, #4a74da, #93cef6)",
  boxShadow: "0px 16px 28px rgba(74, 116, 218, 0.2)",
};

const CaseStudiesSection = () => {
  return (
    <Box component="section" id="cases" sx={sectionSx}>
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Stack
          spacing={2}
          sx={{ textAlign: "center", mb: 6, color: "#0f172a" }}
        >
          <Typography
            variant="overline"
            sx={{ letterSpacing: 2, color: "rgba(15, 23, 42, 0.55)" }}
          >
            Case Study & Phản hồi khách hàng
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Kết quả thực tế từ các chiến dịch của Nexus
          </Typography>
        </Stack>

        <Box sx={highlightsGridSx}>
          {caseStudyHighlights.map((item, index) => {
            const isHighlight = index === 0;
            return (
              <Card
                key={item.title}
                elevation={0}
                sx={{
                  ...primaryCardSx,
                  ...(isHighlight ? highlightPrimaryCardSx : {}),
                }}
              >
                <CardContent sx={primaryCardContentSx}>
                  <Stack spacing={1.5} sx={{ color: "#0f172a" }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {item.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(15, 23, 42, 0.65)" }}
                    >
                      {item.subtitle}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        <Box sx={testimonialsGridSx}>
          {testimonials.map((testimonial) => (
            <Card elevation={0} sx={testimonialCardSx} key={testimonial.name}>
              <CardContent sx={testimonialContentSx}>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{ color: "#0f172a" }}
                >
                  <Avatar src={testimonial.avatar} alt={testimonial.name} />
                  <Stack>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {testimonial.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "rgba(15, 23, 42, 0.6)" }}
                    >
                      {testimonial.role}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "rgba(15, 23, 42, 0.5)" }}
                    >
                      {testimonial.brand}
                    </Typography>
                  </Stack>
                </Stack>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(15, 23, 42, 0.7)" }}
                >
                  “{testimonial.quote}”
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Stack alignItems="center" sx={{ mt: 6 }}>
          <Button
            component="a"
            href="#lead-forms"
            variant="contained"
            sx={buttonSx}
          >
            Đọc chi tiết
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};

export default CaseStudiesSection;
