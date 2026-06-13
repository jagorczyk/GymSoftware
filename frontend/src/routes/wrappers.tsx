import { useCallback, useEffect, useState } from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../authContext";
import { useAppGymSelector } from "../appGymSelectorContext";
import { useSelectedGymBrand } from "../selectedGymBrandContext";
import { getClientGyms, ClientGymView } from "../clientApi";
import { LoadingState } from "../components/LoadingState";
import { useToast } from "../components/Toast";
import { OwnerDashboard } from "../pages/OwnerDashboard";
import { EmployeeDashboard } from "../pages/EmployeeDashboard";

export function OwnerDashboardWrapper() {
  const { auth } = useAuth();
  const location = useLocation();

  if (!auth) return <Navigate to="/login" replace />;
  if (auth.role !== "OWNER") {
    return <Navigate to="/employee/dashboard" replace />;
  }
  if (location.pathname === "/owner" || location.pathname === "/owner/") {
    return <Navigate to="/owner/dashboard" replace />;
  }

  return (
    <OwnerDashboard auth={auth}>
      <Outlet />
    </OwnerDashboard>
  );
}

export function EmployeeDashboardWrapper() {
  const { auth } = useAuth();
  const location = useLocation();

  if (!auth) return <Navigate to="/login" replace />;
  if (auth.role !== "EMPLOYEE") {
    return <Navigate to="/owner/dashboard" replace />;
  }
  if (location.pathname === "/employee" || location.pathname === "/employee/") {
    return <Navigate to="/employee/dashboard" replace />;
  }

  return (
    <EmployeeDashboard auth={auth}>
      <Outlet />
    </EmployeeDashboard>
  );
}

export function ClientDashboardWrapper() {
  const { auth } = useAuth();
  const location = useLocation();
  const { setSelectorState } = useAppGymSelector();
  const { setBrandName } = useSelectedGymBrand();
  const { showError } = useToast();

  const [gyms, setGyms] = useState<ClientGymView[]>([]);
  const [selectedGymId, setSelectedGymId] = useState<number | "">("");
  const [loading, setLoading] = useState(true);

  const loadGyms = useCallback(async () => {
    if (!auth) return;
    try {
      const data = await getClientGyms(auth);
      setGyms(data);
      
      let activeId: number | "" = "";
      const stored = localStorage.getItem(`client_selected_gym_id_${auth.email}`);
      if (stored) {
        const num = Number(stored);
        if (data.some((g) => g.id === num)) {
          activeId = num;
        }
      }
      if (activeId === "" && data.length > 0) {
        activeId = data[0].id;
      }
      setSelectedGymId(activeId);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Nie udało się pobrać siłowni");
    } finally {
      setLoading(false);
    }
  }, [auth, showError]);

  useEffect(() => {
    loadGyms();
  }, [loadGyms]);

  useEffect(() => {
    if (location.pathname === "/client/dashboard" || location.pathname === "/client/classes") {
      loadGyms();
    }
  }, [location.pathname, loadGyms]);

  const onGymChange = useCallback((nextId: number) => {
    setSelectedGymId(nextId);
    if (auth) {
      localStorage.setItem(`client_selected_gym_id_${auth.email}`, String(nextId));
    }
  }, [auth]);

  useEffect(() => {
    const activeGym = gyms.find((g) => g.id === selectedGymId);
    setBrandName(activeGym ? activeGym.name : "");
  }, [gyms, selectedGymId, setBrandName]);

  useEffect(() => {
    setSelectorState({
      gyms: gyms.map((g) => ({ id: g.id, name: g.name, address: g.address })),
      selectedGymId,
      onSelectGym: onGymChange,
    });
  }, [gyms, selectedGymId, onGymChange, setSelectorState]);

  useEffect(() => {
    return () => {
      setSelectorState({ gyms: [], selectedGymId: "", onSelectGym: () => {} });
    };
  }, [setSelectorState]);

  if (!auth) return <Navigate to="/login" replace />;
  if (auth.role !== "GUEST") {
    return <Navigate to={auth.role === "OWNER" ? "/owner/dashboard" : "/employee/dashboard"} replace />;
  }
  if (location.pathname === "/client" || location.pathname === "/client/") {
    return <Navigate to="/client/dashboard" replace />;
  }

  if (loading) {
    return <LoadingState message="Ładowanie panelu klienta..." />;
  }

  return <Outlet />;
}

