import React from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import AttachmentRoundedIcon from "@mui/icons-material/AttachmentRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import UploadRoundedIcon from "@mui/icons-material/UploadRounded";

const BookingContactStep = ({
  contact,
  errors,
  onContactChange,
  summary,
  agreeTerms,
  onToggleTerms,
  onOpenTerms,
  STYLE,
  TEXT,
  formatCurrency,
  attachments = [],
  onAddAttachments,
  onRemoveAttachment,
  attachmentLimit,
  maxAttachmentSizeMb,
}) => {
  const limit = attachmentLimit ?? 5;
  const maxSize = maxAttachmentSizeMb ?? 10;

  const formatFileSize = (size) => {
    if (!Number.isFinite(size)) {
      return "";
    }
    if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
    if (size >= 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${size} B`;
  };

  const handleFileInputChange = (event) => {
    const { files } = event.target;
    if (files && onAddAttachments) {
      onAddAttachments(files);
    }
    if (event.target) {
      event.target.value = "";
    }
  };

  const attachmentHintTemplate = TEXT.messages.attachmentHint;
  const attachmentHint = attachmentHintTemplate
    ? attachmentHintTemplate
        .replace("{limit}", limit)
        .replace("{size}", maxSize)
    : `Có thể đính kèm tối đa ${limit} tệp (mỗi tệp tối đa ${maxSize}MB).`;

  return (
    <Stack spacing={3}>
      {/* Thông tin liên hệ */}
      <Stack spacing={2}>
        <TextField
          label={TEXT.form.name}
          value={contact.fullName}
          onChange={(event) => onContactChange("fullName", event.target.value)}
          error={Boolean(errors.fullName)}
          helperText={errors.fullName}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "16px",
              backgroundColor: STYLE.subtleSurface,
            },
          }}
        />
        <TextField
          label={TEXT.form.email}
          value={contact.email}
          onChange={(event) => onContactChange("email", event.target.value)}
          error={Boolean(errors.email)}
          helperText={errors.email}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "16px",
              backgroundColor: STYLE.subtleSurface,
            },
          }}
        />
        <TextField
          label={TEXT.form.phone}
          value={contact.phone}
          onChange={(event) => onContactChange("phone", event.target.value)}
          error={Boolean(errors.phone)}
          helperText={errors.phone}
          inputProps={{ inputMode: "tel" }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "16px",
              backgroundColor: STYLE.subtleSurface,
            },
          }}
        />
        <TextField
          label={TEXT.form.note}
          value={contact.note}
          onChange={(event) => onContactChange("note", event.target.value)}
          multiline
          minRows={3}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "16px",
              backgroundColor: STYLE.subtleSurface,
            },
          }}
        />

        {/* Khu vực đính kèm tệp */}
        <Stack spacing={1.5}>
          <Typography
            variant="subtitle2"
            sx={{ color: STYLE.textPrimary, fontWeight: 600 }}
          >
            {TEXT.form.attachments}
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadRoundedIcon />}
              sx={{
                textTransform: "none",
                borderRadius: "14px",
                borderColor: STYLE.border,
                color: STYLE.textPrimary,
                "&:hover": { borderColor: STYLE.accent },
              }}
            >
              {TEXT.actions.upload}
              <input
                type="file"
                hidden
                multiple
                onChange={handleFileInputChange}
              />
            </Button>
            <Typography variant="body2" sx={{ color: STYLE.textSecondary }}>
              {attachmentHint}
            </Typography>
          </Stack>

          {attachments.length > 0 && (
            <Stack spacing={1}>
              {attachments.map((item) => (
                <Stack
                  key={item.id}
                  direction="row"
                  alignItems="center"
                  spacing={1.25}
                  sx={{
                    borderRadius: "14px",
                    backgroundColor: STYLE.subtleSurface,
                    border: `1px solid ${STYLE.border}`,
                    px: 1.5,
                    py: 1,
                  }}
                >
                  <AttachmentRoundedIcon
                    sx={{ color: STYLE.accent, fontSize: 20 }}
                  />
                  <Stack sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{ color: STYLE.textPrimary, fontWeight: 500 }}
                    >
                      {item.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: STYLE.textSecondary }}
                    >
                      {formatFileSize(item.size)}
                    </Typography>
                  </Stack>
                  <IconButton
                    size="small"
                    onClick={() => onRemoveAttachment?.(item.id)}
                    sx={{
                      color: STYLE.textSecondary,
                      "&:hover": { color: STYLE.accent },
                    }}
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>

      {/* Thông tin tóm tắt đơn đặt lịch */}
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
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AssignmentTurnedInRoundedIcon sx={{ color: STYLE.accent }} />
              <Typography sx={{ color: STYLE.textPrimary, fontWeight: 600 }}>
                {TEXT.form.summaryTitle}
              </Typography>
            </Stack>
            <Stack spacing={1}>
              <Typography sx={{ color: STYLE.textSecondary }}>
                <strong>{TEXT.summary.kol}:</strong> {summary.kol}
              </Typography>
              <Typography sx={{ color: STYLE.textSecondary }}>
                <strong>{TEXT.summary.package}:</strong> {summary.package}
              </Typography>
              <Typography sx={{ color: STYLE.textSecondary }}>
                <strong>{TEXT.summary.duration}:</strong> {summary.duration}
              </Typography>
              <Typography sx={{ color: STYLE.textSecondary }}>
                <strong>{TEXT.summary.schedule}:</strong> {summary.schedule}
              </Typography>
            </Stack>
            <Divider />
            <Stack spacing={0.5}>
              <Typography sx={{ color: STYLE.textSecondary, fontWeight: 500 }}>
                {TEXT.summary.subtotal}: {formatCurrency(summary.subtotal)}
              </Typography>
              {summary.extra > 0 && (
                <Typography sx={{ color: STYLE.textSecondary }}>
                  {TEXT.summary.extraFee}: +{formatCurrency(summary.extra)}
                </Typography>
              )}
              {summary.discount > 0 && (
                <Typography sx={{ color: "#ffa1da", fontWeight: 500 }}>
                  {TEXT.summary.discount}: -{formatCurrency(summary.discount)}
                </Typography>
              )}
              <Typography
                variant="subtitle1"
                sx={{ color: STYLE.textPrimary, fontWeight: 700 }}
              >
                {TEXT.summary.total}: {formatCurrency(summary.total)}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Checkbox điều khoản */}
      <FormControlLabel
        control={
          <Checkbox
            checked={agreeTerms}
            onChange={(event) => onToggleTerms(event.target.checked)}
            sx={{
              color: STYLE.accent,
              "&.Mui-checked": { color: STYLE.accent },
            }}
          />
        }
        label={
          <Typography variant="body2" sx={{ color: STYLE.textSecondary }}>
            Tôi đồng ý với{" "}
            <Button
              variant="text"
              onClick={onOpenTerms}
              sx={{ color: STYLE.accent, textTransform: "none", p: 0 }}
            >
              {TEXT.form.terms}
            </Button>
          </Typography>
        }
      />

      {errors.terms && (
        <Alert severity="error" sx={{ borderRadius: "14px" }}>
          {errors.terms}
        </Alert>
      )}
    </Stack>
  );
};

export default BookingContactStep;
