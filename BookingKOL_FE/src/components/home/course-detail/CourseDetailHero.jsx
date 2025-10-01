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
        "radial-gradient(60% 60% at 20% 20%, rgba(22, 249, 138, 0.18) 0%, rgba(5, 34, 11, 0) 70%), \
         radial-gradient(50% 50% at 80% 10%, rgba(19, 67, 56, 0.22) 0%, rgba(5, 34, 11, 0) 65%), \
         linear-gradient(160deg, rgba(5, 34, 11, 1) 0%, rgba(19, 67, 56, 0.92) 55%, rgba(22, 249, 138, 0.18) 100%)",
      border: "1px solid rgba(0, 227, 159, 0.2)",
      overflow: "hidden",
      boxShadow: "0 40px 88px rgba(0, 0, 0, 0.42)",
      px: { xs: 3, md: 5 },
      py: { xs: 4, md: 6 },
    }}
  >
    {/* Stack Container chính - flexDirection: row trên màn to */}
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={4}
      alignItems="center"
    >
      {/* TRÁI: Ảnh bìa - chiếm 50% */}
      <Box
        sx={{
          flex: { xs: "none", md: "0 0 50%" },
          width: { xs: "100%", md: "50%" },
        }}
      >
        <Box
          sx={{
            position: "relative",
            borderRadius: { xs: 4, md: 5 },
            overflow: "hidden",
            border: "1px solid rgba(0, 227, 159, 0.18)",
            boxShadow: "0 30px 70px rgba(0, 0, 0, 0.4)",
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

      {/* PHẢI: Thông tin khóa học - chiếm 50% */}
      <Box
        sx={{
          flex: { xs: "none", md: "0 0 50%" },
          width: { xs: "100%", md: "50%" },
        }}
      >
        <Stack spacing={2.5}>
          {/* Chip trạng thái và giảm giá */}
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            {!!statusChip && (
              <Chip
                label={statusChip.label}
                sx={{
                  bgcolor: alpha(statusChip.color || "#00E39F", 0.18),
                  color: statusChip.color || "#00E39F",
                  fontWeight: 600,
                }}
              />
            )}
            {!!discountChip && (
              <Chip
                label={discountChip.label}
                sx={{
                  bgcolor: alpha(discountChip.color || "#38BDF8", 0.16),
                  color: discountChip.color || "#38BDF8",
                  fontWeight: 600,
                }}
              />
            )}
          </Stack>

          {/* Tiêu đề */}
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "2.2rem", md: "3.2rem" },
              lineHeight: 1.15,
            }}
          >
            {courseTitle}
          </Typography>

          {/* Mô tả */}
          <Typography
            sx={{
              color: "rgba(230, 244, 239, 0.78)",
              fontSize: { xs: "1rem", md: "1.1rem" },
              lineHeight: 1.7,
            }}
          >
            Khung đào tạo livestream nâng cao, hướng dẫn chi tiết từ khâu thiết
            lập cho tới tối ưu doanh thu, phù hợp cho đội ngũ đang muốn tăng tốc
            livestream xây dựng thương hiệu.
          </Typography>

          {/* Giá */}
          <Stack
            direction="row"
            spacing={3}
            alignItems="center"
            flexWrap="wrap"
          >
            <Stack spacing={0.5}>
              <Typography
                sx={{
                  color: "rgba(230, 244, 239, 0.6)",
                  textTransform: "uppercase",
                  letterSpacing: 1.4,
                  fontSize: "0.85rem",
                }}
              >
                Học phí trọn gói
              </Typography>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: "#00E39F" }}
              >
                {priceLabel}
              </Typography>
            </Stack>
            {!!discountChip && (
              <Typography sx={{ color: "#38BDF8" }}>
                Đã áp dụng mã giảm giá
              </Typography>
            )}
          </Stack>

          {/* CTA */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              variant="contained"
              size="large"
              endIcon={<PlayArrowRoundedIcon />}
              sx={{
                textTransform: "none",
                fontWeight: 700,
                bgcolor: "#00E39F",
                color: "#062720",
                px: { xs: 3.5, md: 4.5 },
                py: 1.5,
                borderRadius: 3,
                boxShadow: "0 20px 54px rgba(0, 227, 159, 0.32)",
                "&:hover": {
                  bgcolor: "#0BF2AE",
                  boxShadow: "0 24px 64px rgba(11, 242, 174, 0.35)",
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
                borderColor: "rgba(0, 227, 159, 0.35)",
                color: "rgba(230, 244, 239, 0.92)",
                px: { xs: 3.5, md: 4.5 },
                borderRadius: 3,
                "&:hover": {
                  borderColor: "rgba(0, 227, 159, 0.6)",
                  bgcolor: "rgba(0, 227, 159, 0.08)",
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
