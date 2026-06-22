import { MapPin, Lock, KeyRound, Ticket, AlertTriangle, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { StatCard } from "../../components/StatCard";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { ExpiringPassesList } from "../../components/ExpiringPassesList";
import type { OwnerContext } from "./types";

function formatMoney(value: number) {
  return new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(value);
}

export function OwnerStats({ ctx }: { ctx: OwnerContext }) {
  const { dashboardStats } = ctx;
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
    { label: "Sprzedaż (7 dni)", value: formatMoney(Number(dashboardStats.salesLast7Days)), icon: <Wallet className="w-6 h-6" /> },
    { label: "Aktywne karnety", value: dashboardStats.activePassesCount, icon: <Ticket className="w-6 h-6" /> },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} icon={s.icon} />
        ))}
      </div>

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
