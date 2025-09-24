import React from "react";
import { Box, Container, Typography, Button } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import SparklesIcon from "@mui/icons-material/AutoAwesome";

const CTASection = () => {
  const reduce = useReducedMotion();

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: reduce ? 0 : 30 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay },
    viewport: { once: true, amount: 0.2 },
  });

  return (
    <Box
      sx={{
        py: { xs: 8, md: 10 },
        background: "linear-gradient(to right, #c026d3, #7c3aed)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          opacity: 0.2,
        }}
      />

      <Container
        maxWidth="lg"
        sx={{ position: "relative", textAlign: "center" }}
      >
        <Box component={motion.div} {...fadeUp(0)}>
          <Box sx={{ mb: 4 }}>
            <SparklesIcon sx={{ fontSize: 48, color: "#fb923c", mb: 3 }} />
            <Typography
              variant="h3"
              sx={{
                fontWeight: "bold",
                color: "white",
                mb: 3,
                fontSize: { xs: "1.875rem", md: "2.5rem", lg: "3rem" },
                lineHeight: 1.2,
              }}
            >
              Bạn muốn hợp tác với KOLs hàng đầu?
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: "#f1f5f9",
                mb: 4,
                maxWidth: "42rem",
                mx: "auto",
                lineHeight: 1.4,
              }}
            >
              Bắt đầu hành trình của bạn với chúng tôi và tiếp cận hàng triệu
              khách hàng tiềm năng ngay hôm nay.
            </Typography>
          </Box>
        </Box>

        <Box component={motion.div} {...fadeUp(0.2)}>
          <Button
            variant="contained"
            size="large"
            sx={{
              backgroundColor: "white",
              color: "#c026d3",
              "&:hover": { backgroundColor: "#f9fafb", boxShadow: 6 },
              borderRadius: "9999px",
              px: 6,
              py: 2,
              fontSize: "1.25rem",
              fontWeight: "bold",
              boxShadow: 3,
            }}
          >
            Liên Hệ Ngay
          </Button>
        </Box>

        <Box component={motion.div} {...fadeUp(0.4)}>
          <Typography variant="body2" sx={{ color: "#e2e8f0", mt: 3 }}>
            Chào mừng bạn đến với Nexus Social - Nơi kết nối thương hiệu và KOLs
            hàng đầu.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default CTASection;
