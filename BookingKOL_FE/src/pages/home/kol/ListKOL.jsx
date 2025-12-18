import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useNavigate } from "react-router-dom";
import KOLCard from "../../../components/home/kol/KOLCard";
import KolFilters from "../../../components/home/kol/KolFilters";
import {
  getKolProfiles,
  getSuggestedKolProfiles,
} from "../../../services/kol/KolAPI";
import { getAllCategory } from "../../../services/CategoryServices";
import { slugify } from "../../../utils/slugify";
import hotkolimg from "../../../assets/hotkol.png";
import { toast } from "react-toastify";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  maximumFractionDigits: 0,
});

const BASE_QUERY_PARAMS = {
  page: 0,
  size: 20,
};

const PAGE_SIZE_OPTIONS = Object.freeze([10, 20, 30]);

const DEFAULT_FILTER_VALUES = Object.freeze({
  nameKeyword: "",
  minPrice: "",
  minRating: "",
  categoryId: "",
  role: "",
  startAt: null,
  endAt: null,
});

const FILTER_FIELDS = [
  "nameKeyword",
  "minPrice",
  "minRating",
  "categoryId",
  "role",
  "startAt",
  "endAt",
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

const toIsoDateTime = (value) => {
  if (!value) {
    return undefined;
  }
  if (dayjs.isDayjs(value)) {
    return value.isValid() ? value.toISOString() : undefined;
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.toISOString() : undefined;
};

const areDateTimesEqual = (a, b) => {
  const isoA = toIsoDateTime(a);
  const isoB = toIsoDateTime(b);
  return isoA === isoB;
};

const sanitizeFilters = (rawFilters, pagination) => {
  const filters = rawFilters ?? DEFAULT_FILTER_VALUES;
  const params = { ...BASE_QUERY_PARAMS };

  if (pagination && typeof pagination === "object") {
    if (Number.isInteger(pagination.page) && pagination.page >= 0) {
      params.page = pagination.page;
    }
    if (
      typeof pagination.size === "number" &&
      Number.isFinite(pagination.size) &&
      pagination.size > 0
    ) {
      params.size = pagination.size;
    }
  }

  const minPrice = parseNumericInput(filters.minPrice);
  if (minPrice !== undefined && minPrice >= 0) {
    params.minPrice = minPrice;
  }

  const nameKeyword =
    typeof filters.nameKeyword === "string"
      ? filters.nameKeyword.trim()
      : undefined;
  if (nameKeyword) {
    params.nameKeyword = nameKeyword;
  }

  const minRating = parseNumericInput(filters.minRating);
  if (minRating !== undefined && minRating >= 0) {
    params.minRating = Math.min(Math.max(minRating, 0), 5);
  }

  const role =
    typeof filters.role === "string" ? filters.role.trim().toUpperCase() : "";
  if (role === "KOL" || role === "LIVE") {
    params.role = role;
  }

  const categoryId =
    typeof filters.categoryId === "string" ? filters.categoryId.trim() : "";
  if (categoryId) {
    params.categoryId = categoryId;
  }

  const startAtISO = toIsoDateTime(filters.startAt);
  const endAtISO = toIsoDateTime(filters.endAt);
  const now = dayjs();
  if (
    startAtISO &&
    endAtISO &&
    dayjs(endAtISO).isAfter(dayjs(startAtISO)) &&
    !dayjs(startAtISO).isBefore(now) &&
    !dayjs(endAtISO).isBefore(now)
  ) {
    params.startAt = startAtISO;
    params.endAt = endAtISO;
  }

  return params;
};

const extractCategories = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (Array.isArray(payload?.content)) {
    return payload.content;
  }
  if (Array.isArray(payload?.data?.content)) {
    return payload.data.content;
  }
  return [];
};

const formatCurrency = (value) => {
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) {
    return null;
  }

  try {
    return currencyFormatter.format(numberValue);
  } catch (error) {
    console.error("Failed to format currency", error);
    return `${numberValue.toLocaleString("vi-VN")} VND`;
  }
};

const mapKolProfileToCard = (kol) => {
  if (!kol?.id) {
    return null;
  }
  const rawRole =
    typeof kol?.role === "string" ? kol.role.trim().toUpperCase() : "";
  const role = rawRole === "LIVE" || rawRole === "KOL" ? rawRole : "";
  const categoryNames = Array.isArray(kol.categories)
    ? kol.categories.map((category) => category?.name).filter(Boolean)
    : [];
  const categoriesLabel = categoryNames.join(", ");
  const locationLabel = [kol?.city, kol?.country].filter(Boolean).join(", ");
  const rateNote =
    typeof kol?.rateCardNote === "string" ? kol.rateCardNote.trim() : "";

  const tooltipPieces = [categoriesLabel, locationLabel];
  if (rateNote) {
    tooltipPieces.push(rateNote);
  }
  // const fieldFull = tooltipPieces.filter(Boolean).join(" | ");
  const fieldFull = categoriesLabel;
  let field = fieldFull || rateNote;
  if (!field) {
    field = "Sẵn sàng hợp tác";
  }

  let price = formatCurrency(kol?.minBookingPrice);
  if (!price && rateNote) {
    price = rateNote;
  }
  if (!price) {
    price = "Liên hệ";
  }

  const rating = Number.isFinite(Number(kol?.overallRating))
    ? Number(kol.overallRating)
    : 0;
  const reviewCount = Number.isFinite(Number(kol?.feedbackCount))
    ? Number(kol.feedbackCount)
    : 0;

  const coverImage = Array.isArray(kol?.fileUsageDtos)
    ? kol.fileUsageDtos.find((usage) => usage?.isCover && usage?.file?.fileUrl)
        ?.file?.fileUrl ??
      kol.fileUsageDtos.find((usage) => usage?.file?.fileUrl)?.file?.fileUrl
    : null;

  const image =
    kol?.avatarUrl ||
    kol?.profileImage ||
    kol?.imageUrl ||
    kol?.thumbnailUrl ||
    coverImage ||
    hotkolimg;

  const slug = slugify(kol?.displayName ?? "kol") || String(kol.id);

  return {
    id: kol.id,
    name: kol.displayName ?? "Đang cập nhật",
    field,
    fieldFull: fieldFull || field,
    price,
    originalPrice: null,
    rating,
    reviewCount,
    image,
    slug,
    role,
  };
};

const KOLListHeroSection = ({
  onExploreTopKol,
  hasKols,
  loading,
  onManualRefresh,
}) => (
  <Box
    sx={{
      p: { xs: 3, md: 5 },
      borderRadius: { xs: 4, md: 5 },
      // background:
      //   "linear-gradient(135deg, rgba(74, 116, 218, 0.12), rgba(147, 206, 246, 0.08))",
      border: "1px solid rgba(74, 116, 218, 0.18)",
      boxShadow: "0 20px 50px rgba(74, 116, 218, 0.18)",
      backdropFilter: "blur(6px)",
    }}
  >
    <Stack spacing={2.5}>
      <Chip
        label="Danh sách KOL"
        sx={{
          alignSelf: "flex-start",
          bgcolor: "rgba(74, 116, 218, 0.16)",
          color: "#2f3c8c",
          fontWeight: 600,
          letterSpacing: 0.5,
        }}
      />
      <Typography
        variant="h3"
        sx={{
          fontWeight: 700,
          fontSize: { xs: "2rem", md: "3.05rem" },
          lineHeight: 1.2,
          color: "#0f172a",
        }}
      >
        Kết nối với các KOL sẵn sàng hợp tác
      </Typography>
      <Typography
        sx={{
          maxWidth: 680,
          color: "rgba(15, 23, 42, 0.7)",
          fontSize: { xs: "1rem", md: "1.08rem" },
          lineHeight: 1.7,
        }}
      >
        Tìm kiếm nhanh các chuyên gia ảnh hưởng sẵn sàng đồng hành cùng thương
        hiệu của bạn. Thông tin được cập nhật liên tục từ hệ thống đặt lịch.
      </Typography>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Button
          variant="contained"
          size="large"
          endIcon={<ArrowForwardRoundedIcon />}
          onClick={onExploreTopKol}
          disabled={!hasKols || loading}
          sx={{
            bgcolor: "#4a74da",
            color: "#ffffff",
            fontWeight: 700,
            px: { xs: 3, md: 4 },
            py: 1.2,
            textTransform: "none",
            borderRadius: 3,
            boxShadow: "0 16px 38px rgba(74, 116, 218, 0.28)",
            "&:hover": {
              bgcolor: "#3b5ec8",
              boxShadow: "0 20px 46px rgba(59, 94, 200, 0.32)",
            },
          }}
        >
          Xem KOL nổi bật
        </Button>
        <Button
          variant="outlined"
          size="large"
          onClick={onManualRefresh}
          disabled={loading}
          startIcon={<RefreshRoundedIcon />}
          sx={{
            borderColor: "rgba(74, 116, 218, 0.35)",
            color: "rgba(15, 23, 42, 0.7)",
            fontWeight: 600,
            textTransform: "none",
            px: { xs: 3, md: 4 },
            borderRadius: 3,
            "&:hover": {
              borderColor: "rgba(74, 116, 218, 0.55)",
              backgroundColor: "rgba(74, 116, 218, 0.08)",
            },
          }}
        >
          Tải lại danh sách
        </Button>
      </Stack>
    </Stack>
  </Box>
);

const SkeletonKolCard = () => (
  <Box
    sx={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      borderRadius: { xs: 3, md: 4 },
      bgcolor: "rgba(255, 255, 255, 0.9)",
      border: "1px solid rgba(148, 163, 184, 0.35)",
      boxShadow: "0 14px 36px rgba(148, 163, 184, 0.18)",
      overflow: "hidden",
      p: 2,
      gap: 2,
    }}
  >
    <Skeleton
      variant="rectangular"
      sx={{
        width: "100%",
        borderRadius: { xs: 2, md: 3 },
        aspectRatio: "4 / 5",
      }}
    />
    <Stack spacing={1.25}>
      <Skeleton variant="text" sx={{ fontSize: "1.1rem", width: "70%" }} />
      <Skeleton
        variant="rounded"
        sx={{ height: 28, width: "60%", borderRadius: 999 }}
      />
      <Skeleton variant="text" sx={{ fontSize: "0.95rem", width: "55%" }} />
      <Skeleton variant="text" sx={{ fontSize: "1.5rem", width: "45%" }} />
    </Stack>
  </Box>
);

const KOLLoadingState = () => (
  <Grid
    container
    spacing={{ xs: 2, md: 3 }}
    columns={{ xs: 12, sm: 12, md: 15, lg: 20, xl: 20 }}
    justifyContent="center"
  >
    {Array.from({ length: 6 }).map((_, index) => (
      <Grid
        item
        xs={12}
        sm={6}
        md={5}
        lg={4}
        xl={4}
        key={`kol-skeleton-${index}`}
        sx={{ display: "flex" }}
      >
        <SkeletonKolCard />
      </Grid>
    ))}
  </Grid>
);

const KOLEmptyState = ({ onRetry }) => (
  <Box
    sx={{
      textAlign: "center",
      py: 8,
      px: { xs: 3, md: 6 },
      borderRadius: { xs: 3, md: 4 },
      border: "1px dashed rgba(74, 116, 218, 0.4)",
      bgcolor: "rgba(147, 206, 246, 0.08)",
      color: "#2f3c8c",
    }}
  >
    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
      Chưa có KOL sẵn sàng
    </Typography>
    <Typography sx={{ color: "rgba(15, 23, 42, 0.66)", mb: 3 }}>
      Thử tải lại để cập nhật danh sách mới nhất.
    </Typography>
    {onRetry && (
      <Button
        variant="contained"
        onClick={onRetry}
        startIcon={<RefreshRoundedIcon />}
        sx={{
          bgcolor: "#4a74da",
          color: "#ffffff",
          fontWeight: 600,
          textTransform: "none",
          px: 3,
          "&:hover": {
            bgcolor: "#3b5ec8",
          },
        }}
      >
        Thử lại
      </Button>
    )}
  </Box>
);

const KOLGrid = ({ kols, onSelectKol }) => (
  <Grid
    container
    spacing={{ xs: 2, sm: 2.5, md: 3 }}
    justifyContent={{ xs: "center", sm: "center" }}
    alignItems="stretch"
  >
    {kols.map((kol) => {
      const { slug, ...cardProps } = kol;
      return (
        <Grid
          item
          xs={12}
          sm={6}
          md={4}
          lg={3}
          xl={3}
          key={kol.id}
          sx={{ display: "flex" }}
        >
          <KOLCard {...cardProps} onClick={() => onSelectKol(kol.id, slug)} />
        </Grid>
      );
    })}
  </Grid>
);

const backgroundLayers = `
  radial-gradient(90% 90% at 15% 50%, rgba(74, 116, 218, 0.45) 0%, rgba(147, 206, 246, 0.1) 60%, rgba(147, 206, 246, 0) 80%),
  radial-gradient(90% 90% at 85% 50%, rgba(74, 116, 218, 0.45) 0%, rgba(147, 206, 246, 0.1) 60%, rgba(147, 206, 246, 0) 80%),
  linear-gradient(180deg, rgba(147, 206, 246, 0.18) 0%, rgba(255, 255, 255, 1) 48%, rgba(147, 206, 246, 0.18) 100%)
`;

const ListKOL = () => {
  const navigate = useNavigate();
  const [kolProfiles, setKolProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
  const [page, setPage] = useState(BASE_QUERY_PARAMS.page);
  const [size, setSize] = useState(BASE_QUERY_PARAMS.size);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filters, setFilters] = useState(createDefaultFilters);
  const [formFilters, setFormFilters] = useState(createDefaultFilters);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const showErrorMessage = useCallback((message) => {
    setError(message);
    setShowErrorSnackbar(true);
  }, []);

  const hasFilterChanges = useMemo(
    () =>
      FILTER_FIELDS.some((key) => {
        if (key === "startAt" || key === "endAt") {
          return !areDateTimesEqual(formFilters[key], filters[key]);
        }
        return formFilters[key] !== filters[key];
      }),
    [formFilters, filters]
  );

  const hasActiveFilters = useMemo(() => {
    const params = sanitizeFilters(filters);
    return FILTER_FIELDS.some((key) => params[key] !== undefined);
  }, [filters]);

  const queryParams = useMemo(
    () => sanitizeFilters(filters, { page, size }),
    [filters, page, size]
  );

  const categoryOptions = useMemo(
    () =>
      categories
        .map((category) => ({
          id: category?.id ?? category?.categoryId ?? category?.key,
          name: category?.name ?? category?.categoryName ?? category?.label,
        }))
        .filter((item) => item.id && item.name),
    [categories]
  );

  const handleFilterFieldChange = useCallback((field, value) => {
    setFormFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleFilterInputChange = useCallback(
    (field) => (event) => {
      const { value } = event.target;
      handleFilterFieldChange(field, value);
    },
    [handleFilterFieldChange]
  );

  const handleMinRatingChange = useCallback(
    (_event, value) => {
      handleFilterFieldChange("minRating", value ?? "");
    },
    [handleFilterFieldChange]
  );

  const handleDateTimeChange = useCallback((field, value) => {
    setFormFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const validateDateFilters = useCallback(() => {
    const startISO = toIsoDateTime(formFilters.startAt);
    const endISO = toIsoDateTime(formFilters.endAt);
    if (!startISO && !endISO) {
      return { valid: true };
    }
    if (!startISO || !endISO) {
      toast.error("Vui lòng cung cấp đầy đủ thời gian bắt đầu và kết thúc.");
      return { valid: false };
    }
    const now = dayjs();
    if (dayjs(startISO).isBefore(now) || dayjs(endISO).isBefore(now)) {
      toast.error("Không thể chọn thời gian nằm trong quá khứ.");
      return { valid: false };
    }
    if (!dayjs(endISO).isAfter(dayjs(startISO))) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return { valid: false };
    }
    return { valid: true };
  }, [formFilters.endAt, formFilters.startAt]);

  const handleApplyFilters = useCallback(() => {
    const validation = validateDateFilters();
    if (!validation.valid) {
      return;
    }
    setError(null);
    setShowErrorSnackbar(false);
    setFilters(() => ({ ...formFilters }));
    setPage(BASE_QUERY_PARAMS.page);
  }, [formFilters, setPage, validateDateFilters]);

  const handleRoleChange = useCallback(
    (_event, value) => {
      const normalized =
        typeof value === "string" ? value.trim().toUpperCase() : "";
      const allowed = normalized === "LIVE" || normalized === "KOL";
      const nextValue = allowed ? normalized : "";
      handleFilterFieldChange("role", nextValue);
    },
    [handleFilterFieldChange]
  );

  const handleResetFilters = useCallback(() => {
    const defaults = createDefaultFilters();
    setFilters(defaults);
    setFormFilters(defaults);
    setPage(BASE_QUERY_PARAMS.page);
    setSize(BASE_QUERY_PARAMS.size);
  }, [setPage, setSize]);

  const handlePageChange = useCallback(
    (_event, value) => {
      const numericValue = Number(value);
      const nextPage = Number.isNaN(numericValue) ? 0 : numericValue - 1;
      if (nextPage < 0 || nextPage === page) {
        return;
      }
      setPage(nextPage);
    },
    [page, setPage]
  );

  const handlePageSizeChange = useCallback(
    (event) => {
      const nextSize = Number(event.target.value);
      if (!Number.isFinite(nextSize) || nextSize <= 0 || nextSize === size) {
        return;
      }
      setSize(nextSize);
      setPage(BASE_QUERY_PARAMS.page);
    },
    [size, setPage, setSize]
  );

  // useEffect(() => {
  //   let isActive = true;
  //   const fetchCategories = async () => {
  //     try {
  //       setLoadingCategories(true);
  //       const response = await getAllCategory();
  //       if (!isActive) {
  //         return;
  //       }
  //       setCategories(extractCategories(response));
  //     } catch (_error) {
  //       if (!isActive) {
  //         return;
  //       }
  //       setCategories([]);
  //     } finally {
  //       if (isActive) {
  //         setLoadingCategories(false);
  //       }
  //     }
  //   };

  //   fetchCategories();
  //   return () => {
  //     isActive = false;
  //   };
  // }, []);

  const loadKolProfiles = useCallback(
    async (signal) => {
      try {
        setLoading(true);
        setError(null);
        const { startAt, endAt, ...listParams } = queryParams;
        const isSuggestionMode = Boolean(startAt && endAt);
        const requestConfig = {
          params: isSuggestionMode
            ? { startAt, endAt, page: queryParams.page, size: queryParams.size }
            : listParams,
        };
        if (signal) {
          requestConfig.signal = signal;
        }
        const response = isSuggestionMode
          ? await getSuggestedKolProfiles(requestConfig)
          : await getKolProfiles(requestConfig);
        const content = Array.isArray(response?.content)
          ? response.content
          : Array.isArray(response)
          ? response
          : [];
        let nextTotalPages = content.length > 0 ? 1 : 0;
        let nextTotalElements = content.length;
        if (
          response &&
          typeof response === "object" &&
          !Array.isArray(response)
        ) {
          const parsedTotalPages = Number(response.totalPages);
          if (Number.isFinite(parsedTotalPages) && parsedTotalPages >= 0) {
            nextTotalPages = parsedTotalPages;
          }
          const parsedTotalElements = Number(
            response.totalElements ?? response.total ?? response.totalRecords
          );
          if (
            Number.isFinite(parsedTotalElements) &&
            parsedTotalElements >= 0
          ) {
            nextTotalElements = parsedTotalElements;
          }
        }
        if (
          nextTotalPages > 0 &&
          queryParams.page >= nextTotalPages &&
          Math.max(nextTotalPages - 1, 0) !== queryParams.page
        ) {
          setPage(Math.max(nextTotalPages - 1, 0));
        }
        setKolProfiles(content);
        setTotalPages(nextTotalPages);
        setTotalElements(nextTotalElements);
      } catch (err) {
        if (signal?.aborted) {
          return;
        }
        const rawMessage = Array.isArray(err?.response?.data?.message)
          ? err.response.data.message[0]
          : err?.response?.data?.message ?? err?.message;
        const message =
          typeof rawMessage === "string" && rawMessage.trim()
            ? rawMessage
            : "Khong the tai danh sach KOL.";
        showErrorMessage(message);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [
      queryParams,
      setKolProfiles,
      setTotalElements,
      setTotalPages,
      setPage,
      showErrorMessage,
    ]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadKolProfiles(controller.signal);
    return () => controller.abort();
  }, [loadKolProfiles]);

  const decoratedKols = useMemo(
    () =>
      kolProfiles.map(mapKolProfileToCard).filter((item) => Boolean(item?.id)),
    [kolProfiles]
  );

  const handleNavigateDetail = useCallback(
    (kolId, kolSlug) => {
      if (!kolId) {
        return;
      }
      const safeSlug = kolSlug || "kol";
      navigate(`/danh-sach-kol/${kolId}/${safeSlug}`);
    },
    [navigate]
  );

  const handleRetry = useCallback(() => {
    loadKolProfiles();
  }, [loadKolProfiles]);

  const safeTotalPages =
    totalPages > 0 ? totalPages : decoratedKols.length > 0 ? 1 : 0;
  const pageStart = totalElements > 0 ? page * size + 1 : 0;
  const pageEnd =
    totalElements > 0
      ? Math.min(totalElements, page * size + decoratedKols.length)
      : 0;

  const topKol = decoratedKols[0];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        bgcolor: "#ffffff",
        overflow: "hidden",
        py: { xs: 6, md: 6 },
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          // background: backgroundLayers,
          opacity: 0.95,
        }}
      />
      <Container
        maxWidth={false}
        sx={{
          maxWidth: "1750px",
          position: "relative",
          zIndex: 1,
          color: "#0f172a",
        }}
      >
        <Stack spacing={6}>
          {/* <KOLListHeroSection
            onExploreTopKol={() =>
              handleNavigateDetail(topKol?.id, topKol?.slug)
            }
            hasKols={decoratedKols.length > 0}
            loading={loading}
            onManualRefresh={handleRetry}
          /> */}

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
              <KolFilters
                filters={formFilters}
                onFilterInputChange={handleFilterInputChange}
                onMinRatingChange={handleMinRatingChange}
                onRoleChange={handleRoleChange}
                onDateTimeChange={handleDateTimeChange}
                onApply={handleApplyFilters}
                onReset={handleResetFilters}
                loading={loading}
                hasActiveFilters={hasActiveFilters}
                hasFilterChanges={hasFilterChanges}
                categoryOptions={categoryOptions}
                loadingCategories={loadingCategories}
              />
            </Box>

            <Box
              sx={{
                width: "100%",
                minWidth: 0,
              }}
            >
              {loading ? (
                <KOLLoadingState />
              ) : decoratedKols.length === 0 ? (
                <KOLEmptyState onRetry={handleRetry} />
              ) : (
                <Stack spacing={{ xs: 4, md: 5 }}>
                  <KOLGrid
                    kols={decoratedKols}
                    onSelectKol={handleNavigateDetail}
                  />
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={{ xs: 2, sm: 3 }}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    justifyContent="space-between"
                    sx={{
                      borderTop: "1px solid rgba(148, 163, 184, 0.25)",
                      pt: { xs: 2, sm: 3 },
                    }}
                  >
                    {totalElements > 0 ? (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "rgba(15, 23, 42, 0.7)",
                          fontWeight: 500,
                        }}
                      >
                        {/* {`Dang hien thi ${pageStart.toLocaleString(
                          "vi-VN"
                        )} - ${pageEnd.toLocaleString(
                          "vi-VN"
                        )} tren tong ${totalElements.toLocaleString(
                          "vi-VN"
                        )} KOL`} */}
                      </Typography>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "rgba(15, 23, 42, 0.6)",
                          fontWeight: 500,
                        }}
                      >
                        {/* Khong co KOL nao de hien thi. */}
                      </Typography>
                    )}

                    <Stack
                      direction="row"
                      spacing={{ xs: 1.5, sm: 2 }}
                      alignItems="center"
                      justifyContent={{ xs: "flex-start", sm: "flex-end" }}
                      sx={{ width: { xs: "100%", sm: "auto" } }}
                    >
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel id="kol-page-size-label">
                          KOL / trang
                        </InputLabel>
                        <Select
                          labelId="kol-page-size-label"
                          id="kol-page-size"
                          value={size}
                          label="KOL / trang"
                          onChange={handlePageSizeChange}
                        >
                          {PAGE_SIZE_OPTIONS.map((option) => (
                            <MenuItem key={option} value={option}>
                              {`${option.toLocaleString("vi-VN")} / trang`}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Pagination
                        count={Math.max(safeTotalPages, 1)}
                        page={page + 1}
                        onChange={handlePageChange}
                        color="primary"
                        shape="rounded"
                        showFirstButton
                        showLastButton
                      />
                    </Stack>
                  </Stack>
                </Stack>
              )}
            </Box>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default ListKOL;
