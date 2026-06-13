import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { clearAuth, decodeRoleFromJwt, decodeEmailFromJwt, loadAuth, saveAuth, type AuthState } from "./auth";

type AuthContextValue = {
  auth: AuthState | null;
  login: (token: string) => AuthState;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider(props: { children: ReactNode }) {
  const { children } = props;
  const [auth, setAuth] = useState<AuthState | null>(() => loadAuth());

  const login = useCallback((token: string) => {
    const next: AuthState = {
      token,
      role: decodeRoleFromJwt(token),
      email: decodeEmailFromJwt(token),
    };
    saveAuth(next);
    setAuth(next);
    return next;
  }, []);

  const logout = useCallback(() => {
    clearAuth();
    setAuth(null);
  }, []);

  useEffect(() => {
    const handleJwtExpired = () => logout();
    window.addEventListener("jwt_expired", handleJwtExpired);
    return () => window.removeEventListener("jwt_expired", handleJwtExpired);
  }, [logout]);

  const value = useMemo(() => ({ auth, login, logout }), [auth, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
