import { useEffect, useRef, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { hasConsent, setConsent } from "../cookieConsent";
import { buildCentralLoginUrl, isMainAuthDomain } from "../auth";
import { isGoogleAuthEnabled } from "./GoogleAuthProvider";

type GoogleSignInButtonProps = {
  onSuccess: (idToken: string) => void | Promise<void>;
  onError?: (message: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
};

export function GoogleSignInButton({ onSuccess, onError, text = "signin_with" }: GoogleSignInButtonProps) {
  const [pendingCredential, setPendingCredential] = useState<CredentialResponse | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [buttonWidth, setButtonWidth] = useState(320);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const updateWidth = () => {
      const next = Math.max(240, Math.floor(element.getBoundingClientRect().width));
      setButtonWidth(next);
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (!isGoogleAuthEnabled()) {
    return null;
  }

  if (!isMainAuthDomain()) {
    const loginUrl = buildCentralLoginUrl(window.location.href);
    return (
      <a
        href={loginUrl}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        Zaloguj przez Google (gymlos.pl)
      </a>
    );
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
        <p>Logowanie przez Google wymaga zgody na pliki cookie. Zaakceptuj, aby kontynuować.</p>
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
    <div ref={containerRef} className="flex justify-center w-full">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => onError?.("Logowanie Google nie powiodło się")}
        text={text}
        shape="rectangular"
        theme="outline"
        size="large"
        width={buttonWidth}
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
