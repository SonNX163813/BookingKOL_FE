import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Container, Typography, Stack, Button } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  adaptCourseMedia,
  createCoursePurchase,
  getCoursePackageById,
} from "../../../services/course/CourseAPI";
import hotkolimg from "../../../assets/hotkol.png";
import CourseDetailHero from "../../../components/home/course-detail/CourseDetailHero";
import CoursePurchaseContactDialog from "../../../components/home/course-detail/CoursePurchaseContactDialog";
import CourseDetailOverview from "../../../components/home/course-detail/CourseDetailOverview";
import CourseDetailLoading from "../../../components/home/course-detail/CourseDetailLoading";
import CourseDetailEmpty from "../../../components/home/course-detail/CourseDetailEmpty";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "react-toastify";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 0,
});

const sanitizeContactValue = (value) =>
  typeof value === "string" ? value.trim() : "";

const CourseLivesteamDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId, courseName: courseSlug } = useParams();
  const auth = useAuth?.() || {};
  const { user, token } = auth;
  const isAuthenticated = Boolean(user && token);
  const fallbackCourseName = useMemo(() => {
    if (!courseSlug) {
      return null;
    }
    return courseSlug.replace(/-/g, " ");
  }, [courseSlug]);

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingPurchase, setCreatingPurchase] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: "",
  });
  const [contactErrors, setContactErrors] = useState({
    email: "",
    phone: "",
  });

  const coursePackageId = useMemo(
    () => course?.id ?? courseId,
    [course, courseId]
  );

  const loadCourseDetail = useCallback(
    async (signal) => {
      if (!courseId) {
        setCourse(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getCoursePackageById(courseId, { signal });
        if (!signal?.aborted) {
          setCourse(response);
        }
      } catch (err) {
        if (signal?.aborted) {
          return;
        }
        console.error("Failed to load course detail", err);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [courseId]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadCourseDetail(controller.signal);
    return () => controller.abort();
  }, [loadCourseDetail]);

  const handleBack = useCallback(() => {
    navigate("/danh-sach-khoa-hoc");
  }, [navigate]);

  const validateContact = useCallback((info) => {
    const email = sanitizeContactValue(info.email);
    const phone = sanitizeContactValue(info.phone);

    const errors = {
      email: "",
      phone: "",
    };

    if (!email) {
      errors.email = "Vui lòng nhập email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Email không hợp lệ.";
    }

    if (!phone) {
      errors.phone = "Vui lòng nhập số điện thoại.";
    } else if (!/^\+?\d{8,15}$/.test(phone.replace(/\s+/g, ""))) {
      errors.phone = "Số điện thoại không hợp lệ.";
    }

    return {
      errors,
      values: { email, phone },
    };
  }, []);

  const handleContactChange = useCallback((field, value) => {
    setContactInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
    setContactErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  }, []);

  const handleOpenContactDialog = useCallback(() => {
    setContactDialogOpen(true);
  }, []);

  const handleCloseContactDialog = useCallback(() => {
    if (!creatingPurchase) {
      setContactDialogOpen(false);
    }
  }, [creatingPurchase]);

  const handlePurchaseCourse = useCallback(async () => {
    if (!coursePackageId || creatingPurchase) {
      return;
    }

    const { errors, values } = validateContact(contactInfo);
    if (errors.email || errors.phone) {
      setContactErrors(errors);
      return;
    }

    setContactErrors({
      email: "",
      phone: "",
    });
    setContactInfo(values);
    setContactDialogOpen(false);
    try {
      setCreatingPurchase(true);
      const purchase = await createCoursePurchase(coursePackageId, {
        phone: values.phone,
        email: values.email,
      });
      navigate(`/khoa-hoc/review/${encodeURIComponent(coursePackageId)}`, {
        state: {
          course,
          purchase,
          contact: values,
        },
      });
    } catch (err) {
      console.error("Failed to create course purchase", err);
    } finally {
      setCreatingPurchase(false);
    }
  }, [
    contactInfo,
    course,
    coursePackageId,
    creatingPurchase,
    navigate,
    validateContact,
  ]);

  const priceLabel = useMemo(() => {
    if (!course?.currentPrice) {
      return "Liên hệ";
    }

    return currencyFormatter.format(Number(course.currentPrice)) + " VND";
  }, [course]);

  const media = useMemo(() => adaptCourseMedia(course ?? {}), [course]);

  const courseTitle = useMemo(() => {
    if (course?.name) {
      return course.name;
    }
    return fallbackCourseName ?? "Khoá học livestream";
  }, [course, fallbackCourseName]);

  const canPurchaseCourse = useMemo(
    () => Boolean(course?.isAvailable && coursePackageId),
    [course?.isAvailable, coursePackageId]
  );

  const handlePurchaseIntent = useCallback(() => {
    if (!isAuthenticated) {
      toast.info("Vui lòng đăng nhập để tiếp tục.");
      navigate("/login", { replace: false, state: { from: location } });
      return;
    }

    if (!canPurchaseCourse) {
      return;
    }

    handleOpenContactDialog();
  }, [
    canPurchaseCourse,
    handleOpenContactDialog,
    isAuthenticated,
    location,
    navigate,
  ]);

  const coverImage = useMemo(() => media.cover ?? hotkolimg, [media]);

  const descriptionBlocks = useMemo(() => {
    if (typeof course?.description !== "string") {
      return [];
    }

    return course.description
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean);
  }, [course]);

  const keyTakeaways = useMemo(() => {
    if (typeof course?.description !== "string") {
      return [];
    }

    return course.description
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 25)
      .slice(0, 6);
  }, [course]);

  const statusChip = course?.isAvailable
    ? { label: "Đang mở đăng ký", color: "#4a74da" }
    : { label: "Tạm dừng đăng ký", color: "#f59e0b" };

  const discountChip =
    Number(course?.discount) > 0
      ? {
          label: `Giảm ${Math.round(Number(course.discount))}%`,
          color: "#4a74da",
        }
      : null;
  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        bgcolor: "#ffffff",
        overflow: "hidden",
        py: { xs: 8, md: 12 },
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: "#ffffff",
          // background:
          //   "radial-gradient(90% 90% at 12% 20%, rgba(74, 116, 218, 0.2) 0%, rgba(147, 206, 246, 0.05) 55%, rgba(147, 206, 246, 0) 85%), radial-gradient(90% 90% at 88% 15%, rgba(255, 161, 218, 0.16) 0%, rgba(255, 161, 218, 0) 70%)",
          opacity: 0.8,
        }}
      />
      <Container
        maxWidth="lg"
        sx={{
          position: "relative",
          zIndex: 1,
          color: "#0f172a",
        }}
      >
        <Stack spacing={4}>
          <Button
            onClick={handleBack}
            startIcon={<ArrowBackRoundedIcon />}
            sx={{
              alignSelf: "flex-start",
              textTransform: "none",
              fontWeight: 600,
              color: "#4a74da",
              borderRadius: 2,
              border: "1px solid rgba(74, 116, 218, 0.24)",
              px: 2.5,
              py: 1,
              bgcolor: "rgba(74, 116, 218, 0.08)",
              "&:hover": {
                bgcolor: "rgba(74, 116, 218, 0.16)",
                borderColor: "rgba(74, 116, 218, 0.32)",
              },
            }}
          >
            Trở về danh sách khoá học
          </Button>

          {loading ? (
            <CourseDetailLoading />
          ) : !course ? (
            <CourseDetailEmpty />
          ) : (
            <Stack spacing={6}>
              <CourseDetailHero
                courseTitle={courseTitle}
                priceLabel={priceLabel}
                statusChip={statusChip}
                discountChip={discountChip}
                coverImage={coverImage}
                onSeeOtherPackages={handleBack}
                onPurchase={handlePurchaseIntent}
                purchaseDisabled={!canPurchaseCourse}
                purchaseLoading={creatingPurchase}
              />
              <CourseDetailOverview
                descriptionBlocks={descriptionBlocks}
                keyTakeaways={keyTakeaways}
                media={media}
                courseTitle={courseTitle}
                coverImage={coverImage}
              />
            </Stack>
          )}
        </Stack>
      </Container>
      <CoursePurchaseContactDialog
        open={contactDialogOpen}
        contact={contactInfo}
        errors={contactErrors}
        onFieldChange={handleContactChange}
        onSubmit={handlePurchaseCourse}
        onClose={handleCloseContactDialog}
        submitting={creatingPurchase}
      />
    </Box>
  );
};

export default CourseLivesteamDetail;
