export type Role = "SUPER_ADMIN" | "OWNER" | "EMPLOYEE" | "GUEST";

export type AuthState = {
  token: string;
  role: Role;
  email: string;
};

const AUTH_COOKIE = "gym_auth";
const LEGACY_STORAGE_KEY = "gym_auth";
const AUTH_MAX_AGE_SECONDS = 60 * 60 * 24;

export function getAuthCookieDomain(): string | undefined {
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return ".localhost";
  }
  if (hostname === "gymlos.pl" || hostname.endsWith(".gymlos.pl")) {
    return ".gymlos.pl";
  }
  return undefined;
}

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `path=/`,
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

function clearCookie(name: string): void {
  writeCookie(name, "", 0);
}

function parseAuthState(raw: string | null): AuthState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthState;
    if (!parsed?.token) return null;
    const role = parsed.role || safeDecodeRoleFromJwt(parsed.token);
    const email = parsed.email || decodeEmailFromJwt(parsed.token);
    if (!role) return null;
    return { token: parsed.token, role, email };
  } catch {
    return null;
  }
}

export function saveAuth(auth: AuthState): void {
  const payload = JSON.stringify(auth);
  writeCookie(AUTH_COOKIE, payload, AUTH_MAX_AGE_SECONDS);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function decodeEmailFromJwt(token: string): string {
  try {
    const payload = token.split(".")[1];
    if (!payload) return "";
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.sub || "";
  } catch {
    return "";
  }
}

export function safeDecodeRoleFromJwt(token: string): Role | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.role as Role;
  } catch {
    return null;
  }
}

export function loadAuth(): AuthState | null {
  const fromCookie = parseAuthState(readCookie(AUTH_COOKIE));
  if (fromCookie) {
    return fromCookie;
  }

  const legacy = parseAuthState(localStorage.getItem(LEGACY_STORAGE_KEY));
  if (legacy) {
    saveAuth(legacy);
    return legacy;
  }

  return null;
}

export function clearAuth(): void {
  clearCookie(AUTH_COOKIE);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export function decodeRoleFromJwt(token: string): Role {
  const role = safeDecodeRoleFromJwt(token);
  if (!role) {
    throw new Error("Nieprawidłowy token uwierzytelniający");
  }
  return role;
}

export function isMainAuthDomain(): boolean {
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "gymlos.pl" || hostname === "www.gymlos.pl";
}

export const OWNER_STRIPE_CHECKOUT_KEY = "owner_stripe_checkout_pending";
const IMPERSONATION_BACKUP_KEY = "gym_impersonation_backup";

export function isImpersonationToken(token: string): boolean {
  try {
    const payload = token.split(".")[1];
    if (!payload) return false;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.imp === true;
  } catch {
    return false;
  }
}

export function saveImpersonationBackup(auth: AuthState): void {
  try {
    sessionStorage.setItem(IMPERSONATION_BACKUP_KEY, JSON.stringify(auth));
  } catch {
    // ignore storage errors
  }
}

export function loadImpersonationBackup(): AuthState | null {
  try {
    return parseAuthState(sessionStorage.getItem(IMPERSONATION_BACKUP_KEY));
  } catch {
    return null;
  }
}

export function clearImpersonationBackup(): void {
  try {
    sessionStorage.removeItem(IMPERSONATION_BACKUP_KEY);
  } catch {
    // ignore storage errors
  }
}

export function isOwnerStripeCheckoutPending(): boolean {
  try {
    return sessionStorage.getItem(OWNER_STRIPE_CHECKOUT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setOwnerStripeCheckoutPending(pending: boolean): void {
  try {
    if (pending) {
      sessionStorage.setItem(OWNER_STRIPE_CHECKOUT_KEY, "1");
    } else {
      sessionStorage.removeItem(OWNER_STRIPE_CHECKOUT_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function buildCentralLoginUrl(returnTo?: string): string {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port ? `:${window.location.port}` : "";

  let loginOrigin: string;
  if (hostname.endsWith(".localhost")) {
    loginOrigin = `${protocol}//localhost${port}`;
  } else if (hostname.endsWith(".gymlos.pl")) {
    loginOrigin = `${protocol}//gymlos.pl`;
  } else {
    loginOrigin = `${protocol}//${hostname}${port}`;
  }

  const url = new URL("/login", loginOrigin);
  if (returnTo) {
    url.searchParams.set("returnTo", returnTo);
  }
  return url.toString();
}

export function isSafeReturnTo(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    return (
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host === "gymlos.pl" ||
      host.endsWith(".gymlos.pl")
    );
  } catch {
    return false;
  }
}
