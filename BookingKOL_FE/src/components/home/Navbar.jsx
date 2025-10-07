import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
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
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { Link, NavLink } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import logoweb from "../../assets/logoweb.png";

const navItems = [
  { label: "Trang chủ", to: "/" },
  { label: "Về chúng tôi", to: "/ve-chung-toi" },
  {
    label: "Các gói dịch vụ",
    hasDropdown: true,
    subItems: [
      { label: "Danh sách KOL", to: "/danh-sach-kol" },
      { label: "Danh sách khóa đào tạo livestream", to: "/danh-sach-khoa-hoc" },
    ],
  },
  { label: "Blog", to: "/blog" },
  { label: "Quy trình hoàn thiện", to: "/quy-trinh" },
  { label: "Trợ lý ảo AI", to: "/chat-AI" },
];

const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [dropdownAnchor, setDropdownAnchor] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 8 });

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleDropdownOpen = (e) => setDropdownAnchor(e.currentTarget);
  const handleDropdownClose = () => setDropdownAnchor(null);

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
        <Box
          sx={{
            maxWidth: "1536px",
            mx: "auto",
            width: 1,
            px: { xs: 1.5, md: 2 },
          }}
        >
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
                {navItems.map((item) =>
                  item.hasDropdown ? (
                    <Button
                      key={item.label}
                      color="inherit"
                      disableRipple
                      onMouseEnter={handleDropdownOpen}
                      endIcon={<KeyboardArrowDownIcon />}
                      sx={{
                        px: 1.5,
                        fontWeight: 600,
                        textTransform: "none",
                        fontSize: "0.975rem",
                        borderRadius: 2,
                        "&:hover": { bgcolor: "rgba(192,38,211,0.06)" },
                      }}
                    >
                      <Box
                        component="span"
                        className="nav-label"
                        sx={{
                          position: "relative",
                          display: "inline-block",
                          lineHeight: 1.6,
                        }}
                      >
                        {item.label}
                      </Box>
                    </Button>
                  ) : (
                    <Button
                      key={item.to}
                      component={NavLink}
                      to={item.to}
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
                        "&:hover": { bgcolor: "rgba(192,38,211,0.06)" },
                        "&.active .nav-label::after": { width: "100%" },
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
                            bottom: -6,
                            height: 2,
                            width: 0,
                            bgcolor: "#c026d3",
                            transition: "width 180ms ease",
                            borderRadius: 2,
                            margin: "0 auto",
                          },
                        }}
                      >
                        {item.label}
                      </Box>
                    </Button>
                  )
                )}
              </Box>
            )}

            {/* Dropdown Menu */}
            <Popover
              open={Boolean(dropdownAnchor)}
              anchorEl={dropdownAnchor}
              onClose={handleDropdownClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "left",
              }}
              slotProps={{
                paper: {
                  onMouseLeave: handleDropdownClose,
                  sx: {
                    mt: 1,
                    minWidth: 280,
                    borderRadius: 2,
                    border: "1px solid rgba(2,6,23,0.06)",
                    boxShadow: "0 12px 40px rgba(2,6,23,0.12)",
                  },
                },
              }}
              disableRestoreFocus
            >
              <List sx={{ py: 1 }}>
                {navItems
                  .find((item) => item.hasDropdown)
                  ?.subItems.map((subItem) => (
                    <ListItem key={subItem.to} disablePadding>
                      <ListItemButton
                        component={Link}
                        to={subItem.to}
                        onClick={handleDropdownClose}
                        sx={{
                          py: 1.5,
                          px: 2,
                          "&:hover": {
                            bgcolor: "rgba(192,38,211,0.06)",
                          },
                        }}
                      >
                        <ListItemText primary={subItem.label} />
                      </ListItemButton>
                    </ListItem>
                  ))}
              </List>
            </Popover>

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
        {navItems.map((item) =>
          item.hasDropdown ? (
            <Box key={item.label}>
              <MenuItem disabled sx={{ py: 1.25, opacity: 0.7 }}>
                {item.label}
              </MenuItem>
              {item.subItems.map((subItem) => (
                <MenuItem
                  key={subItem.to}
                  onClick={handleClose}
                  component={Link}
                  to={subItem.to}
                  sx={{ py: 1.25, pl: 4 }}
                >
                  {subItem.label}
                </MenuItem>
              ))}
            </Box>
          ) : (
            <MenuItem
              key={item.to}
              onClick={handleClose}
              component={Link}
              to={item.to}
              sx={{ py: 1.25 }}
            >
              {item.label}
            </MenuItem>
          )
        )}
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
