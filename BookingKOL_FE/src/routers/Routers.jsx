// src/routers/Routers.jsx
import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";

// Pages
import HomePage from "../pages/home/HomePage";
import LoginPage from "../pages/authentication/LoginPage";
import RegisterPage from "../pages/authentication/RegisterPage";
import ForgotPasswordPage from "../pages/authentication/ForgotPasswordPage";
import UserProfile from "../pages/home/userProfileDetail/UserProfile";
import VerifyEmailNotice from "../pages/authentication/VerifyEmailNotice";

// Guards
import RequireAuth from "./RequireAuth";
import GuestOnly from "./GuestOnly"; // nếu không dùng, bỏ wrapper GuestOnly ở dưới

const Routers = () => {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />

        {/* Auth (chỉ cho khách) */}
        <Route
          path="/login"
          element={
            <GuestOnly>
              <LoginPage />
            </GuestOnly>
          }
        />
        <Route
          path="/register"
          element={
            <GuestOnly>
              <RegisterPage />
            </GuestOnly>
          }
        />
        <Route
          path="/forgotpassword"
          element={
            <GuestOnly>
              <ForgotPasswordPage />
            </GuestOnly>
          }
        />

        {/* NEW: Thông báo xác nhận email sau khi đăng ký */}
        <Route
          path="/verify-email"
          element={
            <GuestOnly>
              <VerifyEmailNotice />
            </GuestOnly>
          }
        />

        {/* Private */}
        <Route
          path="/userprofile"
          element={
            <RequireAuth>
              <UserProfile />
            </RequireAuth>
          }
        />

        {/* 404 */}
        <Route path="*" element={<div>Không tìm thấy trang</div>} />
      </Routes>
    </Suspense>
  );
};

export default Routers;
