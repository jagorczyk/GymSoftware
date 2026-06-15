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

export function ClientClassesPage({ hideHeader }: { hideHeader?: boolean }) {
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

      {!hideHeader && (
        <PageHeader
          title="Zajęcia grupowe"
          subtitle="Sprawdź nadchodzące zajęcia i zarezerwuj miejsce dla siebie."
        />
      )}

      {classes.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="w-12 h-12 text-slate-400" />}
          title="Brak nadchodzących zajęć"
          description="Na ten moment nie zaplanowano żadnych nowych zajęć."
        />
      ) : (
        <div className="space-y-10">
          {Object.entries(
            classes.reduce((acc, c) => {
              const d = new Date(c.startTime);
              // Tworzy klucz w formacie YYYY-MM-DD
              const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
              if (!acc[dateKey]) acc[dateKey] = [];
              acc[dateKey].push(c);
              return acc;
            }, {} as Record<string, typeof classes>)
          ).sort(([a], [b]) => a.localeCompare(b)).map(([dateStr, dayClasses]) => {
            const dateObj = new Date(dateStr);
            const isToday = dateObj.toDateString() === new Date().toDateString();
            
            return (
              <div key={dateStr} className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className={`p-2 rounded-lg ${isToday ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  {isToday ? "Dzisiaj" : dateObj.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" })}
                </h3>
                
                <div className="flex flex-col gap-3">
                  {dayClasses.map((c) => {
                    const isFull = c.activeReservations >= c.capacity;
                    const startDate = new Date(c.startTime);
                    const endDate = new Date(c.endTime);

                    return (
                      <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 hover:shadow-md transition-shadow">
                        
                        {/* Godzina */}
                        <div className="flex flex-col items-start sm:items-end min-w-[80px]">
                          <span className="font-display font-black text-xl text-slate-900 dark:text-white">
                            {startDate.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="text-xs font-semibold text-slate-400">
                            {endDate.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                        {/* Divider */}
                        <div className="hidden sm:block w-px h-12 bg-slate-100 dark:bg-slate-800"></div>

                        {/* Info o zajęciach */}
                        <div className="flex-1 flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 dark:text-white text-lg">{c.name}</h4>
                            {c.userReservationStatus && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                c.userReservationStatus === "RESERVED" ? "bg-emerald-100 text-emerald-700" :
                                c.userReservationStatus === "WAITLISTED" ? "bg-blue-100 text-blue-700" :
                                "bg-slate-100 text-slate-700"
                              }`}>
                                {c.userReservationStatus === "RESERVED" ? "Zapisano" : c.userReservationStatus === "WAITLISTED" ? "Rezerwa" : "Odbyte"}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Prowadzi: <span className="font-semibold text-slate-700 dark:text-slate-300">{c.instructorName}</span></p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-medium text-slate-500">{c.activeReservations}/{c.capacity} zajętych miejsc</span>
                          </div>
                        </div>

                        {/* Akcje */}
                        <div className="w-full sm:w-auto flex-shrink-0">
                          {c.userReservationStatus === "RESERVED" || c.userReservationStatus === "WAITLISTED" ? (
                            <button
                              onClick={() => handleCancel(c.id)}
                              className="w-full sm:w-auto px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:hover:bg-rose-900/50 dark:text-rose-400 font-bold text-sm rounded-xl transition-colors"
                            >
                              Anuluj
                            </button>
                          ) : c.userReservationStatus === "ATTENDED" ? (
                            <button
                              onClick={() => openRatingModal(c.id, c.name)}
                              className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Star className="w-4 h-4" /> Oceń
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBook(c.id)}
                              className={`w-full sm:w-auto px-6 py-2.5 font-bold text-sm rounded-xl transition-colors text-white ${
                                isFull 
                                  ? "bg-slate-800 hover:bg-slate-900 shadow-sm" 
                                  : "bg-slate-900 hover:bg-slate-800 shadow-md"
                              }`}
                            >
                              {isFull ? "Lista Rezerwowa" : "Zapisz się"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
