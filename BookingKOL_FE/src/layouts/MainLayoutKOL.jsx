import { useEffect, useMemo, useState } from "react";
import {
  Link,
  Outlet,
  matchPath,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Menu } from "antd";
import {
  StackedBarChartOutlined,
  EventOutlined,
  ShoppingBagOutlined,
  AccountCircleOutlined,
  PaidOutlined,
  SettingsOutlined,
  PersonOutline,
  CollectionsOutlined,
  EditCalendarOutlined,
} from "@mui/icons-material";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";

import TopBar from "../components/kol/TopBar";
import { useAuth } from "../context/AuthContext";

export default function MainLayoutKOL() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const auth = useAuth?.() || {};
  const appUser = auth?.user || {};

  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  const routeKeyMap = useMemo(
    () => [
      { key: "kol", path: "/kol" },

      // Orders (single requests)
      {
        key: "kol-single-requests",
        path: "/kol/single-requests",
        parentKey: "group-orders",
      },
      {
        key: "kol-single-requests-all",
        path: "/kol/single-requests/all",
        parentKey: "group-orders",
      },
      {
        key: "kol-single-request-detail",
        path: "/kol/booking/single-requests/detail/:requestId",
        parentKey: "group-orders",
      },

      // Schedule
      {
        key: "kol-schedule",
        path: "/kol/schedule",
        parentKey: "group-schedule",
      },
      {
        key: "kol-schedule-register",
        path: "/kol/schedule/register",
        parentKey: "group-schedule",
      },

      // Portfolio / Profile / Settings / Earnings
      {
        key: "kol-portfolio",
        path: "/kol/portfolio",
        parentKey: "group-portfolio",
      },
      { key: "kol-profile", path: "/kol/profile", parentKey: "group-profile" },
      {
        key: "kol-settings",
        path: "/kol/settings",
        parentKey: "group-profile",
      },
      {
        key: "kol-earnings",
        path: "/kol/earnings",
        parentKey: "group-earnings",
      },
    ],
    []
  );

  const active = [...routeKeyMap]
    .sort((a, b) => b.path.length - a.path.length)
    .find((it) => matchPath({ path: it.path, end: false }, pathname)) || {
    key: "kol",
  };

  const selectedKeys = [active.key];
  const defaultOpenKeys = active.parentKey ? [active.parentKey] : [];

  const menuItems = [
    {
      key: "kol",
      icon: <StackedBarChartOutlined />,
      label: <Link to="/kol">Tổng quan</Link>,
    },
    {
      key: "group-schedule",
      icon: <EventOutlined />,
      label: "Lịch làm việc",
      children: [
        {
          key: "kol-schedule",
          icon: <EventOutlined />,
          label: <Link to="schedule">Lịch của tôi</Link>,
        },
        {
          key: "kol-schedule-register",
          icon: <EditCalendarOutlined />,
          label: <Link to="schedule/register">Đăng ký lịch làm</Link>,
        },
      ],
    },
    {
      key: "group-orders",
      icon: <ShoppingBagOutlined />,
      label: "Đơn booking",
      children: [
        // ✅ Link đúng
        {
          key: "kol-single-requests-all",
          icon: <ShoppingBagOutlined />,
          label: <Link to="single-requests/all">Tất cả đơn</Link>,
        },
      ],
    },
    {
      key: "group-portfolio",
      icon: <CollectionsOutlined />,
      label: "Portfolio",
      children: [
        {
          key: "kol-portfolio",
          icon: <CollectionsOutlined />,
          label: <Link to="portfolio">Thư viện nội dung</Link>,
        },
      ],
    },
    {
      key: "group-profile",
      icon: <PersonOutline />,
      label: "Hồ sơ",
      children: [
        {
          key: "kol-profile",
          icon: <AccountCircleOutlined />,
          label: <Link to="profile">Thông tin cá nhân</Link>,
        },
        {
          key: "kol-settings",
          icon: <SettingsOutlined />,
          label: <Link to="settings">Cài đặt hiển thị</Link>,
        },
      ],
    },
    {
      key: "group-earnings",
      icon: <PaidOutlined />,
      label: "Doanh thu",
      children: [
        {
          key: "kol-earnings",
          icon: <PaidOutlined />,
          label: <Link to="earnings">Báo cáo thu nhập</Link>,
        },
      ],
    },
  ];

  const handleProfile = () => navigate("/kol/profile");
  const handleSettings = () => navigate("/kol/settings");
  const handleLogout = () => {
    auth?.dispatch?.({ type: "LOGOUT" });
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const topbarUser = {
    name: appUser?.fullName || appUser?.name || "KOL",
    email: appUser?.email || "",
    avatarUrl: appUser?.avatarUrl || appUser?.avatar || "",
  };

  return (
    <>
      <TopBar
        user={topbarUser}
        onProfile={handleProfile}
        onSettings={handleSettings}
        onLogout={handleLogout}
      />

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <aside
          className={`bg-white transition-all duration-300 ${
            collapsed ? "w-[80px]" : "w-[300px]"
          } flex-shrink-0 flex flex-col h-full border-r border-gray-300`}
        >
          <div className="flex-1 overflow-auto">
            <div className="flex justify-end pr-7 py-2">
              <button
                onClick={() => setCollapsed((v) => !v)}
                className="text-xl cursor-pointer"
              >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </button>
            </div>

            <Menu
              mode="inline"
              items={menuItems}
              selectedKeys={selectedKeys}
              defaultOpenKeys={defaultOpenKeys}
              inlineCollapsed={collapsed}
              className="text-[16px] font-semibold border-none"
              style={{ borderInlineEnd: "none" }}
            />
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 p-2 md:p-5 overflow-y-auto min-h-[400px]">
          <div className="bg-white h-full rounded-[8px] w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
