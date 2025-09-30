// src/routes/GuestOnly.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function GuestOnly({ children }) {
  const { token } = useContext(AuthContext);
  const location = useLocation();
  if (token) {
    const to = location.state?.from?.pathname || "/";
    return <Navigate to={to} replace />;
  }
  return children;
}
