import type { AuthState } from "../../auth";
import type { EmployeePermission } from "../../permissions";

export type EmployeeContext = {
  auth: AuthState;
  gyms: Array<{ employeeId: number; gymId: number; gymName: string; gymAddress: string; permissions: string[] }>;
  selectedGymId: number | "";
  setSelectedGymId: (id: number | "") => void;
  overview: any;
  permissions: EmployeePermission[];
  refreshOverview: () => void;
  setMessage: (v: string) => void;
  setError: (v: string) => void;
};
