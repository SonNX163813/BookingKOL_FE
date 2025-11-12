import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import AdminHeader from "../components/admin/layout/AdminHeader";
import { Menu } from "antd";
import {
  StackedBarChartOutlined,
  BarChartOutlined,
  SettingsOutlined,
  FolderOutlined,
  PersonOutlined,
  VerifiedUserOutlined,
  LocalOfferOutlined,
  CategoryOutlined,
  AppsOutlined,
  AccountCircleOutlined,
  SchoolOutlined,
  PlayCircleOutline,
  CalendarMonthOutlined,
  EventNoteOutlined,
  MonetizationOnOutlined,
  ArticleOutlined,
} from "@mui/icons-material";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";

const MainLayoutAdmin = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [pathname]);

  const location = useLocation();

  // Ánh xạ path → key
  const pathKeyMap = [
    { pattern: /^\/admin(\/)?$/, key: "admin" },
    {
      pattern: /^\/admin\/management-log-chat-ai(\/)?$/,
      key: "management-log-chat-ai",
    },
    {
      pattern: /^\/admin\/management-kol(\/)?$/,
      key: "management-kol",
    },
    {
      pattern: /^\/admin\/management-customer(\/|$)/,
      key: "management-customer",
    },
    {
      pattern: /^\/admin\/management-category(\/)?$/,
      key: "management-category",
    },
    {
      pattern: /^\/admin\/management-course(\/)?$/,
      key: "management-course",
    },
    {
      pattern: /^\/admin\/create-course(\/)?$/,
      key: "management-course",
    },
    {
      pattern: /^\/admin\/view-detail-course(\/)?$/,
      key: "management-course",
    },
    {
      pattern: /^\/admin\/management-booking-requests(\/)?$/,
      key: "management-booking-requests",
    },
    {
      pattern: /^\/admin\/management-blogs(\/)?$/,
      key: "management-blogs",
    },
    // NEW: highlight cho trang Campaign (kể cả các route con sau này)
    {
      pattern: /^\/admin\/management-booking-campaigns(\/|$)/,
      key: "management-booking-campaigns",
    },
    {
      pattern: /^\/admin\/management-refunds(\/)?$/,
      key: "management-refunds",
    },
  ];

  const getSelectedKey = (pathname) => {
    for (const { pattern, key } of pathKeyMap) {
      if (pattern.test(pathname)) return key;
    }
    return "admin";
  };

  const selectedKey = getSelectedKey(location.pathname);
  const [collapsed, setCollapsed] = useState(false);

  const toggleMenu = () => setCollapsed(!collapsed);

  const menuItems = [
    {
      key: "admin",
      icon: <StackedBarChartOutlined />,
      label: <Link to="/admin">Dashboard</Link>,
    },
    {
      key: "management-user",
      icon: <PersonOutlined />,
      label: "Quản lý người dùng",
      children: [
        {
          key: "management-kol",
          icon: <VerifiedUserOutlined />,
          label: <Link to="management-kol">Quản lý KOL</Link>,
        },
        {
          key: "management-customer",
          icon: <AccountCircleOutlined />,
          label: <Link to="management-customer">Quản lý Khách hàng</Link>,
        },
      ],
    },
    {
      key: "management-cate",
      icon: <LocalOfferOutlined />,
      label: "Quản lý danh mục",
      children: [
        {
          key: "management-category",
          icon: <CategoryOutlined />,
          label: <Link to="management-category">Quản lý lĩnh vực</Link>,
        },
        // {
        //   key: "management-abc",
        //   icon: <AppsOutlined />,
        //   // label: <Link to="/management-category">Quản lý nền tảng</Link>,
        //   label: "Quản lý nền tảng",
        // },
      ],
    },
    {
      key: "management-cou",
      icon: <SchoolOutlined />,
      label: "Quản lý khóa học",
      children: [
        {
          key: "management-course",
          icon: <PlayCircleOutline />,
          label: <Link to="management-course">Khóa học</Link>,
        },
        {
          key: "management-course-history",
          icon: <BarChartOutlined />,
          label: (
            <Link to="management-course-history">
              Quản lý lịch sử mua khóa học
            </Link>
          ),
        },
      ],
    },
    {
      key: "management-blogs",
      icon: <ArticleOutlined />,
      label: <Link to="management-blogs">Quản lý blog</Link>,
    },
    {
      key: "management-booking",
      icon: <EventNoteOutlined />,
      label: "Quản lý booking",
      children: [
        {
          key: "management-refunds",
          icon: <MonetizationOnOutlined />,
          label: <Link to="management-refunds">Quản lý hoàn tiền</Link>,
        },
        {
          key: "management-booking-requests",
          icon: <CalendarMonthOutlined />,
          label: (
            <Link to="management-booking-requests">Quản lý booking lẻ</Link>
          ),
        },
        // NEW: nút vào trang Campaign
        {
          key: "management-booking-campaigns",
          icon: <BarChartOutlined />,
          label: (
            <Link to="management-booking-campaigns">
              Quản lý booking Campaign
            </Link>
          ),
        },
      ],
    },
    // {
    //   key: "management-refund",
    //   icon: <MonetizationOnOutlined />,
    //   label: "Quản lý tiền",
    //   children: [],
    // },
    // {
    //   key: "management-history",
    //   icon: <FolderOutlined />,
    //   label: "Quản lý lịch sử",
    //   children: [],
    // },
    {
      key: "management",
      icon: <FolderOutlined />,
      label: "Quản lý hệ thống",
      children: [
        {
          key: "management-log-chat-ai",
          icon: <BarChartOutlined />,
          label: <Link to="management-log-chat-ai">Quản lý Log Chat AI</Link>,
        },
      ],
    },

    // {
    //   key: "settings",
    //   icon: <SettingsOutlined />,
    //   label: "Cài đặt",
    //   children: [],
    // },
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
              <button onClick={toggleMenu} className="text-xl cursor-pointer">
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </button>
            </div>
            <Menu
              mode="inline"
              items={menuItems}
              selectedKeys={[selectedKey]}
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
};

export default MainLayoutAdmin;
