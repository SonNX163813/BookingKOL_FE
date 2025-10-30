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

  // Định dạng kích thước tệp
  const formatFileSize = (size) => {
    if (!Number.isFinite(size)) return "";
    if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${size} B`;
  };

  // Xử lý khi chọn tệp
  const handleFileInputChange = (event) => {
    const { files } = event.target;
    if (files && onAddAttachments) onAddAttachments(files);
    if (event.target) event.target.value = "";
  };

  // Gợi ý đính kèm tệp
  const attachmentHintTemplate = TEXT.messages.attachmentHint;
  const attachmentHint = attachmentHintTemplate
    ? attachmentHintTemplate
        .replace("{limit}", limit)
        .replace("{size}", maxSize)
    : `Bạn có thể đính kèm tối đa ${limit} tệp (mỗi tệp tối đa ${maxSize}MB).`;

  return (
    <Stack spacing={3}>
      {/* 🧾 Thông tin liên hệ */}
      <Stack spacing={2}>
        <TextField
          label="Họ và tên"
          value={contact.fullName}
          onChange={(e) => onContactChange("fullName", e.target.value)}
          error={Boolean(errors.fullName)}
          helperText={errors.fullName}
          required
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "16px",
              backgroundColor: STYLE.subtleSurface,
            },
          }}
        />

        <TextField
          label="Email liên hệ"
          value={contact.email}
          onChange={(e) => onContactChange("email", e.target.value)}
          error={Boolean(errors.email)}
          helperText={errors.email}
          required
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "16px",
              backgroundColor: STYLE.subtleSurface,
            },
          }}
        />

        <TextField
          label="Số điện thoại"
          value={contact.phone}
          onChange={(e) => onContactChange("phone", e.target.value)}
          error={Boolean(errors.phone)}
          helperText={errors.phone}
          required
          inputProps={{ inputMode: "tel" }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "16px",
              backgroundColor: STYLE.subtleSurface,
            },
          }}
        />

        <TextField
          label="Địa chỉ / Khu vực"
          value={contact.location}
          onChange={(e) => onContactChange("location", e.target.value)}
          error={Boolean(errors.location)}
          helperText={errors.location}
          multiline
          minRows={3}
          required
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "16px",
              backgroundColor: STYLE.subtleSurface,
            },
          }}
        />

        <TextField
          label="Ghi chú thêm"
          value={contact.note}
          onChange={(e) => onContactChange("note", e.target.value)}
          multiline
          minRows={3}
          error={Boolean(errors.note)}
          helperText={errors.note}
          placeholder="Ví dụ: Mong muốn setup tại nhà, cần KOL hỗ trợ thiết bị..."
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "16px",
              backgroundColor: STYLE.subtleSurface,
            },
          }}
        />

        {/* 📎 Khu vực đính kèm tệp */}
        <Stack spacing={1.5}>
          <Typography
            variant="subtitle2"
            sx={{ color: STYLE.textPrimary, fontWeight: 600 }}
          >
            Tệp đính kèm (nếu có)
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
              Tải lên tệp
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

          {errors.attachments && (
            <Alert severity="error" sx={{ borderRadius: "14px" }}>
              {errors.attachments}
            </Alert>
          )}

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

      {/* 🧮 Thông tin tóm tắt đơn đặt lịch */}
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
                Tóm tắt thông tin đặt lịch
              </Typography>
            </Stack>

            <Stack spacing={1}>
              <Typography sx={{ color: STYLE.textSecondary }}>
                <strong>KOL:</strong> {summary.kol}
              </Typography>
              <Typography sx={{ color: STYLE.textSecondary }}>
                <strong>Thời lượng:</strong> {summary.duration}
              </Typography>
              <Typography sx={{ color: STYLE.textSecondary }}>
                <strong>Lịch livestream:</strong> {summary.schedule}
              </Typography>
            </Stack>

            <Divider />

            <Stack spacing={0.5}>
              <Typography sx={{ color: STYLE.textSecondary, fontWeight: 500 }}>
                Tạm tính: {formatCurrency(summary.subtotal)}
              </Typography>
              {summary.extra > 0 && (
                <Typography sx={{ color: STYLE.textSecondary }}>
                  Phụ phí thêm: +{formatCurrency(summary.extra)}
                </Typography>
              )}
              {summary.discount > 0 && (
                <Typography sx={{ color: "#ffa1da", fontWeight: 500 }}>
                  Giảm giá: -{formatCurrency(summary.discount)}
                </Typography>
              )}
              <Typography
                variant="subtitle1"
                sx={{ color: STYLE.textPrimary, fontWeight: 700 }}
              >
                Tổng cộng: {formatCurrency(summary.total)}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* ✅ Checkbox đồng ý điều khoản */}
      {/* <FormControlLabel
        control={
          <Checkbox
            checked={agreeTerms}
            onChange={(e) => onToggleTerms(e.target.checked)}
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
              điều khoản & chính sách
            </Button>
          </Typography>
        }
      /> */}

      {errors.terms && (
        <Alert severity="error" sx={{ borderRadius: "14px" }}>
          {errors.terms}
        </Alert>
      )}
    </Stack>
  );
};

export default BookingContactStep;
