export type ConsentStatus = "accepted" | "rejected";

const STORAGE_KEY = "gym_cookie_consent";
const COOKIE_NAME = "gym_cookie_consent";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function getConsent(): ConsentStatus | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "accepted" || stored === "rejected") {
    return stored;
  }
  const cookie = readCookie(COOKIE_NAME);
  if (cookie === "accepted" || cookie === "rejected") {
    localStorage.setItem(STORAGE_KEY, cookie);
    return cookie;
  }
  return null;
}

export function hasConsent(): boolean {
  return getConsent() === "accepted";
}

export function setConsent(status: ConsentStatus): void {
  localStorage.setItem(STORAGE_KEY, status);
  document.cookie = `${COOKIE_NAME}=${status}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function isAnalyticsAllowed(): boolean {
  return getConsent() === "accepted";
}
