import React from "react";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { PRIMARY_BUTTON_SX } from "./constants";

export const BlogLoadingState = () => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "40vh",
    }}
  >
    <CircularProgress sx={{ color: "#4a74da" }} />
  </Box>
);

export const BlogErrorState = ({ message, onRetry }) => (
  <Stack spacing={2} alignItems="center" sx={{ py: 6 }}>
    <Typography variant="body1" color="error">
      {message}
    </Typography>
    <Button variant="contained" onClick={onRetry} sx={PRIMARY_BUTTON_SX}>
      Thử lại
    </Button>
  </Stack>
);

export const BlogEmptyState = () => (
  <Stack spacing={1.5} alignItems="center" sx={{ py: 6 }}>
    <Typography variant="h6" sx={{ fontWeight: 600, color: "#0f172a" }}>
      Chưa có bài viết nào
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Quay lại sau để xem những chia sẻ mới nhất từ BookingKOL.
    </Typography>
  </Stack>
);
