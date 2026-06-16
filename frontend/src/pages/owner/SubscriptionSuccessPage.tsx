import { useState, useEffect, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Loader2 } from "lucide-react";
import { updateOwnerGym, getOwnerGyms } from "../../api";
import { useAuth } from "../../authContext";
import { useToast } from "../../components/Toast";
import { AuthLayout } from "../../components/AuthLayout";

export function SubscriptionSuccessPage() {
  const { auth } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gymIdParam = searchParams.get("gymId");

  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [gymId, setGymId] = useState<number | null>(gymIdParam ? parseInt(gymIdParam, 10) : null);

  const [gymName, setGymName] = useState("");
  const [gymAddress, setGymAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!auth) return;
    
    getOwnerGyms(auth)
      .then((gyms) => {
        const targetGym = gymId ? gyms.find(g => g.id === gymId) : gyms[0];
        if (!targetGym) {
          navigate("/owner");
          return;
        }
        
        if (!gymId) setGymId(targetGym.id);

        if (targetGym.name === "Twoja Siłownia (Tymczasowa)" || targetGym.address === "-") {
          setNeedsSetup(true);
        } else {
          showSuccess("Subskrypcja aktywna!");
          navigate("/owner");
        }
      })
      .catch((err) => {
        showError(err.message);
        navigate("/owner");
      })
      .finally(() => setLoading(false));
  }, [auth, gymId, navigate, showError, showSuccess]);

  async function handleSetup(e: FormEvent) {
    e.preventDefault();
    if (!gymId || !auth) return;

    setSubmitting(true);
    try {
      await updateOwnerGym(auth, gymId, { name: gymName, address: gymAddress });
      showSuccess("Siłownia skonfigurowana!");
      navigate("/owner");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd podczas konfiguracji");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!needsSetup) {
    return null; // Will redirect in useEffect
  }

  return (
    <AuthLayout
      title="Skonfiguruj siłownię"
      subtitle="Sukces! Płatność przebiegła pomyślnie. Teraz podaj docelowe dane swojej siłowni."
    >
      <form onSubmit={handleSetup} className="space-y-6">
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Dane Siłowni</h2>
        
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Nazwa Siłowni</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Building2 className="w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input type="text" value={gymName} onChange={e => setGymName(e.target.value)} required
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none transition-all"
              placeholder="Moja Super Siłownia" disabled={submitting} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Adres i Kod Pocztowy</label>
          <input type="text" value={gymAddress} onChange={e => setGymAddress(e.target.value)} required
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none transition-all"
            placeholder="ul. Główna 1, 00-000 Miasto" disabled={submitting} />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-6 bg-slate-900 dark:bg-slate-800 hover:bg-primary-500 text-white font-bold py-4 px-4 rounded-2xl transition-all shadow-md hover:shadow-xl focus:ring-4 focus:ring-primary-500/20 outline-none flex justify-center items-center gap-2 disabled:opacity-50"
        >
          {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Zapisywanie...</> : "Zapisz i Przejdź do Panelu"}
        </button>
      </form>
    </AuthLayout>
  );
}
