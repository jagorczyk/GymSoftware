import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Plus, Edit, Search } from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { StatusChip } from "../../components/StatusChip";
import { primaryButtonClassName, secondaryButtonClassName } from "../../components/formStyles";
import type { OwnerContext } from "./types";

function lockerGuestName(locker: { guestId?: number | null; guestFirstName?: string; guestLastName?: string }) {
  if (!locker.guestId) return null;
  if (locker.guestFirstName) {
    return `${locker.guestFirstName} ${locker.guestLastName ?? ""}`.trim();
  }
  return `Klient ID: ${locker.guestId}`;
}

export function OwnerLockersList({ ctx }: { ctx: OwnerContext }) {
  const { details } = ctx;
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!details) return [];
    const q = query.trim().toLowerCase();
    if (!q) return details.lockers;
    return details.lockers.filter((l) => {
      const client = lockerGuestName(l) ?? "";
      return l.lockerNumber.toLowerCase().includes(q) || client.toLowerCase().includes(q);
    });
  }, [details, query]);

  if (!details) return <SelectGymPrompt />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Szafki"
        subtitle="Zarządzaj szafkami i ich statusem w siłowni."
        action={
          <Link to="/owner/lockers/new" className={primaryButtonClassName}>
            <Plus className="w-5 h-5" /> Nowa szafka
          </Link>
        }
      />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj szafki..."
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-900 dark:text-white"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Lock className="w-12 h-12 text-slate-400" />}
          title="Brak szafek"
          description={query ? "Nie znaleziono szafek pasujących do wyszukiwania." : "Nie dodano jeszcze żadnych szafek w tej siłowni."}
          action={
            !query ? (
              <Link to="/owner/lockers/new" className={`mt-4 ${secondaryButtonClassName}`}>
                <Plus className="w-5 h-5" /> Dodaj pierwszą szafkę
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((l) => {
            const assignedGuest = lockerGuestName(l);
            return (
              <div
                key={l.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary-50 dark:bg-primary-950/40 p-2.5 rounded-xl text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/40">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">Szafka {l.lockerNumber}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {assignedGuest ?? "Wolna"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/owner/lockers/${l.id}`)}
                    className="p-2 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded-lg transition-all"
                    title="Szczegóły"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3">
                  <StatusChip status={l.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
