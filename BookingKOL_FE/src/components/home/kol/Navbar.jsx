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
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import logoweb from "../../../assets/logoweb.png";

const navItems = [
  "Trang chủ",
  "Về chúng tôi",
  "Các gói dịch vụ",
  "Blog",
  "Quy trình hoàn thiện",
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
        {/* Wrapper: giới hạn 1536px và căn giữa */}
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
                component="img"
                src={logoweb}
                alt="KOLBook Logo"
                sx={{ height: 40, width: "auto" }}
              />
            </Box>

            {/* Nav desktop */}
            {!isMobile && (
              <Box
                component="nav"
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 1.5,
                }}
              >
                {navItems.map((item) => (
                  <Button
                    key={item}
                    color="inherit"
                    disableRipple
                    sx={{
                      px: 1.5,
                      fontWeight: 600,
                      textTransform: "none",
                      fontSize: "0.975rem",
                      borderRadius: 2,
                      "&::after": {
                        content: '""',
                        display: "block",
                        height: 2,
                        width: 0,
                        bgcolor: "#c026d3",
                        transition: "width 180ms ease",
                        mt: 0.75,
                        borderRadius: 2,
                      },
                      "&:hover": {
                        bgcolor: "rgba(192,38,211,0.06)",
                      },
                      // "&:hover::after": {
                      //   width: "100%",
                      // },
                    }}
                  >
                    {item}
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

          {/* Gạch phân tách rất nhẹ dưới thanh (đẹp hơn, dễ nhìn) */}
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
        {navItems.map((item) => (
          <MenuItem key={item} onClick={handleClose} sx={{ py: 1.25 }}>
            {item}
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
