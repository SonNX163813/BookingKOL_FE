// src/routers/AppRouter.jsx
import { useRoutes } from "react-router-dom";
import routerCustomer from "./RouterCustomer"; // RouterCustomer: default export
import { routerAdmin } from "./RouterAdmin"; // RouterAdmin: named export
import { routerKOL } from "./RouterKol";
import { useAuth } from "../context/AuthContext";

export default function AppRouter() {
  const auth = useAuth?.() || {};
  const { roles = [] } = auth;

  // Tuỳ logic phân quyền của bạn
  const isAdmin = roles.includes("SUPER_ADMIN") || roles.includes("ADMIN");

  const isKOL = roles.includes("KOL");

  // Ưu tiên Admin > KOL > Customer
  const routes = isAdmin ? routerAdmin : isKOL ? routerKOL : routerCustomer;
  return useRoutes(routes);
}
