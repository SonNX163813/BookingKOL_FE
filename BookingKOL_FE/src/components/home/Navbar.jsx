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
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Avatar,
} from "@mui/material";
import { Link, NavLink, useNavigate } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import logoweb from "../../assets/logocty.png";
import { useAuth } from "../../context/AuthContext";

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
  // hamburger
  const [anchorEl, setAnchorEl] = useState(null);
  // desktop dropdown (Các gói dịch vụ)
  const [dropdownAnchor, setDropdownAnchor] = useState(null);
  // account menu
  const [accountEl, setAccountEl] = useState(null);
  const [accountPinned, setAccountPinned] = useState(false); // GHIM menu khi click

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md")); // <960
  const trigger = useScrollTrigger({ disableHysteresis: true, threshold: 8 });
  const navigate = useNavigate();

  const auth = useAuth?.() || {};
  const { token, user, logout } = auth;
  const loggedIn = !!token;

  // hamburger
  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  // services dropdown (desktop)
  const handleDropdownOpen = (e) => setDropdownAnchor(e.currentTarget);
  const handleDropdownClose = () => setDropdownAnchor(null);

  // account menu helpers
  const openAccount = (el) => setAccountEl(el);
  const closeAccount = () => {
    setAccountEl(null);
    setAccountPinned(false);
  };

  // Hover desktop: mở thả xuống nếu chưa ghim
  const handleAccountHover = (e) => {
    if (isMobile) return; // không dùng hover trên mobile
    if (!accountPinned) openAccount(e.currentTarget);
  };

  // Click: toggle ghim
  const handleAccountClick = (e) => {
    if (accountPinned && accountEl) {
      closeAccount(); // đang ghim -> click lần nữa để đóng
      return;
    }
    setAccountPinned(true); // ghim
    openAccount(e.currentTarget);
  };

  const handleLogout = () => {
    closeAccount();
    logout?.();
    navigate("/", { replace: true });
  };

  // CTA styles
  const primaryCtaSx = {
    borderRadius: "999px",
    px: { xs: 2, sm: 2.5, md: 3 },
    py: { xs: 0.9, sm: 1.1, md: 1.5 },
    fontSize: { xs: "0.875rem", sm: "0.95rem", md: "1rem" },
    backgroundImage: "linear-gradient(135deg, #4a74da 0%, #93cef6 100%)",
    boxShadow: "0px 18px 30px rgba(74, 116, 218, 0.28)",
    textTransform: "none",
    fontWeight: 700,
    minWidth: "auto",
  };

  const linkCtaSx = {
    color: "#0f172a",
    fontWeight: 700,
    fontSize: { xs: "0.9rem", md: "0.975rem" },
    textDecoration: "none",
    letterSpacing: 0,
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    "&:hover": { textDecoration: "underline" },
  };

  const accountBtnSx = {
    display: "inline-flex",
    alignItems: "center",
    gap: 1,
    fontWeight: 700,
    textTransform: "none",
    borderRadius: 999,
    px: 1,
    py: 0.5,
    color: "#0f172a",
    "&:hover": { bgcolor: "rgba(15,23,42,0.04)" },
  };

  const fullName =
    user?.fullName || user?.name || user?.username || "Tài khoản";
  const shortName =
    fullName?.trim()?.split(/\s+/)?.slice(-1)?.[0] || "Tài khoản";
  const avatarUrl = user?.avatarUrl || user?.avatar || user?.imageUrl || "";
  const initial = (fullName?.[0] || "U").toUpperCase();

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
              gridTemplateColumns: isMobile ? "auto 1fr auto" : "auto 1fr auto",
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

            {/* Actions */}
            {!isMobile ? (
              // Desktop
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                {!loggedIn ? (
                  <>
                    <Box component={Link} to="/register" sx={linkCtaSx}>
                      Đăng ký
                    </Box>
                    <Button
                      component={Link}
                      to="/login"
                      variant="contained"
                      sx={primaryCtaSx}
                    >
                      Đăng nhập
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Nút tài khoản: hover mở tạm, click ghim */}
                    <Button
                      onMouseEnter={handleAccountHover}
                      onClick={handleAccountClick}
                      sx={accountBtnSx}
                    >
                      <Avatar
                        src={avatarUrl}
                        alt={fullName}
                        sx={{ width: 28, height: 28, fontSize: 14 }}
                      >
                        {initial}
                      </Avatar>
                      {shortName}
                    </Button>
                  </>
                )}
              </Box>
            ) : (
              // Mobile: căn phải
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  justifySelf: "end",
                }}
              >
                {!loggedIn ? (
                  <>
                    <Box
                      component={Link}
                      to="/register"
                      sx={{
                        ...linkCtaSx,
                        display: { xs: "none", sm: "inline-flex" },
                      }}
                    >
                      Đăng ký
                    </Box>
                    <Button
                      component={Link}
                      to="/login"
                      variant="contained"
                      sx={{ ...primaryCtaSx, px: 2, py: 1.1 }}
                    >
                      Đăng nhập
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Mobile: click mở (không hover) */}
                    <Button
                      onClick={handleAccountClick}
                      sx={{ ...accountBtnSx, px: 1 }}
                    >
                      <Avatar
                        src={avatarUrl}
                        alt={fullName}
                        sx={{ width: 26, height: 26, fontSize: 13 }}
                      >
                        {initial}
                      </Avatar>
                      {shortName}
                    </Button>
                  </>
                )}

                <IconButton
                  size="large"
                  color="inherit"
                  aria-label="menu"
                  onClick={handleMenuOpen}
                  sx={{
                    mr: "5px",
                    borderRadius: 2,
                    "&:hover": { bgcolor: "rgba(15,23,42,0.04)" },
                  }}
                >
                  <MenuIcon />
                </IconButton>
              </Box>
            )}
          </Box>

          {!trigger && (
            <Divider
              sx={{ mt: 1.25, opacity: 0.6, borderColor: "rgba(2,6,23,0.06)" }}
            />
          )}
        </Box>
      </Toolbar>

      {/* Hamburger Menu */}
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
              <MenuItem
                disabled
                sx={{ py: 1.25, opacity: 0.9, fontWeight: 800 }}
              >
                {item.label}
              </MenuItem>
              {item.subItems.map((subItem) => (
                <MenuItem
                  key={subItem.to}
                  onClick={handleClose}
                  component={Link}
                  to={subItem.to}
                  sx={{ py: 1.25, pl: 4, fontWeight: 700 }}
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
              sx={{ py: 1.25, fontWeight: 700 }}
            >
              {item.label}
            </MenuItem>
          )
        )}
        <Divider sx={{ my: 0.5 }} />
      </Menu>

      {/* Hover dropdown (desktop) */}
      <Popover
        open={Boolean(dropdownAnchor)}
        anchorEl={dropdownAnchor}
        onClose={handleDropdownClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
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

      {/* Account dropdown (hover để mở tạm, click để ghim) */}
      <Menu
        anchorEl={accountEl}
        open={Boolean(accountEl)}
        onClose={closeAccount}
        disableRestoreFocus
        keepMounted
        PaperProps={{
          onMouseEnter: () => {}, // giữ mở khi rê trên menu
          onMouseLeave: () => {
            if (!accountPinned) closeAccount(); // chỉ đóng nếu chưa ghim
          },
          sx: {
            mt: 1,
            width: 240,
            borderRadius: 2,
            border: "1px solid rgba(2,6,23,0.06)",
            boxShadow: "0 12px 40px rgba(2,6,23,0.12)",
          },
        }}
      >
        <MenuItem
          component={Link}
          to="/userprofile"
          onClick={closeAccount}
          sx={{ fontWeight: 700, py: 1.25 }}
        >
          Tài khoản của tôi
        </MenuItem>
        <MenuItem
          component={Link}
          to="/don-mua"
          onClick={closeAccount}
          sx={{ fontWeight: 700, py: 1.25 }}
        >
          Đơn đặt lịch
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => {
            closeAccount();
            handleLogout();
          }}
          sx={{ fontWeight: 700, py: 1.25 }}
        >
          Đăng xuất
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Navbar;
