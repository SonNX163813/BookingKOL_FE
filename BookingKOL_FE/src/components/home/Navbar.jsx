import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  useMediaQuery,
  useTheme,
  Divider,
  useScrollTrigger,
  ListItemIcon,
} from "@mui/material";
import { Link, NavLink } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import logoweb from "../../assets/logoweb.png";

// ✅ Thêm route cho từng item
const navItems = [
  { label: "Trang chủ", to: "/" },
  { label: "Về chúng tôi", to: "/ve-chung-toi" },
  { label: "Các gói dịch vụ", to: "/goi-dich-vu" },
  { label: "Blog", to: "/blog" },
  { label: "Quy trình hoàn thiện", to: "/quy-trinh" },
];

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 8 });

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <AppBar
      position="sticky"
      elevation={trigger ? 6 : 0}
      sx={{
        bgcolor: "white",
        color: "#0f172a",
        py: { xs: 0.5, md: 1.5 },
        transition: "box-shadow 200ms ease",
        borderBottom: trigger
          ? "1px solid rgba(2,6,23,0.06)"
          : "1px solid transparent",
      }}
    >
      <Toolbar sx={{ py: { xs: 0.5, md: 1 } }}>
        {/* Wrapper */}
        <Box
          sx={{
            maxWidth: "1536px",
            mx: "auto",
            width: 1,
            px: { xs: 1.5, md: 2 },
          }}
        >
          {/* Hàng chính */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr auto" : "auto 1fr auto",
              alignItems: "center",
              gap: 2,
            }}
          >
            {/* Logo */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                component={Link}
                to="/"
                aria-label="Về trang chủ"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <Box
                  component="img"
                  src={logoweb}
                  alt="KOLBook Logo"
                  sx={{ height: 40, width: "auto", display: "block" }}
                />
              </Box>
            </Box>

            {/* Nav desktop */}
            {!isMobile && (
              <Box
                component="nav"
                sx={{ display: "flex", justifyContent: "center", gap: 1.5 }}
              >
                {navItems.map(({ label, to }) => (
                  <Button
                    key={to}
                    component={NavLink}
                    to={to}
                    color="inherit"
                    disableRipple
                    className={({ isActive }) =>
                      isActive ? "active" : undefined
                    }
                    sx={{
                      px: 1.5,
                      fontWeight: 600,
                      textTransform: "none",
                      fontSize: "0.975rem",
                      borderRadius: 2,
                      // bỏ underline cũ trên Button để tránh full-width
                      "&:hover": { bgcolor: "rgba(192,38,211,0.06)" },
                      // khi active: chỉ underline dưới chữ (span.nav-label)
                      "&.active .nav-label::after": { width: "100%" },
                      // khi hover: cũng cho chạy underline đẹp
                      "&:hover .nav-label::after": { width: "100%" },
                    }}
                  >
                    <Box
                      component="span"
                      className="nav-label"
                      sx={{
                        position: "relative",
                        display: "inline-block",
                        lineHeight: 1.6,
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: -6, // khoảng cách gạch với chữ
                          height: 2,
                          width: 0, // mặc định 0, active/hover sẽ 100%
                          bgcolor: "#c026d3",
                          transition: "width 180ms ease",
                          borderRadius: 2,
                          margin: "0 auto",
                        },
                      }}
                    >
                      {label}
                    </Box>
                  </Button>
                ))}
              </Box>
            )}

            {/* Actions */}
            {!isMobile ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <IconButton
                  color="inherit"
                  sx={{
                    borderRadius: 2,
                    "&:hover": { bgcolor: "rgba(15,23,42,0.04)" },
                  }}
                >
                  <SearchIcon />
                </IconButton>
                <IconButton
                  color="inherit"
                  sx={{
                    borderRadius: 2,
                    "&:hover": { bgcolor: "rgba(15,23,42,0.04)" },
                  }}
                >
                  <PersonIcon />
                </IconButton>
                <Button
                  component={Link}
                  to="/dang-nhap"
                  variant="contained"
                  endIcon={<ArrowForwardRoundedIcon />}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    bgcolor: "#c026d3",
                    boxShadow: "0 6px 20px rgba(192,38,211,0.25)",
                    "&:hover": {
                      bgcolor: "#a21caf",
                      boxShadow: "0 8px 24px rgba(162,28,175,0.3)",
                    },
                  }}
                >
                  Sign In
                </Button>
              </Box>
            ) : (
              <IconButton
                size="large"
                color="inherit"
                aria-label="menu"
                onClick={handleMenuOpen}
                sx={{
                  borderRadius: 2,
                  "&:hover": { bgcolor: "rgba(15,23,42,0.04)" },
                }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>

          {/* Divider nhẹ */}
          {!trigger && (
            <Divider
              sx={{ mt: 1.25, opacity: 0.6, borderColor: "rgba(2,6,23,0.06)" }}
            />
          )}
        </Box>
      </Toolbar>

      {/* Mobile Menu */}
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        keepMounted
        PaperProps={{
          sx: {
            mt: 1,
            width: 260,
            borderRadius: 2,
            border: "1px solid rgba(2,6,23,0.06)",
            boxShadow: "0 12px 40px rgba(2,6,23,0.12)",
          },
        }}
      >
        {navItems.map(({ label, to }) => (
          <MenuItem
            key={to}
            onClick={handleClose}
            component={Link}
            to={to}
            sx={{ py: 1.25 }}
          >
            {label}
          </MenuItem>
        ))}
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleClose} sx={{ py: 1.25 }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <SearchIcon fontSize="small" />
          </ListItemIcon>
          Search
        </MenuItem>
        <MenuItem onClick={handleClose} sx={{ py: 1.25 }}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Account
        </MenuItem>
        <Box sx={{ px: 2, pt: 1.25, pb: 1.75 }}>
          <Button
            fullWidth
            variant="contained"
            endIcon={<ArrowForwardRoundedIcon />}
            component={Link}
            to="/dang-nhap"
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 2,
              bgcolor: "#c026d3",
              "&:hover": { bgcolor: "#a21caf" },
            }}
            onClick={handleClose}
          >
            Sign In
          </Button>
        </Box>
      </Menu>
    </AppBar>
  );
};

export default Navbar;
