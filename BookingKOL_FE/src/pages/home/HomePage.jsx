import React from "react";
import { Box } from "@mui/material";

import HeroBanner from "../../components/home/nexusLanding/HeroBanner";
import ServicesSection from "../../components/home/nexusLanding/ServicesSection";
import IntroSection from "../../components/home/nexusLanding/IntroSection";
import CEOMessage from "../../components/home/nexusLanding/CEOMessage";
import WhyChooseSection from "../../components/home/nexusLanding/WhyChooseSection";
import IndustriesSection from "../../components/home/nexusLanding/IndustriesSection";
import CaseStudiesSection from "../../components/home/nexusLanding/CaseStudiesSection";
import ProcessSection from "../../components/home/nexusLanding/ProcessSection";
import LeadFormsSection from "../../components/home/nexusLanding/LeadFormsSection";

import ScrollReveal from "../../components/home/nexusLanding/ScrollReveal";

const pageSx = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  backgroundColor: "#fff",
  isolation: "isolate",
};

const bgLayerSx = {
  position: "absolute",
  inset: 0,
  zIndex: 0,
  pointerEvents: "none",
  backgroundColor: "#fff",
  // ✅ NGANG trái -> phải
  backgroundImage:
    "linear-gradient(90deg, rgba(30, 201, 253, 0.2) 0%, rgba(224, 163, 194, 0.32) 100%)",
};

const contentSx = {
  position: "relative",
  zIndex: 1,
  display: "flex",
  flexDirection: "column",
};

const sectionWrapSx = { background: "transparent" };

const HomePage = () => {
  return (
    <Box sx={pageSx}>
      <Box sx={bgLayerSx} aria-hidden />

      <Box component="main" sx={contentSx}>
        <Box sx={sectionWrapSx}>
          <HeroBanner />
        </Box>

        <Box sx={sectionWrapSx}>
          <ScrollReveal amount={0.2} y={18}>
            <ServicesSection />
          </ScrollReveal>
        </Box>

        <Box sx={sectionWrapSx}>
          <ScrollReveal amount={0.2} y={18}>
            <IntroSection />
          </ScrollReveal>
        </Box>

        <Box sx={sectionWrapSx}>
          <ScrollReveal amount={0.2} y={18}>
            <CEOMessage />
          </ScrollReveal>
        </Box>

        {/* <Box sx={sectionWrapSx}>
          <ScrollReveal amount={0.2} y={18}>
            <WhyChooseSection />
          </ScrollReveal>
        </Box> */}

        <Box sx={sectionWrapSx}>
          <ScrollReveal amount={0.2} y={18}>
            <IndustriesSection />
          </ScrollReveal>
        </Box>

        {/* <Box sx={sectionWrapSx}>
          <ScrollReveal amount={0.2} y={18}>
            <CaseStudiesSection />
          </ScrollReveal>
        </Box> */}

        {/* <Box sx={sectionWrapSx}>
          <ScrollReveal amount={0.2} y={18}>
            <ProcessSection />
          </ScrollReveal>
        </Box> */}

        <Box sx={sectionWrapSx}>
          <ScrollReveal amount={0.15} y={18}>
            <LeadFormsSection />
          </ScrollReveal>
        </Box>
      </Box>
    </Box>
  );
};

export default HomePage;
