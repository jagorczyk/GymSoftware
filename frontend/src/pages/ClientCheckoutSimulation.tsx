import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../authContext";
import { useToast } from "../components/Toast";
import { getClientPassTypes, simulatePaymentOnline } from "../clientApi";
import { CreditCard, ShieldCheck, ArrowLeft, Loader2, Sparkles } from "lucide-react";

type PassType = {
  id: number;
  name: string;
  price: number;
  durationDays: number;
};

export function ClientCheckoutSimulation() {
  const { gymId } = useParams();
  const [searchParams] = useSearchParams();
  const passTypeId = Number(searchParams.get("passTypeId"));
  const { auth } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  const [passType, setPassType] = useState<PassType | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  // Form states (mocked fields for Stripe-like feel)
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("123");
  const [cardName, setCardName] = useState("Jan Kowalski");

  useEffect(() => {
    if (!auth || !gymId || !passTypeId) return;
    getClientPassTypes(auth, Number(gymId))
      .then((types) => {
        const found = types.find((t) => t.id === passTypeId);
        if (found) {
          setPassType(found);
        } else {
          showError("Nie znaleziono wybranego typu karnetu.");
        }
      })
      .catch((err) => showError(err.message))
      .finally(() => setLoading(false));
  }, [auth, gymId, passTypeId, showError]);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!auth || !gymId || !passTypeId) return;
    setPaying(true);
    try {
      await simulatePaymentOnline(auth, Number(gymId), { passTypeId });
      showSuccess("Płatność przebiegła pomyślnie! Karnet został aktywowany.");
      navigate(`/client/gyms/${gymId}/passes?success=true`);
    } catch (err: any) {
      showError(err.message || "Błąd podczas procesowania płatności");
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Wczytywanie podsumowania zamówienia...</p>
      </div>
    );
  }

  if (!passType) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-4">
        <p className="text-rose-500 font-bold text-lg">Błąd konfiguracji checkoutu</p>
        <button
          onClick={() => navigate(`/client/gyms/${gymId}/buy`)}
          className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold"
        >
          Powrót do sklepu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-200">
      {/* LEWA STRONA: Podsumowanie zamówienia */}
      <div className="flex-1 bg-white dark:bg-slate-900 p-8 md:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 transition-colors duration-200">
        <div>
          <button
            onClick={() => navigate(`/client/gyms/${gymId}/buy`)}
            className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold mb-12 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Wróć do wyboru karnetu
          </button>

          <div className="space-y-6">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
              <Sparkles className="w-4 h-4 fill-indigo-600" />
              <span>Symulator Płatności Stripe</span>
            </div>
            
            <div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Gymlos</p>
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mt-1">{passType.name}</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Dostęp na {passType.durationDays} dni we wskazanym klubie fitness.</p>
            </div>

            <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
              {passType.price.toFixed(2)} PLN
            </div>
          </div>
        </div>

        <div className="mt-12 space-y-4">
          <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <span>Bezpieczne połączenie testowe (Sandbox)</span>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed max-w-sm">
            Ten widok symuluje bramkę płatności Stripe Checkout. Dane karty nie są przesyłane do prawdziwego procesora płatności.
          </p>
        </div>
      </div>

      {/* PRAWA STRONA: Formularz płatności (Stripe UI) */}
      <div className="flex-1 p-8 md:p-16 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800 space-y-6 transition-colors duration-200">
          <h3 className="font-extrabold text-slate-950 dark:text-white text-xl tracking-tight">Dane płatności</h3>
          
          <form onSubmit={handlePay} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Adres e-mail</label>
              <input
                type="email"
                value={auth?.email || ""}
                disabled
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 font-medium text-sm cursor-not-allowed"
              />
            </div>

            <div className="space-y-1 relative">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Informacje o karcie</label>
              <div className="relative">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="Numer karty"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 dark:text-white font-medium text-sm"
                  required
                />
                <CreditCard className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <input
                  type="text"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  placeholder="MM / RR"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 dark:text-white font-medium text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <input
                  type="text"
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value)}
                  placeholder="CVC"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 dark:text-white font-medium text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Imię i nazwisko na karcie</label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Jan Kowalski"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700 dark:text-white font-medium text-sm"
                required
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={paying}
                className="w-full py-4 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {paying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Procesowanie płatności...
                  </>
                ) : (
                  `Zapłać ${passType.price.toFixed(2)} PLN`
                )}
              </button>
            </div>
          </form>

          <div className="text-center">
            <button
              onClick={() => navigate(`/client/gyms/${gymId}/buy?canceled=true`)}
              className="text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 transition-colors"
            >
              Anuluj i wróć do siłowni
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
