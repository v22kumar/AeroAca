"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { TermSheet } from "./TermSheet";

type Ctx = { open: (id: string) => void; close: () => void; openId: string | null };
const GlossaryContext = createContext<Ctx | null>(null);

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = useCallback((id: string) => setOpenId(id), []);
  const close = useCallback(() => setOpenId(null), []);
  const value = useMemo(() => ({ open, close, openId }), [open, close, openId]);
  return (
    <GlossaryContext.Provider value={value}>
      {children}
      <TermSheet id={openId} onClose={close} onOpen={open} />
    </GlossaryContext.Provider>
  );
}

export function useGlossary(): Ctx {
  const ctx = useContext(GlossaryContext);
  if (!ctx) throw new Error("useGlossary must be used inside GlossaryProvider");
  return ctx;
}
