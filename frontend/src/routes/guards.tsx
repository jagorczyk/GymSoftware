import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../authContext";
import type { Role } from "../auth";

export function LoginRoute() {
  const { auth } = useAuth();
  if (auth) {
    if (auth.role === "SUPER_ADMIN") return <Navigate to="/superadmin/dashboard" replace />;
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
    if (auth.role === "SUPER_ADMIN") return <Navigate to="/superadmin/dashboard" replace />;
    return (
      <Navigate
        to={auth.role === "OWNER" ? "/owner/dashboard" : auth.role === "EMPLOYEE" ? "/employee/dashboard" : "/client/dashboard"}
        replace
      />
    );
  }
  return <Outlet />;
}

import { useTenant } from "../tenantContext";
import { TenantLandingPage } from "../pages/TenantLandingPage";
import { RegisterGymPage } from "../pages/RegisterGymPage";

export function RootRedirect() {
  const { auth } = useAuth();
  const { subdomain, loading } = useTenant();

  if (loading) return <div>Loading...</div>;

  // If there's a subdomain, render Tenant Landing Page if not logged in
  if (subdomain && !auth) {
    return <TenantLandingPage />;
  }

  // If NO subdomain and NOT logged in, show SaaS landing page
  if (!subdomain && !auth) {
    return <RegisterGymPage />;
  }

  if (auth?.role === "SUPER_ADMIN") return <Navigate to="/superadmin/dashboard" replace />;
  return (
    <Navigate
      to={auth?.role === "OWNER" ? "/owner/dashboard" : auth?.role === "EMPLOYEE" ? "/employee/dashboard" : "/client/dashboard"}
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

export function RequireSuperAdminRole() {
  return <RequireRole role="SUPER_ADMIN" />;
}
