import { useEffect, useState } from "react";
import { useAuth } from "../authContext";
import { useAppGymSelector } from "../appGymSelectorContext";
import { useToast } from "../components/Toast";
import {
  getTrainers,
  bookTraining,
  getTrainerSchedule,
  TrainerProfileView,
  TrainerScheduleDayView,
  ScheduleSlotView,
} from "../clientApi";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { UserCircle, Star, ArrowLeft, CheckCircle, Lock, Clock } from "lucide-react";

// ─── helpers ───────────────────────────────────────────────────────────────────

function formatDay(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(timeStr: string) {
  return timeStr.substring(0, 5);
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ClientTrainersPage({ hideHeader }: { hideHeader?: boolean }) {
  const { auth } = useAuth();
  const { state: gymSelector } = useAppGymSelector();
  const gymId = gymSelector.selectedGymId;
  const { showError, showSuccess } = useToast();

  const [trainers, setTrainers] = useState<TrainerProfileView[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected trainer → show their schedule
  const [selectedTrainer, setSelectedTrainer] = useState<TrainerProfileView | null>(null);
  const [schedule, setSchedule] = useState<TrainerScheduleDayView[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Booking confirmation state
  const [pendingSlot, setPendingSlot] = useState<{ date: string; time: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load trainer list
  useEffect(() => {
    if (!gymId || !auth) return;
    setLoading(true);
    getTrainers(auth, Number(gymId))
      .then(setTrainers)
      .catch((err) => showError(err.message))
      .finally(() => setLoading(false));
  }, [gymId, auth]);

  // Load schedule when trainer selected
  useEffect(() => {
    if (!selectedTrainer || !auth || !gymId) return;
    setLoadingSchedule(true);
    setSchedule([]);
    getTrainerSchedule(auth, Number(gymId), selectedTrainer.id)
      .then(setSchedule)
      .catch((err) => showError(err.message))
      .finally(() => setLoadingSchedule(false));
  }, [selectedTrainer, auth, gymId]);

  async function handleBook() {
    if (!auth || !gymId || !selectedTrainer || !pendingSlot) return;
    const scheduledAt = `${pendingSlot.date}T${pendingSlot.time}`;
    setIsSubmitting(true);
    try {
      await bookTraining(auth, Number(gymId), selectedTrainer.id, scheduledAt);
      showSuccess(`Zarezerwowano trening na ${formatDay(pendingSlot.date)} o ${formatTime(pendingSlot.time)}!`);
      setPendingSlot(null);
      // Refresh schedule to mark slot as occupied
      const updated = await getTrainerSchedule(auth, Number(gymId), selectedTrainer.id);
      setSchedule(updated);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd rezerwacji");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!gymId) return <EmptyState message="Wybierz siłownię, aby zobaczyć listę trenerów." />;
  if (loading) return <LoadingState message="Wczytywanie trenerów..." />;

  // ─── Trainer list ────────────────────────────────────────────────────────────
  if (!selectedTrainer) {
    return (
      <div className="space-y-6">
        {!hideHeader && (
          <PageHeader
            title="Treningi Personalne"
            subtitle="Wybierz trenera i osiągnij swoje cele pod okiem profesjonalisty."
          />
        )}
        {trainers.length === 0 ? (
          <EmptyState
            icon={<UserCircle className="w-12 h-12 text-slate-400" />}
            title="Brak trenerów"
            description="W tym klubie nie ma jeszcze dostępnych trenerów personalnych."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainers.map((t) => (
              <div
                key={t.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
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
                    <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">5.0</span>
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
                    <button
                      onClick={() => setSelectedTrainer(t)}
                      className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors"
                    >
                      Zobacz terminarz
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

  // ─── Schedule view ────────────────────────────────────────────────────────────
  const hasAnySlots = schedule.some((d) => d.slots.length > 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => { setSelectedTrainer(null); setPendingSlot(null); }}
          className="mt-1 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {selectedTrainer.firstName} {selectedTrainer.lastName}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {selectedTrainer.specialization && (
              <span className="font-semibold text-primary-600 dark:text-primary-400 mr-2">
                {selectedTrainer.specialization} ·{" "}
              </span>
            )}
            {selectedTrainer.hourlyRate} PLN / godz.
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 text-sm font-medium text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-emerald-500 inline-block" />
          Wolny termin – kliknij aby zarezerwować
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700 inline-block" />
          Zajęty / miniony
        </span>
      </div>

      {loadingSchedule ? (
        <LoadingState message="Ładowanie terminarza..." />
      ) : !hasAnySlots ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-16 text-center">
          <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300 text-lg mb-1">Brak dostępnych terminów</h3>
          <p className="text-slate-400 dark:text-slate-500 text-sm">
            Ten trener nie dodał jeszcze żadnych godzin do swojego terminarza.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {schedule.map((day) => (
            <div
              key={day.date}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] overflow-hidden"
            >
              {/* Day header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white capitalize">
                    {formatDay(day.date)}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {day.slots.filter((s) => s.available).length} wolnych ·{" "}
                    {day.slots.filter((s) => !s.available).length} zajętych
                  </p>
                </div>
              </div>

              {/* Slots grid */}
              <div className="p-6">
                <div className="flex flex-wrap gap-3">
                  {day.slots.map((slot: ScheduleSlotView) => {
                    const isPending =
                      pendingSlot?.date === day.date && pendingSlot?.time === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() =>
                          slot.available &&
                          setPendingSlot(
                            isPending ? null : { date: day.date, time: slot.time }
                          )
                        }
                        className={`
                          relative w-24 py-3 rounded-2xl text-sm font-bold transition-all duration-150 border-2
                          ${
                            !slot.available
                              ? "bg-slate-50 dark:bg-slate-950/40 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                              : isPending
                              ? "bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/30 scale-105"
                              : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 hover:border-emerald-300 hover:scale-105"
                          }
                        `}
                      >
                        {!slot.available && (
                          <Lock className="w-3 h-3 absolute top-1.5 right-1.5 opacity-40" />
                        )}
                        {formatTime(slot.time)}
                        <span className="block text-xs font-normal mt-0.5 opacity-70">
                          {slot.available ? "wolny" : "zajęty"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sticky booking bar */}
      {pendingSlot && (
        <div className="sticky bottom-6 z-30 animate-in slide-in-from-bottom-4 duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-2xl mx-auto">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                Wybrany termin
              </p>
              <p className="font-extrabold text-slate-900 dark:text-white text-lg capitalize">
                {formatDay(pendingSlot.date)}
              </p>
              <p className="text-primary-600 dark:text-primary-400 font-bold text-base">
                godz. {formatTime(pendingSlot.time)}
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setPendingSlot(null)}
                className="flex-1 sm:flex-none px-5 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm"
              >
                Anuluj
              </button>
              <button
                onClick={handleBook}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-colors text-sm"
              >
                {isSubmitting ? "Rezerwuję..." : "Potwierdź rezerwację"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
