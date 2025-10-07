import React, { useEffect, useMemo, useState } from "react";
import { Box, Container, Typography, Grid, Skeleton } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import KOLCard from "./KOLCard";
import hotkolimg from "../../../assets/hotkol.png";
import { slugify } from "../../../utils/slugify";
import { getKolProfiles } from "../../../services/kol/KolAPI";

const formatCurrency = (value) => {
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return null;

  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(numberValue);
  } catch (error) {
    console.error("Không thể định dạng tiền tệ", error);
  }

  return `${numberValue.toLocaleString("vi-VN")} VND`;
};

const mapKolProfileToCard = (kol) => {
  if (!kol?.id) return null;

  const categoryNames = Array.isArray(kol?.categories)
    ? kol.categories
        .map((c) => c?.name)
        .filter(Boolean)
        .join(", ")
    : null;

  const location = [kol?.city, kol?.country].filter(Boolean).join(", ");
  const minPriceLabel = formatCurrency(kol?.minBookingPrice);
  const rateNote =
    typeof kol?.rateCardNote === "string" ? kol.rateCardNote.trim() : "";

  let priceDisplay = minPriceLabel;
  if (minPriceLabel && rateNote) priceDisplay = `${minPriceLabel}`;
  else if (!minPriceLabel && rateNote) priceDisplay = rateNote;
  else if (!minPriceLabel) priceDisplay = "Liên hệ";

  const fieldFull = categoryNames || location || rateNote || null;
  const coverImage = Array.isArray(kol?.fileUsageDtos)
    ? kol.fileUsageDtos.find((usage) => usage?.isCover && usage?.file?.fileUrl)
        ?.file?.fileUrl ??
      kol.fileUsageDtos.find((usage) => usage?.file?.fileUrl)?.file?.fileUrl
    : null;

  return {
    id: kol.id,
    name: kol.displayName ?? "Đang cập nhật",
    field: fieldFull,
    fieldFull,
    price: priceDisplay,
    originalPrice: null,
    rating: Number.isFinite(Number(kol?.overallRating))
      ? Number(kol.overallRating)
      : 0,
    reviewCount: Number.isFinite(Number(kol?.feedbackCount))
      ? Number(kol.feedbackCount)
      : 0,
    image:
      kol?.avatarUrl ||
      kol?.profileImage ||
      kol?.imageUrl ||
      kol?.thumbnailUrl ||
      coverImage ||
      hotkolimg,
  };
};

/** Skeleton mô phỏng đúng KOLCard như ảnh demo */
const SkeletonCard = () => (
  <Box
    sx={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      borderRadius: 3, // ~24px
      bgcolor: "background.paper",
      boxShadow: "0 8px 24px rgba(2,6,23,0.08)",
      overflow: "hidden",
    }}
  >
    {/* Ảnh đầu thẻ: bo tròn phía trên, giữ tỉ lệ gần 4:5 */}
    <Skeleton
      variant="rounded"
      sx={{
        width: "100%",
        aspectRatio: "4 / 5",
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
      }}
    />

    {/* Nội dung thẻ */}
    <Box sx={{ p: 2 }}>
      {/* Tên KOL */}
      <Skeleton
        variant="text"
        sx={{ fontSize: "1.05rem", width: "72%", mb: 1 }}
      />

      {/* Chip ngành (viên thuốc) */}
      <Skeleton
        variant="rounded"
        sx={{ width: "80%", height: 28, borderRadius: 999, mb: 1.25 }}
      />

      {/* Hàng sao + điểm + số lượng đánh giá */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="circular" width={18} height={18} />
          ))}
        </Box>
        <Skeleton variant="text" sx={{ fontSize: "0.95rem", width: 44 }} />
        <Skeleton variant="text" sx={{ fontSize: "0.95rem", width: 28 }} />
      </Box>

      {/* Giá nổi bật ở cuối */}
      <Skeleton variant="text" sx={{ fontSize: "1.6rem", width: "45%" }} />
    </Box>
  </Box>
);

const PopularKOLs = () => {
  const navigate = useNavigate();
  const [kolProfiles, setKolProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    const fetchProfiles = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getKolProfiles({ signal: controller.signal });
        if (isActive) {
          setKolProfiles(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (err?.name === "AbortError") return;

        console.error("Tải danh sách KOL thất bại", err);
        if (isActive)
          setError("Không thể tải danh sách KOL. Vui lòng thử lại sau.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    fetchProfiles();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const items = useMemo(
    () =>
      kolProfiles.map(mapKolProfileToCard).filter((item) => Boolean(item?.id)),
    [kolProfiles]
  );

  const handleCardClick = (kol) => {
    if (!kol?.id) return;
    const slug = slugify(kol.name) || kol.id;
    navigate(`/danh-sach-kol/${kol.id}/${slug}`);
  };

  // Bạn đang để 1 skeleton — giữ nguyên theo ý bạn
  const skeletonArray = Array.from({ length: 1 });

  return (
    <Box sx={{ py: 10, backgroundColor: "#f8fafc" }}>
      <Container
        maxWidth={false}
        sx={{
          maxWidth: { xs: 900, sm: 900, md: 1500 },
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.25 }}
        >
          {/* Tiêu đề (dùng Skeleton khi loading) */}
          {isLoading ? (
            <Skeleton
              variant="text"
              sx={{
                width: { xs: "60%", sm: "45%", md: "35%" },
                height: { xs: 40, sm: 44, md: 48 },
                mx: "auto",
                mb: 6,
              }}
            />
          ) : (
            <Typography
              variant="h4"
              component="h2"
              sx={{
                mb: 6,
                textAlign: "center",
                fontWeight: 700,
                color: "#0f172a",
                fontSize: { xs: "1.75rem", sm: "2rem", md: "2.25rem" },
              }}
            >
              KOL Phổ Biến
            </Typography>
          )}
        </motion.div>

        {/* Lưới nội dung */}
        <Grid
          container
          spacing={{ xs: 3, sm: 3, md: 4 }}
          justifyContent="center"
          alignItems="stretch"
          sx={{ mt: 2, "& .MuiGrid-item": { display: "flex" } }}
        >
          {/* Khi loading: hiện Skeleton thay vì chữ */}
          {isLoading &&
            skeletonArray.map((_, idx) => (
              <Grid item xs={12} sm={6} md={3} key={`sk-${idx}`}>
                <SkeletonCard />
              </Grid>
            ))}

          {/* Khi có lỗi */}
          {!isLoading && error && (
            <Grid item xs={12}>
              <Typography
                variant="body1"
                sx={{ textAlign: "center", color: "#ef4444", mt: 2 }}
              >
                {error}
              </Typography>
            </Grid>
          )}

          {/* Khi rỗng */}
          {!isLoading && !error && items.length === 0 && (
            <Grid item xs={12}>
              <Typography
                variant="body1"
                sx={{ textAlign: "center", color: "#475569", mt: 2 }}
              >
                Chưa có KOL để hiển thị.
              </Typography>
            </Grid>
          )}

          {/* Khi có dữ liệu */}
          {!isLoading &&
            !error &&
            items.length > 0 &&
            items.map((kol, index) => (
              <Grid item xs={12} sm={6} md={3} key={kol.id}>
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, y: 32 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  viewport={{ once: true, amount: 0.2 }}
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    flexGrow: 1,
                  }}
                >
                  <KOLCard {...kol} onClick={() => handleCardClick(kol)} />
                </Box>
              </Grid>
            ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default PopularKOLs;
