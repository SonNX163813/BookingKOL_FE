import React from "react";
import { motion } from "framer-motion";
import {
  Box,
  Typography,
  Button,
  Grid,
  Stack,
  Avatar,
  LinearProgress,
} from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";

const textPrimary = "#E6F4EF";
const textSecondary = "#AABBB5";

const ReviewsSection = ({ reviews, overallRating, ratingDistribution }) => {
  const renderStars = (rating) => {
    const fullStars = Math.round(Math.max(0, Math.min(5, rating)));
    return Array.from({ length: 5 }, (_, index) => (
      <StarRoundedIcon
        key={index}
        sx={{
          fontSize: 18,
          color: index < fullStars ? "#FFD166" : "rgba(255,255,255,0.18)",
        }}
      />
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
    >
      <Box
        sx={{
          borderRadius: "24px",
          background:
            "radial-gradient(60% 60% at 20% 20%, rgba(22, 249, 138, 0.18) 0%, rgba(5, 34, 11, 0) 70%), \
   radial-gradient(50% 50% at 80% 10%, rgba(19, 67, 56, 0.22) 0%, rgba(5, 34, 11, 0) 65%), \
   linear-gradient(160deg, rgba(5, 34, 11, 1) 0%, rgba(19, 67, 56, 0.92) 55%, rgba(22, 249, 138, 0.18) 100%)",

          border: "1px solid rgba(0, 227, 159, 0.14)",
          boxShadow:
            "0 28px 60px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255,255,255,0.04)",
          p: { xs: 3, md: 4 },
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: textPrimary,
            fontWeight: 700,
            letterSpacing: "0.04em",
            mb: 3.5,
          }}
        >
          Đánh giá từ khách hàng
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 3, md: 4 },
            alignItems: { xs: "stretch", md: "flex-start" },
          }}
        >
          <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 66.67%" } }}>
            <Stack spacing={2.5}>
              {reviews.map((review) => (
                <Box
                  key={review.id}
                  sx={{
                    borderRadius: "18px",
                    background: "rgba(18, 26, 25, 0.86)",
                    border: "1px solid rgba(0, 227, 159, 0.12)",
                    px: { xs: 2, sm: 2.5 },
                    py: { xs: 2, sm: 2.25 },
                  }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", sm: "center" }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          background:
                            "linear-gradient(135deg, rgba(0,199,118,0.45), rgba(0,227,159,0.2))",
                          color: textPrimary,
                          fontWeight: 700,
                        }}
                        alt={`Ảnh đại diện của ${review.name}`}
                      >
                        {review.name?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography
                          sx={{ color: textPrimary, fontWeight: 600 }}
                        >
                          {review.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: textSecondary }}
                        >
                          {review.time}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                      {renderStars(review.rating)}
                    </Stack>
                  </Stack>
                  <Typography
                    variant="body2"
                    sx={{ color: textSecondary, mt: 1.75, lineHeight: 1.7 }}
                  >
                    {review.content}
                  </Typography>
                </Box>
              ))}

              <Button
                endIcon={<ChevronRightRoundedIcon />}
                sx={{
                  alignSelf: "flex-start",
                  color: "#00E39F",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 0,
                  "&:hover": { color: "#00F4B0", background: "transparent" },
                }}
                aria-label="Xem thêm đánh giá"
              >
                Xem thêm đánh giá
              </Button>
            </Stack>
          </Box>

          <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 33.33%" } }}>
            <Stack
              spacing={3}
              sx={{
                borderRadius: "20px",
                background: "rgba(18, 26, 25, 0.86)",
                border: "1px solid rgba(0, 227, 159, 0.16)",
                px: { xs: 2.5, md: 3 },
                py: { xs: 2.5, md: 3 },
                height: "fit-content",
              }}
            >
              <Stack spacing={0.75} alignItems="center">
                <Typography variant="subtitle2" sx={{ color: textSecondary }}>
                  Điểm trung bình
                </Typography>
                <Typography
                  variant="h2"
                  sx={{ color: textPrimary, fontWeight: 700 }}
                >
                  {overallRating}
                </Typography>
                <Stack direction="row" spacing={0.5}>
                  {renderStars(overallRating)}
                </Stack>
                <Typography variant="body2" sx={{ color: textSecondary }}>
                  Dựa trên {reviews.length} đánh giá
                </Typography>
              </Stack>

              <Stack spacing={1.2}>
                {ratingDistribution.map((item) => (
                  <Stack
                    key={item.stars}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: textSecondary, width: 28 }}
                      aria-label={`${item.stars} sao`}
                    >
                      {item.stars}★
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={item.percentage}
                      sx={{
                        flex: 1,
                        height: 8,
                        borderRadius: 8,
                        backgroundColor: "rgba(255,255,255,0.08)",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 8,
                          background:
                            "linear-gradient(135deg, #FFD166, #F4A261)",
                        },
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        color: textSecondary,
                        width: 32,
                        textAlign: "right",
                      }}
                    >
                      {item.count}
                    </Typography>
                  </Stack>
                ))}
              </Stack>

              <Button
                variant="contained"
                startIcon={<EditRoundedIcon />}
                sx={{
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: "16px",
                  background:
                    "linear-gradient(135deg, #00C776 0%, #00E39F 100%)",
                  color: "#031412",
                  boxShadow: "0 18px 40px rgba(0, 227, 159, 0.25)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #00D584 0%, #00F4B0 100%)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid rgba(0, 227, 159, 0.6)",
                    outlineOffset: 3,
                  },
                }}
                aria-label="Viết đánh giá"
              >
                Viết đánh giá
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
};

export default ReviewsSection;
