import { Navigate } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

// Pages (public)
import HomePage from "../pages/home/HomePage";
import KOLDetail from "../pages/home/kol/KOLDetail";
import RankingPage from "../pages/rank/RankingPage";
import ChatAIPage from "../pages/ai/ChatAIPage";
import CourseLivesteam from "../pages/home/course-live/CourseLivesteam";
import CourseLivesteamDetail from "../pages/home/course-live/CourseLivesteamDetail";

// Pages (private)
import UserProfile from "../pages/home/userProfileDetail/UserProfile";

// Auth pages
import LoginPage from "../pages/authentication/LoginPage.jsx";
import RegisterPage from "../pages/authentication/RegisterPage.jsx";
import ForgotPasswordPage from "../pages/authentication/ForgotPasswordPage.jsx";
import VerifyEmailNotice from "../pages/authentication/VerifyEmailNotice.jsx";

// Guards
import GuestOnly, { RequireAuth } from "./RouterGuards";

//NotFound
import NotFound from "../pages/NotFound.jsx";
import ListKOL from "../pages/home/kol/ListKOL.jsx";

const courseRoutes = [
  { path: "/danh-sach-khoa-hoc", element: <CourseLivesteam /> },
  {
    path: "/danh-sach-khoa-hoc/:courseId/:courseName",
    element: <CourseLivesteamDetail />,
  },
];

export const routerCustomer = [
  // NHÓM AUTH: chỉ cho khách, không render Layout để tránh lóe
  {
    element: <GuestOnly />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/forgotpassword", element: <ForgotPasswordPage /> },
      { path: "/verify-email", element: <VerifyEmailNotice /> },
    ],
  },

  // PUBLIC (có layout)
  {
    element: <MainLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/danh-sach-kol", element: <ListKOL /> },
      { path: "/danh-sach-kol/:kolId/:kolName", element: <KOLDetail /> },
      { path: "/ranking", element: <RankingPage /> },
      { path: "/chat-AI", element: <ChatAIPage /> },
      ...courseRoutes,
    ],
  },

  // PRIVATE (RequireAuth bọc ngoài Layout để Layout/ Navbar không render trước)
  {
    element: <RequireAuth />,
    children: [
      {
        element: <MainLayout />,
        children: [{ path: "/userprofile", element: <UserProfile /> }],
      },
    ],
  },

  // 404 → về trang chủ
  { path: "*", element: <NotFound /> },
];

export default routerCustomer;
