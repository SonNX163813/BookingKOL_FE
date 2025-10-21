import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Typography,
  Stack,
  Grid,
  Tabs,
  Tab,
  IconButton,
} from "@mui/material";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import PlayCircleOutlineRoundedIcon from "@mui/icons-material/PlayCircleOutlineRounded";
import ReviewsSection from "./ReviewsSection";

const textPrimary = "#2f3c8c";
const textSecondary = "rgba(47, 60, 140, 0.72)";
const overlayGradient =
  "radial-gradient(55% 55% at 90% 0%, rgba(147, 206, 246, 0.35) 0%, rgba(147, 206, 246, 0) 70%), radial-gradient(60% 60% at 0% 100%, rgba(255, 161, 218, 0.28) 0%, rgba(88, 43, 175, 0) 70%)";
const cardGradient =
  "linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(147, 206, 246, 0.25) 55%, rgba(255, 161, 218, 0.22) 100%)";

const Introduction = ({ profile, livestreamVideos, feedback }) => {
  const normalizedProfile = profile ?? {};
  const videos = useMemo(
    () => (Array.isArray(livestreamVideos) ? livestreamVideos : []),
    [livestreamVideos]
  );

  const {
    reviews = [],
    overallRating = 0,
    ratingDistribution = [],
    reviewCount = reviews?.length ?? 0,
  } = feedback ?? {};

  const [activeTab, setActiveTab] = useState(() =>
    videos.length > 0 ? "videos" : "videos"
  );

  const infoItems = useMemo(
    () => [
      {
        label: "Ngày sinh",
        value: normalizedProfile.dateOfBirth ?? "Đang cập nhật",
        icon: EventRoundedIcon,
      },
      {
        label: "Kinh nghiệm",
        value: normalizedProfile.experience ?? "Đang cập nhật",
        icon: WorkspacePremiumRoundedIcon,
      },
    ],
    [normalizedProfile.dateOfBirth, normalizedProfile.experience]
  );

  const strengths = Array.isArray(normalizedProfile.strengths)
    ? normalizedProfile.strengths
    : [];
  const platformProficiency = Array.isArray(
    normalizedProfile.platformProficiency
  )
    ? normalizedProfile.platformProficiency
    : [];

  const handleTabChange = (_, value) => {
    setActiveTab(value);
  };

  const renderVideoPanel = () => {
    if (videos.length === 0) {
      return (
        <Box
          sx={{
            borderRadius: "20px",
            border: "1px dashed rgba(74, 116, 218, 0.35)",
            backgroundColor: "rgba(255, 255, 255, 0.92)",
            py: 6,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.5,
          }}
        >
          <PlayCircleOutlineRoundedIcon
            sx={{ color: "#4a74da", fontSize: 40, opacity: 0.7 }}
          />
          <Typography
            variant="subtitle1"
            sx={{ color: textPrimary, fontWeight: 600 }}
          >
            Chưa có video livestream
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: textSecondary, textAlign: "center", maxWidth: 360 }}
          >
            Hiện tại KOL chưa cập nhật các buổi livestream nổi bật. Vui lòng
            quay lại sau.
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={2.5}>
        {videos.map((video) => (
          <Grid item xs={12} sm={6} key={video.id ?? video.url}>
            <Stack
              spacing={1.75}
              sx={{
                borderRadius: "20px",
                overflow: "hidden",
                background: cardGradient,
                border: "1px solid rgba(74, 116, 218, 0.22)",
                boxShadow: "0 12px 32px rgba(74, 116, 218, 0.16)",
                height: "100%",
              }}
            >
              <Box
                component="div"
                sx={{
                  position: "relative",
                  overflow: "hidden",
                  backgroundColor: "#020817",
                }}
              >
                <Box
                  component="video"
                  controls
                  src={video.url}
                  poster={video.thumbnail ?? undefined}
                  sx={{
                    width: "100%",
                    height: "100%",
                    aspectRatio: "16/9",
                    display: "block",
                    objectFit: "cover",
                  }}
                />
                {video.externalUrl && (
                  <IconButton
                    aria-label="Mở video trên tab mới"
                    onClick={() => window.open(video.externalUrl, "_blank")}
                    sx={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      bgcolor: "rgba(2, 8, 23, 0.35)",
                      color: "#ffffff",
                      "&:hover": { bgcolor: "rgba(2, 8, 23, 0.55)" },
                    }}
                  >
                    <PlayCircleOutlineRoundedIcon />
                  </IconButton>
                )}
              </Box>

              {/* <Stack spacing={0.5} sx={{ px: 2.25, pb: 2.25 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ color: textPrimary, fontWeight: 600 }}
                >
                  {video.title ?? "Video livestream"}
                </Typography>
                {video.description && (
                  <Typography
                    variant="body2"
                    sx={{ color: textSecondary, lineHeight: 1.6 }}
                  >
                    {video.description}
                  </Typography>
                )}
              </Stack> */}
            </Stack>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderIntroductionPanel = () => (
    <Stack spacing={3.5}>
      <Grid container spacing={2.5}>
        {infoItems.map(({ label, value, icon: Icon }) => (
          <Grid item xs={12} sm={6} key={label}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "14px",
                  background:
                    "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(147, 206, 246, 0.35) 55%, rgba(255, 161, 218, 0.25) 100%)",
                  border: "1px solid rgba(74, 116, 218, 0.22)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon sx={{ color: "#4a74da", fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: textSecondary }}>
                  {label}
                </Typography>
                <Typography sx={{ color: textPrimary, fontWeight: 500 }}>
                  {value}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        ))}
      </Grid>

      <Stack spacing={2.5}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <BoltRoundedIcon sx={{ color: "#582baf", mt: 0.5 }} />
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ color: textPrimary, fontWeight: 600 }}
              >
                Điểm mạnh
              </Typography>
              <Stack
                component="ul"
                spacing={1}
                sx={{ m: 0, pl: 0, listStyle: "none" }}
              >
                {strengths.length > 0 ? (
                  strengths.map((strength) => (
                    <Stack
                      component="li"
                      key={strength}
                      direction="row"
                      spacing={1.2}
                      alignItems="center"
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background:
                            "linear-gradient(135deg, #8de2ed, #4a74da)",
                        }}
                      />
                      <Typography
                        sx={{ color: textSecondary, lineHeight: 1.6 }}
                      >
                        {strength}
                      </Typography>
                    </Stack>
                  ))
                ) : (
                  <Typography sx={{ color: textSecondary }}>
                    Đang cập nhật
                  </Typography>
                )}
              </Stack>
            </Box>
          </Stack>
        </Stack>

        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <TrendingUpRoundedIcon sx={{ color: "#ffa1da", mt: 0.5 }} />
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="subtitle1"
                sx={{ color: textPrimary, fontWeight: 600 }}
              >
                Nền tảng thành thạo
              </Typography>
              <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                {platformProficiency.length > 0 ? (
                  platformProficiency.map((item) => (
                    <Grid item xs={12} sm={6} key={item.platform}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderRadius: "16px",
                          px: 1.75,
                          py: 1.2,
                          background: cardGradient,
                          border: "1px solid rgba(74, 116, 218, 0.18)",
                        }}
                      >
                        <Typography sx={{ color: textSecondary }}>
                          {item.platform}
                        </Typography>
                      </Box>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Typography sx={{ color: textSecondary }}>
                      Đang cập nhật
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );

  const renderFeedbackPanel = () => (
    <ReviewsSection
      reviews={reviews}
      overallRating={overallRating}
      ratingDistribution={ratingDistribution}
      reviewCount={reviewCount}
      variant="embedded"
    />
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
    >
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "24px",
          backgroundColor: "#ffffff",
          border: "1px solid rgba(74, 116, 218, 0.18)",
          boxShadow:
            "0 6px 12px rgba(141, 226, 237, 0.36), \
     0 12px 24px rgba(147, 206, 246, 0.32), \
     0 18px 32px rgba(74, 116, 218, 0.38), \
     0 2px 6px rgba(255, 255, 255, 0.18)",
          p: { xs: 3, md: 3.75 },
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            background: overlayGradient,
            opacity: 0.9,
            pointerEvents: "none",
          }}
        />
        <Stack spacing={3.5} sx={{ position: "relative", zIndex: 1 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              alignSelf: "flex-start",
              minHeight: "auto",
              borderRadius: "14px",
              backgroundColor: "rgba(255, 255, 255, 0.65)",
              border: "1px solid rgba(74, 116, 218, 0.26)",
              "& .MuiTabs-flexContainer": {
                gap: { xs: 0.5, sm: 1 },
              },
              "& .MuiTabs-indicator": {
                background:
                  "linear-gradient(135deg, #8de2ed 0%, #4a74da 55%, #582baf 100%)",
                height: 3,
                borderRadius: "999px",
              },
            }}
          >
            <Tab
              value="videos"
              label="Video livestream"
              disableRipple
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: 13, sm: 14 },
                color: textSecondary,
                minHeight: "auto",
                py: 1.25,
                px: { xs: 1.5, sm: 2.5 },
                "&.Mui-selected": {
                  color: textPrimary,
                },
              }}
            />
            <Tab
              value="introduction"
              label="Giới thiệu"
              disableRipple
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: 13, sm: 14 },
                color: textSecondary,
                minHeight: "auto",
                py: 1.25,
                px: { xs: 1.5, sm: 2.5 },
                "&.Mui-selected": {
                  color: textPrimary,
                },
              }}
            />
            <Tab
              value="feedback"
              label="Feedback"
              disableRipple
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: 13, sm: 14 },
                color: textSecondary,
                minHeight: "auto",
                py: 1.25,
                px: { xs: 1.5, sm: 2.5 },
                "&.Mui-selected": {
                  color: textPrimary,
                },
              }}
            />
          </Tabs>

          {activeTab === "videos" && renderVideoPanel()}
          {activeTab === "introduction" && renderIntroductionPanel()}
          {activeTab === "feedback" && renderFeedbackPanel()}
        </Stack>
      </Box>
    </motion.div>
  );
};

export default Introduction;
