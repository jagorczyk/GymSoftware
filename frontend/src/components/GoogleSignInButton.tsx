import { useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { hasConsent, setConsent } from "../cookieConsent";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

type GoogleSignInButtonProps = {
  onSuccess: (idToken: string) => void | Promise<void>;
  onError?: (message: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
};

export function isGoogleAuthEnabled(): boolean {
  return Boolean(GOOGLE_CLIENT_ID);
}

export function GoogleSignInButton({ onSuccess, onError, text = "signin_with" }: GoogleSignInButtonProps) {
  const [pendingCredential, setPendingCredential] = useState<CredentialResponse | null>(null);

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  async function handleSuccess(response: CredentialResponse) {
    if (!response.credential) {
      onError?.("Nie udało się uzyskać tokenu Google");
      return;
    }

    if (!hasConsent()) {
      setPendingCredential(response);
      return;
    }

    try {
      await onSuccess(response.credential);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Błąd logowania Google");
    }
  }

  function handleConsent(accepted: boolean) {
    setConsent(accepted ? "accepted" : "rejected");
    if (!accepted || !pendingCredential?.credential) {
      setPendingCredential(null);
      if (!accepted) {
        onError?.("Aby zalogować się przez Google, zaakceptuj niezbędne pliki cookie");
      }
      return;
    }
    const credential = pendingCredential.credential;
    setPendingCredential(null);
    Promise.resolve(onSuccess(credential)).catch((err: unknown) => {
      onError?.(err instanceof Error ? err.message : "Błąd logowania Google");
    });
  }

  if (pendingCredential) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
        <p>Logowanie przez Google wymaga zgody na pliki cookie i localStorage. Zaakceptuj, aby kontynuować.</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleConsent(true)}
            className="flex-1 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold py-2 px-3 transition-colors"
          >
            Akceptuj i kontynuuj
          </button>
          <button
            type="button"
            onClick={() => handleConsent(false)}
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2 px-3 transition-colors"
          >
            Anuluj
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onError?.("Logowanie Google nie powiodło się")}
        text={text}
        shape="rectangular"
        theme="outline"
        size="large"
        width="100%"
      />
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-slate-200 dark:border-slate-800" />
      </div>
      <div className="relative flex justify-center text-xs uppercase tracking-widest">
        <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-bold">lub</span>
      </div>
    </div>
  );
}
