import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Dumbbell, Mail, Lock } from "lucide-react";
import { login, getOwnerGyms } from "../api";
import { useAuth } from "../authContext";
import { useTenant } from "../tenantContext";
import { useToast } from "../components/Toast";
import { AuthLayout } from "../components/AuthLayout";

export function LoginPage() {
  const { login: saveLogin } = useAuth();
  const { subdomain } = useTenant();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      const result = await login(email, password);
      const next = saveLogin(result.token);
      
      if (!subdomain && next.role === "OWNER") {
        try {
          const gyms = await getOwnerGyms(next);
          if (gyms.length > 0 && gyms[0].subdomain) {
            const proto = window.location.protocol;
            const host = window.location.host; // e.g. "gymlos.pl"
            window.location.href = `${proto}//${gyms[0].subdomain}.${host}/owner/dashboard`;
            return;
          }
        } catch (e) {
          console.error("Failed to fetch owner gyms for redirect", e);
        }
      }

      const dest = next.role === "OWNER" ? "/owner/dashboard" : next.role === "EMPLOYEE" ? "/employee/dashboard" : "/client/dashboard";
      navigate(dest, {
        replace: true,
      });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd logowania");
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
