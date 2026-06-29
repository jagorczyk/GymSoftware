import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, Plus, Trash2, Edit, Search } from "lucide-react";
import { deleteOwnerEmployee } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { primaryButtonClassName, secondaryButtonClassName, iconDangerButtonClassName, iconEditButtonClassName, inputClassName, listCardClassName } from "../../components/formStyles";
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
        action={
          <Link to="/owner/employees/new" className={primaryButtonClassName}>
            <Plus className="w-5 h-5" /> Nowy pracownik
          </Link>
        }
      />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj po imieniu, nazwisku lub emailu..."
          aria-label="Szukaj pracowników"
          className={`pl-12 ${inputClassName}`}
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
              <div key={e.id} className={listCardClassName}>
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
                      className={iconEditButtonClassName}
                      title="Edytuj"
                      aria-label={`Edytuj ${fullName || e.email}`}
                    >
                      <Edit className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(e.id, e.email)}
                      className={iconDangerButtonClassName}
                      title="Usuń"
                      aria-label={`Usuń ${fullName || e.email}`}
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
