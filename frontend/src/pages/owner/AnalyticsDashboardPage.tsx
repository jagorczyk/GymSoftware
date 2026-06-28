import { useEffect, useState } from "react";
import { getGymAnalytics, type AnalyticsDashboardDto } from "../../api";
import type { OwnerContext } from "./types";
import { LoadingState } from "../../components/LoadingState";
import { PageHeader } from "../../components/PageHeader";
import { chartTooltipStyle, panelSurfaceClassName } from "../../components/formStyles";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#f97316"];

export function AnalyticsDashboardPage({ ctx }: { ctx: OwnerContext }) {
  const { auth, selectedGymId, setError } = ctx;
  const [data, setData] = useState<AnalyticsDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!selectedGymId) return;
    setLoading(true);
    getGymAnalytics(auth, Number(selectedGymId))
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Błąd ładowania analityki"))
      .finally(() => setLoading(false));
  }, [auth, selectedGymId, setError]);

  if (loading || !data) return <LoadingState message="Ładowanie danych analitycznych..." />;

  const { metrics, revenueOverTime, checkInsOverTime, passTypePopularity } = data;

  const gridStroke = isDark ? "#334155" : "#e2e8f0";
  const tooltipStyle = chartTooltipStyle(isDark);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zaawansowana Analityka"
        subtitle="Analizuj kluczowe wskaźniki i podejmuj decyzje na podstawie danych."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className={`p-6 ${panelSurfaceClassName}`}>
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Przychody (ten miesiąc)</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.revenueThisMonth} PLN</p>
        </div>
        <div className={`p-6 ${panelSurfaceClassName}`}>
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Aktywne Karnety</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.activePasses}</p>
        </div>
        <div className={`p-6 ${panelSurfaceClassName}`}>
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Aktywni Klienci</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.activeGuests}</p>
        </div>
        <div className={`p-6 ${panelSurfaceClassName}`}>
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Nowi Klienci (ten miesiąc)</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.newGuestsThisMonth}</p>
        </div>
        <div className={`p-6 ${panelSurfaceClassName}`}>
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Wejścia (dzisiaj)</h3>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{metrics.checkInsToday}</p>
        </div>
        {(metrics as any).productRevenueThisMonth != null && (
          <div className={`p-6 ${panelSurfaceClassName}`}>
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1">Przychód POS (mies.)</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{(metrics as any).productRevenueThisMonth} PLN</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1 */}
        <div className={`p-6 ${panelSurfaceClassName}`}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Przychody (ostatnie 30 dni)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={revenueOverTime}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} tickMargin={10} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickMargin={10} width={60} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2 */}
        <div className={`p-6 ${panelSurfaceClassName}`}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Wizyty (ostatnie 30 dni)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={checkInsOverTime}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} tickMargin={10} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickMargin={10} width={40} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3 */}
        <div className={`p-6 lg:col-span-2 ${panelSurfaceClassName}`}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Popularność karnetów</h3>
          <div className="h-80 w-full flex justify-center">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={passTypePopularity}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="passTypeName"
                >
                  {passTypePopularity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
