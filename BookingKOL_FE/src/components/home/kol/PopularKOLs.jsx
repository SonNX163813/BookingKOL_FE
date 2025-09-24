import React, { useMemo } from "react";
import { Box, Container, Typography, Grid } from "@mui/material";
import { motion } from "framer-motion";
import KOLCard from "./KOLCard";
import hotkolimg from "../../../assets/hotkol.png";

const popularKOLs = [
  {
    id: "1",
    name: "Vanh >.<",
    field: "Host Streamer",
    price: "250.000d / Giờ",
    originalPrice: "280.000d / Giờ",
    rating: 4.95,
    reviewCount: 355,
    image: hotkolimg,
    isOnline: true,
  },
  {
    id: "2",
    name: "Minh Anh",
    field: "Host Stream",
    price: "320.000d / Giờ",
    originalPrice: "360.000d / Giờ",
    rating: 4.87,
    reviewCount: 421,
    image: hotkolimg,
    isOnline: false,
  },
  {
    id: "3",
    name: "Vanh >.<",
    field: "Host Stream",
    price: "280.000d / Giờ",
    originalPrice: "315.000d / Giờ",
    rating: 4.9,
    reviewCount: 298,
    image: hotkolimg,
    isOnline: true,
  },
  {
    id: "4",
    name: "Vanh >.<",
    field: "Host Stream",
    price: "260.000d / Giờ",
    originalPrice: "290.000d / Giờ",
    rating: 4.92,
    reviewCount: 374,
    image: hotkolimg,
    isOnline: true,
  },
  {
    id: "5",
    name: "Vanh >.<",
    field: "Host Stream",
    price: "300.000d / Giờ",
    originalPrice: "340.000d / Giờ",
    rating: 4.85,
    reviewCount: 212,
    image: hotkolimg,
    isOnline: false,
  },
];

const PopularKOLs = () => {
  const items = useMemo(() => popularKOLs, []);

  return (
    <Box sx={{ py: 10, backgroundColor: "#f8fafc" }}>
      <Container maxWidth="lg">
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
              mb: 2,
              textAlign: "center",
              fontWeight: 700,
              color: "#0f172a",
            }}
          >
            KOL Phổ Biến
          </Typography>
          {/* <Typography
            variant="h6"
            sx={{
              textAlign: "center",
              color: "#475569",
              maxWidth: "46rem",
              mx: "auto",
            }}
          >
            Danh sach creator duoc cong dong tin tuong va co ty le chuyen doi
            cao nhat, san sang dong hanh cung chien dich cua ban.
          </Typography> */}
        </motion.div>

        <Grid container spacing={4} sx={{ mt: 4 }}>
          {items.map((kol, index) => (
            <Grid item xs={12} sm={6} md={4} key={kol.id}>
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <KOLCard {...kol} />
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default PopularKOLs;
