import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, Plus, Trash2, Edit } from "lucide-react";
import { getOwnerRanks, deleteOwnerRank, type RankView } from "../../api";
import type { OwnerContext } from "./types";
import { LoadingState } from "../../components/LoadingState";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { primaryButtonClassName, secondaryButtonClassName } from "../../components/formStyles";

export function OwnerRanksList({ ctx }: { ctx: OwnerContext }) {
  const { auth, selectedGymId, setError } = ctx;
  const [ranks, setRanks] = useState<RankView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedGymId) return;
    setLoading(true);
    getOwnerRanks(auth, Number(selectedGymId))
      .then(setRanks)
      .catch((err) => setError(err instanceof Error ? err.message : "Błąd pobierania rang"))
      .finally(() => setLoading(false));
  }, [auth, selectedGymId, setError]);

  async function handleDelete(id: number) {
    if (!selectedGymId || !window.confirm("Czy na pewno chcesz usunąć tę rangę?")) return;
    try {
      await deleteOwnerRank(auth, Number(selectedGymId), id);
      setRanks((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd usuwania rangi");
    }
  }

  if (loading) return <LoadingState message="Ładowanie rang..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zarządzanie rangami"
        subtitle="Twórz i edytuj rangi z uprawnieniami dla pracowników."
        action={
          <Link to={`/owner/ranks/new`} className={primaryButtonClassName}>
            <Plus className="w-5 h-5" /> Nowa ranga
          </Link>
        }
      />

      {ranks.length === 0 ? (
        <EmptyState
          icon={<Award className="w-12 h-12 text-slate-400" />}
          title="Brak rang"
          description="Nie zdefiniowano jeszcze żadnych rang w tej siłowni."
          action={
            <Link to={`/owner/ranks/new`} className={`mt-4 ${secondaryButtonClassName}`}>
              <Plus className="w-5 h-5" /> Dodaj pierwszą rangę
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ranks.map((rank) => (
            <div key={rank.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-50 dark:bg-primary-950/40 p-2.5 rounded-xl text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/40">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{rank.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{rank.permissions.length} uprawnień</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    to={`/owner/ranks/${rank.id}`}
                    className="p-2 text-slate-400 dark:text-slate-550 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/20 rounded-lg transition-colors"
                    title="Edytuj"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(rank.id)}
                    className="p-2 text-slate-400 dark:text-slate-550 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                    title="Usuń"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {rank.permissions.map((p) => (
                  <span key={p} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-950/40 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-800">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
