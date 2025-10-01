import React from "react";
import { Grid, Stack, Typography, Divider, Box } from "@mui/material";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";

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
          {/* Nội dung chi tiết */}
          <Stack
            spacing={2}
            sx={{
              borderRadius: { xs: 4, md: 5 },
              background:
                "radial-gradient(60% 60% at 20% 20%, rgba(22, 249, 138, 0.18) 0%, rgba(5, 34, 11, 0) 70%), \
   radial-gradient(50% 50% at 80% 10%, rgba(19, 67, 56, 0.22) 0%, rgba(5, 34, 11, 0) 65%), \
   linear-gradient(160deg, rgba(5, 34, 11, 1) 0%, rgba(19, 67, 56, 0.92) 55%, rgba(22, 249, 138, 0.18) 100%)",
              border: "1px solid rgba(0, 227, 159, 0.16)",
              p: { xs: 3, md: 4 },
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <AutoAwesomeRoundedIcon sx={{ color: "#00E39F" }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Nội dung chi tiết
              </Typography>
            </Stack>
            <Divider sx={{ borderColor: "rgba(0, 227, 159, 0.12)" }} />
            <Stack
              spacing={3}
              sx={{
                color: "rgba(230, 244, 239, 0.82)",
                lineHeight: 1.7,
                flex: 1,
                overflowY: "auto",
              }}
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

          {/* Giá trị chính */}
          <Stack
            spacing={2}
            sx={{
              borderRadius: { xs: 4, md: 5 },
              background:
                "radial-gradient(60% 60% at 20% 20%, rgba(22, 249, 138, 0.18) 0%, rgba(5, 34, 11, 0) 70%), \
   radial-gradient(50% 50% at 80% 10%, rgba(19, 67, 56, 0.22) 0%, rgba(5, 34, 11, 0) 65%), \
   linear-gradient(160deg, rgba(5, 34, 11, 1) 0%, rgba(19, 67, 56, 0.92) 55%, rgba(22, 249, 138, 0.18) 100%)",
              border: "1px solid rgba(0, 227, 159, 0.16)",
              p: { xs: 3, md: 4 },
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <CalendarMonthRoundedIcon sx={{ color: "#38BDF8" }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Giá trị chính của khoá học
              </Typography>
            </Stack>
            <Stack
              spacing={1.5}
              sx={{ color: "rgba(230, 244, 239, 0.82)", lineHeight: 1.6 }}
            >
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
                      sx={{ color: "#00E39F", fontSize: 20, mt: "2px" }}
                    />
                    <Typography>{item}</Typography>
                  </Stack>
                ))
              )}
            </Stack>
          </Stack>

          {/* Thư viện ảnh */}
          <Stack
            spacing={2}
            sx={{
              borderRadius: { xs: 4, md: 5 },
              background:
                "radial-gradient(60% 60% at 20% 20%, rgba(22, 249, 138, 0.18) 0%, rgba(5, 34, 11, 0) 70%), \
   radial-gradient(50% 50% at 80% 10%, rgba(19, 67, 56, 0.22) 0%, rgba(5, 34, 11, 0) 65%), \
   linear-gradient(160deg, rgba(5, 34, 11, 1) 0%, rgba(19, 67, 56, 0.92) 55%, rgba(22, 249, 138, 0.18) 100%)",
              border: "1px solid rgba(0, 227, 159, 0.16)",
              p: { xs: 3, md: 4 },
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
                    border: "1px solid rgba(0, 227, 159, 0.16)",
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
                      border: "1px solid rgba(0, 227, 159, 0.14)",
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
