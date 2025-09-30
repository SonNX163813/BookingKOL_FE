// src/routers/AppRouter.jsx
import { useRoutes } from "react-router-dom";
import RouterCustomer from "./RouterCustomer";

export default function AppRouter() {
  return useRoutes(RouterCustomer);
}
