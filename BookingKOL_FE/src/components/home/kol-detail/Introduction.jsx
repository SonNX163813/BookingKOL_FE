import React from "react";
import { motion } from "framer-motion";
import { Box, Typography, Stack, Grid, Chip } from "@mui/material";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";

const textPrimary = "#2f3c8c";
const textSecondary = "rgba(47, 60, 140, 0.72)";

const Introduction = ({ profile }) => {
  const infoItems = [
    {
      label: "Ngày sinh",
      value: profile.dateOfBirth,
      icon: EventRoundedIcon,
    },
    {
      label: "Kinh nghiệm",
      value: profile.experience,
      icon: WorkspacePremiumRoundedIcon,
    },
  ];

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
            background:
              "radial-gradient(55% 55% at 90% 0%, rgba(147, 206, 246, 0.35) 0%, rgba(147, 206, 246, 0) 70%), radial-gradient(60% 60% at 0% 100%, rgba(255, 161, 218, 0.28) 0%, rgba(88, 43, 175, 0) 70%)",
            opacity: 0.9,
            pointerEvents: "none",
          }}
        />
        <Stack spacing={3.5} sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            variant="h5"
            sx={{
              color: textPrimary,
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            Giới thiệu
          </Typography>

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
                    {profile.strengths.map((strength) => (
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
                    ))}
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
                    {profile.platformProficiency.map((item) => (
                      <Grid item xs={12} sm={6} key={item.platform}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderRadius: "16px",
                            px: 1.75,
                            py: 1.2,
                            background:
                              "linear-gradient(135deg, rgba(255, 255, 255, 0.96) 0%, rgba(147, 206, 246, 0.25) 55%, rgba(255, 161, 218, 0.22) 100%)",
                            border: "1px solid rgba(74, 116, 218, 0.18)",
                          }}
                        >
                          <Typography sx={{ color: textSecondary }}>
                            {item.platform}
                          </Typography>
                          {/* <Chip
                            label={item.level}
                            size="small"
                            sx={{
                              background: "rgba(147, 206, 246, 0.18)",
                              color: textPrimary,
                              borderRadius: "999px",
                              border: "1px solid rgba(74, 116, 218, 0.26)",
                              fontWeight: 600,
                            }}
                          /> */}
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Stack>
            </Stack>
          </Stack>
        </Stack>
      </Box>
    </motion.div>
  );
};

export default Introduction;
