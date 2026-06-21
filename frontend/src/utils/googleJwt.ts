export function decodeGoogleIdToken(idToken: string): {
  email?: string;
  given_name?: string;
  family_name?: string;
} {
  try {
    const payload = idToken.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return {};
  }
}
