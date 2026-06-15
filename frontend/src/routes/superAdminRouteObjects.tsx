import { RouteObject, Navigate } from "react-router-dom";
import { RequireSuperAdminRole } from "./guards";
import { SuperAdminDashboardPage } from "../pages/SuperAdminDashboardPage";

export const superAdminRouteObjects: RouteObject[] = [
  {
    Component: RequireSuperAdminRole,
    children: [
      { path: "dashboard", Component: SuperAdminDashboardPage },
      { path: "*", element: <Navigate to="dashboard" replace /> }
    ],
  },
];
