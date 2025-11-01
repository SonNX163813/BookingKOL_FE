import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const fieldStyle = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "16px",
    backgroundColor: "rgba(248, 250, 255, 0.9)",
  },
};

const CoursePurchaseContactDialog = ({
  open,
  contact,
  errors,
  onFieldChange,
  onSubmit,
  onClose,
  submitting = false,
}) => {
  const handleClose = () => {
    if (!submitting) {
      onClose?.();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: "28px",
          border: "1px solid rgba(74, 116, 218, 0.2)",
          boxShadow: "0 28px 64px rgba(15, 23, 42, 0.28)",
          // background:
          //   "linear-gradient(160deg, rgba(255,255,255,0.98) 0%, rgba(147,206,246,0.22) 45%, rgba(255,161,218,0.18) 100%)",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: "1.4rem",
          color: "#0f172a",
          pb: 1,
        }}
      >
        Thông tin liên hệ
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography
          sx={{ color: "rgba(15,23,42,0.72)", mb: 3, lineHeight: 1.6 }}
        >
          Vui lòng cung cấp thông tin để chúng tôi gửi hướng dẫn thanh toán và
          chăm sóc bạn tốt hơn.
        </Typography>
        <Stack spacing={2.5}>
          <TextField
            label="Email liên hệ"
            value={contact.email}
            onChange={(event) => onFieldChange?.("email", event.target.value)}
            error={Boolean(errors.email)}
            helperText={errors.email || "Ví dụ: user@example.com"}
            required
            sx={fieldStyle}
            inputProps={{ inputMode: "email" }}
          />
          <TextField
            label="Số điện thoại"
            value={contact.phone}
            onChange={(event) => onFieldChange?.("phone", event.target.value)}
            error={Boolean(errors.phone)}
            helperText={errors.phone || "Ví dụ: 08634913057"}
            required
            sx={fieldStyle}
            inputProps={{ inputMode: "tel" }}
          />
        </Stack>
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          pb: 3,
          pt: 2,
          justifyContent: "space-between",
        }}
      >
        <Button
          onClick={handleClose}
          disabled={submitting}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            color: "#4a74da",
          }}
        >
          Để sau
        </Button>
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={submitting}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 3,
            px: 3,
            bgcolor: "#4a74da",
            "&:hover": { bgcolor: "#3b5ec8" },
          }}
        >
          {submitting ? "Đang tạo yêu cầu..." : "Tiếp tục"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CoursePurchaseContactDialog;
