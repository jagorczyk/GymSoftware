import { useEffect, useState } from "react";
import { useAuth } from "../../authContext";
import {
  getSaaSSubscriptions,
  cancelSaaSSubscription,
  changeSaaSSubscriptionPlan,
  getSaaSStats,
  getSaaSPlans,
  GymSubscriptionDTO,
  SaaSStatsView,
  SaaSPlan,
} from "../../api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { LoadingState } from "../../components/LoadingState";
import { ErrorState } from "../../components/ErrorState";
import { RefreshCw } from "lucide-react";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

function statusBadgeClass(status: string) {
  if (status === "ACTIVE") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
  if (status === "TRIAL") return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
  return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
}

export function SuperAdminSubscriptionsPage() {
  const { auth } = useAuth();
  const [subscriptions, setSubscriptions] = useState<GymSubscriptionDTO[]>([]);
  const [stats, setStats] = useState<SaaSStatsView | null>(null);
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading && subscriptions.length === 0) return <LoadingState message="Ładowanie subskrypcji..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subskrypcje</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Właściciele siłowni i ich pakiety SaaS.
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
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Wszystkie subskrypcje ({subscriptions.length})
          </h2>
          <button
            onClick={() => void loadData()}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Odśwież
          </button>
        </div>

        {subscriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Brak subskrypcji na platformie.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <th className="p-4">Siłownia</th>
                  <th className="p-4">Właściciel</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Wygasa</th>
                  <th className="p-4 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
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
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                      {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("pl-PL") : "-"}
                    </td>
                    <td className="p-4 text-right">
                      {sub.status !== "CANCELED" && (
                        <button
                          onClick={() => void handleCancel(sub.id)}
                          className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30 dark:hover:bg-red-900/50"
                        >
                          Anuluj
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
