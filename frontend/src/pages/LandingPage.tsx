import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  History,
  KeyRound,
  LineChart,
  Megaphone,
  Shield,
  ShoppingCart,
  Star,
  Ticket,
  Users,
  Wallet,
  Globe,
} from "lucide-react";
import { GymLosLogo } from "../components/GymLosLogo";
import { SAAS_PLAN_FEATURES } from "../saasPlanFeatures";
import { primaryButtonClassName, secondaryButtonClassName } from "../components/formStyles";

const FEATURE_ICONS: Record<string, typeof CalendarDays> = {
  SCHEDULE: CalendarDays,
  WORK_SCHEDULE: CalendarClock,
  TRAINER_BOOKINGS: BadgeCheck,
  LOCKERS: KeyRound,
  INVENTORY: ShoppingCart,
  ANALYTICS: LineChart,
  CRM: Megaphone,
  CLASS_RATINGS: Star,
  NOTIFICATIONS: Bell,
  SALES_REPORT: Wallet,
  AUDIT_LOG: History,
};

const CORE_FEATURES = [
  {
    icon: Ticket,
    title: "Karnety i płatności online",
    description: "Sprzedaż karnetów, integracja ze Stripe i automatyczne przypomnienia o wygaśnięciu.",
  },
  {
    icon: Users,
    title: "Panel właściciela, pracownika i klienta",
    description: "Każda rola ma dedykowany interfejs — od recepcji po samoobsługę klienta.",
  },
  {
    icon: Globe,
    title: "Własna subdomena siłowni",
    description: "Twoja marka pod adresem np. twojasilownia.gymlos.pl — gotowe po rejestracji.",
  },
  {
    icon: Shield,
    title: "Bezpieczeństwo i audyt",
    description: "Role, uprawnienia pracowników, logi operacji i weryfikacja e-mail.",
  },
];

const STEPS = [
  { step: "1", title: "Załóż konto", text: "Wybierz plan i opłać subskrypcję — konfiguracja zajmuje kilka minut." },
  { step: "2", title: "Skonfiguruj siłownię", text: "Ustaw nazwę, adres, karnety, grafik i zaproś pracowników." },
  { step: "3", title: "Zarządzaj na co dzień", text: "Sprzedawaj karnety, prowadź zajęcia i analizuj wyniki w jednym miejscu." },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 font-display font-extrabold text-slate-900 dark:text-white">
            <GymLosLogo className="w-9 h-9 text-primary-600 dark:text-primary-400" />
            <span>Gymlos</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#funkcje" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Funkcje
            </a>
            <a href="#jak-to-dziala" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Jak to działa
            </a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className={`hidden sm:inline-flex text-sm ${secondaryButtonClassName} !py-2.5 !px-4`}>
              Zaloguj się
            </Link>
            <Link to="/register-gym" className={`text-sm ${primaryButtonClassName} !py-2.5 !px-4`}>
              Załóż siłownię
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-[120px]" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-4">
                <CheckCircle2 className="w-4 h-4" />
                Gym Management Software
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight">
                Nowoczesny system do zarządzania siłownią
              </h1>
              <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                Gymlos łączy karnety, rezerwacje zajęć, grafiki pracowników, kasę, analitykę i marketing w jednej
                platformie chmurowej. Dla właścicieli klubów fitness, siłowni i studiów treningowych.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link to="/register-gym" className={primaryButtonClassName}>
                  Rozpocznij za darmo
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#funkcje" className={secondaryButtonClassName}>
                  Zobacz funkcje
                </a>
              </div>
              <ul className="mt-8 grid sm:grid-cols-2 gap-3 text-sm text-slate-600 dark:text-slate-400">
                {["Bez instalacji — działa w przeglądarce", "Płatności Stripe", "Panel klienta i recepcji", "Wsparcie wielu lokalizacji"].map(
                  (item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>
            <div className="relative flex justify-center lg:justify-end">
              <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-primary-500/10 p-6 sm:p-8 max-w-md w-full">
                <GymLosLogo className="w-20 h-20 text-primary-600 dark:text-primary-400 mx-auto mb-6" />
                <h2 className="text-center text-xl font-bold text-slate-900 dark:text-white mb-2">Wszystko w jednym panelu</h2>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Od pierwszego karnetu po raport sprzedaży — bez przełączania między programami.
                </p>
                <div className="space-y-3">
                  {["Karnety i check-in", "Terminarz zajęć", "Magazyn i POS", "Raporty i CRM"].map((label) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 px-4 py-3 text-sm font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4 text-primary-500" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="funkcje" className="py-16 md:py-20 bg-white dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Funkcje platformy</h2>
              <p className="mt-4 text-slate-600 dark:text-slate-400">
                Moduły dostępne w planach subskrypcyjnych — wybierz pakiet dopasowany do wielkości Twojego klubu.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
              {CORE_FEATURES.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-6 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
                </article>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SAAS_PLAN_FEATURES.map((feature) => {
                const Icon = FEATURE_ICONS[feature.id] ?? CheckCircle2;
                return (
                  <article
                    key={feature.id}
                    className="rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 flex gap-4"
                  >
                    <Icon className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{feature.label}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{feature.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="jak-to-dziala" className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">Jak zacząć?</h2>
              <p className="mt-4 text-slate-600 dark:text-slate-400">Trzy kroki od rejestracji do pełnej kontroli nad siłownią.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {STEPS.map(({ step, title, text }) => (
                <div key={step} className="text-center md:text-left">
                  <div className="inline-flex w-12 h-12 rounded-2xl bg-primary-600 text-white font-extrabold text-lg items-center justify-center mb-4">
                    {step}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20 bg-slate-900 text-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Gotowy, by usprawnić swoją siłownię?</h2>
            <p className="text-slate-300 mb-8">
              Dołącz do Gymlos — wybierz plan, skonfiguruj klub i zacznij przyjmować klientów jeszcze dziś.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register-gym" className={`${primaryButtonClassName} !bg-white !text-slate-900 hover:!bg-slate-100`}>
                Załóż konto właściciela
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className={`${secondaryButtonClassName} !border-slate-600 !text-white hover:!bg-slate-800`}>
                Mam już konto
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <GymLosLogo className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <span>© {new Date().getFullYear()} Gymlos</span>
          </div>
          <div className="flex gap-6">
            <Link to="/polityka-prywatnosci" className="hover:text-primary-600 dark:hover:text-primary-400">
              Polityka prywatności
            </Link>
            <Link to="/login" className="hover:text-primary-600 dark:hover:text-primary-400">
              Logowanie
            </Link>
            <Link to="/register" className="hover:text-primary-600 dark:hover:text-primary-400">
              Rejestracja klienta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
