import { Navigate } from "react-router-dom";
import LoginPage from "../pages/authentication/LoginPage";
import MainLayoutAdmin from "../layouts/MainLayoutAdmin";
import DashBoard from "../pages/admin/dashboard/DashBoard";
import ManagementLogAI from "../pages/admin/ai/ManagementLogAI";

export const routerAdmin = [
  { path: "/login", element: <LoginPage /> },

  {
    element: <MainLayoutAdmin />,
    children: [
      { path: "/admin", element: <DashBoard /> },
      { path: "/management-log-AI", element: <ManagementLogAI /> },
    ],
  },

  { path: "*", element: <Navigate to="/admin" /> },
];
