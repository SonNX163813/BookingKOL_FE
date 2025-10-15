import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Typography,
  Grid,
  Stack,
  Chip,
  Dialog,
  DialogContent,
  IconButton,
} from "@mui/material";
import FemaleRoundedIcon from "@mui/icons-material/FemaleRounded";
import MaleRoundedIcon from "@mui/icons-material/MaleRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import ShoppingBagRoundedIcon from "@mui/icons-material/ShoppingBagRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PricingPanel from "./PricingPanel";

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

/**
 * showActions = false -> Ẩn 2 nút hành động (đã bỏ hoàn toàn trong phiên bản portfolio)
 * pricingLocked = true -> khóa phần giá (Panel chỉ hiển thị)
 */
export default function ProfileHeader({
  kol = {},
  pricing,
  // showActions mặc định false cho phiên bản portfolio
  showActions = false,
  pricingLocked = true,
}) {
  const isMale = kol.gender?.toLowerCase() === "male";
  const genderLabel = kol.gender ? (isMale ? "Nam" : "Nữ") : null;
  const GenderIcon = isMale ? MaleRoundedIcon : FemaleRoundedIcon;

  const shortBio =
    kol.shortDescription ||
    kol.tagline ||
    kol.bio ||
    kol.description ||
    "Sáng tạo nội dung về thời trang & lifestyle, livestream tương tác cao, kể chuyện thương hiệu thuyết phục, chuyển đổi tốt trên nhiều nền tảng.";

  const achievements = Array.isArray(kol.achievements) ? kol.achievements : [];
  const stats = kol.stats ?? {};
  const kolName = kol.name || "KOL nổi bật";

  const thumbnails = useMemo(() => {
    if (!Array.isArray(kol.thumbnails)) return [];
    return kol.thumbnails
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string") {
          return {
            id: item,
            type: "IMAGE",
            sourceUrl: item,
            displayUrl: item,
            name: "",
            isCover: false,
          };
        }
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

  const [activeAvatar, setActiveAvatar] = useState(() => kol.avatar);
  const [videoModal, setVideoModal] = useState(null);

  useEffect(() => {
    setActiveAvatar(kol.avatar);
  }, [kol.avatar]);

  const handleThumbnailSelect = useCallback((thumb) => {
    if (!thumb) return;
    if (thumb.type === "VIDEO") {
      setVideoModal(thumb);
      return;
    }
    setActiveAvatar(thumb.sourceUrl);
  }, []);

  const handleThumbnailKeyDown = useCallback(
    (event, thumb) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleThumbnailSelect(thumb);
      }
    },
    [handleThumbnailSelect]
  );

  const handleCloseVideo = useCallback(() => setVideoModal(null), []);

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
          {/* Cột trái: Avatar + thumbnails */}
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
                <Box
                  aria-hidden
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0) 45%, rgba(74, 116, 218, 0.28) 100%)",
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
                  aria-label="Thư viện ảnh thu nhỏ"
                  {...fadeUpProps(0.14)}
                >
                  {thumbnails.map((thumb, index) => {
                    const isVideo = thumb.type === "VIDEO";
                    const isActive =
                      !isVideo && activeAvatar === thumb.sourceUrl;
                    const label = isVideo
                      ? `Mở video ${thumb.name || index + 1}`
                      : `Chọn ảnh ${index + 1}`;

                    return (
                      <Box
                        key={thumb.id ?? `${thumb.sourceUrl}-${index}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleThumbnailSelect(thumb)}
                        onKeyDown={(event) =>
                          handleThumbnailKeyDown(event, thumb)
                        }
                        sx={{
                          position: "relative",
                          width: 64,
                          height: 64,
                          flex: "0 0 auto",
                          borderRadius: "18px",
                          overflow: "hidden",
                          cursor: "pointer",
                          border: isActive
                            ? "2px solid rgba(74, 116, 218, 0.55)"
                            : "1px solid rgba(74, 116, 218, 0.2)",
                          boxShadow: isActive
                            ? "0 12px 26px rgba(74, 116, 218, 0.28)"
                            : "0 10px 20px rgba(74, 116, 218, 0.12)",
                          transition:
                            "transform 0.2s ease, box-shadow 0.2s ease, border 0.2s ease",
                          transform: isActive ? "translateY(-2px)" : "none",
                          backgroundColor: "rgba(147, 206, 246, 0.12)",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            borderColor: "rgba(74, 116, 218, 0.45)",
                            boxShadow: "0 16px 28px rgba(74, 116, 218, 0.18)",
                          },
                          "&:focus-visible": {
                            outline: "2px solid rgba(88, 43, 175, 0.55)",
                            outlineOffset: 3,
                          },
                        }}
                        aria-label={label}
                      >
                        {isVideo ? (
                          <>
                            {thumb.displayUrl &&
                            thumb.displayUrl !== thumb.sourceUrl ? (
                              <Box
                                component="img"
                                src={thumb.displayUrl}
                                alt="Ảnh xem trước video"
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  filter: "brightness(0.75)",
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background:
                                    "linear-gradient(135deg, rgba(141, 226, 237, 0.48), rgba(88, 43, 175, 0.6))",
                                }}
                                aria-hidden
                              />
                            )}
                            <Box
                              sx={{
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "rgba(88, 43, 175, 0.28)",
                              }}
                              aria-hidden
                            >
                              <PlayArrowRoundedIcon
                                sx={{ color: "#fff", fontSize: 28 }}
                              />
                            </Box>
                          </>
                        ) : (
                          <Box
                            component="img"
                            src={thumb.displayUrl}
                            alt={`Ảnh thu nhỏ ${index + 1} của ${kolName}`}
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              objectPosition: "center top",
                            }}
                          />
                        )}
                      </Box>
                    );
                  })}
                </MotionStack>
              )}
            </MotionStack>
          </Box>

          {/* Cột phải: Thông tin + giá + stats */}
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
                  <Box sx={{ flex: 1 }}>
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
                            icon={
                              isMale ? (
                                <MaleRoundedIcon />
                              ) : (
                                <FemaleRoundedIcon />
                              )
                            }
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
                    </MotionStack>

                    <Typography
                      sx={{
                        color: textSecondary,
                        lineHeight: 1.65,
                        fontSize: { xs: "1rem", md: "1.1rem" },
                        textAlign: { xs: "center", sm: "left" },
                        mt: 1.5,
                      }}
                    >
                      {shortBio}
                    </Typography>
                  </Box>

                  {/* Panel giá (khóa) */}
                  <MotionBox
                    {...fadeUpProps(0.24)}
                    sx={{
                      flex: { lg: "0 0 auto" },
                      width: { xs: "100%", lg: "auto" },
                      minWidth: { lg: "280px" },
                    }}
                  >
                    <PricingPanel pricing={pricing} locked={pricingLocked} />
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
                        minWidth: { xs: "140px", sm: "120px", md: "140px" },
                        borderRadius: "20px",
                        px: 2.5,
                        py: 2,
                        bgcolor: "rgba(147, 206, 246, 0.12)",
                        border: "1px solid rgba(74, 116, 218, 0.18)",
                        backdropFilter: "blur(10px)",
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
                        <IconComponent sx={{ fontSize: 24 }} />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: textSecondary,
                          letterSpacing: "0.04em",
                          fontSize: "0.95rem",
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

              {/* ĐÃ BỎ hai nút hành động ở phiên bản portfolio => showActions=false (không render) */}
              {showActions && null}

              {/* Thành tựu */}
              {achievements.length > 0 && (
                <MotionBox
                  {...fadeUpProps(0.5)}
                  sx={{
                    borderRadius: "20px",
                    background:
                      "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(147, 206, 246, 0.25) 55%, rgba(255, 161, 218, 0.22) 100%)",
                    border: "1px solid rgba(74, 116, 218, 0.16)",
                    px: { xs: 2.5, md: 3 },
                    py: { xs: 2, md: 2.5 },
                  }}
                >
                  <Stack spacing={1.2}>
                    {achievements.map((item, idx) => (
                      <Typography
                        key={`${item}-${idx}`}
                        sx={{ color: textSecondary, lineHeight: 1.6 }}
                      >
                        {item}
                      </Typography>
                    ))}
                  </Stack>
                </MotionBox>
              )}
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* Modal play video */}
      <Dialog
        open={Boolean(videoModal)}
        onClose={handleCloseVideo}
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
            onClick={handleCloseVideo}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 1,
              color: "#fff",
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.6)" },
            }}
            aria-label="Đóng video"
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
