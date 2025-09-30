import { Navigate } from "react-router-dom";
import HomePage from "../pages/home/HomePage";
import KOLDetail from "../pages/home/kol/KOLDetail";
import UserProfile from "../pages/home/userProfileDetail/UserProflie";
import RankingPage from "../pages/rank/RankingPage";
import ChatAIPage from "../pages/ai/ChatAIPage";
import ForgotPasswordPage from "../pages/authentication/ForgotPasswordPage";
import RegisterPage from "../pages/authentication/RegisterPage";
import LoginPage from "../pages/authentication/LoginPage";
import MainLayout from "../layouts/MainLayout";
import CourseLivesteam from "../pages/home/course-live/CourseLivesteam";

export const routerCustomer = [
  { path: "*", element: <Navigate to="/" /> },

  // Auth layout: không có header/footer

  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgotpassword", element: <ForgotPasswordPage /> },

  // Main layout: có header/footer
  {
    element: <MainLayout />,
    children: [
      // Home & Cart
      { path: "/", element: <HomePage /> },
      { path: "/kols/:kolId/:kolName", element: <KOLDetail /> },
      { path: "/userprofile", element: <UserProfile /> },
      { path: "/ranking", element: <RankingPage /> },
      { path: "/chat-AI", element: <ChatAIPage /> },
      { path: "/goi-dich-vu", element: <CourseLivesteam /> },
    ],
  },
];
