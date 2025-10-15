// src/components/kol/SideNavKol.jsx
import { useState, Fragment } from "react";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Toolbar,
  Box,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import EventRounded from "@mui/icons-material/EventRounded";
import ShoppingBagOutlined from "@mui/icons-material/ShoppingBagOutlined";
import ChatBubbleOutlineRounded from "@mui/icons-material/ChatBubbleOutlineRounded";
import PersonOutline from "@mui/icons-material/PersonOutline";
import PaidOutlined from "@mui/icons-material/PaidOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import MenuRounded from "@mui/icons-material/MenuRounded";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useNavigate, useLocation } from "react-router-dom";

export const NAV_WIDTH = 270;

const items = [
  { label: "Tổng quan", icon: DashboardRounded, to: "/kol" },
  { label: "Lịch làm việc", icon: EventRounded, to: "/kol/schedule" },
  { label: "Đơn booking", icon: ShoppingBagOutlined, to: "/kol/orders" },
  { label: "Tin nhắn", icon: ChatBubbleOutlineRounded, to: "/kol/messages" },
  {
    label: "Hồ sơ",
    icon: PersonOutline,
    children: [
      { label: "Thông tin cá nhân", to: "/kol/profile" },
      { label: "Cài đặt hiển thị", to: "/kol/settings" },
    ],
  },
  { label: "Doanh thu", icon: PaidOutlined, to: "/kol/earnings" },
];

export default function SideNavKol({ mobileOpen, onToggle }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [openMap, setOpenMap] = useState({});

  const content = (
    <Box sx={{ px: 1.25, py: 1 }}>
      <Box sx={{ px: 1, py: 1, display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton sx={{ display: { md: "none" } }} onClick={onToggle}>
          <MenuRounded />
        </IconButton>
        <Typography sx={{ fontWeight: 700, letterSpacing: 0.4 }}>
          KOL Management
        </Typography>
      </Box>
      <Divider />
      <List sx={{ px: 1, py: 0.5 }}>
        {items.map((it) => {
          const Icon = it.icon;
          const hasChild = !!it.children?.length;
          const selected = it.to && pathname === it.to;
          return (
            <Fragment key={it.label}>
              <ListItemButton
                onClick={() =>
                  hasChild
                    ? setOpenMap((m) => ({ ...m, [it.label]: !m[it.label] }))
                    : navigate(it.to)
                }
                selected={!!selected}
                sx={(t) => ({
                  borderRadius: 1.75,
                  mb: 0.5,
                  px: 1.25,
                  "&.Mui-selected": {
                    bgcolor:
                      t.palette.mode === "light"
                        ? "rgba(47,60,140,.08)"
                        : "rgba(180,195,255,.12)",
                  },
                })}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Icon sx={{ fontSize: 20, color: "text.secondary" }} />
                </ListItemIcon>
                <ListItemText
                  primary={it.label}
                  primaryTypographyProps={{ fontSize: 14.5, fontWeight: 600 }}
                />
                {hasChild ? (
                  openMap[it.label] ? (
                    <ExpandLess />
                  ) : (
                    <ExpandMore />
                  )
                ) : null}
              </ListItemButton>

              {hasChild && (
                <Collapse in={!!openMap[it.label]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding sx={{ ml: 4, mr: 1 }}>
                    {it.children.map((c) => {
                      const active = pathname === c.to;
                      return (
                        <ListItemButton
                          key={c.label}
                          onClick={() => navigate(c.to)}
                          selected={active}
                          sx={{ borderRadius: 1.5, mb: 0.25 }}
                        >
                          <ListItemText
                            primary={c.label}
                            primaryTypographyProps={{ fontSize: 13.5 }}
                          />
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              )}
            </Fragment>
          );
        })}
      </List>
    </Box>
  );

  return (
    <>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onToggle}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ sx: { width: NAV_WIDTH, borderRight: 0 } }}
        sx={{ display: { xs: "block", md: "none" } }}
      >
        {content}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        PaperProps={{
          sx: {
            width: NAV_WIDTH,
            borderRight: 0,
            boxShadow: "inset -1px 0 0 rgba(0,0,0,.06)",
          },
        }}
        sx={{
          display: { xs: "none", md: "block" },
          width: NAV_WIDTH,
          flexShrink: 0,
        }}
      >
        <Toolbar />
        {content}
      </Drawer>
    </>
  );
}
