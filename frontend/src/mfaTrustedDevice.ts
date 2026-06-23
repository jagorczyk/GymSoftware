import { getAuthCookieDomain } from "./auth";

const MFA_DEVICE_COOKIE = "gym_mfa_device";
const MFA_DEVICE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "path=/",
    `max-age=${maxAgeSeconds}`,
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

export function loadMfaTrustedDeviceToken(): string | null {
  const token = readCookie(MFA_DEVICE_COOKIE);
  return token && token.length > 0 ? token : null;
}

export function saveMfaTrustedDeviceToken(token: string): void {
  writeCookie(MFA_DEVICE_COOKIE, token, MFA_DEVICE_MAX_AGE_SECONDS);
}

export function clearMfaTrustedDeviceToken(): void {
  writeCookie(MFA_DEVICE_COOKIE, "", 0);
}

export function withTrustedDeviceToken<T extends Record<string, unknown>>(body: T): T & { trustedDeviceToken?: string } {
  const trustedDeviceToken = loadMfaTrustedDeviceToken();
  if (!trustedDeviceToken) {
    return body;
  }
  return { ...body, trustedDeviceToken };
}
