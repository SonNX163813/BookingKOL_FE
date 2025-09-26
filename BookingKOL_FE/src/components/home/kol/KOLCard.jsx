import React from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Rating,
  Chip,
} from "@mui/material";
import { motion } from "framer-motion";

const clampRating = (value) => {
  if (Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), 5);
};

const KOLCard = ({
  name,
  field,
  price,
  originalPrice,
  rating = 5,
  reviewCount,
  image,
  mediaContainerSx,
  mediaSx,
  onClick,
  // isHot = false,
  // isOnline = true,
}) => {
  const ratingValue = clampRating(Number.parseFloat(rating));
  const formattedRating = ratingValue.toFixed(2);
  const formattedReviews =
    typeof reviewCount === "number"
      ? `(${reviewCount.toLocaleString()})`
      : null;
  const handleKeyDown = (event) => {
    if (!onClick) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick(event);
    }
  };
  // const statusLabel = isOnline ? "Online" : "Offline";
  // const statusColor = isOnline ? "#22c55e" : "#94a3b8";

  return (
    <motion.div
      whileHover={{
        y: -6,
        boxShadow: "0 24px 48px rgba(15, 23, 42, 0.12)",
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        height: "100%",
        cursor: onClick ? "pointer" : "default",
      }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      <Card
        sx={{
          borderRadius: { xs: 3, sm: 4 },
          boxShadow: {
            xs: "0 10px 24px rgba(148, 163, 184, 0.16)",
            md: "0 18px 42px rgba(148, 163, 184, 0.18)",
          },
          border: {
            xs: "1px solid #e2e8f0",
            md: "1px solid #e2e8f0",
          },
          overflow: "hidden",
          background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={[
            {
              position: "relative",
              width: "100%",
              minHeight: { xs: 260, sm: 280 },
              height: "100%",
              overflow: "hidden",
              flexShrink: 0,
            },
            mediaContainerSx,
          ]}
        >
          <CardMedia
            component="img"
            image={image}
            alt={`${name} - ${field || "KOL"}`}
            sx={[
              {
                position: "absolute",
                inset: 0,
                height: "100%",
                width: "100%",
                objectFit: "cover", // ensure image covers the container
                objectPosition: "center", // keep primary focus centered
                display: "block",
                bgcolor: "#f1f5f9",
              },
              mediaSx,
            ]}
          />

          {/* {isHot && (
            <Chip
              label={`🔥 Hot`}
              sx={{
                position: "absolute",
                top: 12,
                left: 12,
                backgroundColor: "#fb923c",
                color: "white",
                fontWeight: 600,
                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                borderRadius: "9999px",
                px: { xs: 1, sm: 1.25 },
                py: { xs: 0.25, sm: 0.3 },
              }}
              size="small"
            />
          )} */}
        </Box>

        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: { xs: 1.25, sm: 1.5, md: 2 },
            py: { xs: 2, sm: 2.5, md: 3 },
            px: { xs: 2, sm: 2.5, md: 3 },
            flexGrow: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#0f172a",
                letterSpacing: "-0.01em",
                fontSize: { xs: "1rem", sm: "1.05rem", md: "1.125rem" },
                lineHeight: 1.25,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {name}
            </Typography>

            {/* <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box
                component="span"
                sx={{
                  width: { xs: 8, sm: 10 },
                  height: { xs: 8, sm: 10 },
                  borderRadius: "50%",
                  backgroundColor: statusColor,
                  boxShadow: `0 0 0 4px rgba(34, 197, 94, ${
                    isOnline ? 0.12 : 0
                  })`,
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  color: statusColor,
                  fontWeight: 600,
                  fontSize: { xs: "0.75rem", sm: "0.8rem" },
                }}
              >
                {statusLabel}
              </Typography>
            </Box> */}
          </Box>

          {field && (
            <Chip
              label={field}
              size="small"
              sx={{
                alignSelf: "flex-start",
                backgroundColor: "rgba(79, 70, 229, 0.1)",
                color: "#4f46e5",
                fontWeight: 600,
                borderRadius: "9999px",
                px: { xs: 1, sm: 1.25, md: 1.5 },
                height: { xs: 24, sm: 26 },
                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                maxWidth: "100%",
                ".MuiChip-label": {
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                },
              }}
            />
          )}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 0.75, sm: 1 },
            }}
          >
            <Rating
              value={ratingValue}
              precision={0.1}
              readOnly
              sx={{
                "& .MuiRating-iconFilled": { color: "#facc15" },
                "& .MuiRating-iconEmpty": { color: "#e2e8f0" },
                "& .MuiRating-icon": {
                  fontSize: { xs: 18, sm: 20, md: 22 },
                },
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: "#475569",
                fontWeight: 600,
                fontSize: { xs: "0.8rem", sm: "0.85rem" },
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
                    fontSize: { xs: "0.75rem", sm: "0.8rem" },
                  }}
                >
                  {formattedReviews}
                </Typography>
              )}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              mt: "auto",
            }}
          >
            {originalPrice && (
              <Typography
                variant="body2"
                sx={{
                  color: "#94a3b8",
                  textDecoration: "line-through",
                  fontWeight: 500,
                  fontSize: { xs: "0.8rem", sm: "0.85rem" },
                }}
              >
                {originalPrice}
              </Typography>
            )}
            <Typography
              variant="h5"
              sx={{
                color: "#ef4444",
                fontWeight: 700,
                fontSize: { xs: "1.25rem", sm: "1.4rem", md: "1.5rem" },
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
      </Card>
    </motion.div>
  );
};

export default KOLCard;
