"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { glossary } from "@/content/glossary";
import { getLesson } from "@/lib/content";
import { Card } from "@/components/ui/Card";
import { Disclosure } from "@/components/ui/Disclosure";
import { Icon } from "@/components/ui/Icon";

export function GlossaryView() {
  const [q, setQ] = useState("");
  const sorted = useMemo(() => [...glossary].sort((a, b) => a.term.localeCompare(b.term, "en", { sensitivity: "base" })), []);
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return sorted;
    return sorted.filter((t) => [t.term, ...(t.aliases ?? []), t.short].some((s) => s.toLowerCase().includes(needle)));
  }, [q, sorted]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Glossary</p>
        <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-tight md:text-3xl">Every term, in plain words.</h1>
        <p className="mt-2 text-[15px] text-ink-2">
          {glossary.length} terms used across the lessons, missions and interview questions. Inside any lesson, dotted words open the same definitions with a tap.
        </p>
      </div>
      <label className="relative block">
        <span className="sr-only">Search terms</span>
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">
          <Icon name="search" size={18} />
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search, e.g. pull-up, volatile, NRST"
          className="min-h-12 w-full rounded-xl border border-line bg-surface pl-10 pr-3 text-[15px] text-ink placeholder:text-ink-3"
          data-testid="glossary-search"
        />
      </label>
      {visible.length === 0 ? (
        <Card className="p-5 text-sm text-ink-2">No term matches “{q}”. Try a shorter word.</Card>
      ) : (
        <ul className="flex flex-col gap-2" data-testid="glossary-list">
          {visible.map((t) => {
            const lesson = t.relatedLesson ? getLesson(t.relatedLesson) : undefined;
            return (
              <li key={t.id}>
                <Disclosure title={t.term} className="bg-surface">
                  <p className="text-[15px] font-medium">{t.short}</p>
                  <p className="mt-2 text-sm text-ink-2">{t.detail}</p>
                  <p className="mt-2 text-sm">
                    <span className="font-semibold text-accent">Why it matters · </span>
                    {t.why}
                  </p>
                  {t.aliases && t.aliases.length > 0 && <p className="mt-2 text-xs text-ink-3">Also: {t.aliases.join(", ")}</p>}
                  {lesson && (
                    <Link href={`/lessons/${lesson.slug}`} className="mt-2 inline-block text-sm font-semibold text-accent underline underline-offset-2">
                      Lesson: {lesson.title}
                    </Link>
                  )}
                </Disclosure>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
