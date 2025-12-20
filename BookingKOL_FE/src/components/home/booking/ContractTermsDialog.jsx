import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { renderAsync } from "docx-preview";
import { BOOKING_FLOW_STYLE } from "../../../constants/bookingFlowTextStyles";
import { BOOKING_STATUS_LABEL } from "../../../constants/mySingleBookingStatuses";

const ContractDocPreview = ({ url }) => {
  const previewRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!url) {
      setStatus("idle");
      setError("");
      if (previewRef.current) {
        previewRef.current.innerHTML = "";
      }
      return;
    }

    let isMounted = true;

    const loadDocument = async () => {
      setStatus("loading");
      setError("");
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Không thể tải file hợp đồng.");
        }
        const buffer = await response.arrayBuffer();
        if (!previewRef.current || !isMounted) return;
        previewRef.current.innerHTML = "";
        await renderAsync(buffer, previewRef.current, undefined, {
          className: "docx-preview-content",
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: true,
          breakPages: true,
          ignoreLastRenderedPageBreak: false,
        });

        if (isMounted) {
          setStatus("ready");
        }
      } catch (loadError) {
        if (!isMounted) return;
        setStatus("error");
        setError(
          loadError?.message ||
            "Không thể hiển thị file hợp đồng. Vui lòng thử lại."
        );
      }
    };

    loadDocument();

    return () => {
      isMounted = false;
      if (previewRef.current) {
        previewRef.current.innerHTML = "";
      }
    };
  }, [url]);

  if (!url) {
    return (
      <Typography sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}>
        Không tìm thấy file hợp đồng.
      </Typography>
    );
  }

  return (
    <Box sx={{ minHeight: 260 }}>
      {status === "loading" ? (
        <Typography sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}>
          Đang tải file hợp đồng...
        </Typography>
      ) : null}
      {status === "error" ? (
        <Typography sx={{ color: "#d32f2f" }}>{error}</Typography>
      ) : null}
      <Box
        ref={previewRef}
        sx={{
          "& .docx-wrapper": { backgroundColor: "transparent" },
          "& .docx": {
            backgroundColor: "transparent",
            color: BOOKING_FLOW_STYLE.textPrimary,
          },
          "& .docx p": { color: BOOKING_FLOW_STYLE.textPrimary },
          "& p[class^='docx-preview-content-num'] > span:empty": {
            display: "none",
          },

          // Nếu muốn ẩn luôn container p
          "& p[class^='docx-preview-content-num']:has(span:empty)": {
            display: "none",
          },
        }}
      />
    </Box>
  );
};

const ContractTermsDialog = ({
  open,
  contract,
  onClose,
  onScroll,
  formatCurrency,
  acknowledgementRequired = true,
  onAcceptTerms,
  initialAccepted = false,
}) => {
  const hasContract = Boolean(contract);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const requireAcknowledgement = acknowledgementRequired !== false;
  const externalScrollHandler =
    contract?.id && typeof onScroll === "function"
      ? onScroll(contract.id)
      : undefined;

  useEffect(() => {
    if (!open) {
      setHasReachedBottom(initialAccepted || !requireAcknowledgement);
      setAcceptedTerms(initialAccepted || !requireAcknowledgement);
      return;
    }

    if (!requireAcknowledgement || initialAccepted) {
      setHasReachedBottom(true);
      setAcceptedTerms(true);
      return;
    }

    setHasReachedBottom(false);
    setAcceptedTerms(false);
  }, [open, contract?.id, requireAcknowledgement, initialAccepted]);

  const handleContentScroll = (event) => {
    if (externalScrollHandler) {
      externalScrollHandler(event);
    }
    const target = event.currentTarget;
    if (!target) return;
    const reachedBottom =
      target.scrollTop + target.clientHeight >= target.scrollHeight - 4;
    if (reachedBottom) {
      setHasReachedBottom(true);
    }
  };

  const formatCurrencyFn =
    typeof formatCurrency === "function"
      ? formatCurrency
      : (value) => value ?? "";

  const handleDialogClose = (event, reason) => {
    if (requireAcknowledgement && !acceptedTerms) return;
    if (typeof onClose === "function") {
      onClose(event, reason);
    }
  };

  const handleIconClose = () => {
    if (typeof onClose === "function") {
      onClose();
    }
  };

  const handleAgreeClick = () => {
    if (requireAcknowledgement && !acceptedTerms) return;
    if (contract?.id && typeof onAcceptTerms === "function") {
      onAcceptTerms(contract.id);
    }
    if (typeof onClose === "function") {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="contract-terms-dialog-title"
      PaperProps={{
        sx: {
          borderRadius: { xs: 3, md: 4 },
          border: `1px solid ${BOOKING_FLOW_STYLE.border}`,
        },
      }}
    >
      {hasContract ? (
        <>
          <DialogTitle
            id="contract-terms-dialog-title"
            sx={{
              pr: 7,
              py: 2.5,
              fontWeight: 700,
              borderBottom: `1px solid ${BOOKING_FLOW_STYLE.border}`,
            }}
          >
            Điều khoản hợp đồng
          </DialogTitle>

          <IconButton
            onClick={handleIconClose}
            aria-label="Đóng"
            sx={{
              position: "absolute",
              right: 12,
              top: 10,
            }}
          >
            <CloseIcon />
          </IconButton>

          <DialogContent
            dividers
            sx={{
              p: 0,
              backgroundColor: "#ffffff",
            }}
          >
            <Box
              sx={{
                maxHeight: 520,
                overflowY: "auto",
              }}
              onScroll={handleContentScroll}
            >
              <Stack spacing={2.5} sx={{ p: 3 }}>
                <Stack
                  spacing={1}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${BOOKING_FLOW_STYLE.border}`,
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }}>
                    Số hợp đồng: {contract.contractNumber}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                  >
                    Mã yêu cầu: {contract.requestNumber}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                  >
                    Trạng thái:{" "}
                    <Box
                      component="span"
                      sx={{
                        fontWeight: 600,
                        color: BOOKING_FLOW_STYLE.accent,
                      }}
                    >
                      {BOOKING_STATUS_LABEL?.[contract.status] ||
                        contract.status}
                    </Box>
                  </Typography>

                  {typeof contract.amount === "number" ? (
                    <Typography
                      variant="body2"
                      sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                    >
                      Giá thanh toán:{" "}
                      <Box
                        component="span"
                        sx={{
                          fontWeight: 700,
                          color: BOOKING_FLOW_STYLE.textPrimary,
                        }}
                      >
                        {formatCurrencyFn(contract.amount)}
                      </Box>
                    </Typography>
                  ) : null}
                </Stack>

                {contract.termLinks?.[0] ? (
                  <ContractDocPreview url={contract.termLinks[0]} />
                ) : (
                  <Typography sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}>
                    Không tìm thấy file hợp đồng để hiển thị.
                  </Typography>
                )}

                {contract.termLinks?.length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {contract.termLinks.map((url, index) => (
                      <Button
                        key={`${contract.id}-dialog-link-${index}`}
                        component="a"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        variant="outlined"
                        sx={{
                          textTransform: "none",
                          borderRadius: "12px",
                        }}
                      >
                        {contract.termLinks.length > 1
                          ? `Tải file #${index + 1}`
                          : "Tải file hợp đồng"}
                      </Button>
                    ))}
                  </Stack>
                ) : null}
              </Stack>
            </Box>
          </DialogContent>

          {requireAcknowledgement ? (
            hasReachedBottom ? (
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  borderTop: `1px solid ${BOOKING_FLOW_STYLE.border}`,
                  backgroundColor: "#f5f7ff",
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={acceptedTerms}
                      onChange={(event) =>
                        setAcceptedTerms(event.target.checked)
                      }
                      sx={{ color: BOOKING_FLOW_STYLE.accent }}
                    />
                  }
                  label={
                    <Typography sx={{ fontWeight: 500 }}>
                      Tôi đã đọc và đồng ý với các điều khoản trong hợp đồng.
                    </Typography>
                  }
                />
              </Box>
            ) : (
              <Box
                sx={{
                  px: 3,
                  py: 2,
                  borderTop: `1px solid ${BOOKING_FLOW_STYLE.border}`,
                  backgroundColor: "#fff9f0",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: BOOKING_FLOW_STYLE.textSecondary,
                    fontWeight: 500,
                  }}
                >
                  Vui lòng cuộn xuống cuối hợp đồng để có thể đồng ý với các
                  điều khoản trong hợp đồng.
                </Typography>
              </Box>
            )
          ) : null}

          <DialogActions sx={{ px: 3, py: 2, backgroundColor: "#fafbff" }}>
            <Button
              onClick={handleAgreeClick}
              disabled={requireAcknowledgement && !acceptedTerms}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "12px",
              }}
            >
              {requireAcknowledgement ? "Đóng" : "Đóng"}
            </Button>
          </DialogActions>
        </>
      ) : null}
    </Dialog>
  );
};

export default ContractTermsDialog;
