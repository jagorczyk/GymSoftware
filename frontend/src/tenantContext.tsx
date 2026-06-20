import React, { createContext, useContext, useEffect, useState } from "react";
import { getSubdomain } from "./utils/tenant";

interface TenantInfo {
  id: number;
  name: string;
  themeColor: string;
  subdomain: string;
}

interface TenantContextType {
  tenant: TenantInfo | null;
  loading: boolean;
  subdomain: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  loading: true,
  subdomain: null,
});

export const useTenant = () => useContext(TenantContext);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const subdomain = getSubdomain();

  useEffect(() => {
    if (!subdomain) {
      setLoading(false);
      return;
    }

    const fetchTenant = async () => {
      try {
        const response = await fetch(`/api/public/gyms/subdomain/${subdomain}`);
        if (response.ok) {
          const data = await response.json();
          setTenant(data);
          if (data.themeColor) {
            document.documentElement.style.setProperty("--theme-color", data.themeColor);
          }
        } else {
          console.error("Tenant not found");
        }
      } catch (err) {
        console.error("Failed to fetch tenant info", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [subdomain]);

  return (
    <TenantContext.Provider value={{ tenant, loading, subdomain }}>
      {children}
    </TenantContext.Provider>
  );
};
