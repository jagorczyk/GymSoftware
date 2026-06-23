import { RouteObject, Navigate } from "react-router-dom";
import { ClientDashboard } from "../pages/ClientDashboard";
import { ClientGymJoinPage } from "../pages/ClientGymJoinPage";
import { ClientGymPassesPage } from "../pages/ClientGymPassesPage";
import { ClientBuyPassPage } from "../pages/ClientBuyPassPage";
import { ClientActivitiesPage } from "../pages/ClientActivitiesPage";
import { ClientMessagesPage } from "../pages/ClientMessagesPage";
import { ClientCheckoutSimulation } from "../pages/ClientCheckoutSimulation";
import { ProfileSettingsPage } from "../pages/ProfileSettingsPage";

export const clientRouteObjects: RouteObject[] = [
  { index: true, element: <Navigate to="dashboard" replace /> },
  { path: "dashboard", Component: ClientDashboard },
  { path: "gyms/join", Component: ClientGymJoinPage },
  { path: "gyms/:gymId/passes", Component: ClientGymPassesPage },
  { path: "gyms/:gymId/buy", Component: ClientBuyPassPage },
  { path: "gyms/:gymId/checkout-simulation", Component: ClientCheckoutSimulation },
  { path: "activities", Component: ClientActivitiesPage },
  { path: "messages", Component: ClientMessagesPage },
  { path: "profile", Component: ProfileSettingsPage },
];
