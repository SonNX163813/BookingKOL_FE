// src/routes/RequireAuth.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function RequireAuth({ children }) {
  const { token } = useContext(AuthContext);
  const location = useLocation();
  if (!token)
    return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
