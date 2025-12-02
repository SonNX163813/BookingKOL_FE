import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { confirmCoursePurchase } from "../../../services/course/CourseAPI";
import { BOOKING_FLOW_STYLE } from "../../../constants/bookingFlowTextStyles";
import { BASE_URL } from "../../../utils/config";

/* ------------------------- ĐỊNH DẠNG DỮ LIỆU ------------------------- */
const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const formatCountdown = (remainingMs) => {
  if (remainingMs === null || remainingMs === undefined) return null;
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const extractErrorMessage = (error) => {
  if (!error) return "Có lỗi xảy ra, vui lòng thử lại.";
  const responseMessage = error?.response?.data?.message;
  if (Array.isArray(responseMessage)) return responseMessage.join(", ");
  if (typeof responseMessage === "string") return responseMessage;
  return error.message || "Có lỗi xảy ra, vui lòng thử lại.";
};

/* ------------------------- COMPONENT CHÍNH ------------------------- */
const CoursePurchasePayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { purchaseId: purchaseIdParam } = useParams();

  const course = location?.state?.course ?? null;
  const purchase = location?.state?.purchase ?? null;
  const initialPayment = location?.state?.payment ?? null;

  const [payment, setPayment] = useState(initialPayment);
  const [loading, setLoading] = useState(!initialPayment);
  const [error, setError] = useState(null);
  const [countdownMs, setCountdownMs] = useState(null);
  const hasRedirectedRef = useRef(false);

  const purchaseId =
    purchase?.id ??
    (purchaseIdParam ? decodeURIComponent(purchaseIdParam) : null);

  /* ------------------------- GỌI API LẤY THÔNG TIN THANH TOÁN ------------------------- */
  useEffect(() => {
    if (!purchaseId) {
      setLoading(false);
      return;
    }
    if (payment) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const loadPayment = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await confirmCoursePurchase(purchaseId, {
          signal: controller.signal,
        });
        if (isMounted && !controller.signal.aborted) {
          setPayment(response);
        }
      } catch (err) {
        if (controller.signal.aborted || !isMounted) return;
        setError(extractErrorMessage(err));
      } finally {
        if (isMounted && !controller.signal.aborted) setLoading(false);
      }
    };

    loadPayment();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [payment, purchaseId]);

  /* ------------------------- ĐẾM NGƯỢC HẾT HẠN QR ------------------------- */
  useEffect(() => {
    if (!payment?.expiresAt) {
      setCountdownMs(null);
      return;
    }
    const deadline = dayjs(payment.expiresAt);
    if (!deadline.isValid()) {
      setCountdownMs(null);
      return;
    }

    const tick = () => {
      const diff = deadline.diff(dayjs());
      setCountdownMs(diff > 0 ? diff : 0);
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [payment?.expiresAt]);

  useEffect(() => {
    if (!purchaseId || !payment || hasRedirectedRef.current) return;

    let isActive = true;
    let intervalId;

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/v1/payment/check/course/${purchaseId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );

        if (!response.ok) {
          console.error(
            "Không thể kiểm tra trạng thái thanh toán:",
            response.status
          );
          return;
        }

        const result = await response.json();
        if (!isActive) return;

        const isPaid =
          typeof result === "boolean"
            ? result
            : typeof result?.data === "boolean"
            ? result.data
            : typeof result?.isPaid === "boolean"
            ? result.isPaid
            : typeof result?.paid === "boolean"
            ? result.paid
            : typeof result?.status === "string"
            ? result.status.toLowerCase() === "paid"
            : false;

        if (isPaid) {
          isActive = false;
          if (intervalId) clearInterval(intervalId);
          hasRedirectedRef.current = true;
          navigate("/khoa-hoc/thanh-toan/thanh-cong", {
            replace: true,
            state: { course, purchase, payment },
          });
        }
      } catch (error) {
        if (!isActive) return;
        console.error("Lỗi kiểm tra trạng thái thanh toán:", error);
      }
    };

    checkPaymentStatus();
    intervalId = setInterval(checkPaymentStatus, 5000);

    return () => {
      isActive = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [course, hasRedirectedRef, navigate, payment, purchase, purchaseId]);

  useEffect(() => {
    if (
      hasRedirectedRef.current ||
      countdownMs === null ||
      countdownMs > 0 ||
      !payment
    ) {
      return;
    }

    hasRedirectedRef.current = true;
    navigate("/khoa-hoc/thanh-toan/that-bai", {
      replace: true,
      state: { course, purchase, payment },
    });
  }, [countdownMs, course, navigate, payment, purchase]);

  const expiresLabel = useMemo(
    () => formatCountdown(countdownMs),
    [countdownMs]
  );

  /* ------------------------- DỮ LIỆU HIỂN THỊ ------------------------- */
  const amount = formatCurrency(
    payment?.amount ?? purchase?.currentPrice ?? purchase?.price ?? 0
  );
  const transferContent = payment?.transferContent ?? purchaseId ?? "--";
  const bankName = payment?.bank ?? "--";
  const accountName = payment?.name ?? "--";
  const accountNumber = payment?.accountNumber ?? "--";
  const qrUrl = payment?.qrUrl ?? null;

  const purchaseNumber = purchase?.purchasedCourseNumber ?? "--";
  const purchaseEmail = purchase?.email ?? "--";
  const purchasePhone = purchase?.phoneNumber ?? "--";
  const purchaseStartDate = useMemo(() => {
    if (!purchase?.startDate) return "--";
    const parsed = dayjs(purchase.startDate);
    return parsed.isValid() ? parsed.format("HH:mm:ss DD/MM/YYYY") : "--";
  }, [purchase?.startDate]);

  const courseName = course?.name ?? "Khóa học livestream";

  /* ------------------------- XỬ LÝ SỰ KIỆN ------------------------- */
  const handleBack = useCallback(() => navigate(-1), [navigate]);

  /* ------------------------- GIAO DIỆN ------------------------- */
  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        bgcolor: "#f5f7ff",
        py: { xs: 8, md: 12 },
        px: { xs: 2, md: 4 },
      }}
    >
      <Box
        aria-hidden
        sx={{ position: "absolute", inset: 0, backgroundColor: "#fff" }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <Stack spacing={4}>
          <Button
            onClick={handleBack}
            startIcon={<ArrowBackRoundedIcon />}
            sx={{
              alignSelf: "flex-start",
              textTransform: "none",
              fontWeight: 600,
              color: BOOKING_FLOW_STYLE.accent,
              borderRadius: "16px",
              border: `1px solid ${BOOKING_FLOW_STYLE.accent}33`,
              px: 2.5,
              py: 1,
              bgcolor: "rgba(74, 116, 218, 0.08)",
              "&:hover": {
                bgcolor: "rgba(74, 116, 218, 0.16)",
                borderColor: "rgba(74, 116, 218, 0.32)",
              },
            }}
          >
            Quay lại
          </Button>

          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: BOOKING_FLOW_STYLE.textPrimary }}
          >
            Thanh toán khóa học
          </Typography>

          <Paper
            elevation={0}
            sx={{
              borderRadius: "28px",
              border: `1px solid ${BOOKING_FLOW_STYLE.border}`,
              boxShadow: BOOKING_FLOW_STYLE.shadow,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(147,206,246,0.14) 100%)",
              p: { xs: 4, md: 5 },
            }}
          >
            {loading ? (
              <Stack spacing={3} alignItems="center" py={6}>
                <CircularProgress />
                <Typography sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}>
                  Đang tải thông tin thanh toán...
                </Typography>
              </Stack>
            ) : error ? (
              <Stack spacing={3} alignItems="center" py={6}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: BOOKING_FLOW_STYLE.textPrimary,
                  }}
                >
                  Không thể tải thông tin thanh toán
                </Typography>
                <Typography
                  sx={{
                    color: BOOKING_FLOW_STYLE.textSecondary,
                    textAlign: "center",
                    maxWidth: 420,
                  }}
                >
                  {error}
                </Typography>
                <Button variant="contained" onClick={handleBack}>
                  Quay lại
                </Button>
              </Stack>
            ) : !payment ? (
              <Stack spacing={3} alignItems="center" py={6}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: BOOKING_FLOW_STYLE.textPrimary,
                  }}
                >
                  Không tìm thấy thông tin thanh toán
                </Typography>
                <Typography sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}>
                  Vui lòng thử lại từ danh sách khóa học.
                </Typography>
              </Stack>
            ) : (
              <Stack spacing={4}>
                {/* Thông tin khóa học */}
                <Stack spacing={3}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: BOOKING_FLOW_STYLE.textPrimary,
                    }}
                  >
                    {courseName}
                  </Typography>
                  <Typography
                    sx={{
                      color: BOOKING_FLOW_STYLE.textSecondary,
                      lineHeight: 1.7,
                    }}
                  >
                    Hệ thống đã tạo thông tin thanh toán. Vui lòng chuyển khoản
                    chính xác theo hướng dẫn dưới đây.
                  </Typography>
                </Stack>

                {/* Thông tin chuyển khoản */}
                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: "22px",
                    borderColor: BOOKING_FLOW_STYLE.border,
                    bgcolor: BOOKING_FLOW_STYLE.subtleSurface,
                    px: { xs: 3, md: 4 },
                    py: { xs: 3, md: 3.5 },
                  }}
                >
                  <Stack spacing={2.5}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 600,
                        color: BOOKING_FLOW_STYLE.textPrimary,
                      }}
                    >
                      Thông tin chuyển khoản
                    </Typography>

                    <Stack spacing={1.5}>
                      <InfoRow label="Số tiền" value={amount} highlight />
                      <InfoRow
                        label="Nội dung chuyển khoản"
                        value={transferContent}
                      />
                      <Divider
                        sx={{ borderColor: `${BOOKING_FLOW_STYLE.border}99` }}
                      />
                      <InfoRow label="Ngân hàng" value={bankName} />
                      <InfoRow label="Tên tài khoản" value={accountName} />
                      <InfoRow label="Số tài khoản" value={accountNumber} />
                    </Stack>
                  </Stack>
                </Paper>

                {/* Thông tin yêu cầu */}
                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: "22px",
                    borderColor: BOOKING_FLOW_STYLE.border,
                    bgcolor: "#ffffff",
                    px: { xs: 3, md: 4 },
                    py: { xs: 3, md: 3.5 },
                  }}
                >
                  <Stack spacing={2.5}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 600,
                        color: BOOKING_FLOW_STYLE.textPrimary,
                      }}
                    >
                      Thông tin yêu cầu
                    </Typography>

                    <Stack spacing={1.5}>
                      <InfoRow label="Mã yêu cầu" value={purchaseNumber} />
                      {/* <InfoRow
                        label="Mã giao dịch"
                        value={purchaseId ?? "--"}
                      /> */}
                      <InfoRow
                        label="Email nhận thông tin"
                        value={purchaseEmail}
                      />
                      <InfoRow label="SĐT" value={purchasePhone} />
                      <InfoRow label="Bắt đầu từ" value={purchaseStartDate} />
                    </Stack>
                  </Stack>
                </Paper>

                {/* QR và hướng dẫn */}
                <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
                  <Stack spacing={2} flex={1}>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        color: BOOKING_FLOW_STYLE.textPrimary,
                      }}
                    >
                      Hướng dẫn thanh toán
                    </Typography>
                    <Stack spacing={1.25}>
                      <Typography
                        sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                      >
                        • Vui lòng không thay đổi nội dung giao dịch để hệ thống
                        tự động ghi nhận.
                      </Typography>
                      <Typography
                        sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                      >
                        • Kiểm tra kỹ số tiền trước khi thực hiện giao dịch.
                      </Typography>
                      <Typography
                        sx={{ color: BOOKING_FLOW_STYLE.textSecondary }}
                      >
                        • Liên hệ bộ phận hỗ trợ nếu gặp khó khăn trong quá
                        trình thanh toán.
                      </Typography>
                    </Stack>
                  </Stack>

                  {qrUrl && (
                    <Stack
                      spacing={2}
                      alignItems="center"
                      justifyContent="center"
                      sx={{
                        flex: 1,
                        borderRadius: "22px",
                        border: `1px dashed ${BOOKING_FLOW_STYLE.border}`,
                        bgcolor: "#ffffff",
                        px: { xs: 3, md: 4 },
                        py: { xs: 3, md: 4 },
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ color: BOOKING_FLOW_STYLE.accent }}
                      >
                        <QrCode2RoundedIcon />
                        <Typography sx={{ fontWeight: 600 }}>
                          Quét mã QR để thanh toán
                        </Typography>
                      </Stack>
                      <Box
                        component="img"
                        src={qrUrl}
                        alt="QR thanh toán"
                        sx={{
                          width: { xs: 220, md: 260 },
                          height: { xs: 220, md: 260 },
                          objectFit: "contain",
                          borderRadius: 2,
                          boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
                        }}
                      />
                      {expiresLabel && (
                        <Typography
                          sx={{
                            color:
                              countdownMs === 0
                                ? "#d03737"
                                : BOOKING_FLOW_STYLE.accent,
                            fontWeight: 700,
                          }}
                        >
                          Hết hạn sau: {expiresLabel}
                        </Typography>
                      )}
                    </Stack>
                  )}
                </Stack>

                <Alert
                  severity="warning"
                  sx={{
                    borderRadius: "18px",
                    backgroundColor: "#fff8e1",
                    color: BOOKING_FLOW_STYLE.textPrimary,
                    fontSize: 15,
                  }}
                >
                  Sau khi chuyển khoản thành công, vui lòng giữ nguyên trang
                  này. Hệ thống sẽ tự động kiểm tra và đưa bạn đến trang “Thanh
                  toán thành công” khi đã xác nhận giao dịch.
                </Alert>

                <Divider
                  sx={{ borderColor: `${BOOKING_FLOW_STYLE.border}66` }}
                />
              </Stack>
            )}
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
};

/* ------------------------- COMPONENT PHỤ ------------------------- */
const InfoRow = ({ label, value, highlight = false }) => (
  <Stack direction="row" justifyContent="space-between" spacing={2}>
    <Typography
      sx={{ color: BOOKING_FLOW_STYLE.textSecondary, fontWeight: 500 }}
    >
      {label}
    </Typography>
    <Typography
      sx={{
        color: highlight
          ? BOOKING_FLOW_STYLE.accent
          : BOOKING_FLOW_STYLE.textPrimary,
        fontWeight: highlight ? 700 : 600,
        textAlign: "right",
      }}
    >
      {value}
    </Typography>
  </Stack>
);

export default CoursePurchasePayment;
