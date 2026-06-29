import type { ReactNode } from "react";
import { CheckCircle2, HelpCircle } from "lucide-react";
import { panelSurfaceClassName, focusRingClassName } from "../../components/formStyles";
import type { SetupStep } from "./payoutShared";

export function PayoutSetupGuide({ steps }: { steps: SetupStep[] }) {
  const completed = steps.filter((s) => s.done).length;

  return (
    <section
      className={`p-6 md:p-8 ${panelSurfaceClassName}`}
      aria-label="Kroki konfiguracji wypłat"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white text-balance">
            Jak to działa
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl text-pretty">
            Trzy kroki, żeby pieniądze od klientów trafiały na Twoje konto bankowe — osobno od
            abonamentu Gymlos w zakładce Subskrypcja.
          </p>
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0">
          Krok {Math.min(completed + 1, steps.length)} z {steps.length}
        </p>
      </div>

      <ol className="space-y-0">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`flex gap-4 py-4 ${
              index < steps.length - 1 ? "border-b border-slate-100 dark:border-slate-800" : ""
            }`}
          >
            <div
              className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                step.done
                  ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
                  : step.current
                  ? "bg-primary-50 dark:bg-primary-950/40 border-primary-400 dark:border-primary-500/50 text-primary-700 dark:text-primary-300"
                  : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
              }`}
              aria-hidden="true"
            >
              {step.done ? <CheckCircle2 className="w-5 h-5" /> : step.id}
            </div>
            <div className="min-w-0 pt-0.5">
              <p
                className={`text-sm font-semibold ${
                  step.current
                    ? "text-slate-900 dark:text-white"
                    : step.done
                    ? "text-slate-700 dark:text-slate-300"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {step.title}
                {step.current && (
                  <span className="ml-2 text-xs font-medium text-primary-600 dark:text-primary-400">
                    — teraz
                  </span>
                )}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 text-pretty">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function PayoutBalanceGlossary() {
  return (
    <details className="group text-sm">
      <summary
        className={`flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-semibold list-none [&::-webkit-details-marker]:hidden rounded-lg -ml-1 px-1 py-0.5 ${focusRingClassName}`}
      >
        <HelpCircle className="w-4 h-4 text-slate-600 dark:text-slate-400" aria-hidden="true" />
        Co oznaczają salda?
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-open:hidden">
          Pokaż
        </span>
      </summary>
      <dl className="mt-3 space-y-3 pl-6 text-slate-600 dark:text-slate-400">
        <div>
          <dt className="font-semibold text-slate-800 dark:text-slate-200">Dostępne do wypłaty</dt>
          <dd className="text-pretty mt-0.5">
            Środki po opłaceniu karnetu przez klienta, gotowe do przelewu na konto bankowe.
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-800 dark:text-slate-200">W trakcie rozliczenia</dt>
          <dd className="text-pretty mt-0.5">
            Płatności właśnie przetwarzane przez Stripe — zwykle widoczne tu przez 1–2 dni.
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-slate-800 dark:text-slate-200">Przelew na bank</dt>
          <dd className="text-pretty mt-0.5">
            Stripe wysyła środki automatycznie, zwykle w ciągu 2–7 dni roboczych od momentu, gdy
            staną się dostępne.
          </dd>
        </div>
      </dl>
    </details>
  );
}

export function PayoutNotice({
  variant,
  children,
}: {
  variant: "success" | "warning";
  children: ReactNode;
}) {
  const styles =
    variant === "success"
      ? "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
      : "border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300";

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`} role="status">
      {children}
    </div>
  );
}
