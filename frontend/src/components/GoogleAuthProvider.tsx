import { type ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export function isGoogleAuthEnabled(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.trim().length > 0);
}

export function isValidGoogleClientId(): boolean {
  if (!GOOGLE_CLIENT_ID) return false;
  return /^[\w-]+\.apps\.googleusercontent\.com$/.test(GOOGLE_CLIENT_ID.trim());
}

export function getGoogleClientId(): string | undefined {
  return isValidGoogleClientId() ? GOOGLE_CLIENT_ID!.trim() : undefined;
}

export function GoogleAuthProvider({ children }: { children: ReactNode }) {
  const clientId = getGoogleClientId();
  if (!clientId) {
    return <>{children}</>;
  }
  return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
}
