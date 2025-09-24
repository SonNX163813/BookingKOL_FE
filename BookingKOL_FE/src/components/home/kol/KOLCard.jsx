import React from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Rating,
  Button,
  Chip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { motion } from "framer-motion";

const KOLCard = ({ name, field, price, rating, image, isHot = false }) => {
  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        boxShadow: "0 20px 40px rgba(168, 85, 247, 0.15)",
      }}
      transition={{ duration: 0.2 }}
    >
      <Card
        sx={{
          borderRadius: 3,
          boxShadow: 1,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          transition: "all 0.3s ease",
          "&:hover": {
            borderColor: "#a855f7",
          },
          position: "relative",
        }}
      >
        <Box sx={{ position: "relative" }}>
          <CardMedia
            component="img"
            height="192"
            image={image}
            alt={`${name} - ${field} influencer`}
            sx={{ objectFit: "cover" }}
          />
          {isHot && (
            <Chip
              label="🔥 Hot"
              sx={{
                position: "absolute",
                top: 12,
                left: 12,
                backgroundColor: "#fb923c",
                color: "white",
                fontSize: "0.75rem",
                fontWeight: "semibold",
              }}
            />
          )}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to top, rgba(0, 0, 0, 0.2), transparent)",
              opacity: 0,
              transition: "opacity 0.3s ease",
              "&:hover": { opacity: 1 },
            }}
          />
        </Box>

        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: "bold", color: "#1e293b", mb: 0.5 }}
          >
            {name}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#7c3aed", fontWeight: "medium", mb: 1.5 }}
          >
            {field}
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Rating
                value={rating}
                readOnly
                size="small"
                sx={{ color: "#fbbf24" }}
              />
              <Typography variant="body2" sx={{ color: "#475569" }}>
                ({rating}.0)
              </Typography>
            </Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", color: "#c026d3" }}
            >
              {price}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            fullWidth
            startIcon={<VisibilityIcon />}
            sx={{
              color: "#c026d3",
              borderColor: "#c026d3",
              "&:hover": {
                backgroundColor: "#c026d3",
                color: "white",
              },
              fontWeight: "medium",
            }}
          >
            View Details
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default KOLCard;
