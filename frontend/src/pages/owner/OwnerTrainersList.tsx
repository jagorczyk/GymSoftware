import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../authContext";
import { useToast } from "../../components/Toast";
import { getOwnerTrainers, deleteOwnerTrainer, TrainerProfileView } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { UserCircle, Plus, Edit2, Trash2 } from "lucide-react";

import { OwnerContext } from "./types";

export function OwnerTrainersList({ ctx }: { ctx: OwnerContext }) {
  const { auth } = useAuth();
  const gymId = ctx.selectedGymId;
  const { showError, showSuccess } = useToast();
  const [trainers, setTrainers] = useState<TrainerProfileView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !gymId) return;
    loadTrainers();
  }, [auth, gymId]);

  function loadTrainers() {
    if (!auth || !gymId) return;
    setLoading(true);
    getOwnerTrainers(auth, Number(gymId))
      .then(setTrainers)
      .catch((err) => showError(err.message))
      .finally(() => setLoading(false));
  }

  async function handleDelete(trainerId: number) {
    if (!auth || !gymId) return;
    if (!confirm("Czy na pewno chcesz usunąć tego trenera?")) return;
    try {
      await deleteOwnerTrainer(auth, Number(gymId), trainerId);
      showSuccess("Trener usunięty pomyślnie.");
      loadTrainers();
    } catch (err: any) {
      showError(err.message || "Błąd usuwania trenera");
    }
  }

  if (loading) return <LoadingState message="Wczytywanie trenerów..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Trenerzy Personalni" subtitle="Zarządzaj trenerami na tej siłowni" />
        <Link
          to={`/owner/trainers/new`}
          className="flex items-center gap-2 bg-slate-900 dark:bg-primary-500 hover:bg-slate-800 dark:hover:bg-primary-400 text-white dark:text-slate-950 px-4 py-2 rounded-xl font-bold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Dodaj trenera
        </Link>
      </div>

      {trainers.length === 0 ? (
        <EmptyState
          icon={<UserCircle className="w-12 h-12 text-slate-400" />}
          title="Brak trenerów"
          description="Nie dodano jeszcze żadnych trenerów na tej siłowni."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainers.map((t) => (
            <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group">
              <div className="h-24 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-800/50 relative">
                <div className="absolute -bottom-10 left-6 w-20 h-20 bg-white dark:bg-slate-900 rounded-2xl border-4 border-white dark:border-slate-900 shadow-sm flex items-center justify-center overflow-hidden">
                  <UserCircle className="w-12 h-12 text-slate-400 dark:text-slate-500" />
                </div>
              </div>
              
              <div className="pt-14 p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {t.firstName} {t.lastName}
                    </h3>
                    {t.specialization && (
                      <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                        {t.specialization}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed flex-1">
                  {t.bio || "Brak opisu."}
                </p>

                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Stawka</p>
                    <p className="font-bold text-slate-900 dark:text-white text-lg">{t.hourlyRate} PLN / h</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/owner/trainers/${t.id}`}
                      className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
