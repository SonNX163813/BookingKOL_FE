import React from "react";
import { motion } from "framer-motion";
import { Box, Typography, Stack, Grid, Chip } from "@mui/material";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";

const textPrimary = "#E6F4EF";
const textSecondary = "#AABBB5";

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
          borderRadius: "24px",
          background:
            "radial-gradient(60% 60% at 20% 20%, rgba(22, 249, 138, 0.18) 0%, rgba(5, 34, 11, 0) 70%), \
   radial-gradient(50% 50% at 80% 10%, rgba(19, 67, 56, 0.22) 0%, rgba(5, 34, 11, 0) 65%), \
   linear-gradient(160deg, rgba(5, 34, 11, 1) 0%, rgba(19, 67, 56, 0.92) 55%, rgba(22, 249, 138, 0.18) 100%)",

          border: "1px solid rgba(0, 227, 159, 0.14)",
          boxShadow:
            "0 28px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
          p: { xs: 3, md: 3.75 },
        }}
      >
        <Stack spacing={3.5}>
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
                      background: "rgba(0, 227, 159, 0.16)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon sx={{ color: "#00E39F", fontSize: 22 }} />
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
                <BoltRoundedIcon sx={{ color: "#00E39F", mt: 0.5 }} />
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
                              "linear-gradient(135deg, #00C776, #00E39F)",
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
                <TrendingUpRoundedIcon sx={{ color: "#00E39F", mt: 0.5 }} />
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
                            background: "rgba(18, 26, 25, 0.86)",
                            border: "1px solid rgba(0, 227, 159, 0.16)",
                          }}
                        >
                          <Typography sx={{ color: textSecondary }}>
                            {item.platform}
                          </Typography>
                          <Chip
                            label={item.level}
                            size="small"
                            sx={{
                              background: "rgba(0, 227, 159, 0.14)",
                              color: textPrimary,
                              borderRadius: "999px",
                              border: "1px solid rgba(0, 227, 159, 0.28)",
                              fontWeight: 600,
                            }}
                          />
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
