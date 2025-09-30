import { Navigate } from "react-router-dom";
import Layout from "../layouts/Layout";
import HomePage from "../pages/home/HomePage";
import UserProfile from "../pages/home/userProfileDetail/UserProfile";
import LoginPage from "../pages/authentication/LoginPage.jsx";
import RegisterPage from "../pages/authentication/RegisterPage.jsx";
import ForgotPasswordPage from "../pages/authentication/ForgotPasswordPage.jsx";
import VerifyEmailNotice from "../pages/authentication/VerifyEmailNotice.jsx";
import GuestOnly, { RequireAuth } from "./RouterGuards";

export const routerCustomer = [
  {
    element: <GuestOnly />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/forgotpassword", element: <ForgotPasswordPage /> },
      { path: "/verify-email", element: <VerifyEmailNotice /> },
    ],
  },
  {
    element: <Layout />,
    children: [{ path: "/", element: <HomePage /> }],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <Layout />,
        children: [{ path: "/userprofile", element: <UserProfile /> }],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" /> },
];

export default routerCustomer;
