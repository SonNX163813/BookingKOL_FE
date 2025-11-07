import React from "react";
import { Stack, Typography } from "@mui/material";

const CourseDetailEmpty = () => (
  <Stack
    alignItems="center"
    spacing={2}
    sx={{
      py: 10,
      borderRadius: 5,
      border: "1px solid rgba(74, 116, 218, 0.18)",
      bgcolor: "rgba(226, 232, 240, 0.45)",
    }}
  >
    <Typography variant="h5" sx={{ fontWeight: 600, color: "#0f172a" }}>
      Không tìm thấy khóa học phù hợp
    </Typography>
    <Typography sx={{ color: "rgba(15, 23, 42, 0.7)" }}>
      Vui lòng thử lại với từ khóa khác hoặc kiểm tra lại kết nối mạng của bạn.
    </Typography>
  </Stack>
);

export default CourseDetailEmpty;
