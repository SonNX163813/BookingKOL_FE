import React from "react";
import { motion } from "framer-motion";
import { Box, Typography, Button, Grid, Stack, Chip } from "@mui/material";
import FemaleRoundedIcon from "@mui/icons-material/FemaleRounded";
import MaleRoundedIcon from "@mui/icons-material/MaleRounded";
import CircleIcon from "@mui/icons-material/Circle";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import EmojiEventsRoundedIcon from "@mui/icons-material/EmojiEventsRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import PricingPanel from "./PricingPanel";

const statsConfig = [
  { key: "followers", label: "Người theo dõi", icon: PeopleAltRoundedIcon },
  { key: "fans", label: "Người hâm mộ", icon: FavoriteRoundedIcon },
  { key: "orders", label: "Đơn hàng", icon: ShoppingBagRoundedIcon },
  { key: "rating", label: "Đánh giá", icon: StarRoundedIcon },
];

const textPrimary = "#E6F4EF";
const textSecondary = "#AABBB5";
const gradientBorder =
  "linear-gradient(135deg, rgba(0,199,118,0.4), rgba(0,227,159,0.2))";
const fontFamily = "'Montserrat', sans-serif";

const MotionBox = motion(Box);
const MotionStack = motion(Stack);
const MotionGrid = motion(Grid);

const fadeUpProps = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: "easeOut", delay },
});

const ProfileHeader = ({ kol = {}, pricing, platforms }) => {
  const isMale = kol.gender?.toLowerCase() === "male";
  const genderLabel = kol.gender ? (isMale ? "Nam" : "Nữ") : null;
  const GenderIcon = isMale ? MaleRoundedIcon : FemaleRoundedIcon;

  const shortBio =
    kol.shortDescription ||
    kol.tagline ||
    kol.bio ||
    kol.description ||
    "Creator về thời trang & lifestyle, livestream tương tác cao, kể chuyện thương hiệu thuyết phục, chuyển đổi tốt trên nhiều nền tảng.";

  const thumbnails = Array.isArray(kol.thumbnails) ? kol.thumbnails : [];
  const achievements = Array.isArray(kol.achievements) ? kol.achievements : [];
  const stats = kol.stats ?? {};
  const kolName = kol.name || "KOL nổi bật";
  const kolIdLabel = kol.id ? `ID: ${kol.id}` : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "24px",
          px: { xs: 2.5, md: 3.5 },
          py: { xs: 3, md: 4 },
          background:
            "radial-gradient(60% 60% at 20% 20%, rgba(22, 249, 138, 0.18) 0%, rgba(5, 34, 11, 0) 70%), \
   radial-gradient(50% 50% at 80% 10%, rgba(19, 67, 56, 0.22) 0%, rgba(5, 34, 11, 0) 65%), \
   linear-gradient(160deg, rgba(5, 34, 11, 1) 0%, rgba(19, 67, 56, 0.92) 55%, rgba(22, 249, 138, 0.18) 100%)",
          border: "1px solid rgba(0, 227, 159, 0.12)",
          boxShadow:
            "0 30px 80px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
          fontFamily,
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(58% 60% at 15% 22%, rgba(0,227,159,0.18) 0%, rgba(11,15,14,0) 70%)",
            opacity: 0.75,
          }}
        />

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 3, md: 4, lg: 5 },
            alignItems: { xs: "center", md: "flex-start" },
          }}
        >
          {/* Cột 1: Ảnh đại diện và ảnh nhỏ */}
          <Box
            sx={{
              flex: "0 0 auto",
              width: { xs: "100%", sm: "320px", md: "280px", lg: "320px" },
              maxWidth: { xs: "320px", md: "none" },
            }}
          >
            <MotionStack
              spacing={2.5}
              alignItems={{ xs: "center", md: "flex-start" }}
              {...fadeUpProps(0.05)}
            >
              <MotionBox
                {...fadeUpProps(0.08)}
                sx={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "4 / 5",
                  borderRadius: "22px",
                  overflow: "hidden",
                  border: "1px solid rgba(0, 227, 159, 0.18)",
                  boxShadow:
                    "0 24px 40px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255,255,255,0.05)",
                  background: "rgba(17, 23, 23, 0.92)",
                }}
              >
                <Box
                  component="img"
                  src={kol.avatar}
                  alt={`Chân dung ${kolName}`}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center top",
                    display: "block",
                  }}
                />
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)",
                  }}
                />
                {kol.isOnline && (
                  <Chip
                    icon={<CircleIcon sx={{ fontSize: 10 }} />}
                    label="Trực tuyến"
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      background: "rgba(0, 227, 159, 0.18)",
                      color: textPrimary,
                      fontWeight: 600,
                      borderRadius: "999px",
                      border: "1px solid rgba(0, 227, 159, 0.35)",
                      ".MuiChip-icon": {
                        color: "#00E39F",
                        marginLeft: 0.5,
                      },
                    }}
                    aria-label="KOL đang trực tuyến"
                  />
                )}
              </MotionBox>

              {thumbnails.length > 0 && (
                <MotionStack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    width: "100%",
                    overflowX: "auto",
                    px: 0.5,
                    "&::-webkit-scrollbar": { height: 6 },
                    "&::-webkit-scrollbar-thumb": {
                      background: "rgba(0, 227, 159, 0.3)",
                      borderRadius: 999,
                    },
                  }}
                  aria-label="Thư viện ảnh nhỏ"
                  {...fadeUpProps(0.14)}
                >
                  {thumbnails.map((thumb, index) => (
                    <Box
                      key={`${thumb}-${index}`}
                      component="img"
                      src={thumb}
                      alt={`Ảnh nhỏ ${index + 1} của ${kolName}`}
                      sx={{
                        width: 64,
                        height: 64,
                        flex: "0 0 auto",
                        borderRadius: "18px",
                        objectFit: "cover",
                        objectPosition: "center top",
                        border: "1px solid rgba(0, 227, 159, 0.28)",
                        boxShadow: "0 10px 20px rgba(0, 0, 0, 0.35)",
                      }}
                    />
                  ))}
                </MotionStack>
              )}
            </MotionStack>
          </Box>

          {/* Cột 2: Thông tin */}
          <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
            <Stack spacing={{ xs: 3, md: 4 }}>
              {/* Header: tên, mô tả, giá */}
              <MotionStack spacing={1.5} {...fadeUpProps(0.18)}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", lg: "row" },
                    gap: { xs: 2, lg: 4 },
                    alignItems: { xs: "stretch", lg: "flex-start" },
                  }}
                >
                  <Box sx={{ flex: 1, gap: { xs: 2, lg: 4 } }}>
                    {/* Tên & nhãn */}
                    <MotionStack
                      spacing={1.5}
                      alignItems={{ xs: "center", sm: "flex-start" }}
                      textAlign={{ xs: "center", sm: "left" }}
                      {...fadeUpProps(0.2)}
                    >
                      <Typography
                        component="h1"
                        sx={{
                          fontSize: { xs: "2rem", md: "2.5rem", lg: "3rem" },
                          fontWeight: 700,
                          color: textPrimary,
                          letterSpacing: "0.01em",
                          lineHeight: 1.2,
                          mb: 0,
                        }}
                      >
                        {kolName}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        justifyContent={{ xs: "center", sm: "flex-start" }}
                      >
                        {genderLabel && (
                          <Chip
                            icon={<GenderIcon sx={{ fontSize: 18 }} />}
                            label={genderLabel}
                            size="small"
                            sx={{
                              background: "rgba(0, 227, 159, 0.16)",
                              color: textPrimary,
                              borderRadius: "999px",
                              fontWeight: 600,
                              border: "1px solid rgba(0, 227, 159, 0.32)",
                            }}
                          />
                        )}
                        {kolIdLabel && (
                          <Chip
                            label={kolIdLabel}
                            size="small"
                            sx={{
                              background: "rgba(17, 23, 23, 0.82)",
                              color: textSecondary,
                              borderRadius: "999px",
                              border: "1px solid rgba(0, 227, 159, 0.18)",
                            }}
                          />
                        )}
                      </Stack>
                    </MotionStack>

                    {/* Mô tả */}
                    <Typography
                      sx={{
                        color: textSecondary,
                        lineHeight: 1.65,
                        fontSize: { xs: "1rem", md: "1.1rem" },
                        textAlign: { xs: "center", sm: "left" },
                        flex: { lg: 1 },
                        minWidth: 0,
                        mt: 1.5,
                      }}
                    >
                      {shortBio}
                    </Typography>
                  </Box>

                  {/* Bảng giá */}
                  <MotionBox
                    {...fadeUpProps(0.24)}
                    sx={{
                      flex: { lg: "0 0 auto" },
                      width: { xs: "100%", lg: "auto" },
                      minWidth: { lg: "280px" },
                    }}
                  >
                    <PricingPanel pricing={pricing} platforms={platforms} />
                  </MotionBox>
                </Box>
              </MotionStack>

              {/* Thống kê */}
              <MotionBox
                {...fadeUpProps(0.28)}
                sx={{
                  display: "flex",
                  gap: { xs: 2, sm: 2.5, md: 3 },
                  flexWrap: "wrap",
                  width: "100%",
                }}
              >
                {statsConfig.map((config, index) => {
                  const { key, label, icon: IconComponent } = config;

                  return (
                    <MotionBox
                      key={key}
                      {...fadeUpProps(0.3 + index * 0.05)}
                      sx={{
                        flex: {
                          xs: "1 1 calc(50% - 8px)",
                          sm: "1 1 calc(25% - 18px)",
                        },
                        minWidth: {
                          xs: "140px",
                          sm: "120px",
                          md: "140px",
                        },
                        borderRadius: "20px",
                        px: 2.5,
                        py: 2,
                        bgcolor: "rgba(18, 26, 25, 0.82)",
                        border: "1px solid rgba(0, 227, 159, 0.16)",
                        backdropFilter: "blur(12px)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.5,
                        alignItems: "center",
                        textAlign: "center",
                      }}
                    >
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "12px",
                          background: gradientBorder,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#00E39F",
                        }}
                      >
                        <IconComponent sx={{ fontSize: 20 }} />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: textSecondary,
                          letterSpacing: "0.04em",
                          fontSize: "0.85rem",
                        }}
                      >
                        {label}
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          color: textPrimary,
                          fontWeight: 700,
                          fontSize: { xs: "1.1rem", md: "1.25rem" },
                        }}
                      >
                        {stats[key] ?? "--"}
                      </Typography>
                    </MotionBox>
                  );
                })}
              </MotionBox>

              {/* Nút hành động */}
              <MotionStack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems="stretch"
                {...fadeUpProps(0.42)}
              >
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    flex: 1,
                    borderRadius: "18px",
                    border: "1.5px solid rgba(0, 227, 159, 0.4)",
                    color: textPrimary,
                    textTransform: "none",
                    px: 4,
                    py: 2,
                    fontWeight: 600,
                    gap: 1,
                    fontSize: "1.1rem",
                    "&:hover": {
                      borderColor: "rgba(0, 227, 159, 0.6)",
                      background: "rgba(0, 227, 159, 0.08)",
                    },
                    "&:focus-visible": {
                      outline: "2px solid rgba(0, 227, 159, 0.6)",
                      outlineOffset: 3,
                    },
                  }}
                  aria-label="Tư vấn thêm"
                >
                  <ChatBubbleRoundedIcon sx={{ fontSize: 24 }} />
                  Tư vấn thêm
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    flex: 1,
                    background:
                      "linear-gradient(135deg, #00C776 0%, #00E39F 100%)",
                    color: "#031412",
                    fontWeight: 700,
                    textTransform: "none",
                    px: 4,
                    py: 2,
                    borderRadius: "18px",
                    boxShadow: "0 18px 40px rgba(0, 227, 159, 0.25)",
                    gap: 1,
                    fontSize: "1.1rem",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #00D584 0%, #00F4B0 100%)",
                      boxShadow: "0 20px 46px rgba(0, 227, 159, 0.32)",
                    },
                    "&:focus-visible": {
                      outline: "2px solid rgba(0, 227, 159, 0.6)",
                      outlineOffset: 3,
                    },
                  }}
                  aria-label="Thuê KOL này"
                >
                  <PlayArrowRoundedIcon sx={{ fontSize: 24 }} />
                  Thuê ngay
                </Button>
              </MotionStack>

              {/* Thành tựu */}
              {achievements.length > 0 && (
                <MotionBox
                  {...fadeUpProps(0.5)}
                  sx={{
                    borderRadius: "20px",
                    background: "rgba(18, 26, 25, 0.84)",
                    border: "1px solid rgba(0, 227, 159, 0.16)",
                    px: { xs: 2.5, md: 3 },
                    py: { xs: 2, md: 2.5 },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1.25}
                    alignItems="center"
                    mb={1.5}
                  >
                    <EmojiEventsRoundedIcon sx={{ color: "#FFD166" }} />
                    <Typography
                      variant="h6"
                      sx={{ color: textPrimary, fontWeight: 600 }}
                    >
                      Thành tựu
                    </Typography>
                  </Stack>
                  <Stack spacing={1.2}>
                    {achievements.map((item) => (
                      <Stack
                        key={item}
                        direction="row"
                        spacing={1.2}
                        alignItems="center"
                      >
                        <CheckCircleRoundedIcon
                          sx={{
                            color: "#00E39F",
                            fontSize: 18,
                            opacity: 0.9,
                          }}
                        />
                        <Typography
                          sx={{ color: textSecondary, lineHeight: 1.6 }}
                        >
                          {item}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </MotionBox>
              )}
            </Stack>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
};

export default ProfileHeader;
