import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Container, Typography, Stack, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AppSnackbar from "../../../components/UI/AppSnackbar";
import CourseHeroSection from "../../../components/home/course/CourseHeroSection";
import CoursesGrid from "../../../components/home/course/CoursesGrid";
import {
  LoadingState,
  EmptyState,
} from "../../../components/home/course/CourseListStates";
import hotkolimg from "../../../assets/hotkol.png";
import {
  adaptCourseMedia,
  getCoursePackages,
} from "../../../services/course/CourseAPI";
import { slugify } from "../../../utils/slugify";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const CourseLivesteam = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);

  const loadCourses = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);
      const response = signal
        ? await getCoursePackages({ signal })
        : await getCoursePackages();
      setCourses(Array.isArray(response) ? response : []);
    } catch (err) {
      if (signal?.aborted) {
        return;
      }
      const message = err?.message ?? "Khong the tai danh sach khoa hoc";
      setError(message);
      setShowErrorSnackbar(true);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadCourses(controller.signal);
    return () => controller.abort();
  }, [loadCourses]);

  const decoratedCourses = useMemo(() => {
    return courses.map((course) => {
      const { cover } = adaptCourseMedia(course);
      const name = course?.name ?? "Khoa hoc livestream";
      const description =
        course?.shortDescription ??
        course?.description?.split(/\n{2,}/)?.[0] ??
        "Nang cao kha nang livestream va chien luoc tang truong ben vung.";
      const slug = slugify(name) || "khoa-hoc";

      return {
        id: course?.id,
        name,
        slug,
        priceLabel: Number.isFinite(Number(course?.price))
          ? currencyFormatter.format(Number(course.price))
          : "Lien he",
        description,
        cover: cover ?? hotkolimg,
      };
    });
  }, [courses]);

  const handleNavigateDetail = useCallback(
    (courseId, courseSlug) => {
      if (!courseId) {
        return;
      }
      const safeSlug = courseSlug || "khoa-hoc";
      navigate(`/danh-sach-khoa-hoc/${courseId}/${safeSlug}`);
    },
    [navigate]
  );

  const handleRetry = useCallback(() => {
    loadCourses();
  }, [loadCourses]);

  const topCourse = decoratedCourses[0];

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
          background:
            "radial-gradient(90% 90% at 15% 50%, rgba(74, 116, 218, 0.24) 0%, rgba(147, 206, 246, 0.06) 60%, rgba(147, 206, 246, 0) 90%), radial-gradient(90% 90% at 85% 20%, rgba(255, 161, 218, 0.18) 0%, rgba(255, 161, 218, 0) 65%)",
          opacity: 0.65,
        }}
      />
      <Container
        maxWidth="xl"
        sx={{
          position: "relative",
          zIndex: 1,
          color: "#0f172a",
        }}
      >
        <Stack spacing={6}>
          <CourseHeroSection
            onExploreTopCourse={() =>
              handleNavigateDetail(topCourse?.id, topCourse?.slug)
            }
            hasCourses={decoratedCourses.length > 0}
            loading={loading}
            onManualRefresh={handleRetry}
          />

          {loading ? (
            <LoadingState />
          ) : decoratedCourses.length === 0 ? (
            <EmptyState />
          ) : (
            <CoursesGrid
              courses={decoratedCourses}
              onSelectCourse={handleNavigateDetail}
            />
          )}
        </Stack>
      </Container>

      <AppSnackbar
        open={showErrorSnackbar}
        onClose={() => setShowErrorSnackbar(false)}
        severity="error"
        message={error ?? "Khong the ket noi toi may chu"}
        action={
          <IconButton
            size="small"
            aria-label="retry"
            color="inherit"
            onClick={() => {
              setShowErrorSnackbar(false);
              handleRetry();
            }}
            sx={{ mr: 1 }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Thu lai
            </Typography>
          </IconButton>
        }
      />
    </Box>
  );
};

export default CourseLivesteam;
