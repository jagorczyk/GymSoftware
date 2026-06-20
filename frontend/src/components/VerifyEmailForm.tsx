import { FormEvent, useState } from "react";
import { ShieldCheck, Send } from "lucide-react";
import { useToast } from "./Toast";
import { resendVerification } from "../api";

interface VerifyEmailFormProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  submitText: string;
  loadingMessage?: string;
}

export function VerifyEmailForm({
  email,
  onVerify,
  submitText,
  loadingMessage = "Weryfikowanie...",
}: VerifyEmailFormProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await onVerify(code);
    } finally {
      setLoading(false);
    }
  }

  const { showSuccess, showError } = useToast();
  const [resending, setResending] = useState(false);

  async function handleResend() {
    setResending(true);
    try {
      await resendVerification(email);
      showSuccess("Nowy kod został wysłany na Twój adres e-mail.");
    } catch (err: any) {
      showError(err.message || "Nie udało się wysłać kodu ponownie.");
    } finally {
      setResending(false);
    }
  }

  return (
    <>
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-primary-50 dark:bg-primary-950/30 text-primary-500 rounded-full flex items-center justify-center shadow-inner">
          <ShieldCheck className="w-10 h-10" />
        </div>
      </div>
      
      <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight text-center">
        Weryfikacja Email
      </h2>
      
      <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium text-center">
        Wysłaliśmy 6-cyfrowy kod na adres: <span className="text-slate-900 dark:text-white font-bold">{email}</span>. Wprowadź go poniżej.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-900 dark:text-slate-300 block uppercase tracking-wide text-center">
            Kod weryfikacyjny
          </label>
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
          className="w-full mt-6 bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 px-4 rounded-2xl transition-all shadow-md hover:shadow-xl hover:shadow-primary-500/30 focus:ring-4 focus:ring-primary-500/20 outline-none flex justify-center items-center disabled:opacity-50 gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              {loadingMessage}
            </>
          ) : (
            submitText
          )}
        </button>

        <div className="text-center mt-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Nie otrzymałeś kodu?</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || loading}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-bold transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          >
            {resending ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Wyślij ponownie
          </button>
        </div>
      </form>
    </>
  );
}
