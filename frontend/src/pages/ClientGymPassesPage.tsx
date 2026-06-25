import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../authContext";
import { useToast } from "../components/Toast";
import { getClientDashboard, ClientDashboardView, freezePass, downloadInvoicePdf } from "../clientApi";
import { ArrowLeft, Ticket, CalendarDays, Zap, ShieldCheck, Download, Loader2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { inputClassName, labelClassName, primaryButtonClassName, secondaryButtonClassName } from "../components/formStyles";
import { formatPassRemaining } from "../utils/passTypeLabels";

export function ClientGymPassesPage() {
  const { gymId } = useParams();
  const { auth } = useAuth();
  const { showError, showSuccess } = useToast();
  const [dashboard, setDashboard] = useState<ClientDashboardView | null>(null);
  const [loading, setLoading] = useState(true);

  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [selectedPassId, setSelectedPassId] = useState<number | null>(null);
  const [maxEndDate, setMaxEndDate] = useState<string>("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [submittingFreeze, setSubmittingFreeze] = useState(false);
  const [downloadingPassId, setDownloadingPassId] = useState<number | null>(null);

  async function handleDownloadInvoice(passId: number) {
    if (!auth || !gymId) return;
    setDownloadingPassId(passId);
    try {
      const blob = await downloadInvoicePdf(auth, Number(gymId), passId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `rachunek-${passId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      showSuccess("Pobrano fakturę PDF!");
    } catch (err: any) {
      showError(err.message || "Błąd pobierania faktury");
    } finally {
      setDownloadingPassId(null);
    }
  }

  function refreshDashboard() {
    if (!auth || !gymId) return;
    getClientDashboard(auth, Number(gymId))
      .then((data) => setDashboard(data))
      .catch((err) => showError(err.message));
  }

  function openFreezeModal(passId: number, passEndDateStr: string) {
    setSelectedPassId(passId);
    setMaxEndDate(passEndDateStr);
    setStartDate(new Date().toISOString().split("T")[0]);
    
    const defaultEnd = new Date();
    defaultEnd.setDate(defaultEnd.getDate() + 7);
    const passEndDateObj = new Date(passEndDateStr);
    const endVal = defaultEnd > passEndDateObj ? passEndDateObj : defaultEnd;
    setEndDate(endVal.toISOString().split("T")[0]);
    setFreezeModalOpen(true);
  }

  async function handleFreezeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!auth || !gymId || selectedPassId === null) return;
    setSubmittingFreeze(true);
    try {
      await freezePass(auth, Number(gymId), selectedPassId, { startDate, endDate });
      showSuccess("Karnet został pomyślnie zamrożony!");
      setFreezeModalOpen(false);
      refreshDashboard();
    } catch (err: any) {
      showError(err.message || "Błąd podczas zamrażania");
    } finally {
      setSubmittingFreeze(false);
    }
  }

  useEffect(() => {
    if (!auth || !gymId) return;
    getClientDashboard(auth, Number(gymId))
      .then((data) => setDashboard(data))
      .catch((err) => showError(err.message))
      .finally(() => setLoading(false));
  }, [auth, gymId, showError]);

  if (loading) return <LoadingState message="Wczytywanie karnetów..." />;
  if (!dashboard) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader
        title="Moje karnety"
        subtitle="Cyfrowy portfel Twoich wejściówek"
        action={
          <div className="flex items-center gap-3">
            <Link to="/client/dashboard" className={secondaryButtonClassName}>
              <ArrowLeft className="w-4 h-4" />
              Wróć
            </Link>
            {dashboard.activePasses.length > 0 && (
              <Link to={`/client/gyms/${gymId}/buy`} className={primaryButtonClassName}>
                <Zap className="w-4 h-4" />
                Dokup karnet
              </Link>
            )}
          </div>
        }
      />

      {dashboard.activePasses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <EmptyState
            icon={<Ticket className="w-12 h-12 text-slate-400" />}
            title="Brak aktywnych karnetów"
            description="Nie masz jeszcze ważnego karnetu w tym klubie."
            action={
              <Link to={`/client/gyms/${gymId}/buy`} className={primaryButtonClassName}>
                Kup swój pierwszy karnet
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center sm:justify-items-stretch">
          {dashboard.activePasses.map((p) => (
            <div
              key={p.id}
              className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/40 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <span
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full ${
                    p.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                  }`}
                >
                  {p.status === "ACTIVE" ? "Aktywny" : "Zamrożony"}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{p.passType}</h3>
                {formatPassRemaining(p) && (
                  <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mt-1">
                    {formatPassRemaining(p)}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/30 p-4 space-y-3">
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <CalendarDays className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Start</p>
                    <p className="font-medium">{p.startDate}</p>
                  </div>
                </div>
                <div className="h-px bg-slate-200 dark:bg-slate-800" />
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                  <CalendarDays className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold">Koniec</p>
                    <p className="font-medium">{p.endDate}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                {p.status === "ACTIVE" && p.maxEntries == null ? (
                  <button
                    onClick={() => openFreezeModal(p.id, p.endDate)}
                    className={secondaryButtonClassName}
                  >
                    Zamroź karnet
                  </button>
                ) : (
                  <div className="w-full text-center py-3 border-2 border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/20 font-bold rounded-2xl text-sm">
                    Karnet zamrożony
                  </div>
                )}

                <button
                  onClick={() => handleDownloadInvoice(p.id)}
                  disabled={downloadingPassId === p.id}
                  className={primaryButtonClassName}
                >
                  {downloadingPassId === p.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Pobieranie...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Pobierz rachunek PDF
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {freezeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Zamroź karnet</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Ustaw okres zamrożenia (maksymalnie 30 dni).</p>
            </div>

            <form onSubmit={handleFreezeSubmit} className="space-y-4">
              <div>
                <label className={labelClassName}>Data rozpoczęcia</label>
                <input
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().split("T")[0]}
                  max={maxEndDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={inputClassName}
                  required
                />
              </div>

              <div>
                <label className={labelClassName}>Data zakończenia</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  max={maxEndDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClassName}
                  required
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setFreezeModalOpen(false)} className={`${secondaryButtonClassName} flex-1`}>
                  Anuluj
                </button>
                <button type="submit" disabled={submittingFreeze} className={`${primaryButtonClassName} flex-1`}>
                  {submittingFreeze ? "Zamrażanie..." : "Potwierdź"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
