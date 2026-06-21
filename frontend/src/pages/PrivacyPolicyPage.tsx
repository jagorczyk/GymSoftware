import { Link } from "react-router-dom";

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/login" className="text-primary-600 dark:text-primary-400 text-sm font-semibold hover:underline">
          ← Wróć
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-6 mb-8">Polityka prywatności</h1>

        <div className="space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">1. Administrator danych</h2>
            <p>
              Administratorem danych osobowych przetwarzanych w serwisie Gymlos jest operator platformy SaaS
              do zarządzania siłowniami. W sprawach związanych z danymi osobowymi można się kontaktować pod
              adresem e-mail wskazanym w panelu administracyjnym lub na stronie głównej serwisu.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">2. Cele przetwarzania</h2>
            <p>Przetwarzamy dane w celu:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>świadczenia usług platformy (konto użytkownika, rezerwacje, płatności),</li>
              <li>uwierzytelniania użytkowników (e-mail/hasło lub logowanie Google),</li>
              <li>zapewnienia bezpieczeństwa i działania technicznego serwisu,</li>
              <li>realizacji obowiązków prawnych (np. rozliczenia, faktury).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">3. Rodzaje danych</h2>
            <p>
              W zależności od sposobu korzystania z serwisu przetwarzamy m.in.: imię i nazwisko, adres e-mail,
              numer telefonu, dane dotyczące członkostwa i płatności, a przy logowaniu Google — identyfikator
              konta Google i zdjęcie profilowe (jeśli udostępnione).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">4. Pliki cookie i localStorage</h2>
            <p>
              Serwis korzysta z plików cookie oraz pamięci localStorage przeglądarki. Niezbędne dane obejmują
              m.in. token sesji (JWT), preferencje motywu oraz zapis decyzji o zgodzie na cookies. Funkcje
              opcjonalne (np. logowanie przez Google) są aktywowane po wyrażeniu zgody.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">5. Logowanie przez Google</h2>
            <p>
              Jeśli wybierzesz logowanie przez Google, przekazujemy do naszego serwera token identyfikacyjny
              Google w celu weryfikacji tożsamości. Google przetwarza dane zgodnie z własną polityką
              prywatności dostępną na stronach Google.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">6. Twoje prawa</h2>
            <p>
              Przysługuje Ci prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania,
              przenoszenia danych oraz wniesienia sprzeciwu — w granicach określonych przepisami RODO. Możesz
              też wycofać zgodę na cookies w dowolnym momencie, usuwając dane przeglądarki lub zmieniając
              ustawienia w banerze zgody (przy ponownej wizycie).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">7. Okres przechowywania</h2>
            <p>
              Dane przechowujemy przez czas korzystania z konta oraz przez okres wymagany przepisami prawa lub
              do czasu przedawnienia roszczeń.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
