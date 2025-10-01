import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Button,
  IconButton,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AppSnackbar from "../../../components/UI/AppSnackbar";
import { useNavigate, useParams } from "react-router-dom";
import {
  adaptCourseMedia,
  getCoursePackageById,
} from "../../../services/course/CourseAPI";
import hotkolimg from "../../../assets/hotkol.png";
import CourseDetailHero from "../../../components/home/course-detail/CourseDetailHero";
import CourseDetailOverview from "../../../components/home/course-detail/CourseDetailOverview";
import CourseDetailLoading from "../../../components/home/course-detail/CourseDetailLoading";
import CourseDetailEmpty from "../../../components/home/course-detail/CourseDetailEmpty";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const CourseLivesteamDetail = () => {
  const navigate = useNavigate();
  const { courseId, courseName: courseSlug } = useParams();
  const fallbackCourseName = useMemo(() => {
    if (!courseSlug) {
      return null;
    }
    return courseSlug.replace(/-/g, " ");
  }, [courseSlug]);

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);

  const loadCourseDetail = useCallback(
    async (signal) => {
      if (!courseId) {
        setCourse(null);
        setError("Không tìm thấy khoá học");
        setShowErrorSnackbar(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await getCoursePackageById(courseId, { signal });
        if (!signal?.aborted) {
          setCourse(response);
        }
      } catch (err) {
        if (signal?.aborted) {
          return;
        }
        const message = err?.message ?? "Không thể tải nội dung khoá học";
        setError(message);
        setShowErrorSnackbar(true);
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
    navigate("/goi-dich-vu");
  }, [navigate]);

  const handleSnackbarRetry = useCallback(() => {
    loadCourseDetail();
  }, [loadCourseDetail]);

  const priceLabel = useMemo(() => {
    if (!course?.price) {
      return "Liên hệ";
    }

    return currencyFormatter.format(Number(course.price));
  }, [course]);

  const media = useMemo(() => adaptCourseMedia(course ?? {}), [course]);

  const courseTitle = useMemo(() => {
    if (course?.name) {
      return course.name;
    }
    return fallbackCourseName ?? "Khoá học livestream";
  }, [course, fallbackCourseName]);

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
    ? { label: "Đang mở đăng ký", color: "#00E39F" }
    : { label: "Tạm dừng đăng ký", color: "#F59E0B" };

  const discountChip =
    Number(course?.discount) > 0
      ? {
          label: `Giảm ${Math.round(Number(course.discount))}%`,
          color: "#38BDF8",
        }
      : null;

  return (
    <Box
      sx={{
        background: "radial-gradient(circle at 15% 20%, #0C1E19, #040706)",
        minHeight: "100vh",
        py: { xs: 8, md: 12 },
        color: "#E6F4EF",
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4}>
          <Button
            onClick={handleBack}
            startIcon={<ArrowBackRoundedIcon />}
            sx={{
              alignSelf: "flex-start",
              textTransform: "none",
              fontWeight: 600,
              color: "rgba(230, 244, 239, 0.82)",
              borderRadius: 2,
              border: "1px solid rgba(0, 227, 159, 0.14)",
              px: 2.5,
              py: 1,
              bgcolor: "rgba(8, 20, 17, 0.6)",
              "&:hover": {
                bgcolor: "rgba(0, 227, 159, 0.12)",
                borderColor: "rgba(0, 227, 159, 0.32)",
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

      <AppSnackbar
        open={showErrorSnackbar}
        onClose={() => setShowErrorSnackbar(false)}
        severity="error"
        message={error ?? "Không thể kết nối tới máy chủ"}
        action={
          <IconButton
            size="small"
            aria-label="retry"
            color="inherit"
            onClick={() => {
              setShowErrorSnackbar(false);
              handleSnackbarRetry();
            }}
            sx={{ mr: 1 }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Thử lại
            </Typography>
          </IconButton>
        }
      />
    </Box>
  );
};

export default CourseLivesteamDetail;
