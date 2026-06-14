import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../authContext";
import { useToast } from "../components/Toast";
import { getClientGyms, getCheckInQrToken, ClientGymView } from "../clientApi";
import {
  Store,
  ShoppingBag,
  CreditCard,
  Ticket,
  Activity,
  Plus,
  TrendingUp,
  Calendar,
  ChevronRight,
  QrCode,
  X,
  RefreshCw,
  Copy,
  CheckCircle2,
  UserCircle,
} from "lucide-react";

export function ClientDashboard() {
  const { auth } = useAuth();
  const { showError, showSuccess } = useToast();
  const [gyms, setGyms] = useState<ClientGymView[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({ activePasses: 0, workoutsThisMonth: 0 });

  // QR Modal states
  const [selectedGymForQr, setSelectedGymForQr] = useState<{ id: number; name: string } | null>(null);
  const [qrToken, setQrToken] = useState("");
  const [loadingQr, setLoadingQr] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [showRawToken, setShowRawToken] = useState(false);
  const [copied, setCopied] = useState(false);

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!auth) return;
    
    Promise.all([
      getClientGyms(auth),
      fetch("http://localhost:8080/api/client/dashboard/global-stats", {
        headers: { Authorization: `Bearer ${auth.token}` }
      }).then(r => r.json())
    ])
    .then(([gymData, statsData]) => {
      setGyms(gymData);
      if (statsData) setGlobalStats(statsData);
    })
    .catch((err) => showError(err.message || "Błąd ładowania danych"))
    .finally(() => setLoading(false));
  }, [auth, showError]);

  // Handle QR code generation & refresh
  async function fetchQrToken() {
    if (!auth || !selectedGymForQr) return;
    setLoadingQr(true);
    try {
      const data = await getCheckInQrToken(auth);
      setQrToken(data.qrToken);
      setCountdown(45);
      setCopied(false);
    } catch (err: any) {
      showError(err.message || "Błąd podczas generowania kodu QR wejścia");
      setSelectedGymForQr(null);
    } finally {
      setLoadingQr(false);
    }
  }

  // Triggered when user opens the modal
  useEffect(() => {
    if (selectedGymForQr) {
      fetchQrToken();
    } else {
      setQrToken("");
      setCountdown(45);
      setShowRawToken(false);
      setCopied(false);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [selectedGymForQr]);

  // Countdown timer for auto-refresh
  useEffect(() => {
    if (!selectedGymForQr || !qrToken) return;

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Token expired, refresh it
          fetchQrToken();
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [qrToken, selectedGymForQr]);

  function handleCopyToken() {
    if (!qrToken) return;
    navigator.clipboard.writeText(qrToken);
    setCopied(true);
    showSuccess("Skopiowano token do schowka.");
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-500 font-medium tracking-wide">Ładowanie Twojego profilu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-tech-slide-up">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Cześć, Użytkowniku! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium text-sm">
            Oto podsumowanie Twojej aktywności i szybki dostęp do karnetów.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/client/gyms/join"
            className="hidden md:flex items-center gap-2 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-display font-bold text-xs px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 transition-all shadow-sm"
          >
            <Store className="w-4 h-4 text-primary-500" />
            Szukaj klubu
          </Link>
          <Link
            to="/client/gyms/join"
            className="flex items-center gap-2 bg-slate-900 dark:bg-primary-500 dark:text-slate-950 hover:bg-slate-850 dark:hover:bg-primary-400 text-white font-display font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md hover:shadow-primary-500/20"
          >
            <Plus className="w-4 h-4" />
            Dołącz do klubu
          </Link>
        </div>
      </div>

      {/* BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* QUICK ACTIONS WIDGET */}
        <div className="md:col-span-4 glass-panel rounded-3xl p-6 shadow-xl flex flex-col bg-cyber-grid-light dark:bg-cyber-grid">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-extrabold text-slate-900 dark:text-white text-lg tracking-tight uppercase">
                Szybkie Akcje
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Co chcesz teraz zrobić?</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100/60 dark:bg-slate-950/40 flex items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
              <span className="leading-none pb-2 font-bold">...</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1">
            <Link
              to="/client/gyms/join"
              className="group bg-slate-50/50 dark:bg-slate-950/40 hover:bg-primary-500/10 dark:hover:bg-primary-500/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all border border-transparent hover:border-primary-500/20 dark:hover:border-primary-500/10"
            >
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform border border-slate-100 dark:border-slate-800">
                <Store className="w-5 h-5 text-primary-500" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-primary-600 dark:group-hover:text-primary-400">Znajdź klub</span>
            </Link>

            <Link
              to={gyms.length > 0 ? `/client/gyms/${gyms[0].id}/passes` : "/client/gyms/join"}
              className="group bg-slate-50/50 dark:bg-slate-950/40 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all border border-transparent hover:border-emerald-500/20 dark:hover:border-emerald-500/10"
            >
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform border border-slate-100 dark:border-slate-800">
                <Ticket className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">Karnety</span>
            </Link>

            <Link
              to="/client/classes"
              className="group bg-slate-50/50 dark:bg-slate-950/40 hover:bg-orange-500/10 dark:hover:bg-orange-500/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all border border-transparent hover:border-orange-500/20 dark:hover:border-orange-500/10"
            >
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform border border-slate-100 dark:border-slate-800">
                <Calendar className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-orange-600 dark:group-hover:text-orange-400">Harmonogram</span>
            </Link>

            <Link
              to="/client/trainers"
              className="group bg-slate-50/50 dark:bg-slate-950/40 hover:bg-rose-500/10 dark:hover:bg-rose-500/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all border border-transparent hover:border-rose-500/20 dark:hover:border-rose-500/10 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform border border-slate-100 dark:border-slate-800">
                <UserCircle className="w-5 h-5 text-rose-500" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-rose-600 dark:group-hover:text-rose-400">Trenerzy</span>
            </Link>
          </div>
        </div>

        {/* STATS WIDGETS */}
        <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel rounded-3xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden bg-cyber-grid-light dark:bg-cyber-grid">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-extrabold text-slate-900 dark:text-white text-lg tracking-tight uppercase">
                Aktywne Karnety
              </h3>
              <div className="w-8 h-8 rounded-full bg-slate-100/60 dark:bg-slate-950/40 flex items-center justify-center text-slate-400 hover:text-slate-650 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-end justify-between z-10">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="w-4 h-4 text-primary-500" />
                  <span className="text-xs font-bold text-primary-600 dark:text-primary-400">Teraz</span>
                </div>
                <div className="text-6xl font-display font-black text-slate-900 dark:text-white tracking-tighter">{globalStats.activePasses}</div>
              </div>
              <div className="w-24 h-12 bg-primary-500/10 rounded-full flex items-center justify-center relative overflow-hidden border border-primary-500/20">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-0.5 bg-primary-500/40"></div>
                <div className="w-3 h-3 bg-primary-500 rounded-full z-10 shadow-sm animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden bg-cyber-grid-light dark:bg-cyber-grid">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary-500/5 rounded-full opacity-50 pointer-events-none"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="font-display font-extrabold text-slate-900 dark:text-white text-lg tracking-tight uppercase">
                Treningi w tym msc
              </h3>
            </div>
            <div className="flex items-end justify-between relative z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Zalecane: min. 10</span>
                </div>
                <div className="text-6xl font-display font-black text-slate-900 dark:text-white tracking-tighter">{globalStats.workoutsThisMonth}</div>
              </div>
              <div className="relative w-16 h-16">
                <svg viewBox="0 0 36 36" className="w-16 h-16 transform -rotate-90">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3.5" className="stroke-slate-200 dark:stroke-slate-800" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#8ee300" strokeWidth="3.5" strokeDasharray="66, 100" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(142,227,0,0.4)]" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-display font-extrabold text-slate-900 dark:text-slate-100">66%</div>
              </div>
            </div>
          </div>
        </div>

        {/* CLUBS LIST WIDGET */}
        <div className="md:col-span-12 glass-panel rounded-3xl p-6 shadow-xl bg-cyber-grid-light dark:bg-cyber-grid">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-extrabold text-slate-900 dark:text-white text-lg tracking-tight uppercase">
                Twoje Kluby Fitness
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Miejsca, do których masz lub miałeś dostęp.</p>
            </div>
          </div>

          {gyms.length === 0 ? (
            <div className="bg-slate-50/50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800/80 rounded-2xl p-8 text-center">
              <Store className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-4">Nie należysz jeszcze do żadnej siłowni.</p>
              <Link to="/client/gyms/join" className="text-primary-500 dark:text-primary-400 font-bold hover:underline text-sm">Przeglądaj kluby</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {gyms.map((gym) => (
                <div
                  key={gym.id}
                  className="bg-white/60 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800/50 hover:border-primary-500/40 dark:hover:border-primary-500/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-500/10 text-primary-500 dark:text-primary-400 flex items-center justify-center shrink-0 border border-primary-500/20">
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-slate-900 dark:text-white line-clamp-1">{gym.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{gym.address}</p>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-2 pt-4 border-t border-slate-200/50 dark:border-slate-800/40">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to={`/client/gyms/${gym.id}/passes`}
                        className="text-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-200/50 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-display font-bold py-2 rounded-lg transition-colors"
                      >
                        Karnety
                      </Link>
                      <Link
                        to={`/client/gyms/${gym.id}/buy`}
                        className="text-center bg-primary-500/10 hover:bg-primary-500/25 dark:bg-primary-500/10 dark:hover:bg-primary-500/15 text-slate-950 dark:text-primary-400 border border-primary-500/20 text-xs font-display font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Kup
                      </Link>
                    </div>

                    <button
                      onClick={() => setSelectedGymForQr({ id: gym.id, name: gym.name })}
                      className="w-full text-center bg-slate-900 dark:bg-primary-500 hover:bg-slate-800 dark:hover:bg-primary-400 text-white dark:text-slate-950 text-xs font-display font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer border border-transparent dark:border-primary-500/10"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Wejście QR (Karta Klubowa)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR MODAL - DIGITAL TECH TICKET */}
      {selectedGymForQr && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Cyberpunk styled digital ticket - light pass / tech dark modal */}
          <div className="bg-white dark:bg-slate-900 border border-primary-500/30 dark:border-primary-500/20 rounded-3xl max-w-xs w-full shadow-2xl overflow-hidden transform scale-100 transition-all text-center space-y-5 bg-cyber-grid-light dark:bg-cyber-grid relative shadow-[0_0_50px_rgba(33,85,229,0.15)] glow-box-blue">
            
            {/* Ticket Notches Left & Right */}
            <div className="absolute top-1/3 -left-3.5 w-7 h-7 bg-slate-50 dark:bg-slate-950 rounded-full border border-slate-50 dark:border-slate-950 z-20"></div>
            <div className="absolute top-1/3 -right-3.5 w-7 h-7 bg-slate-50 dark:bg-slate-950 rounded-full border border-slate-50 dark:border-slate-950 z-20"></div>
            
            <div className="p-5 pb-0 flex items-center justify-between relative z-10">
              <span className="text-[10px] font-display font-black bg-primary-500/10 text-primary-600 dark:text-primary-400 px-3 py-1 rounded-full border border-primary-500/20 tracking-wider">
                MEMBERSHIP PASS
              </span>
              <button
                onClick={() => setSelectedGymForQr(null)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-450 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 px-5 relative z-10">
              <h3 className="font-display font-black text-slate-900 dark:text-white text-xl tracking-tight uppercase">
                Cyfrowy Bilet
              </h3>
              <p className="text-primary-650 dark:text-primary-400 font-display font-bold text-xs uppercase tracking-wider">{selectedGymForQr.name}</p>
            </div>

            {/* Separator line for the ticket stub */}
            <div className="border-t border-dashed border-slate-200 dark:border-slate-800 mx-5 relative z-10"></div>

            {/* QR Viewfinder Container */}
            <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 mx-5 relative z-10">
              {loadingQr ? (
                <div className="w-[160px] h-[160px] flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Generowanie...</p>
                </div>
              ) : qrToken ? (
                <>
                  {/* Glowing frame corner decorations */}
                  <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-primary-500"></div>
                  <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-primary-500"></div>
                  <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-primary-500"></div>
                  <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-primary-500"></div>

                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrToken)}`}
                    alt="QR Code wejścia"
                    className="w-[160px] h-[160px] object-contain rounded-lg bg-white shadow-lg border border-slate-200 dark:border-slate-800 p-2"
                  />
                  <div className="mt-4 w-full bg-slate-200 dark:bg-slate-850 h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-primary-500 h-full transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(33,85,229,0.6)]"
                      style={{ width: `${(countdown / 45) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-display font-bold text-slate-500 mt-2">
                    <span>Odświeżenie za: </span>
                    <span className="text-primary-650 dark:text-primary-400 font-black">{countdown}s</span>
                  </div>
                </>
              ) : (
                <div className="w-[160px] h-[160px] flex items-center justify-center text-xs text-rose-500 font-semibold">
                  Błąd ładowania kodu.
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 p-5 pt-0 relative z-10">
              <button
                onClick={fetchQrToken}
                disabled={loadingQr}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/60 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-350 font-display font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-xs disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loadingQr ? "animate-spin" : ""}`} />
                Odśwież kod teraz
              </button>

              <button
                onClick={() => setShowRawToken(!showRawToken)}
                className="text-[10px] font-display font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline pt-1 cursor-pointer"
              >
                {showRawToken ? "Ukryj klucz testowy" : "Pokaż klucz testowy (do symulacji)"}
              </button>
            </div>

            {/* Collapsible raw token for simulation ease */}
            {showRawToken && qrToken && (
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-b-3xl border-t border-slate-200 dark:border-slate-800 text-left space-y-2 animate-tech-slide-up relative z-10 mx-0">
                <p className="text-[9px] font-display font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Klucz sesji do wklejenia w recepcji:
                </p>
                <div className="relative">
                  <textarea
                    readOnly
                    value={qrToken}
                    rows={2}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[9px] font-mono select-all focus:outline-none resize-none pr-8 text-slate-700 dark:text-slate-300"
                  />
                  <button
                    onClick={handleCopyToken}
                    className="absolute right-2 top-2 p-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-all cursor-pointer"
                    title="Skopiuj token"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-3 h-3 text-primary-650 dark:text-primary-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                <p className="text-[8px] text-slate-400 dark:text-slate-500 leading-normal">
                  Skopiuj klucz i wklej go do symulatora skanera QR w recepcji, aby zasymulować przejście przez bramkę.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
