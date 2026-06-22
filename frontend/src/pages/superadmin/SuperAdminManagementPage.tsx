import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../../authContext";
import { getSaaSHealth, getSuperAdminAuditLogs, resetSaaSPlatformData, type SaaSHealthView, type SuperAdminAuditLog } from "../../api";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { LoadingState } from "../../components/LoadingState";

function statusClass(ok: boolean) {
  return ok ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
}

export function SuperAdminManagementPage() {
  const { auth } = useAuth();
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [health, setHealth] = useState<SaaSHealthView | null>(null);
  const [auditLogs, setAuditLogs] = useState<SuperAdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadOperationalData() {
    if (!auth) return;
    setLoading(true);
    try {
      const [healthData, logs] = await Promise.all([getSaaSHealth(auth), getSuperAdminAuditLogs(auth)]);
      setHealth(healthData);
      setAuditLogs(logs);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Nie udało się pobrać danych operacyjnych.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOperationalData();
  }, [auth]);

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
      await loadOperationalData();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Nie udało się wyczyścić platformy.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && !health) return <LoadingState message="Ładowanie panelu zarządzania..." />;

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Zarządzanie</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Status systemu, log operacji i operacje serwisowe.</p>
        </div>
        <button
          onClick={() => void loadOperationalData()}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
          Odśwież
        </button>
      </div>

      {health && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Status systemu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
              <p className="font-semibold text-gray-900 dark:text-white">Baza danych</p>
              <p className={`mt-1 ${statusClass(health.databaseOk)}`}>{health.databaseMessage}</p>
            </div>
            <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
              <p className="font-semibold text-gray-900 dark:text-white">SMTP</p>
              <p className={`mt-1 ${statusClass(health.smtpConfigured)}`}>{health.smtpMessage}</p>
            </div>
            <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
              <p className="font-semibold text-gray-900 dark:text-white">Stripe</p>
              <p className={`mt-1 ${statusClass(health.stripeConfigured && health.stripeReachable)}`}>{health.stripeMessage}</p>
            </div>
            <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-4">
              <p className="font-semibold text-gray-900 dark:text-white">Webhook Stripe</p>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {health.stripeWebhook.lastReceivedAt
                  ? `Ostatnio: ${new Date(health.stripeWebhook.lastReceivedAt).toLocaleString("pl-PL")} (${health.stripeWebhook.lastEventType ?? health.stripeWebhook.status})`
                  : "Brak zarejestrowanych webhooków"}
              </p>
            </div>
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white mb-2">Crony / zadania</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100 dark:border-gray-700">
                    <th className="py-2 pr-4">Zadanie</th>
                    <th className="py-2 pr-4">Ostatnie uruchomienie</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Szczegóły</th>
                  </tr>
                </thead>
                <tbody>
                  {health.scheduledJobs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-gray-500">Brak danych o zadaniach — uruchomią się po pierwszym cyklu.</td>
                    </tr>
                  ) : (
                    health.scheduledJobs.map((job) => (
                      <tr key={job.jobName} className="border-b border-gray-50 dark:border-gray-800">
                        <td className="py-2 pr-4 font-medium">{job.jobName}</td>
                        <td className="py-2 pr-4">{job.lastRunAt ? new Date(job.lastRunAt).toLocaleString("pl-PL") : "—"}</td>
                        <td className={`py-2 pr-4 ${job.status === "SUCCESS" ? "text-emerald-600" : "text-red-600"}`}>{job.status}</td>
                        <td className="py-2 text-gray-500">{job.message ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Log operacji super admina</h2>
        </div>
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-900/80">
              <tr className="text-gray-500">
                <th className="p-3">Czas</th>
                <th className="p-3">Kto</th>
                <th className="p-3">Akcja</th>
                <th className="p-3">Cel</th>
                <th className="p-3">Szczegóły</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">Brak wpisów w logu.</td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="p-3 whitespace-nowrap">{new Date(log.createdAt).toLocaleString("pl-PL")}</td>
                    <td className="p-3">{log.actorEmail}</td>
                    <td className="p-3 font-medium">{log.action}</td>
                    <td className="p-3">{log.targetType ? `${log.targetType}${log.targetId ? ` #${log.targetId}` : ""}` : "—"}</td>
                    <td className="p-3 text-gray-500 max-w-xs truncate" title={log.details ?? undefined}>{log.details ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
