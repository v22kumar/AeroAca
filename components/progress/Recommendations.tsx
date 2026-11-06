"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { recommendations } from "@/lib/progress/recommend";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

const kindLabel = { retry: "Retry", lesson: "Lesson", mission: "Mission", interview: "Rehearse" } as const;

/** Next steps derived from recorded evidence only, each with the facts behind it. */
export function Recommendations({ limit = 4, heading = "Recommended next, from your own evidence" }: { limit?: number; heading?: string }) {
  const { state, hydrated } = useProgress();
  const recs = useMemo(() => (hydrated ? recommendations(state, limit) : []), [hydrated, state, limit]);
  if (!hydrated || recs.length === 0) return null;
  return (
    <section aria-labelledby="recs-heading" data-testid="recommendations">
      <SectionTitle className="mb-2">
        <span id="recs-heading">{heading}</span>
      </SectionTitle>
      <Card>
        <ul className="divide-y divide-line">
          {recs.map((r) => (
            <li key={r.id}>
              <Link href={r.href} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-2" data-testid={`rec-${r.kind}`}>
                <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${r.kind === "retry" ? "bg-amber-soft text-amber" : "bg-accent-soft text-accent"}`}>{kindLabel[r.kind]}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium">{r.title}</span>
                  <span className="block text-xs text-ink-3">{r.reason}</span>
                </span>
                <Icon name="chevron-right" size={18} className="mt-1 shrink-0 text-ink-3" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
      <p className="mt-1 text-xs text-ink-3">Nothing here is a prediction. Each line names the wrong answers, ratings or gaps it comes from.</p>
    </section>
  );
}
