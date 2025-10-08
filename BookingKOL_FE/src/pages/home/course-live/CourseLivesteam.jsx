import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Container, Typography, Stack, IconButton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AppSnackbar from "../../../components/UI/AppSnackbar";
import CourseHeroSection from "../../../components/home/course/CourseHeroSection";
import CoursesGrid from "../../../components/home/course/CoursesGrid";
import CourseFilters from "../../../components/home/course/CourseFilters";
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

const BASE_QUERY_PARAMS = {
  page: 0,
  size: 10,
  sortBy: "price",
};

const DEFAULT_FILTER_VALUES = Object.freeze({
  minPrice: "",
  maxPrice: "",
  minDiscount: "",
  maxDiscount: "",
  sortDir: "asc",
});

const FILTER_FIELDS = [
  "minPrice",
  "maxPrice",
  "minDiscount",
  "maxDiscount",
  "sortDir",
];

const createDefaultFilters = () => ({
  ...DEFAULT_FILTER_VALUES,
});

const parseNumericInput = (value) => {
  const trimmed = value !== undefined ? String(value).trim() : "";
  if (!trimmed) {
    return undefined;
  }

  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const sanitizeFilters = (rawFilters) => {
  const filters = rawFilters ?? DEFAULT_FILTER_VALUES;
  const params = {
    ...BASE_QUERY_PARAMS,
    sortDir: filters.sortDir === "desc" ? "desc" : "asc",
  };

  const minPrice = parseNumericInput(filters.minPrice);
  if (minPrice !== undefined && minPrice >= 0) {
    params.minPrice = minPrice;
  }

  const maxPrice = parseNumericInput(filters.maxPrice);
  if (
    maxPrice !== undefined &&
    maxPrice >= 0 &&
    (params.minPrice === undefined || maxPrice >= params.minPrice)
  ) {
    params.maxPrice = maxPrice;
  }

  const minDiscount = parseNumericInput(filters.minDiscount);
  if (minDiscount !== undefined && minDiscount >= 0) {
    params.minDiscount = Math.min(Math.max(minDiscount, 0), 100);
  }

  const maxDiscount = parseNumericInput(filters.maxDiscount);
  if (
    maxDiscount !== undefined &&
    maxDiscount >= 0 &&
    (params.minDiscount === undefined || maxDiscount >= params.minDiscount)
  ) {
    params.maxDiscount = Math.min(Math.max(maxDiscount, 0), 100);
  }

  return params;
};

const CourseLivesteam = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [filters, setFilters] = useState(createDefaultFilters);
  const [formFilters, setFormFilters] = useState(createDefaultFilters);

  const hasFilterChanges = useMemo(
    () => FILTER_FIELDS.some((key) => formFilters[key] !== filters[key]),
    [formFilters, filters]
  );

  const hasActiveFilters = useMemo(
    () =>
      FILTER_FIELDS.some((key) => filters[key] !== DEFAULT_FILTER_VALUES[key]),
    [filters]
  );

  const handleFilterInputChange = useCallback(
    (field) => (event) => {
      const { value } = event.target;
      setFormFilters((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  const handleSortDirChange = useCallback((event, newValue) => {
    if (!newValue) {
      return;
    }
    setFormFilters((prev) => ({
      ...prev,
      sortDir: newValue,
    }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    setFilters({ ...formFilters });
  }, [formFilters]);

  const handleResetFilters = useCallback(() => {
    setFormFilters(createDefaultFilters());
    setFilters(createDefaultFilters());
  }, []);

  const loadCourses = useCallback(
    async ({ signal } = {}) => {
      try {
        setLoading(true);
        setError(null);
        const requestOptions = {
          params: sanitizeFilters(filters),
        };

        if (signal) {
          requestOptions.signal = signal;
        }

        const response = await getCoursePackages(requestOptions);
        setCourses(Array.isArray(response?.content) ? response.content : []);
      } catch (err) {
        if (signal?.aborted) {
          return;
        }
        const message = err?.message ?? "Không thể tải danh sách khóa học";
        setError(message);
        setShowErrorSnackbar(true);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [filters]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadCourses({ signal: controller.signal });
    return () => controller.abort();
  }, [loadCourses]);

  const decoratedCourses = useMemo(() => {
    return courses.map((course) => {
      const { cover } = adaptCourseMedia(course);
      const name = course?.name ?? "Khóa học livestream";
      const description =
        course?.shortDescription ??
        course?.description?.split(/\n{2,}/)?.[0] ??
        "Nâng cao khả năng livestream và chiến lược tăng trưởng bền vững.";
      const slug = slugify(name) || "khoa-hoc";

      return {
        id: course?.id,
        name,
        slug,
        priceLabel: Number.isFinite(Number(course?.price))
          ? currencyFormatter.format(Number(course.price))
          : "Liên hệ",
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

          <CourseFilters
            filters={formFilters}
            onFilterInputChange={handleFilterInputChange}
            onSortDirChange={handleSortDirChange}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            loading={loading}
            hasActiveFilters={hasActiveFilters}
            hasFilterChanges={hasFilterChanges}
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
        message={error ?? "Không thể kết nối tới máy chủ"}
        action={
          <IconButton
            size="small"
            aria-label="thử lại"
            color="inherit"
            onClick={() => {
              setShowErrorSnackbar(false);
              handleRetry();
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

export default CourseLivesteam;
