import { MapPin, Lock, KeyRound, AlertTriangle, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { StatCard } from "../../components/StatCard";
import { ExpiringPassesList } from "../../components/ExpiringPassesList";
import { SelectGymDashboardPrompt } from "./EmployeeHomePrompt";
import { computeEmployeeKpis } from "../../utils/dashboardStats";
import type { EmployeeContext } from "./types";

export { SelectGymDashboardPrompt } from "./EmployeeHomePrompt";

function formatMoney(value: number) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(value);
}

export function EmployeeHome({ ctx }: { ctx: EmployeeContext }) {
  const { selectedGymId, overview } = ctx;

  if (!selectedGymId) return <SelectGymDashboardPrompt />;

  const expiring =
    overview?.expiringPasses?.map((p: {
      guestId: number;
      firstName: string;
      lastName: string;
      endDate: string;
      daysRemaining: number;
    }) => ({
      guestId: p.guestId,
      firstName: p.firstName,
      lastName: p.lastName,
      endDate: p.endDate,
      daysRemaining: p.daysRemaining,
    })) ?? [];

  const kpis = overview
    ? computeEmployeeKpis({ ...overview, expiringPasses: expiring })
    : null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {kpis && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard label="Obecni teraz" value={kpis.presentNow} icon={<MapPin className="w-6 h-6" />} />
          <StatCard label="Wolne szafki" value={kpis.freeLockers} icon={<Lock className="w-6 h-6" />} />
          <StatCard label="Zajęte szafki" value={kpis.occupiedLockers} icon={<KeyRound className="w-6 h-6" />} />
          <StatCard
            label="Karnety wygasają (7 dni)"
            value={kpis.expiringPassesCount}
            icon={<AlertTriangle className="w-6 h-6" />}
          />
          <StatCard
            label="Sprzedaż (7 dni)"
            value={formatMoney(kpis.salesLast7Days)}
            icon={<Wallet className="w-6 h-6" />}
          />
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] p-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Karnety wygasające w ciągu 7 dni</h3>
          {expiring.length > 0 && (
            <Link to="/employee/guests" className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 bg-primary-50 dark:bg-primary-950/20 px-4 py-2 rounded-xl transition-colors">
              Wszyscy klienci
            </Link>
          )}
        </div>
        <ExpiringPassesList items={expiring} guestLinkPrefix="/employee/guests" />
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-6 font-medium">Dane na żywo odświeżane co 10 s</p>
      </div>
    </div>
  );
}
