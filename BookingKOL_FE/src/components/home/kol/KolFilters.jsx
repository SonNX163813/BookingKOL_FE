import React from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Button,
} from "@mui/material";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");

const ratingOptions = [
  { value: "5", label: "5.0" },
  { value: "4.5", label: "4.5" },
  { value: "4", label: "4.0" },
  { value: "3", label: "3.0" },
];

const KolFilters = ({
  filters,
  onFilterInputChange,
  onMinRatingChange,
  onRoleChange,
  onDateTimeChange,
  onApply,
  onReset,
  loading,
  hasActiveFilters,
  hasFilterChanges,
}) => {
  const handleDateChange = (field) => (value) => {
    const normalized =
      value && dayjs(value).isValid()
        ? dayjs(value).minute(0).second(0).millisecond(0)
        : null;
    onDateTimeChange(field, normalized);
  };

  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: { xs: 4, md: 6 },
        border: "1px solid rgba(74, 116, 218, 0.18)",
        boxShadow: "0 20px 50px rgba(74, 116, 218, 0.18)",
        backdropFilter: "blur(6px)",
        background: "#ffffff",
        p: { xs: 3, md: 5 },
        width: "100%",
        mx: "auto",
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
              label="Tìm theo tên"
              type="text"
              size="medium"
              value={filters.nameKeyword}
              onChange={onFilterInputChange("nameKeyword")}
              placeholder="Nhập tên KOL / Trợ Live"
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
            {/* <TextField
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
          /> */}
          </Stack>

          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="vi">
            <Stack spacing={1.25}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: "rgba(15,23,42,0.75)",
                  minWidth: "fit-content",
                }}
              >
                Thời gian mong muốn
              </Typography>
              <Stack spacing={1.5}>
                <DateTimePicker
                  label="Bắt đầu"
                  value={filters.startAt}
                  onChange={handleDateChange("startAt")}
                  ampm={false}
                  disablePast
                  minDateTime={dayjs()}
                  closeOnSelect
                  views={["day", "hours"]}
                  format="DD/MM/YYYY, HH[h]"
                  slotProps={{
                    actionBar: { actions: [] },
                    textField: {
                      fullWidth: true,
                      size: "medium",
                      sx: {
                        "& .MuiOutlinedInput-root": {
                          backgroundColor: "rgba(74, 116, 218, 0.05)",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            backgroundColor: "rgba(74, 116, 218, 0.09)",
                          },
                          "&.Mui-focused": {
                            backgroundColor: "#ffffff",
                            boxShadow: "0 8px 18px rgba(74, 116, 218, 0.16)",
                          },
                        },
                        "& .MuiPickersInputBase-root": {
                          borderRadius: 3,
                        },
                      },
                    },
                  }}
                  disabled={loading}
                />
                <DateTimePicker
                  label="Kết thúc"
                  value={filters.endAt}
                  onChange={handleDateChange("endAt")}
                  ampm={false}
                  disablePast
                  minDateTime={filters.startAt ?? dayjs()}
                  closeOnSelect
                  views={["day", "hours"]}
                  format="DD/MM/YYYY, HH[h]"
                  slotProps={{
                    actionBar: { actions: [] },
                    textField: {
                      fullWidth: true,
                      size: "medium",
                      sx: {
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 3,
                          backgroundColor: "rgba(74, 116, 218, 0.05)",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            backgroundColor: "rgba(74, 116, 218, 0.09)",
                          },
                          "&.Mui-focused": {
                            backgroundColor: "#ffffff",
                            boxShadow: "0 8px 18px rgba(74, 116, 218, 0.16)",
                          },
                        },
                        "& .MuiPickersInputBase-root": {
                          borderRadius: 3,
                        },
                      },
                    },
                  }}
                  disabled={loading}
                />
              </Stack>
            </Stack>
          </LocalizationProvider>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{
              flexWrap: { xs: "wrap", sm: "wrap" },
              rowGap: { xs: 2, sm: 1.5 },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: "rgba(15,23,42,0.75)",
                minWidth: "fit-content",
              }}
            >
              Vai trò
            </Typography>
            <ToggleButtonGroup
              size="medium"
              exclusive
              color="primary"
              value={filters.role || ""}
              onChange={onRoleChange}
              sx={{
                width: "100%",
                gap: { xs: 1.5, sm: 1 },
                display: "flex",
                justifyContent: "center",
                flexGrow: 1,
                "& .MuiToggleButton-root": {
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  border: "1px solid rgba(74, 116, 218, 0.2)",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  boxSizing: "border-box",
                  flex: { xs: "1 1 calc(50% - 12px)", sm: "0 0 auto" },
                  maxWidth: { xs: "calc(50% - 12px)", sm: "none" },
                  minWidth: { xs: "calc(50% - 12px)", sm: "auto" },
                  "&:hover": {
                    backgroundColor: "rgba(74, 116, 218, 0.08)",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "rgba(74, 116, 218, 0.12)",
                    color: "#4a74da",
                    // fontWeight: 700,
                    "&:hover": {
                      backgroundColor: "rgba(74, 116, 218, 0.18)",
                    },
                  },
                },
              }}
            >
              <ToggleButton value="KOL">Host chính</ToggleButton>
              <ToggleButton value="LIVE">Trợ Live</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{
              flexWrap: { xs: "wrap", sm: "wrap" },
              rowGap: { xs: 2, sm: 1.5 },
            }}
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
                gap: { xs: 1.5, sm: 1 },
                display: "flex",
                flexWrap: "wrap",
                justifyContent: { xs: "flex-start", sm: "flex-start" },
                flexGrow: 1,
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
                  boxSizing: "border-box",
                  flex: { xs: "1 1 calc(50% - 12px)", sm: "0 0 auto" },
                  maxWidth: { xs: "calc(50% - 12px)", sm: "none" },
                  minWidth: { xs: "calc(50% - 12px)", sm: "auto" },
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
          direction="column"
          justifyContent="flex-end"
          alignItems="center"
          width="100%"
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
              width: "100%",
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
              width: "100%",
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

export default KolFilters;
