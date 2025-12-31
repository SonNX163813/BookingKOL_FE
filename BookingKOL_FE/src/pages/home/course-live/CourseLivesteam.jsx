import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Chip,
  Container,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
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
  maximumFractionDigits: 0,
});

const formatPrice = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  try {
    return currencyFormatter.format(numeric);
  } catch (_error) {
    return numeric.toLocaleString("vi-VN");
  }
};

const BASE_QUERY_PARAMS = {
  page: 0,
  size: 10,
  sortBy: "price",
};

const DEFAULT_FILTER_VALUES = Object.freeze({
  name: "", // ✅ thêm trường name
  minPrice: "",
  maxPrice: "",
  minDiscount: "",
  maxDiscount: "",
  sortDir: "asc",
});

const FILTER_FIELDS = [
  "name", // ✅ thêm
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

  // ✅ name
  if (filters.name && filters.name.trim()) {
    params.name = filters.name.trim();
  }

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

const MobileCourseCard = ({ course, onSelectCourse }) => {
  const basePrice = formatPrice(course?.price);
  const promoPrice = formatPrice(course?.currentPrice);
  const hasDiscount =
    Number.isFinite(Number(course?.discount)) && Number(course.discount) > 0;
  const priceLabel = hasDiscount ? promoPrice || basePrice : basePrice;
  const fallbackLabel = priceLabel || "Liên hệ";

  const handleClick = () => {
    if (onSelectCourse) {
      onSelectCourse(course?.id, course?.slug);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <Box
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      sx={{
        position: "relative",
        display: "flex",
        gap: 1.5,
        p: 2,
        borderRadius: 3,
        border: "2px solid rgba(74, 116, 218, 0.3)",
        boxShadow: "0 14px 32px rgba(74, 116, 218, 0.16)",
        background: "linear-gradient(135deg, #ffffff 0%, #f4f6ff 100%)",
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      <Box sx={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
        <Box
          component="img"
          src={course?.cover}
          alt={course?.name}
          sx={{
            width: "100%",
            height: "100%",
            borderRadius: 2,
            objectFit: "cover",
            border: "3px solid rgba(74, 116, 218, 0.3)",
            boxShadow: "0 8px 18px rgba(15, 23, 42, 0.16)",
            backgroundColor: "#f8fafc",
          }}
          draggable={false}
        />
        {hasDiscount ? (
          <Chip
            label={`-${Number(course.discount).toLocaleString("vi-VN")}%`}
            size="small"
            sx={{
              position: "absolute",
              top: 6,
              right: 6,
              backgroundColor: "#f97316",
              color: "#fff",
              fontWeight: 700,
              borderRadius: "12px",
              height: 22,
              ".MuiChip-label": { px: 0.8, fontSize: "0.72rem" },
            }}
          />
        ) : null}
      </Box>
      <Stack spacing={0.7} sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            color: "#4a74da",
            fontWeight: 700,
            letterSpacing: 0.2,
          }}
        >
          Khóa học Livestream
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 800,
            color: "#111827",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {course?.name}
        </Typography>
        {course?.description ? (
          <Typography
            variant="body2"
            sx={{
              color: "#4b5563",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {course.description}
          </Typography>
        ) : null}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column", // ⬅️ quan trọng
            alignItems: "flex-end", // canh phải
            ml: "auto",
            mt: 0.25,
            gap: 0.2,
          }}
        >
          {/* Giá sau giảm */}
          <Typography
            variant="subtitle1"
            sx={{
              color: "#ef4179",
              fontWeight: 800,
              display: "flex",
              alignItems: "baseline",
              gap: 0.4,
            }}
          >
            {fallbackLabel}
            <Box component="span" sx={{ color: "#7c3aed", fontWeight: 700 }}>
              VND
            </Box>
          </Typography>

          {/* Giá gốc (nằm dưới) */}
          {hasDiscount && basePrice && (
            <Typography
              variant="body2"
              sx={{
                color: "#9ca3af",
                fontWeight: 600,
                textDecoration: "line-through",
              }}
            >
              {basePrice}
              <Box component="span"> VND</Box>
            </Typography>
          )}
        </Box>
      </Stack>
    </Box>
  );
};

const CourseLivesteam = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("sm"));
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

      const price = Number.isFinite(Number(course?.price))
        ? Number(course.price)
        : undefined;

      const currentPrice = Number.isFinite(Number(course?.currentPrice))
        ? Number(course.currentPrice)
        : undefined;

      const discount = Number.isFinite(Number(course?.discount))
        ? Number(course.discount)
        : 0;

      return {
        id: course?.id,
        name,
        slug,
        description,
        cover: cover ?? hotkolimg,
        price,
        currentPrice,
        discount,
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
        maxWidth={false}
        sx={{
          position: "relative",
          zIndex: 1,
          color: "#0f172a",
          maxWidth: "1400px",
        }}
      >
        <Stack spacing={6}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "minmax(260px, 320px) minmax(0, 1fr)",
                lg: "minmax(280px, 340px) minmax(0, 1fr)",
              },
              gap: { xs: 4, sm: 4.5, md: 6 },
              alignItems: "start",
            }}
          >
            <Box
              sx={{
                width: "100%",
                maxWidth: { xs: "100%", md: 320, lg: 340 },
                alignSelf: { xs: "stretch", md: "flex-start" },
                mx: { xs: "auto", md: 0 },
              }}
            >
              {/* <CourseHeroSection
                onExploreTopCourse={() =>
                  handleNavigateDetail(topCourse?.id, topCourse?.slug)
                }
                hasCourses={decoratedCourses.length > 0}
                loading={loading}
                onManualRefresh={handleRetry}
              /> */}
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
            </Box>
            <Box>
              {loading ? (
                <LoadingState />
              ) : decoratedCourses.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  {isMobile ? (
                    <Stack spacing={2.25}>
                      {decoratedCourses.map((course) => (
                        <MobileCourseCard
                          key={course.id}
                          course={course}
                          onSelectCourse={handleNavigateDetail}
                        />
                      ))}
                    </Stack>
                  ) : (
                    <CoursesGrid
                      courses={decoratedCourses}
                      onSelectCourse={handleNavigateDetail}
                    />
                  )}
                </>
              )}
            </Box>
          </Box>
        </Stack>
      </Container>

      {/* ✅ Snackbar báo lỗi */}
      {/* <AppSnackbar
        open={showErrorSnackbar}
        onClose={() => setShowErrorSnackbar(false)}
        severity="error"
        message={error}
      /> */}
    </Box>
  );
};

export default CourseLivesteam;
