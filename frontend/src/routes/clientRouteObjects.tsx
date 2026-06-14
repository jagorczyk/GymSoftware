import { RouteObject, Navigate } from "react-router-dom";
import { ClientDashboard } from "../pages/ClientDashboard";
import { ClientGymJoinPage } from "../pages/ClientGymJoinPage";
import { ClientGymPassesPage } from "../pages/ClientGymPassesPage";
import { ClientBuyPassPage } from "../pages/ClientBuyPassPage";
import { ClientClassesPage } from "../pages/ClientClassesPage";
import { ClientCheckoutSimulation } from "../pages/ClientCheckoutSimulation";
import { ClientTrainersPage } from "../pages/ClientTrainersPage";

export const clientRouteObjects: RouteObject[] = [
  { index: true, element: <Navigate to="dashboard" replace /> },
  { path: "dashboard", Component: ClientDashboard },
  { path: "gyms/join", Component: ClientGymJoinPage },
  { path: "gyms/:gymId/passes", Component: ClientGymPassesPage },
  { path: "gyms/:gymId/buy", Component: ClientBuyPassPage },
  { path: "gyms/:gymId/checkout-simulation", Component: ClientCheckoutSimulation },
  { path: "classes", Component: ClientClassesPage },
  { path: "trainers", Component: ClientTrainersPage },
];
