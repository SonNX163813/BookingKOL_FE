import React from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";

const ratingOptions = [
  { value: "5", label: "5.0★" },
  { value: "4.5", label: "4.5★ +" },
  { value: "4", label: "4.0★ +" },
  { value: "3", label: "3.0★ +" },
];

const KolFilters = ({
  filters,
  onFilterInputChange,
  onMinRatingChange,
  onApply,
  onReset,
  loading,
  hasActiveFilters,
  hasFilterChanges,
  categoryOptions,
  loadingCategories,
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
          Bộ lọc KOL
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "rgba(15, 23, 42, 0.65)", lineHeight: 1.6 }}
        >
          Tìm nhanh KOL phù hợp với ngân sách, lĩnh vực và chất lượng bạn mong
          muốn.
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

          <FormControl
            fullWidth
            size="medium"
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
          >
            <InputLabel id="kol-filter-category-label">
              Lĩnh vực hoạt động
            </InputLabel>
            <Select
              labelId="kol-filter-category-label"
              label="Lĩnh vực hoạt động"
              value={filters.categoryId}
              onChange={onFilterInputChange("categoryId")}
              disabled={loadingCategories && !categoryOptions.length}
            >
              <MenuItem key="kol-filter-category-all" value="">
                <em>Tất cả lĩnh vực</em>
              </MenuItem>
              {loadingCategories && (
                <MenuItem
                  key="kol-filter-category-loading"
                  value=""
                  disabled
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ py: 0.5 }}
                  >
                    <CircularProgress size={18} />
                    <Typography variant="body2">Đang tải...</Typography>
                  </Stack>
                </MenuItem>
              )}
              {categoryOptions.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
            Đánh giá tối thiểu
          </Typography>
          <ToggleButtonGroup
            size="medium"
            exclusive
            color="primary"
            value={filters.minRating || ""}
            onChange={onMinRatingChange}
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
                display: "flex",
                alignItems: "center",
                gap: 1,
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
            {ratingOptions.map((option) => (
              <ToggleButton key={option.value} value={option.value}>
                <StarRoundedIcon
                  sx={{ fontSize: 18, color: "rgba(251, 191, 36, 0.9)" }}
                />
                {option.label}
              </ToggleButton>
            ))}
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

export default KolFilters;
