import React from "react";
import { Container, Box } from "@mui/material";
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
        {/* <Navbar /> */}
        <HeroSection />

        <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "320px minmax(0, 1fr)",
              },
              gap: { xs: 3, md: 4 },
              alignItems: "start",
              "& > *": { minWidth: 0 },
            }}
          >
            {/* Filter Sidebar */}
            <FilterSidebar />

            {/* Hot KOL carousel */}
            <HottestKOLs />
          </Box>
        </Container>

        <PartnerLogos />
        <PopularKOLs />
        <CTASection />
        {/* <Footer /> */}
      </Box>
    </>
  );
};

export default HomePage;
