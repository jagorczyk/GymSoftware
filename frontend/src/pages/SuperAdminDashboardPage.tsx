import React, { useEffect, useState } from "react";
import { useAuth } from "../authContext";
import { getSaaSSubscriptions, cancelSaaSSubscription, updateSaaSSubscriptionStatus, getSaaSStats, GymSubscriptionDTO, SaaSStatsView } from "../api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";

export function SuperAdminDashboardPage() {
  const { auth } = useAuth();
  const [subscriptions, setSubscriptions] = useState<GymSubscriptionDTO[]>([]);
  const [stats, setStats] = useState<SaaSStatsView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    if (!auth) return;
    try {
      setLoading(true);
      const [subsData, statsData] = await Promise.all([
        getSaaSSubscriptions(auth),
        getSaaSStats(auth)
      ]);
      setSubscriptions(subsData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd podczas pobierania danych.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [auth]);

  const handleCancel = async (id: number) => {
    if (!auth) return;
    if (!confirm("Czy na pewno chcesz anulować tę subskrypcję? Operacja jest nieodwracalna.")) return;
    try {
      await cancelSaaSSubscription(auth, id);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Błąd podczas anulowania subskrypcji.");
    }
  };

  const handleStatusChange = async (id: number, currentStatus: string) => {
    if (!auth) return;
    const newStatus = prompt("Podaj nowy status (ACTIVE, TRIALING, PAST_DUE, CANCELED):", currentStatus);
    if (!newStatus || newStatus === currentStatus) return;
    try {
      await updateSaaSSubscriptionStatus(auth, id, newStatus);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Błąd podczas zmiany statusu.");
    }
  };

  if (loading && subscriptions.length === 0) return <LoadingState message="Ładowanie subskrypcji..." />;
  if (error) return <ErrorState message={error} onRetry={loadData} />;

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Panel Super Admina</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Zarządzaj subskrypcjami SaaS na platformie.
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
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aktywne Siłownie</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.activeGyms}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Wersje Próbne</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.trialingGyms}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Anulowane</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{stats.canceledGyms}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Popularność Planów</h3>
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Statusy Subskrypcji</h3>
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Wszystkie Subskrypcje ({subscriptions.length})</h2>
          <button onClick={loadData} className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors">
            Odśwież
          </button>
        </div>
        
        {subscriptions.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Brak aktywnych subskrypcji na platformie.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400">
                  <th className="p-4">ID</th>
                  <th className="p-4">Siłownia</th>
                  <th className="p-4">Właściciel</th>
                  <th className="p-4">Plan SaaS</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Wygasa</th>
                  <th className="p-4 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 text-sm text-gray-900 dark:text-gray-100 font-medium">#{sub.id}</td>
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
                    <td className="p-4 text-sm font-medium text-blue-600 dark:text-blue-400">
                      {sub.saasPlanName}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        sub.status === "ACTIVE" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                        sub.status === "TRIALING" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" :
                        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                      {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleStatusChange(sub.id, sub.status)}
                          className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                        >
                          Status
                        </button>
                        {sub.status !== "CANCELED" && (
                          <button
                            onClick={() => handleCancel(sub.id)}
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30 dark:hover:bg-red-900/50"
                          >
                            Anuluj
                          </button>
                        )}
                      </div>
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
