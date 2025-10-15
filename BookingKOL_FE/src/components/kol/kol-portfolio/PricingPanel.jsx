import React from "react";
import { motion } from "framer-motion";
import { Box, Typography, Stack, Divider } from "@mui/material";

// giữ đúng style/utility như bản gốc
const textPrimary = "#ffffff";
const textSecondary = "#ffffff";

// Format tiền theo locale vi-VN, fallback khi currency không hỗ trợ
const formatMoney = (value, currency = "VND") => {
  if (value == null || value === "") return "--";
  const num = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(num)) return String(value);
  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "VND" ? 0 : 2,
    }).format(num);
  } catch {
    return `${new Intl.NumberFormat("vi-VN").format(num)} ${currency}`;
  }
};

/**
 * locked = true => không hiển thị các nút sửa giá (nếu sau này thêm)
 */
export default function PricingPanel({ pricing = {}, locked = true }) {
  const { hourlyRate, currency = "VND", originalPrice } = pricing;

  const hourlyText =
    hourlyRate != null ? formatMoney(hourlyRate, currency) : "--";
  const originalText =
    originalPrice != null ? formatMoney(originalPrice, currency) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
    >
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "22px",
          background:
            "linear-gradient(135deg, #93cef6 0%, #4a74da 50%, #582baf 100%)",
          border: "1px solid rgba(74, 116, 218, 0.22)",
          boxShadow:
            "0 26px 60px rgba(74, 116, 218, 0.18), inset 0 1px 0 rgba(147, 206, 246, 0.45)",
          px: { xs: 2.75, md: 3 },
          py: { xs: 2.75, md: 3.25 },
          color: textPrimary,
          backdropFilter: "blur(18px)",
          "&::before": {
            content: '""',
            position: "absolute",
            top: -70,
            right: -60,
            width: 180,
            height: 180,
            background:
              "radial-gradient(60% 60% at 50% 30%, rgba(141, 226, 237, 0.4) 0%, rgba(147, 206, 246, 0) 75%)",
            opacity: 0.65,
            pointerEvents: "none",
          },
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                variant="subtitle2"
                sx={{ color: textSecondary, letterSpacing: "0.08em" }}
              >
                Bảng giá
              </Typography>
              {/* nếu sau này có nút edit giá thì chỉ render khi !locked */}
              {/* {!locked && <Button size="small">Chỉnh sửa</Button>} */}
            </Stack>

            <Stack direction="row" spacing={1.5} alignItems="baseline">
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, letterSpacing: "0.02em" }}
                aria-label="Đơn giá theo giờ"
              >
                {hourlyText}
              </Typography>
              <Typography variant="subtitle1" sx={{ color: textSecondary }}>
                / giờ
              </Typography>
            </Stack>

            {originalText && (
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography
                  variant="body2"
                  sx={{
                    color: "rgba(47, 60, 140, 0.5)",
                    textDecoration: "line-through",
                  }}
                  aria-label="Giá gốc"
                >
                  {originalText}
                </Typography>
              </Stack>
            )}
          </Stack>

          <Divider sx={{ borderColor: "rgba(74, 116, 218, 0.12)" }} />
        </Stack>
      </Box>
    </motion.div>
  );
}
