import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { beginMfaSetup, confirmMfaSetup, verifyMfaLogin } from "../api";
import { AuthLayout } from "../components/AuthLayout";
import { primaryButtonClassName } from "../components/formStyles";
import { useToast } from "../components/Toast";
import { usePostAuthRedirect, redirectOwnerToStripeCheckout } from "../hooks/usePostAuthRedirect";
import { useAuth } from "../authContext";

type MfaLocationState = {
  mfaToken: string;
  setup: boolean;
  ownerStripeCheckout?: boolean;
};

export function MfaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showError } = useToast();
  const { redirectAfterAuth } = usePostAuthRedirect();
  const { login: saveLogin } = useAuth();
  const state = location.state as MfaLocationState | null;

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

  const mfaToken = state?.mfaToken;
  const isSetup = Boolean(state?.setup);

  useEffect(() => {
    if (!mfaToken) {
      navigate("/login", { replace: true });
      return;
    }
    if (!isSetup) return;

    let cancelled = false;
    beginMfaSetup(mfaToken)
      .then((data) => {
        if (cancelled) return;
        setQrCodeDataUrl(data.qrCodeDataUrl);
        setSecret(data.secret);
      })
      .catch((err) => {
        if (!cancelled) {
          showError(err instanceof Error ? err.message : "Nie udało się rozpocząć konfiguracji MFA");
          navigate("/login", { replace: true });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isSetup, mfaToken, navigate, showError]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!mfaToken || loading) return;
    setLoading(true);
    try {
      const result = isSetup
        ? await confirmMfaSetup(mfaToken, code)
        : await verifyMfaLogin(mfaToken, code);
      if (!result.token) {
        throw new Error("Brak tokenu po weryfikacji MFA");
      }
      if (state?.ownerStripeCheckout) {
        const authState = saveLogin(result.token);
        await redirectOwnerToStripeCheckout(authState, showError);
        return;
      }
      await redirectAfterAuth(result.token);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Nieprawidłowy kod MFA");
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Gymlos"
      subtitle="Dodatkowe zabezpieczenie konta właściciela i administratora."
    >
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 bg-primary-50 dark:bg-primary-950/30 text-primary-500 rounded-full flex items-center justify-center shadow-inner">
          <ShieldCheck className="w-10 h-10" />
        </div>
      </div>

      <h2 className="text-3xl font-display font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight text-center">
        {isSetup ? "Skonfiguruj MFA" : "Weryfikacja MFA"}
      </h2>

      <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium text-center">
        {isSetup
          ? "Zeskanuj kod QR w aplikacji Google Authenticator (lub podobnej), a następnie wpisz 6-cyfrowy kod."
          : "Wpisz 6-cyfrowy kod z aplikacji uwierzytelniającej."}
      </p>

      {isSetup && qrCodeDataUrl ? (
        <div className="mb-6 flex flex-col items-center gap-3">
          <img src={qrCodeDataUrl} alt="Kod QR MFA" className="w-48 h-48 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white p-3" />
          {secret ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center break-all">
              Klucz ręczny: <span className="font-mono text-slate-700 dark:text-slate-300">{secret}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5">
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="w-full px-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-black text-center tracking-[0.5em] text-2xl text-slate-900 dark:text-white"
          placeholder="123456"
          maxLength={6}
          required
          disabled={loading || (isSetup && !qrCodeDataUrl)}
        />

        <button
          type="submit"
          disabled={loading || code.length !== 6 || (isSetup && !qrCodeDataUrl)}
          className={`w-full ${primaryButtonClassName} disabled:cursor-not-allowed`}
        >
          {loading ? "Weryfikowanie..." : isSetup ? "Aktywuj MFA" : "Potwierdź logowanie"}
        </button>
      </form>
    </AuthLayout>
  );
}
