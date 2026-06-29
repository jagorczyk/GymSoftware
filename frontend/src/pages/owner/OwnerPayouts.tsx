import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../authContext";
import { useAppGymSelector } from "../../appGymSelectorContext";
import {
  getOwnerPayoutStatus,
  startOwnerPayoutOnboarding,
  openOwnerPayoutDashboard,
  type PayoutStatusView,
} from "../../api";
import {
  Banknote,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "../../components/PageHeader";
import { LoadingState } from "../../components/LoadingState";
import { SelectGymPrompt } from "../../components/SelectGymPrompt";
import { StatCard } from "../../components/StatCard";
import {
  panelSurfaceClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "../../components/formStyles";
import {
  PAYOUT_PAGE_SUBTITLE,
  buildPayoutSetupSteps,
  formatPayoutMoney,
  payoutBannerDismissKey,
} from "./payoutShared";
import { PayoutSetupGuide, PayoutBalanceGlossary, PayoutNotice } from "./PayoutUi";

export function OwnerPayouts() {
  const { auth } = useAuth();
  const { state: gymSelector } = useAppGymSelector();
  const selectedGymId = gymSelector.selectedGymId;
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<PayoutStatusView | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const onboardingNotice = searchParams.get("onboarding");

  async function loadStatus(options?: { silent?: boolean }) {
    if (!auth || !selectedGymId) return;
    if (options?.silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await getOwnerPayoutStatus(auth, selectedGymId);
      setStatus(data);
      if (data.chargesEnabled && data.payoutsEnabled) {
        try {
          localStorage.removeItem(payoutBannerDismissKey(selectedGymId));
        } catch {
          // ignore
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się pobrać statusu wypłat");
    } finally {
      if (options?.silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (!auth || !selectedGymId) {
      setLoading(false);
      return;
    }
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth, selectedGymId]);

  useEffect(() => {
    if (!auth || !selectedGymId) return;
    if (onboardingNotice === "complete" || onboardingNotice === "refresh") {
      loadStatus({ silent: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onboardingNotice, auth, selectedGymId]);

  async function handleOnboard() {
    if (!auth || !selectedGymId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await startOwnerPayoutOnboarding(auth, selectedGymId);
      window.location.href = res.onboardingUrl;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Nie udało się rozpocząć konfiguracji");
      setActionLoading(false);
    }
  }

  async function handleDashboard() {
    if (!auth || !selectedGymId) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await openOwnerPayoutDashboard(auth, selectedGymId);
      window.location.href = res.dashboardUrl;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Nie udało się otworzyć panelu wypłat");
      setActionLoading(false);
    }
  }

  if (loading) {
    return <LoadingState message="Ładowanie wypłat..." />;
  }

  if (!selectedGymId) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader title="Wypłaty" subtitle={PAYOUT_PAGE_SUBTITLE} />
        <SelectGymPrompt />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader title="Wypłaty" subtitle={PAYOUT_PAGE_SUBTITLE} />
        <div
          className="p-8 text-center rounded-2xl border border-rose-100 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20"
          role="alert"
        >
          <p className="font-semibold text-rose-700 dark:text-rose-300">{error}</p>
          <button type="button" onClick={() => loadStatus()} className={`mt-4 ${secondaryButtonClassName}`}>
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader title="Wypłaty" subtitle={PAYOUT_PAGE_SUBTITLE} />
        <div className={`p-8 text-center text-slate-600 dark:text-slate-400 ${panelSurfaceClassName}`}>
          <p>Brak danych o wypłatach.</p>
          <button type="button" onClick={() => loadStatus()} className={`mt-4 ${secondaryButtonClassName}`}>
            Odśwież
          </button>
        </div>
      </div>
    );
  }

  const isActive = status.chargesEnabled && status.payoutsEnabled;
  const needsOnboarding = !status.accountId || !status.detailsSubmitted || !status.chargesEnabled;
  const setupSteps = buildPayoutSetupSteps(status);
  const hasBalanceData =
    status.availableBalanceCents != null || status.pendingBalanceCents != null;

  const statusLabel = !status.stripeConfigured
    ? "Stripe nieskonfigurowany"
    : isActive
    ? "Aktywne — przyjmujesz płatności online"
    : needsOnboarding
    ? "Wymaga konfiguracji"
    : "W trakcie weryfikacji";

  const statusColor = !status.stripeConfigured
    ? "text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
    : isActive
    ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
    : needsOnboarding
    ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20"
    : "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20";

  const StatusIcon = !status.stripeConfigured
    ? AlertCircle
    : isActive
    ? CheckCircle2
    : needsOnboarding
    ? Clock
    : AlertCircle;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Wypłaty"
        subtitle={PAYOUT_PAGE_SUBTITLE}
        action={
          <button
            type="button"
            onClick={() => loadStatus({ silent: true })}
            disabled={refreshing}
            className={secondaryButtonClassName}
            aria-label="Odśwież status wypłat"
            aria-busy={refreshing}
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "motion-safe:animate-spin" : ""}`}
              aria-hidden="true"
            />
            {refreshing ? "Odświeżanie…" : "Odśwież"}
          </button>
        }
      />

      <div aria-live="polite" aria-atomic="true" className="space-y-4">
        {onboardingNotice === "complete" && (
          <PayoutNotice variant="success">
            <p className="font-semibold">Dane zapisane w Stripe</p>
            <p className="mt-0.5 text-pretty">
              Weryfikacja może potrwać od kilku minut do jednego dnia. Gdy status zmieni się na
              aktywny, klienci będą mogli kupować karnety online.
            </p>
          </PayoutNotice>
        )}
        {onboardingNotice === "refresh" && (
          <PayoutNotice variant="warning">
            Sesja konfiguracji wygasła — użyj przycisku poniżej, aby kontynuować od ostatniego kroku.
          </PayoutNotice>
        )}
      </div>

      {status.stripeConfigured && needsOnboarding && <PayoutSetupGuide steps={setupSteps} />}

      {isActive && hasBalanceData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            label="Dostępne do wypłaty"
            value={formatPayoutMoney(status.availableBalanceCents, status.currency)}
            icon={<Banknote className="w-5 h-5" />}
          />
          <StatCard
            label="W trakcie rozliczenia"
            value={formatPayoutMoney(status.pendingBalanceCents, status.currency)}
            icon={<Clock className="w-5 h-5" />}
          />
        </div>
      )}

      <section className={`p-6 md:p-8 space-y-8 ${panelSurfaceClassName}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${statusColor}`}
          >
            <StatusIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
            {statusLabel}
          </div>
          {isActive && (
            <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              Płatności klientów są włączone
            </p>
          )}
        </div>

        {(!isActive || !hasBalanceData) && (
          <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-950/30 p-6 text-center">
            <Banknote
              className="w-10 h-10 mx-auto text-slate-500 dark:text-slate-400 mb-3"
              aria-hidden="true"
            />
            <p className="text-base font-semibold text-slate-900 dark:text-white">
              {needsOnboarding
                ? "Tu zobaczysz saldo po konfiguracji"
                : "Saldo pojawi się po pierwszej płatności klienta"}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto text-pretty">
              {needsOnboarding
                ? "Po ukończeniu kroków powyżej i pierwszej sprzedaży online zobaczysz kwoty dostępne do wypłaty oraz w trakcie rozliczenia."
                : "Gdy klient kupi karnet przez stronę, kwoty pojawią się w tym miejscu."}
            </p>
          </div>
        )}

        <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
          <PayoutBalanceGlossary />
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-4 text-pretty">
            Prowizja Gymlos: {status.applicationFeePercent}% od każdej płatności online. Reszta
            trafia na Twoje konto Stripe i jest przelewana na konto bankowe automatycznie.
          </p>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
          {!status.stripeConfigured ? (
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-2">
                Płatności online niedostępne
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-pretty">
                Administrator platformy musi najpierw skonfigurować Stripe. Skontaktuj się z
                supportem Gymlos, jeśli widzisz ten komunikat na produkcji.
              </p>
            </div>
          ) : needsOnboarding ? (
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-2">
                {status.accountId ? "Dokończ konfigurację" : "Rozpocznij konfigurację"}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 text-pretty">
                Przejdziesz do bezpiecznego formularza Stripe. Bez tego klienci nie mogą kupować
                karnetów na stronie — sprzedaż na recepcji działa jak dotychczas.
              </p>
              {actionError && (
                <p className="text-sm text-rose-700 dark:text-rose-300 mb-4" role="alert">
                  {actionError}
                </p>
              )}
              <button
                type="button"
                onClick={handleOnboard}
                disabled={actionLoading}
                className={primaryButtonClassName}
                aria-busy={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <span
                      className="motion-safe:animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Ładowanie…</span>
                  </>
                ) : (
                  <>
                    {status.accountId ? "Kontynuuj w Stripe" : "Skonfiguruj wypłaty"}
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-2">
                Historia i konto bankowe
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 text-pretty">
                W panelu Stripe zobaczysz historię wypłat, zmienisz konto bankowe i pobierzesz
                zestawienia — bez dodatkowej opłaty od Gymlos.
              </p>
              {actionError && (
                <p className="text-sm text-rose-700 dark:text-rose-300 mb-4" role="alert">
                  {actionError}
                </p>
              )}
              <button
                type="button"
                onClick={handleDashboard}
                disabled={actionLoading}
                className={primaryButtonClassName}
                aria-busy={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <span
                      className="motion-safe:animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"
                      aria-hidden="true"
                    />
                    <span className="sr-only">Ładowanie…</span>
                  </>
                ) : (
                  <>
                    Otwórz panel wypłat
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
