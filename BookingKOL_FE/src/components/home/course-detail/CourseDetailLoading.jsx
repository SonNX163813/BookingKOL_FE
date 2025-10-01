import React from "react";
import { Stack, CircularProgress, Typography } from "@mui/material";

const CourseDetailLoading = () => (
  <Stack
    alignItems="center"
    justifyContent="center"
    sx={{
      minHeight: 480,
      borderRadius: 5,
      border: "1px dashed rgba(0, 227, 159, 0.3)",
      bgcolor: "rgba(8, 20, 17, 0.76)",
    }}
  >
    <CircularProgress sx={{ color: "#00E39F" }} />
    <Typography sx={{ mt: 2, color: "rgba(230, 244, 239, 0.64)" }}>
      Đang tải chi tiết khoá học...
    </Typography>
  </Stack>
);

export default CourseDetailLoading;
