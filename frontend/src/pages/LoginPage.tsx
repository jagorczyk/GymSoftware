import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Dumbbell, Mail, Lock } from "lucide-react";
import { login } from "../api";
import { useAuth } from "../authContext";
import { useToast } from "../components/Toast";

export function LoginPage() {
  const { login: saveLogin } = useAuth();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      const result = await login(email, password);
      const next = saveLogin(result.token);
      navigate(next.role === "OWNER" ? "/owner/dashboard" : "/employee/dashboard", {
        replace: true,
      });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd logowania");
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-200 font-sans relative overflow-hidden">
      {/* Background blobs for depth */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-sky-500/10 dark:bg-sky-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Left Panel - Tech Branding */}
      <div className="md:w-[45%] bg-gradient-to-br from-blue-950 via-blue-900 to-slate-950 bg-cyber-grid text-white flex flex-col justify-center items-center p-8 md:p-12 relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-200/20 dark:border-slate-800/40">
        {/* Neon light source blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500 rounded-full mix-blend-screen filter blur-[120px] opacity-20 dark:opacity-15 animate-blob"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500 rounded-full mix-blend-screen filter blur-[120px] opacity-20 dark:opacity-15 animate-blob animation-delay-2000"></div>

        <div className="z-10 text-center max-w-md animate-tech-slide-up">
          {/* Logo Container */}
          <div className="mx-auto w-28 h-28 bg-slate-955/80 rounded-3xl flex items-center justify-center backdrop-blur-md mb-8 border-2 border-primary-500/40 dark:border-primary-500/30 shadow-[0_0_30px_rgba(33,85,229,0.15)] glow-box-blue relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 via-transparent to-sky-500/15 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-500 to-sky-500 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
            <Dumbbell className="w-14 h-14 text-primary-300 group-hover:scale-110 transition-transform duration-300 relative z-10" />
          </div>

          <h1 className="text-4xl md:text-6xl font-display font-black tracking-tight mb-6 uppercase">
            Gym<span className="text-primary-300 glow-blue">Soft</span>
          </h1>
          <p className="text-slate-350 text-base md:text-lg font-medium max-w-sm mx-auto leading-relaxed">
            Wielooddziałowy, inteligentny ekosystem do zarzadzania siecią klubów fitness.
          </p>
        </div>

        {/* Decorative corner lines */}
        <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-slate-700/60 pointer-events-none"></div>
        <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-slate-700/60 pointer-events-none"></div>
        <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-slate-700/60 pointer-events-none"></div>
        <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-slate-700/60 pointer-events-none"></div>
      </div>

      {/* Right Panel - Form */}
      <div className="md:w-[55%] flex items-center justify-center p-6 md:p-12 relative z-10 dark:bg-slate-950">
        <div className="w-full max-w-md glass-panel rounded-[2rem] p-8 md:p-10 relative overflow-hidden border border-slate-200/80 dark:border-slate-800/60 shadow-[0_20px_50px_rgba(33,85,229,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {/* Internal background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 animate-tech-slide-up">
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
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white/60 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
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
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-white/60 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-medium text-slate-900 dark:text-white"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-6 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-650 hover:to-primary-700 text-white dark:bg-primary-500 dark:text-slate-950 hover:shadow-primary-500/20 font-display font-bold py-4 px-4 rounded-xl transition-all shadow-lg focus:ring-4 focus:ring-primary-500/20 outline-none flex justify-center items-center gap-2 group cursor-pointer"
              >
                <span>Zaloguj się</span>
              </button>
            </form>

            <div className="mt-8 text-center text-sm font-medium text-slate-500 dark:text-slate-400">
              Nie masz jeszcze konta?{" "}
              <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-bold ml-1 transition-colors">
                Zarejestruj się
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
