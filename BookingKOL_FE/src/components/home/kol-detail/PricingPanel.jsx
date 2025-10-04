import React from "react";
import { motion } from "framer-motion";
import {
  Box,
  Typography,
  Stack,
  Chip,
  Tooltip,
  Divider,
  SvgIcon,
} from "@mui/material";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import FacebookRoundedIcon from "@mui/icons-material/FacebookRounded";
import InstagramIcon from "@mui/icons-material/Instagram";

const TikTokIcon = (props) => (
  <SvgIcon viewBox="0 0 32 32" {...props}>
    <path
      d="M20.48 4.19c1.35 1.19 2.98 2.05 4.8 2.39v4.6c-1.68-.08-3.29-.48-4.8-1.16v8.9c0 5.07-4.11 9.18-9.18 9.18-1.55 0-3.01-.39-4.29-1.08a9.17 9.17 0 0 1-4.89-8.1c0-5.07 4.11-9.18 9.18-9.18.55 0 1.09.05 1.61.14v4.78a4.36 4.36 0 0 0-1.61-.31 4.4 4.4 0 1 0 4.4 4.41l.01-18.66h4.77Z"
      fill="currentColor"
    />
  </SvgIcon>
);

const textPrimary = "#ffffff";
const textSecondary = "#ffffff";

const getPlatformIcon = (iconName) => {
  switch (iconName) {
    case "tiktok":
      return <TikTokIcon sx={{ fontSize: 18 }} />;
    case "facebook":
      return <FacebookRoundedIcon sx={{ fontSize: 18 }} />;
    case "instagram":
      return <InstagramIcon sx={{ fontSize: 18 }} />;
    default:
      return null;
  }
};

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
    // Nếu currency không hợp lệ, hiển thị dạng "1.000.000 VND"
    return `${new Intl.NumberFormat("vi-VN").format(num)} ${currency}`;
  }
};

const PricingPanel = ({ pricing = {}, platforms = [] }) => {
  const { hourlyRate, currency = "VND", originalPrice, hasGuarantee } = pricing;

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
              {/* {hasGuarantee && (
                <Tooltip
                  title="Đặt lịch được bảo chứng doanh thu"
                  placement="top"
                  arrow
                >
                  <Chip
                    label="Bảo chứng"
                    size="small"
                    sx={{
                      background: "rgba(147, 206, 246, 0.18)",
                      color: textPrimary,
                      borderRadius: "999px",
                      border: "1px solid rgba(74, 116, 218, 0.32)",
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                      px: 1,
                    }}
                  />
                </Tooltip>
              )} */}
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
                {/* <Chip
                  label="Giảm giá"
                  size="small"
                  sx={{
                    background: "rgba(147, 206, 246, 0.2)",
                    color: textPrimary,
                    borderRadius: "999px",
                    border: "1px solid rgba(74, 116, 218, 0.32)",
                    fontWeight: 600,
                  }}
                /> */}
              </Stack>
            )}
          </Stack>

          <Divider sx={{ borderColor: "rgba(74, 116, 218, 0.12)" }} />

          {/* <Stack spacing={1.5}>
            <Typography
              variant="subtitle2"
              sx={{ color: textSecondary, letterSpacing: "0.08em" }}
            >
              Nền tảng
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1.25}>
              {platforms.map((platform) => (
                <Tooltip
                  key={platform.name}
                  title={platform.verified ? "Đã xác minh" : "Chưa xác minh"}
                  placement="top"
                  arrow
                >
                  <Chip
                    icon={getPlatformIcon(platform.icon)}
                    label={platform.name}
                    variant="outlined"
                    sx={{
                      borderColor: "rgba(74, 116, 218, 0.28)",
                      borderRadius: "999px",
                      px: 1.5,
                      color: textPrimary,
                      background: "rgba(147, 206, 246, 0.12)",
                      ".MuiChip-icon": { color: textPrimary, mr: 0.75 },
                      boxShadow: platform.verified
                        ? "0 0 0 1px rgba(147, 206, 246, 0.4)"
                        : "none",
                    }}
                    aria-label={`Nền tảng ${platform.name} ${
                      platform.verified ? "đã xác minh" : "chưa xác minh"
                    }`}
                  />
                </Tooltip>
              ))}
            </Stack>
          </Stack> */}

          {/* {hasGuarantee && (
            <Box
              sx={{
                borderRadius: "18px",
                background:
                  "linear-gradient(135deg, rgba(141, 226, 237, 0.35), rgba(88, 43, 175, 0.42))",
                border: "1px solid rgba(74, 116, 218, 0.35)",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2.25,
                py: 1.75,
              }}
              aria-label="Bảo chứng doanh thu"
            >
              <ShieldRoundedIcon sx={{ color: "#2f3c8c" }} />
              <Typography
                variant="body1"
                sx={{
                  color: "#2f3c8c",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              >
                Bảo chứng doanh thu
              </Typography>
            </Box>
          )} */}
        </Stack>
      </Box>
    </motion.div>
  );
};

export default PricingPanel;
