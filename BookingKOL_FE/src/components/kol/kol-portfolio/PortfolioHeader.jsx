// src/components/kol/kol-portfolio/PortfolioHeaderNew.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  Dialog,
  DialogContent,
} from "@mui/material";
import FemaleRoundedIcon from "@mui/icons-material/FemaleRounded";
import MaleRoundedIcon from "@mui/icons-material/MaleRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CollectionsRoundedIcon from "@mui/icons-material/CollectionsRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import PricingPanel from "../../home/kol-detail/PricingPanel";

const statsConfig = [
  { key: "followers", label: "Người theo dõi", icon: PeopleAltRoundedIcon },
  { key: "fans", label: "Lượt xem TikTok", icon: FavoriteRoundedIcon },
  { key: "orders", label: "Đơn hàng", icon: ShoppingBagRoundedIcon },
  { key: "rating", label: "Đánh giá", icon: StarRoundedIcon },
];

const textPrimary = "#2f3c8c";
const textSecondary = "rgba(47, 60, 140, 0.72)";
const gradientBorder =
  "linear-gradient(135deg, rgba(141, 226, 237, 0.7), rgba(147, 206, 246, 0.52), rgba(88, 43, 175, 0.38))";
const fontFamily = "'Montserrat', sans-serif";

const MotionBox = motion(Box);
const MotionStack = motion(Stack);
const fadeUpProps = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: "easeOut", delay },
});

export default function PortfolioHeaderNew({
  kol = {},
  pricing,
  platforms,
  onEditProfile,
  onManageMedia,
}) {
  const isMale = kol.gender?.toLowerCase() === "male";
  const genderLabel = kol.gender ? (isMale ? "Nam" : "Nữ") : null;
  const GenderIcon = isMale ? MaleRoundedIcon : FemaleRoundedIcon;
  const shortBio =
    kol.shortDescription ||
    kol.tagline ||
    kol.bio ||
    kol.description ||
    "Sáng tạo nội dung đa nền tảng, storytelling tốt, chuyển đổi cao.";

  const achievements = Array.isArray(kol.achievements) ? kol.achievements : [];
  const stats = kol.stats ?? {};
  const kolName = kol.name || "KOL nổi bật";

  const thumbnails = useMemo(() => {
    if (!Array.isArray(kol.thumbnails)) return [];
    return kol.thumbnails
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string")
          return {
            id: item,
            type: "IMAGE",
            sourceUrl: item,
            displayUrl: item,
            name: "",
            isCover: false,
          };
        const type =
          typeof item.type === "string" && item.type.toUpperCase() === "VIDEO"
            ? "VIDEO"
            : "IMAGE";
        const sourceUrl = item.url ?? item.sourceUrl ?? "";
        if (!sourceUrl) return null;
        const displayUrl = item.previewUrl ?? item.displayUrl ?? sourceUrl;
        return {
          id: item.id ?? sourceUrl,
          type,
          sourceUrl,
          displayUrl,
          name: item.name ?? "",
          isCover: Boolean(item.isCover),
        };
      })
      .filter(Boolean);
  }, [kol.thumbnails]);

  const [activeAvatar, setActiveAvatar] = useState(kol.avatar);
  const [videoModal, setVideoModal] = useState(null);
  useEffect(() => setActiveAvatar(kol.avatar), [kol.avatar]);

  const handleThumb = useCallback((thumb) => {
    if (thumb?.type === "VIDEO") setVideoModal(thumb);
    else setActiveAvatar(thumb?.sourceUrl);
  }, []);

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
          backgroundColor: "#ffffff",
          border: "1px solid rgba(74, 116, 218, 0.18)",
          boxShadow:
            "0 6px 12px rgba(141, 226, 237, 0.36), 0 12px 24px rgba(147, 206, 246, 0.32), 0 18px 32px rgba(74, 116, 218, 0.38), 0 2px 6px rgba(255, 255, 255, 0.18)",
          fontFamily,
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
          {/* left: avatar + thumbs */}
          <Box
            sx={{
              flex: "0 0 auto",
              width: { xs: "100%", sm: 320, md: 280, lg: 320 },
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
                  border: "1px solid rgba(74, 116, 218, 0.16)",
                  boxShadow:
                    "0 24px 48px rgba(74, 116, 218, 0.16), 0 0 0 1px rgba(147, 206, 246, 0.38)",
                  background:
                    "linear-gradient(145deg, rgba(255, 255, 255, 0.98) 0%, rgba(147, 206, 246, 0.32) 55%, rgba(255, 161, 218, 0.28) 100%)",
                }}
              >
                <Box
                  component="img"
                  src={activeAvatar}
                  alt={`Chân dung ${kolName}`}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center top",
                    display: "block",
                  }}
                />
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
                      background: "rgba(147, 206, 246, 0.35)",
                      borderRadius: 999,
                    },
                  }}
                  {...fadeUpProps(0.14)}
                >
                  {thumbnails.map((t, i) => (
                    <Box
                      key={t.id || `${t.sourceUrl}-${i}`}
                      onClick={() => handleThumb(t)}
                      sx={{
                        width: 64,
                        height: 64,
                        flex: "0 0 auto",
                        borderRadius: "18px",
                        overflow: "hidden",
                        cursor: "pointer",
                        border:
                          t.type !== "VIDEO" && activeAvatar === t.sourceUrl
                            ? "2px solid rgba(74, 116, 218, 0.55)"
                            : "1px solid rgba(74, 116, 218, 0.2)",
                        boxShadow:
                          t.type !== "VIDEO" && activeAvatar === t.sourceUrl
                            ? "0 12px 26px rgba(74, 116, 218, 0.28)"
                            : "0 10px 20px rgba(74, 116, 218, 0.12)",
                        transition:
                          "transform 0.2s ease, box-shadow 0.2s ease, border 0.2s ease",
                        backgroundColor: "rgba(147, 206, 246, 0.12)",
                        "&:hover": { transform: "translateY(-2px)" },
                      }}
                    >
                      {t.type === "VIDEO" ? (
                        <Box
                          sx={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            background: "rgba(0,0,0,.35)",
                          }}
                        >
                          {t.displayUrl ? (
                            <Box
                              component="img"
                              src={t.displayUrl}
                              alt="preview"
                              sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                filter: "brightness(.75)",
                              }}
                            />
                          ) : null}
                          <Box
                            sx={{
                              position: "absolute",
                              inset: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <PlayArrowRoundedIcon sx={{ color: "#fff" }} />
                          </Box>
                        </Box>
                      ) : (
                        <Box
                          component="img"
                          src={t.displayUrl}
                          alt="thumb"
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      )}
                    </Box>
                  ))}
                </MotionStack>
              )}
            </MotionStack>
          </Box>

          {/* right: text, chips, edit buttons, pricing */}
          <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
            <Stack spacing={{ xs: 3, md: 4 }}>
              <MotionStack spacing={1.5} {...fadeUpProps(0.18)}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", lg: "row" },
                    gap: { xs: 2, lg: 4 },
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        component="h1"
                        sx={{
                          fontSize: { xs: "2rem", md: "2.5rem", lg: "3rem" },
                          fontWeight: 700,
                          color: textPrimary,
                        }}
                      >
                        {kolName}
                      </Typography>

                      <IconButton
                        size="small"
                        onClick={onEditProfile}
                        sx={{
                          border: "1px solid rgba(74,116,218,.25)",
                          borderRadius: "10px",
                        }}
                        aria-label="Chỉnh sửa hồ sơ"
                      >
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        size="small"
                        onClick={onManageMedia}
                        sx={{
                          border: "1px solid rgba(74,116,218,.25)",
                          borderRadius: "10px",
                        }}
                        aria-label="Quản lý media"
                      >
                        <CollectionsRoundedIcon fontSize="small" />
                      </IconButton>
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                      {genderLabel && (
                        <Chip
                          icon={<GenderIcon sx={{ fontSize: 18 }} />}
                          label={genderLabel}
                          size="small"
                          sx={{
                            background: "rgba(147, 206, 246, 0.18)",
                            color: textPrimary,
                            borderRadius: "999px",
                            fontWeight: 600,
                            border: "1px solid rgba(74, 116, 218, 0.24)",
                          }}
                        />
                      )}
                    </Stack>

                    <Typography
                      sx={{
                        color: textSecondary,
                        lineHeight: 1.65,
                        fontSize: { xs: "1rem", md: "1.1rem" },
                        mt: 1.5,
                      }}
                    >
                      {shortBio}
                    </Typography>
                  </Box>

                  {/* Bảng giá: chỉ hiển thị */}
                  <MotionBox
                    {...fadeUpProps(0.24)}
                    sx={{ flex: { lg: "0 0 auto" }, minWidth: { lg: "280px" } }}
                  >
                    <PricingPanel pricing={pricing} platforms={platforms} />
                  </MotionBox>
                </Box>
              </MotionStack>

              <MotionBox
                {...fadeUpProps(0.28)}
                sx={{
                  display: "flex",
                  gap: { xs: 2, sm: 2.5, md: 3 },
                  flexWrap: "wrap",
                }}
              >
                {statsConfig.map(({ key, label, icon: IconC }, idx) => (
                  <MotionBox
                    key={key}
                    {...fadeUpProps(0.3 + idx * 0.05)}
                    sx={{
                      flex: {
                        xs: "1 1 calc(50% - 8px)",
                        sm: "1 1 calc(25% - 18px)",
                      },
                      minWidth: { xs: 140, sm: 120, md: 140 },
                      borderRadius: "20px",
                      px: 2.5,
                      py: 2,
                      bgcolor: "rgba(147, 206, 246, 0.12)",
                      border: "1px solid rgba(74, 116, 218, 0.18)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                      alignItems: "center",
                      textAlign: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "12px",
                        background: gradientBorder,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#4a74da",
                      }}
                    >
                      <IconC sx={{ fontSize: 24 }} />
                    </Box>
                    <Typography variant="body2" sx={{ color: textSecondary }}>
                      {label}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ color: textPrimary, fontWeight: 700 }}
                    >
                      {stats[key] ?? "--"}
                    </Typography>
                  </MotionBox>
                ))}
              </MotionBox>
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* video modal */}
      <Dialog
        open={Boolean(videoModal)}
        onClose={() => setVideoModal(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { backgroundColor: "transparent", boxShadow: "none" },
        }}
      >
        <DialogContent
          sx={{
            p: 0,
            position: "relative",
            backgroundColor: "#000",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <IconButton
            onClick={() => setVideoModal(null)}
            sx={{ position: "absolute", top: 12, right: 12, color: "#fff" }}
          >
            <CloseRoundedIcon />
          </IconButton>
          {videoModal && (
            <Box
              component="video"
              src={videoModal.sourceUrl}
              controls
              autoPlay
              sx={{
                width: "100%",
                height: "auto",
                maxHeight: "80vh",
                display: "block",
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
