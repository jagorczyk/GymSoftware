import { RouteObject } from "react-router-dom";
import { ClientDashboard } from "../pages/ClientDashboard";
import { ClientGymJoinPage } from "../pages/ClientGymJoinPage";
import { ClientGymPassesPage } from "../pages/ClientGymPassesPage";
import { ClientBuyPassPage } from "../pages/ClientBuyPassPage";
import { ClientClassesPage } from "../pages/ClientClassesPage";

export const clientRouteObjects: RouteObject[] = [
  { path: "dashboard", Component: ClientDashboard },
  { path: "gyms/join", Component: ClientGymJoinPage },
  { path: "gyms/:gymId/passes", Component: ClientGymPassesPage },
  { path: "gyms/:gymId/buy", Component: ClientBuyPassPage },
  { path: "classes", Component: ClientClassesPage },
];
