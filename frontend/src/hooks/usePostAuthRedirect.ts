import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getCheckoutUrl, getOwnerGyms } from "../api";
import { useAuth } from "../authContext";
import { useTenant } from "../tenantContext";
import type { AuthState } from "../auth";

export function usePostAuthRedirect() {
  const { login: saveLogin } = useAuth();
  const { subdomain } = useTenant();
  const navigate = useNavigate();

  const redirectAfterAuth = useCallback(
    async (token: string) => {
      const next = saveLogin(token);

      if (!subdomain && next.role === "OWNER") {
        try {
          const gyms = await getOwnerGyms(next);
          if (gyms.length > 0 && gyms[0].subdomain) {
            const proto = window.location.protocol;
            const host = window.location.host;
            window.location.href = `${proto}//${gyms[0].subdomain}.${host}/owner/dashboard`;
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
              ? "/superadmin/dashboard"
              : "/client/dashboard";
      navigate(dest, { replace: true });
      return next;
    },
    [saveLogin, subdomain, navigate]
  );

  return { redirectAfterAuth };
}

export async function redirectOwnerToStripeCheckout(auth: AuthState, showError: (msg: string) => void) {
  const gyms = await getOwnerGyms(auth);
  if (gyms && gyms.length > 0) {
    const { checkoutUrl } = await getCheckoutUrl(auth, gyms[0].id);
    window.location.href = checkoutUrl;
  } else {
    showError("Nie znaleziono przypisanej siłowni.");
  }
}
