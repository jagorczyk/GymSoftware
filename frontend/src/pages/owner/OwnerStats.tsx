import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MapPin, Lock, KeyRound, Ticket, AlertTriangle, Wallet, UserCircle } from "lucide-react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import { StatCard } from "../../components/StatCard";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { ExpiringPassesList } from "../../components/ExpiringPassesList";
import { PageHeader } from "../../components/PageHeader";
import type { OwnerContext } from "./types";

const CHART_COLORS = ["#2155e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

function formatMoney(value: number) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(value);
}

function formatChartDate(label: string) {
  const date = new Date(label);
  if (Number.isNaN(date.getTime())) return label;
  return date.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

function chartPoints(points: Array<{ label: string; value: number }> | undefined) {
  return (points ?? []).map((p) => ({
    label: formatChartDate(p.label),
    value: Number(p.value),
  }));
}

export function OwnerStats({ ctx }: { ctx: OwnerContext }) {
  const { dashboardStats } = ctx;
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const gridStroke = isDark ? "#334155" : "#e2e8f0";
  const tooltipBg = isDark ? "#0f172a" : "#ffffff";
  const tooltipColor = isDark ? "#ffffff" : "#0f172a";

  const checkInsChart = useMemo(
    () => chartPoints(dashboardStats?.checkInsLast7Days),
    [dashboardStats?.checkInsLast7Days]
  );
  const salesChart = useMemo(
    () => chartPoints(dashboardStats?.salesTrendLast7Days),
    [dashboardStats?.salesTrendLast7Days]
  );
  const newGuestsChart = useMemo(
    () => chartPoints(dashboardStats?.newGuestsLast7Days),
    [dashboardStats?.newGuestsLast7Days]
  );
  const productSalesChart = useMemo(
    () => chartPoints(dashboardStats?.productSalesLast7Days),
    [dashboardStats?.productSalesLast7Days]
  );
  const passTypeChart = useMemo(
    () =>
      (dashboardStats?.passTypeSalesLast7Days ?? []).map((p) => ({
        name: p.passTypeName,
        value: p.count,
      })),
    [dashboardStats?.passTypeSalesLast7Days]
  );

  if (!dashboardStats) return <SelectGymPrompt />;

  const expiring = dashboardStats.expiringPasses.map((g) => ({
    guestId: g.guestId,
    firstName: g.firstName,
    lastName: g.lastName,
    endDate: g.endDate,
    daysRemaining: g.daysRemaining,
  }));

  const stats = [
    { label: "Obecni teraz", value: dashboardStats.presentNow, icon: <MapPin className="w-6 h-6" /> },
    { label: "Wolne szafki", value: dashboardStats.freeLockers, icon: <Lock className="w-6 h-6" /> },
    { label: "Zajęte szafki", value: dashboardStats.occupiedLockers, icon: <KeyRound className="w-6 h-6" /> },
    { label: "Karnety wygasają (7 dni)", value: dashboardStats.expiringPassesCount, icon: <AlertTriangle className="w-6 h-6" /> },
    { label: "Sprzedaż karnetów (7 dni)", value: formatMoney(Number(dashboardStats.salesLast7Days)), icon: <Wallet className="w-6 h-6" /> },
    { label: "Aktywne karnety", value: dashboardStats.activePassesCount, icon: <Ticket className="w-6 h-6" /> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Podsumowanie"
        subtitle="Szybki przegląd siłowni, personelu i trendów z ostatnich 7 dni."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} />
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Zespół</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Awatary, status zmiany i najbliższa dostępność z grafiku.</p>
          </div>
          <Link
            to="/owner/employees"
            className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 bg-primary-50 dark:bg-primary-950/20 px-4 py-2 rounded-xl transition-colors shrink-0"
          >
            Wszyscy pracownicy
          </Link>
        </div>

        {dashboardStats.employees.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Brak pracowników w tej siłowni.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {dashboardStats.employees.map((employee) => {
              const fullName = [employee.firstName, employee.lastName].filter(Boolean).join(" ") || employee.email;
              return (
                <Link
                  key={employee.id}
                  to={`/owner/employees/${employee.id}`}
                  className="flex items-start gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-900/50 hover:bg-slate-50 dark:hover:bg-slate-950/30 transition-colors"
                >
                  <div className="relative shrink-0">
                    {employee.avatarUrl ? (
                      <img
                        src={employee.avatarUrl}
                        alt=""
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400">
                        <UserCircle className="w-8 h-8" />
                      </div>
                    )}
                    {employee.onDutyNow && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" title="Na zmianie" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{fullName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{employee.email}</p>
                    {employee.rankName && (
                      <span className="inline-flex mt-2 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {employee.rankName}
                      </span>
                    )}
                    <p className={`text-xs mt-2 leading-snug ${employee.onDutyNow ? "text-emerald-700 dark:text-emerald-400 font-medium" : "text-slate-600 dark:text-slate-400"}`}>
                      {employee.availabilityLabel}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Wejścia klientów (7 dni)">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={checkInsChart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} width={32} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "none", backgroundColor: tooltipBg, color: tooltipColor }} />
              <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sprzedaż karnetów (7 dni)">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={salesChart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} width={48} />
              <Tooltip
                formatter={(value: number) => formatMoney(value)}
                contentStyle={{ borderRadius: "0.75rem", border: "none", backgroundColor: tooltipBg, color: tooltipColor }}
              />
              <Bar dataKey="value" fill="#2155e5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Nowi klienci (7 dni)">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={newGuestsChart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} width={32} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "none", backgroundColor: tooltipBg, color: tooltipColor }} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sprzedaż POS (7 dni)">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <LineChart data={productSalesChart}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} width={48} />
              <Tooltip
                formatter={(value: number) => formatMoney(value)}
                contentStyle={{ borderRadius: "0.75rem", border: "none", backgroundColor: tooltipBg, color: tooltipColor }}
              />
              <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {passTypeChart.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 sm:p-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Sprzedane karnety wg typu (7 dni)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={passTypeChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                >
                  {passTypeChart.map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "0.75rem", border: "none", backgroundColor: tooltipBg, color: tooltipColor }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Karnety wygasające w ciągu 7 dni</h3>
          {expiring.length > 0 && (
            <Link to="/owner/guests" className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 bg-primary-50 dark:bg-primary-950/20 px-4 py-2 rounded-xl transition-colors">
              Wszyscy klienci
            </Link>
          )}
        </div>
        <ExpiringPassesList items={expiring} guestLinkPrefix="/owner/guests" />
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{title}</h3>
      <div className="h-72 w-full">{children}</div>
    </div>
  );
}
