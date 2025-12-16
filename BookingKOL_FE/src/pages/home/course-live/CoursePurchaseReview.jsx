import React, { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import {
  cancelCoursePurchase,
  confirmCoursePurchase,
  createCoursePurchase,
  getCoursePackageById,
} from "../../../services/course/CourseAPI";
import { BOOKING_FLOW_STYLE } from "../../../constants/bookingFlowTextStyles";
import { toast } from "react-toastify";

/* ------------------------- ĐỊNH DẠNG DỮ LIỆU ------------------------- */
const formatCurrency = (value) => {
  if (value == null) return "";
  const number = Number(value) || 0;

  return (
    new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 0,
    }).format(number) + " VND"
  );
};

const sanitizeContactValue = (value) =>
  typeof value === "string" ? value.trim() : "";

const extractErrorMessage = (error) => {
  if (!error) return "Có lỗi xảy ra, vui lòng thử lại.";
  const responseMessage = error?.response?.data?.message;
  if (Array.isArray(responseMessage)) return responseMessage.join(", ");
  if (typeof responseMessage === "string") return responseMessage;
  return error.message || "Có lỗi xảy ra, vui lòng thử lại.";
};

/* ------------------------- COMPONENT CHÍNH ------------------------- */
const CoursePurchaseReview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { coursePackageId } = useParams();

  const initialCourse = location?.state?.course ?? null;
  const initialPurchase = location?.state?.purchase ?? null;
  const initialContact = location?.state?.contact ?? {
    email: sanitizeContactValue(initialPurchase?.email),
    phone: sanitizeContactValue(initialPurchase?.phone),
  };

  const [course, setCourse] = useState(initialCourse);
  const [purchase, setPurchase] = useState(initialPurchase);
  const [loading, setLoading] = useState(!initialCourse || !initialPurchase);
  const [error, setError] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);
  const contactInfo = initialContact;

  /* ------------------------- TẢI DỮ LIỆU KHÓA HỌC ------------------------- */
  useEffect(() => {
    if (!coursePackageId) {
      setLoading(false);
      return;
    }
    if (course && purchase) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    const controller = new AbortController();

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        let nextCourse = course;
        if (!nextCourse) {
          nextCourse = await getCoursePackageById(coursePackageId, {
            signal: controller.signal,
          });
        }

        let nextPurchase = purchase;
        if (!nextPurchase) {
          const email = sanitizeContactValue(contactInfo.email);
          const phone = sanitizeContactValue(contactInfo.phone);
          if (email && phone) {
            nextPurchase = await createCoursePurchase(coursePackageId, {
              phone,
              email,
              signal: controller.signal,
            });
          }
        }

        if (isMounted && !controller.signal.aborted) {
          setCourse(nextCourse ?? null);
          setPurchase(nextPurchase ?? null);
        }
      } catch (err) {
        if (controller.signal.aborted || !isMounted) return;
        setError(extractErrorMessage(err));
      } finally {
        if (isMounted && !controller.signal.aborted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [contactInfo.email, contactInfo.phone, course, coursePackageId, purchase]);

  /* ------------------------- ĐỊNH DẠNG DỮ LIỆU HIỂN THỊ ------------------------- */
  const price = useMemo(
    () => formatCurrency(purchase?.price ?? course?.price ?? 0),
    [purchase?.price, course?.price]
  );

  const currentPrice = useMemo(
    () =>
      formatCurrency(
        purchase?.currentPrice ??
          course?.currentPrice ??
          purchase?.price ??
          course?.price ??
          0
      ),
    [
      purchase?.currentPrice,
      purchase?.price,
      course?.currentPrice,
      course?.price,
    ]
  );

  const discountLabel = useMemo(() => {
    const discountValue =
      purchase?.discount !== undefined && purchase?.discount !== null
        ? purchase?.discount
        : course?.discount;
    const discount = Number(discountValue);
    if (!Number.isFinite(discount) || discount <= 0) return "Không áp dụng";
    return `${discount}%`;
  }, [purchase?.discount, course?.discount]);

  const purchaseNumber = purchase?.purchasedCourseNumber ?? "--";
  const purchaseId = purchase?.id ?? "--";
  const contactPhone = sanitizeContactValue(contactInfo.phone) || "--";
  const purchaseEmail = purchase?.email ?? contactInfo.email ?? "--";

  const purchaseStartDate = useMemo(() => {
    if (!purchase?.startDate) return "--";
    const parsed = dayjs(purchase.startDate);
    return parsed.isValid() ? parsed.format("HH:mm:ss DD/MM/YYYY") : "--";
  }, [purchase?.startDate]);

  const courseName = course?.name ?? "Khóa học livestream";
  const courseDescription =
    typeof course?.description === "string" && course.description.trim().length
      ? course.description.trim()
      : "Khóa học này giúp bạn xây dựng chiến lược livestream hiệu quả và thương hiệu cá nhân bền vững.";

  /* ------------------------- XỬ LÝ HÀNH ĐỘNG ------------------------- */
  const handleBack = useCallback(() => navigate(-1), [navigate]);

  const handleCancel = useCallback(async () => {
    if (!purchase?.id || processingAction) return;
    try {
      setProcessingAction("cancel");
      setError(null);
      await cancelCoursePurchase(purchase.id);
      navigate("/khoa-hoc/thanh-toan/that-bai", {
        state: { course, purchase },
      });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setProcessingAction(null);
    }
  }, [course, navigate, processingAction, purchase]);

  const handleConfirm = useCallback(async () => {
    if (processingAction) return;

    const email = sanitizeContactValue(contactInfo.email);
    const phone = sanitizeContactValue(contactInfo.phone);
    if (!email) {
      toast.error("Vui lòng nhập email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Email không hợp lệ.");
      return;
    }
    if (!phone) {
      toast.error("Vui lòng nhập số điện thoại.");
      return;
    }
    if (!/^\+?\d{8,15}$/.test(phone.replace(/\s+/g, ""))) {
      toast.error("Số điện thoại không hợp lệ.");
      return;
    }

    try {
      setProcessingAction("confirm");
      setError(null);
      let nextPurchase = purchase;
      if (!nextPurchase?.id && coursePackageId) {
        nextPurchase = await createCoursePurchase(coursePackageId, {
          phone,
          email,
        });
        setPurchase(nextPurchase);
      }
      if (!nextPurchase?.id) {
        throw new Error("Không thể tạo giao dịch thanh toán.");
      }
      const payment = await confirmCoursePurchase(nextPurchase.id);
      navigate(`/khoa-hoc/thanh-toan/${encodeURIComponent(nextPurchase.id)}`, {
        state: { course, purchase: nextPurchase, payment },
      });
    } catch (err) {
      toast.error(extractErrorMessage(err));
      setProcessingAction(null);
    }
  }, [
    contactInfo,
    course,
    coursePackageId,
    navigate,
    processingAction,
    purchase,
  ]);

  const isCancelDisabled =
    loading || !purchase?.id || Boolean(processingAction);
  const isConfirmDisabled = loading || Boolean(processingAction);

  /* ------------------------- CẤU TRÚC HIỂN THỊ ------------------------- */
  const priceRows = useMemo(
    () => [
      { label: "Giá gốc", value: price },
      { label: "Giảm giá", value: discountLabel },
      { label: "Số tiền cần thanh toán", value: currentPrice, highlight: true },
    ],
    [currentPrice, discountLabel, price]
  );

  const purchaseRows = useMemo(
    () => [
      { label: "Mã yêu cầu", value: purchaseNumber },
      // { label: "Mã giao dịch", value: purchaseId },
      { label: "Số điện thoại liên hệ", value: contactPhone },
      { label: "Email nhận thông tin", value: purchaseEmail },
      { label: "Bắt đầu từ", value: purchaseStartDate },
    ],
    [contactPhone, purchaseEmail, purchaseNumber, purchaseStartDate]
  );

  /* ------------------------- GIAO DIỆN CHÍNH ------------------------- */
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
            Xác nhận mua khóa học
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
                  Đang tải thông tin đơn mua...
                </Typography>
              </Stack>
            ) : !purchase ? (
              <Stack spacing={3} alignItems="center" py={6}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: BOOKING_FLOW_STYLE.textPrimary,
                  }}
                >
                  Không tìm thấy yêu cầu mua khóa học
                </Typography>
                <Typography
                  sx={{
                    color: BOOKING_FLOW_STYLE.textSecondary,
                    textAlign: "center",
                  }}
                >
                  Vui lòng thử lại từ danh sách khóa học.
                </Typography>
              </Stack>
            ) : (
              <Stack spacing={4}>
                {/* {error && (
                  <Alert
                    severity="error"
                    sx={{ borderRadius: "18px", fontSize: 15 }}
                  >
                    {error}
                  </Alert>
                )} */}

                {/* Thông tin khóa học */}
                {/* <Stack spacing={3}>
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
                    {courseDescription}
                  </Typography>
                </Stack> */}

                {/* Chi tiết thanh toán */}
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
                      Chi tiết thanh toán
                    </Typography>
                    <Stack spacing={1.5}>
                      {priceRows.map((row) => (
                        <Stack
                          key={row.label}
                          direction="row"
                          justifyContent="space-between"
                          spacing={2}
                        >
                          <Typography
                            sx={{
                              color: BOOKING_FLOW_STYLE.textSecondary,
                              fontWeight: 500,
                            }}
                          >
                            {row.label}
                          </Typography>
                          <Typography
                            sx={{
                              color: row.highlight
                                ? BOOKING_FLOW_STYLE.accent
                                : BOOKING_FLOW_STYLE.textPrimary,
                              fontWeight: row.highlight ? 700 : 600,
                            }}
                          >
                            {row.value}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Stack>
                </Paper>

                {/* Thông tin yêu cầu */}
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
                      Thông tin yêu cầu
                    </Typography>
                    <Stack spacing={1.5}>
                      {purchaseRows.map((row) => (
                        <Stack
                          key={row.label}
                          direction="row"
                          justifyContent="space-between"
                          spacing={2}
                        >
                          <Typography
                            sx={{
                              color: BOOKING_FLOW_STYLE.textSecondary,
                              fontWeight: 500,
                            }}
                          >
                            {row.label}
                          </Typography>
                          <Typography
                            sx={{
                              color: BOOKING_FLOW_STYLE.textPrimary,
                              fontWeight: 600,
                              textAlign: "right",
                              maxWidth: "60%",
                              wordBreak: "break-word",
                            }}
                          >
                            {row.value}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Stack>
                </Paper>

                {/* Thông báo hướng dẫn */}
                <Alert
                  severity="info"
                  sx={{
                    borderRadius: "18px",
                    backgroundColor: "#eef4ff",
                    color: BOOKING_FLOW_STYLE.textPrimary,
                    fontSize: 15,
                  }}
                >
                  Nhấn <strong>Xác nhận & Thanh toán</strong> để hệ thống tạo
                  thông tin thanh toán cho khóa học của bạn. Bạn vẫn có thể hủy
                  yêu cầu trước khi thực hiện chuyển khoản.
                </Alert>

                {/* Nút hành động */}
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  justifyContent="flex-end"
                >
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleCancel}
                    disabled={isCancelDisabled}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: "16px",
                    }}
                  >
                    {processingAction === "cancel"
                      ? "Đang hủy..."
                      : "Hủy yêu cầu"}
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleConfirm}
                    disabled={isConfirmDisabled}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderRadius: "16px",
                      backgroundColor: BOOKING_FLOW_STYLE.accent,
                      "&:hover": { backgroundColor: "#3a5ec4" },
                    }}
                  >
                    {processingAction === "confirm"
                      ? "Đang xác nhận..."
                      : "Xác nhận & Thanh toán"}
                  </Button>
                </Stack>
              </Stack>
            )}
          </Paper>
        </Stack>
      </Container>
    </Box>
  );
};

export default CoursePurchaseReview;
