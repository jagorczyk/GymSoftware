import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, Plus, Trash2, Edit, Search } from "lucide-react";
import { deleteOwnerEmployee } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { primaryButtonClassName, secondaryButtonClassName } from "../../components/formStyles";
import { PERMISSION_LABELS, optionalPermissionsFromList, type EmployeePermission } from "../../permissions";
import type { OwnerContext } from "./types";

export function OwnerEmployeesList({ ctx }: { ctx: OwnerContext }) {
  const { auth, selectedGymId, details, loadGymsAndDetails, setError } = ctx;
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!details) return [];
    const q = query.trim().toLowerCase();
    if (!q) return details.employees;
    return details.employees.filter((e: any) => {
      const fullName = `${e.firstName ?? ""} ${e.lastName ?? ""}`.toLowerCase();
      return e.email.toLowerCase().includes(q) || fullName.includes(q);
    });
  }, [details, query]);

  if (!details) return <SelectGymPrompt />;

  async function handleDelete(id: number, email: string) {
    if (!selectedGymId || !window.confirm(`Czy na pewno chcesz usunąć pracownika ${email}?`)) return;
    try {
      await deleteOwnerEmployee(auth, Number(selectedGymId), id);
      await loadGymsAndDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd usuwania pracownika");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pracownicy"
        subtitle="Zarządzaj personelem i uprawnieniami w siłowni."
        action={
          <Link to="/owner/employees/new" className={primaryButtonClassName}>
            <Plus className="w-5 h-5" /> Nowy pracownik
          </Link>
        }
      />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj po imieniu, nazwisku lub emailu..."
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-900 dark:text-white"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12 text-slate-400" />}
          title="Brak pracowników"
          description={query ? "Nie znaleziono pracowników pasujących do wyszukiwania." : "Nie dodano jeszcze żadnych pracowników w tej siłowni."}
          action={
            !query ? (
              <Link to="/owner/employees/new" className={`mt-4 ${secondaryButtonClassName}`}>
                <Plus className="w-5 h-5" /> Dodaj pierwszego pracownika
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((e: any) => {
            const extras = optionalPermissionsFromList(e.permissions as EmployeePermission[]);
            const fullName = [e.firstName, e.lastName].filter(Boolean).join(" ");
            return (
              <div
                key={e.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-primary-50 dark:bg-primary-950/40 p-2.5 rounded-xl text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/40 shrink-0">
                      {e.avatarUrl ? (
                        <img src={e.avatarUrl} alt="" className="w-6 h-6 rounded-lg object-cover" />
                      ) : (
                        <Users className="w-6 h-6" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate">
                        {fullName || e.email}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {fullName ? e.email : `ID: ${e.id}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      type="button"
                      onClick={() => navigate(`/owner/employees/${e.id}`)}
                      className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded-lg transition-colors"
                      title="Edytuj"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(e.id, e.email)}
                      className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                      title="Usuń"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {e.rankName ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                    {e.rankName}
                  </span>
                ) : extras.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {extras.map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                      >
                        {PERMISSION_LABELS[p]}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 dark:text-slate-400">Tylko uprawnienia podstawowe</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
