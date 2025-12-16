import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { CheckCircle } from "lucide-react";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import Diversity3RoundedIcon from "@mui/icons-material/Diversity3Rounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";

import { useNavigate } from "react-router-dom";

import { getServicePackages } from "../../services/service-package/ServicePackageAPI";

const DEFAULT_FILTERS = Object.freeze({
  search: "",
  allowKolSelection: "all",
});

const normalizePackageType = (type) =>
  type?.toLowerCase() === "vip" ? "vip" : "basic";

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "Liên hệ";
  }
  const number = Number(value) || 0;

  return (
    new Intl.NumberFormat("vi-VN", {
      maximumFractionDigits: 0,
    }).format(number) + " VND"
  );
};

const extractErrorMessage = (error) => {
  if (!error) {
    return "Không thể tải danh sách gói chiến dịch.";
  }
  const message =
    error?.response?.data?.message || error?.message || error?.toString() || "";
  if (Array.isArray(message)) {
    return message.filter(Boolean).join(" ");
  }
  return message || "Không thể tải danh sách gói chiến dịch.";
};

const PackageFilterPanel = ({
  filters,
  onSearchChange,
  onAllowKolChange,
  onReset,
  disabled,
  hasActiveFilters,
}) => {
  const fieldStyles = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 3,
      backgroundColor: "rgba(74, 116, 218, 0.02)",
      "&:hover": {
        backgroundColor: "rgba(74, 116, 218, 0.08)",
      },
      "&.Mui-focused": {
        backgroundColor: "#ffffff",
        boxShadow: "0 4px 18px rgba(59, 94, 200, 0.16)",
      },
    },
  };

  return (
    <Box
      sx={{
        borderRadius: { xs: 3, md: 4 },
        border: "1px solid rgba(74, 116, 218, 0.18)",
        boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
        backgroundColor: "#ffffff",
        p: { xs: 3, md: 4 },
        position: "sticky",
        top: { xs: 0, md: 24 },
      }}
    >
      <Stack spacing={3.5}>
        <Stack spacing={1}>
          <Typography
            variant="overline"
            sx={{ fontWeight: 700, color: "#4a74da", letterSpacing: 1 }}
          >
            Bộ lọc gói chiến dịch
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: "#0f172a", lineHeight: 1.3 }}
          >
            Tìm nhanh gói phù hợp mục tiêu của bạn
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "rgba(15, 23, 42, 0.7)", lineHeight: 1.6 }}
          >
            Lọc theo tên gói, mô tả và hình thức lựa chọn KOL để thu hẹp danh
            sách.
          </Typography>
        </Stack>

        <Stack spacing={2.5}>
          {/* Search theo tên/mô tả */}
          <Stack spacing={1.5}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "rgba(15,23,42,0.8)" }}
            >
              Tìm theo tên gói
            </Typography>
            <TextField
              fullWidth
              placeholder="Nhập tên gói hoặc mô tả..."
              value={filters.search}
              onChange={onSearchChange}
              disabled={disabled}
              sx={fieldStyles}
              size="medium"
            />
          </Stack>

          {/* Lựa chọn kiểu gói */}
          <Stack spacing={1.5}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "rgba(15,23,42,0.8)" }}
            >
              Quyền lựa chọn KOL
            </Typography>
            <ToggleButtonGroup
              exclusive
              color="primary"
              value={filters.allowKolSelection}
              onChange={onAllowKolChange}
              disabled={disabled}
              sx={{
                width: "100%",
                flexWrap: "wrap",
                gap: 1,
                "& .MuiToggleButton-root": {
                  flex: 1,
                  minWidth: 140,
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  border: "1px solid rgba(74, 116, 218, 0.2)",
                  color: "rgba(15,23,42,0.8)",
                  "&:hover": {
                    backgroundColor: "rgba(74, 116, 218, 0.08)",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "rgba(74, 116, 218, 0.16)",
                    color: "#2f3c8c",
                    borderColor: "rgba(74, 116, 218, 0.4)",
                  },
                },
              }}
            >
              <ToggleButton value="all">Tất cả</ToggleButton>
              <ToggleButton value="manual">Gói VIP</ToggleButton>
              <ToggleButton value="auto">Gói Thường</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Stack>

        <Button
          variant="outlined"
          onClick={onReset}
          disabled={disabled || !hasActiveFilters}
          sx={{
            borderColor: "rgba(74, 116, 218, 0.35)",
            color: "rgba(15, 23, 42, 0.7)",
            fontWeight: 600,
            textTransform: "none",
            borderRadius: 3,
            px: 3,
          }}
        >
          Làm mới bộ lọc
        </Button>
      </Stack>
    </Box>
  );
};

const PackageListLoading = () => (
  <Stack
    alignItems="center"
    justifyContent="center"
    sx={{
      minHeight: 320,
      borderRadius: 4,
      border: "1px dashed rgba(74, 116, 218, 0.3)",
      bgcolor: "rgba(74, 116, 218, 0.08)",
    }}
  >
    <CircularProgress sx={{ color: "#4a74da" }} />
    <Typography sx={{ mt: 2, color: "rgba(15, 23, 42, 0.7)" }}>
      Đang tải danh sách gói chiến dịch...
    </Typography>
  </Stack>
);

const shouldAllowKolSelection = (pkg) =>
  pkg?.packageType?.toLowerCase() === "vip";

const PackageListEmpty = () => (
  <Stack
    alignItems="center"
    spacing={2}
    sx={{
      py: 10,
      borderRadius: 4,
      border: "1px solid rgba(74, 116, 218, 0.18)",
      bgcolor: "rgba(226, 232, 240, 0.45)",
    }}
  >
    <Typography variant="h5" sx={{ fontWeight: 600, color: "#0f172a" }}>
      Chưa có gói chiến dịch nào phù hợp
    </Typography>
    <Typography
      sx={{
        color: "rgba(15, 23, 42, 0.7)",
        maxWidth: 520,
        textAlign: "center",
      }}
    >
      Thử điều chỉnh lại bộ lọc hoặc quay lại sau để xem thêm những gói mới nhất
      từ BookingKOL.
    </Typography>
  </Stack>
);

const PackageListError = ({ message, onRetry }) => (
  <Stack
    alignItems="center"
    spacing={2}
    sx={{
      py: 8,
      borderRadius: 4,
      border: "1px solid rgba(248, 113, 113, 0.4)",
      bgcolor: "rgba(248, 113, 113, 0.08)",
    }}
  >
    <Typography variant="h6" sx={{ fontWeight: 600, color: "#b91c1c" }}>
      Không thể tải dữ liệu
    </Typography>
    <Typography
      sx={{
        color: "rgba(15, 23, 42, 0.7)",
        maxWidth: 520,
        textAlign: "center",
      }}
    >
      {message}
    </Typography>
    <Button
      variant="contained"
      onClick={onRetry}
      sx={{
        textTransform: "none",
        fontWeight: 600,
        bgcolor: "#b91c1c",
        "&:hover": { bgcolor: "#9f1a1a" },
      }}
    >
      Thử lại
    </Button>
  </Stack>
);

const ServicePackageCard = ({ data, onSelect }) => {
  const isVip = data?.packageType?.toLowerCase() === "vip";
  const accentColor = isVip ? "#a855f7" : "#4a74da";
  const subtleColor = isVip ? "rgba(168,85,247,0.24)" : "rgba(74,116,218,0.2)";
  const vipStyles = {
    border: "1px solid rgba(168, 85, 247, 0.6)",
    boxShadow: "0 0 18px rgba(168, 85, 247, 0.3)",
    background: "linear-gradient(to bottom right, #faf5ff, #ede9fe, #fef3c7)",
    transform: "translateY(-2px)",
  };
  return (
    <Card
      sx={{
        height: "100%",
        width: "100%",
        borderRadius: 4,
        border: isVip ? vipStyles.border : "1px solid rgba(74, 116, 218, 0.25)",
        boxShadow: isVip
          ? vipStyles.boxShadow
          : "0 18px 36px rgba(74,116,218,0.15)",
        background: isVip
          ? vipStyles.background
          : "linear-gradient(160deg, #fff, rgba(244,247,255,0.92))",
        display: "flex",
        flexDirection: "column",
        transition: "all .25s ease",
        "&:hover": {
          transform: isVip ? "scale(1.03)" : "scale(1.01)",
          boxShadow: isVip
            ? "0 0 30px rgba(168, 85, 247, 0.45)"
            : "0 24px 48px rgba(74,116,218,0.22)",
        },
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: { xs: 1.5, md: 2 },
          flexGrow: 1,
          p: { xs: 2.5, md: 3 },
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ flexWrap: "wrap" }}
        >
          <Chip
            icon={<WorkspacePremiumRoundedIcon sx={{ color: accentColor }} />}
            label={isVip ? "Gói VIP" : "Gói thường"}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              color: accentColor,
              borderColor: subtleColor,
              borderWidth: 1,
              borderStyle: "solid",
              backgroundColor: "rgba(255,255,255,0.6)",
            }}
          />
          <Chip
            icon={
              data?.allowKolSelection ? (
                <Diversity3RoundedIcon sx={{ color: "#15803d" }} />
              ) : (
                <CampaignRoundedIcon sx={{ color: "#0f172a" }} />
              )
            }
            label={
              data?.allowKolSelection
                ? "Tự chọn KOL theo ý muốn"
                : "Đề xuất KOL tự động"
            }
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              color: data?.allowKolSelection ? "#166534" : "#0f172a",
              borderColor: data?.allowKolSelection
                ? "rgba(22, 101, 52, 0.25)"
                : "rgba(15, 23, 42, 0.25)",
              borderWidth: 1,
              borderStyle: "solid",
              backgroundColor: data?.allowKolSelection
                ? "rgba(187, 247, 208, 0.5)"
                : "rgba(226, 232, 240, 0.6)",
            }}
          />
        </Stack>

        <Stack spacing={1}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "#0f172a",
              fontSize: { xs: "1.1rem", md: "1.25rem" },
            }}
          >
            Gói {data?.name}
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 1.5,
              p: 1.5,
              borderRadius: 3,
              backgroundColor: subtleColor,
              border: `1px solid ${accentColor}30`,
            }}
          >
            <Stack spacing={0.5}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: accentColor,
                  lineHeight: 1,
                  fontSize: { xs: "1.6rem", md: "2.1rem" },
                }}
              >
                {formatCurrency(data?.price)}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "rgba(15,23,42,0.72)", fontWeight: 600 }}
              >
                Trên giờ
              </Typography>
            </Stack>
            <Chip
              label={isVip ? "Bao gồm quyền chọn Host" : "Tùy chọn Host cơ bản"}
              sx={{
                fontWeight: 700,
                borderRadius: 2,
                color: accentColor,
                backgroundColor: "#fff",
                borderColor: accentColor,
                borderWidth: 1,
                borderStyle: "solid",
              }}
            />
          </Box>
          {/* <Typography
            variant="body1"
            sx={{
              color: "rgba(15, 23, 42, 0.75)",
              lineHeight: 1.7,
              minHeight: 80,
            }}
          >
            {data?.description}
          </Typography> */}
          <ul
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              lineHeight: 1.6,
              fontSize: "1rem",
            }}
          >
            {(isVip
              ? [
                  "Chiến Lược Host Chính Cao Cấp",
                  "Tự Chọn Host Cá Tính",
                  "Trợ Lý Livestream Chuyên Nghiệp",
                  "Ưu Đãi & Hỗ Trợ 24/7",
                  "Báo Cáo Chuyên Sâu A-Z",
                ]
              : [
                  "Chiến Dịch Host Cơ Bản",
                  "Phân Tích & Lựa Chọn Host Tự Động",
                  "Báo Cáo Hiệu Quả",
                  "Cộng Tác Tự Booking Host",
                ]
            ).map((item, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <CheckCircle
                  style={{
                    width: "20px",
                    height: "20px",
                    flexShrink: 0,
                    marginTop: "2px",
                    color: isVip ? "#facc15" : "#2563eb",
                  }}
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Stack>

        <Box sx={{ mt: "auto" }}>
          <Button
            fullWidth
            variant="contained"
            onClick={() => onSelect(data)}
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 3,
              py: 1.5,
              background: isVip
                ? "linear-gradient(90deg,#a855f7,#d946ef)"
                : "transparent",
              color: isVip ? "#ffffff" : "#4a74da",
              fontSize: isVip ? "1.05rem" : "1rem",
              "&:hover": {
                background: isVip
                  ? "linear-gradient(90deg,#9333ea,#c026d3)"
                  : "rgba(74,116,218,0.08)",
              },
            }}
          >
            Chọn gói này
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

const ServicePackagePage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const navigate = useNavigate();

  const loadPackages = useCallback(() => {
    const abortController = new AbortController();
    setLoading(true);
    setError(null);

    getServicePackages({ signal: abortController.signal })
      .then((data) => {
        if (!abortController.signal.aborted) {
          const normalizedPackages = Array.isArray(data)
            ? data.map((pkg) => ({
                ...pkg,
                allowKolSelection: shouldAllowKolSelection(pkg),
              }))
            : [];
          setPackages(normalizedPackages);
        }
      })
      .catch((err) => {
        if (abortController.signal.aborted) {
          return;
        }
        setError(extractErrorMessage(err));
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      });

    return abortController;
  }, []);

  useEffect(() => {
    const controller = loadPackages();
    return () => controller.abort();
  }, [loadPackages]);

  const handleRetry = useCallback(() => {
    loadPackages();
  }, [loadPackages]);

  const handleSearchChange = useCallback((event) => {
    const { value } = event.target;
    setFilters((prev) => ({ ...prev, search: value }));
  }, []);

  const handleAllowKolChange = useCallback((_, value) => {
    if (value === null) {
      return;
    }
    setFilters((prev) => ({ ...prev, allowKolSelection: value }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const filteredPackages = useMemo(() => {
    const searchValue = filters.search.trim().toLowerCase();
    return packages.filter((pkg) => {
      const matchesSearch =
        !searchValue ||
        pkg?.name?.toLowerCase().includes(searchValue) ||
        pkg?.description?.toLowerCase().includes(searchValue);

      let matchesAllow = true;
      if (filters.allowKolSelection === "manual") {
        matchesAllow = Boolean(pkg?.allowKolSelection);
      } else if (filters.allowKolSelection === "auto") {
        matchesAllow = pkg?.allowKolSelection === false;
      }

      return matchesSearch && matchesAllow;
    });
  }, [packages, filters]);

  const hasActiveFilters = useMemo(
    () =>
      Boolean(filters.search.trim()) ||
      filters.allowKolSelection !== DEFAULT_FILTERS.allowKolSelection,
    [filters]
  );

  const handleSelectPackage = useCallback(
    (pkg) => {
      if (!pkg) {
        return;
      }
      navigate("/goi-chien-dich/dat-goi", {
        state: {
          packageId: pkg.id,
          packageName: pkg.name,
          packageType: normalizePackageType(pkg.packageType),
          packagePrice: pkg.price,
        },
      });
    },
    [navigate]
  );

  return (
    <Box
      sx={{
        bgcolor: "#f8fafc",
        py: { xs: 6, md: 10 },
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          maxWidth: "1600px",
          px: { xs: 2.5, sm: 3, md: 4 },
        }}
      >
        <Stack spacing={{ xs: 4, md: 6 }}>
          {/* HEADER */}
          <Stack
            spacing={2}
            textAlign="center"
            justifyContent="center"
            sx={{ px: { xs: 1, md: 6 } }}
          >
            <Typography
              variant="overline"
              sx={{ letterSpacing: 2, color: "#4a74da", fontWeight: 700 }}
            >
              Danh sách gói chiến dịch
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: -0.5,
                fontSize: { xs: "1.8rem", sm: "2.2rem", md: "2.6rem" },
                lineHeight: 1.2,
              }}
            >
              Tùy chọn gói KOL phù hợp mục tiêu của bạn
            </Typography>
          </Stack>

          {/* MAIN CONTENT: FILTER + LIST */}
          <Grid
            container
            spacing={{ xs: 3, md: 4 }}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
            }}
          >
            {/* FILTER PANEL – full width trên mobile, sidebar trên md+ */}
            {/* <Grid item xs={12} md={4} lg={3}>
              <PackageFilterPanel
                filters={filters}
                onSearchChange={handleSearchChange}
                onAllowKolChange={handleAllowKolChange}
                onReset={handleResetFilters}
                disabled={loading}
                hasActiveFilters={hasActiveFilters}
              />
            </Grid> */}

            {/* LIST */}
            <Grid item xs={12} md={12} lg={12}>
              {loading ? (
                <PackageListLoading />
              ) : error ? (
                <PackageListError message={error} onRetry={handleRetry} />
              ) : filteredPackages.length === 0 ? (
                <PackageListEmpty />
              ) : (
                <Grid
                  container
                  spacing={{ xs: 2.5, md: 3.5 }}
                  justifyContent="center"
                  alignItems="stretch"
                >
                  {filteredPackages.map((pkg) => {
                    const isVip = pkg?.packageType?.toLowerCase() === "vip";
                    return (
                      <Grid
                        item
                        key={pkg.id}
                        xs={12}
                        sm={6}
                        md={6}
                        lg={4}
                        sx={{
                          display: "flex",
                        }}
                        order={{ xs: 0, md: isVip ? 2 : 1 }} // VIP sang phải trên màn hình rộng
                      >
                        <Box sx={{ flex: 1, display: "flex" }}>
                          <ServicePackageCard
                            data={pkg}
                            onSelect={handleSelectPackage}
                          />
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
};

export default ServicePackagePage;
