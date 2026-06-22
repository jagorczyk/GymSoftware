import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, CalendarDays, Check, Loader2, Shield, Users } from "lucide-react";
import { getTenantSaaSPlans, type SaaSPlan } from "../api";
import { GymLosLogo } from "../components/GymLosLogo";
import { pickDefaultPlanId } from "../components/RegisterPlanPicker";
import { formatSaasPlanFeatureLabels } from "../saasPlanFeatures";
import { primaryButtonClassName, secondaryButtonClassName } from "../components/formStyles";

const BENEFITS = [
  {
    icon: Users,
    title: "Klienci pod kontrolą",
    description: "Karnety, check-in, panel klienta i recepcja — bez chaosu w Excelu i na kartce.",
  },
  {
    icon: CalendarDays,
    title: "Zajęcia i grafiki",
    description: "Terminarz, rezerwacje, trenerzy i zmiany pracowników w jednym kalendarzu.",
  },
  {
    icon: BarChart3,
    title: "Wiesz, ile zarabiasz",
    description: "Sprzedaż, raporty i analityka — decyzje na liczbach, nie na przeczuciach.",
  },
];

function planPitch(plan: SaaSPlan): string {
  if (plan.features?.trim()) return plan.features.trim();
  const name = plan.name.toLowerCase();
  if (name.includes("starter")) return "Na start — karnety, szafki i podstawy bez zbędnych kosztów.";
  if (name.includes("pro")) return "Dla rozwijającego się klubu — zajęcia, trenerzy i automatyzacja.";
  if (name.includes("premium")) return "Pełna platforma — wszystkie moduły bez kompromisów.";
  return "Pakiet dopasowany do wielkości Twojej siłowni.";
}

function PlanCard({
  plan,
  highlighted,
}: {
  plan: SaaSPlan;
  highlighted: boolean;
}) {
  const highlights = formatSaasPlanFeatureLabels(plan.featureFlags).slice(0, 5);

  return (
    <article
      className={`relative flex flex-col rounded-3xl p-8 transition-all ${
        highlighted
          ? "bg-slate-900 text-white shadow-2xl shadow-primary-500/20 scale-[1.02] ring-2 ring-primary-500"
          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
      }`}
    >
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary-500 text-white text-xs font-bold uppercase tracking-wide">
          Najczęściej wybierany
        </span>
      )}
      <h3 className="text-xl font-bold">{plan.name}</h3>
      <p className={`mt-2 text-sm leading-relaxed ${highlighted ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>
        {planPitch(plan)}
      </p>
      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
        <span className={`text-sm font-medium ${highlighted ? "text-slate-400" : "text-slate-500"}`}>zł / mies.</span>
      </div>
      <ul className="mt-8 space-y-3 flex-1">
        {highlights.map((label) => (
          <li key={label} className="flex items-start gap-2.5 text-sm">
            <Check className={`w-4 h-4 shrink-0 mt-0.5 ${highlighted ? "text-primary-400" : "text-emerald-500"}`} />
            <span className={highlighted ? "text-slate-200" : "text-slate-600 dark:text-slate-300"}>{label}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/register-gym"
        className={`mt-8 w-full text-center text-sm font-bold py-3.5 rounded-2xl transition-colors ${
          highlighted
            ? "bg-white text-slate-900 hover:bg-slate-100"
            : "bg-primary-600 hover:bg-primary-700 text-white"
        }`}
      >
        Wybierz {plan.name}
      </Link>
    </article>
  );
}

export function LandingPage() {
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    getTenantSaaSPlans()
      .then((data) => setPlans(data.filter((p) => p.active)))
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false));
  }, []);

  const recommendedId = useMemo(() => pickDefaultPlanId(plans), [plans]);
  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.price - b.price),
    [plans]
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc] dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <header className="sticky top-0 z-50 bg-[#f8f9fc]/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-display font-extrabold text-slate-900 dark:text-white">
            <GymLosLogo className="w-8 h-8 text-primary-600" />
            Gymlos
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary-600 hidden sm:inline">
              Zaloguj się
            </Link>
            <Link to="/register-gym" className={`text-sm !py-2.5 !px-5 ${primaryButtonClassName}`}>
              Załóż siłownię
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary-600/5 via-transparent to-transparent dark:from-primary-500/10" />
          <div className="max-w-5xl mx-auto px-5 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
            <img
              src="/logo-light.png"
              alt="Gymlos"
              className="h-14 md:h-16 mx-auto mb-8 dark:hidden"
            />
            <img
              src="/logo-dark.png"
              alt="Gymlos"
              className="h-14 md:h-16 mx-auto mb-8 hidden dark:block"
            />
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1] max-w-3xl mx-auto">
              Prowadź siłownię&nbsp;— nie arkusz kalkulacyjny
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Gymlos to system w chmurze dla właścicieli klubów fitness. Karnety, recepcja, zajęcia i raporty —
              wszystko, czego potrzebujesz, żeby skupić się na klientach.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#cennik" className={primaryButtonClassName}>
                Zobacz pakiety
                <ArrowRight className="w-5 h-5" />
              </a>
              <Link to="/register-gym" className={secondaryButtonClassName}>
                Załóż konto
              </Link>
            </div>
            <p className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <Shield className="w-3.5 h-3.5" />
              Bezpieczne płatności Stripe · Własna subdomena siłowni · Bez instalacji
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 md:py-20 border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/40">
          <div className="max-w-5xl mx-auto px-5">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white text-center">
              Jedna platforma zamiast pięciu narzędzi
            </h2>
            <div className="mt-12 grid md:grid-cols-3 gap-8">
              {BENEFITS.map(({ icon: Icon, title, description }) => (
                <div key={title} className="text-center md:text-left">
                  <div className="inline-flex w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/50 items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="cennik" className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-5">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white">Wybierz pakiet</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
                Przejrzyste plany miesięczne. Po rejestracji konfigurujesz siłownię i od razu zaczynasz pracę.
              </p>
            </div>

            {loadingPlans ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : sortedPlans.length === 0 ? (
              <div className="text-center py-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-slate-500">Plany chwilowo niedostępne.</p>
                <Link to="/register-gym" className={`mt-4 inline-flex ${primaryButtonClassName}`}>
                  Skontaktuj się przez rejestrację
                </Link>
              </div>
            ) : (
              <div
                className={`grid gap-6 ${
                  sortedPlans.length === 1
                    ? "max-w-sm mx-auto"
                    : sortedPlans.length === 2
                    ? "md:grid-cols-2 max-w-3xl mx-auto"
                    : "md:grid-cols-3"
                }`}
              >
                {sortedPlans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} highlighted={plan.id === recommendedId} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-slate-900 dark:bg-slate-900/80">
          <div className="max-w-2xl mx-auto px-5 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              Gotowy na porządek w swoim klubie?
            </h2>
            <p className="mt-4 text-slate-400">
              Rejestracja zajmuje kilka minut. Wybierz plan, opłać subskrypcję i skonfiguruj siłownię pod swoją marką.
            </p>
            <Link
              to="/register-gym"
              className={`mt-8 inline-flex ${primaryButtonClassName} !bg-white !text-slate-900 hover:!bg-slate-100`}
            >
              Zacznij teraz
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <span>© {new Date().getFullYear()} Gymlos</span>
          <div className="flex gap-6">
            <Link to="/polityka-prywatnosci" className="hover:text-primary-600">
              Polityka prywatności
            </Link>
            <Link to="/login" className="hover:text-primary-600">
              Logowanie
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
