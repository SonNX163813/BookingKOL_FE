import { Navigate } from "react-router-dom";
import LoginPage from "../pages/authentication/LoginPage";
import MainLayoutAdmin from "../layouts/MainLayoutAdmin";
import DashBoard from "../pages/admin/dashboard/DashBoard";
import ManagementLogAI from "../pages/admin/ai/ManagementLogAI";
import ManagementCustomer from "../pages/admin/management-user/management-customer/ManagementCustomer";
import UserDetailPage from "../pages/admin/management-user/management-customer/UserDetailPage";
import ManagementKOL from "../pages/admin/management-user/management-kol/ManagementKOL";
import ManagementCourse from "../pages/admin/course/ManagementCourse";
import ViewDetailCourse from "../pages/admin/course/ViewDetailCourse";
import ManagementCategory from "../pages/admin/category/ManagementCategory";
import CreateCoursePage from "../pages/admin/course/CreateCoursePage";
export const routerAdmin = [
  { path: "/login", element: <LoginPage /> },

  {
    path: "/admin",
    element: <MainLayoutAdmin />,
    children: [
      { index: true, element: <DashBoard /> },
      { path: "management-log-chat-ai", element: <ManagementLogAI /> },
      { path: "management-customer", element: <ManagementCustomer /> },
      { path: "management-customer/:id", element: <UserDetailPage /> },
      { path: "management-kol", element: <ManagementKOL /> },
      { path: "management-course", element: <ManagementCourse /> },
      { path: "view-detail-course/:id", element: <ViewDetailCourse /> },
      { path: "management-category", element: <ManagementCategory /> },
      { path: "create-course", element: <CreateCoursePage /> },
    ],
  },

  { path: "*", element: <Navigate to="/admin" /> },
];
