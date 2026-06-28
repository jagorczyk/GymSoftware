import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Ticket, Plus, Trash2, Edit, Search } from "lucide-react";
import { deletePassType } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { primaryButtonClassName, secondaryButtonClassName, iconDangerButtonClassName, iconEditButtonClassName, inputClassName, listCardClassName } from "../../components/formStyles";
import { formatPassTypeValidity } from "../../utils/passTypeLabels";
import type { OwnerContext } from "./types";

export function OwnerPassTypesList({ ctx }: { ctx: OwnerContext }) {
  const { auth, selectedGymId, details, loadGymsAndDetails, setError } = ctx;
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const passTypes = details?.passTypes ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return passTypes;
    return passTypes.filter((pt: any) => pt.name.toLowerCase().includes(q));
  }, [passTypes, query]);

  if (!details) return <SelectGymPrompt />;

  async function handleDelete(id: number, name: string) {
    if (!selectedGymId || !window.confirm(`Czy na pewno chcesz usunąć typ karnetu „${name}”?`)) return;
    try {
      await deletePassType(auth, Number(selectedGymId), id);
      await loadGymsAndDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd usuwania typu karnetu");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Typy karnetów"
        subtitle="Zdefiniuj ofertę karnetów dostępną w siłowni."
        action={
          <Link to="/owner/pass-types/new" className={primaryButtonClassName}>
            <Plus className="w-5 h-5" /> Nowy typ karnetu
          </Link>
        }
      />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj oferty..."
          aria-label="Szukaj typów karnetów"
          className={`pl-12 ${inputClassName}`}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Ticket className="w-12 h-12 text-slate-400" />}
          title="Brak typów karnetów"
          description={query ? "Nie znaleziono ofert pasujących do wyszukiwania." : "Nie zdefiniowano jeszcze żadnych typów karnetów."}
          action={
            !query ? (
              <Link to="/owner/pass-types/new" className={`mt-4 ${secondaryButtonClassName}`}>
                <Plus className="w-5 h-5" /> Dodaj pierwszy typ karnetu
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((pt: any) => (
            <div key={pt.id} className={listCardClassName}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-50 dark:bg-primary-950/40 p-2.5 rounded-xl text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/40">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{pt.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {pt.price} zł • {formatPassTypeValidity(pt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => navigate(`/owner/pass-types/${pt.id}`)}
                    className={iconEditButtonClassName}
                    title="Edytuj"
                    aria-label={`Edytuj ${pt.name}`}
                  >
                    <Edit className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(pt.id, pt.name)}
                    className={iconDangerButtonClassName}
                    title="Usuń"
                    aria-label={`Usuń ${pt.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
