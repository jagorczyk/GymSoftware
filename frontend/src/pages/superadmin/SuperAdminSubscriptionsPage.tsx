import { Fragment, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../authContext";
import {
  getSaaSSubscriptions,
  cancelSaaSSubscription,
  changeSaaSSubscriptionPlan,
  extendSaaSSubscription,
  updateSaaSSubscriptionStatus,
  updateSaaSSubscriptionNotes,
  updateSaaSSubscriptionFeatureOverrides,
  downloadSaaSSubscriptionsCsv,
  getSaaSStats,
  getSaaSPlans,
  GymSubscriptionDTO,
  SaaSStatsView,
  SaaSPlan,
} from "../../api";
import { SAAS_PLAN_FEATURES } from "../../saasPlanFeatures";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { CalendarPlus, Download, FileText, Layers, RefreshCw, Search } from "lucide-react";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];
const STATUS_OPTIONS = ["TRIAL", "ACTIVE", "PAST_DUE", "CANCELED", "UNPAID"] as const;
const EXTEND_PRESETS = [7, 14, 30, 90];

function statusBadgeClass(status: string) {
  if (status === "ACTIVE") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  if (status === "TRIAL") return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
  if (status === "PAST_DUE") return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
  return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
}

function daysUntilEnd(end?: string | null) {
  if (!end) return null;
  const endDate = new Date(end);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  return Math.round((endDate.getTime() - today.getTime()) / 86400000);
}

function formatPeriodEnd(end?: string | null) {
  if (!end) return "—";
  const days = daysUntilEnd(end);
  const date = new Date(end).toLocaleDateString("pl-PL");
  if (days === null) return date;
  if (days < 0) return `${date} (wygasła ${Math.abs(days)} dni temu)`;
  if (days === 0) return `${date} (dziś)`;
  return `${date} (za ${days} dni)`;
}

export function SuperAdminSubscriptionsPage() {
  const { auth } = useAuth();
  const [subscriptions, setSubscriptions] = useState<GymSubscriptionDTO[]>([]);
  const [stats, setStats] = useState<SaaSStatsView | null>(null);
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [extendTarget, setExtendTarget] = useState<number | null>(null);
  const [extendDays, setExtendDays] = useState(30);
  const [extendReactivate, setExtendReactivate] = useState(true);
  const [extending, setExtending] = useState(false);
  const [notesTarget, setNotesTarget] = useState<number | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [featuresTarget, setFeaturesTarget] = useState<number | null>(null);
  const [overridesDraft, setOverridesDraft] = useState<Record<string, boolean>>({});
  const [savingFeatures, setSavingFeatures] = useState(false);

  async function loadData() {
    if (!auth) return;
    try {
      setLoading(true);
      setError(null);
      const [subsData, statsData, plansData] = await Promise.all([
        getSaaSSubscriptions(auth),
        getSaaSStats(auth),
        getSaaSPlans(auth),
      ]);
      setSubscriptions(subsData);
      setStats(statsData);
      setPlans(plansData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd podczas pobierania danych.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [auth]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return subscriptions.filter((sub) => {
      if (statusFilter !== "ALL" && sub.status !== statusFilter) return false;
      if (!q) return true;
      const haystack = [
        sub.gymName,
        sub.gymAddress,
        sub.ownerEmail,
        sub.ownerFirstName,
        sub.ownerLastName,
        sub.saasPlanName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [subscriptions, query, statusFilter]);

  const handleCancel = async (id: number) => {
    if (!auth) return;
    if (!confirm("Czy na pewno chcesz anulować tę subskrypcję?")) return;
    try {
      await cancelSaaSSubscription(auth, id);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Błąd podczas anulowania subskrypcji.");
    }
  };

  const handlePlanChange = async (
    subscriptionId: number,
    currentPlanId: number,
    newPlanId: number,
    selectEl: HTMLSelectElement
  ) => {
    if (!auth || newPlanId === currentPlanId) return;
    const plan = plans.find((p) => p.id === newPlanId);
    if (!plan) return;
    if (!confirm(`Zmienić pakiet na "${plan.name}" (${plan.price} zł)?`)) {
      selectEl.value = String(currentPlanId);
      return;
    }
    try {
      await changeSaaSSubscriptionPlan(auth, subscriptionId, newPlanId);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Błąd podczas zmiany pakietu.");
      selectEl.value = String(currentPlanId);
    }
  };

  const handleStatusChange = async (subscriptionId: number, currentStatus: string, newStatus: string, selectEl: HTMLSelectElement) => {
    if (!auth || newStatus === currentStatus) return;
    if (!confirm(`Zmienić status subskrypcji na ${newStatus}?`)) {
      selectEl.value = currentStatus;
      return;
    }
    try {
      await updateSaaSSubscriptionStatus(auth, subscriptionId, newStatus);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Błąd podczas zmiany statusu.");
      selectEl.value = currentStatus;
    }
  };

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  const handleExport = async () => {
    if (!auth) return;
    try {
      const blob = await downloadSaaSSubscriptionsCsv(auth);
      downloadBlob(blob, "subscriptions.csv");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Nie udało się wyeksportować subskrypcji.");
    }
  };

  const handleSaveNotes = async (subscriptionId: number) => {
    if (!auth) return;
    setSavingNotes(true);
    try {
      await updateSaaSSubscriptionNotes(auth, subscriptionId, notesDraft);
      setNotesTarget(null);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Nie udało się zapisać notatek.");
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSaveFeatures = async (subscriptionId: number) => {
    if (!auth) return;
    setSavingFeatures(true);
    try {
      await updateSaaSSubscriptionFeatureOverrides(auth, subscriptionId, overridesDraft);
      setFeaturesTarget(null);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Nie udało się zapisać nadpisań funkcji.");
    } finally {
      setSavingFeatures(false);
    }
  };

  const handleExtend = async (subscriptionId: number) => {
    if (!auth) return;
    if (extendDays < 1 || extendDays > 365) {
      alert("Liczba dni musi być od 1 do 365.");
      return;
    }
    setExtending(true);
    try {
      await extendSaaSSubscription(auth, subscriptionId, { days: extendDays, reactivate: extendReactivate });
      setExtendTarget(null);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Błąd podczas przedłużania subskrypcji.");
    } finally {
      setExtending(false);
    }
  };

  if (loading && subscriptions.length === 0) return <LoadingState message="Ładowanie subskrypcji..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subskrypcje</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Zarządzaj planami klientów SaaS — przedłużaj okresy, zmieniaj statusy i pakiety.
        </p>
      </div>

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Szacowany MRR</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.totalMrr} zł</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aktywne</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.activeGyms}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Wersje próbne</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.trialingGyms}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Anulowane</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.canceledGyms}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Popularność planów</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={stats.subscriptionsByPlan} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                    <XAxis dataKey="planName" tick={{ fill: "#6B7280" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#6B7280" }} axisLine={false} tickLine={false} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: "8px", color: "#fff" }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Statusy subskrypcji</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={stats.subscriptionsByStatus}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="statusName"
                      label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    >
                      {stats.subscriptionsByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: "8px", color: "#fff" }}
                      itemStyle={{ color: "#fff" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Wszystkie subskrypcje ({filtered.length}/{subscriptions.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => void handleExport()}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg"
              >
                <Download className="w-4 h-4" />
                Eksport CSV
              </button>
              <button
                onClick={() => void loadData()}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Odśwież
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Szukaj siłowni, właściciela, planu..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
            >
              <option value="ALL">Wszystkie statusy</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Brak subskrypcji spełniających kryteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <th className="p-4">Siłownia</th>
                  <th className="p-4">Właściciel</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Okres</th>
                  <th className="p-4 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map((sub) => (
                  <Fragment key={sub.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="p-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{sub.gymName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{sub.gymAddress}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {sub.ownerFirstName} {sub.ownerLastName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{sub.ownerEmail}</div>
                      </td>
                      <td className="p-4">
                        <select
                          value={sub.saasPlanId}
                          onChange={(e) => void handlePlanChange(sub.id, sub.saasPlanId, Number(e.target.value), e.currentTarget)}
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1"
                        >
                          {plans.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name} ({plan.price} zł)
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <select
                          value={sub.status}
                          onChange={(e) => void handleStatusChange(sub.id, sub.status, e.target.value, e.currentTarget)}
                          className={`text-xs font-medium rounded-lg px-2 py-1 border border-transparent ${statusBadgeClass(sub.status)}`}
                        >
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatPeriodEnd(sub.currentPeriodEnd)}
                      </td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setNotesTarget(notesTarget === sub.id ? null : sub.id);
                            setNotesDraft(sub.adminNotes ?? "");
                            setExtendTarget(null);
                            setFeaturesTarget(null);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700"
                          title={sub.adminNotes ? "Edytuj notatki wewnętrzne" : "Dodaj notatki wewnętrzne"}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Notatki
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFeaturesTarget(featuresTarget === sub.id ? null : sub.id);
                            setOverridesDraft({ ...(sub.featureFlagOverrides ?? {}) });
                            setExtendTarget(null);
                            setNotesTarget(null);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/30"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          Funkcje
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setExtendTarget(extendTarget === sub.id ? null : sub.id);
                            setExtendDays(30);
                            setExtendReactivate(sub.status !== "ACTIVE");
                            setNotesTarget(null);
                            setFeaturesTarget(null);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/30"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" />
                          Przedłuż
                        </button>
                        {sub.status !== "CANCELED" && (
                          <button
                            onClick={() => void handleCancel(sub.id)}
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30"
                          >
                            Anuluj
                          </button>
                        )}
                      </td>
                    </tr>
                    {notesTarget === sub.id && (
                      <tr key={`notes-${sub.id}`} className="bg-gray-50/80 dark:bg-gray-900/40">
                        <td colSpan={6} className="p-4 space-y-3">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Notatki wewnętrzne (tylko super admin)</p>
                          <textarea
                            value={notesDraft}
                            onChange={(e) => setNotesDraft(e.target.value)}
                            rows={3}
                            placeholder="np. przedłużenie gratis do konferencji"
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={savingNotes}
                              onClick={() => void handleSaveNotes(sub.id)}
                              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-900 dark:bg-gray-100 dark:hover:bg-white dark:text-gray-900 text-white text-sm font-bold disabled:opacity-50"
                            >
                              {savingNotes ? "Zapisywanie..." : "Zapisz notatki"}
                            </button>
                            <button type="button" onClick={() => setNotesTarget(null)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
                              Anuluj
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {featuresTarget === sub.id && (
                      <tr key={`features-${sub.id}`} className="bg-indigo-50/50 dark:bg-indigo-950/20">
                        <td colSpan={6} className="p-4 space-y-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">Nadpisania funkcji (bez zmiany planu)</p>
                            <p className="text-xs text-gray-500 mt-1">
                              „Z planu” — dziedziczy z pakietu. Efektywne: {(sub.effectiveFeatureFlags ?? []).join(", ") || "wszystkie z planu"}
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {SAAS_PLAN_FEATURES.map((feature) => {
                              const override = overridesDraft[feature.id];
                              const value = override === undefined ? "inherit" : override ? "on" : "off";
                              return (
                                <label key={feature.id} className="flex flex-col gap-1 text-sm">
                                  <span className="font-medium text-gray-900 dark:text-white">{feature.label}</span>
                                  <select
                                    value={value}
                                    onChange={(e) => {
                                      const next = { ...overridesDraft };
                                      if (e.target.value === "inherit") delete next[feature.id];
                                      else next[feature.id] = e.target.value === "on";
                                      setOverridesDraft(next);
                                    }}
                                    className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs"
                                  >
                                    <option value="inherit">Z planu</option>
                                    <option value="on">Wymuś włączone</option>
                                    <option value="off">Wymuś wyłączone</option>
                                  </select>
                                </label>
                              );
                            })}
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={savingFeatures}
                              onClick={() => void handleSaveFeatures(sub.id)}
                              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold disabled:opacity-50"
                            >
                              {savingFeatures ? "Zapisywanie..." : "Zapisz nadpisania"}
                            </button>
                            <button type="button" onClick={() => setFeaturesTarget(null)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm">
                              Anuluj
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    {extendTarget === sub.id && (
                      <tr key={`extend-${sub.id}`} className="bg-emerald-50/50 dark:bg-emerald-950/20">
                        <td colSpan={6} className="p-4">
                          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Przedłuż subskrypcję</p>
                              <div className="flex flex-wrap gap-2">
                                {EXTEND_PRESETS.map((days) => (
                                  <button
                                    key={days}
                                    type="button"
                                    onClick={() => setExtendDays(days)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                                      extendDays === days
                                        ? "bg-emerald-600 text-white border-emerald-600"
                                        : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                                    }`}
                                  >
                                    +{days} dni
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Własna liczba dni</label>
                              <input
                                type="number"
                                min={1}
                                max={365}
                                value={extendDays}
                                onChange={(e) => setExtendDays(Number(e.target.value))}
                                className="w-28 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
                              />
                            </div>
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                              <input
                                type="checkbox"
                                checked={extendReactivate}
                                onChange={(e) => setExtendReactivate(e.target.checked)}
                              />
                              Przywróć dostęp (status ACTIVE)
                            </label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={extending}
                                onClick={() => void handleExtend(sub.id)}
                                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-50"
                              >
                                {extending ? "Zapisywanie..." : "Zapisz przedłużenie"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setExtendTarget(null)}
                                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm"
                              >
                                Anuluj
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
