import React from "react";
import { Stack, Typography } from "@mui/material";

const CourseDetailEmpty = () => (
  <Stack
    alignItems="center"
    spacing={2}
    sx={{
      py: 10,
      borderRadius: 5,
      border: "1px solid rgba(0, 227, 159, 0.18)",
      bgcolor: "rgba(8, 20, 17, 0.64)",
    }}
  >
    <Typography variant="h5" sx={{ fontWeight: 600 }}>
      Không tìm thấy khoá học phù hợp
    </Typography>
    <Typography sx={{ color: "rgba(230, 244, 239, 0.66)", maxWidth: 520 }}>
      Vui lòng quay lại danh sách và chọn lại gói đào tạo livestream mà bạn quan
      tâm.
    </Typography>
  </Stack>
);

export default CourseDetailEmpty;
