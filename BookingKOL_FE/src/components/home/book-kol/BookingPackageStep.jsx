import React from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";

const BookingPackageStep = ({
  packageOptions,
  selectedPackageId,
  onSelectPackage,
  selectedDurationId,
  onSelectDuration,
  selectedPackage,
  selectedDuration,
  formatCurrency,
  STYLE,
  TEXT,
}) => {
  if (!packageOptions.length) {
    return (
      <Skeleton variant="rounded" height={200} sx={{ borderRadius: "16px" }} />
    );
  }

  return (
    <Stack spacing={3}>
      <FormControl fullWidth>
        <InputLabel id="booking-package">{TEXT.form.package}</InputLabel>
        <Select
          labelId="booking-package"
          label={TEXT.form.package}
          value={selectedPackageId}
          onChange={(event) => onSelectPackage(event.target.value)}
          sx={{
            backgroundColor: STYLE.subtleSurface,
            borderRadius: "16px",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: STYLE.border,
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: STYLE.accent,
            },
          }}
          MenuProps={{
            PaperProps: {
              sx: { borderRadius: "16px", boxShadow: STYLE.shadow },
            },
          }}
        >
          {packageOptions.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {selectedPackage && selectedPackage.durationOptions.length > 0 && (
        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              mb: 1,
              color: STYLE.textPrimary,
              fontWeight: 600,
            }}
          >
            {TEXT.form.duration}
          </Typography>
          <ToggleButtonGroup
            value={selectedDurationId}
            exclusive
            onChange={(_, value) => {
              if (value !== null) {
                onSelectDuration(value);
              }
            }}
            fullWidth
            sx={{
              gap: 1,
              flexWrap: "wrap",
              "& .MuiToggleButtonGroup-grouped": {
                flex: "1 1 120px",
                borderRadius: "14px",
                borderColor: "transparent",
                backgroundColor: STYLE.subtleSurface,
                color: STYLE.textPrimary,
                textTransform: "none",
                fontWeight: 500,
                "&.Mui-selected": {
                  backgroundColor: STYLE.accent,
                  color: "#fff",
                  boxShadow: STYLE.shadow,
                },
                "&:hover": {
                  backgroundColor: STYLE.accent,
                  color: "#fff",
                },
              },
            }}
          >
            {selectedPackage.durationOptions.map((option) => (
              <ToggleButton key={option.id} value={option.id}>
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      )}
      {selectedPackage && (
        <Alert
          severity="info"
          icon={<InfoRoundedIcon />}
          sx={{
            borderRadius: "16px",
            backgroundColor: "rgba(147, 206, 246, 0.24)",
            border: `1px solid ${STYLE.accentSoft}`,
            color: STYLE.textSecondary,
          }}
        >
          {selectedPackage.description ||
            "Gói phù hợp cho chiến dịch truyền thông đa nền tảng."}
        </Alert>
      )}
      {selectedPackage && (
        <Card
          variant="outlined"
          sx={{
            borderRadius: STYLE.radius,
            borderColor: STYLE.border,
            background:
              "linear-gradient(140deg, rgba(255,255,255,0.96) 0%, rgba(147,206,246,0.25) 55%, rgba(255,161,218,0.18) 100%)",
            boxShadow: STYLE.shadow,
          }}
        >
          <CardContent>
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <EventAvailableRoundedIcon sx={{ color: STYLE.accent }} />
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: STYLE.textPrimary,
                    fontWeight: 600,
                  }}
                >
                  Chi phí dự kiến
                </Typography>
              </Stack>
              <Typography
                variant="h4"
                sx={{ color: STYLE.textPrimary, fontWeight: 700 }}
              >
                {formatCurrency(
                  (selectedDuration?.price ?? selectedPackage.basePrice) +
                    (selectedDuration?.surcharge ?? 0)
                )}
              </Typography>
              {(selectedDuration?.surcharge ?? 0) > 0 && (
                <Typography variant="body2" sx={{ color: STYLE.textSecondary }}>
                  Bao gồm phụ phí {formatCurrency(selectedDuration.surcharge)}.
                </Typography>
              )}
              {selectedDuration?.description && (
                <Typography variant="body2" sx={{ color: STYLE.textSecondary }}>
                  {selectedDuration.description}
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
};

export default BookingPackageStep;
