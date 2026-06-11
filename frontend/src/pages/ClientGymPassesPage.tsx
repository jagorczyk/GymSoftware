import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../authContext";
import { useToast } from "../components/Toast";
import { getClientDashboard, ClientDashboardView } from "../clientApi";
import { ArrowLeft, Ticket, CalendarDays, Zap, ShieldCheck } from "lucide-react";

export function ClientGymPassesPage() {
  const { gymId } = useParams();
  const { auth } = useAuth();
  const { showError } = useToast();
  const [dashboard, setDashboard] = useState<ClientDashboardView | null>(null);
  const [loading, setLoading] = useState(true);

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
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <Link to="/client/dashboard" className="p-3 bg-slate-50 border border-slate-200 rounded-2xl hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Moje Karnety</h1>
            <p className="text-slate-500 font-medium">Cyfrowy portfel Twoich wejściówek</p>
          </div>
        </div>
        
        {dashboard.activePasses.length > 0 && (
          <Link
            to={`/client/gyms/${gymId}/buy`}
            className="hidden md:flex bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-3 rounded-2xl transition-all shadow-md items-center gap-2"
          >
            <Zap className="w-4 h-4 text-yellow-400" />
            Dokup karnet
          </Link>
        )}
      </div>

      {dashboard.activePasses.length === 0 ? (
        <div className="relative overflow-hidden bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center shadow-lg shadow-slate-200/50">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-slate-100 rounded-full blur-3xl opacity-50"></div>
          
          <div className="relative z-10 w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-100">
            <Ticket className="w-12 h-12 text-slate-300" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Brak aktywnych karnetów</h2>
          <p className="text-slate-500 mb-8 max-w-md">Wygląda na to, że nie masz jeszcze żadnego ważnego karnetu w tym klubie. Zmień to już teraz!</p>
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
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-primary-500 to-blue-500 opacity-80 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="relative h-full bg-slate-900 rounded-[22px] p-8 overflow-hidden flex flex-col justify-between">
                {/* Ozdobniki tła */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full"></div>
                <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-primary-500/20 blur-2xl rounded-full"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div className="px-3 py-1 bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-lg backdrop-blur-sm">
                      {p.status}
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
