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
}) => {
  const fieldStyles = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 3,
      backgroundColor: "rgba(74, 116, 218, 0.02)",
      transition: "all 0.3s ease",
      "&:hover": {
        backgroundColor: "rgba(74, 116, 218, 0.06)",
      },
      "&.Mui-focused": {
        backgroundColor: "#ffffff",
        boxShadow: "0 4px 18px rgba(59, 94, 200, 0.16)",
      },
    },
  };

  const inputsGrid = {
    display: "grid",
    gap: { xs: 2, md: 2.5 },
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  };

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: { xs: 3, md: 4 },
        border: "1px solid rgba(74, 116, 218, 0.18)",
        boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
        backdropFilter: "blur(8px)",
        backgroundColor: "#ffffff",
        p: { xs: 3, md: 4 },
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.75,
        }}
      />
      <Stack spacing={3.5} sx={{ position: "relative", zIndex: 1 }}>
        <Stack spacing={0.5}>
          <Typography
            variant="overline"
            sx={{ fontWeight: 700, color: "#4a74da", letterSpacing: 1 }}
          >
            Quản lý khóa học
          </Typography>
        </Stack>

        <Stack spacing={3}>
          {/* ✅ Thêm filter theo tên */}
          <Box sx={inputsGrid}>
            <TextField
              label="Tên khóa học"
              placeholder="Nhập tên khóa học..."
              type="text"
              size="medium"
              value={filters.name ?? ""}
              onChange={onFilterInputChange("name")}
              fullWidth
              sx={fieldStyles}
              inputProps={{ maxLength: 200 }}
            />
          </Box>

          {/* (Bạn có thể bật lại các block min/max price, discount nếu muốn) */}
          {/* <Box sx={inputsGrid}>
            <TextField
              label="Giá tối thiểu (VND)"
              type="number"
              size="medium"
              value={filters.minPrice}
              onChange={onFilterInputChange("minPrice")}
              inputProps={{ min: 0 }}
              fullWidth
              sx={fieldStyles}
            />
            <TextField
              label="Giá tối đa (VND)"
              type="number"
              size="medium"
              value={filters.maxPrice}
              onChange={onFilterInputChange("maxPrice")}
              inputProps={{ min: 0 }}
              fullWidth
              sx={fieldStyles}
            />
          </Box>

          <Box sx={inputsGrid}>
            <TextField
              label="Giảm giá tối thiểu (%)"
              type="number"
              size="medium"
              value={filters.minDiscount}
              onChange={onFilterInputChange("minDiscount")}
              inputProps={{ min: 0, max: 100 }}
              fullWidth
              sx={fieldStyles}
            />
            <TextField
              label="Giảm giá tối đa (%)"
              type="number"
              size="medium"
              value={filters.maxDiscount}
              onChange={onFilterInputChange("maxDiscount")}
              inputProps={{ min: 0, max: 100 }}
              fullWidth
              sx={fieldStyles}
            />
          </Box> */}

          <Stack spacing={1.5}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "rgba(15,23,42,0.8)" }}
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
                width: "100%",
                flexWrap: "wrap",
                gap: 1,
                "& .MuiToggleButton-root": {
                  flex: 1,
                  minWidth: 140,
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  border: "1px solid rgba(74, 116, 218, 0.2)",
                  transition: "all 0.3s ease",
                  color: "rgba(15,23,42,0.8)",
                  "&:hover": {
                    backgroundColor: "rgba(74, 116, 218, 0.08)",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "rgba(74, 116, 218, 0.16)",
                    color: "#2f3c8c",
                    borderColor: "rgba(74, 116, 218, 0.4)",
                    "&:hover": {
                      backgroundColor: "rgba(74, 116, 218, 0.22)",
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
          spacing={1}
          direction={{ xs: "column", sm: "column" }}
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
              width: { xs: "100%", sm: "auto" },
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
              width: { xs: "100%", sm: "auto" },
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
};

export default CourseFilters;
