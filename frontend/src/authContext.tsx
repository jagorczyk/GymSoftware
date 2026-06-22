import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { clearAuth, clearImpersonationBackup, decodeEmailFromJwt, isImpersonationToken, loadAuth, loadImpersonationBackup, saveAuth, saveImpersonationBackup, safeDecodeRoleFromJwt, type AuthState } from "./auth";

type AuthContextValue = {
  auth: AuthState | null;
  login: (token: string) => AuthState;
  logout: () => void;
  startImpersonation: (token: string) => AuthState;
  endImpersonation: () => boolean;
  isImpersonating: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider(props: { children: ReactNode }) {
  const { children } = props;
  const [auth, setAuth] = useState<AuthState | null>(() => loadAuth());

  const login = useCallback((token: string) => {
    const role = safeDecodeRoleFromJwt(token);
    if (!role) {
      clearAuth();
      throw new Error("Nieprawidłowy token uwierzytelniający");
    }
    const next: AuthState = {
      token,
      role,
      email: decodeEmailFromJwt(token),
    };
    saveAuth(next);
    setAuth(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    clearImpersonationBackup();
    clearAuth();
    setAuth(null);
  }, []);

  const startImpersonation = useCallback((token: string) => {
    const role = safeDecodeRoleFromJwt(token);
    if (!role) {
      throw new Error("Nieprawidłowy token impersonacji");
    }
    setAuth((current) => {
      if (current && !isImpersonationToken(current.token)) {
        saveImpersonationBackup(current);
      }
      const next: AuthState = {
        token,
        role,
        email: decodeEmailFromJwt(token),
      };
      saveAuth(next);
      return next;
    });
    return {
      token,
      role,
      email: decodeEmailFromJwt(token),
    };
  }, []);

  const endImpersonation = useCallback(() => {
    const backup = loadImpersonationBackup();
    if (!backup) {
      return false;
    }
    clearImpersonationBackup();
    saveAuth(backup);
    setAuth(backup);
    return true;
  }, []);

  const isImpersonating = auth ? isImpersonationToken(auth.token) : false;

  useEffect(() => {
    const handleJwtExpired = () => logout();
    window.addEventListener("jwt_expired", handleJwtExpired);
    return () => window.removeEventListener("jwt_expired", handleJwtExpired);
  }, [logout]);

  const value = useMemo(
    () => ({ auth, login, logout, startImpersonation, endImpersonation, isImpersonating }),
    [auth, login, logout, startImpersonation, endImpersonation, isImpersonating]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
