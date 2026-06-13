import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Users, Clock, Edit, Trash2 } from "lucide-react";
import { getClasses, deleteClass, type GroupClassView } from "../../api";
import type { EmployeeContext } from "./types";
import { LoadingState } from "../../components/LoadingState";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";

export function EmployeeClassesPage({ ctx }: { ctx: EmployeeContext }) {
  const { auth, selectedGymId, setError, permissions } = ctx;
  const [classes, setClasses] = useState<GroupClassView[]>([]);
  const [loading, setLoading] = useState(true);

  const canManage = permissions.includes("MANAGE_CLASSES");

  useEffect(() => {
    if (!selectedGymId) return;
    setLoading(true);
    // Fetch upcoming classes (from yesterday to next 30 days)
    const from = new Date();
    from.setDate(from.getDate() - 1);
    const to = new Date();
    to.setDate(to.getDate() + 30);

    getClasses(auth, Number(selectedGymId), from.toISOString(), to.toISOString())
      .then(setClasses)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Błąd pobierania zajęć"))
      .finally(() => setLoading(false));
  }, [auth, selectedGymId, setError]);

  async function handleDelete(id: number) {
    if (!selectedGymId || !window.confirm("Na pewno usunąć te zajęcia?")) return;
    try {
      await deleteClass(auth, Number(selectedGymId), id);
      setClasses((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Błąd usuwania");
    }
  }

  if (loading) return <LoadingState message="Ładowanie zajęć..." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Zajęcia grupowe"
        subtitle="Grafik nadchodzących zajęć i rezerwacje."
        action={
          canManage ? (
            <Link
              to={`/employee/classes/new`}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" /> Nowe zajęcia
            </Link>
          ) : undefined
        }
      />

      {classes.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12 text-slate-400" />}
          title="Brak zajęć"
          description="Nie zaplanowano jeszcze żadnych zajęć grupowych."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {classes.map((c) => (
            <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col hover:border-slate-300 dark:hover:border-slate-700 transition-colors group">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">{c.name}</h3>
                {canManage && (
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    <Link to={`/employee/classes/${c.id}/edit`} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg"><Edit className="w-4 h-4" /></Link>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 min-h-[40px]">{c.description || "Brak opisu"}</p>
              
              <div className="mt-auto space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-350">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>
                    {new Date(c.startTime).toLocaleString("pl-PL", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}
                    {" - "}
                    {new Date(c.endTime).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-350">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>Zapisani: {c.activeReservations} / {c.capacity}</span>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Prowadzi: {c.instructorName}</span>
                  <Link
                    to={`/employee/classes/${c.id}`}
                    className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    Zobacz listę &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
