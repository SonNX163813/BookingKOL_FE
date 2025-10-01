import React from "react";
import { Stack, Typography, CircularProgress } from "@mui/material";

export const LoadingState = () => (
  <Stack
    alignItems="center"
    justifyContent="center"
    sx={{
      minHeight: 260,
      borderRadius: 4,
      border: "1px dashed rgba(0, 227, 159, 0.3)",
      bgcolor: "rgba(8, 20, 17, 0.7)",
    }}
  >
    <CircularProgress sx={{ color: "#00E39F" }} />
    <Typography sx={{ mt: 2, color: "rgba(230, 244, 239, 0.64)" }}>
      Đang tải danh sách khóa học livestream...
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
      border: "1px solid rgba(0, 227, 159, 0.18)",
      bgcolor: "rgba(8, 20, 17, 0.6)",
    }}
  >
    <Typography variant="h5" sx={{ fontWeight: 600 }}>
      Chưa có gói khóa học nào sẵn sàng
    </Typography>
    <Typography
      sx={{
        color: "rgba(230, 244, 239, 0.64)",
        maxWidth: 520,
        textAlign: "center",
      }}
    >
      Vui lòng quay lại sau. Chúng tôi đang cập nhật các giải pháp đào tạo
      livestream mới nhất.
    </Typography>
  </Stack>
);
