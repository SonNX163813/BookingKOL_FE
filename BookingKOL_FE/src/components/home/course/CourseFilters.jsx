import React from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Button,
} from "@mui/material";

const CourseFilters = ({
  filters,
  onFilterInputChange,
  onSortDirChange,
  onApply,
  onReset,
  loading,
  hasActiveFilters,
  hasFilterChanges,
}) => (
  <Box
    sx={{
      position: "relative",
      overflow: "hidden",
      borderRadius: { xs: 4, md: 6 },
      border: "1px solid rgba(74, 116, 218, 0.18)",
      boxShadow: "0 20px 50px rgba(74, 116, 218, 0.18)",
      backdropFilter: "blur(6px)",
      background: "#ffffff",
      p: { xs: 3, md: 5 },
    }}
  >
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: 0.85,
      }}
    />
    <Stack spacing={3.5} sx={{ position: "relative", zIndex: 1 }}>
      <Stack spacing={1.5}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,

            textShadow: "none",
          }}
        >
          Bộ lọc khóa học
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "rgba(15, 23, 42, 0.65)", lineHeight: 1.6 }}
        >
          Tinh chỉnh danh sách khóa học theo mức giá và ưu đãi phù hợp nhu cầu
          của bạn.
        </Typography>
      </Stack>

      <Stack spacing={3}>
        <Stack spacing={2} direction={{ xs: "column", sm: "row" }}>
          <TextField
            label="Giá tối thiểu (VND)"
            type="number"
            size="medium"
            value={filters.minPrice}
            onChange={onFilterInputChange("minPrice")}
            inputProps={{ min: 0 }}
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                backgroundColor: "rgba(74, 116, 218, 0.02)",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "rgba(74, 116, 218, 0.04)",
                },
                "&.Mui-focused": {
                  backgroundColor: "#ffffff",
                  boxShadow: "0 4px 12px rgba(74, 116, 218, 0.12)",
                },
              },
            }}
          />
          <TextField
            label="Giá tối đa (VND)"
            type="number"
            size="medium"
            value={filters.maxPrice}
            onChange={onFilterInputChange("maxPrice")}
            inputProps={{ min: 0 }}
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                backgroundColor: "rgba(74, 116, 218, 0.02)",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "rgba(74, 116, 218, 0.04)",
                },
                "&.Mui-focused": {
                  backgroundColor: "#ffffff",
                  boxShadow: "0 4px 12px rgba(74, 116, 218, 0.12)",
                },
              },
            }}
          />
        </Stack>

        <Stack spacing={2} direction={{ xs: "column", sm: "row" }}>
          <TextField
            label="Giảm giá tối thiểu (%)"
            type="number"
            size="medium"
            value={filters.minDiscount}
            onChange={onFilterInputChange("minDiscount")}
            inputProps={{ min: 0, max: 100 }}
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                backgroundColor: "rgba(74, 116, 218, 0.02)",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "rgba(74, 116, 218, 0.04)",
                },
                "&.Mui-focused": {
                  backgroundColor: "#ffffff",
                  boxShadow: "0 4px 12px rgba(74, 116, 218, 0.12)",
                },
              },
            }}
          />
          <TextField
            label="Giảm giá tối đa (%)"
            type="number"
            size="medium"
            value={filters.maxDiscount}
            onChange={onFilterInputChange("maxDiscount")}
            inputProps={{ min: 0, max: 100 }}
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
                backgroundColor: "rgba(74, 116, 218, 0.02)",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "rgba(74, 116, 218, 0.04)",
                },
                "&.Mui-focused": {
                  backgroundColor: "#ffffff",
                  boxShadow: "0 4px 12px rgba(74, 116, 218, 0.12)",
                },
              },
            }}
          />
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: "rgba(15,23,42,0.75)",
              minWidth: "fit-content",
            }}
          >
            Sắp xếp theo giá
          </Typography>
          <ToggleButtonGroup
            size="medium"
            exclusive
            color="primary"
            value={filters.sortDir}
            onChange={onSortDirChange}
            sx={{
              width: { xs: "100%", sm: "auto" },
              gap: { xs: 2, sm: 1 },
              "& .MuiToggleButton-root": {
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 500,
                px: 3,
                py: 1,
                border: "1px solid rgba(74, 116, 218, 0.2)",
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: "rgba(74, 116, 218, 0.08)",
                },
                "&.Mui-selected": {
                  backgroundColor: "rgba(74, 116, 218, 0.12)",
                  color: "#4a74da",
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: "rgba(74, 116, 218, 0.18)",
                  },
                },
              },
            }}
          >
            <ToggleButton value="asc">Giá tăng dần</ToggleButton>
            <ToggleButton value="desc">Giá giảm dần</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      <Stack
        spacing={1.5}
        direction={{ xs: "column", sm: "row" }}
        justifyContent="flex-end"
      >
        <Button
          variant="outlined"
          onClick={onReset}
          disabled={loading || !hasActiveFilters}
          sx={{
            borderColor: "rgba(74, 116, 218, 0.35)",
            color: "rgba(15, 23, 42, 0.7)",
            fontWeight: 600,
            textTransform: "none",
            borderRadius: 3,
            px: 3,
          }}
        >
          Làm mới bộ lọc
        </Button>
        <Button
          variant="contained"
          onClick={onApply}
          disabled={loading || !hasFilterChanges}
          sx={{
            backgroundColor: "#4a74da",
            color: "#ffffff",
            fontWeight: 700,
            textTransform: "none",
            borderRadius: 3,
            px: 3,
            "&:hover": {
              backgroundColor: "#3b5ec8",
            },
          }}
        >
          Áp dụng
        </Button>
      </Stack>
    </Stack>
  </Box>
);

export default CourseFilters;
