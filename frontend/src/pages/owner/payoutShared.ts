import type { PayoutStatusView } from "../../api";

export const PAYOUT_PAGE_SUBTITLE =
  "Tu trafiają pieniądze od klientów za karnety online — to nie jest opłata za Gymlos (ta jest w Subskrypcji).";

export function formatPayoutMoney(cents: number | null | undefined, currency = "pln") {
  if (cents == null) return "—";
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export type SetupStep = {
  id: number;
  title: string;
  description: string;
  done: boolean;
  current: boolean;
};

export function buildPayoutSetupSteps(status: PayoutStatusView): SetupStep[] {
  const hasAccount = Boolean(status.accountId);
  const detailsDone = status.detailsSubmitted;
  const live = status.chargesEnabled && status.payoutsEnabled;

  return [
    {
      id: 1,
      title: "Utwórz konto wypłat",
      description: "Bezpieczny formularz Stripe — ok. 5 minut.",
      done: hasAccount,
      current: !hasAccount,
    },
    {
      id: 2,
      title: "Dane firmy i konto bankowe",
      description: "NIP, adres i numer konta do przelewów.",
      done: detailsDone,
      current: hasAccount && !detailsDone,
    },
    {
      id: 3,
      title: "Przyjmuj płatności online",
      description: "Po weryfikacji klienci mogą kupować karnety na stronie.",
      done: live,
      current: detailsDone && !live,
    },
  ];
}

export function payoutBannerDismissKey(gymId: number) {
  return `gymlos:payout-banner:dismissed:${gymId}`;
}
