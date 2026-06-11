import { useEffect, useState } from "react";
import { CalendarDays, Users, Clock } from "lucide-react";
import { getClientClasses, clientBookClass, clientCancelClass, type GroupClassView } from "../api";
import { useAuth } from "../authContext";
import { useAppGymSelector } from "../appGymSelectorContext";
import { PageHeader } from "../components/PageHeader";
import { LoadingState } from "../components/LoadingState";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";

export function ClientClassesPage() {
  const { auth } = useAuth();
  const { state: gymSelector } = useAppGymSelector();
  const gymId = gymSelector.selectedGymId;

  const [classes, setClasses] = useState<GroupClassView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess } = useToast();

  useEffect(() => {
    if (!gymId || !auth) return;
    setLoading(true);
    
    const from = new Date(); // now
    const to = new Date();
    to.setDate(to.getDate() + 30); // next 30 days

    getClientClasses(auth, Number(gymId), from.toISOString(), to.toISOString())
      .then(setClasses)
      .catch((err) => setError(err instanceof Error ? err.message : "Błąd pobierania zajęć"))
      .finally(() => setLoading(false));
  }, [gymId, auth]);

  async function handleBook(classId: number) {
    if (!gymId || !auth) return;
    try {
      await clientBookClass(auth, Number(gymId), classId);
      showSuccess("Pomyślnie zapisano na zajęcia!");
      // Optimistic update
      setClasses(prev => prev.map(c => c.id === classId ? { ...c, activeReservations: c.activeReservations + 1 } : c));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd podczas zapisywania");
    }
  }

  async function handleCancel(classId: number) {
    if (!gymId || !auth) return;
    try {
      await clientCancelClass(auth, Number(gymId), classId);
      showSuccess("Anulowano rezerwację.");
      // Optimistic update
      setClasses(prev => prev.map(c => c.id === classId ? { ...c, activeReservations: c.activeReservations - 1 } : c));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd podczas anulowania");
    }
  }

  if (!gymId) {
    return <EmptyState message="Wybierz siłownię, aby zobaczyć grafik." />;
  }

  if (loading) return <LoadingState message="Wczytywanie zajęć..." />;

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-100 text-sm font-medium flex justify-between items-center">
          {error}
          <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600">✕</button>
        </div>
      )}

      <PageHeader
        title="Zajęcia grupowe"
        subtitle="Sprawdź nadchodzące zajęcia i zarezerwuj miejsce dla siebie."
      />

      {classes.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="w-12 h-12 text-slate-400" />}
          title="Brak nadchodzących zajęć"
          description="Na ten moment nie zaplanowano żadnych nowych zajęć."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => {
            const isFull = c.activeReservations >= c.capacity;
            const startDate = new Date(c.startTime);
            const endDate = new Date(c.endTime);
            return (
              <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col hover:border-slate-300 transition-colors shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-900 text-lg">{c.name}</h3>
                  <div className={`text-xs font-bold px-2 py-1 rounded-md ${isFull ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"}`}>
                    {c.activeReservations} / {c.capacity}
                  </div>
                </div>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">{c.description || "Brak opisu"}</p>
                
                <div className="mt-auto space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>
                      {startDate.toLocaleString("pl-PL", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}
                      {" - "}
                      {endDate.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Prowadzi: {c.instructorName}</span>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex gap-2">
                    <button
                      onClick={() => handleBook(c.id)}
                      disabled={isFull}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-bold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isFull ? "Brak miejsc" : "Zapisz się"}
                    </button>
                    <button
                      onClick={() => handleCancel(c.id)}
                      className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-colors"
                      title="Anuluj rezerwację"
                    >
                      Zrezygnuj
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
