import { FormEvent, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../authContext";
import { useToast } from "../components/Toast";
import { getAllGymsForClient, joinGym, ClientGymView } from "../clientApi";
import { ArrowLeft, MapPin, User, Phone, CheckCircle2 } from "lucide-react";
import { formatGymAddressLine } from "../utils/gymLabel";
import { PageHeader } from "../components/PageHeader";
import { LoadingState } from "../components/LoadingState";
import { EmptyState } from "../components/EmptyState";
import {
  panelSurfaceClassName,
  inputClassName,
  labelClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  focusRingClassName,
} from "../components/formStyles";

export function ClientGymJoinPage() {
  const { auth } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const [gyms, setGyms] = useState<ClientGymView[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedGymId, setSelectedGymId] = useState<number | "">("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!auth) return;
    getAllGymsForClient(auth)
      .then((data) => setGyms(data))
      .catch((err) => showError(err instanceof Error ? err.message : "Błąd ładowania"))
      .finally(() => setLoading(false));
  }, [auth, showError]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!auth || selectedGymId === "") return;

    setIsSubmitting(true);
    try {
      await joinGym(auth, {
        gymId: Number(selectedGymId),
        firstName,
        lastName,
        phone,
      });
      showSuccess("Pomyślnie dołączono do siłowni!");
      navigate("/client/dashboard");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd");
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState message="Ładowanie dostępnych klubów..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <PageHeader
        title="Dołącz do klubu"
        subtitle="Wybierz lokalizację i uzupełnij dane kontaktowe."
        action={
          <Link to="/client/dashboard" className={secondaryButtonClassName}>
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Wróć
          </Link>
        }
      />

      <section className="space-y-4">
        <h2 className="text-base font-display font-bold text-slate-900 dark:text-white">
          1. Wybierz lokalizację
        </h2>
        {gyms.length === 0 ? (
          <div className={panelSurfaceClassName}>
            <EmptyState title="Brak dostępnych klubów" description="Spróbuj ponownie później lub skontaktuj się z recepcją." />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Wybór klubu">
            {gyms.map((g) => {
              const selected = selectedGymId === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setSelectedGymId(g.id)}
                  className={`text-left p-5 rounded-2xl border-2 transition-colors flex flex-col gap-2 ${focusRingClassName} ${
                    selected
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10"
                      : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          selected
                            ? "bg-primary-100 dark:bg-primary-900/40 text-primary-600"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        }`}
                      >
                        <MapPin className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white">{g.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-pretty">
                          {formatGymAddressLine(g) || "Brak adresu"}
                        </p>
                      </div>
                    </div>
                    {selected && (
                      <CheckCircle2 className="w-6 h-6 text-primary-500 shrink-0" aria-hidden="true" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section
        className={`space-y-4 transition-opacity ${selectedGymId ? "opacity-100" : "opacity-40 pointer-events-none"}`}
        aria-disabled={!selectedGymId}
      >
        <h2 className="text-base font-display font-bold text-slate-900 dark:text-white">
          2. Twoje dane
        </h2>

        <form onSubmit={handleSubmit} className={`p-6 md:p-8 space-y-6 ${panelSurfaceClassName}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="join-first-name" className={labelClassName}>
                Imię
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                <input
                  id="join-first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Wpisz imię"
                  className={`${inputClassName} pl-11`}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="join-last-name" className={labelClassName}>
                Nazwisko
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                <input
                  id="join-last-name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Wpisz nazwisko"
                  className={`${inputClassName} pl-11`}
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="join-phone" className={labelClassName}>
              Numer telefonu <span className="text-slate-400 font-normal">(opcjonalnie)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
              <input
                id="join-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+48 000 000 000"
                className={`${inputClassName} pl-11`}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={isSubmitting || selectedGymId === ""}
              className={`w-full ${primaryButtonClassName}`}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? "Przetwarzanie…" : "Dołącz do klubu"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
