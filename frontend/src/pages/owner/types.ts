import type { AuthState } from "../../auth";
import type { OwnerDashboardStats, OwnerGymDetails } from "../../api";

export type OwnerContext = {
  auth: AuthState;
  gyms: Array<{ id: number; name: string; address: string; city?: string; postalCode?: string; nip?: string; themeColor?: string; subdomain?: string }>;
  selectedGymId: number | "";
  details: OwnerGymDetails | null;
  dashboardStats: OwnerDashboardStats | null;
  loadGymsAndDetails: () => Promise<void>;
  onGymChange: (nextId: number) => Promise<void>;
  setError: (v: string | null) => void;
  setInfo: (v: string | null) => void;
};
