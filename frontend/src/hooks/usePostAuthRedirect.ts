import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCheckoutUrl, getEmployeeGyms, getOwnerGymSubscription, getOwnerGyms } from "../api";
import { setOwnerStripeCheckoutPending } from "../auth";
import { useAuth } from "../authContext";
import { useTenant } from "../tenantContext";
import { isSafeReturnTo } from "../auth";
import { buildTenantUrl, resolveGymSubdomainRedirect } from "../utils/subdomain";
import { findGymNeedingOnboarding } from "../utils/gymOnboarding";
import type { AuthState } from "../auth";

/** Przekierowuje do Stripe tylko gdy siłownia wymaga konfiguracji i subskrypcja jest nieopłacona. */
export async function redirectOwnerToPaymentIfNeeded(
  auth: AuthState,
  gyms?: Array<{ id: number; name: string; address: string }>
): Promise<boolean> {
  const gymList = gyms ?? (await getOwnerGyms(auth));
  const gym = findGymNeedingOnboarding(gymList);
  if (!gym) {
    return false;
  }

  const subscription = await getOwnerGymSubscription(auth, gym.id).catch(() => null);
  if (!subscription || subscription.status === "UNPAID") {
    const { checkoutUrl } = await getCheckoutUrl(auth, gym.id);
    window.location.replace(checkoutUrl);
    return true;
  }

  return false;
}

async function redirectToRoleHomeOnOwnSubdomain(
  auth: AuthState,
  currentSubdomain: string | null
): Promise<boolean> {
  if (auth.role === "OWNER") {
    const gyms = await getOwnerGyms(auth);
    const targetSubdomain = resolveGymSubdomainRedirect(
      currentSubdomain,
      gyms.map((gym) => gym.subdomain)
    );
    if (targetSubdomain) {
      window.location.replace(buildTenantUrl(targetSubdomain, "/owner/dashboard"));
      return true;
    }
    return false;
  }

  if (auth.role === "EMPLOYEE") {
    const gyms = await getEmployeeGyms(auth);
    const targetSubdomain = resolveGymSubdomainRedirect(
      currentSubdomain,
      gyms.map((gym) => gym.subdomain)
    );
    if (targetSubdomain) {
      window.location.replace(buildTenantUrl(targetSubdomain, "/employee/dashboard"));
      return true;
    }
    return false;
  }

  return false;
}

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

      if (next.role === "OWNER") {
        try {
          const redirectedToPayment = await redirectOwnerToPaymentIfNeeded(next);
          if (redirectedToPayment) return next;
        } catch (e) {
          console.error("Failed to resolve owner payment redirect", e);
        }
      }

      if (next.role === "OWNER" || next.role === "EMPLOYEE") {
        try {
          const redirected = await redirectToRoleHomeOnOwnSubdomain(next, subdomain);
          if (redirected) return next;
        } catch (e) {
          console.error("Failed to resolve gym subdomain redirect", e);
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
