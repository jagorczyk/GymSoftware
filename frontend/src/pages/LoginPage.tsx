import { FormEvent, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { login, loginWithGoogle } from "../api";
import { useToast } from "../components/Toast";
import { AuthLayout } from "../components/AuthLayout";
import { AuthDivider, GoogleSignInButton } from "../components/GoogleSignInButton";
import { primaryButtonClassName } from "../components/formStyles";
import { usePostAuthRedirect } from "../hooks/usePostAuthRedirect";
import { routeAuthLoginResult } from "../hooks/useAuthLoginFlow";
import { useTenant } from "../tenantContext";

export function LoginPage() {
  const { subdomain } = useTenant();
  const { showError } = useToast();
  const { redirectAfterAuth } = usePostAuthRedirect();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    flushSync(() => setLoading(true));
    try {
      const result = await login(email, password);
      await routeAuthLoginResult(result, navigate, redirectAfterAuth);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd logowania");
      setLoading(false);
    }
  }

  async function handleGoogleLogin(idToken: string) {
    if (loading) return;
    flushSync(() => setLoading(true));
    try {
      const result = await loginWithGoogle(idToken);
      await routeAuthLoginResult(result, navigate, redirectAfterAuth);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd logowania Google");
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Gymlos"
      subtitle="Wielooddziałowy, inteligentny ekosystem do zarzadzania siecią klubów fitness."
    >
      <div className="relative">
        {loading && (
          <div
            className="absolute -inset-8 md:-inset-12 z-20 flex flex-col items-center justify-center gap-4 bg-white dark:bg-slate-900"
            aria-live="polite"
            aria-busy="true"
          >
            <div
              className="h-12 w-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin"
              role="status"
              aria-label="Logowanie"
            />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Logowanie...</p>
          </div>
        )}

      <div className="mb-5">
        <Link to="/" className="text-primary-600 hover:text-primary-500 font-semibold text-sm">
          ← Strona główna
        </Link>
      </div>

      <h2 className="text-3xl font-display font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
        Witaj ponownie
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
        Zaloguj się na swoje konto, aby kontynuować
      </p>

        <GoogleSignInButton disabled={loading} onSuccess={handleGoogleLogin} onError={showError} />
        <AuthDivider />

        <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-display font-extrabold text-slate-800 dark:text-slate-300 block uppercase tracking-widest">
            Email
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
              placeholder="twoj@email.com"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-display font-extrabold text-slate-800 dark:text-slate-300 block uppercase tracking-widest">
            Hasło
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className={`w-full mt-6 ${primaryButtonClassName} disabled:cursor-not-allowed ${loading ? "opacity-100" : ""}`}
        >
          Zaloguj się
        </button>
        </form>

      <div className="mt-8 space-y-3 text-center text-sm font-medium text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-6">
        {subdomain && (
          <div>
            Jesteś nowym klientem?{" "}
            <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold ml-1 transition-colors">
              Załóż darmowe konto
            </Link>
          </div>
        )}
        {!subdomain && (
          <div>
            Jesteś właścicielem siłowni?{" "}
            <Link to="/register-gym" className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-bold ml-1 transition-colors">
              Rozpocznij współpracę
            </Link>
          </div>
        )}
      </div>
      </div>
    </AuthLayout>
  );
}
