import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Banknote, X, ArrowRight } from "lucide-react";
import { focusRingClassName } from "../formStyles";
import { payoutBannerDismissKey } from "../../pages/owner/payoutShared";

type PayoutSetupBannerProps = {
  gymId: number;
  stripeConfigured: boolean;
  onlinePaymentsEnabled: boolean;
};

export function PayoutSetupBanner({
  gymId,
  stripeConfigured,
  onlinePaymentsEnabled,
}: PayoutSetupBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(payoutBannerDismissKey(gymId)) === "1");
    } catch {
      setDismissed(false);
    }
  }, [gymId]);

  if (!stripeConfigured || onlinePaymentsEnabled || dismissed) {
    return null;
  }

  function dismiss() {
    try {
      localStorage.setItem(payoutBannerDismissKey(gymId), "1");
    } catch {
      // ignore storage errors
    }
    setDismissed(true);
  }

  return (
    <div
      className="rounded-2xl border border-amber-200 dark:border-amber-500/25 bg-amber-50 dark:bg-amber-500/10 p-4 md:p-5"
      role="status"
    >
      <div className="flex gap-4">
        <div
          className="shrink-0 w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-300"
          aria-hidden="true"
        >
          <Banknote className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 dark:text-white text-balance">
            Włącz wypłaty od klientów online
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 mt-1 text-pretty max-w-2xl">
            Bez konfiguracji konta bankowego klienci nie mogą kupować karnetów przez stronę. Sprzedaż
            na recepcji działa bez zmian.
          </p>
          <Link
            to="/owner/payouts"
            className={`inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-primary-700 dark:text-primary-300 hover:text-primary-800 dark:hover:text-primary-200 ${focusRingClassName} rounded-lg`}
          >
            Skonfiguruj wypłaty
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className={`shrink-0 p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-amber-100/80 dark:hover:bg-amber-500/20 transition-colors ${focusRingClassName}`}
          aria-label="Ukryj przypomnienie o wypłatach"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
