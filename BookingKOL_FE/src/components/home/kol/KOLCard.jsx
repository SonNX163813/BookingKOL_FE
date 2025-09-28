// KOLCard.jsx - Equalized & Locked
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
} from "@mui/material";
import { motion } from "framer-motion";

const clampRating = (v) => (Number.isNaN(v) ? 0 : Math.min(Math.max(v, 0), 5));
const truncateText = (str, max = 36) => {
  if (!str) return str;
  const s = String(str).trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
};

const MotionCard = motion(Card);

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

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
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
      aria-label={onClick ? `Mở chi tiết ${name}` : undefined}
    >
      <MotionCard
        whileHover={{
          boxShadow: "0 24px 48px rgba(15,23,42,0.18)",
          transition: { duration: 0.25 },
        }}
        elevation={0}
        sx={{
          borderRadius: { xs: 3, sm: 4 },
          boxShadow: {
            xs: "0 10px 24px rgba(148,163,184,0.16)",
            md: "0 18px 42px rgba(148,163,184,0.18)",
          },
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          background: "linear-gradient(180deg,#fff 0%,#f8fafc 100%)",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          minHeight: 420, // đồng bộ sườn card
        }}
      >
        {/* MEDIA: khoá tỉ lệ 3/4 + fallback; base style đặt SAU để không bị override */}
        <Box
          sx={[
            // cho phép truyền thêm, nhưng không được phép thay đổi ratio/height
            mediaContainerSx,
            {
              position: "relative",
              width: { xs: 240, sm: 260, md: 300, lg: 320 },
              height: { xs: 240, sm: 260, md: 300, lg: 420 },
              overflow: "hidden",
              flexShrink: 0,
              // "--media-w": 3,
              // "--media-h": 4,
              // aspectRatio: "var(--media-w) / var(--media-h)",
              // "@supports not (aspect-ratio: 1 / 1)": {
              //   "&::before": {
              //     content: '""',
              //     display: "block",
              //     paddingBottom: "calc(100% * var(--media-h) / var(--media-w))",
              //   },
              // },
            },
            mediaContainerSx && {
              ...mediaContainerSx,
              minHeight: undefined,
              maxHeight: undefined,
              aspectRatio: undefined,
            },
          ]}
        >
          <Box sx={{ position: "absolute", inset: 0 }}>
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
        </Box>

        {/* CONTENT: cố định chiều cao các block, giá luôn ở đáy */}
        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: { xs: 1, sm: 1.25, md: 1.5 },
            py: { xs: 2, sm: 2.5 },
            px: { xs: 2, sm: 2.5 },
            flexGrow: 1,
            minHeight: 180,
          }}
        >
          {/* Tên: 2 dòng cố định */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#0f172a",
              letterSpacing: "-0.01em",
              fontSize: { xs: "0.95rem", sm: "1rem", md: "1.05rem" },
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "2.6em", // 2 dòng * 1.3
            }}
            title={name}
          >
            {name}
          </Typography>

          {/* Chip lĩnh vực: chiều cao cố định */}
          <Box
            sx={{
              minHeight: 26,
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
                    backgroundColor: "rgba(79,70,229,0.1)",
                    color: "#4f46e5",
                    fontWeight: 600,
                    borderRadius: "9999px",
                    px: { xs: 1, sm: 1.25 },
                    height: 26,
                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                    ".MuiChip-label": {
                      maxWidth: 180,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    },
                  }}
                />
              </Tooltip>
            )}
          </Box>

          {/* Rating: chiều cao cố định */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              minHeight: 22,
            }}
          >
            <Rating
              value={ratingValue}
              precision={0.1}
              readOnly
              sx={{
                "& .MuiRating-iconFilled": { color: "#facc15" },
                "& .MuiRating-iconEmpty": { color: "#e2e8f0" },
                "& .MuiRating-icon": { fontSize: { xs: 16, sm: 18, md: 20 } },
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: "#475569",
                fontWeight: 600,
                fontSize: { xs: "0.75rem", sm: "0.8rem" },
              }}
            >
              {formattedRating}
              {formattedReviews && (
                <Typography
                  component="span"
                  variant="body2"
                  sx={{
                    color: "#94a3b8",
                    fontWeight: 500,
                    ml: 0.5,
                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                  }}
                >
                  {formattedReviews}
                </Typography>
              )}
            </Typography>
          </Box>

          {/* spacer đẩy giá xuống đáy */}
          <Box sx={{ flexGrow: 1, minHeight: 8 }} />

          {/* Giá: block cố định */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.25,
              minHeight: { xs: 32, sm: 36, md: 40 },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "#94a3b8",
                textDecoration: "line-through",
                fontWeight: 500,
                fontSize: { xs: "0.75rem", sm: "0.8rem" },
                lineHeight: 1.2,
                opacity: originalPrice ? 1 : 0,
                visibility: originalPrice ? "visible" : "hidden",
              }}
              title={originalPrice || undefined}
              aria-hidden={!originalPrice}
            >
              {originalPrice || price}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: "#ef4444",
                fontWeight: 700,
                fontSize: { xs: "1.1rem", sm: "1.25rem", md: "1.35rem" },
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={price}
            >
              {price}
            </Typography>
          </Box>
        </CardContent>
      </MotionCard>
    </motion.div>
  );
};

export default KOLCard;
