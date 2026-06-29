import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../authContext";
import { useToast } from "../components/Toast";
import { getClientPassTypes, purchasePassOnline } from "../clientApi";
import { ArrowLeft, ShieldCheck, CheckCircle2, Loader2 } from "lucide-react";
import { formatPassTypeValidity } from "../utils/passTypeLabels";
import { PageHeader } from "../components/PageHeader";
import { LoadingState } from "../components/LoadingState";
import { EmptyState } from "../components/EmptyState";
import {
  panelSurfaceClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
} from "../components/formStyles";

type PassTypeOption = {
  id: number;
  name: string;
  price: number;
  durationDays: number;
  maxEntries?: number | null;
};

export function ClientBuyPassPage() {
  const { gymId } = useParams();
  const { auth } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [passTypes, setPassTypes] = useState<PassTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  useEffect(() => {
    if (searchParams.get("canceled") === "true") {
      showError("Płatność została anulowana.");
      navigate(".", { replace: true });
    }
  }, [searchParams, navigate, showError]);

  useEffect(() => {
    if (!auth || !gymId) return;
    getClientPassTypes(auth, Number(gymId))
      .then((data) => setPassTypes(data))
      .catch((err) => showError(err instanceof Error ? err.message : "Błąd ładowania cennika"))
      .finally(() => setLoading(false));
  }, [auth, gymId, showError]);

  async function handleSelectPass(passTypeId: number) {
    if (!auth || !gymId) return;
    setIsProcessing(passTypeId);
    try {
      const response = await purchasePassOnline(auth, Number(gymId), { passTypeId });
      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      } else {
        showError("Błąd serwera: brak linku do płatności.");
        setIsProcessing(null);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Wystąpił błąd");
      setIsProcessing(null);
    }
  }

  if (loading) {
    return <LoadingState message="Ładowanie cennika..." />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Kup karnet online"
        subtitle="Wybierz karnet — płatność przejdzie przez bezpieczną bramkę Stripe."
        action={
          <Link
            to={gymId ? `/client/gyms/${gymId}/passes` : "/client/dashboard"}
            className={secondaryButtonClassName}
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Wróć
          </Link>
        }
      />

      {passTypes.length === 0 ? (
        <div className={panelSurfaceClassName}>
          <EmptyState
            title="Brak karnetów do kupienia online"
            description="Ta siłownia nie udostępnia jeszcze sprzedaży online. Skontaktuj się z recepcją."
            action={
              <Link to="/client/dashboard" className={secondaryButtonClassName}>
                Wróć do pulpitu
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {passTypes.map((pt) => (
            <article key={pt.id} className={`p-6 flex flex-col gap-6 ${panelSurfaceClassName}`}>
              <div className="flex-1 space-y-3">
                <h2 className="text-lg font-display font-bold text-slate-900 dark:text-white text-balance">
                  {pt.name}
                </h2>
                <p className="text-3xl font-display font-black text-slate-900 dark:text-white tabular-nums">
                  {new Intl.NumberFormat("pl-PL", {
                    style: "currency",
                    currency: "PLN",
                  }).format(pt.price)}
                </p>
                <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
                  {formatPassTypeValidity(pt)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSelectPass(pt.id)}
                disabled={isProcessing === pt.id}
                className={primaryButtonClassName}
                aria-busy={isProcessing === pt.id}
              >
                {isProcessing === pt.id ? (
                  <>
                    <Loader2 className="w-5 h-5 motion-safe:animate-spin" aria-hidden="true" />
                    Przekierowywanie…
                  </>
                ) : (
                  "Kup karnet"
                )}
              </button>
            </article>
          ))}
        </div>
      )}

      <p className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <ShieldCheck className="w-4 h-4 text-primary-500 shrink-0" aria-hidden="true" />
        Bezpieczne płatności obsługuje Stripe
      </p>
    </div>
  );
}
