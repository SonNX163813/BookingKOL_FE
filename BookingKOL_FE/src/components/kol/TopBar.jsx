import * as React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Grow,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import logo from "../../assets/logocty.png";
import NotificationBell from "../common/NotificationBell";

/**
 * Props (optional):
 * - user: { name, email, avatarUrl }
 * - onProfile(), onSettings(), onLogout()
 */
export default function TopBar({
  user = {
    name: "Sofia Rivers",
    email: "sofia.rivers@devias.io",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&h=200&fit=crop",
  },
  onProfile,
  onSettings,
  onLogout,
}) {
  const [anchorAccount, setAnchorAccount] = React.useState(null);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="transparent"
      sx={{
        backdropFilter: "blur(6px)",
        backgroundColor: (t) => t.palette.background.paper,
        borderBottom: (t) => `1px solid ${t.palette.divider}`,
      }}
    >
      <Toolbar sx={{ minHeight: 64, display: "flex", alignItems: "center" }}>
        <Box
          component={RouterLink}
          to="/kol"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            textDecoration: "none",
            mr: 1,
          }}
        >
          <Box component="img" src={logo} alt="Logo" sx={{ height: 45 }} />
        </Box>

        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
          <NotificationBell
            loggedIn={Boolean(user)}
            iconButtonSx={{
              color: "inherit",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
            }}
            menuPaperSx={{ mt: 1 }}
          />

          <Tooltip title="Account">
            <IconButton
              onClick={(e) => setAnchorAccount(e.currentTarget)}
              size="small"
              sx={{ ml: 0.5 }}
            >
              <Avatar
                src={user.avatarUrl}
                alt={user.name}
                sx={{ width: 36, height: 36 }}
              />
            </IconButton>
          </Tooltip>
        </Box>

        <Menu
          anchorEl={anchorAccount}
          open={Boolean(anchorAccount)}
          onClose={() => setAnchorAccount(null)}
          TransitionComponent={Grow}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{ sx: { width: 260, p: 0 } }}
        >
          <Box sx={{ p: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {user.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {user.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem
            onClick={() => {
              setAnchorAccount(null);
              onSettings?.();
            }}
          >
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchorAccount(null);
              onProfile?.();
            }}
          >
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </MenuItem>
          <Divider />
          <MenuItem
            onClick={() => {
              setAnchorAccount(null);
              onLogout?.();
            }}
          >
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Sign out" />
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
