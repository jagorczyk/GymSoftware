import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { getTenantSaaSPlans, type SaaSPlan } from "../api";
import { GymLosLogo } from "../components/GymLosLogo";
import { pickDefaultPlanId } from "../components/RegisterPlanPicker";
import { formatSaasPlanFeatureLabels } from "../saasPlanFeatures";
import { primaryButtonClassName, secondaryButtonClassName } from "../components/formStyles";

const IMAGE_FEATURES = [
  {
    title: "Recepcja i sprzedaż bez kolejek",
    description: "Szybka obsługa karnetów, check-in i płatności w jednym panelu.",
    imageUrl: "/landing-gym-1.png",
  },
  {
    title: "Klient wraca, bo ma wygodę",
    description: "Rezerwacje, podgląd członkostwa i komunikacja z klubem bez telefonów.",
    imageUrl: "/landing-gym-2.png",
  },
  {
    title: "Widoczny wzrost klubu",
    description: "Codzienne raporty i analiza sprzedaży, żeby szybciej podejmować decyzje.",
    imageUrl: "/landing-gym-3.png",
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
  const navigate = useNavigate();
  const pricingRef = useRef<HTMLElement>(null);
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  function scrollToPricing() {
    pricingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

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
    <div className="min-h-screen bg-[#070d1a] text-slate-100">
      <header className="sticky top-0 z-50 bg-[#070d1a]/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 font-display font-extrabold text-white">
            <GymLosLogo className="w-8 h-8 text-primary-400" />
            Gymlos
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white hidden sm:inline">
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
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.14),transparent_40%)] pointer-events-none" />
          <div className="relative z-10 max-w-5xl mx-auto px-5 pt-16 pb-20 md:pt-24 md:pb-28 text-center">
            <img
              src="/logo-icon-alpha.png"
              alt="Gymlos"
              className="w-24 h-24 md:w-28 md:h-28 mx-auto mb-8 object-contain"
            />
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] max-w-3xl mx-auto">
              Twoja siłownia może wyglądać premium nie tylko na sali, ale i w systemie
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Gymlos porządkuje codzienną pracę klubu: od recepcji i karnetów, przez grafik, aż po wyniki finansowe.
              Mniej klikania, więcej czasu na rozwój i klientów.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <button type="button" onClick={scrollToPricing} className={primaryButtonClassName}>
                Zobacz pakiety
                <ArrowRight className="w-5 h-5" />
              </button>
              <button type="button" onClick={() => navigate("/register-gym")} className={secondaryButtonClassName}>
                Załóż konto
              </button>
            </div>
            <p className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Bezpieczne płatności Stripe · Własna subdomena siłowni · Bez instalacji
            </p>
          </div>
        </section>

        {/* Image Features */}
        <section className="py-14 md:py-20 border-t border-white/10">
          <div className="max-w-5xl mx-auto px-5">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white text-center">
              System, który czuć jak Twój klub
            </h2>
            <p className="text-center text-slate-300 mt-3 max-w-2xl mx-auto">
              Zamiast generycznych boxów — trzy konkretne obszary, które podnoszą jakość obsługi i wynik klubu.
            </p>
            <div className="mt-10 grid lg:grid-cols-12 gap-5">
              {IMAGE_FEATURES.map((item, index) => (
                <article
                  key={item.title}
                  className={`relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b1428] ${
                    index === 0 ? "lg:col-span-8 lg:row-span-2 min-h-[320px]" : "lg:col-span-4 min-h-[200px]"
                  } ${index === 2 ? "lg:col-span-4 lg:-mt-10" : ""}`}
                  style={{
                    backgroundImage: `linear-gradient(140deg, rgba(3, 10, 25, 0.86), rgba(9, 27, 62, 0.68)), url(${item.imageUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.25),transparent_45%)] pointer-events-none" />
                  <div className="relative z-10 h-full p-6 md:p-7 flex flex-col justify-end">
                    <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary-200 mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Feature
                    </p>
                    <h3 className="text-xl md:text-2xl font-extrabold text-white leading-tight">{item.title}</h3>
                    <p className="mt-2 text-sm md:text-base text-slate-200 max-w-xl">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section ref={pricingRef} id="cennik" className="py-16 md:py-24 scroll-mt-20">
          <div className="max-w-5xl mx-auto px-5">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">Wybierz pakiet</h2>
              <p className="mt-3 text-slate-300 max-w-lg mx-auto">
                Przejrzyste plany miesięczne. Po rejestracji konfigurujesz siłownię i od razu zaczynasz pracę.
              </p>
            </div>

            {loadingPlans ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
              </div>
            ) : sortedPlans.length === 0 ? (
              <div className="text-center py-12 rounded-3xl border border-dashed border-slate-600">
                <p className="text-slate-300">Plany chwilowo niedostępne.</p>
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
        <section className="py-16 bg-[#0b1428] border-y border-white/10">
          <div className="max-w-2xl mx-auto px-5 text-center">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              Chcesz, żeby Twój klub działał tak dobrze, jak wygląda?
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

      <footer className="py-8 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <span>© {new Date().getFullYear()} Gymlos</span>
          <div className="flex gap-6">
            <Link to="/polityka-prywatnosci" className="hover:text-primary-300">
              Polityka prywatności
            </Link>
            <Link to="/login" className="hover:text-primary-300">
              Logowanie
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
