import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useSelectedGymBrand } from "../selectedGymBrandContext";
import { useAppGymSelector } from "../appGymSelectorContext";
import { OwnerDashboardProvider } from "../ownerDashboardContext";
import { RefreshCcw } from "lucide-react";
import { getOwnerGymDetails, getOwnerGyms, getOwnerGymSubscription, getOwnerDashboardStats } from "../api";
import type { OwnerDashboardStats, OwnerGymDetails } from "../api";
import type { AuthState } from "../auth";
import { PageHeader } from "../components/PageHeader";
import { LoadingState } from "../components/LoadingState";
import { useToast } from "../components/Toast";
import { usePlanFeatures } from "../planFeaturesContext";
import type { OwnerContext } from "./owner/types";

export function OwnerDashboard(props: { auth: AuthState; children: ReactNode }) {
  const { auth, children } = props;
  const { setBrandName } = useSelectedGymBrand();
  const { setSelectorState } = useAppGymSelector();
  const { setFeatureFlags } = usePlanFeatures();
  const { showSuccess, showError } = useToast();
  const [gyms, setGyms] = useState<Array<{ id: number; name: string; address: string; city?: string; themeColor?: string }>>([]);
  const [selectedGymId, setSelectedGymId] = useState<number | "">("");
  const [details, setDetails] = useState<OwnerGymDetails | null>(null);
  const [dashboardStats, setDashboardStats] = useState<OwnerDashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadGymsAndDetails() {
    setLoading(true);
    try {
      const gymsResponse = await getOwnerGyms(auth);
      setGyms(gymsResponse);

      const gymIdToLoad = (selectedGymId || gymsResponse[0]?.id) as number | undefined;
      if (!gymIdToLoad) {
        setDetails(null);
        setDashboardStats(null);
        setSelectedGymId("");
      } else {
        setSelectedGymId(gymIdToLoad);
        const [gymDetails, stats] = await Promise.all([
          getOwnerGymDetails(auth, gymIdToLoad),
          getOwnerDashboardStats(auth, gymIdToLoad),
        ]);
        setDetails(gymDetails);
        setDashboardStats(stats);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd pobierania danych");
    } finally {
      setLoading(false);
    }
  }

  const onGymChange = useCallback(
    async (nextId: number) => {
      setSelectedGymId(nextId);
      try {
        const [gymDetails, subscription, stats] = await Promise.all([
          getOwnerGymDetails(auth, nextId),
          getOwnerGymSubscription(auth, nextId),
          getOwnerDashboardStats(auth, nextId),
        ]);
        setDetails(gymDetails);
        setDashboardStats(stats);
        setFeatureFlags(subscription?.featureFlags ?? []);
      } catch (err) {
        showError(err instanceof Error ? err.message : "Nie udało się pobrać szczegółów siłowni");
      }
    },
    [auth, showError, setFeatureFlags]
  );

  useEffect(() => {
    loadGymsAndDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  useEffect(() => {
    if (!selectedGymId) {
      setFeatureFlags([]);
      return;
    }
    getOwnerGymSubscription(auth, Number(selectedGymId))
      .then((subscription) => setFeatureFlags(subscription?.featureFlags ?? []))
      .catch(() => setFeatureFlags([]));
  }, [auth, selectedGymId, setFeatureFlags]);

  useEffect(() => {
    return () => {
      setFeatureFlags([]);
    };
  }, [setFeatureFlags]);

  useEffect(() => {
    const fromList = gyms.find((g) => g.id === Number(selectedGymId))?.name;
    const fromDetails = details?.gym?.name as string | undefined;
    setBrandName(fromList ?? fromDetails ?? "");
  }, [gyms, selectedGymId, details, setBrandName]);

  useEffect(() => {
    setSelectorState({
      gyms: gyms.map((g) => ({ id: g.id, name: g.name, address: g.address, city: g.city, themeColor: g.themeColor })),
      selectedGymId,
      onSelectGym: onGymChange,
    });
  }, [gyms, selectedGymId, onGymChange, setSelectorState]);

  useEffect(() => {
    return () => {
      setSelectorState({ gyms: [], selectedGymId: "", onSelectGym: () => {} });
    };
  }, [setSelectorState]);

  const setError = (message: string | null) => {
    if (message) showError(message);
  };

  const setInfo = (message: string | null) => {
    if (message) showSuccess(message);
  };

  const ctx: OwnerContext = {
    auth,
    gyms,
    selectedGymId,
    details,
    dashboardStats,
    loadGymsAndDetails,
    onGymChange,
    setError,
    setInfo,
  };

  if (loading && !details && gyms.length === 0) {
    return <LoadingState message="Ładowanie panelu właściciela..." />;
  }

  return (
    <OwnerDashboardProvider value={ctx}>
      <div className="space-y-6">
        <PageHeader
          title="Panel właściciela"
          subtitle="Zarządzaj siłowniami, personelem i danymi operacyjnymi."
          action={
            <button
              onClick={loadGymsAndDetails}
              disabled={loading}
              className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Odśwież
            </button>
          }
        />
        {children}
      </div>
    </OwnerDashboardProvider>
  );
}
