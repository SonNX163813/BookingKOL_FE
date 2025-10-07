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
      Khong tim thay khoa hoc phu hop
    </Typography>
    <Typography sx={{ color: "rgba(15, 23, 42, 0.7)", maxWidth: 520 }}>
      Vui long quay lai danh sach va chon lai goi dao tao livestream ma ban quan
      tam.
    </Typography>
  </Stack>
);

export default CourseDetailEmpty;
