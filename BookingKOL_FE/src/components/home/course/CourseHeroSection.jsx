import React from "react";
import { Box, Stack, Chip, Typography, Button } from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

const CourseHeroSection = ({
  onExploreTopCourse,
  hasCourses,
  loading,
  onManualRefresh,
}) => (
  <Box
    sx={{
      p: { xs: 3, md: 5 },
      borderRadius: { xs: 4, md: 6 },
      background:
        "linear-gradient(135deg, rgba(0, 199, 118, 0.12), rgba(0, 227, 159, 0.04))",
      border: "1px solid rgba(0, 227, 159, 0.18)",
      boxShadow: "0 30px 80px rgba(0, 227, 159, 0.18)",
    }}
  >
    <Stack spacing={2.5}>
      <Chip
        label="Gói khóa học"
        sx={{
          alignSelf: "flex-start",
          bgcolor: "rgba(0, 227, 159, 0.14)",
          color: "#9AE6B4",
          fontWeight: 600,
          letterSpacing: 0.5,
        }}
      />
      <Typography
        variant="h3"
        sx={{
          fontWeight: 700,
          fontSize: { xs: "2rem", md: "3.1rem" },
          lineHeight: 1.2,
        }}
      >
        Nâng tầm buổi livestream và doanh thu của bạn
      </Typography>
      <Typography
        sx={{
          maxWidth: 680,
          color: "rgba(230, 244, 239, 0.76)",
          fontSize: { xs: "1rem", md: "1.1rem" },
          lineHeight: 1.7,
        }}
      >
        Các gói đào tạo livestream chuyên sâu, tối ưu công cụ và chiến lược tiên
        phong. Chủ động đảm nhiệm toàn bộ quy trình từ setup đến tối ưu doanh
        thu trong mỗi phiên live.
      </Typography>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Button
          variant="contained"
          size="large"
          endIcon={<ArrowForwardRoundedIcon />}
          onClick={onExploreTopCourse}
          disabled={!hasCourses || loading}
          sx={{
            bgcolor: "#00E39F",
            color: "#062720",
            fontWeight: 700,
            px: { xs: 3, md: 4 },
            py: 1.2,
            textTransform: "none",
            borderRadius: 3,
            boxShadow: "0 16px 38px rgba(0, 227, 159, 0.32)",
            "&:hover": {
              bgcolor: "#0BF2AE",
              boxShadow: "0 20px 46px rgba(11, 242, 174, 0.36)",
            },
          }}
        >
          Khám phá gói tiêu biểu
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={onManualRefresh}
          disabled={loading}
          startIcon={<RefreshRoundedIcon />}
          sx={{
            borderColor: "rgba(0, 227, 159, 0.35)",
            color: "rgba(230, 244, 239, 0.74)",
            fontWeight: 600,
            textTransform: "none",
            px: { xs: 3, md: 4 },
            borderRadius: 3,
            "&:hover": {
              borderColor: "rgba(0, 227, 159, 0.6)",
              backgroundColor: "rgba(0, 227, 159, 0.08)",
            },
          }}
        >
          Tải lại danh sách
        </Button>
      </Stack>
    </Stack>
  </Box>
);

export default CourseHeroSection;
