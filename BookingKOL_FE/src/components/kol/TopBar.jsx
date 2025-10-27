import * as React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Badge,
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
  Paper,
  List,
  ListItemButton,
  ListItemAvatar,
} from "@mui/material";
import {
  NotificationsNone as NotificationsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import logo from "../../assets/logocty.png"; // 👈 đường dẫn khi file nằm trong src/components/kol

/**
 * Props (optional):
 * - user: { name, email, avatarUrl }
 * - notifications: [{ id, title, subtitle, unread }]
 * - onProfile(), onSettings(), onLogout()
 */
export default function TopBar({
  user = {
    name: "Sofia Rivers",
    email: "sofia.rivers@devias.io",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&h=200&fit=crop",
  },
  notifications,
  onProfile,
  onSettings,
  onLogout,
}) {
  const [anchorNotif, setAnchorNotif] = React.useState(null);
  const [anchorAccount, setAnchorAccount] = React.useState(null);

  const demoNotifs = React.useMemo(
    () => [
      {
        id: 1,
        title: "New booking request",
        subtitle: "Brand A • 2m ago",
        unread: true,
      },
      {
        id: 2,
        title: "Schedule updated",
        subtitle: "System • 1h ago",
        unread: true,
      },
      {
        id: 3,
        title: "Payout processed",
        subtitle: "Finance • yesterday",
        unread: false,
      },
    ],
    []
  );
  const notifList = notifications ?? demoNotifs;
  const unreadCount = notifList.filter((n) => n.unread).length;

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
        {/* Logo thay chữ BookingKOL */}
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
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              onClick={(e) => setAnchorNotif(e.currentTarget)}
              size="large"
            >
              <Badge badgeContent={unreadCount} color="error" max={9}>
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Account */}
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

        {/* Notifications Menu */}
        <Menu
          anchorEl={anchorNotif}
          open={Boolean(anchorNotif)}
          onClose={() => setAnchorNotif(null)}
          TransitionComponent={Grow}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{ sx: { width: 360, p: 0, maxHeight: 420 } }}
        >
          <Box sx={{ p: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You have {unreadCount} unread
            </Typography>
          </Box>
          <Divider />
          <Paper elevation={0} sx={{ maxHeight: 340, overflow: "auto" }}>
            <List disablePadding>
              {notifList.map((n) => (
                <ListItemButton key={n.id} dense>
                  <ListItemAvatar>
                    <Avatar sx={{ width: 36, height: 36 }}>
                      <NotificationsIcon fontSize="small" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={n.title}
                    secondary={n.subtitle}
                    primaryTypographyProps={{
                      fontWeight: n.unread ? 700 : 500,
                      sx: { lineHeight: 1.25 },
                    }}
                    secondaryTypographyProps={{ color: "text.secondary" }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Paper>
          <Divider />
          <Box sx={{ p: 1 }}>
            <ListItemButton onClick={() => setAnchorNotif(null)}>
              <ListItemText primary="Mark all as read" />
            </ListItemButton>
          </Box>
        </Menu>

        {/* Account Menu */}
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
