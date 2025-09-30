import React from "react";
import { Snackbar, Alert, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import useSnackbarAnchor from "../../hook/useSnackbarAnchor";

const SNACKBAR_WIDTH = 420; // chiều rộng cố định
const SNACKBAR_MIN_HEIGHT = 72; // chiều cao tối thiểu cố định

/**
 * AppSnackbar
 * Props thường dùng:
 * - open, onClose, autoHideDuration
 * - severity: "success" | "info" | "warning" | "error"
 * - message: string | node
 * - action: node (tùy chọn)
 * - alertProps: override props/sx cho Alert nếu cần
 */
export default function AppSnackbar({
  open,
  onClose,
  autoHideDuration = 6000,
  severity = "info",
  message,
  action,
  alertProps = {},
}) {
  const anchorOrigin = useSnackbarAnchor();

  return (
    <Snackbar
      open={open}
      onClose={onClose}
      autoHideDuration={autoHideDuration}
      anchorOrigin={anchorOrigin}
      // Đảm bảo không tràn màn hình nhỏ
      sx={{
        "& .MuiPaper-root, & .MuiAlert-root": {
          width: SNACKBAR_WIDTH,
          maxWidth: "calc(100vw - 32px)",
          minHeight: SNACKBAR_MIN_HEIGHT,
        },
      }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="outlined"
        sx={{
          width: "100%",
          bgcolor: "rgba(11, 15, 14, 0.95)",
          color: "#E6F4EF",
          borderColor:
            severity === "error"
              ? "#f44336"
              : severity === "info"
              ? "#2196f3"
              : severity === "success"
              ? "#4caf50"
              : "#ff9800",
          "& .MuiAlert-icon": {
            color:
              severity === "error"
                ? "#f44336"
                : severity === "info"
                ? "#2196f3"
                : severity === "success"
                ? "#4caf50"
                : "#ff9800",
          },
          "& .MuiIconButton-root": {
            color: "#E6F4EF",
            "&:hover": {
              bgcolor:
                severity === "error"
                  ? "rgba(244, 67, 54, 0.1)"
                  : severity === "info"
                  ? "rgba(33, 150, 243, 0.1)"
                  : severity === "success"
                  ? "rgba(76, 175, 80, 0.12)"
                  : "rgba(255, 152, 0, 0.12)",
            },
          },
        }}
        action={
          action ?? (
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={onClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )
        }
        {...alertProps}
      >
        {typeof message === "string" ? (
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {message}
          </Typography>
        ) : (
          message
        )}
      </Alert>
    </Snackbar>
  );
}
