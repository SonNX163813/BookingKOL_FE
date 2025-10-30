// src/routers/RouterKol.jsx
import { Navigate } from "react-router-dom";
import MainLayoutKOL from "../layouts/MainLayoutKOL";
import KolDashboard from "../pages/kol/KolDashboard";

import KolPortfolio from "../pages/kol/KolPortfolio";
import KolProfile from "../pages/kol/KolProfile";
import KolSchedule from "../pages/kol/KolSchedule";
import KolSettings from "../pages/kol/KolSettings";
import KolWorkRegistration from "../pages/kol/KolWorkRegistration";

// 👇 import ĐÚNG file + alias trùng với JSX bạn dùng
import KolSingleRequest from "../pages/kol/KolSingleRequest";
import KolSingleRequestDetail from "../pages/kol/KolSingleRequestDetail";

export const routerKOL = [
  {
    path: "/kol",
    element: <MainLayoutKOL />,
    children: [
      { index: true, element: <KolDashboard /> },

      // List booking single
      { path: "single-requests", element: <Navigate to="all" replace /> },
      { path: "single-requests/all", element: <KolSingleRequest /> },

      // Các trang khác
      { path: "portfolio/:kolId?/:kolName?", element: <KolPortfolio /> },
      { path: "profile/:kolId?/:kolName?", element: <KolProfile /> },
      { path: "schedule/:kolId?/:kolName?", element: <KolSchedule /> },
      {
        path: "schedule/register/:kolId?/:kolName?",
        element: <KolWorkRegistration />,
      },
      { path: "settings", element: <KolSettings /> },

      // Detail
      {
        path: "booking/single-requests/detail/:requestId",
        element: <KolSingleRequestDetail />,
      },
    ],
  },

  // Fallbacks
  { path: "/", element: <Navigate to="/kol" replace /> },
  { path: "/kol/*", element: <Navigate to="/kol" replace /> },
  { path: "*", element: <Navigate to="/kol" replace /> },
];
