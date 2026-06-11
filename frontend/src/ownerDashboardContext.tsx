import { createContext, useContext, type ReactNode } from "react";
import type { OwnerContext } from "./pages/owner/types";

const OwnerDashboardContext = createContext<OwnerContext | null>(null);

export function OwnerDashboardProvider(props: { value: OwnerContext; children: ReactNode }) {
  return (
    <OwnerDashboardContext.Provider value={props.value}>{props.children}</OwnerDashboardContext.Provider>
  );
}

export function useOwnerDashboardContext() {
  const ctx = useContext(OwnerDashboardContext);
  if (!ctx) {
    throw new Error("useOwnerDashboardContext must be used within OwnerDashboardProvider");
  }
  return ctx;
}
