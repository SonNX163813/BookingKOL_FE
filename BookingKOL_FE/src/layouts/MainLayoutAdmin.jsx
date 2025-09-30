import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import AdminHeader from "../components/admin/layout/AdminHeader";
import { Menu } from "antd";
import { StackedBarChartOutlined } from "@mui/icons-material";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
const MainLayoutAdmin = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [pathname]);

  const location = useLocation();
  const pathKeyMap = [
    { pattern: /^\/admin(\/)?$/, key: "admin" },
    { pattern: /^\/management-log-AI(\/)?$/, key: "management-log-AI" },
  ];

  const getSelectedKey = (pathname) => {
    for (const { pattern, key } of pathKeyMap) {
      if (pattern.test(pathname)) return key;
    }
    return "admin";
  };

  const selectedKey = getSelectedKey(location.pathname);
  const [collapsed, setCollapsed] = useState(false);

  const toggleMenu = () => {
    setCollapsed(!collapsed);
  };

  const menuItems = [
    {
      key: "admin",
      icon: <StackedBarChartOutlined />,
      label: <Link to={"/admin"}>DashBoard</Link>,
    },
    {
      key: "management-log-AI",
      icon: <StackedBarChartOutlined />,
      label: <Link to={"/management-log-AI"}>Quản lý Log Chat AI</Link>,
    },
  ];

  return (
    <>
      <AdminHeader />
      <div className="flex h-[calc(100vh-80px)]">
        <aside
          className={`bg-white transition-all duration-300 ${
            collapsed ? "w-[80px]!" : "w-[300px]!"
          } flex-shrink-0 
                                flex flex-col h-full border-r border-gray-300`}
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
              className="text-[16px] font-bold border-none"
              style={{ borderInlineEnd: "none" }}
            />
          </div>
        </aside>

        <main className="flex-1 p-2 md:p-5 overflow-y-auto min-h-[400px] ">
          <div className="bg-white h-full rounded-[8px] w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </>
  );
};

export default MainLayoutAdmin;
