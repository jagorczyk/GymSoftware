import { FormEvent, useState } from "react";
import { useAuth } from "../../authContext";
import { resetSaaSPlatformData } from "../../api";
import { AlertTriangle, Loader2 } from "lucide-react";

export function SuperAdminManagementPage() {
  const { auth } = useAuth();
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleReset(event: FormEvent) {
    event.preventDefault();
    if (!auth) return;
    if (confirmation !== "WYCZYSC") {
      setMessage('Wpisz dokładnie "WYCZYSC", aby potwierdzić operację.');
      return;
    }
    if (
      !confirm(
        "OSTATNIE OSTRZEŻENIE: Usuniesz wszystkie siłownie, użytkowników i dane biznesowe. Zostanie tylko konto super admina. Kontynuować?"
      )
    ) {
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await resetSaaSPlatformData(auth, confirmation);
      setConfirmation("");
      setMessage("Platforma została wyczyszczona. Pozostało tylko konto super admina.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Nie udało się wyczyścić platformy.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Zarządzanie</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Operacje serwisowe na całej platformie.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-900/40 overflow-hidden">
        <div className="p-6 border-b border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-bold text-red-800 dark:text-red-300">Wyczyść całą platformę</h2>
              <p className="mt-2 text-sm text-red-700/90 dark:text-red-200/90">
                Usuwa wszystkie siłownie, subskrypcje, pracowników, klientów i konta użytkowników
                (właścicieli, pracowników, gości). <strong>Nie usuwa</strong> kont super admina ani planów SaaS.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => void handleReset(e)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Wpisz <span className="font-mono text-red-600 dark:text-red-400">WYCZYSC</span>, aby potwierdzić
            </label>
            <input
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              disabled={submitting}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
              placeholder="WYCZYSC"
              autoComplete="off"
            />
          </div>

          {message && (
            <p className={`text-sm font-medium ${message.includes("wyczyszczona") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || confirmation !== "WYCZYSC"}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Czyszczenie...
              </>
            ) : (
              "Wyczyść wszystkie dane"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
