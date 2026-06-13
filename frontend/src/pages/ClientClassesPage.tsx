import { useEffect, useState } from "react";
import { CalendarDays, Users, Clock, Star } from "lucide-react";
import { getClientClasses, clientBookClass, clientCancelClass, type GroupClassView } from "../api";
import { rateClass } from "../clientApi";
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

  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingClassId, setRatingClassId] = useState<number | null>(null);
  const [ratingClassName, setRatingClassName] = useState("");
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  function fetchClasses() {
    if (!gymId || !auth) return;
    setLoading(true);
    
    const from = new Date(); // now
    const to = new Date();
    to.setDate(to.getDate() + 30); // next 30 days

    getClientClasses(auth, Number(gymId), from.toISOString(), to.toISOString())
      .then(setClasses)
      .catch((err) => setError(err instanceof Error ? err.message : "Błąd pobierania zajęć"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchClasses();
  }, [gymId, auth]);

  async function handleBook(classId: number) {
    if (!gymId || !auth) return;
    try {
      await clientBookClass(auth, Number(gymId), classId);
      showSuccess("Zapisano pomyślnie!");
      fetchClasses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd podczas zapisywania");
    }
  }

  async function handleCancel(classId: number) {
    if (!gymId || !auth) return;
    try {
      await clientCancelClass(auth, Number(gymId), classId);
      showSuccess("Anulowano rezerwację.");
      fetchClasses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Błąd podczas anulowania");
    }
  }

  function openRatingModal(classId: number, className: string) {
    setRatingClassId(classId);
    setRatingClassName(className);
    setRatingValue(5);
    setRatingComment("");
    setRatingModalOpen(true);
  }

  async function handleRatingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!auth || !gymId || ratingClassId === null) return;
    setSubmittingRating(true);
    try {
      await rateClass(auth, Number(gymId), ratingClassId, { rating: ratingValue, comment: ratingComment });
      showSuccess("Dziękujemy za ocenę zajęć!");
      setRatingModalOpen(false);
    } catch (err: any) {
      setError(err.message || "Błąd podczas zapisywania oceny");
    } finally {
      setSubmittingRating(false);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((c) => {
            const isFull = c.activeReservations >= c.capacity;
            const startDate = new Date(c.startTime);
            const endDate = new Date(c.endTime);
            return (
              <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                {c.userReservationStatus && (
                  <div className={`absolute top-0 right-0 left-0 h-1 bg-gradient-to-r ${
                    c.userReservationStatus === "RESERVED"
                      ? "from-emerald-400 to-teal-500"
                      : c.userReservationStatus === "WAITLISTED"
                      ? "from-blue-400 to-indigo-500"
                      : "from-slate-300 to-slate-400"
                  }`}></div>
                )}
                
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">{c.name}</h3>
                  <div className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    isFull 
                      ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40" 
                      : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40"
                  }`}>
                    {c.activeReservations} / {c.capacity} miejsc
                  </div>
                </div>
                
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 line-clamp-2 min-h-[40px] leading-relaxed">{c.description || "Brak opisu zajęć"}</p>
                
                <div className="mt-auto space-y-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>
                      {startDate.toLocaleString("pl-PL", { day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" })}
                      {" - "}
                      {endDate.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>Prowadzi: <span className="font-semibold text-slate-700 dark:text-slate-300">{c.instructorName}</span></span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  {c.userReservationStatus === "RESERVED" ? (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="text-center bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 py-2.5 rounded-xl text-sm font-bold">
                        Zarezerwowano miejsce
                      </div>
                      <button
                        onClick={() => handleCancel(c.id)}
                        className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors"
                      >
                        Zrezygnuj z zajęć
                      </button>
                    </div>
                  ) : c.userReservationStatus === "WAITLISTED" ? (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="text-center bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-400 py-2.5 rounded-xl text-sm font-bold">
                        Na liście rezerwowej
                      </div>
                      <button
                        onClick={() => handleCancel(c.id)}
                        className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-lg transition-colors"
                      >
                        Zrezygnuj z listy
                      </button>
                    </div>
                  ) : c.userReservationStatus === "ATTENDED" ? (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="text-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-2 rounded-xl text-xs font-bold">
                        Obecność potwierdzona
                      </div>
                      <button
                        onClick={() => openRatingModal(c.id, c.name)}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5 fill-white" />
                        Oceń te zajęcia
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleBook(c.id)}
                      className={`w-full py-3 rounded-xl text-sm font-bold transition-all text-white shadow-sm ${
                        isFull 
                          ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/10" 
                          : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/10"
                      }`}
                    >
                      {isFull ? "Zapisz się na listę rezerwową" : "Zarezerwuj miejsce"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RATING MODAL */}
      {ratingModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Oceń zajęcia</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Podziel się swoją opinią o zajęciach: <span className="font-semibold text-slate-850 dark:text-slate-200">{ratingClassName}</span></p>
            </div>

            <form onSubmit={handleRatingSubmit} className="space-y-4">
              <div className="flex flex-col items-center justify-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Twoja ocena</span>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingValue(star)}
                      className="text-slate-300 dark:text-slate-600 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-8 h-8 ${star <= ratingValue ? "text-yellow-400 fill-yellow-400" : "text-slate-300 dark:text-slate-600"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Twój komentarz (opcjonalnie)</label>
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Jak oceniasz atmosferę, poziom i prowadzącego?"
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-700 dark:text-white text-sm resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setRatingModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition-all"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={submittingRating}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {submittingRating ? "Zapisywanie..." : "Wyślij ocenę"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
