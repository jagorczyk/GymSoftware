import { Navigate, useLocation } from "react-router-dom";
import { canAccessEmployeeRoute, type EmployeePermission } from "../../permissions";

export function EmployeeRouteGuard(props: {
  permissions: EmployeePermission[];
  children: React.ReactElement;
}) {
  const { permissions, children } = props;
  const location = useLocation();

  if (!canAccessEmployeeRoute(location.pathname, permissions)) {
    return <Navigate to="/employee/dashboard" replace />;
  }

  return children;
}
