"use client";

import type { ReactNode } from "react";
import { useProgress } from "@/lib/progress/ProgressProvider";

/** Renders a fallback until device-local progress has been read, avoiding hydration mismatches. */
export function Hydrated({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const { hydrated } = useProgress();
  return <>{hydrated ? children : fallback}</>;
}
