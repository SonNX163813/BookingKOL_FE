import React from "react";
import { Stack, CircularProgress, Typography } from "@mui/material";

const CourseDetailLoading = () => (
  <Stack
    alignItems="center"
    justifyContent="center"
    sx={{
      minHeight: 480,
      borderRadius: 5,
      border: "1px dashed rgba(74, 116, 218, 0.3)",
      bgcolor: "rgba(74, 116, 218, 0.08)",
    }}
  >
    <CircularProgress sx={{ color: "#4a74da" }} />
    <Typography sx={{ mt: 2, color: "rgba(15, 23, 42, 0.7)" }}>
      Dang tai chi tiet khoa hoc...
    </Typography>
  </Stack>
);

export default CourseDetailLoading;
