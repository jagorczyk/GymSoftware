import React, { createContext, useContext, useEffect, useState } from "react";
import { getSubdomain } from "./utils/tenant";

interface TenantInfo {
  id: number;
  name: string;
  address?: string;
  city?: string;
  themeColor: string;
  subdomain: string;
}

interface TenantContextType {
  tenant: TenantInfo | null;
  locations: TenantInfo[];
  loading: boolean;
  subdomain: string | null;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  locations: [],
  loading: true,
  subdomain: null,
});

export const useTenant = () => useContext(TenantContext);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [locations, setLocations] = useState<TenantInfo[]>([]);
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
          const data: TenantInfo[] = await response.json();
          if (data && data.length > 0) {
            setLocations(data);
            setTenant(data[0]); // Primary tenant info for branding
            if (data[0].themeColor) {
              document.documentElement.style.setProperty("--theme-color", data[0].themeColor);
            }
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
    <TenantContext.Provider value={{ tenant, locations, loading, subdomain }}>
      {children}
    </TenantContext.Provider>
  );
};
