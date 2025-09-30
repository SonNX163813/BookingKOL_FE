import { useRoutes } from "react-router-dom";
import { routerCustomer } from "./RouterCustomer";
import { routerAdmin } from "./RouterAdmin";

const AppRouter = () => {
  const role = "1";

  const router = role === "SUPER_ADMIN" ? routerAdmin : routerCustomer;
  return useRoutes(router);
};

export default AppRouter;
