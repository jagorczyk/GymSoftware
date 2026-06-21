import { useEffect, useState } from "react";
import type { AuthState } from "../auth";
import { getEmployeeGyms, getOwnerGyms } from "../api";
import { buildTenantUrl, resolveGymSubdomainRedirect } from "../utils/subdomain";
import { getSubdomain } from "../utils/tenant";

export function useGymSubdomainGuard(auth: AuthState | null, role: "OWNER" | "EMPLOYEE") {
  const currentSubdomain = getSubdomain();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!auth || auth.role !== role) {
      setRedirecting(false);
      return;
    }

    let cancelled = false;
    setRedirecting(true);

    const loadGyms = role === "OWNER" ? getOwnerGyms(auth) : getEmployeeGyms(auth);

    loadGyms
      .then((gyms) => {
        if (cancelled) return;
        const subdomains = gyms.map((gym) => gym.subdomain);
        const targetSubdomain = resolveGymSubdomainRedirect(currentSubdomain, subdomains);
        if (!targetSubdomain) {
          setRedirecting(false);
          return;
        }

        const targetPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.location.replace(buildTenantUrl(targetSubdomain, targetPath));
      })
      .catch(() => {
        if (!cancelled) setRedirecting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [auth, role, currentSubdomain]);

  return redirecting;
}
