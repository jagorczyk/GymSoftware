import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../authContext";
import { useToast } from "../components/Toast";
import { getClientGyms, ClientGymView } from "../clientApi";
import { Store, ShoppingBag, CreditCard, Ticket, Activity, Plus, TrendingUp, Calendar, ChevronRight } from "lucide-react";

export function ClientDashboard() {
  const { auth } = useAuth();
  const { showError } = useToast();
  const [gyms, setGyms] = useState<ClientGymView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;
    getClientGyms(auth)
      .then((data) => setGyms(data))
      .catch((err) => showError(err.message))
      .finally(() => setLoading(false));
  }, [auth, showError]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Activity className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-slate-500 font-medium tracking-wide">Ładowanie Twojego profilu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Cześć, Użytkowniku! 👋</h1>
          <p className="text-slate-500 mt-1">Oto podsumowanie Twojej aktywności i szybki dostęp do karnetów.</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/client/gyms/join"
            className="hidden md:flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2.5 rounded-2xl border border-slate-200 transition-all shadow-sm"
          >
            <Store className="w-4 h-4 text-indigo-500" />
            Szukaj klubu
          </Link>
          <Link
            to="/client/gyms/join"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-2xl transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-5 h-5" />
            Dołącz do klubu
          </Link>
        </div>
      </div>

      {/* BENTO GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* QUICK ACTIONS WIDGET */}
        <div className="md:col-span-4 bg-white rounded-3xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-lg tracking-tight">Szybkie Akcje</h3>
              <p className="text-sm text-slate-500">Co chcesz teraz zrobić?</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-100">
              <span className="leading-none pb-2 font-bold">...</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 flex-1">
            <Link to="/client/gyms/join" className="group bg-slate-50 hover:bg-indigo-50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-colors border border-transparent hover:border-indigo-100">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Store className="w-5 h-5 text-indigo-500" />
              </div>
              <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700">Znajdź klub</span>
            </Link>
            
            <div className="group bg-slate-50 hover:bg-emerald-50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-colors border border-transparent hover:border-emerald-100 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Ticket className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700">Karnety</span>
            </div>
            
            <div className="group bg-slate-50 hover:bg-orange-50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-colors border border-transparent hover:border-orange-100 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5 text-orange-500" />
              </div>
              <span className="text-sm font-semibold text-slate-700 group-hover:text-orange-700">Harmonogram</span>
            </div>

            <div className="group bg-slate-50 hover:bg-rose-50 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-colors border border-transparent hover:border-rose-100 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <CreditCard className="w-5 h-5 text-rose-500" />
              </div>
              <span className="text-sm font-semibold text-slate-700 group-hover:text-rose-700">Płatności</span>
            </div>
          </div>
        </div>

        {/* STATS WIDGETS */}
        <div className="md:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-lg tracking-tight">Aktywne Karnety</h3>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-emerald-600">+1 od zeszłego msc</span>
                </div>
                <div className="text-5xl font-black text-slate-900 tracking-tighter">1</div>
              </div>
              <div className="w-24 h-12 bg-emerald-50 rounded-full flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-emerald-500 opacity-20 rounded-full"></div>
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-0.5 bg-emerald-500"></div>
                 <div className="w-3 h-3 bg-emerald-500 rounded-full z-10 shadow-sm"></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-50 rounded-full opacity-50"></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h3 className="font-bold text-slate-900 text-lg tracking-tight">Treningi w tym msc</h3>
            </div>
            <div className="flex items-end justify-between relative z-10">
              <div>
                 <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-500">Zalecane: 12</span>
                </div>
                <div className="text-5xl font-black text-slate-900 tracking-tighter">8</div>
              </div>
              <div className="relative w-16 h-16">
                 <svg viewBox="0 0 36 36" className="w-16 h-16 transform -rotate-90">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray="66, 100" />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-indigo-600">66%</div>
              </div>
            </div>
          </div>
        </div>

        {/* CLUBS LIST WIDGET */}
        <div className="md:col-span-12 bg-white rounded-3xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-lg tracking-tight">Twoje Kluby Fitness</h3>
              <p className="text-sm text-slate-500">Miejsca, do których masz lub miałeś dostęp.</p>
            </div>
          </div>

          {gyms.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center">
              <Store className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium mb-4">Nie należysz jeszcze do żadnej siłowni.</p>
              <Link to="/client/gyms/join" className="text-indigo-600 font-bold hover:underline">Przeglądaj kluby</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {gyms.map((gym) => (
                <div key={gym.id} className="bg-white border border-slate-100 hover:border-indigo-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 line-clamp-1">{gym.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{gym.address}</p>
                    </div>
                  </div>
                  
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-slate-50">
                    <Link
                      to={`/client/gyms/${gym.id}/passes`}
                      className="text-center bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-semibold py-2 rounded-xl transition-colors"
                    >
                      Karnety
                    </Link>
                    <Link
                      to={`/client/gyms/${gym.id}/buy`}
                      className="text-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Kup
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
