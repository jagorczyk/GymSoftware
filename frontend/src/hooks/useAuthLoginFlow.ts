import { NavigateFunction } from "react-router-dom";
import { AuthLoginResult, isMfaPending } from "../authMfa";

export async function routeAuthLoginResult(
  result: AuthLoginResult,
  navigate: NavigateFunction,
  onToken: (token: string) => Promise<unknown>
): Promise<void> {
  if (isMfaPending(result)) {
    navigate("/mfa", {
      state: {
        mfaToken: result.mfaToken,
        setup: result.mfaSetupRequired,
      },
    });
    return;
  }
  if (!result.token) {
    throw new Error("Brak tokenu uwierzytelniającego");
  }
  await onToken(result.token);
}
