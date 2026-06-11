import { createContext, useContext, useState, type ReactNode } from "react";
import {
  DEFAULT_EMPLOYEE_PERMISSIONS,
  type EmployeePermission,
} from "./permissions";

type EmployeePermissionsContextValue = {
  permissions: EmployeePermission[];
  setPermissions: (permissions: EmployeePermission[]) => void;
};

const EmployeePermissionsContext = createContext<EmployeePermissionsContextValue>({
  permissions: DEFAULT_EMPLOYEE_PERMISSIONS,
  setPermissions: () => {},
});

export function EmployeePermissionsProvider(props: { children: ReactNode }) {
  const { children } = props;
  const [permissions, setPermissions] = useState<EmployeePermission[]>(DEFAULT_EMPLOYEE_PERMISSIONS);

  return (
    <EmployeePermissionsContext.Provider value={{ permissions, setPermissions }}>
      {children}
    </EmployeePermissionsContext.Provider>
  );
}

export function useEmployeePermissions() {
  return useContext(EmployeePermissionsContext);
}
