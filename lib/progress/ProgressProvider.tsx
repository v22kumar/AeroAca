"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { getBrowserStore, ProgressStore } from "./store";
import { emptyProgress, type ProgressState } from "./schema";

type ProgressContextValue = {
  state: ProgressState;
  /** False during SSR and the first client render, before localStorage has been read. */
  hydrated: boolean;
  store: ProgressStore;
};

const serverSnapshot = emptyProgress(0);

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children, store: injected }: { children: ReactNode; store?: ProgressStore }) {
  const store = useMemo(() => injected ?? getBrowserStore(), [injected]);

  // Reading localStorage is a side effect; the store emits when done and the
  // external-store subscriptions below pick up both the state and the flag.
  useEffect(() => {
    store.load();
  }, [store]);

  const state = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.getState(),
    () => serverSnapshot,
  );
  const hydrated = useSyncExternalStore(
    (cb) => store.subscribe(cb),
    () => store.isLoaded(),
    () => false,
  );

  const value = useMemo(() => ({ state, hydrated, store }), [state, hydrated, store]);
  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside ProgressProvider");
  return ctx;
}
