// src/router/routerAdmin.jsx
import { Navigate } from "react-router-dom";
import LoginPage from "../pages/authentication/LoginPage";
import MainLayoutSuperAdmin from "../layouts/MainLayoutSuperAdmin";
import SuperAdminDashBoard from "../pages/admin/dashboard/SuperAdminDashBoard";

export const routerSuperAdmin = [
  { path: "/login", element: <LoginPage /> },

  {
    path: "/superadmin",
    element: <MainLayoutSuperAdmin />,
    children: [{ index: true, element: <SuperAdminDashBoard /> }],
  },

  { path: "*", element: <Navigate to="/superadmin" /> },
];
