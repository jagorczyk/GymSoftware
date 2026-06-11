import type { AuthState } from "../../auth";

export type OwnerContext = {
  auth: AuthState;
  gyms: Array<{ id: number; name: string; address: string }>;
  selectedGymId: number | "";
  details: any | null;
  loadGymsAndDetails: () => Promise<void>;
  onGymChange: (nextId: number) => Promise<void>;
  setError: (v: string | null) => void;
  setInfo: (v: string | null) => void;
};
