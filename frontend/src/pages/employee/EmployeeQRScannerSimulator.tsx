import { useState } from "react";
import { QrCode, ShieldAlert, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import type { EmployeeContext } from "./types";
import { useToast } from "../../components/Toast";

export function EmployeeQRScannerSimulator({ ctx }: { ctx: EmployeeContext }) {
  const { auth, selectedGymId, refreshOverview } = ctx;
  const { showSuccess, showError } = useToast();

  const [tokenInput, setTokenInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    guestName?: string;
    guestId?: string;
  } | null>(null);

  if (!selectedGymId) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
        <p className="text-slate-500 dark:text-slate-400 font-medium">Wybierz siłownię z menu bocznego, aby uruchomić skaner.</p>
      </div>
    );
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(
        `http://localhost:8080/api/employee/gyms/${selectedGymId}/scan-checkin`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${auth.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: tokenInput.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Wystąpił błąd podczas autoryzacji tokenu QR");
      }

      setResult({
        success: true,
        message: "Zameldowano pomyślnie!",
        guestName: data.guestName,
        guestId: data.guestId,
      });
      showSuccess(`Pomyślnie zameldowano: ${data.guestName}`);
      setTokenInput("");
      refreshOverview();
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || "Błąd podczas walidacji tokenu QR",
      });
      showError(err.message || "Walidacja kodu QR zakończona niepowodzeniem");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Info */}
      <div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Skaner Wejścia QR</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
          Symulator optycznego skanera kodów QR przy bramkach wejściowych do klubu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Side: Viewfinder Simulator */}
        <div className="bg-slate-900 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl border border-slate-800 min-h-[400px]">
          {/* Laser beam scan lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(99,102,241,0.03)_50%,rgba(99,102,241,0.08)_50%)] bg-[length:100%_4px]"></div>
          
          <div className="w-full max-w-[280px] aspect-square border-2 border-indigo-500/20 rounded-3xl relative flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            {/* Viewfinder corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-2xl -translate-x-1 -translate-y-1"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-2xl translate-x-1 -translate-y-1"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-2xl -translate-x-1 translate-y-1"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-2xl translate-x-1 translate-y-1"></div>

            {/* Glowing vertical animated scanner line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-400 shadow-[0_0_15px_#818cf8] animate-[bounce_3s_infinite]"></div>

            <QrCode className="w-24 h-24 text-slate-700 opacity-60 animate-pulse" />
          </div>

          <div className="mt-8 text-center space-y-2 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping"></span>
              SKANER AKTYWNY
            </span>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              Skieruj kod QR wygenerowany na profilu klienta w stronę czytnika.
            </p>
          </div>
        </div>

        {/* Right Side: Control Panel & Status */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 transition-colors duration-200">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Wprowadź kod QR ręcznie</h3>
            
            <form onSubmit={handleScan} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Zaszyfrowany token QR (JWT)
                </label>
                <textarea
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Wklej token wygenerowany w profilu klienta..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 resize-none dark:text-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !tokenInput.trim()}
                className="w-full py-3 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Weryfikacja tokenu...
                  </>
                ) : (
                  <>
                    <span>Zatwierdź wejście</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Display */}
          {result && (
            <div
              className={`rounded-3xl p-6 border shadow-sm animate-fade-in flex items-start gap-4 ${
                result.success
                  ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-950 dark:text-emerald-300"
                  : "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-950 dark:text-rose-300"
              }`}
            >
              <div className="mt-1 shrink-0">
                {result.success ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-rose-500" />
                )}
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-lg leading-snug">
                  {result.success ? "Wejście Autoryzowane" : "Odmowa Wejścia"}
                </h4>
                <p className="text-sm opacity-85 leading-relaxed font-medium">{result.message}</p>
                {result.success && result.guestName && (
                  <div className="pt-3 border-t border-emerald-200/50 mt-3 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider opacity-60">Gość</p>
                    <p className="font-bold text-slate-900 dark:text-white">{result.guestName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">ID Klienta: {result.guestId}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-slate-100 dark:bg-slate-950/40 rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/80 transition-colors duration-200">
        <h4 className="font-bold text-slate-800 dark:text-slate-250 text-sm mb-2">Jak to przetestować?</h4>
        <ol className="list-decimal pl-5 text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
          <li>Zaloguj się jako klient (np. klient posiadający aktywny karnet w tym klubie).</li>
          <li>Kliknij przycisk <span className="font-bold">"Wygeneruj kod wejścia QR"</span> na pulpicie klienta.</li>
          <li>Skopiuj zaszyfrowany token z wyświetlonego okna modalnego.</li>
          <li>Wróć do tego panelu (skanera pracownika) i wklej token w powyższe pole, a następnie kliknij <span className="font-bold">"Zatwierdź wejście"</span>.</li>
        </ol>
      </div>
    </div>
  );
}
