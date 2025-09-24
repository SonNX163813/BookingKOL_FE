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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import logoweb from "../../../assets/logoweb.png";
const Navbar = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      position="sticky"
      sx={{ backgroundColor: "white", color: "#1e293b", boxShadow: 1 }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        {/* Logo */}
        <Typography
          variant="h4"
          component="div"
          sx={{ fontWeight: "bold", color: "#c026d3" }}
        >
          <img
            src={logoweb}
            alt="KOLBook Logo"
            style={{ height: 40, marginRight: 8, verticalAlign: "middle" }}
          />
        </Typography>

        {/* Desktop Navigation */}
        {!isMobile && (
          <Box sx={{ display: "flex", gap: 4 }}>
            {["Home", "KOLs", "Categories", "About"].map((item) => (
              <Button key={item} color="inherit" sx={{ fontWeight: "medium" }}>
                {item}
              </Button>
            ))}
          </Box>
        )}

        {/* Desktop Actions */}
        {!isMobile && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton color="inherit">
              <SearchIcon />
            </IconButton>
            <IconButton color="inherit">
              <PersonIcon />
            </IconButton>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#c026d3",
                "&:hover": { backgroundColor: "#a21caf" },
              }}
            >
              Sign In
            </Button>
          </Box>
        )}

        {/* Mobile menu button */}
        {isMobile && (
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* Mobile Menu */}
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          keepMounted
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          {["Home", "KOLs", "Categories", "About"].map((item) => (
            <MenuItem key={item} onClick={handleClose}>
              {item}
            </MenuItem>
          ))}
          <MenuItem onClick={handleClose}>
            <SearchIcon sx={{ mr: 1 }} />
            Search
          </MenuItem>
          <MenuItem onClick={handleClose}>
            <PersonIcon sx={{ mr: 1 }} />
            Account
          </MenuItem>
          <MenuItem onClick={handleClose}>
            <Button
              variant="contained"
              fullWidth
              sx={{
                backgroundColor: "#c026d3",
                "&:hover": { backgroundColor: "#a21caf" },
              }}
            >
              Sign In
            </Button>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
