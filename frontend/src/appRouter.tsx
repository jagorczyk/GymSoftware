import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { AppShell } from "./AppShell";
import { LoginRoute, RequireAuth, RootRedirect } from "./routes/guards";
import { OwnerDashboardWrapper, EmployeeDashboardWrapper, ClientDashboardWrapper } from "./routes/wrappers";
import { ownerRouteObjects } from "./routes/ownerRouteObjects";
import { employeeRouteObjects } from "./routes/employeeRouteObjects";
import { clientRouteObjects } from "./routes/clientRouteObjects";
import { RegisterClientPage } from "./pages/RegisterClientPage";

export const appRouter = createBrowserRouter([
  {
    path: "/login",
    Component: LoginRoute,
    children: [{ index: true, Component: LoginPage }],
  },
  {
    path: "/register",
    Component: LoginRoute,
    children: [{ index: true, Component: RegisterClientPage }],
  },
  {
    Component: RequireAuth,
    children: [
      {
        Component: AppShell,
        children: [
          { path: "/owner", Component: OwnerDashboardWrapper, children: ownerRouteObjects },
          { path: "/employee", Component: EmployeeDashboardWrapper, children: employeeRouteObjects },
          { path: "/client", Component: ClientDashboardWrapper, children: clientRouteObjects },
        ],
      },
    ],
  },
  { path: "/", Component: RootRedirect },
  { path: "*", element: <Navigate to="/" replace /> },
]);
