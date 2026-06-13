import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../authContext";
import { useToast } from "../components/Toast";
import { getAllGymsForClient, joinGym, ClientGymView } from "../clientApi";
import { ArrowLeft, MapPin, Sparkles, User, Phone, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export function ClientGymJoinPage() {
  const { auth } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const [gyms, setGyms] = useState<ClientGymView[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedGymId, setSelectedGymId] = useState<number | "">("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!auth) return;
    getAllGymsForClient(auth)
      .then((data) => setGyms(data))
      .catch((err) => showError(err.message))
      .finally(() => setLoading(false));
  }, [auth, showError]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!auth || selectedGymId === "") return;

    setIsSubmitting(true);
    try {
      await joinGym(auth, {
        gymId: Number(selectedGymId),
        firstName,
        lastName,
        phone,
      });
      showSuccess("Pomyślnie dołączono do siłowni!");
      navigate("/client/dashboard");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd");
      setIsSubmitting(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Ładowanie formularza...</div>;

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/client/dashboard" className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dołącz do Klubu</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Rozpocznij swoją treningową przygodę już dziś.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 dark:border-slate-800">
        
        {/* Lewa strona - Informacyjna / Graficzna */}
        <div className="lg:col-span-2 relative bg-slate-900 p-10 text-white overflow-hidden flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/50 to-primary-800/80 mix-blend-overlay"></div>
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
          
          <div className="relative z-10 mb-12">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/20">
              <Sparkles className="w-7 h-7 text-yellow-300" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Twój Krok do Formy</h2>
            <p className="text-slate-300 text-lg">
              Połącz swoje konto z wybranym klubem fitness, aby kupować karnety, rezerwować wejścia i śledzić postępy.
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="font-medium text-slate-200">Szybki i bezproblemowy zapis online</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="font-medium text-slate-200">Pełen dostęp do wirtualnego portfela karnetów</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="font-medium text-slate-200">Szybkie płatności za usługi</p>
            </div>
          </div>
        </div>

        {/* Prawa strona - Formularz */}
        <div className="lg:col-span-3 p-8 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider block">Wybierz siłownię</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <select
                  value={selectedGymId}
                  onChange={(e) => setSelectedGymId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-slate-700 dark:text-slate-300 appearance-none"
                  required
                >
                  <option value="" disabled>-- Wybierz z listy --</option>
                  {gyms.map((g) => (
                    <option key={g.id} value={g.id}>{g.name} ({g.address})</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                  ▼
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider block">Imię</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="np. Jan"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider block">Nazwisko</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="np. Kowalski"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider block">Numer telefonu <span className="text-slate-400 dark:text-slate-500 font-normal lowercase">(opcjonalnie)</span></label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+48 000 000 000"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full relative group overflow-hidden bg-slate-900 text-white font-bold text-lg py-4 px-6 rounded-2xl transition-all shadow-xl shadow-slate-900/20 hover:shadow-slate-900/40 hover:-translate-y-1 outline-none disabled:opacity-70 disabled:hover:translate-y-0"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? "Przetwarzanie..." : "Zapisz mnie do Klubu"}
                  {!isSubmitting && <ArrowLeft className="w-5 h-5 rotate-180" />}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
