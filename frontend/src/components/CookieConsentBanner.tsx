import { useState } from "react";
import { Link } from "react-router-dom";
import { getConsent, setConsent } from "../cookieConsent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => getConsent() === null);

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
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl p-5 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Pliki cookie i pamięć lokalna</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
          Gymlos korzysta z niezbędnych plików cookie oraz localStorage (m.in. sesja logowania, preferencje
          motywu, zapis Twojej decyzji o zgodzie). Po akceptacji możemy też uruchamiać funkcje takie jak
          logowanie przez Google. Więcej informacji znajdziesz w{" "}
          <Link to="/polityka-prywatnosci" className="text-primary-600 dark:text-primary-400 font-semibold underline">
            polityce prywatności
          </Link>
          .
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={() => handleChoice(false)}
            className="rounded-xl border border-slate-300 dark:border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Odrzuć
          </button>
          <button
            type="button"
            onClick={() => handleChoice(true)}
            className="rounded-xl bg-primary-600 hover:bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            Akceptuj
          </button>
        </div>
      </div>
    </div>
  );
}
