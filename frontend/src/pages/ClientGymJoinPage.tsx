import { FormEvent, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../authContext";
import { useToast } from "../components/Toast";
import { getAllGymsForClient, joinGym, ClientGymView } from "../clientApi";
import { ArrowLeft, MapPin, User, Phone, CheckCircle2 } from "lucide-react";
import { formatGymAddressLine } from "../utils/gymLabel";

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

  if (loading) return <div className="p-8 text-center text-slate-500 animate-pulse">Ładowanie dostępnych klubów...</div>;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500 pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/client/dashboard" className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-display font-extrabold text-slate-900 dark:text-white tracking-tight">Dołącz do Klubu</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Wybierz lokalizację i uzupełnij dane, aby kontynuować.</p>
        </div>
      </div>

      <div className="space-y-10">
        {/* Krok 1: Wybór Siłowni */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">1</div>
            Wybierz lokalizację
          </h2>
          {gyms.length === 0 ? (
            <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-500">
              Brak dostępnych klubów.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gyms.map((g) => (
                <div
                  key={g.id}
                  onClick={() => setSelectedGymId(g.id)}
                  className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-2 ${
                    selectedGymId === g.id
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10 shadow-md"
                      : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${selectedGymId === g.id ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{g.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {formatGymAddressLine(g) || "Brak adresu"}
                        </p>
                      </div>
                    </div>
                    {selectedGymId === g.id && (
                      <CheckCircle2 className="w-6 h-6 text-primary-500 animate-in zoom-in" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Krok 2: Formularz Danych */}
        <div className={`transition-all duration-500 ${selectedGymId ? 'opacity-100 translate-y-0' : 'opacity-30 pointer-events-none translate-y-4'}`}>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">2</div>
            Twoje dane
          </h2>
          
          <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Imię</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Wpisz imię"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Nazwisko</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Wpisz nazwisko"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                Numer telefonu <span className="text-slate-400 font-normal">(opcjonalnie)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+48 000 000 000"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={isSubmitting || selectedGymId === ""}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-bold text-lg py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Przetwarzanie..." : "Dołącz do Klubu"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
