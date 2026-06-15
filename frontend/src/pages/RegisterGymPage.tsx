import { FormEvent, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Building2, User, Mail, Lock, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { getTenantSaaSPlans, registerTenant, SaaSPlan } from "../api";
import { useToast } from "../components/Toast";

export function RegisterGymPage() {
  const { showError, showSuccess } = useToast();
  
  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  
  const [gymName, setGymName] = useState("");
  const [gymAddress, setGymAddress] = useState("");
  const [ownerFirstName, setOwnerFirstName] = useState("");
  const [ownerLastName, setOwnerLastName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getTenantSaaSPlans()
      .then(setPlans)
      .catch((err) => showError(err.message))
      .finally(() => setLoadingPlans(false));
  }, [showError]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!selectedPlanId) {
      showError("Wybierz plan subskrypcji, aby kontynuować.");
      return;
    }
    
    setSubmitting(true);
    try {
      const payload = {
        gymName,
        gymAddress,
        ownerFirstName,
        ownerLastName,
        ownerEmail,
        ownerPassword,
        saasPlanId: selectedPlanId
      };
      const response = await registerTenant(payload);
      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      } else {
        showError("Błąd serwera: brak linku do płatności.");
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Wystąpił błąd podczas rejestracji");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="md:w-1/3 bg-slate-900 text-white flex flex-col justify-center p-8 md:p-12 relative overflow-hidden shrink-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob"></div>
        
        <div className="z-10 text-center max-w-md mx-auto">
          <div className="mx-auto w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center backdrop-blur-md mb-8 border border-white/10 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-transparent rounded-[2rem]"></div>
            <Building2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">Rozpocznij biznes</h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium">
            Zarejestruj swoją siłownię, wybierz plan i zacznij zarządzać swoim biznesem w chmurze.
          </p>
        </div>
      </div>

      <div className="md:w-2/3 p-8 flex items-center justify-center dark:bg-slate-950 overflow-y-auto">
        <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_2px_20px_-3px_rgba(6,81,237,0.1)] border-2 border-slate-100 dark:border-slate-800 p-8 md:p-12 relative">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Formularz Rejestracyjny</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Wypełnij dane swojej siłowni i wybierz plan SaaS</p>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Dane Siłowni</h3>
                
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
                  <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Adres</label>
                  <input type="text" value={gymAddress} onChange={e => setGymAddress(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none transition-all"
                    placeholder="ul. Główna 1, 00-000 Miasto" disabled={submitting} />
                </div>
              </div>

              <div className="space-y-5">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Dane Właściciela</h3>
                
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
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white text-center">Wybierz plan subskrypcji</h3>
              
              {loadingPlans ? (
                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans.map(plan => (
                    <div 
                      key={plan.id}
                      onClick={() => !submitting && setSelectedPlanId(plan.id)}
                      className={`relative cursor-pointer p-6 rounded-2xl border-2 transition-all duration-200 ${
                        selectedPlanId === plan.id 
                          ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 shadow-lg shadow-primary-500/20' 
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      {selectedPlanId === plan.id && (
                        <div className="absolute top-4 right-4 text-primary-500">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                      )}
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{plan.name}</h4>
                      <div className="text-3xl font-black text-slate-900 dark:text-white mb-4">
                        {plan.price} <span className="text-base font-medium text-slate-500">zł / mies.</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                        {plan.features}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedPlanId}
              className="w-full mt-6 bg-slate-900 dark:bg-slate-800 hover:bg-primary-500 text-white font-bold py-4 px-4 rounded-2xl transition-all shadow-md hover:shadow-xl hover:shadow-primary-500/30 focus:ring-4 focus:ring-primary-500/20 outline-none flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Przetwarzanie...</> : "Rozpocznij i zapłać"}
            </button>
            
            <div className="flex items-center justify-center gap-2 text-slate-400 mt-4">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-medium">Zostaniesz bezpiecznie przekierowany do Stripe</span>
            </div>

            <div className="mt-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
              Masz już konto?{" "}
              <Link to="/login" className="text-primary-600 dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary-400 font-bold ml-1 transition-colors">
                Zaloguj się
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
