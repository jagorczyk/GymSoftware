import { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../authContext";
import { useToast } from "../components/Toast";
import { getClientPassTypes, purchasePassOnline } from "../clientApi";
import { ArrowLeft, ShieldCheck, CheckCircle2, ShoppingCart, Loader2 } from "lucide-react";

export function ClientBuyPassPage() {
  const { gymId } = useParams();
  const { auth } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [passTypes, setPassTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  useEffect(() => {
    if (searchParams.get("canceled") === "true") {
      showError("Płatność została anulowana.");
      // Usuwamy parametr z url, żeby nie pokazywało się przy odświeżeniu
      navigate(".", { replace: true });
    }
  }, [searchParams, navigate, showError]);

  useEffect(() => {
    if (!auth || !gymId) return;
    getClientPassTypes(auth, Number(gymId))
      .then((data) => setPassTypes(data))
      .catch((err) => showError(err.message))
      .finally(() => setLoading(false));
  }, [auth, gymId, showError]);

  async function handleSelectPass(passTypeId: number) {
    if (!auth || !gymId) return;
    setIsProcessing(passTypeId);
    try {
      const response = await purchasePassOnline(auth, Number(gymId), { passTypeId });
      if (response.checkoutUrl) {
        if (response.checkoutUrl.startsWith("http://localhost:5173")) {
          const path = response.checkoutUrl.replace("http://localhost:5173", "");
          navigate(path);
        } else {
          window.location.href = response.checkoutUrl;
        }
      } else {
        showError("Błąd serwera: brak linku do płatności.");
        setIsProcessing(null);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Wystąpił błąd");
      setIsProcessing(null);
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Ładowanie cennika...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-12 relative animate-in fade-in zoom-in-95 duration-500">
      
      <div className="text-center space-y-4">
        <Link to="/client/dashboard" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Wróć do Panelu
        </Link>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">Wybierz swój karnet</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
          Zostaniesz bezpiecznie przekierowany do bramki Stripe, aby sfinalizować transakcję.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
        {passTypes.map((pt, i) => (
          <div
            key={pt.id}
            className="group relative bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-[0_2px_15px_-3px_rgba(6,81,237,0.1)] border-2 border-slate-100 dark:border-slate-800 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-indigo-500 flex flex-col"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{pt.name}</h3>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{pt.price}</span>
                <span className="text-xl font-bold text-slate-500 dark:text-slate-400">zł</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  Ważny przez {pt.durationDays} dni
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  Pełny dostęp do stref
                </li>
                <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  Wsparcie trenera dyżurnego
                </li>
              </ul>
            </div>
            
            <button
              onClick={() => handleSelectPass(pt.id)}
              disabled={isProcessing === pt.id}
              className="w-full bg-slate-900 dark:bg-slate-800 text-white font-bold py-4 px-6 rounded-2xl transition-all hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/40 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:bg-slate-900 dark:disabled:hover:bg-slate-800"
            >
              {isProcessing === pt.id ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Przekierowywanie...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Zapłać przez Stripe
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 text-slate-400 mt-8">
        <ShieldCheck className="w-5 h-5 text-indigo-400" />
        <span className="text-sm font-medium">Bezpieczne płatności obsługuje Stripe</span>
      </div>

    </div>
  );
}
