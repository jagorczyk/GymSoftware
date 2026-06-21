import { useEffect, useState } from "react";
import { getConsent, resetConsent, setConsent, type ConsentStatus } from "../cookieConsent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => getConsent() === null);

  useEffect(() => {
    const sync = () => setVisible(getConsent() === null);
    window.addEventListener("gym-cookie-consent-changed", sync);
    return () => window.removeEventListener("gym-cookie-consent-changed", sync);
  }, []);

  if (!visible) {
    return null;
  }

  function handleChoice(accepted: boolean) {
    setConsent(accepted ? "accepted" : "rejected");
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-label="Zgoda na pliki cookie"
      className="fixed bottom-0 inset-x-0 z-[9999] p-4 sm:p-6 pointer-events-auto"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-5 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Pliki cookie</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          Gymlos korzysta z niezbędnych plików cookie (sesja logowania współdzielona między subdomenami,
          preferencje motywu). Po akceptacji możesz też korzystać z logowania przez Google. Więcej w{" "}
          <a href="/polityka-prywatnosci" className="text-blue-600 dark:text-blue-400 font-semibold underline">
            polityce prywatności
          </a>
          .
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={() => handleChoice(false)}
            className="rounded-xl border-2 border-slate-300 dark:border-slate-600 px-5 py-3 text-sm font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Odrzuć
          </button>
          <button
            type="button"
            onClick={() => handleChoice(true)}
            className="rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-3 text-sm font-bold text-white transition-colors"
          >
            Akceptuj
          </button>
        </div>
      </div>
    </div>
  );
}

type CookieConsentPromptProps = {
  compact?: boolean;
};

export function CookieConsentPrompt({ compact = false }: CookieConsentPromptProps) {
  const [status, setStatus] = useState<ConsentStatus | null>(() => getConsent());

  useEffect(() => {
    const sync = () => setStatus(getConsent());
    window.addEventListener("gym-cookie-consent-changed", sync);
    return () => window.removeEventListener("gym-cookie-consent-changed", sync);
  }, []);

  if (status === "accepted") {
    return null;
  }

  if (status === "rejected") {
    return (
      <div className={`rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4 text-sm ${compact ? "" : "mb-4"}`}>
        <p className="text-amber-900 dark:text-amber-100 mb-3">
          Odrzuciłeś pliki cookie. Logowanie przez Google wymaga ich akceptacji.
        </p>
        <button
          type="button"
          onClick={() => {
            resetConsent();
            setStatus(null);
          }}
          className="rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-sm font-bold text-white"
        >
          Zmień decyzję o cookies
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 p-4 ${compact ? "" : "mb-4"}`}>
      <p className="text-sm text-slate-700 dark:text-slate-200 mb-3 font-medium">
        Zanim zalogujesz się przez Google, zaakceptuj pliki cookie:
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => setConsent("accepted")}
          className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-sm font-bold text-white"
        >
          Akceptuj
        </button>
        <button
          type="button"
          onClick={() => setConsent("rejected")}
          className="flex-1 rounded-lg border-2 border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-bold text-slate-800 dark:text-slate-100"
        >
          Odrzuć
        </button>
      </div>
    </div>
  );
}
