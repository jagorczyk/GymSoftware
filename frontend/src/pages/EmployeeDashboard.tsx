import { useCallback, useEffect, useState, type ReactNode } from "react";
import { getEmployeeGyms, getEmployeeLiveOverview } from "../api";
import type { AuthState } from "../auth";
import { useEmployeePermissions } from "../employeePermissionsContext";
import { useSelectedGymBrand } from "../selectedGymBrandContext";
import { useAppGymSelector } from "../appGymSelectorContext";
import { EmployeeDashboardProvider } from "../employeeDashboardContext";
import { PageHeader } from "../components/PageHeader";
import { LoadingState } from "../components/LoadingState";
import { useToast } from "../components/Toast";
import {
  DEFAULT_EMPLOYEE_PERMISSIONS,
  hasEmployeePermission,
  type EmployeePermission,
} from "../permissions";
import type { EmployeeContext } from "./employee/types";

export function EmployeeDashboard(props: { auth: AuthState; children: ReactNode }) {
  const { auth, children } = props;
  const { showSuccess, showError } = useToast();
  const { setPermissions } = useEmployeePermissions();
  const { setBrandName } = useSelectedGymBrand();
  const { setSelectorState } = useAppGymSelector();
  const [loadingGyms, setLoadingGyms] = useState(true);
  const [gyms, setGyms] = useState<
    Array<{ employeeId: number; gymId: number; gymName: string; gymAddress: string; permissions: string[] }>
  >([]);
  const [selectedGymId, setSelectedGymId] = useState<number | "">("");
  const [overview, setOverview] = useState<any>(null);
  const [activePermissions, setActivePermissions] =
    useState<EmployeePermission[]>(DEFAULT_EMPLOYEE_PERMISSIONS);

  const refreshOverview = useCallback(
    async (gymId: number) => {
      if (
        !hasEmployeePermission(activePermissions, "VIEW_DASHBOARD") &&
        !hasEmployeePermission(activePermissions, "MANAGE_LOCKERS") &&
        !hasEmployeePermission(activePermissions, "SELL_PASSES")
      ) {
        setOverview(null);
        return;
      }
      try {
        const data = await getEmployeeLiveOverview(auth, gymId);
        setOverview(data);
      } catch (err) {
        console.error("Failed to refresh overview", err);
      }
    },
    [auth, activePermissions]
  );

  const onGymChange = useCallback((nextId: number) => {
    setSelectedGymId(nextId);
  }, []);

  useEffect(() => {
    setLoadingGyms(true);
    (async () => {
      try {
        const response = await getEmployeeGyms(auth);
        setGyms(response);
        if (response.length > 0) {
          setSelectedGymId(response[0].gymId);
          const perms = response[0].permissions as EmployeePermission[];
          setActivePermissions(perms);
          setPermissions(perms);
        }
      } catch (err) {
        showError(err instanceof Error ? err.message : "Nie udało się pobrać siłowni");
      } finally {
        setLoadingGyms(false);
      }
    })();
  }, [auth, setPermissions, showError]);

  useEffect(() => {
    if (!selectedGymId) return;
    const gym = gyms.find((g) => g.gymId === Number(selectedGymId));
    if (gym) {
      const perms = gym.permissions as EmployeePermission[];
      setActivePermissions(perms);
      setPermissions(perms);
    }
    refreshOverview(Number(selectedGymId));
    const interval = setInterval(() => refreshOverview(Number(selectedGymId)), 10000);
    return () => clearInterval(interval);
  }, [auth, selectedGymId, gyms, refreshOverview, setPermissions]);

  useEffect(() => {
    const gym = gyms.find((g) => g.gymId === Number(selectedGymId));
    setBrandName(gym?.gymName ?? "");
  }, [gyms, selectedGymId, setBrandName]);

  useEffect(() => {
    setSelectorState({
      gyms: gyms.map((g) => ({ id: g.gymId, name: g.gymName, address: g.gymAddress })),
      selectedGymId,
      onSelectGym: onGymChange,
    });
  }, [gyms, selectedGymId, onGymChange, setSelectorState]);

  useEffect(() => {
    return () => {
      setSelectorState({ gyms: [], selectedGymId: "", onSelectGym: () => {} });
    };
  }, [setSelectorState]);

  const setMessage = useCallback(
    (message: string) => {
      if (message) showSuccess(message);
    },
    [showSuccess]
  );

  const setError = useCallback(
    (message: string) => {
      if (message) showError(message);
    },
    [showError]
  );

  const refreshOverviewForContext = useCallback(() => {
    if (selectedGymId) refreshOverview(Number(selectedGymId));
  }, [selectedGymId, refreshOverview]);

  const ctx: EmployeeContext = {
    auth,
    gyms,
    selectedGymId,
    setSelectedGymId,
    overview,
    permissions: activePermissions,
    refreshOverview: refreshOverviewForContext,
    setMessage,
    setError,
  };

  if (loadingGyms) {
    return <LoadingState message="Ładowanie panelu pracownika..." />;
  }

  return (
    <EmployeeDashboardProvider value={ctx}>
      <div className="space-y-6">
        <PageHeader
          title="Panel pracownika"
          subtitle="Obsługa klientów, sprzedaż karnetów i zarządzanie kluczykami."
        />
        {children}
      </div>
    </EmployeeDashboardProvider>
  );
}
