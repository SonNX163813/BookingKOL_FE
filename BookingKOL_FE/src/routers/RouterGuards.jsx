import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Chỉ cho KHÁCH (chưa đăng nhập): dùng cho nhóm /login, /register, ... */
export default function GuestOnly({ fallback = null }) {
  const auth = useAuth?.() || {};
  const { token, loading = false } = auth;
  const location = useLocation();
  const backTo = location.state?.from?.pathname || "/";

  if (loading) return fallback; // có thể trả <div>Loading...</div>
  if (token) return <Navigate to={backTo} replace />;

  return <Outlet />; // 👈 QUAN TRỌNG: render children routes
}

/** Yêu cầu ĐÃ ĐĂNG NHẬP: bảo vệ các trang private */
export function RequireAuth({ fallback = null }) {
  const auth = useAuth?.() || {};
  const { token, loading = false } = auth;
  const location = useLocation();

  if (loading) return fallback;
  if (!token)
    return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />; // 👈 QUAN TRỌNG
}
