import React from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Rating,
  Stack,
  Typography,
} from "@mui/material";
import { caseStudyHighlights, testimonials } from "./data";

const sectionSx = {
  overflow: "hidden",
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
};

const primaryCardSx = {
  height: "100%",
  borderRadius: 4,
  backgroundColor: "rgba(255, 255, 255, 0.92)",
  // backgroundImage:
  //   "radial-gradient(circle at top left, rgba(147, 206, 246, 0.35), rgba(255, 255, 255, 0.95))",
  border: "1px solid rgba(147, 206, 246, 0.4)",
  boxShadow: "0 14px 32px rgba(74, 116, 218, 0.12)",
  display: "flex",
  flexDirection: "column",
};

const highlightPrimaryCardSx = {
  backgroundColor: "#ffffff",
  // backgroundImage:
  //   "linear-gradient(135deg, rgba(141, 226, 237, 0.65), rgba(147, 206, 246, 0.3))",
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
  // backgroundImage:
  //   "radial-gradient(circle at top right, rgba(141, 226, 237, 0.38), rgba(255, 255, 255, 0.9))",
  border: "1px solid rgba(147, 206, 246, 0.4)",
  boxShadow: "0 16px 32px rgba(74, 116, 218, 0.12)",
  height: "100%",
  display: "flex",
  flexDirection: "column",
};

const testimonialContentSx = {
  display: "flex",
  flexDirection: "column",
  gap: 2.5,
  flexGrow: 1,
};

const buttonSx = {
  borderRadius: "14px",
  px: 3,
  backgroundImage: "linear-gradient(135deg, #4a74da, #93cef6)",
  boxShadow: "0px 16px 28px rgba(74, 116, 218, 0.2)",
};

const SectionHeader = ({ overline, title, center = true }) => (
  <Stack spacing={2} sx={{ textAlign: center ? "center" : "left", mb: 4 }}>
    <Typography
      variant="overline"
      sx={{
        fontSize: "0.95rem",
        letterSpacing: 2,
        color: "rgba(15, 23, 42, 0.55)",
      }}
    >
      {overline}
    </Typography>
    <Typography variant="h4" sx={{ fontWeight: 700 }}>
      {title}
    </Typography>
  </Stack>
);

const CaseStudiesSection = () => {
  return (
    <Box component="section" id="cases" sx={sectionSx}>
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        {/* MỤC 1: Số liệu nổi bật / Case Study */}
        <Box component="section" aria-labelledby="case-highlights">
          <SectionHeader
            overline="Case Study & Số liệu nổi bật"
            title="Kết quả thực tế từ các chiến dịch của Nexus"
          />

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

                      {/* Nếu item có các số liệu chi tiết, render bullets */}
                      {Array.isArray(item.metrics) &&
                        item.metrics.length > 0 && (
                          <Stack spacing={1.0} sx={{ mt: 1 }}>
                            {item.metrics.map((m, i) => (
                              <Stack
                                key={i}
                                direction="row"
                                justifyContent="space-between"
                                sx={{
                                  p: 1.25,
                                  borderRadius: 2,
                                  border: "1px solid rgba(74,116,218,0.12)",
                                  background:
                                    "linear-gradient(180deg, rgba(147,206,246,0.10), rgba(255,255,255,0.6))",
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {m.label}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{ color: "#2f3c8c", fontWeight: 700 }}
                                >
                                  {m.value}
                                </Typography>
                              </Stack>
                            ))}
                          </Stack>
                        )}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>

        <Divider sx={{ my: { xs: 6, md: 8 } }} />

        {/* MỤC 2: Ý kiến khách hàng / Testimonials + Rating */}
        <Box component="section" aria-labelledby="customer-testimonials">
          <SectionHeader
            overline="Khách hàng nói gì"
            title="Ý kiến & đánh giá từ đối tác/nhãn hàng"
          />

          <Box sx={testimonialsGridSx}>
            {testimonials.map((t) => (
              <Card elevation={0} sx={testimonialCardSx} key={t.name}>
                <CardContent sx={testimonialContentSx}>
                  <Stack
                    direction="row"
                    spacing={2}
                    alignItems="center"
                    sx={{ color: "#0f172a" }}
                  >
                    <Avatar src={t.avatar} alt={t.name} />
                    <Stack>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {t.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(15, 23, 42, 0.6)" }}
                      >
                        {t.role}
                      </Typography>
                      {!!t.brand && (
                        <Typography
                          variant="caption"
                          sx={{ color: "rgba(15, 23, 42, 0.5)" }}
                        >
                          {t.brand}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>

                  {/* Rating */}
                  <Rating
                    name={`rating-${t.name}`}
                    value={typeof t.rating === "number" ? t.rating : 5}
                    precision={0.5}
                    readOnly
                    sx={{ mt: -0.5 }}
                  />

                  {/* Quote */}
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(15, 23, 42, 0.75)" }}
                  >
                    “{t.quote}”
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

        {/* CTA chung */}
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
