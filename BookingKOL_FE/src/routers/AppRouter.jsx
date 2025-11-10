// src/routers/AppRouter.jsx
import { useRoutes } from "react-router-dom";
import routerCustomer from "./RouterCustomer"; // RouterCustomer: default export
import { routerAdmin } from "./RouterAdmin"; // RouterAdmin: named export
import { routerKOL } from "./RouterKol";
import { useAuth } from "../context/AuthContext";
import { routerSuperAdmin } from "./RouterSuperAdmin";

export default function AppRouter() {
  const auth = useAuth?.() || {};
  const { roles = [] } = auth;

  // Tuỳ logic phân quyền của bạn
  const isAdmin = roles.includes("ADMIN");

  const isKOL = roles.includes("KOL");

  const isSuperAdmin = roles.includes("SUPER_ADMIN");

  // Ưu tiên Admin > KOL > Customer
  const routes = isSuperAdmin
    ? routerSuperAdmin
    : isAdmin
    ? routerAdmin
    : isKOL
    ? routerKOL
    : routerCustomer;
  return useRoutes(routes);
}
