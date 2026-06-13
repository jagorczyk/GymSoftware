import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../authContext";
import { useToast } from "../components/Toast";
import { getClientDashboard, ClientDashboardView, freezePass, downloadInvoicePdf } from "../clientApi";
import { ArrowLeft, Ticket, CalendarDays, Zap, ShieldCheck, Download, Loader2 } from "lucide-react";

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

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Wczytywanie karnetów...</div>;
  if (!dashboard) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <Link to="/client/dashboard" className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Moje Karnety</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Cyfrowy portfel Twoich wejściówek</p>
          </div>
        </div>
        
        {dashboard.activePasses.length > 0 && (
          <Link
            to={`/client/gyms/${gymId}/buy`}
            className="hidden md:flex bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold px-6 py-3 rounded-2xl transition-all shadow-md items-center gap-2"
          >
            <Zap className="w-4 h-4 text-yellow-400" />
            Dokup karnet
          </Link>
        )}
      </div>

      {dashboard.activePasses.length === 0 ? (
        <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center shadow-lg shadow-slate-200/50">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-slate-100 dark:bg-slate-800 rounded-full blur-3xl opacity-50"></div>
          
          <div className="relative z-10 w-24 h-24 bg-slate-50 dark:bg-slate-950/40 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-100 dark:border-slate-800">
            <Ticket className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Brak aktywnych karnetów</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">Wygląda na to, że nie masz jeszcze żadnego ważnego karnetu w tym klubie. Zmień to już teraz!</p>
          <Link
            to={`/client/gyms/${gymId}/buy`}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary-500 text-white rounded-2xl font-bold transition-all hover:scale-105 hover:shadow-lg hover:shadow-primary-500/30 overflow-hidden"
          >
            <span className="relative z-10">Kup swój pierwszy karnet</span>
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {dashboard.activePasses.map((p, i) => (
            <div 
              key={p.id} 
              className="group relative rounded-3xl p-[2px] overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-500/20"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br opacity-80 group-hover:opacity-100 transition-opacity ${
                p.status === "ACTIVE" 
                  ? "from-violet-500 via-primary-500 to-blue-500"
                  : "from-blue-600 via-slate-700 to-slate-800"
              }`}></div>
              
              <div className="relative h-full bg-slate-900 rounded-[22px] p-8 overflow-hidden flex flex-col justify-between">
                {/* Ozdobniki tła */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full"></div>
                <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-primary-500/20 blur-2xl rounded-full"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                      <ShieldCheck className={`w-6 h-6 ${p.status === "ACTIVE" ? "text-emerald-400" : "text-blue-400"}`} />
                    </div>
                    <div className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg backdrop-blur-sm ${
                      p.status === "ACTIVE" 
                        ? "bg-emerald-400/10 border border-emerald-400/20 text-emerald-400"
                        : "bg-blue-400/10 border border-blue-400/20 text-blue-400"
                    }`}>
                      {p.status === "ACTIVE" ? "Aktywny" : "Zamrożony"}
                    </div>
                  </div>
                  
                  <h3 className="text-3xl font-extrabold text-white mb-2">{p.passType}</h3>
                  <div className="h-1 w-12 bg-gradient-to-r from-primary-400 to-violet-400 rounded-full mb-8"></div>
                </div>
                
                <div className="relative z-10 space-y-4 bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
                  <div className="flex items-center gap-3 text-slate-300">
                    <CalendarDays className="w-5 h-5 text-primary-400" />
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-0.5">Start</p>
                      <p className="font-medium text-white">{p.startDate}</p>
                    </div>
                  </div>
                  <div className="h-px bg-white/10 w-full"></div>
                  <div className="flex items-center gap-3 text-slate-300">
                    <CalendarDays className="w-5 h-5 text-violet-400" />
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-0.5">Koniec</p>
                      <p className="font-medium text-white">{p.endDate}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 relative z-10 flex flex-col gap-2">
                  {p.status === "ACTIVE" ? (
                    <button
                      onClick={() => openFreezeModal(p.id, p.endDate)}
                      className="w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold rounded-xl text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      Zamroź karnet
                    </button>
                  ) : (
                    <div className="w-full text-center py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 font-bold rounded-xl text-sm">
                      Karnet Zamrożony
                    </div>
                  )}

                  <button
                    onClick={() => handleDownloadInvoice(p.id)}
                    disabled={downloadingPassId === p.id}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
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
            </div>
          ))}
        </div>
      )}

      {/* MODAL ZAMRAŻANIA */}
      {freezeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Zamroź swój karnet</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Określ przedział czasowy zawieszenia członkostwa (maksymalnie 30 dni).</p>
            </div>

            <form onSubmit={handleFreezeSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Data rozpoczęcia</label>
                <input
                  type="date"
                  value={startDate}
                  min={new Date().toISOString().split("T")[0]}
                  max={maxEndDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-700 dark:text-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Data zakończenia</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  max={maxEndDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-slate-700 dark:text-white"
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setFreezeModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition-all"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={submittingFreeze}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
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
