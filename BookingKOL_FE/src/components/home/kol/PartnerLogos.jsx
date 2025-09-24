import React from "react";
import { Box, Container, Typography, Grid } from "@mui/material";
import { motion } from "framer-motion";
// Mock data for partner logos
const partners = [
  {
    id: 1,
    name: "Brand One",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg",
  },
  {
    id: 2,
    name: "Brand Two",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg",
  },
  {
    id: 3,
    name: "Brand Three",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
  },
  {
    id: 4,
    name: "Brand Four",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
  },
  {
    id: 5,
    name: "Brand Five",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
  },
  {
    id: 6,
    name: "Brand Six",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
  },
];
const PartnerLogos = () => {
  return (
    <Box
      sx={{
        py: 10,
        bgcolor: "white",
      }}
    >
      <Container maxWidth="lg">
        <motion.div
          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.8,
          }}
          viewport={{
            once: true,
          }}
        >
          <Typography
            variant="h4"
            component="h2"
            sx={{
              mb: 5,
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            Trusted By Leading Brands
          </Typography>
        </motion.div>
        <Grid container spacing={4} justifyContent="center">
          {partners.map((partner, index) => (
            <Grid item xs={6} sm={4} md={2} key={partner.id}>
              <motion.div
                initial={{
                  opacity: 0,
                }}
                whileInView={{
                  opacity: 0.7,
                }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
                whileHover={{
                  opacity: 1,
                  scale: 1.1,
                  transition: {
                    duration: 0.3,
                  },
                }}
                viewport={{
                  once: true,
                }}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100px",
                }}
              >
                <Box
                  component="img"
                  src={partner.logo}
                  alt={partner.name}
                  sx={{
                    maxWidth: "100%",
                    maxHeight: "60px",
                    filter: "grayscale(100%)",
                    transition: "filter 0.3s ease",
                    "&:hover": {
                      filter: "grayscale(0%)",
                    },
                  }}
                />
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};
export default PartnerLogos;
