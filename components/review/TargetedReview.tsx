"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import type { targetedReview } from "@/lib/progress/targeted";

/**
 * Targeted revision from real mistakes: exercises answered wrongly or left unsolved,
 * grouped by skill, each with a direct link back to that step. No mastery percentages.
 */
export function TargetedReview({ groups }: { groups: ReturnType<typeof targetedReview> }) {
  return (
    <section aria-labelledby="targeted-heading" className="flex flex-col gap-2" data-testid="targeted-review">
      <h2 id="targeted-heading" className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">
        Targeted review from your own mistakes
      </h2>
      {groups.length === 0 ? (
        <Card className="p-4 text-sm text-ink-2">Nothing to target yet. When an exercise goes wrong, or is left unsolved, it appears here with a link straight back to that step.</Card>
      ) : (
        <Card>
          <ul className="divide-y divide-line">
            {groups.map((g) => (
              <li key={g.skill} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[15px] font-semibold">{g.label}</p>
                  <p className="text-xs text-ink-3">{g.wrong} wrong attempt{g.wrong === 1 ? "" : "s"}</p>
                </div>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {g.targets.map((t) => (
                    <li key={t.exerciseId}>
                      <Link href={`/lessons/${t.lessonSlug}?step=${t.stepIndex + 1}`} className="flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2" data-testid={`retry-${t.exerciseId}`}>
                        <Icon name="refresh" size={16} className="mt-0.5 shrink-0 text-accent" />
                        <span className="min-w-0 flex-1">
                          <span className="block">{t.objective}</span>
                          <span className="block text-xs text-ink-3">
                            {t.lessonTitle} · step {t.stepIndex + 1} · {t.solved ? `solved after ${t.wrong} wrong` : t.wrong ? `${t.wrong} wrong, not yet solved` : "not yet solved"}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-semibold text-accent">Retry</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}
