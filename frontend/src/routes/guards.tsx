import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../authContext";
import type { Role } from "../auth";

export function LoginRoute() {
  const { auth } = useAuth();
  if (auth) {
    return (
      <Navigate
        to={auth.role === "OWNER" ? "/owner/dashboard" : auth.role === "EMPLOYEE" ? "/employee/dashboard" : "/client/dashboard"}
        replace
      />
    );
  }
  return <Outlet />;
}

export function RequireAuth() {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RequireRole(props: { role: Role }) {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  if (auth.role !== props.role) {
    return (
      <Navigate
        to={auth.role === "OWNER" ? "/owner/dashboard" : auth.role === "EMPLOYEE" ? "/employee/dashboard" : "/client/dashboard"}
        replace
      />
    );
  }
  return <Outlet />;
}

export function RootRedirect() {
  const { auth } = useAuth();
  if (!auth) return <Navigate to="/login" replace />;
  return (
    <Navigate
      to={auth.role === "OWNER" ? "/owner/dashboard" : auth.role === "EMPLOYEE" ? "/employee/dashboard" : "/client/dashboard"}
      replace
    />
  );
}

export function RequireOwnerRole() {
  return <RequireRole role="OWNER" />;
}

export function RequireEmployeeRole() {
  return <RequireRole role="EMPLOYEE" />;
}
