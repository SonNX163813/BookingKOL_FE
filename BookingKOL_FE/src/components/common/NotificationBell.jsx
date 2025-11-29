import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Chip,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Menu,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";

import {
  deleteAllNotifications,
  fetchNotifications,
  markAllNotificationsAsRead,
} from "../../services/notification/notificationService";
import { toast } from "react-toastify";

const formatTimestamp = (value) => {
  if (!value) return "";

  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return String(value);

  const now = Date.now();
  const diffMs = now - time;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 30) return `${diffDays} ngày trước`;
  if (diffMonths < 12) return `${diffMonths} tháng trước`;
  return `${diffYears} năm trước`;
};
const MAX_FAILURES = 3;
const MAX_BACKOFF = 5 * 60 * 1000;

const NotificationBell = ({
  loggedIn,
  pollInterval = 3000,
  iconButtonSx,
  badgeProps,
  anchorOrigin = { vertical: "bottom", horizontal: "right" },
  transformOrigin = { vertical: "top", horizontal: "right" },
  menuPaperSx,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const failureCountRef = useRef(0);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item?.read).length,
    [notifications]
  );

  const hasUnread = unreadCount > 0;

  const bellSx = hasUnread
    ? {
        "@keyframes bellRing": {
          "0%": { transform: "rotate(0)" },
          "15%": { transform: "rotate(20deg)" },
          "30%": { transform: "rotate(-18deg)" },
          "45%": { transform: "rotate(14deg)" },
          "60%": { transform: "rotate(-10deg)" },
          "75%": { transform: "rotate(6deg)" },
          "100%": { transform: "rotate(0)" },
        },
        animation: "bellRing 1.35s ease-in-out infinite",
        transformOrigin: "50% 5%",
      }
    : {};

  useEffect(() => {
    let mounted = true;
    let timeoutId = null;

    const scheduleNext = (delay) => {
      if (!mounted) return;
      timeoutId = window.setTimeout(() => {
        load({ initial: false });
      }, delay);
    };

    const load = async ({ initial = false } = {}) => {
      if (!mounted) return;

      if (!loggedIn) {
        setNotifications([]);
        failureCountRef.current = 0;
        return;
      }

      // ❌ BỎ đoạn này đi, để không dừng hẳn
      // if (failureCountRef.current >= MAX_FAILURES) return;

      if (initial) setLoading(true);

      try {
        const data = await fetchNotifications();
        if (!mounted) return;

        // ✅ thành công → reset đếm lỗi
        failureCountRef.current = 0;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];

        setNotifications(list);

        // thành công → gọi lại với pollInterval bình thường
        scheduleNext(pollInterval);
      } catch (error) {
        console.error("Lỗi khi tải thông báo", error);

        // tăng số lần lỗi
        failureCountRef.current += 1;

        // ✅ CHỈ show toast trong 3 lần đầu
        if (failureCountRef.current <= MAX_FAILURES) {
          toast.error("Không thể tải thông báo, vui lòng thử lại sau.");
        }

        // vẫn tiếp tục backoff & poll tiếp
        const backoffDelay = Math.min(
          pollInterval * 2 ** failureCountRef.current,
          MAX_BACKOFF
        );
        scheduleNext(backoffDelay);
      } finally {
        if (initial && mounted) setLoading(false);
      }
    };

    const handleVisibilityChange = () => {
      if (!mounted) return;
      if (!document.hidden && loggedIn) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        load({ initial: false });
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    load({ initial: true });

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (typeof document !== "undefined") {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      }
    };
  }, [loggedIn, pollInterval]);

  const handleMarkAllAsRead = async () => {
    if (!notifications.length || updating) return;

    try {
      setUpdating(true);
      await markAllNotificationsAsRead();

      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch (error) {
      console.error("Lỗi khi đánh dấu đã đọc", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!notifications.length) return;

    try {
      setUpdating(true);
      await deleteAllNotifications();
      setNotifications([]);
    } catch (error) {
      console.error("Lỗi khi xóa thông báo", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleBellClick = async (event) => {
    setAnchorEl(event.currentTarget);
    if (!notifications.length || !hasUnread || updating) return;
    await handleMarkAllAsRead();
  };

  return (
    <>
      <Tooltip title="Thông báo">
        <IconButton
          color="inherit"
          onClick={handleBellClick}
          sx={{
            borderRadius: 2,
            position: "relative",
            "&:hover": { bgcolor: "rgba(15,23,42,0.06)" },
            ...iconButtonSx,
          }}
        >
          <Badge
            color="error"
            badgeContent={unreadCount}
            max={badgeProps?.max || 99}
            overlap="circular"
            {...badgeProps}
            sx={{
              "& .MuiBadge-badge": {
                minWidth: 22,
                height: 20,
                fontWeight: 700,
                boxShadow: hasUnread
                  ? "0 0 0 6px rgba(239,68,68,0.12)"
                  : "0 0 0 0 rgba(0,0,0,0)",
                background: hasUnread
                  ? "linear-gradient(135deg,#ef4444,#f97316)"
                  : undefined,
              },
              ...badgeProps?.sx,
            }}
          >
            <NotificationsNoneIcon sx={{ fontSize: 26, ...bellSx }} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        keepMounted
        anchorOrigin={anchorOrigin}
        transformOrigin={transformOrigin}
        // ✅ Thay thế hoàn toàn PaperProps + MenuListProps
        slotProps={{
          paper: {
            sx: {
              width: 360,
              maxWidth: "calc(100vw - 20px)",
              borderRadius: 2,
              border: "1px solid rgba(2,6,23,0.08)",
              boxShadow: "0 18px 50px rgba(15,23,42,0.16)",
              overflow: "hidden",
              ...menuPaperSx,
            },
          },
          list: {
            disablePadding: true,
            sx: {
              p: 0,
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            p: 2,
            // background: "linear-gradient(135deg,#0ea5e9,#6366f1)",
            // color: "#fff",
          }}
        >
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 800, letterSpacing: 0.2 }}
            >
              Thông báo
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {unreadCount} chưa đọc
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Tooltip title="Đánh dấu tất cả đã đọc">
              <span>
                <IconButton
                  size="small"
                  onClick={handleMarkAllAsRead}
                  disabled={!notifications.length || updating}
                  sx={{
                    border: "1px solid rgba(37,99,235,0.6)",
                    background: "rgba(37,99,235,0.08)",
                    "&:hover": {
                      background: "rgba(37,99,235,0.18)",
                    },
                    "&.Mui-disabled": {
                      border: "1px solid rgba(37,99,235,0.25)",
                      background: "rgba(37,99,235,0.03)",
                    },
                  }}
                >
                  <MarkEmailReadIcon
                    fontSize="small"
                    sx={{ color: "#2563eb" }}
                  />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title="Xóa tất cả thông báo">
              <span>
                <IconButton
                  size="small"
                  onClick={handleDeleteAll}
                  disabled={!notifications.length || updating}
                  sx={{
                    border: "1px solid rgba(220,38,38,0.6)",
                    background: "rgba(220,38,38,0.08)",
                    "&:hover": {
                      background: "rgba(220,38,38,0.18)",
                    },
                    "&.Mui-disabled": {
                      border: "1px solid rgba(220,38,38,0.25)",
                      background: "rgba(220,38,38,0.03)",
                    },
                  }}
                >
                  <DeleteForeverIcon
                    fontSize="small"
                    sx={{ color: "#dc2626" }}
                  />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>

        <Divider />

        {/* Danh sách thông báo */}
        <Box
          sx={{
            maxHeight: 420,
            overflowY: "auto",
            background: "linear-gradient(180deg,#f8fafc 0%,#ffffff 100%)",
          }}
        >
          {loading ? (
            <Box sx={{ px: 2, py: 3 }}>
              {[0, 1, 2].map((item) => (
                <Stack
                  key={item}
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{ mb: 1.5 }}
                >
                  <Skeleton variant="circular" width={12} height={12} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="90%" />
                    <Skeleton variant="text" width="50%" />
                  </Box>
                </Stack>
              ))}
            </Box>
          ) : notifications.length === 0 ? (
            <Box
              sx={{
                px: 2,
                py: 3,
                textAlign: "center",
                color: "text.secondary",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "rgba(99,102,241,0.08)",
                  display: "grid",
                  placeItems: "center",
                  color: "#6366f1",
                }}
              >
                <NotificationsNoneIcon fontSize="large" />
              </Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, color: "text.primary" }}
              >
                Không có thông báo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Mọi việc đều đã được cập nhật.
              </Typography>
            </Box>
          ) : (
            <List disablePadding>
              {notifications.map((item, index) => (
                <ListItemButton
                  key={item?.id || item?.notificationId || index}
                  alignItems="flex-start"
                  sx={{
                    py: 1.35,
                    gap: 1.25,
                    mx: 1,
                    my: 0.75,
                    borderRadius: 2,
                    backgroundColor: item?.read
                      ? "#fff"
                      : "rgba(239,68,68,0.06)",
                    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
                    border: item?.read
                      ? "1px solid rgba(15,23,42,0.05)"
                      : "1px solid rgba(239,68,68,0.12)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 16px 40px rgba(15,23,42,0.12)",
                    },
                  }}
                >
                  <Box sx={{ minWidth: 12, mt: 0.5 }}>
                    {!item?.read && (
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: "#ef4444",
                          boxShadow: "0 0 0 4px rgba(239,68,68,0.15)",
                        }}
                      />
                    )}
                  </Box>

                  <ListItemText
                    primary={item?.message || "Bạn có thông báo mới"}
                    primaryTypographyProps={{
                      fontWeight: item?.read ? 600 : 800,
                      fontSize: "0.97rem",
                      color: item?.read ? "text.primary" : "#0f172a",
                    }}
                    secondary={
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ mt: 0.6 }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            fontWeight: 600,
                            letterSpacing: 0.1,
                          }}
                        >
                          {formatTimestamp(item?.timestamp || item?.time)}
                        </Typography>
                        {!item?.read && (
                          <Chip
                            size="small"
                            label="Mới"
                            color="error"
                            variant="outlined"
                            sx={{
                              height: 22,
                              fontWeight: 700,
                              borderColor: "rgba(239,68,68,0.35)",
                              background: "rgba(239,68,68,0.08)",
                            }}
                          />
                        )}
                      </Stack>
                    }
                    secondaryTypographyProps={{
                      sx: {
                        mt: 0,
                        color: "text.secondary",
                        fontSize: "0.82rem",
                      },
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </Box>
      </Menu>
    </>
  );
};

export default NotificationBell;
