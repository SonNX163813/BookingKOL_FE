import React, { useEffect, useMemo, useState, forwardRef } from "react";
import dayjs from "dayjs";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid as MuiGrid,
  InputAdornment,
  MenuItem,
  Box,
  Button as MuiButton,
  Divider as MuiDivider,
  Typography as MuiTypography,
} from "@mui/material";

/** ====== NumberFormatInput: 13 số phần nguyên; tiền/% có 2 số thập phân ====== */
const NumberFormatInput = forwardRef(function NumberFormatInput(props, ref) {
  const {
    value,
    onChange,
    inputRef,
    inputProps: _muiInputProps,
    ...other
  } = props;

  const allowDecimal =
    props.allowDecimal ?? props?.inputProps?.allowDecimal ?? false;
  const decimalScale =
    props.decimalScale ?? props?.inputProps?.decimalScale ?? 2;
  const maxIntegerDigits =
    props.maxIntegerDigits ?? props?.inputProps?.maxIntegerDigits ?? 13;

  const clampInt = (s) =>
    (s || "").replace(/\D/g, "").slice(0, Math.max(0, maxIntegerDigits));

  const display = useMemo(() => {
    if (value == null || value === "") return "";
    const str = String(value);
    const trailing = allowDecimal && str.endsWith(".");
    const [intRaw, decRaw = ""] = str.split(".");
    const intDigits = clampInt(intRaw);
    const intWithSep = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    if (!allowDecimal) return intWithSep;
    if (trailing) return `${intWithSep},`;
    const decDigits = (decRaw || "").replace(/\D/g, "").slice(0, decimalScale);
    return decDigits ? `${intWithSep},${decDigits}` : intWithSep;
  }, [value, allowDecimal, decimalScale, maxIntegerDigits]);

  const toRaw = (s) => {
    if (s == null) return "";
    let t = String(s).replace(/[^\d.,]/g, "");
    if (!allowDecimal) return clampInt(t.replace(/[.,]/g, ""));

    const endedWithComma = /,$/.test(t);
    const endedWithDot = /\.$/.test(t);

    if (t.includes(",")) {
      const [i, ...rest] = t.split(",");
      const intPart = clampInt(i.replace(/\./g, ""));
      const decJoined = rest.join("").replace(/\D/g, "");
      if (
        rest.length === 1 &&
        decJoined.length === 0 &&
        (endedWithComma || endedWithDot)
      )
        return `${intPart}.`;
      const decPart = decJoined.slice(0, decimalScale);
      return decPart ? `${intPart}.${decPart}` : intPart;
    }

    const dotCount = (t.match(/\./g) || []).length;
    if (dotCount === 1) {
      const [i, dRaw = ""] = t.split(".");
      const dDigits = dRaw.replace(/\D/g, "");
      if (dDigits.length <= decimalScale) {
        const intPart = clampInt(i.replace(/\./g, ""));
        if (dDigits.length === 0 && (endedWithDot || endedWithComma))
          return `${intPart}.`;
        const decPart = dDigits.slice(0, decimalScale);
        return decPart ? `${intPart}.${decPart}` : intPart;
      }
    }

    return clampInt(t.replace(/\./g, ""));
  };

  return (
    <input
      {...other}
      ref={inputRef || ref}
      type="text"
      autoComplete="off"
      spellCheck={false}
      value={display}
      inputMode={allowDecimal ? "decimal" : "numeric"}
      onKeyDown={(e) => {
        if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
      }}
      onChange={(e) => onChange?.({ target: { value: toRaw(e.target.value) } })}
      onPaste={(e) => {
        const text = (e.clipboardData?.getData("text") || "").trim();
        if (!text) return;
        e.preventDefault();
        onChange?.({ target: { value: toRaw(text) } });
      }}
    />
  );
});

/**
 * LivestreamMetricModal - Component tái sử dụng
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - worktimes: [{id,startAt,endAt,...}]
 * - defaultWorktimeId: string
 * - submitting: boolean
 * - initial: object (giá trị khởi tạo nếu cần)
 * - onSubmit: async (worktimeId, dto) => void   // parent xử lý gọi API + toast + refetch
 */
export default function LivestreamMetricModal({
  open,
  onClose,
  worktimes = [],
  defaultWorktimeId = "",
  submitting = false,
  initial = {},
  onSubmit,
}) {
  const [selectedWorktimeId, setSelectedWorktimeId] =
    useState(defaultWorktimeId);
  const [m, setM] = useState({
    revenue: "",
    liveViewsOver1min: "",
    viewsUnder1min: "",
    commentsIn1min: "",
    totalComments: "",
    addToCartIn1min: "",
    totalViews: "",
    avgViewDuration: "", // NHẬP BẰNG SỐ GIÂY
    pcu: "",
    productClickRate: "",
    orderConversionRate: "",
    gpm: "",
    totalOrders: "",
    buyers: "",
    avgOrderValue: "",
    productsSold: "",
    ...initial,
  });

  useEffect(() => {
    // set default worktime mỗi khi mở dialog
    if (!open) return;
    if (defaultWorktimeId) setSelectedWorktimeId(defaultWorktimeId);
    else if (worktimes?.length) setSelectedWorktimeId(worktimes[0].id);
  }, [open, defaultWorktimeId, worktimes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const wid = selectedWorktimeId || (worktimes[0]?.id ?? "");
    if (!wid) return;

    const safeDto = Object.fromEntries(
      Object.entries(m).map(([k, v]) => [
        k,
        v === "" || v == null ? 0 : Number(v),
      ])
    );

    await onSubmit?.(wid, safeDto);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Nhập số liệu Livestream</DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent dividers>
          {worktimes.length > 1 && (
            <Box mb={2}>
              <TextField
                fullWidth
                select
                label="Chọn ca livestream"
                value={selectedWorktimeId}
                onChange={(e) => setSelectedWorktimeId(e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText=" "
              >
                {worktimes.map((w) => (
                  <MenuItem key={w.id} value={w.id}>
                    {`${dayjs(w.startAt).format("HH:mm")}–${dayjs(
                      w.endAt
                    ).format("HH:mm")}, ${dayjs(w.startAt).format(
                      "DD/MM/YYYY"
                    )}`}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          )}

          <MuiTypography variant="h6" gutterBottom>
            Số liệu trong 1 phút
          </MuiTypography>
          <MuiGrid container direction="column" spacing={2}>
            {[
              { key: "liveViewsOver1min", label: "Lượt xem live > 1 phút" },
              { key: "commentsIn1min", label: "Bình luận trong 1 phút" },
              { key: "addToCartIn1min", label: "Thêm vào giỏ trong 1 phút" },
            ].map((f) => (
              <MuiGrid key={f.key} item xs={12}>
                <TextField
                  fullWidth
                  label={f.label}
                  value={m[f.key]}
                  onChange={(e) =>
                    setM((s) => ({ ...s, [f.key]: e.target.value }))
                  }
                  InputLabelProps={{ shrink: true }}
                  helperText=" "
                  InputProps={{ inputComponent: NumberFormatInput }}
                  inputProps={{
                    allowDecimal: false,
                    decimalScale: 0,
                    maxIntegerDigits: 13,
                  }}
                />
              </MuiGrid>
            ))}
          </MuiGrid>

          <MuiDivider sx={{ my: 2 }} />

          <MuiTypography variant="h6" gutterBottom>
            Tổng quan
          </MuiTypography>
          <MuiGrid container direction="column" spacing={2}>
            {[
              // 💰 tiền tệ (2 chữ số thập phân, 13 số phần nguyên)
              {
                key: "revenue",
                label: "Tổng doanh thu (VNĐ)",
                start: "₫",
                decimal: true,
                maxInt: 13,
              },
              {
                key: "gpm",
                label: "GPM (VNĐ)",
                start: "₫",
                decimal: true,
                maxInt: 13,
              },
              {
                key: "avgOrderValue",
                label: "Giá trị TB mỗi đơn (VNĐ)",
                start: "₫",
                decimal: true,
                maxInt: 13,
              },
              // 📈 đếm
              {
                key: "totalOrders",
                label: "Tổng số đơn hàng",
                decimal: false,
                maxInt: 13,
              },
              {
                key: "totalViews",
                label: "Tổng lượt xem",
                decimal: false,
                maxInt: 13,
              },
              {
                key: "viewsUnder1min",
                label: "Lượt xem < 1 phút",
                decimal: false,
                maxInt: 13,
              },
              {
                key: "pcu",
                label: "PCU (đồng xem cao nhất)",
                decimal: false,
                maxInt: 13,
              },

              // ⏱ NHẬP BẰNG SỐ GIÂY (một ô duy nhất)
              {
                key: "avgViewDuration",
                label: "Thời gian xem trung bình (giây)",
                seconds: true,
              },

              // 📣 đếm
              {
                key: "totalComments",
                label: "Tổng bình luận",
                decimal: false,
                maxInt: 13,
              },

              // % (2 chữ số thập phân, phần nguyên tối đa 3)
              {
                key: "productClickRate",
                label: "Tỷ lệ click sản phẩm (%)",
                end: "%",
                decimal: true,
                maxInt: 3,
              },
              {
                key: "orderConversionRate",
                label: "Tỷ lệ chuyển đổi đơn hàng (%)",
                end: "%",
                decimal: true,
                maxInt: 3,
              },

              // 👤 đếm
              {
                key: "buyers",
                label: "Số người mua hàng",
                decimal: false,
                maxInt: 13,
              },
              {
                key: "productsSold",
                label: "Tổng sản phẩm đã bán",
                decimal: false,
                maxInt: 13,
              },
            ].map((f) => (
              <MuiGrid key={f.key} item xs={12}>
                {f.seconds ? (
                  <TextField
                    fullWidth
                    type="number"
                    label={f.label}
                    value={m[f.key]}
                    onChange={(e) =>
                      setM((s) => ({ ...s, [f.key]: e.target.value }))
                    }
                    InputLabelProps={{ shrink: true }}
                    helperText=" "
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">giây</InputAdornment>
                      ),
                    }}
                    inputProps={{
                      step: 1,
                      min: 0,
                      inputMode: "numeric",
                      pattern: "\\d*",
                    }}
                  />
                ) : (
                  <TextField
                    fullWidth
                    label={f.label}
                    value={m[f.key]}
                    onChange={(e) =>
                      setM((s) => ({ ...s, [f.key]: e.target.value }))
                    }
                    InputLabelProps={{ shrink: true }}
                    helperText=" "
                    InputProps={{
                      inputComponent: NumberFormatInput,
                      startAdornment: f.start ? (
                        <InputAdornment position="start">
                          {f.start}
                        </InputAdornment>
                      ) : undefined,
                      endAdornment: f.end ? (
                        <InputAdornment position="end">{f.end}</InputAdornment>
                      ) : undefined,
                    }}
                    inputProps={{
                      allowDecimal: !!f.decimal,
                      decimalScale: f.decimal ? 2 : 0,
                      maxIntegerDigits: f.maxInt ?? 13,
                    }}
                  />
                )}
              </MuiGrid>
            ))}
          </MuiGrid>
        </DialogContent>

        <DialogActions>
          <MuiButton onClick={onClose}>Huỷ</MuiButton>
          <MuiButton variant="contained" type="submit" disabled={submitting}>
            Lưu số liệu
          </MuiButton>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
