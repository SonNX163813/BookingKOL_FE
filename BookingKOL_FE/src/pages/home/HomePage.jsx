import React from "react";
import { Container, Grid, Box } from "@mui/material";
import Navbar from "../../components/home/kol/Navbar";
import HeroSection from "../../components/home/kol/HeroSection";
import FilterSidebar from "../../components/home/kol/FilterSidebar";
import HottestKOLs from "../../components/home/kol/HottestKOLs";
import PartnerLogos from "../../components/home/kol/PartnerLogos";
import PopularKOLs from "../../components/home/kol/PopularKOLs";
import CTASection from "../../components/home/kol/CTASection";
import Footer from "../../components/home/kol/Footer";

const HomePage = () => {
  return (
    <>
      <Box sx={{ minHeight: "100vh", backgroundColor: "white" }}>
        <Navbar />
        <HeroSection />

        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Grid container spacing={3}>
            {/* Filter Sidebar */}
            <Grid item xs={12} lg={3}>
              <FilterSidebar />
            </Grid>

            {/* Main Content */}
            <Grid item xs={12} lg={9}>
              <HottestKOLs />
            </Grid>
          </Grid>
        </Container>

        <PartnerLogos />
        <PopularKOLs />
        <CTASection />
        <Footer />
      </Box>
    </>
  );
};

export default HomePage;
