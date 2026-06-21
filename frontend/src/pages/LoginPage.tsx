import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { login, loginWithGoogle } from "../api";
import { useToast } from "../components/Toast";
import { AuthLayout } from "../components/AuthLayout";
import { AuthDivider, GoogleSignInButton } from "../components/GoogleSignInButton";
import { usePostAuthRedirect } from "../hooks/usePostAuthRedirect";
import { useTenant } from "../tenantContext";

export function LoginPage() {
  const { subdomain } = useTenant();
  const { showError } = useToast();
  const { redirectAfterAuth } = usePostAuthRedirect();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      const result = await login(email, password);
      await redirectAfterAuth(result.token);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd logowania");
    }
  }

  async function handleGoogleLogin(idToken: string) {
    try {
      const result = await loginWithGoogle(idToken);
      await redirectAfterAuth(result.token);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd logowania Google");
    }
  }

  return (
    <AuthLayout
      title="Gymlos"
      subtitle="Wielooddziałowy, inteligentny ekosystem do zarzadzania siecią klubów fitness."
    >
      <h2 className="text-3xl font-display font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
        Witaj ponownie
      </h2>
      <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">
        Zaloguj się na swoje konto, aby kontynuować
      </p>

      <GoogleSignInButton onSuccess={handleGoogleLogin} onError={showError} />
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
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-6 bg-slate-900 dark:bg-slate-800 dark:hover:bg-primary-600 hover:bg-primary-500 text-white font-display font-bold py-4 px-4 rounded-xl transition-all shadow-md focus:ring-4 focus:ring-primary-500/20 outline-none flex justify-center items-center gap-2 group cursor-pointer"
        >
          <span>Zaloguj się</span>
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
    </AuthLayout>
  );
}
