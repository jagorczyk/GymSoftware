import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Dumbbell, Mail, Lock, UserPlus, ShieldCheck } from "lucide-react";
import { register, verifyEmail } from "../api";
import { useAuth } from "../authContext";
import { useToast } from "../components/Toast";

export function RegisterClientPage() {
  const { login: saveLogin } = useAuth();
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  
  const [step, setStep] = useState<"register" | "verify">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(event: FormEvent) {
    event.preventDefault();
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

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await verifyEmail(email, code);
      saveLogin(result.token);
      showSuccess("E-mail zweryfikowany! Witamy w systemie.");
      navigate("/client/dashboard", { replace: true });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Błąd weryfikacji. Sprawdź kod.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="md:w-[45%] bg-slate-900 text-white flex flex-col justify-center items-center p-8 md:p-12 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-blob animation-delay-2000"></div>
        
        <div className="z-10 text-center max-w-md">
          <div className="mx-auto w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center backdrop-blur-md mb-8 border border-white/10 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-transparent rounded-[2rem]"></div>
            <UserPlus className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">Dołącz do nas</h1>
          <p className="text-slate-400 text-lg md:text-xl font-medium">
            Zarejestruj się, aby zyskać dostęp do najlepszych siłowni i zarządzać swoimi treningami.
          </p>
        </div>
      </div>

      <div className="md:w-[55%] flex items-center justify-center p-8 dark:bg-slate-950">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_2px_20px_-3px_rgba(6,81,237,0.1)] border-2 border-slate-100 dark:border-slate-800 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-50 dark:bg-primary-950/20 rounded-full blur-3xl opacity-50"></div>
          
          <div className="relative z-10">
            {step === "register" ? (
              <>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">Stwórz konto</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-10 font-medium">Wypełnij poniższe dane, aby rozpocząć</p>

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
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-primary-50 dark:bg-primary-950/30 text-primary-500 rounded-full flex items-center justify-center">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight text-center">Weryfikacja Email</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium text-center">
                  Wysłaliśmy 6-cyfrowy kod na adres: <span className="text-slate-900 dark:text-white font-bold">{email}</span>. Wprowadź go poniżej.
                </p>

                <form onSubmit={handleVerify} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide text-center">Kod weryfikacyjny</label>
                    <input
                      type="text"
                      name="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-black text-center tracking-[0.5em] text-2xl text-slate-900 dark:text-white"
                      placeholder="123456"
                      maxLength={6}
                      required
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="w-full mt-6 bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 px-4 rounded-2xl transition-all shadow-md hover:shadow-xl hover:shadow-primary-500/30 focus:ring-4 focus:ring-primary-500/20 outline-none flex justify-center items-center disabled:opacity-50"
                  >
                    {loading ? "Weryfikowanie..." : "Potwierdź i wejdź"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
