import { FormEvent, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, Mail, Lock, CheckCircle2, Loader2, Code2 } from "lucide-react";
import { getTenantSaaSPlans, registerTenant, verifyEmail, getOwnerGyms, getCheckoutUrl, SaaSPlan } from "../api";
import { saveAuth } from "../auth";
import { useToast } from "../components/Toast";
import { useAuth } from "../authContext";
import { AuthLayout } from "../components/AuthLayout";

export function RegisterGymPage() {
  const { showError, showSuccess } = useToast();
  const { login } = useAuth();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  
  const [ownerFirstName, setOwnerFirstName] = useState("");
  const [ownerLastName, setOwnerLastName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const [gymName, setGymName] = useState("");
  const [gymCity, setGymCity] = useState("");
  const [gymAddress, setGymAddress] = useState("");
  const [gymPostalCode, setGymPostalCode] = useState("");
  const [gymNip, setGymNip] = useState("");
  
  const [verificationCode, setVerificationCode] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getTenantSaaSPlans()
      .then(setPlans)
      .catch((err) => showError(err.message))
      .finally(() => setLoadingPlans(false));
  }, [showError]);

  async function handleRegister(event: FormEvent) {
    event.preventDefault();
    if (!selectedPlanId) {
      showError("Wybierz plan subskrypcji, aby kontynuować.");
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        ownerFirstName,
        ownerLastName,
        ownerEmail,
        ownerPassword,
        saasPlanId: selectedPlanId,
        gymName,
        gymCity,
        gymAddress,
        gymPostalCode,
        gymNip
      };
      await registerTenant(payload);
      showSuccess("Konto utworzone. Sprawdź email.");
      setStep(2);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Wystąpił błąd podczas rejestracji");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { token } = await verifyEmail(ownerEmail, verificationCode);
      const authState = { token, role: "OWNER" as const, email: ownerEmail };
      saveAuth(authState);
      setStep(3);
      
      const gyms = await getOwnerGyms(authState);
      if (gyms && gyms.length > 0) {
        const { checkoutUrl } = await getCheckoutUrl(authState, gyms[0].id);
        window.location.href = checkoutUrl;
      } else {
        showError("Nie znaleziono przypisanej siłowni.");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błędny kod weryfikacyjny");
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Rozpocznij biznes"
      subtitle="Zarejestruj się, wybierz plan i zacznij zarządzać swoim biznesem w chmurze."
    >
      {step === 1 && (
        <form onSubmit={handleRegister} className="space-y-6">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Dane Właściciela</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Imię</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input type="text" value={ownerFirstName} onChange={e => setOwnerFirstName(e.target.value)} required
                  className="w-full pl-10 pr-3 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none transition-all"
                  placeholder="Jan" disabled={submitting} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Nazwisko</label>
              <input type="text" value={ownerLastName} onChange={e => setOwnerLastName(e.target.value)} required
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none transition-all"
                placeholder="Kowalski" disabled={submitting} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} required
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none transition-all"
                placeholder="biznes@email.com" disabled={submitting} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Hasło</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input type="password" value={ownerPassword} onChange={e => setOwnerPassword(e.target.value)} required
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none transition-all"
                placeholder="••••••••" disabled={submitting} />
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-4">Dane Siłowni</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Nazwa siłowni</label>
                <input type="text" value={gymName} onChange={e => setGymName(e.target.value)} required
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none transition-all"
                  placeholder="FitGym" disabled={submitting} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Miasto</label>
                  <input type="text" value={gymCity} onChange={e => setGymCity(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none transition-all"
                    placeholder="Warszawa" disabled={submitting} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Kod pocztowy</label>
                  <input type="text" value={gymPostalCode} onChange={e => setGymPostalCode(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none transition-all"
                    placeholder="00-001" disabled={submitting} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Adres</label>
                  <input type="text" value={gymAddress} onChange={e => setGymAddress(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none transition-all"
                    placeholder="ul. Marszałkowska 1" disabled={submitting} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">NIP</label>
                  <input type="text" value={gymNip} onChange={e => setGymNip(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none transition-all"
                    placeholder="1234567890" disabled={submitting} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Wybierz plan</h3>
            {loadingPlans ? (
              <div className="flex justify-center p-4"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
            ) : (
              <div className="flex flex-col gap-3">
                {plans.map(plan => (
                  <div 
                    key={plan.id}
                    onClick={() => !submitting && setSelectedPlanId(plan.id)}
                    className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedPlanId === plan.id 
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 shadow-md shadow-primary-500/10' 
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {selectedPlanId === plan.id && (
                      <div className="absolute top-4 right-4 text-primary-500">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h4>
                    <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-1">
                      {plan.price} zł <span className="text-sm font-medium text-slate-500 dark:text-slate-400">/ mies.</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || !selectedPlanId}
            className="w-full mt-6 bg-slate-900 dark:bg-slate-800 hover:bg-primary-500 text-white font-bold py-4 px-4 rounded-2xl transition-all shadow-md hover:shadow-xl focus:ring-4 focus:ring-primary-500/20 outline-none flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Przetwarzanie...</> : "Utwórz konto"}
          </button>
          
          <div className="text-center text-slate-500 dark:text-slate-400 mt-4 text-sm font-medium">
            Masz już konto?{" "}
            <Link to="/login" className="text-primary-600 hover:text-primary-500 font-bold underline decoration-2 underline-offset-4 transition-colors">
              Zaloguj się
            </Link>
          </div>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Weryfikacja Email</h2>
            <p className="text-slate-500 dark:text-slate-400">Wysłaliśmy kod weryfikacyjny na adres {ownerEmail}.</p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Kod Weryfikacyjny</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Code2 className="w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input type="text" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} required
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none transition-all text-center tracking-widest font-mono text-xl"
                placeholder="123456" disabled={submitting} maxLength={6} />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || verificationCode.length !== 6}
            className="w-full mt-6 bg-slate-900 dark:bg-slate-800 hover:bg-primary-500 text-white font-bold py-4 px-4 rounded-2xl transition-all shadow-md hover:shadow-xl focus:ring-4 focus:ring-primary-500/20 outline-none flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Weryfikacja...</> : "Potwierdź i przejdź do płatności"}
          </button>
        </form>
      )}

      {step === 3 && (
        <div className="text-center py-12 space-y-6">
          <Loader2 className="w-16 h-16 animate-spin text-primary-500 mx-auto" />
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Konfiguracja środowiska...</h2>
          <p className="text-slate-500 dark:text-slate-400">Przekierowujemy do płatności Stripe.</p>
        </div>
      )}
    </AuthLayout>
  );
}
