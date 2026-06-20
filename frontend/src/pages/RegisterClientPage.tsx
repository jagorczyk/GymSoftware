import { FormEvent, useState, useEffect } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { Dumbbell, Mail, Lock, UserPlus, ShieldCheck, MapPin } from "lucide-react";
import { register, verifyEmail } from "../api";
import { useAuth } from "../authContext";
import { useToast } from "../components/Toast";
import { AuthLayout } from "../components/AuthLayout";
import { VerifyEmailForm } from "../components/VerifyEmailForm";
import { useTenant } from "../tenantContext";
import { joinGym } from "../clientApi";

export function RegisterClientPage() {
  const { login: saveLogin } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const { subdomain, tenant, locations } = useTenant();
  
  // Client registration is only allowed on a gym's subdomain
  if (!subdomain) {
    return <Navigate to="/" replace />;
  }
  
  const [step, setStep] = useState<"register" | "verify">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    locations && locations.length > 0 ? String(locations[0].id) : ""
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (locations && locations.length > 0 && !selectedLocationId) {
      setSelectedLocationId(String(locations[0].id));
    }
  }, [locations, selectedLocationId]);

  async function handleRegister(event: FormEvent) {
    event.preventDefault();
    if (!selectedLocationId) {
      showError("Wybierz lokalizację przed rejestracją.");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, "GUEST");
      showSuccess("Konto utworzone. Sprawdź swoją skrzynkę e-mail!");
      setStep("verify");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd rejestracji");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(code: string) {
    try {
      const result = await verifyEmail(email, code);
      saveLogin(result.token);
      
      // Auto-join if on tenant subdomain
      if (selectedLocationId) {
        try {
          const joinedGym = locations.find(l => String(l.id) === selectedLocationId);
          await joinGym({ token: result.token } as any, { gymId: Number(selectedLocationId), firstName, lastName, phone: phoneNumber });
          showSuccess(`E-mail zweryfikowany! Zostałeś dodany do ${joinedGym?.name || "siłowni"}.`);
        } catch (joinErr) {
          console.error("Auto-join failed", joinErr);
          showSuccess("E-mail zweryfikowany! Witamy w systemie.");
        }
      } else {
        showSuccess("E-mail zweryfikowany! Witamy w systemie.");
      }
      
      navigate("/client/dashboard", { replace: true });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd weryfikacji. Sprawdź kod.");
      throw err; // Re-throw to let the form know it failed
    }
  }

  return (
    <AuthLayout
      title="Dołącz do nas"
      subtitle="Zarejestruj się, aby zyskać dostęp do najlepszych siłowni i zarządzać swoimi treningami."
    >
      {step === "register" ? (
        <>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Stwórz konto</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-10 font-medium">Wypełnij poniższe dane, aby rozpocząć</p>

          <form onSubmit={handleRegister} className="space-y-5">
            {locations && locations.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Wybierz lokalizację</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white appearance-none"
                    disabled={loading || locations.length === 1}
                  >
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>
                        {loc.address ? `${loc.address}${loc.city ? `, ${loc.city}` : ""}` : loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                  placeholder="twoj@email.com"
                  required
                  disabled={loading}
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
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-slate-900 dark:bg-slate-800 dark:hover:bg-primary-600 hover:bg-primary-500 text-white font-bold py-4 px-4 rounded-2xl transition-all shadow-md hover:shadow-xl hover:shadow-primary-500/30 focus:ring-4 focus:ring-primary-500/20 outline-none flex justify-center items-center disabled:opacity-50"
            >
              {loading ? "Rejestracja..." : "Zarejestruj się"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            Masz już konto?{" "}
            <Link to="/login" className="text-primary-600 dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary-400 font-bold ml-1 transition-colors">
              Zaloguj się
            </Link>
          </div>
        </>
      ) : (
        <VerifyEmailForm
          email={email}
          onVerify={handleVerify}
          submitText="Potwierdź i wejdź"
        />
      )}
    </AuthLayout>
  );
}
