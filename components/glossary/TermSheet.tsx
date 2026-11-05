"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { getTerm, glossary } from "@/content/glossary";
import { getLesson } from "@/lib/content";
import { Icon } from "@/components/ui/Icon";

/**
 * One shared definition sheet: a bottom sheet on phones, a centred dialog on wider screens.
 * Focus moves to the close button on open and returns to the opener on close.
 */
export function TermSheet({ id, onClose, onOpen }: { id: string | null; onClose: () => void; onOpen: (id: string) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<Element | null>(null);
  const term = id ? getTerm(id) : undefined;

  useEffect(() => {
    if (!term) return;
    openerRef.current = document.activeElement;
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      const opener = openerRef.current;
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [term, onClose]);

  if (!term) return null;
  const lesson = term.relatedLesson ? getLesson(term.relatedLesson) : undefined;
  const related = glossary.filter((g) => g.id !== term.id && g.relatedLesson && g.relatedLesson === term.relatedLesson).slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="presentation">
      <button type="button" aria-label="Close definition" className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="term-title"
        data-testid="term-sheet"
        className="relative max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 pb-safe shadow-card animate-fade-up md:max-w-md md:rounded-3xl"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line-2 md:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Definition</p>
            <h2 id="term-title" className="mt-0.5 text-xl font-bold">
              {term.term}
            </h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-ink-2 hover:text-ink">
            <Icon name="x" size={18} />
          </button>
        </div>
        <p className="mt-3 text-[16px] font-medium leading-relaxed">{term.short}</p>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{term.detail}</p>
        <div className="mt-4 rounded-xl bg-accent-soft/70 px-3 py-2.5 text-sm">
          <span className="font-semibold text-accent">Why it matters · </span>
          <span className="text-ink">{term.why}</span>
        </div>
        {related.length > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-3">Related terms</p>
            <div className="flex flex-wrap gap-1.5">
              {related.map((r) => (
                <button key={r.id} type="button" onClick={() => onOpen(r.id)} className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-semibold text-ink-2 hover:border-accent hover:text-accent">
                  {r.term}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-sm">
          {lesson && (
            <Link href={`/lessons/${lesson.slug}`} onClick={onClose} className="font-semibold text-accent underline underline-offset-2">
              Lesson: {lesson.title}
            </Link>
          )}
          <Link href="/glossary" onClick={onClose} className="text-ink-2 underline underline-offset-2 hover:text-ink">
            All {glossary.length} terms
          </Link>
        </div>
      </div>
    </div>
  );
}
