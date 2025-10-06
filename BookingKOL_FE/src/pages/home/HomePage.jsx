import React from "react";
import { Box } from "@mui/material";
import HeroBanner from "../../components/home/nexusLanding/HeroBanner";
import IntroSection from "../../components/home/nexusLanding/IntroSection";
import CEOMessage from "../../components/home/nexusLanding/CEOMessage";
import WhyChooseSection from "../../components/home/nexusLanding/WhyChooseSection";
import ServicesSection from "../../components/home/nexusLanding/ServicesSection";
import IndustriesSection from "../../components/home/nexusLanding/IndustriesSection";
import CaseStudiesSection from "../../components/home/nexusLanding/CaseStudiesSection";
import ProcessSection from "../../components/home/nexusLanding/ProcessSection";
import LeadFormsSection from "../../components/home/nexusLanding/LeadFormsSection";

const pageBackground = {
  minHeight: "100vh",
  // backgroundColor: "#ffffff",
  // backgroundImage: `
  //   radial-gradient(circle at 12% 18%, rgba(141, 226, 237, 0.55), rgba(255, 255, 255, 0) 52%),
  //   radial-gradient(circle at 88% 12%, rgba(147, 206, 246, 0.55), rgba(255, 255, 255, 0) 52%),
  //   radial-gradient(circle at 50% 100%, rgba(74, 116, 218, 0.28), rgba(255, 255, 255, 0.85) 70%)
  // `,
  display: "flex",
  flexDirection: "column",
};
const componentSx = {
  backgroundImage: `
  radial-gradient(circle at 50% 50%, rgba(141, 226, 237, 0.85) 0%, rgba(255, 255, 255, 0.9) 65%),
  radial-gradient(circle at 15% 20%, rgba(147, 206, 246, 0.55) 0%, rgba(255, 255, 255, 0) 60%),
  radial-gradient(circle at 85% 10%, rgba(74, 116, 218, 0.45) 0%, rgba(255, 255, 255, 0) 70%)
`,
};
const sectionsWrapperSx = {
  display: "flex",
  flexDirection: "column",
  gap: { xs: 6, md: 8 },
  flexGrow: 1,
};

const HomePage = () => {
  return (
    <Box sx={pageBackground}>
      <Box component="main">
        <Box sx={componentSx}>
          <HeroBanner />
        </Box>
        <Box sx={componentSx}>
          <IntroSection />
        </Box>
        <Box sx={componentSx}>
          <CEOMessage />
        </Box>
        <Box sx={componentSx}>
          <WhyChooseSection />
        </Box>
        <Box sx={componentSx}>
          <ServicesSection />
        </Box>
        <Box sx={componentSx}>
          <IndustriesSection />
        </Box>
        <Box sx={componentSx}>
          <CaseStudiesSection />
        </Box>
        <Box sx={componentSx}>
          <ProcessSection />
        </Box>
        <Box sx={componentSx}>
          <LeadFormsSection />
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;
