// src/routers/RouterKol.jsx
import { Navigate } from "react-router-dom";
import MainLayoutKOL from "../layouts/MainLayoutKOL";
import KolDashboard from "../pages/kol/KolDashboard";
import KolOrders from "../pages/kol/KolOrders";
import KolPortfolio from "../pages/kol/KolPortfolio";
import KolProfile from "../pages/kol/KolProfile";
import KolSchedule from "../pages/kol/KolSchedule";
import KolSettings from "../pages/kol/KolSettings";

export const routerKOL = [
  {
    path: "/kol",
    element: <MainLayoutKOL />,
    children: [
      { index: true, element: <KolDashboard /> },
      { path: "orders", element: <KolOrders /> },
      { path: "portfolio/:kolId?/:kolName?", element: <KolPortfolio /> },
      { path: "profile/:kolId?/:kolName?", element: <KolProfile /> },
      { path: "schedule/:kolId?/:kolName?", element: <KolSchedule /> },
      { path: "settings", element: <KolSettings /> },
    ],
  },

  // 👇 Fallbacks để đảm bảo login xong (đang ở "/") sẽ nhảy về /kol
  { path: "/", element: <Navigate to="/kol" replace /> },
  { path: "/kol/*", element: <Navigate to="/kol" replace /> },
  { path: "*", element: <Navigate to="/kol" replace /> },
];
