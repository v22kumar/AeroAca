"use client";

import type { ReactNode } from "react";
import { useGlossary } from "./GlossaryProvider";
import { getTerm } from "@/content/glossary";

/** A tappable word that opens its definition. Rendered for `term:<id>` links in Markdown. */
export function Term({ id, children }: { id: string; children: ReactNode }) {
  const { open } = useGlossary();
  const term = getTerm(id);
  if (!term) return <>{children}</>;
  return (
    <button type="button" className="term" onClick={() => open(id)} aria-label={`${term.term}: show definition`} data-term={id}>
      {children}
    </button>
  );
}
