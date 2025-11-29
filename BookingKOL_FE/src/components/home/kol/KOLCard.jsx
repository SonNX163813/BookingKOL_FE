import React from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Rating,
  Chip,
  Tooltip,
  Button,
} from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import { motion } from "framer-motion";

const clampRating = (v) => (Number.isNaN(v) ? 0 : Math.min(Math.max(v, 0), 5));
const truncateText = (str, max = 36) => {
  if (!str) return str;
  const s = String(str).trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}...` : s;
};

const MotionCard = motion(Card);

const cardGradient =
  "radial-gradient(55% 55% at 90% 0%, rgba(147, 206, 246, 0.35) 0%, rgba(147, 206, 246, 0) 70%),radial-gradient(60% 60% at 0% 100%, rgba(255, 161, 218, 0.28) 0%, rgba(88, 43, 175, 0) 70%)";
const cardGlow =
  "radial-gradient(68% 68% at 50% 8%, rgba(147,206,246,0.5) 0%, rgba(147,206,246,0) 100%)";
const cardShadow = "0 20px 50px rgba(74, 116, 218, 0.18)";
const cardHoverShadow = "0 20px 80px rgba(88,43,175,0.28)";
const borderColor = "rgba(74,116,218,0.22)";
const primaryText = "#1e2767";
const secondaryText = "rgba(30,39,103,0.72)";
const subtleText = "rgba(30,39,103,0.5)";
const chipGradient =
  "linear-gradient(135deg, rgba(141,226,237,0.26) 0%, rgba(88,43,175,0.22) 100%)";
const ratingSurface =
  "linear-gradient(135deg, rgba(141,226,237,0.26) 0%, rgba(88,43,175,0.22) 100%)";
const priceSurface =
  "linear-gradient(135deg, rgba(255,255,255,0.84) 0%, rgba(255,161,218,0.34) 100%)";
const fontFamily = "'Montserrat', sans-serif";

const KOLCard = ({
  name,
  field,
  fieldFull,
  price,
  originalPrice,
  rating = 5,
  reviewCount,
  image,
  mediaContainerSx,
  mediaSx,
  onClick,
  role,
}) => {
  const ratingValue = clampRating(Number.parseFloat(rating));
  const formattedRating = ratingValue.toFixed(2);
  const formattedReviews =
    typeof reviewCount === "number"
      ? `(${reviewCount.toLocaleString()})`
      : null;

  const fieldDisplay = truncateText(field, 36);
  const fieldTooltip = fieldFull || field || "";
  const hasFieldChip = Boolean(fieldDisplay);

  const handleKeyDown = (e) => {
    if (!onClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(e);
    }
  };

  const normalizedRole =
    typeof role === "string" ? role.trim().toUpperCase() : "";
  const isLiveRole = normalizedRole === "LIVE";
  const roleLabel =
    normalizedRole === "LIVE"
      ? "Trợ Live"
      : normalizedRole === "KOL"
      ? "Host Chính"
      : null;

  const handleViewDetailClick = (e) => {
    // Tránh trigger onClick ở wrapper bên ngoài 2 lần
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -10 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
      aria-label={onClick ? `View details ${name}` : undefined}
    >
      <MotionCard
        whileHover={{
          boxShadow: cardHoverShadow,
        }}
        elevation={0}
        sx={{
          position: "relative",
          borderRadius: { xs: "22px", sm: "24px" },
          boxShadow: {
            xs: "0 22px 48px rgba(74,116,218,0.18)",
            md: cardShadow,
          },
          border: `1px solid ${borderColor}`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          width: { xl: 300, lg: 280, md: 260, sm: 250, xs: 250 },
          height: "100%",
          minHeight: 420,
          backdropFilter: "blur(14px)",
          transition: "box-shadow 0.3s ease",
          zIndex: 0,
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.12) 55%, rgba(255,255,255,0) 100%)",
            opacity: 0.55,
            pointerEvents: "none",
            zIndex: 0,
          },
          "&::after": {
            content: '""',
            position: "absolute",
            inset: "-18% -20% 60%",
            background: cardGlow,
            filter: "blur(32px)",
            opacity: 0.55,
            pointerEvents: "none",
            zIndex: 0,
          },
        }}
      >
        <Box
          sx={[
            mediaContainerSx,
            {
              position: "relative",
              width: "100%",
              minHeight: { xs: 230, sm: 270, md: 290, lg: 310 },
              overflow: "hidden",
              flexShrink: 0,
              borderBottom: "1px solid rgba(147,206,246,0.16)",
              zIndex: 1,
            },
            mediaContainerSx && {
              ...mediaContainerSx,
              width: undefined,
              height: undefined,
              minHeight: undefined,
              maxHeight: undefined,
              aspectRatio: undefined,
            },
          ]}
        >
          <Box sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
            <CardMedia
              component="img"
              image={image}
              alt={`${name} - ${field || "KOL"}`}
              sx={[
                mediaSx,
                {
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center top",
                  display: "block",
                  bgcolor: "#f1f5f9",
                  userSelect: "none",
                },
                mediaSx && {
                  ...mediaSx,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                },
              ]}
              draggable={false}
            />
          </Box>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(15,23,42,0) 45%, rgba(15,23,42,0.45) 100%)",
              opacity: 0.5,
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: "auto 18px 18px 18px",
              height: "18%",
              borderRadius: "16px",
              background: "rgba(255,255,255,0.65)",
              filter: "blur(28px)",
              opacity: 0.6,
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        </Box>

        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: { xs: 1.6, sm: 1.9 },
            py: { xs: 2.4, sm: 2.8 },
            px: { xs: 2.4, sm: 2.8 },
            flexGrow: 1,
            minHeight: 200,
            position: "relative",
            zIndex: 2,
            fontFamily,
            color: primaryText,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: primaryText,
              letterSpacing: "-0.01em",
              fontSize: { xs: "1rem", sm: "1.05rem", md: "1.1rem" },
              lineHeight: 1.32,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              wordBreak: "break-word",
            }}
            title={name}
          >
            {name}
          </Typography>
          <Box
            sx={{
              minHeight: 28,
              display: "flex",
              alignItems: "center",
            }}
          >
            {roleLabel && (
              <Chip
                icon={<BadgeRoundedIcon sx={{ fontSize: 18 }} />}
                label={roleLabel}
                size="small"
                sx={{
                  background: isLiveRole
                    ? "rgba(255, 161, 218, 0.25)" // LIVE = Trợ Live
                    : "rgba(147, 206, 246, 0.18)", // KOL = Host Chính
                  color: primaryText,
                  borderRadius: "999px",
                  fontWeight: 600,
                  border: "1px solid rgba(74, 116, 218, 0.24)",
                }}
              />
            )}
          </Box>
          <Box
            sx={{
              minHeight: 28,
              display: "flex",
              alignItems: "center",
            }}
          >
            {hasFieldChip && (
              <Tooltip
                title={fieldTooltip}
                disableHoverListener={
                  !fieldTooltip || fieldTooltip === fieldDisplay
                }
              >
                <Chip
                  label={fieldDisplay}
                  size="small"
                  sx={{
                    alignSelf: "flex-start",
                    background: chipGradient,
                    color: primaryText,
                    fontWeight: 600,
                    borderRadius: "9999px",
                    px: { xs: 1.25, sm: 1.5 },
                    height: 28,
                    fontSize: { xs: "0.72rem", sm: "0.78rem" },
                    border: "1px solid rgba(74,116,218,0.24)",
                    boxShadow: "0 12px 28px rgba(74,116,218,0.18)",
                    ".MuiChip-label": {
                      maxWidth: 200,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    },
                  }}
                />
              </Tooltip>
            )}
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              minHeight: 44,
              borderRadius: "16px",
              background: ratingSurface,
              border: "1px solid rgba(147,206,246,0.28)",
              boxShadow: "0 16px 32px rgba(147,206,246,0.18)",
              px: { xs: 1.5, sm: 1.75 },
              py: { xs: 0.85, sm: 1 },
            }}
          >
            <Rating
              value={ratingValue}
              precision={0.1}
              readOnly
              sx={{
                "& .MuiRating-iconFilled": { color: "#facc15" },
                "& .MuiRating-iconEmpty": { color: "rgba(255,255,255,0.6)" },
                "& .MuiRating-icon": {
                  fontSize: { xs: 18, sm: 19, md: 20 },
                },
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: primaryText,
                fontWeight: 600,
                fontSize: { xs: "0.78rem", sm: "0.82rem" },
                display: "flex",
                alignItems: "center",
              }}
            >
              {formattedRating}
              {formattedReviews && (
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    color: secondaryText,
                    fontWeight: 500,
                    ml: 0.6,
                    fontSize: { xs: "0.72rem", sm: "0.76rem" },
                  }}
                >
                  {formattedReviews}
                </Typography>
              )}
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1, minHeight: 8 }} />

          {onClick && (
            <Box
              sx={{
                // mt: { xs: 1, sm: 1.4 },
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                variant="contained"
                size="small"
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={handleViewDetailClick}
                sx={{
                  textTransform: "none",
                  borderRadius: "9999px",
                  fontWeight: 600,
                  fontSize: { xs: "0.8rem", sm: "0.85rem" },
                  px: { xs: 2.2, sm: 2.6 },
                  py: 0.7,
                  boxShadow: "0 12px 28px rgba(74,116,218,0.28)",
                  background:
                    "linear-gradient(135deg, #4a74da 0%, #8dcef1 100%)",
                  "&:hover": {
                    background:
                      "linear-gradient(135deg, #3b5ec8 0%, #7bc0e8 100%)",
                    boxShadow: "0 16px 32px rgba(59,94,200,0.32)",
                  },
                }}
              >
                Xem chi tiết
              </Button>
            </Box>
          )}

          {/* Nếu muốn show price trở lại, block giá cũ vẫn có thể bật lại ở đây */}
        </CardContent>
      </MotionCard>
    </motion.div>
  );
};

export default KOLCard;
