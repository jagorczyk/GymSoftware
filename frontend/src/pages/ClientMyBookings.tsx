import { useEffect, useState } from "react";
import { CalendarDays, UserCircle } from "lucide-react";
import { getClientClasses, clientCancelClass, type GroupClassView } from "../api";
import { getUpcomingTrainings, cancelTraining, type PersonalTrainingView } from "../clientApi";
import { useAuth } from "../authContext";
import { useAppGymSelector } from "../appGymSelectorContext";
import { LoadingState } from "../components/LoadingState";
import { EmptyState } from "../components/EmptyState";
import { useToast } from "../components/Toast";

export function ClientMyBookings() {
  const { auth } = useAuth();
  const { state: gymSelector } = useAppGymSelector();
  const gymId = gymSelector.selectedGymId;

  const [classes, setClasses] = useState<GroupClassView[]>([]);
  const [trainings, setTrainings] = useState<PersonalTrainingView[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useToast();

  function fetchBookings() {
    if (!gymId || !auth) return;
    setLoading(true);

    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 30);

    Promise.all([
      getClientClasses(auth, Number(gymId), from.toISOString(), to.toISOString()),
      getUpcomingTrainings(auth)
    ])
      .then(([classesData, trainingsData]) => {
        setClasses(classesData.filter((c: GroupClassView) => c.userReservationStatus === "RESERVED" || c.userReservationStatus === "WAITLISTED"));
        setTrainings(trainingsData.filter((t: PersonalTrainingView) => t.status !== "CANCELLED"));
      })
      .catch((err) => showError(err instanceof Error ? err.message : "Błąd pobierania rezerwacji"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchBookings();
  }, [gymId, auth]);

  async function handleCancelClass(classId: number) {
    if (!gymId || !auth) return;
    try {
      await clientCancelClass(auth, Number(gymId), classId);
      showSuccess("Anulowano rezerwację zajęć.");
      fetchBookings();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd podczas anulowania");
    }
  }

  async function handleCancelTraining(trainingId: number) {
    if (!gymId || !auth) return;
    try {
      await cancelTraining(auth, Number(gymId), trainingId);
      showSuccess("Anulowano trening personalny.");
      fetchBookings();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd podczas anulowania");
    }
  }

  if (!gymId) return <EmptyState message="Wybierz siłownię." />;
  if (loading) return <LoadingState message="Wczytywanie rezerwacji..." />;

  const hasAnyBookings = classes.length > 0 || trainings.length > 0;

  if (!hasAnyBookings) {
    return (
      <EmptyState
        icon={<CalendarDays className="w-12 h-12 text-slate-400" />}
        title="Brak aktywnych rezerwacji"
        description="Nie jesteś zapisany na żadne nadchodzące zajęcia grupowe ani treningi personalne."
      />
    );
  }

  return (
    <div className="space-y-8">
      {classes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary-500" />
            Twoje zajęcia grupowe
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((c) => {
              const startDate = new Date(c.startTime);
              return (
                <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">{c.name}</h4>
                    <p className="text-sm text-slate-500">{startDate.toLocaleDateString("pl-PL", { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-xs text-slate-400 mt-1">Prowadzi: {c.instructorName}</p>
                    <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${c.userReservationStatus === "RESERVED" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                      {c.userReservationStatus === "RESERVED" ? "Zapisano" : "Lista Rezerwowa"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCancelClass(c.id)}
                    className="mt-auto w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 dark:text-rose-400 font-bold text-sm rounded-xl transition-colors"
                  >
                    Odwołaj
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {trainings.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-primary-500" />
            Twoje treningi personalne
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trainings.map((t) => {
              const startDate = new Date(t.scheduledAt);
              return (
                <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-lg">Trening Personalny</h4>
                    <p className="text-sm text-slate-500">{startDate.toLocaleDateString("pl-PL", { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-xs text-slate-400 mt-1">Trener: {t.trainerFirstName} {t.trainerLastName}</p>
                  </div>
                  <button
                    onClick={() => handleCancelTraining(t.id)}
                    className="mt-auto w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 dark:text-rose-400 font-bold text-sm rounded-xl transition-colors"
                  >
                    Odwołaj
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
