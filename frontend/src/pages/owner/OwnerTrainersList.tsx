import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../authContext";
import { useToast } from "../../components/Toast";
import { getOwnerTrainers, deleteOwnerTrainer, TrainerProfileView } from "../../api";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { LoadingState } from "../../components/LoadingState";
import { UserCircle, Plus, Edit2, Trash2 } from "lucide-react";
import {
  iconDangerButtonClassName,
  iconEditButtonClassName,
  listCardClassName,
  primaryButtonClassName,
} from "../../components/formStyles";

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
      <PageHeader
        title="Trenerzy personalni"
        action={
          <Link to="/owner/trainers/new" className={primaryButtonClassName}>
            <Plus className="w-5 h-5" /> Nowy trener
          </Link>
        }
      />

      {trainers.length === 0 ? (
        <EmptyState
          icon={<UserCircle className="w-12 h-12 text-slate-400" />}
          title="Brak trenerów"
          description="Nie dodano jeszcze żadnych trenerów na tej siłowni."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainers.map((t) => (
            <div key={t.id} className={`${listCardClassName} flex flex-col`}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <UserCircle className="w-8 h-8 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                    {t.firstName} {t.lastName}
                  </h3>
                  {t.specialization && (
                    <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 truncate">
                      {t.specialization}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed flex-1">
                {t.bio || "Brak opisu."}
              </p>

              <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Stawka</p>
                  <p className="font-bold text-slate-900 dark:text-white">{t.hourlyRate} PLN / h</p>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    to={`/owner/trainers/${t.id}`}
                    className={iconEditButtonClassName}
                    aria-label={`Edytuj trenera ${t.firstName} ${t.lastName}`}
                  >
                    <Edit2 className="w-4 h-4" aria-hidden="true" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    className={iconDangerButtonClassName}
                    aria-label={`Usuń trenera ${t.firstName} ${t.lastName}`}
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
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
