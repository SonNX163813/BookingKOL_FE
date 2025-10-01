import { Navigate } from "react-router-dom";

import Layout from "../layouts/Layout";

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

const courseRoutes = [
  { path: "/goi-dich-vu", element: <CourseLivesteam /> },
  { path: "/goi-dich-vu/:courseId/:courseName", element: <CourseLivesteamDetail /> },
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
    element: <Layout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/kols/:kolId/:kolName", element: <KOLDetail /> },
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
        element: <Layout />,
        children: [{ path: "/userprofile", element: <UserProfile /> }],
      },
    ],
  },

  // 404 → về trang chủ
  { path: "*", element: <Navigate to="/" /> },
];

export default routerCustomer;
