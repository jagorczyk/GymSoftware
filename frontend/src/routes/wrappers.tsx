import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../authContext";
import { OwnerDashboard } from "../pages/OwnerDashboard";
import { EmployeeDashboard } from "../pages/EmployeeDashboard";

export function OwnerDashboardWrapper() {
  const { auth } = useAuth();
  const location = useLocation();

  if (!auth) return <Navigate to="/login" replace />;
  if (auth.role !== "OWNER") {
    return <Navigate to="/employee/dashboard" replace />;
  }
  if (location.pathname === "/owner" || location.pathname === "/owner/") {
    return <Navigate to="/owner/dashboard" replace />;
  }

  return (
    <OwnerDashboard auth={auth}>
      <Outlet />
    </OwnerDashboard>
  );
}

export function EmployeeDashboardWrapper() {
  const { auth } = useAuth();
  const location = useLocation();

  if (!auth) return <Navigate to="/login" replace />;
  if (auth.role !== "EMPLOYEE") {
    return <Navigate to="/owner/dashboard" replace />;
  }
  if (location.pathname === "/employee" || location.pathname === "/employee/") {
    return <Navigate to="/employee/dashboard" replace />;
  }

  return (
    <EmployeeDashboard auth={auth}>
      <Outlet />
    </EmployeeDashboard>
  );
}

export function ClientDashboardWrapper() {
  const { auth } = useAuth();
  const location = useLocation();

  if (!auth) return <Navigate to="/login" replace />;
  if (auth.role !== "GUEST") {
    return <Navigate to={auth.role === "OWNER" ? "/owner/dashboard" : "/employee/dashboard"} replace />;
  }
  if (location.pathname === "/client" || location.pathname === "/client/") {
    return <Navigate to="/client/dashboard" replace />;
  }

  return (
    <Outlet />
  );
}
