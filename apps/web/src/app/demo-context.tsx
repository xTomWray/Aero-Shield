/* eslint-disable react-refresh/only-export-components */
import type { DemoDataProvider } from "@aero-shield/domain";
import { createContext, useContext, useSyncExternalStore } from "react";

const DemoProviderContext = createContext<DemoDataProvider | null>(null);

export const DemoProviderContextRoot = DemoProviderContext.Provider;

export const useDemoProvider = (): DemoDataProvider => {
  const provider = useContext(DemoProviderContext);

  if (!provider) {
    throw new Error("Demo provider is missing.");
  }

  return provider;
};

export const useDemoSnapshot = () => {
  const provider = useDemoProvider();
  return useSyncExternalStore(
    (listener) => provider.subscribe(listener),
    () => provider.getSnapshot(),
    () => provider.getSnapshot()
  );
};
