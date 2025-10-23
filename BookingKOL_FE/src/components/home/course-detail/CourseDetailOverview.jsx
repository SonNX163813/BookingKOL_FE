import React from "react";
import { Grid, Stack, Typography, Divider, Box } from "@mui/material";
import { Image } from "antd";
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

const isVideoMediaItem = (item) => {
  if (!item) {
    return false;
  }
  const rawType = (item.type || item.fileType || item.mediaType || "")
    .toString()
    .toUpperCase();
  if (rawType.includes("VIDEO")) {
    return true;
  }
  const contentType =
    item.contentType || item.mimeType || item.mimetype || item.fileContentType;
  if (
    typeof contentType === "string" &&
    contentType.toLowerCase().startsWith("video/")
  ) {
    return true;
  }
  return false;
};

const CourseDetailOverview = ({
  descriptionBlocks,
  keyTakeaways,
  media,
  courseTitle,
  coverImage,
}) => {
  const galleryItems = React.useMemo(() => {
    const items = Array.isArray(media?.gallery) ? media.gallery : [];
    if (items.length <= 1) {
      return items;
    }

    const images = [];
    const videos = [];

    items.forEach((item) => {
      if (isVideoMediaItem(item)) {
        videos.push(item);
      } else {
        images.push(item);
      }
    });

    return [...images, ...videos];
  }, [media?.gallery]);

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
            {galleryItems.length === 0 ? (
              <Image
                src={coverImage}
                alt={courseTitle ?? "image-preview"}
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: "1px solid rgba(74, 116, 218, 0.16)",
                  objectFit: "cover",
                  aspectRatio: "4 / 3",
                }}
                preview={{ mask: "Xem ảnh" }}
              />
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gap: { xs: 1.5, md: 2 },
                  gridTemplateColumns: {
                    xs: "repeat(1, minmax(0, 1fr))",
                    sm: "repeat(3, minmax(0, 1fr))",
                    lg: "repeat(2, minmax(0, 1fr))",
                  },
                }}
              >
                {galleryItems.map((item) => {
                  const isVideo = isVideoMediaItem(item);
                  return isVideo ? (
                    <Box
                      key={item.id}
                      component="video"
                      src={item.url}
                      controls
                      preload="metadata"
                      poster={item.thumbnail ?? undefined}
                      sx={{
                        width: "100%",
                        borderRadius: 3,
                        border: "1px solid rgba(74, 116, 218, 0.16)",
                        // objectFit: "cover",
                        // aspectRatio: "4 / 3",
                      }}
                    ></Box>
                  ) : (
                    <Image
                      key={item.id}
                      src={item.url}
                      alt={item.name || courseTitle}
                      style={{
                        width: "100%",
                        borderRadius: 12,
                        border: "1px solid rgba(74, 116, 218, 0.16)",
                        objectFit: "cover",
                        aspectRatio: "4 / 3",
                      }}
                      preview={{ mask: "Xem ảnh" }}
                    />
                  );
                })}
              </Box>
            )}
          </Stack>
        </Stack>
      </Grid>
    </Grid>
  );
};

export default CourseDetailOverview;
