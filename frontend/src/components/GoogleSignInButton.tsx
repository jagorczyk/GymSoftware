import { useEffect, useRef, useState } from "react";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { hasConsent } from "../cookieConsent";
import { buildCentralLoginUrl, isMainAuthDomain } from "../auth";
import { isGoogleAuthEnabled, isValidGoogleClientId } from "./GoogleAuthProvider";
import { CookieConsentPrompt } from "./CookieConsentBanner";

type GoogleSignInButtonProps = {
  onSuccess: (idToken: string) => void | Promise<void>;
  onError?: (message: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
};

export function GoogleSignInButton({ onSuccess, onError, text = "signin_with" }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [buttonWidth, setButtonWidth] = useState(320);
  const [consentGranted, setConsentGranted] = useState(hasConsent);

  useEffect(() => {
    const sync = () => setConsentGranted(hasConsent());
    window.addEventListener("gym-cookie-consent-changed", sync);
    return () => window.removeEventListener("gym-cookie-consent-changed", sync);
  }, []);

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
  }, [consentGranted]);

  if (!isGoogleAuthEnabled()) {
    return null;
  }

  if (!isValidGoogleClientId()) {
    const raw = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    const hint = raw?.includes("=") ? " Wygląda na literówkę: użyj myślnika (-) zamiast znaku (=)." : "";
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-800 dark:text-red-200">
        Logowanie Google nie jest skonfigurowane (brak lub nieprawidłowy VITE_GOOGLE_CLIENT_ID). Przebuduj
        frontend z poprawnym Client ID z Google Cloud Console.{hint}
      </div>
    );
  }

  if (!isMainAuthDomain()) {
    const loginUrl = buildCentralLoginUrl(window.location.href);
    return (
      <>
        <CookieConsentPrompt compact />
        <a
          href={loginUrl}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Zaloguj przez Google (gymlos.pl)
        </a>
      </>
    );
  }

  async function handleSuccess(response: CredentialResponse) {
    if (!response.credential) {
      onError?.("Nie udało się uzyskać tokenu Google");
      return;
    }
    try {
      await onSuccess(response.credential);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Błąd logowania Google");
    }
  }

  return (
    <div className="space-y-4">
      <CookieConsentPrompt />
      {consentGranted && (
        <div ref={containerRef} className="flex justify-center w-full">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() =>
              onError?.(
                "Logowanie Google nie powiodło się. Sprawdź VITE_GOOGLE_CLIENT_ID i Authorized JavaScript origins (https://gymlos.pl)."
              )
            }
            text={text}
            shape="rectangular"
            theme="outline"
            size="large"
            width={buttonWidth}
          />
        </div>
      )}
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
