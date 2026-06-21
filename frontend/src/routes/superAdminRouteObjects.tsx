import { RouteObject, Navigate } from "react-router-dom";
import { RequireSuperAdminRole } from "./guards";
import { SuperAdminSubscriptionsPage } from "../pages/superadmin/SuperAdminSubscriptionsPage";
import { SuperAdminUsersPage } from "../pages/superadmin/SuperAdminUsersPage";
import { SuperAdminManagementPage } from "../pages/superadmin/SuperAdminManagementPage";

export const superAdminRouteObjects: RouteObject[] = [
  {
    Component: RequireSuperAdminRole,
    children: [
      { path: "subscriptions", Component: SuperAdminSubscriptionsPage },
      { path: "users", Component: SuperAdminUsersPage },
      { path: "management", Component: SuperAdminManagementPage },
      { path: "dashboard", element: <Navigate to="/superadmin/subscriptions" replace /> },
      { path: "*", element: <Navigate to="/superadmin/subscriptions" replace /> },
    ],
  },
];
