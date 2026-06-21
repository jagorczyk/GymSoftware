import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { SaasPlanFeatureId } from "./saasPlanFeatures";
import { hasSaasPlanFeature } from "./saasPlanFeatures";

type PlanFeaturesContextValue = {
  featureFlags: string[];
  setFeatureFlags: (flags: string[]) => void;
  hasFeature: (featureId: SaasPlanFeatureId) => boolean;
};

const PlanFeaturesContext = createContext<PlanFeaturesContextValue>({
  featureFlags: [],
  setFeatureFlags: () => {},
  hasFeature: () => true,
});

export function PlanFeaturesProvider({ children }: { children: ReactNode }) {
  const [featureFlags, setFeatureFlagsState] = useState<string[]>([]);

  const setFeatureFlags = useCallback((flags: string[]) => {
    setFeatureFlagsState(flags);
  }, []);

  const hasFeature = useCallback(
    (featureId: SaasPlanFeatureId) => hasSaasPlanFeature(featureFlags, featureId),
    [featureFlags]
  );

  return (
    <PlanFeaturesContext.Provider value={{ featureFlags, setFeatureFlags, hasFeature }}>
      {children}
    </PlanFeaturesContext.Provider>
  );
}

export function usePlanFeatures() {
  return useContext(PlanFeaturesContext);
}
