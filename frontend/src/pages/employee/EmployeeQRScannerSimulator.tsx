import { useState } from "react";
import { QrCode, ShieldAlert, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import type { EmployeeContext } from "./types";
import { useToast } from "../../components/Toast";
import {
  focusRingClassName,
  inputClassName,
  labelClassName,
  panelSurfaceClassName,
  primaryButtonClassName,
} from "../../components/formStyles";
import { PageHeader } from "../../components/PageHeader";

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
      <div className={`text-center py-12 ${panelSurfaceClassName}`}>
        <p className="text-slate-600 dark:text-slate-400 font-medium">
          Wybierz siłownię z menu bocznego, aby uruchomić skaner.
        </p>
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
        `/api/employee/gyms/${selectedGymId}/scan-checkin`,
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
      <PageHeader
        title="Skaner wejścia (dev)"
        subtitle="Narzędzie testowe tokenów QR. W produkcji check-in wykonuje recepcja po wyszukaniu gościa."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className={`p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px] bg-slate-900 dark:bg-slate-950 ${panelSurfaceClassName}`}>
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(99,102,241,0.03)_50%,rgba(99,102,241,0.08)_50%)] bg-[length:100%_4px]" />

          <div className="w-full max-w-[280px] aspect-square border-2 border-indigo-500/25 rounded-2xl relative flex items-center justify-center p-4 bg-slate-950/60">
            <div className="absolute inset-2 rounded-xl border border-indigo-400/40" />
            <div className="absolute left-0 right-0 h-0.5 bg-indigo-400/90 shadow-[0_0_12px_rgba(129,140,248,0.75)] motion-safe:animate-pulse" />
            <QrCode className="w-24 h-24 text-slate-600 opacity-70" />
          </div>

          <div className="mt-8 text-center space-y-2 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 motion-safe:animate-pulse" />
              SKANER AKTYWNY
            </span>
            <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
              Skieruj kod QR z aplikacji mobilnej (przyszła funkcja) w stronę czytnika — lub wklej token testowy poniżej.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`p-6 space-y-4 ${panelSurfaceClassName}`}>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Wprowadź kod QR ręcznie</h3>

            <form onSubmit={handleScan} className="space-y-4">
              <div className="space-y-1.5">
                <label className={labelClassName}>Zaszyfrowany token QR (JWT)</label>
                <textarea
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Wklej token wygenerowany w profilu klienta..."
                  rows={4}
                  className={`${inputClassName} text-xs font-mono resize-none`}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !tokenInput.trim()}
                className={`w-full ${primaryButtonClassName}`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 motion-safe:animate-spin" />
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
              className={`rounded-2xl p-6 border shadow-sm flex items-start gap-4 ${
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
                <h4 className="font-bold text-lg leading-snug">
                  {result.success ? "Wejście Autoryzowane" : "Odmowa Wejścia"}
                </h4>
                <p className="text-sm opacity-85 leading-relaxed font-medium">{result.message}</p>
                {result.success && result.guestName && (
                  <div className="pt-3 border-t border-emerald-200/50 mt-3 space-y-1">
                    <p className="text-xs font-semibold opacity-70">Gość</p>
                    <p className="font-bold text-slate-900 dark:text-white">{result.guestName}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">ID Klienta: {result.guestId}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`p-6 ${panelSurfaceClassName}`}>
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-2">Test integracji QR (opcjonalnie)</h4>
        <ol className="list-decimal pl-5 text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
          <li>Endpoint <span className="font-mono">GET /api/client/checkin-qr-token</span> nadal istnieje pod przyszłą aplikację mobilną.</li>
          <li>Panel klienta w przeglądarce nie pokazuje QR — wejście odbywa się przez recepcję.</li>
          <li>Do testów: pobierz token JWT check-in (np. Postman) i wklej poniżej, potem kliknij <span className="font-bold">„Zatwierdź wejście”</span>.</li>
        </ol>
      </div>
    </div>
  );
}
