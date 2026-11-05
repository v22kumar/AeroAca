"use client";

import type { ReactNode } from "react";
import { useGlossary } from "./GlossaryProvider";
import { getTerm } from "@/content/glossary";

/** A tappable word that opens its definition. Rendered for `term:<id>` links in Markdown. */
export function Term({ id, children }: { id: string; children: ReactNode }) {
  const { open } = useGlossary();
  const term = getTerm(id);
  if (!term) return <>{children}</>;
  // The accessible name starts with the visible text (WCAG 2.5.3, label in name), then says what the tap does.
  const visible = typeof children === "string" ? children : term.term;
  return (
    <button type="button" className="term" onClick={() => open(id)} aria-label={`${visible}: show definition`} data-term={id}>
      {children}
    </button>
  );
}
