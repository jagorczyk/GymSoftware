import { useEffect, useState } from 'react';
import { useAuth } from '../../authContext';
import { getOwnerGymSubscription, createOwnerCustomerPortalSession, createOwnerSaaSCheckoutSession, GymSubscriptionView } from '../../api';
import { useAppGymSelector } from '../../appGymSelectorContext';
import { Crown, CheckCircle2, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { formatSaasPlanFeatureLabels } from '../../saasPlanFeatures';

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
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!selectedGymId) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-2xl">
        <p>Wybierz siłownię, aby zobaczyć szczegóły subskrypcji.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/10 rounded-2xl">
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-2xl">
        <p>Brak informacji o subskrypcji. Skontaktuj się z administracją.</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20';
      case 'TRIAL': return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20';
      case 'PAST_DUE':
      case 'UNPAID': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20';
      default: return 'text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-500/10 dark:border-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'TRIAL': return <Clock className="w-5 h-5 text-amber-600" />;
      case 'PAST_DUE':
      case 'UNPAID': return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Crown className="w-64 h-64 text-white" />
        </div>
        
        <div className="relative z-10 p-8 md:p-12 text-white">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Crown className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Twoja Subskrypcja</h1>
              <p className="text-indigo-200 mt-1">Zarządzaj swoim planem i płatnościami</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10">
              <div className="text-indigo-200 text-sm font-medium mb-2">Obecny plan</div>
              <div className="text-3xl font-bold text-white mb-6">{subscription.saasPlanName}</div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="text-indigo-200">Status</span>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(subscription.status)}`}>
                    {getStatusIcon(subscription.status)}
                    {subscription.status === 'TRIAL' ? 'Okres Próbny' : subscription.status === 'ACTIVE' ? 'Aktywna' : subscription.status === 'UNPAID' ? 'Brak płatności' : subscription.status}
                  </div>
                </div>
                <div className="flex items-center justify-between pb-2">
                  <span className="text-indigo-200">Koniec okresu</span>
                  <span className="text-white font-medium">
                    {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString('pl-PL') : 'Brak danych'}
                  </span>
                </div>
                <div className="pt-2">
                  <span className="text-indigo-200 text-sm block mb-2">Dostępne moduły</span>
                  <div className="flex flex-wrap gap-1.5">
                    {formatSaasPlanFeatureLabels(subscription.featureFlags).map((label) => (
                      <span key={label} className="px-2 py-0.5 rounded-full text-xs bg-white/10 border border-white/10 text-indigo-100">
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col justify-center items-center text-center">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4">
                <ExternalLink className="w-8 h-8 text-indigo-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Portal Płatności</h3>
              <p className="text-indigo-200 text-sm mb-6">
                Zmień plan, zaktualizuj metodę płatności lub pobierz faktury w bezpiecznym portalu Stripe.
              </p>
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="w-full bg-white text-indigo-900 hover:bg-indigo-50 font-semibold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
              >
                {portalLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-900"></div>
                ) : (
                  <>
                    {(subscription.status === 'TRIAL' || subscription.status === 'UNPAID') ? 'Kup subskrypcję' : 'Zarządzaj subskrypcją'}
                    <span className="opacity-50 text-xs ml-1">(Stripe)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
