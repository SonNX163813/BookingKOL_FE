// src/layouts/MainLayoutKOL.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, matchPath, useLocation } from "react-router-dom";
import { Menu } from "antd";
import {
  StackedBarChartOutlined,
  EventOutlined,
  ShoppingBagOutlined,
  ChatBubbleOutlineOutlined,
  AccountCircleOutlined,
  PaidOutlined,
  SettingsOutlined,
  PersonOutline,
  CollectionsOutlined, // 👈 icon cho Portfolio
} from "@mui/icons-material";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import AdminHeader from "../components/admin/layout/AdminHeader";

export default function MainLayoutKOL() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  const routeKeyMap = useMemo(
    () => [
      { key: "kol", path: "/kol" },

      {
        key: "kol-schedule",
        path: "/kol/schedule",
        parentKey: "group-schedule",
      },

      { key: "kol-orders", path: "/kol/orders", parentKey: "group-orders" },
      {
        key: "kol-order-detail",
        path: "/kol/orders/:id",
        parentKey: "group-orders",
      },

      {
        key: "kol-messages",
        path: "/kol/messages",
        parentKey: "group-messages",
      },

      {
        key: "kol-portfolio",
        path: "/kol/portfolio",
        parentKey: "group-portfolio",
      }, // 👈

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
      ],
    },
    {
      key: "group-orders",
      icon: <ShoppingBagOutlined />,
      label: "Đơn booking",
      children: [
        {
          key: "kol-orders",
          icon: <ShoppingBagOutlined />,
          label: <Link to="orders">Tất cả đơn</Link>,
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

  return (
    <>
      <AdminHeader />
      <div className="flex h-[calc(100vh-80px)]">
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

        <main className="flex-1 p-2 md:p-5 overflow-y-auto min-h-[400px]">
          <div className="bg-white h-full rounded-[8px] w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
}
