import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import type { AuthState } from "../auth";
import { getEmployeeGyms, getOwnerGyms } from "../api";
import { buildTenantUrl, resolveGymSubdomainRedirect } from "../utils/subdomain";
import { getSubdomain } from "../utils/tenant";

export function useGymSubdomainGuard(auth: AuthState | null, role: "OWNER" | "EMPLOYEE") {
  const location = useLocation();
  const currentSubdomain = getSubdomain();
  const [redirecting, setRedirecting] = useState(() => auth?.role === role);

  useEffect(() => {
    if (!auth || auth.role !== role) {
      setRedirecting(false);
      return;
    }

    setRedirecting(true);
    const loadGyms = role === "OWNER" ? getOwnerGyms(auth) : getEmployeeGyms(auth);

    loadGyms
      .then((gyms) => {
        const subdomains = gyms.map((gym) => gym.subdomain);
        const targetSubdomain = resolveGymSubdomainRedirect(currentSubdomain, subdomains);
        if (!targetSubdomain) {
          setRedirecting(false);
          return;
        }

        const targetPath = `${location.pathname}${location.search}${location.hash}`;
        window.location.replace(buildTenantUrl(targetSubdomain, targetPath));
      })
      .catch(() => setRedirecting(false));
  }, [auth, role, currentSubdomain, location.pathname, location.search, location.hash]);

  return redirecting;
}
