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
  isHot = false,
  isOnline = true,
}) => {
  const ratingValue = clampRating(Number.parseFloat(rating));
  const formattedRating = ratingValue.toFixed(2);
  const formattedReviews =
    typeof reviewCount === "number"
      ? `(${reviewCount.toLocaleString()})`
      : null;
  const statusLabel = isOnline ? "Online" : "Offline";
  const statusColor = isOnline ? "#22c55e" : "#94a3b8";

  return (
    <motion.div
      whileHover={{
        y: -6,
        boxShadow: "0 24px 48px rgba(15, 23, 42, 0.12)",
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card
        sx={{
          borderRadius: 4,
          boxShadow: "0 18px 42px rgba(148, 163, 184, 0.18)",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ position: "relative" }}>
          <CardMedia
            component="img"
            image={image}
            alt={`${name} - ${field}`}
            sx={{
              height: 260,
              width: "100%",
              objectFit: "cover",
            }}
          />

          {isHot && (
            <Chip
              label={`🔥 Hot`}
              sx={{
                position: "absolute",
                top: 16,
                left: 16,
                backgroundColor: "#fb923c",
                color: "white",
                fontWeight: 600,
                fontSize: "0.75rem",
                borderRadius: "9999px",
              }}
            />
          )}
        </Box>

        <CardContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            py: 3,
            px: 3,
            flexGrow: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#0f172a",
                letterSpacing: "-0.01em",
              }}
            >
              {name}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
              <Box
                component="span"
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: statusColor,
                  boxShadow: `0 0 0 4px rgba(34, 197, 94, ${
                    isOnline ? 0.12 : 0
                  })`,
                }}
              />
              <Typography
                variant="body2"
                sx={{ color: statusColor, fontWeight: 600 }}
              >
                {statusLabel}
              </Typography>
            </Box>
          </Box>

          {field && (
            <Chip
              label={field}
              sx={{
                alignSelf: "flex-start",
                backgroundColor: "rgba(79, 70, 229, 0.1)",
                color: "#4f46e5",
                fontWeight: 600,
                borderRadius: "9999px",
                px: 1.5,
              }}
            />
          )}

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Rating
              value={ratingValue}
              precision={0.1}
              readOnly
              sx={{
                "& .MuiRating-iconFilled": { color: "#facc15" },
                "& .MuiRating-iconEmpty": { color: "#e2e8f0" },
              }}
            />
            <Typography
              variant="body2"
              sx={{ color: "#475569", fontWeight: 600 }}
            >
              {formattedRating}
              {formattedReviews && (
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ color: "#94a3b8", fontWeight: 500, ml: 0.5 }}
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
                fontSize: "1.5rem",
              }}
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
