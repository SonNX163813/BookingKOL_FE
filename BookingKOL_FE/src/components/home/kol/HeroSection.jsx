import React from "react";
import { Box, Typography, Button, Container, Grid } from "@mui/material";
import { motion } from "framer-motion";

const fadeUp = (delay = 0.2) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay },
});

const HeroSection = () => {
  return (
    <Box
      sx={{
        position: "relative",
        minHeight: "600px",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        background:
          "linear-gradient(to bottom right, #c026d3, #7c3aed, #581c87)",
      }}
    >
      {/* Animated background gradient */}
      <Box
        component={motion.div}
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom right, rgba(192, 38, 211, 0.2), rgba(124, 58, 237, 0.2), rgba(88, 28, 135, 0.2))",
          backgroundSize: "300% 300%", // giúp animation mượt hơn
          willChange: "background-position",
        }}
        animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* Background image overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "url(https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.2,
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", py: 10 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ color: "white" }}>
              <Box component={motion.div} {...fadeUp(0.2)}>
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: "bold",
                    mb: 3,
                    fontSize: { xs: "2.5rem", md: "3.5rem", lg: "4rem" },
                  }}
                >
                  The LiveStream World{" "}
                  <Box component="span" sx={{ color: "#fb923c" }}>
                    In Your Hands
                  </Box>
                </Typography>
              </Box>

              <Box component={motion.div} {...fadeUp(0.4)}>
                <Typography variant="h5" sx={{ mb: 2, color: "#f1f5f9" }}>
                  Connect with top influencers and KOLs to amplify your brand's
                  reach.
                </Typography>
              </Box>

              <Box component={motion.div} {...fadeUp(0.6)}>
                <Typography variant="h6" sx={{ mb: 4, color: "#e2e8f0" }}>
                  Discover, filter, and book the perfect content creators for
                  your campaigns.
                </Typography>
              </Box>

              <Box component={motion.div} {...fadeUp(0.8)}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    backgroundColor: "#fb923c",
                    "&:hover": { backgroundColor: "#ea580c" },
                    borderRadius: "9999px",
                    px: 4,
                    py: 2,
                    fontSize: "1.125rem",
                    fontWeight: "bold",
                  }}
                >
                  Contact for Advice
                </Button>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box
              component={motion.div}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              sx={{ position: "relative" }}
            >
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="KOL livestreaming event"
                sx={{
                  borderRadius: 4,
                  boxShadow: 4,
                  width: "100%",
                  height: "auto",
                  maxWidth: "100%",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to top, rgba(88, 28, 135, 0.3), transparent)",
                  borderRadius: 4,
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HeroSection;
