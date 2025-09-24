import React from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Link,
  IconButton,
  Divider,
} from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import YouTubeIcon from "@mui/icons-material/YouTube";

const Footer = () => {
  return (
    <Box sx={{ backgroundColor: "#1e293b", color: "white", py: 6 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand */}
          <Grid item xs={12} md={6}>
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", color: "#e879f9", mb: 2 }}
            >
              KOLBook
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: "#d1d5db", mb: 3, maxWidth: "28rem" }}
            >
              The premier platform connecting brands with top-tier influencers
              and KOLs. Amplify your reach and create meaningful partnerships.
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <IconButton
                sx={{ color: "#9ca3af", "&:hover": { color: "#e879f9" } }}
              >
                <FacebookIcon />
              </IconButton>
              <IconButton
                sx={{ color: "#9ca3af", "&:hover": { color: "#e879f9" } }}
              >
                <TwitterIcon />
              </IconButton>
              <IconButton
                sx={{ color: "#9ca3af", "&:hover": { color: "#e879f9" } }}
              >
                <InstagramIcon />
              </IconButton>
              <IconButton
                sx={{ color: "#9ca3af", "&:hover": { color: "#e879f9" } }}
              >
                <LinkedInIcon />
              </IconButton>
              <IconButton
                sx={{ color: "#9ca3af", "&:hover": { color: "#e879f9" } }}
              >
                <YouTubeIcon />
              </IconButton>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={6} md={3}>
            <Typography variant="h6" sx={{ fontWeight: "semibold", mb: 2 }}>
              Quick Links
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Link
                href="#"
                sx={{
                  color: "#d1d5db",
                  textDecoration: "none",
                  "&:hover": { color: "white" },
                }}
              >
                Browse KOLs
              </Link>
              <Link
                href="#"
                sx={{
                  color: "#d1d5db",
                  textDecoration: "none",
                  "&:hover": { color: "white" },
                }}
              >
                Categories
              </Link>
              <Link
                href="#"
                sx={{
                  color: "#d1d5db",
                  textDecoration: "none",
                  "&:hover": { color: "white" },
                }}
              >
                How It Works
              </Link>
              <Link
                href="#"
                sx={{
                  color: "#d1d5db",
                  textDecoration: "none",
                  "&:hover": { color: "white" },
                }}
              >
                Success Stories
              </Link>
            </Box>
          </Grid>

          {/* Support */}
          <Grid item xs={6} md={3}>
            <Typography variant="h6" sx={{ fontWeight: "semibold", mb: 2 }}>
              Support
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Link
                href="#"
                sx={{
                  color: "#d1d5db",
                  textDecoration: "none",
                  "&:hover": { color: "white" },
                }}
              >
                Help Center
              </Link>
              <Link
                href="#"
                sx={{
                  color: "#d1d5db",
                  textDecoration: "none",
                  "&:hover": { color: "white" },
                }}
              >
                Contact Us
              </Link>
              <Link
                href="#"
                sx={{
                  color: "#d1d5db",
                  textDecoration: "none",
                  "&:hover": { color: "white" },
                }}
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                sx={{
                  color: "#d1d5db",
                  textDecoration: "none",
                  "&:hover": { color: "white" },
                }}
              >
                Terms of Service
              </Link>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: "#374151" }} />

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body2" sx={{ color: "#9ca3af" }}>
            © {new Date().getFullYear()} KOLBook. All rights reserved.
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "#9ca3af", mt: { xs: 1, md: 0 } }}
          >
            Built with ❤️ by{" "}
            <Link
              href="https://meku.dev"
              target="_blank"
              rel="nofollow"
              sx={{
                color: "#e879f9",
                textDecoration: "none",
                "&:hover": { color: "#d946ef" },
              }}
            >
              Meku.dev
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
