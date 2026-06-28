import { useEffect, useState } from 'react';
import { useAuth } from '../../authContext';
import { getOwnerGymSubscription, createOwnerCustomerPortalSession, createOwnerSaaSCheckoutSession, GymSubscriptionView } from '../../api';
import { useAppGymSelector } from '../../appGymSelectorContext';
import { Crown, CheckCircle2, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { formatSaasPlanFeatureLabels } from '../../saasPlanFeatures';
import { PageHeader } from '../../components/PageHeader';
import { LoadingState } from '../../components/LoadingState';
import { panelSurfaceClassName, primaryButtonClassName } from '../../components/formStyles';

export function OwnerSubscription() {
  const { auth } = useAuth();
  const { state: gymSelector } = useAppGymSelector();
  const selectedGymId = gymSelector.selectedGymId;
  const [subscription, setSubscription] = useState<GymSubscriptionView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!auth || !selectedGymId) {
      setLoading(false);
      return;
    }
    
    getOwnerGymSubscription(auth, selectedGymId)
      .then(sub => {
        setSubscription(sub);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [auth, selectedGymId]);

  const handleManageSubscription = async () => {
    if (!auth || !selectedGymId || !subscription) return;
    setPortalLoading(true);
    try {
      if (subscription.status === 'TRIAL' || subscription.status === 'UNPAID') {
        const res = await createOwnerSaaSCheckoutSession(auth, selectedGymId);
        window.location.href = res.checkoutUrl;
      } else {
        const res = await createOwnerCustomerPortalSession(auth, selectedGymId);
        window.location.href = res.portalUrl;
      }
    } catch (err: any) {
      alert(err.message);
      setPortalLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Ładowanie subskrypcji..." />;
  }

  if (!selectedGymId) {
    return (
      <div className={`p-8 text-center text-slate-600 dark:text-slate-400 ${panelSurfaceClassName}`}>
        <p>Wybierz siłownię, aby zobaczyć szczegóły subskrypcji.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/40">
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className={`p-8 text-center text-slate-600 dark:text-slate-400 ${panelSurfaceClassName}`}>
        <p>Brak informacji o subskrypcji. Skontaktuj się z administracją.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20';
      case 'TRIAL': return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20';
      case 'PAST_DUE':
      case 'UNPAID': return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20';
      default: return 'text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />;
      case 'TRIAL': return <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />;
      case 'PAST_DUE':
      case 'UNPAID': return <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" aria-hidden="true" />;
      default: return null;
    }
  };

  const statusLabel =
    subscription.status === 'TRIAL'
      ? 'Okres próbny'
      : subscription.status === 'ACTIVE'
      ? 'Aktywna'
      : subscription.status === 'UNPAID'
      ? 'Brak płatności'
      : subscription.status;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Subskrypcja"
        subtitle="Plan, status płatności i dostępne moduły dla wybranej siłowni."
      />

      <div className={`p-6 md:p-8 ${panelSurfaceClassName}`}>
        <div className="flex items-start gap-4 mb-8">
          <div className="w-14 h-14 bg-primary-50 dark:bg-primary-950/30 rounded-xl flex items-center justify-center border border-primary-100 dark:border-primary-900/40 shrink-0">
            <Crown className="w-7 h-7 text-primary-600 dark:text-primary-400" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Obecny plan</p>
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">{subscription.saasPlanName}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="rounded-xl border border-slate-100 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Status</span>
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(subscription.status)}`}>
                {getStatusIcon(subscription.status)}
                {statusLabel}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Koniec okresu</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString('pl-PL') : 'Brak danych'}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 block mb-2">Dostępne moduły</span>
              <div className="flex flex-wrap gap-1.5">
                {formatSaasPlanFeatureLabels(subscription.featureFlags).map((label) => (
                  <span key={label} className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className={`rounded-xl border border-slate-100 dark:border-slate-800 p-5 flex flex-col justify-center ${panelSurfaceClassName}`}>
            <div className="w-12 h-12 bg-primary-50 dark:bg-primary-950/30 rounded-xl flex items-center justify-center mb-4 border border-primary-100 dark:border-primary-900/40">
              <ExternalLink className="w-6 h-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white mb-2">Portal płatności</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Zmień plan, zaktualizuj metodę płatności lub pobierz faktury w bezpiecznym portalu Stripe.
            </p>
            <button
              type="button"
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className={`w-full ${primaryButtonClassName}`}
            >
              {portalLoading ? (
                <span className="motion-safe:animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" aria-hidden="true" />
              ) : (
                <>
                  {(subscription.status === 'TRIAL' || subscription.status === 'UNPAID') ? 'Kup subskrypcję' : 'Zarządzaj subskrypcją'}
                  <span className="opacity-70 text-xs">(Stripe)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
