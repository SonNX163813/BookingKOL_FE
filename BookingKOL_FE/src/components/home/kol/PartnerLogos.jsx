import React from "react";
import { Container, Typography, Box, Grid } from "@mui/material";
import { motion } from "framer-motion";

const PartnerLogos = () => {
  const partners = [
    {
      name: "Netflix",
      logo: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
    },
    {
      name: "Spotify",
      logo: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
    },
    {
      name: "Nike",
      logo: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
    },
    {
      name: "Apple",
      logo: "https://images.unsplash.com/photo-1621768216002-5ac171876625?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
    },
    {
      name: "Google",
      logo: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
    },
    {
      name: "Amazon",
      logo: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
    },
  ];

  return (
    <Box sx={{ py: 8, backgroundColor: "white" }}>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Typography
              variant="h4"
              sx={{ fontWeight: "bold", color: "#1e293b", mb: 2 }}
            >
              Trusted by Leading Brands
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: "#475569", maxWidth: "42rem", mx: "auto" }}
            >
              Join thousands of successful brands that have partnered with our
              KOLs
            </Typography>
          </Box>
        </motion.div>

        <Grid container spacing={4} justifyContent="center">
          {partners.map((partner, index) => (
            <Grid item xs={6} sm={4} md={2} key={partner.name}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{
                  scale: 1.1,
                  filter: "grayscale(0%)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 2,
                    filter: "grayscale(100%)",
                    opacity: 0.7,
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                    "&:hover": {
                      opacity: 1,
                      filter: "grayscale(0%)",
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={partner.logo}
                    alt={`${partner.name} logo`}
                    sx={{
                      maxHeight: 48,
                      width: "auto",
                      objectFit: "contain",
                    }}
                  />
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default PartnerLogos;
