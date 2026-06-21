import { getAuthCookieDomain } from "./auth";

export type ConsentStatus = "accepted" | "rejected";

const STORAGE_KEY = "gym_cookie_consent";
const COOKIE_NAME = "gym_cookie_consent";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeConsentCookie(status: ConsentStatus): void {
  const parts = [
    `${COOKIE_NAME}=${status}`,
    "path=/",
    `max-age=${COOKIE_MAX_AGE_SECONDS}`,
    "SameSite=Lax",
  ];
  const domain = getAuthCookieDomain();
  if (domain) {
    parts.push(`domain=${domain}`);
  }
  if (window.location.protocol === "https:") {
    parts.push("Secure");
  }
  document.cookie = parts.join("; ");
}

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
  writeConsentCookie(status);
}

export function isAnalyticsAllowed(): boolean {
  return getConsent() === "accepted";
}
