import { createContext, useContext, useState, type ReactNode } from "react";

type SelectedGymBrandContextValue = {
  brandName: string;
  setBrandName: (name: string) => void;
};

const SelectedGymBrandContext = createContext<SelectedGymBrandContextValue>({
  brandName: "",
  setBrandName: () => {},
});

export function SelectedGymBrandProvider(props: { children: ReactNode }) {
  const { children } = props;
  const [brandName, setBrandName] = useState("");

  return (
    <SelectedGymBrandContext.Provider value={{ brandName, setBrandName }}>
      {children}
    </SelectedGymBrandContext.Provider>
  );
}

export function useSelectedGymBrand() {
  return useContext(SelectedGymBrandContext);
}
