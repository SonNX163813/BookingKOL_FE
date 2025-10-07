import React from "react";
import { Box, Stack, Typography, Chip, Button } from "@mui/material";
import { alpha } from "@mui/material/styles";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";

const CourseDetailHero = ({
  courseTitle,
  priceLabel,
  statusChip,
  discountChip,
  coverImage,
  onSeeOtherPackages,
}) => (
  <Box
    sx={{
      position: "relative",
      borderRadius: { xs: 4, md: 6 },
      background:
        "linear-gradient(135deg, rgba(74, 116, 218, 0.12), rgba(147, 206, 246, 0.08))",
      border: "1px solid rgba(74, 116, 218, 0.16)",
      overflow: "hidden",
      boxShadow: "0 32px 80px rgba(74, 116, 218, 0.18)",
      px: { xs: 3, md: 5 },
      py: { xs: 4, md: 6 },
    }}
  >
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={4}
      alignItems="center"
    >
      <Box
        sx={{
          flex: { xs: "none", md: "0 0 48%" },
          width: { xs: "100%", md: "48%" },
        }}
      >
        <Box
          sx={{
            position: "relative",
            borderRadius: { xs: 4, md: 5 },
            overflow: "hidden",
            border: "1px solid rgba(74, 116, 218, 0.18)",
            boxShadow: "0 24px 56px rgba(74, 116, 218, 0.18)",
          }}
        >
          <Box
            component="img"
            src={coverImage}
            alt={courseTitle}
            sx={{
              width: "100%",
              height: { xs: 320, md: 420 },
              objectFit: "cover",
              display: "block",
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          flex: { xs: "none", md: "0 0 52%" },
          width: { xs: "100%", md: "52%" },
        }}
      >
        <Stack spacing={2.5}>
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            {!!statusChip && (
              <Chip
                label={statusChip.label}
                sx={{
                  bgcolor: alpha(statusChip.color || "#4a74da", 0.15),
                  color: statusChip.color || "#2f3c8c",
                  fontWeight: 600,
                }}
              />
            )}
            {!!discountChip && (
              <Chip
                label={discountChip.label}
                sx={{
                  bgcolor: alpha(discountChip.color || "#4a74da", 0.12),
                  color: discountChip.color || "#4a74da",
                  fontWeight: 600,
                }}
              />
            )}
          </Stack>

          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "2.2rem", md: "3.1rem" },
              lineHeight: 1.15,
              color: "#0f172a",
            }}
          >
            {courseTitle}
          </Typography>

          <Typography
            sx={{
              color: "rgba(15, 23, 42, 0.7)",
              fontSize: { xs: "1rem", md: "1.08rem" },
              lineHeight: 1.7,
            }}
          >
            Khung đào tạo livestream nâng cao, hướng dẫn chi tiết từ khâu thiết
            lập cho tới tối ưu doanh thu, phù hợp cho đội ngũ đang muốn tăng tốc
            livestream xây dựng thương hiệu.
          </Typography>

          <Stack
            direction="row"
            spacing={3}
            alignItems="center"
            flexWrap="wrap"
          >
            <Stack spacing={0.5}>
              <Typography
                sx={{
                  color: "rgba(15, 23, 42, 0.6)",
                  textTransform: "uppercase",
                  letterSpacing: 1.4,
                  fontSize: "0.85rem",
                }}
              >
                Học phí trọn gói
              </Typography>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: "#4a74da" }}
              >
                {priceLabel}
              </Typography>
            </Stack>
            {!!discountChip && (
              <Typography sx={{ color: "#2f3c8c" }}>
                Đã áp dụng mã giảm giá
              </Typography>
            )}
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              size="large"
              endIcon={<PlayArrowRoundedIcon />}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                bgcolor: "#4a74da",
                color: "#ffffff",
                px: { xs: 3.5, md: 4.5 },
                py: 1.5,
                borderRadius: 3,
                boxShadow: "0 20px 54px rgba(74, 116, 218, 0.24)",
                "&:hover": {
                  bgcolor: "#3b5ec8",
                  boxShadow: "0 24px 64px rgba(59, 94, 200, 0.26)",
                },
              }}
            >
              Đăng ký tư vấn
            </Button>
            <Button
              variant="outlined"
              size="large"
              endIcon={<LaunchRoundedIcon />}
              onClick={onSeeOtherPackages}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderColor: "rgba(74, 116, 218, 0.35)",
                color: "rgba(15, 23, 42, 0.7)",
                px: { xs: 3.5, md: 4.5 },
                borderRadius: 3,
                "&:hover": {
                  borderColor: "rgba(74, 116, 218, 0.55)",
                  bgcolor: "rgba(74, 116, 218, 0.08)",
                },
              }}
            >
              Xem gói khác
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Stack>
  </Box>
);

export default CourseDetailHero;
