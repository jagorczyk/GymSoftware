import { createContext, useContext, type ReactNode } from "react";
import type { EmployeeContext } from "./pages/employee/types";

const EmployeeDashboardContext = createContext<EmployeeContext | null>(null);

export function EmployeeDashboardProvider(props: { value: EmployeeContext; children: ReactNode }) {
  return (
    <EmployeeDashboardContext.Provider value={props.value}>{props.children}</EmployeeDashboardContext.Provider>
  );
}

export function useEmployeeDashboardContext() {
  const ctx = useContext(EmployeeDashboardContext);
  if (!ctx) {
    throw new Error("useEmployeeDashboardContext must be used within EmployeeDashboardProvider");
  }
  return ctx;
}
