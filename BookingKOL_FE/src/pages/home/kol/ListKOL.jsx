import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useNavigate } from "react-router-dom";
import AppSnackbar from "../../../components/UI/AppSnackbar";
import KOLCard from "../../../components/home/kol/KOLCard";
import KolFilters from "../../../components/home/kol/KolFilters";
import { getKolProfiles } from "../../../services/kol/KolAPI";
import { getAllCategory } from "../../../services/CategoryServices";
import { slugify } from "../../../utils/slugify";
import hotkolimg from "../../../assets/hotkol.png";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const BASE_QUERY_PARAMS = {
  page: 0,
  size: 10,
};

const DEFAULT_FILTER_VALUES = Object.freeze({
  minPrice: "",
  minRating: "",
  categoryId: "",
});

const FILTER_FIELDS = ["minPrice", "minRating", "categoryId"];

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
  const params = { ...BASE_QUERY_PARAMS };

  const minPrice = parseNumericInput(filters.minPrice);
  if (minPrice !== undefined && minPrice >= 0) {
    params.minPrice = minPrice;
  }

  const minRating = parseNumericInput(filters.minRating);
  if (minRating !== undefined && minRating >= 0) {
    params.minRating = Math.min(Math.max(minRating, 0), 5);
  }

  const categoryId =
    typeof filters.categoryId === "string" ? filters.categoryId.trim() : "";
  if (categoryId) {
    params.categoryId = categoryId;
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
  const fieldFull = tooltipPieces.filter(Boolean).join(" | ");
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
    spacing={{ xs: 2, md: 3 }}
    columns={{ xs: 12, sm: 12, md: 15, lg: 20, xl: 20 }}
    justifyContent="center"
  >
    {kols.map((kol) => {
      const { slug, ...cardProps } = kol;
      return (
        <Grid
          item
          xs={12}
          sm={6}
          md={5}
          lg={4}
          xl={4}
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
  const [filters, setFilters] = useState(createDefaultFilters);
  const [formFilters, setFormFilters] = useState(createDefaultFilters);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const hasFilterChanges = useMemo(
    () => FILTER_FIELDS.some((key) => formFilters[key] !== filters[key]),
    [formFilters, filters]
  );

  const hasActiveFilters = useMemo(() => {
    const params = sanitizeFilters(filters);
    return ["minPrice", "minRating", "categoryId"].some(
      (key) => params[key] !== undefined
    );
  }, [filters]);

  const queryParams = useMemo(() => sanitizeFilters(filters), [filters]);

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

  const handleApplyFilters = useCallback(() => {
    setFilters(() => ({ ...formFilters }));
  }, [formFilters]);

  const handleResetFilters = useCallback(() => {
    const defaults = createDefaultFilters();
    setFilters(defaults);
    setFormFilters(defaults);
  }, []);

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
        const requestConfig = { params: queryParams };
        if (signal) {
          requestConfig.signal = signal;
        }
        const response = await getKolProfiles(requestConfig);
        const content = Array.isArray(response?.content)
          ? response.content
          : Array.isArray(response)
          ? response
          : [];
        setKolProfiles(content);
      } catch (err) {
        if (signal?.aborted) {
          return;
        }
        const message = err?.message ?? "Không thể tải danh sách KOL";
        setError(message);
        setShowErrorSnackbar(true);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [queryParams]
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

  const topKol = decoratedKols[0];

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
          // background: backgroundLayers,
          opacity: 0.95,
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
          <KOLListHeroSection
            onExploreTopKol={() =>
              handleNavigateDetail(topKol?.id, topKol?.slug)
            }
            hasKols={decoratedKols.length > 0}
            loading={loading}
            onManualRefresh={handleRetry}
          />

          <KolFilters
            filters={formFilters}
            onFilterInputChange={handleFilterInputChange}
            onMinRatingChange={handleMinRatingChange}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            loading={loading}
            hasActiveFilters={hasActiveFilters}
            hasFilterChanges={hasFilterChanges}
            categoryOptions={categoryOptions}
            loadingCategories={loadingCategories}
          />

          {loading ? (
            <KOLLoadingState />
          ) : decoratedKols.length === 0 ? (
            <KOLEmptyState onRetry={handleRetry} />
          ) : (
            <KOLGrid kols={decoratedKols} onSelectKol={handleNavigateDetail} />
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

export default ListKOL;
