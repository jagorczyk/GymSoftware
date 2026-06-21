import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type AppGymOption = {
  id: number;
  name: string;
  address?: string;
  city?: string;
  themeColor?: string;
};

type AppGymSelectorState = {
  gyms: AppGymOption[];
  selectedGymId: number | "";
  onSelectGym: (gymId: number) => void;
};

const defaultState: AppGymSelectorState = {
  gyms: [],
  selectedGymId: "",
  onSelectGym: () => {},
};

const AppGymSelectorContext = createContext<{
  state: AppGymSelectorState;
  setSelectorState: (next: Partial<AppGymSelectorState>) => void;
}>({
  state: defaultState,
  setSelectorState: () => {},
});

export function AppGymSelectorProvider(props: { children: ReactNode }) {
  const { children } = props;
  const [state, setState] = useState<AppGymSelectorState>(defaultState);

  const setSelectorState = useCallback((next: Partial<AppGymSelectorState>) => {
    setState((prev) => {
      let isDifferent = false;
      for (const key in next) {
        if (prev[key as keyof AppGymSelectorState] !== next[key as keyof AppGymSelectorState]) {
          isDifferent = true;
          break;
        }
      }
      if (!isDifferent) return prev;
      return { ...prev, ...next };
    });
  }, []);

  return (
    <AppGymSelectorContext.Provider value={{ state, setSelectorState }}>
      {children}
    </AppGymSelectorContext.Provider>
  );
}

export function useAppGymSelector() {
  return useContext(AppGymSelectorContext);
}
