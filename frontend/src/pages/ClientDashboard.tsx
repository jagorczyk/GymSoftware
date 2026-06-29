import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../authContext";
import { useToast } from "../components/Toast";
import {
  getClientGyms,
  getClientDashboard,
  getClientTodaySummary,
  getUpcomingTrainings,
  ClientTodaySummaryView,
  ClientGymView,
  ClientPassView,
  PersonalTrainingView,
} from "../clientApi";
import { PageHeader } from "../components/PageHeader";
import { LoadingState } from "../components/LoadingState";
import { EmptyState } from "../components/EmptyState";
import { primaryButtonClassName, secondaryButtonClassName } from "../components/formStyles";
import { formatTrainingStatus } from "../utils/clientLabels";
import {
  Store,
  Ticket,
  CalendarDays,
  Plus,
  ShoppingBag,
  Info,
  ChevronRight,
  Dumbbell,
} from "lucide-react";

type PassWithGym = ClientPassView & { gymId: number; gymName: string };

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("pl-PL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ClientDashboard() {
  const { auth } = useAuth();
  const { showError } = useToast();
  const [gyms, setGyms] = useState<ClientGymView[]>([]);
  const [activePasses, setActivePasses] = useState<PassWithGym[]>([]);
  const [upcomingTrainings, setUpcomingTrainings] = useState<PersonalTrainingView[]>([]);
  const [todaySummary, setTodaySummary] = useState<ClientTodaySummaryView | null>(null);
  const [loading, setLoading] = useState(true);

  const displayName = useMemo(() => {
    const email = auth?.email ?? "";
    return email.split("@")[0] || "Klubowicz";
  }, [auth?.email]);

  useEffect(() => {
    if (!auth) return;
    const currentAuth = auth;

    async function load() {
      setLoading(true);
      try {
        const [gymData, trainingsData, todaySummaryData] = await Promise.all([
          getClientGyms(currentAuth),
          getUpcomingTrainings(currentAuth),
          getClientTodaySummary(currentAuth),
        ]);

        setGyms(gymData);
        setTodaySummary(todaySummaryData);

        const now = new Date();
        setUpcomingTrainings(
          trainingsData
            .filter((t) => t.status !== "CANCELLED" && new Date(t.scheduledAt) >= now)
            .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
            .slice(0, 5)
        );

        if (gymData.length > 0) {
          const dashboards = await Promise.all(
            gymData.map((gym) =>
              getClientDashboard(currentAuth, gym.id).then((dash) =>
                dash.activePasses.map((pass) => ({
                  ...pass,
                  gymId: gym.id,
                  gymName: gym.name,
                }))
              )
            )
          );
          setActivePasses(dashboards.flat());
        } else {
          setActivePasses([]);
        }
      } catch (err) {
        showError(err instanceof Error ? err.message : "Błąd ładowania danych");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [auth, showError]);

  if (loading) {
    return <LoadingState message="Ładowanie panelu klienta..." />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <PageHeader
        title={`Cześć, ${displayName}!`}
        subtitle="Twoje karnety, kluby i rezerwacje w jednym miejscu."
        action={
          <Link to="/client/gyms/join" className={primaryButtonClassName}>
            <Plus className="w-5 h-5" />
            Dołącz do klubu
          </Link>
        }
      />

      <div className="flex items-start gap-3 rounded-2xl border border-sky-200 dark:border-sky-900/50 bg-sky-50 dark:bg-sky-950/20 p-4">
        <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 mt-0.5 shrink-0" />
        <div>
          <p className="font-bold text-sky-900 dark:text-sky-200">Wejście do siłowni</p>
          <p className="text-sm text-sky-800/90 dark:text-sky-300/90 mt-1">
            Na recepcji podaj swój e-mail lub imię i nazwisko — personel wpisze Cię na listę obecności.
            Panel w przeglądarce służy do karnetów i rezerwacji, nie do pokazywania kodu przy bramce.
          </p>
        </div>
      </div>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white text-balance">
          Dzisiaj
        </h2>
        {todaySummary?.nextBooking ? (
          <div className="rounded-xl border border-primary-200 dark:border-primary-900/50 bg-primary-50/60 dark:bg-primary-950/20 p-4">
            <p className="text-xs font-semibold text-primary-700 dark:text-primary-300">
              Najbliższa rezerwacja
            </p>
            <p className="font-bold text-slate-900 dark:text-white mt-1">{todaySummary.nextBooking.title}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {todaySummary.nextBooking.gymName} · {formatDateTime(todaySummary.nextBooking.startsAt)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">Brak zaplanowanych rezerwacji.</p>
        )}
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Karnety kończące się w 7 dni:{" "}
          <span className="font-bold text-slate-900 dark:text-white">{todaySummary?.expiringPassesIn7Days ?? 0}</span>
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white text-balance">
            Aktywne karnety
          </h2>
          {activePasses.length > 0 && gyms.length === 1 && (
            <Link
              to={gyms.length > 0 ? `/client/gyms/${gyms[0].id}/passes` : "/client/gyms/join"}
              className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline"
            >
              Zobacz wszystkie
            </Link>
          )}
        </div>

        {activePasses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <EmptyState
              icon={<Ticket className="w-12 h-12 text-slate-400" />}
              title="Brak aktywnych karnetów"
              description="Dołącz do klubu i wykup karnet, aby móc korzystać z siłowni."
              action={
                <Link to="/client/gyms/join" className={secondaryButtonClassName}>
                  <Store className="w-5 h-5" />
                  Przeglądaj kluby
                </Link>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePasses.map((pass) => (
              <Link
                key={`${pass.gymId}-${pass.id}`}
                to={`/client/gyms/${pass.gymId}/passes`}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-primary-300 dark:hover:border-primary-800 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wide">
                      {pass.gymName}
                    </p>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg mt-1">{pass.passType}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Ważny do {formatDate(pass.endDate)}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-500 transition-colors shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white text-balance">
            Nadchodzące rezerwacje
          </h2>
          <Link to="/client/activities" className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline">
            Zajęcia i treningi
          </Link>
        </div>

        {upcomingTrainings.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <EmptyState
              icon={<Dumbbell className="w-12 h-12 text-slate-400" />}
              title="Brak nadchodzących treningów"
              description="Umów trening personalny lub zapisz się na zajęcia grupowe."
              action={
                <Link to="/client/activities" className={secondaryButtonClassName}>
                  <CalendarDays className="w-5 h-5" />
                  Przejdź do rezerwacji
                </Link>
              }
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
            {upcomingTrainings.map((training) => (
              <div key={training.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">
                    Trening z {training.trainerFirstName} {training.trainerLastName}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateTime(training.scheduledAt)}</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatTrainingStatus(training.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white text-balance">
          Twoje kluby
        </h2>

        {gyms.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <EmptyState
              icon={<Store className="w-12 h-12 text-slate-400" />}
              title="Nie należysz jeszcze do żadnego klubu"
              description="Znajdź siłownię w sieci Gymlos i dołącz do niej online."
              action={
                <Link to="/client/gyms/join" className={secondaryButtonClassName}>
                  <Plus className="w-5 h-5" />
                  Dołącz do klubu
                </Link>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gyms.map((gym) => (
              <div
                key={gym.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary-50 dark:bg-primary-950/40 p-2.5 rounded-xl text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-900/40">
                    <Store className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white truncate">{gym.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{gym.address}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={`/client/gyms/${gym.id}/passes`}
                    className="text-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold py-2.5 rounded-xl transition-colors"
                  >
                    Karnety
                  </Link>
                  <Link
                    to={`/client/gyms/${gym.id}/buy`}
                    className="text-center bg-primary-50 hover:bg-primary-100 dark:bg-primary-950/30 dark:hover:bg-primary-950/50 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-900/40 text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Kup karnet
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
