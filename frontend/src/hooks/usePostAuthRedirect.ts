import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCheckoutUrl, getOwnerGyms } from "../api";
import { setOwnerStripeCheckoutPending } from "../auth";
import { useAuth } from "../authContext";
import { useTenant } from "../tenantContext";
import { isSafeReturnTo } from "../auth";
import { buildTenantUrl } from "../utils/subdomain";
import type { AuthState } from "../auth";

export function usePostAuthRedirect() {
  const { login: saveLogin } = useAuth();
  const { subdomain } = useTenant();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectAfterAuth = useCallback(
    async (token: string) => {
      const next = saveLogin(token);

      const returnTo = searchParams.get("returnTo");
      if (returnTo && isSafeReturnTo(returnTo)) {
        window.location.href = returnTo;
        return next;
      }

      if (!subdomain && next.role === "OWNER") {
        try {
          const gyms = await getOwnerGyms(next);
          if (gyms.length > 0 && gyms[0].subdomain) {
            window.location.replace(buildTenantUrl(gyms[0].subdomain, "/owner/dashboard"));
            return next;
          }
        } catch (e) {
          console.error("Failed to fetch owner gyms for redirect", e);
        }
      }

      const dest =
        next.role === "OWNER"
          ? "/owner/dashboard"
          : next.role === "EMPLOYEE"
            ? "/employee/dashboard"
            : next.role === "SUPER_ADMIN"
              ? "/superadmin/subscriptions"
              : "/client/dashboard";
      navigate(dest, { replace: true });
      return next;
    },
    [saveLogin, subdomain, navigate, searchParams]
  );

  return { redirectAfterAuth };
}

export async function redirectOwnerToStripeCheckout(auth: AuthState, showError: (msg: string) => void) {
  setOwnerStripeCheckoutPending(true);
  try {
    const gyms = await getOwnerGyms(auth);
    if (gyms && gyms.length > 0) {
      const { checkoutUrl } = await getCheckoutUrl(auth, gyms[0].id);
      window.location.replace(checkoutUrl);
      return;
    }
    setOwnerStripeCheckoutPending(false);
    showError("Nie znaleziono przypisanej siłowni.");
  } catch (err) {
    setOwnerStripeCheckoutPending(false);
    throw err;
  }
}
