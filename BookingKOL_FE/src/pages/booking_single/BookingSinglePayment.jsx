import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { get } from "../../config/axios-config";
import { BOOKING_SINGLE_PAYMENT_STORAGE_KEY } from "../../constants/storageKeys";
import { BASE_URL } from "../../utils/config";

const THOI_GIAN_DEM_NGUOC = 15 * 60 * 1000; // 15 phút = 900.000 ms

const dinhDangTien = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const dinhDangThoiGianDemNguoc = (remainingMs) => {
  const tongGiay = Math.max(0, Math.ceil(remainingMs / 1000));
  const phut = Math.floor(tongGiay / 60);
  const giay = tongGiay % 60;
  return `${String(phut).padStart(2, "0")}:${String(giay).padStart(2, "0")}`;
};

const boSungHanDemNguoc = (payment) => {
  if (!payment) return null;

  const { localCountdownDeadline } = payment;
  if (localCountdownDeadline && dayjs(localCountdownDeadline).isValid()) {
    return payment;
  }

  const countdownDeadline = dayjs().add(15, "minute").toISOString();
  return {
    ...payment,
    localCountdownDeadline: countdownDeadline,
  };
};

const BookingSinglePayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [thongTinThanhToan, setThongTinThanhToan] = useState(null);
  const [thoiGianConLai, setThoiGianConLai] = useState(THOI_GIAN_DEM_NGUOC);

  // Lấy dữ liệu thanh toán từ location hoặc sessionStorage
  useEffect(() => {
    const statePayment = location.state?.payment;

    if (statePayment) {
      setThongTinThanhToan(statePayment);
      try {
        sessionStorage.setItem(
          BOOKING_SINGLE_PAYMENT_STORAGE_KEY,
          JSON.stringify({ payment: statePayment })
        );
      } catch (err) {
        console.error("Không thể lưu dữ liệu thanh toán", err);
      }
      return;
    }

    const duLieuLuu = sessionStorage.getItem(
      BOOKING_SINGLE_PAYMENT_STORAGE_KEY
    );
    if (duLieuLuu) {
      try {
        const parsed = JSON.parse(duLieuLuu);
        if (parsed?.payment) {
          setThongTinThanhToan(parsed.payment);
          return;
        }
      } catch (err) {
        console.error("Không thể đọc dữ liệu thanh toán", err);
      }
    }

    navigate("/", { replace: true });
  }, [location.state, navigate]);

  // Đếm ngược thời gian còn lại
  useEffect(() => {
    if (!thongTinThanhToan) return;

    const thoiDiemHetHan = thongTinThanhToan.expiresAt
      ? dayjs(thongTinThanhToan.expiresAt)
      : dayjs().add(15, "minute");

    const capNhatThoiGian = () => {
      const diff = thoiDiemHetHan.diff(dayjs());
      setThoiGianConLai(diff > 0 ? diff : 0);
    };

    capNhatThoiGian();
    const intervalId = setInterval(capNhatThoiGian, 1000);
    return () => clearInterval(intervalId);
  }, [thongTinThanhToan]);

  useEffect(() => {
    const contractId = thongTinThanhToan?.contractId;
    if (!contractId) return;

    let isActive = true;
    let intervalId;

    const kiemTraTrangThaiThanhToan = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/v1/payment/check/${contractId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) {
          console.error(
            "Không thể gọi API kiểm tra trạng thái thanh toán:",
            response.status
          );
          return;
        }

        const ketQua = await response.json();

        if (!isActive) return;

        const daThanhToan =
          typeof ketQua === "boolean"
            ? ketQua
            : typeof ketQua?.data === "boolean"
            ? ketQua.data
            : typeof ketQua?.isPaid === "boolean"
            ? ketQua.isPaid
            : typeof ketQua?.paid === "boolean"
            ? ketQua.paid
            : typeof ketQua?.status === "string"
            ? ketQua.status.toLowerCase() === "paid"
            : false;

        if (daThanhToan) {
          isActive = false;
          if (intervalId) clearInterval(intervalId);

          sessionStorage.removeItem(BOOKING_SINGLE_PAYMENT_STORAGE_KEY);
          toast.success("Thanh toán thành công! 🎉");
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Lỗi kiểm tra trạng thái thanh toán:", error);
      }
    };

    kiemTraTrangThaiThanhToan();
    intervalId = setInterval(kiemTraTrangThaiThanhToan, 30000);

    return () => {
      isActive = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [navigate, thongTinThanhToan?.contractId]);

  const thoiGianHetHanHienThi = useMemo(() => {
    const target = thongTinThanhToan?.expiresAt
      ? dayjs(thongTinThanhToan.expiresAt)
      : dayjs().add(15, "minute");
    return target.isValid() ? target.format("DD/MM/YYYY HH:mm:ss") : "--";
  }, [thongTinThanhToan]);

  const demNguocLabel = useMemo(
    () => dinhDangThoiGianDemNguoc(thoiGianConLai),
    [thoiGianConLai]
  );

  if (!thongTinThanhToan) return null;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
      <Stack spacing={4}>
        <Stack spacing={1} alignItems="center">
          <Typography variant="h4" fontWeight={700}>
            Thanh toán booking KOL lẻ
          </Typography>

          {/* Thời gian đếm ngược hiển thị lớn */}
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              color: "primary.main",
              letterSpacing: 1,
              mt: 1,
              textShadow: "0 2px 8px rgba(74,116,218,0.3)",
              animation: "pulse 1.5s infinite",
              "@keyframes pulse": {
                "0%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.05)" },
                "100%": { transform: "scale(1)" },
              },
            }}
          >
            {demNguocLabel}
          </Typography>

          <Typography variant="body1" color="text.secondary">
            Mã QR sẽ hết hạn vào {thoiGianHetHanHienThi}.
          </Typography>
        </Stack>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            background:
              "linear-gradient(135deg, rgba(247,249,252,0.8), rgba(255,255,255,0.9))",
          }}
        >
          <Stack spacing={4}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={{ xs: 3, md: 4 }}
            >
              {/* --- Thông tin thanh toán --- */}
              <Stack spacing={2} flex={1}>
                <Typography variant="overline" color="primary" fontWeight={600}>
                  Thông tin thanh toán
                </Typography>

                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">Số tiền</Typography>
                    <Typography fontWeight={700} color="primary">
                      {dinhDangTien(thongTinThanhToan.amount)}
                    </Typography>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between">
                    <Typography color="text.secondary">
                      Nội dung chuyển khoản
                    </Typography>
                    <Typography fontWeight={600}>
                      {thongTinThanhToan.transferContent}
                    </Typography>
                  </Stack>

                  <Divider />

                  <Stack spacing={1}>
                    <Typography color="text.secondary">
                      Chủ tài khoản
                    </Typography>
                    <Typography fontWeight={600}>
                      {thongTinThanhToan.name}
                    </Typography>
                  </Stack>

                  <Stack spacing={1}>
                    <Typography color="text.secondary">Ngân hàng</Typography>
                    <Typography fontWeight={600}>
                      {thongTinThanhToan.bank}
                    </Typography>
                  </Stack>

                  <Stack spacing={1}>
                    <Typography color="text.secondary">
                      Số tài khoản nhận
                    </Typography>
                    <Typography fontWeight={600}>
                      {thongTinThanhToan.accountNumber}
                    </Typography>
                  </Stack>
                </Stack>
              </Stack>

              <Divider
                orientation="vertical"
                flexItem
                sx={{ display: { xs: "none", md: "block" } }}
              />

              {/* --- QR Thanh toán --- */}
              <Stack
                spacing={2}
                alignItems="center"
                justifyContent="center"
                flex={1}
              >
                <Typography color="text.secondary">
                  Quét mã QR để thanh toán
                </Typography>
                <Box
                  sx={{
                    width: { xs: 220, md: 260 },
                    height: { xs: 220, md: 260 },
                    borderRadius: 3,
                    p: 2,
                    bgcolor: "background.paper",
                    boxShadow:
                      "0 24px 48px rgba(15, 23, 42, 0.08), 0 2px 8px rgba(15, 23, 42, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    component="img"
                    src={thongTinThanhToan.qrUrl}
                    alt="QR thanh toán"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Mã sẽ hết hạn sau {demNguocLabel}
                </Typography>
              </Stack>
            </Stack>

            {/* --- Cảnh báo --- */}
            <Alert severity="warning" sx={{ borderRadius: 3 }}>
              <Stack spacing={1}>
                <Typography fontWeight={600}>Lưu ý khi thanh toán</Typography>
                <Typography variant="body2">
                  - Nhập đúng <b>SỐ TIỀN</b> và <b>NỘI DUNG</b> chuyển tiền để
                  hệ thống tự động kiểm tra trong vòng 1 - 5 phút.
                </Typography>
                <Typography variant="body2">
                  - Thông tin ở trên chỉ sử dụng <b>một lần duy nhất</b>. Nếu
                  dùng lại, hệ thống sẽ không xử lý.
                </Typography>
                <Typography variant="body2">
                  - Trang web <b>không hỗ trợ hoàn tiền</b> nếu nhập sai thông
                  tin. Vui lòng kiểm tra kỹ trước khi chuyển.
                </Typography>
              </Stack>
            </Alert>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
};

export default BookingSinglePayment;
