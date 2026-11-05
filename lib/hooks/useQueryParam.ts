"use client";

import { useCallback, useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  return () => window.removeEventListener("popstate", cb);
};

/**
 * Reads a URL query parameter without forcing the page out of static prerendering
 * (unlike next/navigation's useSearchParams, which needs a Suspense boundary and
 * client-side rendering). Server snapshot is null; the client re-renders with the
 * real value after hydration.
 */
export function useQueryParam(name: string): string | null {
  const getSnapshot = useCallback(() => new URLSearchParams(window.location.search).get(name), [name]);
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
