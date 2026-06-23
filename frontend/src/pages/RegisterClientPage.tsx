import { FormEvent, useState, useEffect } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { register, verifyEmail, loginWithGoogle } from "../api";
import { useAuth } from "../authContext";
import { useToast } from "../components/Toast";
import { AuthLayout } from "../components/AuthLayout";
import { VerifyEmailForm } from "../components/VerifyEmailForm";
import { AuthDivider, GoogleSignInButton } from "../components/GoogleSignInButton";
import { primaryButtonClassName } from "../components/formStyles";
import { useTenant } from "../tenantContext";
import { joinGym } from "../clientApi";
import { decodeGoogleIdToken } from "../utils/googleJwt";
import { GymLocationPicker } from "../components/GymLocationPicker";
import { formatGymOptionLabel } from "../utils/gymLabel";

export function RegisterClientPage() {
  const { login: saveLogin } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const { subdomain, locations, loading: tenantLoading } = useTenant();

  const [step, setStep] = useState<"register" | "verify">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (locations.length === 1) {
      setSelectedLocationId(String(locations[0].id));
      return;
    }
    if (locations.length > 1) {
      setSelectedLocationId((current) =>
        current && locations.some((loc) => String(loc.id) === current) ? current : ""
      );
    }
  }, [locations]);

  if (!subdomain) {
    return <Navigate to="/" replace />;
  }

  const requiresLocationChoice = locations.length > 1;
  const canRegister = locations.length > 0 && (!requiresLocationChoice || !!selectedLocationId);

  function ensureLocationSelected(): boolean {
    if (!canRegister) {
      showError(requiresLocationChoice ? "Wybierz lokalizację przed rejestracją." : "Brak dostępnych lokalizacji.");
      return false;
    }
    return true;
  }

  async function handleRegister(event: FormEvent) {
    event.preventDefault();
    if (!ensureLocationSelected()) return;
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

  async function handleGoogleRegister(idToken: string) {
    if (!ensureLocationSelected()) return;
    setLoading(true);
    try {
      const profile = decodeGoogleIdToken(idToken);
      const result = await loginWithGoogle(idToken, "GUEST");
      if (!result.token) {
        throw new Error("Brak tokenu po rejestracji Google");
      }
      const authState = saveLogin(result.token);
      const joinedGym = locations.find((l) => String(l.id) === selectedLocationId);
      try {
        await joinGym(authState, {
          gymId: Number(selectedLocationId),
          firstName: profile.given_name || firstName || "Klient",
          lastName: profile.family_name || lastName || "",
          phone: phoneNumber,
        });
        showSuccess(`Konto utworzone! Zostałeś dodany do ${joinedGym ? formatGymOptionLabel(joinedGym) : "siłowni"}.`);
      } catch (joinErr) {
        console.error("Auto-join failed", joinErr);
        showSuccess("Konto utworzone! Witamy w systemie.");
      }
      navigate("/client/dashboard", { replace: true });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd rejestracji Google");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(code: string) {
    try {
      const result = await verifyEmail(email, code);
      if (!result.token) {
        throw new Error("Brak tokenu po weryfikacji");
      }
      saveLogin(result.token);

      if (selectedLocationId) {
        try {
          const joinedGym = locations.find((l) => String(l.id) === selectedLocationId);
          await joinGym({ token: result.token } as any, {
            gymId: Number(selectedLocationId),
            firstName,
            lastName,
            phone: phoneNumber,
          });
          showSuccess(
            `E-mail zweryfikowany! Zostałeś dodany do ${joinedGym ? formatGymOptionLabel(joinedGym) : "siłowni"}.`
          );
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
      throw err;
    }
  }

  return (
    <AuthLayout
      title="Dołącz do nas"
      subtitle="Zarejestruj się, aby zyskać dostęp do najlepszych siłowni i zarządzać swoimi treningami."
    >
      <div className="mb-4">
        <Link to="/" className="text-primary-600 hover:text-primary-500 font-semibold text-sm">
          ← Strona główna
        </Link>
      </div>

      {step === "register" ? (
        <>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Stwórz konto</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">Wypełnij poniższe dane, aby rozpocząć</p>

          {tenantLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 animate-pulse">Ładowanie lokalizacji...</p>
          ) : locations.length === 0 ? (
            <p className="text-sm text-rose-600 dark:text-rose-400 mb-8">
              Nie znaleziono dostępnych lokalizacji tej siłowni.
            </p>
          ) : (
            <div className="mb-8">
              <GymLocationPicker
                locations={locations}
                selectedId={selectedLocationId}
                onSelect={setSelectedLocationId}
                disabled={loading}
              />
            </div>
          )}

          <GoogleSignInButton
            text="signup_with"
            disabled={loading || !canRegister}
            onSuccess={handleGoogleRegister}
            onError={showError}
          />
          <AuthDivider />

          <form onSubmit={handleRegister} className="space-y-5">
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
                  disabled={loading || !canRegister}
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
                  disabled={loading || !canRegister}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !canRegister}
              className={`w-full mt-6 ${primaryButtonClassName} disabled:opacity-50`}
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
