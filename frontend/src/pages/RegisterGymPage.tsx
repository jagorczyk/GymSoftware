import { FormEvent, useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { User, Mail, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { getTenantSaaSPlans, registerTenant, verifyEmail, loginWithGoogle, SaaSPlan } from "../api";
import { saveAuth } from "../auth";
import { useToast } from "../components/Toast";
import { useAuth } from "../authContext";
import { useTenant } from "../tenantContext";
import { AuthLayout } from "../components/AuthLayout";
import { VerifyEmailForm } from "../components/VerifyEmailForm";
import { AuthDivider, GoogleSignInButton } from "../components/GoogleSignInButton";
import { redirectOwnerToStripeCheckout } from "../hooks/usePostAuthRedirect";
import { decodeGoogleIdToken } from "../utils/googleJwt";

const PLACEHOLDER_GYM_NAME = "Twoja Siłownia (Tymczasowa)";

export function RegisterGymPage() {
  const { showError, showSuccess } = useToast();
  const { login } = useAuth();
  const { subdomain } = useTenant();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const [plans, setPlans] = useState<SaaSPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const [ownerFirstName, setOwnerFirstName] = useState("");
  const [ownerLastName, setOwnerLastName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [googleIdToken, setGoogleIdToken] = useState<string | null>(null);
  const [gymName, setGymName] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getTenantSaaSPlans()
      .then(setPlans)
      .catch((err) => showError(err.message))
      .finally(() => setLoadingPlans(false));
  }, [showError]);

  if (subdomain) {
    return <Navigate to="/login" replace />;
  }

  async function completeGoogleRegistration(idToken: string) {
    if (!selectedPlanId) {
      showError("Wybierz plan subskrypcji, aby kontynuować.");
      return;
    }

    setSubmitting(true);
    try {
      const profile = decodeGoogleIdToken(idToken);
      const email = profile.email || ownerEmail;
      const payload = {
        ownerFirstName: profile.given_name || ownerFirstName || "Właściciel",
        ownerLastName: profile.family_name || ownerLastName || "",
        ownerEmail: email,
        googleIdToken: idToken,
        saasPlanId: selectedPlanId,
        gymName: PLACEHOLDER_GYM_NAME,
        gymCity: "-",
        gymAddress: "-",
        gymPostalCode: "00-000",
        gymNip: "0000000000",
      };
      await registerTenant(payload);
      const { token } = await loginWithGoogle(idToken);
      const authState = login(token);
      setStep(3);
      await redirectOwnerToStripeCheckout(authState, showError);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Wystąpił błąd podczas rejestracji");
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoogleCredential(idToken: string) {
    const profile = decodeGoogleIdToken(idToken);
    if (profile.given_name) setOwnerFirstName(profile.given_name);
    if (profile.family_name) setOwnerLastName(profile.family_name);
    if (profile.email) setOwnerEmail(profile.email);
    setGoogleIdToken(idToken);
    setShowEmailForm(false);
    showSuccess("Konto Google połączone. Wybierz plan i przejdź do płatności.");
  }

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
        gymName: gymName || "Twoja Siłownia",
        gymCity: "-",
        gymAddress: "-",
        gymPostalCode: "00-000",
        gymNip: "0000000000",
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

  async function handleVerify(code: string) {
    try {
      const { token } = await verifyEmail(ownerEmail, code);
      const authState = { token, role: "OWNER" as const, email: ownerEmail };
      saveAuth(authState);
      setStep(3);
      await redirectOwnerToStripeCheckout(authState, showError);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błędny kod weryfikacyjny");
      throw err;
    }
  }

  function renderPlanPicker() {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Wybierz plan</h3>
        {loadingPlans ? (
          <div className="flex justify-center p-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => !submitting && setSelectedPlanId(plan.id)}
                className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                  selectedPlanId === plan.id
                    ? "border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 shadow-md shadow-primary-500/10"
                    : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600"
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
    );
  }

  return (
    <AuthLayout
      title="Rozpocznij biznes"
      subtitle="Zarejestruj się, wybierz plan i zacznij zarządzać swoim biznesem w chmurze."
    >
      {step === 1 && googleIdToken && !showEmailForm && (
        <div className="space-y-6">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Wybierz plan</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Zalogowano jako <span className="font-semibold text-slate-800 dark:text-slate-200">{ownerEmail}</span>.
            Po opłaceniu planu skonfigurujesz nazwę i dane siłowni.
          </p>

          {renderPlanPicker()}

          <button
            type="button"
            disabled={submitting || !selectedPlanId}
            onClick={() => void completeGoogleRegistration(googleIdToken)}
            className="w-full mt-6 bg-slate-900 dark:bg-slate-800 hover:bg-primary-500 text-white font-bold py-4 px-4 rounded-2xl transition-all shadow-md hover:shadow-xl focus:ring-4 focus:ring-primary-500/20 outline-none flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Przekierowanie do płatności...
              </>
            ) : (
              "Przejdź do płatności"
            )}
          </button>

          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => {
                setGoogleIdToken(null);
                setSelectedPlanId(null);
              }}
              className="text-primary-600 hover:text-primary-500 font-semibold"
            >
              Użyj innego konta Google
            </button>
          </div>
        </div>
      )}

      {step === 1 && !googleIdToken && !showEmailForm && (
        <div className="space-y-6">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Szybka rejestracja</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">
            Zarejestruj się przez Google — wybierzesz tylko plan. Nazwę siłowni ustawisz po płatności.
          </p>

          <GoogleSignInButton text="signup_with" onSuccess={handleGoogleCredential} onError={showError} />

          <AuthDivider />

          <button
            type="button"
            onClick={() => setShowEmailForm(true)}
            className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 py-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Zarejestruj się przez e-mail
          </button>

          <div className="text-center text-slate-500 dark:text-slate-400 text-sm font-medium">
            Masz już konto?{" "}
            <Link to="/login" className="text-primary-600 hover:text-primary-500 font-bold underline decoration-2 underline-offset-4">
              Zaloguj się
            </Link>
          </div>
        </div>
      )}

      {step === 1 && showEmailForm && !googleIdToken && (
        <form onSubmit={handleRegister} className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Rejestracja e-mail</h2>
            <button
              type="button"
              onClick={() => setShowEmailForm(false)}
              className="text-sm font-semibold text-primary-600 hover:text-primary-500"
            >
              Wróć
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Imię</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  type="text"
                  value={ownerFirstName}
                  onChange={(e) => setOwnerFirstName(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none transition-all"
                  placeholder="Jan"
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Nazwisko</label>
              <input
                type="text"
                value={ownerLastName}
                onChange={(e) => setOwnerLastName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none transition-all"
                placeholder="Kowalski"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Email</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none transition-all"
                placeholder="biznes@email.com"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Hasło</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
              </div>
              <input
                type="password"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none transition-all"
                placeholder="••••••••"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Nazwa Twojej Siłowni</label>
            <input
              type="text"
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:border-primary-500 outline-none transition-all"
              placeholder="np. Wellfitnes"
              disabled={submitting}
            />
          </div>

          {renderPlanPicker()}

          <button
            type="submit"
            disabled={submitting || !selectedPlanId}
            className="w-full mt-6 bg-slate-900 dark:bg-slate-800 hover:bg-primary-500 text-white font-bold py-4 px-4 rounded-2xl transition-all shadow-md hover:shadow-xl focus:ring-4 focus:ring-primary-500/20 outline-none flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Przetwarzanie...
              </>
            ) : (
              "Utwórz konto"
            )}
          </button>
        </form>
      )}

      {step === 2 && (
        <VerifyEmailForm email={ownerEmail} onVerify={handleVerify} submitText="Potwierdź i przejdź do płatności" />
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
