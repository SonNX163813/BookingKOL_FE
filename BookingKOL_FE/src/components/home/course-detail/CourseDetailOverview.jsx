import React from "react";
import { Grid, Stack, Typography, Divider, Box } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

const cardStyles = {
  borderRadius: { xs: 4, md: 5 },
  backgroundColor: "#ffffff",
  border: "1px solid rgba(74, 116, 218, 0.16)",
  boxShadow: "0 16px 40px rgba(74, 116, 218, 0.12)",
  p: { xs: 3, md: 4 },
};

const textColor = "rgba(15, 23, 42, 0.75)";

const CourseDetailOverview = ({
  descriptionBlocks,
  keyTakeaways,
  media,
  courseTitle,
  coverImage,
}) => {
  const galleryItems = Array.isArray(media?.gallery) ? media.gallery : [];

  return (
    <Grid container spacing={4}>
      <Grid item xs={12} md={6}>
        <Stack spacing={3}>
          <Stack spacing={2} sx={cardStyles}>
            <Stack direction="row" spacing={2} alignItems="center">
              <AutoAwesomeRoundedIcon sx={{ color: "#4a74da" }} />
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: "#0f172a" }}
              >
                Nội dung chi tiết
              </Typography>
            </Stack>
            <Divider sx={{ borderColor: "rgba(74, 116, 218, 0.12)" }} />
            <Stack
              spacing={3}
              sx={{ color: textColor, lineHeight: 1.7, flex: 1 }}
            >
              {descriptionBlocks.length === 0 ? (
                <Typography>
                  Nội dung khoá học sẽ được cập nhật trong thời gian tới.
                </Typography>
              ) : (
                descriptionBlocks.map((block, index) => (
                  <Typography key={index} sx={{ whiteSpace: "pre-line" }}>
                    {block}
                  </Typography>
                ))
              )}
            </Stack>
          </Stack>

          <Stack spacing={2} sx={cardStyles}>
            <Stack direction="row" spacing={2} alignItems="center">
              <CalendarMonthRoundedIcon sx={{ color: "#f59e0b" }} />
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "#0f172a" }}
              >
                Giá trị chính của khoá học
              </Typography>
            </Stack>
            <Stack spacing={1.5} sx={{ color: textColor, lineHeight: 1.6 }}>
              {keyTakeaways.length === 0 ? (
                <Typography>
                  Khoá học giúp bạn xây dựng quy trình livestream chuyên nghiệp
                  và tăng trưởng ổn định.
                </Typography>
              ) : (
                keyTakeaways.map((item) => (
                  <Stack
                    key={item}
                    direction="row"
                    spacing={1.5}
                    alignItems="flex-start"
                  >
                    <CheckCircleRoundedIcon
                      sx={{ color: "#4a74da", fontSize: 20, mt: "2px" }}
                    />
                    <Typography>{item}</Typography>
                  </Stack>
                ))
              )}
            </Stack>
          </Stack>

          <Stack spacing={2} sx={cardStyles}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#0f172a" }}>
              Thư viện ảnh khoá học
            </Typography>
            <Stack direction="row" spacing={1.5} flexWrap="wrap">
              {galleryItems.length === 0 ? (
                <Box
                  component="img"
                  src={coverImage}
                  alt={courseTitle}
                  sx={{
                    width: "100%",
                    borderRadius: 3,
                    border: "1px solid rgba(74, 116, 218, 0.16)",
                    objectFit: "cover",
                  }}
                />
              ) : (
                galleryItems.map((item) => (
                  <Box
                    key={item.id}
                    component="img"
                    src={item.url}
                    alt={item.name || courseTitle}
                    sx={{
                      width: "calc(50% - 12px)",
                      minWidth: 140,
                      borderRadius: 3,
                      border: "1px solid rgba(74, 116, 218, 0.16)",
                      objectFit: "cover",
                    }}
                  />
                ))
              )}
            </Stack>
          </Stack>
        </Stack>
      </Grid>
    </Grid>
  );
};

export default CourseDetailOverview;
