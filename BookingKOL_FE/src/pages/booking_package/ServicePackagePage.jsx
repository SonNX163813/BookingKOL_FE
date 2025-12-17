import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
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
import { XCircle } from "lucide-react";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";

import { useNavigate } from "react-router-dom";

import { getServicePackages } from "../../services/service-package/ServicePackageAPI";

const DEFAULT_FILTERS = Object.freeze({
  search: "",
  allowKolSelection: "all",
});

const normalizePackageType = (type) =>
  type?.toLowerCase() === "vip" ? "vip" : "basic";

const paletteByIndex = (index) => {
  const palette = [
    { header: "#e5e5e5", accent: "#6b7280", text: "#374151" },
    { header: "#22c55e", accent: "#15803d", text: "#064e3b" },
    { header: "#0ea5e9", accent: "#0f5f75", text: "#0f172a" },
    { header: "#f59e0b", accent: "#b45309", text: "#92400e" },
  ];
  return palette[index % palette.length];
};

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

const ServicePackageCard = ({ data, onSelect, theme }) => {
  const isVip = data?.packageType?.toLowerCase() === "vip";
  const accentColor = theme?.accent || "#4b5563";
  const headerColor = theme?.header || "#e5e7eb";
  const textColor = theme?.text || "#1f2937";

  const features = [
    { label: "Tạo chiến dịch", available: true },
    { label: "Thống kê hiệu suất", available: true },
    { label: "Chọn KOL thủ công", available: Boolean(data?.allowKolSelection) },
    { label: "Gợi ý KOL tự động", available: Boolean(data?.allowKolSelection) },
    { label: "Báo cáo nâng cao", available: isVip },
    { label: "Hỗ trợ triển khai", available: isVip },
  ];

  return (
    <Card
      sx={{
        height: "100%",
        width: "100%",
        borderRadius: 3,
        border: `1px solid ${headerColor}`,
        overflow: "hidden",
        boxShadow: "0 14px 30px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          backgroundColor: headerColor,
          clipPath: "polygon(0 0, 100% 0, 100% 82%, 0 100%)",
          width: { xs: "auto", md: 350, lg: 350 },
          height: { xs: 110, md: 120 },
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          pb: 2,
        }}
      >
        <Typography
          sx={{
            color: textColor,
            fontWeight: 800,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            fontSize: { xs: "1rem", md: "1.05rem" },
          }}
        >
          Gói {data?.name}
        </Typography>
      </Box>

      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          gap: 2,
          px: { xs: 2.5, md: 3 },
          pb: { xs: 3, md: 4 },
        }}
      >
        <Stack
          spacing={2}
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: "1.6rem", md: "2rem" },
              fontWeight: 800,
              color: textColor,
              lineHeight: 1,
            }}
          >
            {formatCurrency(data?.price)}
          </Typography>
          <Typography
            sx={{
              textTransform: "uppercase",
              color: "#6b7280",
              fontSize: "0.95rem",
              letterSpacing: 1,
            }}
          >
            / Giờ
          </Typography>
        </Stack>

        <Box
          sx={{
            backgroundColor: "#f3f4f6",
            borderRadius: 2,
            px: 2,
            py: 1.5,
            border: "1px solid #e5e7eb",
            display: "flex",
            gap: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <WorkspacePremiumRoundedIcon sx={{ color: accentColor }} />
          <Typography sx={{ fontWeight: 700, color: textColor }}>
            {isVip ? "Quyền mở ưu tiên" : "Tiêu chuẩn cơ bản"}
          </Typography>
        </Box>

        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, flex: 1 }}>
          {features.map((item, index) => {
            const IconComponent = item.available ? CheckCircle : XCircle;
            const iconColor = item.available ? "#16a34a" : "#ef4444";
            return (
              <Box
                key={index}
                component="li"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.2,
                  py: 0.6,
                  color: "#111827",
                  fontSize: "0.98rem",
                }}
              >
                <IconComponent
                  style={{ color: iconColor, width: 20, height: 20 }}
                />
                <span>{item.label}</span>
              </Box>
            );
          })}
        </Box>

        <Button
          fullWidth
          variant="contained"
          onClick={() => onSelect(data)}
          sx={{
            textTransform: "none",
            fontWeight: 700,
            borderRadius: 2,
            py: 1.2,
            backgroundColor: accentColor,
            "&:hover": { backgroundColor: textColor },
          }}
        >
          Chọn gói này
        </Button>
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
                fontSize: { xs: "1.8rem", sm: "2.2rem", md: "2.2rem" },
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
                  {filteredPackages.map((pkg, index) => {
                    const isVip = pkg?.packageType?.toLowerCase() === "vip";
                    const palette = paletteByIndex(index);
                    return (
                      <Grid
                        item
                        key={pkg.id}
                        xs={12}
                        sm={6}
                        md={6}
                        lg={3}
                        sx={{
                          display: "flex",
                        }}
                        order={{ xs: 0, md: isVip ? 2 : 1 }}
                      >
                        <Box sx={{ flex: 1, display: "flex" }}>
                          <ServicePackageCard
                            data={pkg}
                            onSelect={handleSelectPackage}
                            theme={palette}
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
