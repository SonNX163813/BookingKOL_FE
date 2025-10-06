import React from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Link,
  IconButton,
  Divider,
  Stack,
} from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import YouTubeIcon from "@mui/icons-material/YouTube";

const textMuted = "#9ca3af";
const textLight = "#d1d5db";
const brandAccent = "#e879f9";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        background:
          "radial-gradient(60% 100% at 0% 0%, rgba(147,206,246,0.08) 0%, rgba(147,206,246,0) 60%), \
       radial-gradient(50% 100% at 100% 0%, rgba(255,161,218,0.06) 0%, rgba(255,161,218,0) 60%), \
       linear-gradient(180deg, #0b1320, #111827)",
        color: "white",
        pt: { xs: 6, md: 8 },
        pb: { xs: 6, md: 8 },
        borderTop: "1px solid rgba(148, 163, 184, 0.18)",
      }}
    >
      <Container
        maxWidth={false}
        sx={{
          maxWidth: "1600px", // hoặc 1440px tùy layout
          mx: "auto",
          px: { xs: 3, md: 6 },
        }}
      >
        <Grid
          container
          spacing={{ xs: 4, md: 6 }}
          justifyContent="space-between"
          alignItems="flex-start"
        >
          {/* Cột 1: About / Brand */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, color: brandAccent, mb: 1 }}
            >
              Nexus Agency
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: textLight, mb: 3, maxWidth: 400, lineHeight: 1.7 }}
            >
              Nền tảng dịch vụ livestream all-in-one: setup – đào tạo – booking
              – vận hành – affiliate/MCN.
            </Typography>

            <Stack direction="row" spacing={1.5}>
              {[
                FacebookIcon,
                TwitterIcon,
                InstagramIcon,
                LinkedInIcon,
                YouTubeIcon,
              ].map((Icon, i) => (
                <IconButton
                  key={i}
                  component="a"
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ color: textMuted, "&:hover": { color: brandAccent } }}
                >
                  <Icon />
                </IconButton>
              ))}
            </Stack>
          </Grid>

          {/* Cột 2: Menu */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 2,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Menu
            </Typography>
            <Stack spacing={1.2}>
              {[
                { label: "Trang chủ", href: "#" },
                { label: "Dịch vụ", href: "#" },
                { label: "Case Study", href: "#" },
                { label: "Blog", href: "#" },
                { label: "Tuyển dụng", href: "#" },
                { label: "Liên hệ", href: "#" },
                { label: "Điều khoản & Bảo mật", href: "#" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  underline="none"
                  sx={{
                    color: textLight,
                    "&:hover": { color: "white" },
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1,
                    transition: "color 0.2s ease",
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Cột 3: Thông tin */}
          <Grid item xs={12} md={4}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 2,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Thông tin
            </Typography>
            <Stack spacing={1.2} sx={{ color: textLight }}>
              <Typography>
                <strong style={{ color: "white" }}>Công ty:</strong> Nexus
                Agency
              </Typography>
              <Typography>
                <strong style={{ color: "white" }}>MST:</strong> Đang cập nhật
              </Typography>
              <Typography>
                <strong style={{ color: "white" }}>Hotline:</strong>{" "}
                <Link
                  href="tel:0900000000"
                  underline="hover"
                  sx={{ color: textLight, "&:hover": { color: "white" } }}
                >
                  0900 000 000
                </Link>
              </Typography>
              <Typography>
                <strong style={{ color: "white" }}>Email:</strong>{" "}
                <Link
                  href="mailto:contact@nexus.agency"
                  underline="hover"
                  sx={{ color: textLight, "&:hover": { color: "white" } }}
                >
                  contact@nexus.agency
                </Link>
              </Typography>
              <Typography>
                <strong style={{ color: "white" }}>Địa chỉ:</strong> 123 Đường
                ABC, Quận 1, TP. Hồ Chí Minh
              </Typography>
              <Typography>
                <strong style={{ color: "white" }}>Social:</strong>{" "}
                <Link
                  href="#"
                  underline="hover"
                  sx={{ color: textLight, "&:hover": { color: "white" } }}
                >
                  Facebook
                </Link>{" "}
                ·{" "}
                <Link
                  href="#"
                  underline="hover"
                  sx={{ color: textLight, "&:hover": { color: "white" } }}
                >
                  LinkedIn
                </Link>{" "}
                ·{" "}
                <Link
                  href="#"
                  underline="hover"
                  sx={{ color: textLight, "&:hover": { color: "white" } }}
                >
                  YouTube
                </Link>
              </Typography>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: "rgba(55, 65, 81, 0.72)" }} />

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <Typography variant="body2" sx={{ color: textMuted }}>
            © {new Date().getFullYear()} Nexus Agency. All rights reserved.
          </Typography>

          <Stack
            direction="row"
            spacing={2}
            sx={{ color: textMuted, flexWrap: "wrap" }}
          >
            <Link
              href="#"
              underline="hover"
              sx={{ color: textMuted, "&:hover": { color: "white" } }}
            >
              Điều khoản
            </Link>
            <Typography sx={{ opacity: 0.5 }}>•</Typography>
            <Link
              href="#"
              underline="hover"
              sx={{ color: textMuted, "&:hover": { color: "white" } }}
            >
              Bảo mật
            </Link>
            <Typography sx={{ opacity: 0.5 }}>•</Typography>
            <Link
              href="#"
              underline="hover"
              sx={{ color: textMuted, "&:hover": { color: "white" } }}
            >
              Chính sách Cookie
            </Link>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
