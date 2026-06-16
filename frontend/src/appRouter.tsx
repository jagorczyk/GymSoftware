import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { AppShell } from "./AppShell";
import { LoginRoute, RequireAuth, RootRedirect } from "./routes/guards";
import { OwnerDashboardWrapper, EmployeeDashboardWrapper, ClientDashboardWrapper, SuperAdminDashboardWrapper } from "./routes/wrappers";
import { ownerRouteObjects } from "./routes/ownerRouteObjects";
import { employeeRouteObjects } from "./routes/employeeRouteObjects";
import { clientRouteObjects } from "./routes/clientRouteObjects";
import { superAdminRouteObjects } from "./routes/superAdminRouteObjects";
import { RegisterClientPage } from "./pages/RegisterClientPage";
import { RegisterGymPage } from "./pages/RegisterGymPage";
import { SubscriptionSuccessPage } from "./pages/owner/SubscriptionSuccessPage";

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
    path: "/register-gym",
    Component: LoginRoute,
    children: [{ index: true, Component: RegisterGymPage }],
  },
  {
    Component: RequireAuth,
    children: [
      { path: "/admin/subscription-success", Component: SubscriptionSuccessPage },
      {
        Component: AppShell,
        children: [
          { path: "/superadmin", Component: SuperAdminDashboardWrapper, children: superAdminRouteObjects },
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
