export type AuthLoginResult = {
  token: string | null;
  mfaRequired: boolean;
  mfaSetupRequired: boolean;
  mfaToken: string | null;
  trustedDeviceToken: string | null;
};

export function normalizeAuthLoginResult(raw: Partial<AuthLoginResult> & { token?: string | null }): AuthLoginResult {
  return {
    token: raw.token ?? null,
    mfaRequired: Boolean(raw.mfaRequired),
    mfaSetupRequired: Boolean(raw.mfaSetupRequired),
    mfaToken: raw.mfaToken ?? null,
    trustedDeviceToken: raw.trustedDeviceToken ?? null,
  };
}

export function isMfaPending(result: AuthLoginResult): boolean {
  return Boolean(result.mfaToken && (result.mfaRequired || result.mfaSetupRequired));
}
