import React, { useEffect, useMemo, useState } from "react";
import { Box, Container, Typography, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import KOLCard from "./KOLCard";
import hotkolimg from "../../../assets/hotkol.png";
import { slugify } from "../../../utils/slugify";
import { getKolProfiles } from "../../../services/kol/KolAPI";

const formatCurrency = (value) => {
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) {
    return null;
  }

  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(numberValue);
  } catch (error) {
    console.error("Failed to format currency", error);
  }

  return `${numberValue.toLocaleString("vi-VN")} VND`;
};

const mapKolProfileToCard = (kol) => {
  if (!kol?.id) {
    return null;
  }

  const categoryNames = Array.isArray(kol?.categories)
    ? kol.categories
        .map((category) => category?.name)
        .filter(Boolean)
        .join(", ")
    : null;

  const location = [kol?.city, kol?.country].filter(Boolean).join(", ");
  const minPriceLabel = formatCurrency(kol?.minBookingPrice);
  const rateNote =
    typeof kol?.rateCardNote === "string" ? kol.rateCardNote.trim() : "";

  let priceDisplay = minPriceLabel;
  if (minPriceLabel && rateNote) {
    priceDisplay = `${minPriceLabel}`;
  } else if (!minPriceLabel && rateNote) {
    priceDisplay = rateNote;
  } else if (!minPriceLabel) {
    priceDisplay = "Lien he";
  }

  const fieldFull = categoryNames || location || rateNote || null;

  return {
    id: kol.id,
    name: kol.displayName ?? "Dang cap nhat",
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
      hotkolimg,
  };
};

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
        if (err?.name === "AbortError") {
          return;
        }

        console.error("Failed to fetch KOL profiles", err);
        if (isActive) {
          setError("Khong the tai danh sach KOL. Vui long thu lai sau.");
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchProfiles();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const items = useMemo(() => {
    return kolProfiles
      .map(mapKolProfileToCard)
      .filter((item) => Boolean(item?.id));
  }, [kolProfiles]);

  const handleCardClick = (kol) => {
    if (!kol?.id) {
      return;
    }

    const slug = slugify(kol.name) || kol.id;
    navigate(`/kols/${kol.id}/${slug}`);
  };

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
            KOL Pho Bien
          </Typography>
        </motion.div>

        {isLoading && (
          <Typography
            variant="body1"
            sx={{ textAlign: "center", color: "#475569", mt: 4 }}
          >
            Dang tai danh sach KOL...
          </Typography>
        )}

        {!isLoading && error && (
          <Typography
            variant="body1"
            sx={{ textAlign: "center", color: "#ef4444", mt: 4 }}
          >
            {error}
          </Typography>
        )}

        {!isLoading && !error && items.length === 0 && (
          <Typography
            variant="body1"
            sx={{ textAlign: "center", color: "#475569", mt: 4 }}
          >
            Chua co KOL de hien thi.
          </Typography>
        )}

        <Grid
          container
          spacing={{ xs: 3, sm: 3, md: 4 }}
          justifyContent="center"
          alignItems="stretch"
          sx={{ mt: 2, "& .MuiGrid-item": { display: "flex" } }}
        >
          {items.map((kol, index) => (
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
