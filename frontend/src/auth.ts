export type Role = "SUPER_ADMIN" | "OWNER" | "EMPLOYEE" | "GUEST";

export type AuthState = {
  token: string;
  role: Role;
  email: string;
};

const STORAGE_KEY = "gym_auth";

export function saveAuth(auth: AuthState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function decodeEmailFromJwt(token: string): string {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.sub || "";
  } catch {
    return "";
  }
}

export function loadAuth(): AuthState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthState;
    if (parsed && parsed.token && !parsed.email) {
      parsed.email = decodeEmailFromJwt(parsed.token);
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function decodeRoleFromJwt(token: string): Role {
  const payload = token.split(".")[1];
  const decoded = JSON.parse(atob(payload));
  return decoded.role as Role;
}
