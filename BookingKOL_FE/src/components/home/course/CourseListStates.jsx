import React from "react";
import { Stack, Typography, CircularProgress } from "@mui/material";

export const LoadingState = () => (
  <Stack
    alignItems="center"
    justifyContent="center"
    sx={{
      minHeight: 260,
      borderRadius: 4,
      border: "1px dashed rgba(74, 116, 218, 0.3)",
      bgcolor: "rgba(74, 116, 218, 0.08)",
    }}
  >
    <CircularProgress sx={{ color: "#4a74da" }} />
    <Typography sx={{ mt: 2, color: "rgba(15, 23, 42, 0.7)" }}>
      Dang tai danh sach khoa hoc livestream...
    </Typography>
  </Stack>
);

export const EmptyState = () => (
  <Stack
    alignItems="center"
    spacing={2}
    sx={{
      py: 10,
      borderRadius: 4,
      border: "1px solid rgba(74, 116, 218, 0.18)",
      bgcolor: "rgba(226, 232, 240, 0.45)",
    }}
  >
    <Typography variant="h5" sx={{ fontWeight: 600, color: "#0f172a" }}>
      Chua co goi khoa hoc nao san sang
    </Typography>
    <Typography
      sx={{
        color: "rgba(15, 23, 42, 0.7)",
        maxWidth: 520,
        textAlign: "center",
      }}
    >
      Vui long quay lai sau. Chung toi dang cap nhat cac giai phap dao tao
      livestream moi nhat.
    </Typography>
  </Stack>
);
