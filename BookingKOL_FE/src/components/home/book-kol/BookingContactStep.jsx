import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import AttachmentRoundedIcon from "@mui/icons-material/AttachmentRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import UploadRoundedIcon from "@mui/icons-material/UploadRounded";
import { toast } from "react-toastify";
import provinceData from "../../../utils/province.json";

const HANOI_PROVINCE_CODE = 1;
const DEFAULT_PROVINCE_NAME = "Hà Nội";
const WARDS_ERROR_MESSAGE =
  "Không thể tải danh sách phường/xã. Vui lòng thử lại.";

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
  platformOptions = [],
  platformLoading = false,
  platformError = null,
  onReloadPlatforms,
}) => {
  const limit = attachmentLimit ?? 5;
  const maxSize = maxAttachmentSizeMb ?? 10;
  const platformHelperText =
    errors.platform ??
    (platformError ? "Lỗi tải danh sách nền tảng. Vui lòng thử lại." : "");
  const selectedPlatformOption = platformOptions.find(
    (option) => option.value === contact.platform
  );
  const isOtherSelected = selectedPlatformOption?.isOther === true;

  const [provinceName, setProvinceName] = useState("");
  const [wards, setWards] = useState([]);
  const [wardsLoading, setWardsLoading] = useState(false);
  const [wardsError, setWardsError] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [selectedWardCode, setSelectedWardCode] = useState("");

  useEffect(() => {
    setWardsLoading(true);
    setWardsError("");

    const hanoiProvince =
      Array.isArray(provinceData) &&
      provinceData.find(
        (province) => String(province?.code) === String(HANOI_PROVINCE_CODE)
      );

    if (hanoiProvince) {
      setProvinceName(hanoiProvince?.name || DEFAULT_PROVINCE_NAME);
      setWards(Array.isArray(hanoiProvince?.wards) ? hanoiProvince.wards : []);
      if (
        !Array.isArray(hanoiProvince?.wards) ||
        hanoiProvince.wards.length == 0
      ) {
        setWardsError(WARDS_ERROR_MESSAGE);
      }
    } else {
      setProvinceName(DEFAULT_PROVINCE_NAME);
      setWards([]);
      setWardsError(WARDS_ERROR_MESSAGE);
    }

    setWardsLoading(false);
  }, []);

  const selectedWard = useMemo(
    () =>
      wards.find(
        (ward) => String(ward.code) === String(selectedWardCode || "")
      ) || null,
    [selectedWardCode, wards]
  );

  useEffect(() => {
    if (selectedWardCode || !wards.length) return;
    const provinceLabel = provinceName || DEFAULT_PROVINCE_NAME;
    const target = contact.location?.trim() || "";
    if (!target) return;
    const matched = wards.find(
      (ward) => target === `${ward.name}, ${provinceLabel}`
    );
    if (matched) setSelectedWardCode(matched.code);
  }, [contact.location, provinceName, selectedWardCode, wards]);

  const buildLocation = (wardName, detail) => {
    const provinceLabel = provinceName || DEFAULT_PROVINCE_NAME;
    const wardLabel = wardName ? `${wardName}, ${provinceLabel}` : "";
    if (detail && wardLabel) return `${detail}, ${wardLabel}`;
    if (wardLabel) return wardLabel;
    return detail || "";
  };

  const handlePlatformChange = (value) => {
    onContactChange("platform", value);
    const nextOption = platformOptions.find((option) => option.value === value);
    if (!nextOption?.isOther) {
      onContactChange("platformCustom", "");
    }
  };

  const ALLOWED_EXTENSIONS = [
    ".xlsx",
    ".xls",
    ".doc",
    ".docx",
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
  ];

  const isValidFileType = (file) => {
    const name = file?.name?.toLowerCase() || "";
    return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  };
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
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // check định dạng
    const invalidFiles = fileArray.filter((file) => !isValidFileType(file));

    if (invalidFiles.length > 0) {
      // Thông báo và chặn luôn
      const message =
        TEXT.messages.attachmentTypeInvalid ||
        "Định dạng tệp không được hỗ trợ.";
      toast.error(message);

      // reset input để lần sau chọn lại
      if (event.target) event.target.value = "";
      return;
    }

    if (onAddAttachments) onAddAttachments(fileArray);

    if (event.target) event.target.value = "";
  };

  // Gợi ý đính kèm tệp
  const attachmentHintTemplate = TEXT.messages.attachmentHint;
  const attachmentHintFormat = TEXT.messages.attachmentFormat;
  const baseAttachmentHint = attachmentHintTemplate
    ? attachmentHintTemplate
        .replace("{limit}", limit)
        .replace("{size}", maxSize)
    : `Bạn có thể đính kèm tối đa ${limit} tệp (mỗi tệp tối đa ${maxSize}MB).`;
  const attachmentHint = ` ${baseAttachmentHint}`;

  return (
    <Stack spacing={3}>
      {/* 🧾 Thông tin liên hệ */}
      <Stack spacing={2}>
        <TextField
          label="Họ và tên "
          value={contact.fullName}
          onChange={(e) => onContactChange("fullName", e.target.value)}
          error={Boolean(errors.fullName)}
          helperText={errors.fullName}
          required
          InputLabelProps={{
            required: true,
            sx: {
              "& .MuiFormLabel-asterisk": {
                color: "error.main",
              },
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "16px",
              backgroundColor: STYLE.subtleSurface,
            },
          }}
        />
        <TextField
          label="Email liên hệ "
          value={contact.email}
          onChange={(e) => onContactChange("email", e.target.value)}
          error={Boolean(errors.email)}
          helperText={errors.email}
          required
          InputLabelProps={{
            required: true,
            sx: {
              "& .MuiFormLabel-asterisk": {
                color: "error.main",
              },
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "16px",
              backgroundColor: STYLE.subtleSurface,
            },
          }}
        />
        <TextField
          label="Số điện thoại "
          value={contact.phone}
          onChange={(e) => onContactChange("phone", e.target.value)}
          error={Boolean(errors.phone)}
          helperText={errors.phone}
          required
          inputProps={{ inputMode: "tel" }}
          InputLabelProps={{
            required: true,
            sx: {
              "& .MuiFormLabel-asterisk": {
                color: "error.main",
              },
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "16px",
              backgroundColor: STYLE.subtleSurface,
            },
          }}
        />
        <TextField
          label="Nền tảng livestream "
          value={contact.platform}
          onChange={(e) => handlePlatformChange(e.target.value)}
          error={Boolean(errors.platform) || Boolean(platformError)}
          helperText={platformHelperText || undefined}
          required
          select
          disabled={platformLoading && platformOptions.length === 0}
          SelectProps={{
            displayEmpty: true,
          }}
          InputLabelProps={{
            required: true,
            sx: {
              "& .MuiFormLabel-asterisk": {
                color: "error.main",
              },
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "16px",
              backgroundColor: STYLE.subtleSurface,
            },
          }}
        >
          <MenuItem value="" disabled={platformOptions.length > 0}>
            {platformLoading ? "Đang tải..." : "Chọn nền tảng"}
          </MenuItem>
          {platformOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        {platformError && onReloadPlatforms ? (
          <Button
            variant="text"
            size="small"
            onClick={onReloadPlatforms}
            sx={{ alignSelf: "flex-start", textTransform: "none", px: 0 }}
          >
            Thử tải lại danh sách nền tảng
          </Button>
        ) : null}
        {isOtherSelected ? (
          <TextField
            label="Nền tảng cụ thể "
            value={contact.platformCustom}
            onChange={(e) => onContactChange("platformCustom", e.target.value)}
            error={Boolean(errors.platformCustom)}
            helperText={errors.platformCustom}
            required
            InputLabelProps={{
              required: true,
              sx: {
                "& .MuiFormLabel-asterisk": {
                  color: "error.main",
                },
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "16px",
                backgroundColor: STYLE.subtleSurface,
              },
            }}
          />
        ) : null}
        <TextField
          label="Tỉnh / Thành phố "
          value={provinceName || "Đang tải..."}
          helperText="Dịch vụ hiện đang khả dụng tại Hà Nội"
          InputProps={{ readOnly: true }}
          error={Boolean(wardsError)}
          required
          InputLabelProps={{
            required: true,
            sx: {
              "& .MuiFormLabel-asterisk": {
                color: "error.main",
              },
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "16px",
              backgroundColor: STYLE.subtleSurface,
            },
          }}
        />
        <Autocomplete
          options={wards}
          loading={wardsLoading}
          value={selectedWard}
          onChange={(_, ward) => {
            const wardName = ward?.name || "";
            setSelectedWardCode(ward?.code || "");
            const locationLabel = buildLocation(wardName, detailAddress);
            onContactChange("location", locationLabel);
          }}
          getOptionLabel={(option) => option?.name || ""}
          isOptionEqualToValue={(option, value) =>
            String(option?.code) === String(value?.code)
          }
          noOptionsText={
            wardsLoading ? "Đang tải phường/xã..." : "Không tìm thấy phường/xã"
          }
          disabled={wardsLoading || (!wards.length && !wardsError)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Phường / Xã tại Hà Nội "
              placeholder={wardsLoading ? "Đang tải..." : "Tìm phường/xã"}
              error={Boolean(errors.location) || Boolean(wardsError)}
              helperText={errors.location || wardsError || undefined}
              required
              InputLabelProps={{
                required: true,
                sx: {
                  "& .MuiFormLabel-asterisk": {
                    color: "error.main",
                  },
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "16px",
                  backgroundColor: STYLE.subtleSurface,
                },
              }}
            />
          )}
        />

        <TextField
          label="Số nhà / Tên đường / Tòa nhà "
          value={detailAddress}
          onChange={(e) => {
            const detail = e.target.value;
            setDetailAddress(detail);
            const wardName = selectedWard?.name || "";
            const locationLabel = buildLocation(wardName, detail);
            onContactChange("location", locationLabel);
          }}
          placeholder="Ví dụ: 123 Trần Duy Hưng, Vinhomes..."
          inputProps={{ maxLength: 100 }}
          error={Boolean(errors.location) || Boolean(wardsError)}
          helperText={errors.location || wardsError || undefined}
          required
          InputLabelProps={{
            required: true,
            sx: {
              "& .MuiFormLabel-asterisk": {
                color: "error.main",
              },
            },
          }}
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
          inputProps={{ maxLength: 100 }}
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
            Tệp đính kèm{" "}
            <Typography component="span" sx={{ color: "error.main", ml: 0.25 }}>
              *
              <Typography variant="body2" sx={{ color: STYLE.textSecondary }}>
                Đính kèm thông tin sản phẩm hoặc phiên live.
              </Typography>
            </Typography>
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
                accept=".xlsx,.xls,.doc,.docx,.pdf,.jpg,.jpeg,.png"
                onChange={handleFileInputChange}
              />
            </Button>
            <Typography variant="body2" sx={{ color: STYLE.textSecondary }}>
              {attachmentHintFormat}
              <br />
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
