"use client";

import { useMemo } from "react";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { moduleReadiness } from "@/lib/progress/readiness";
import { Card, SectionTitle } from "@/components/ui/Card";

const tone: Record<string, string> = {
  "no evidence yet": "bg-surface-2 text-ink-3",
  started: "bg-amber-soft text-amber",
  "lessons complete": "bg-accent-soft text-accent",
  "lessons and missions complete": "bg-accent-soft text-accent",
  "evidence complete": "bg-ok-soft text-ok",
};

/** Readiness as evidence per module with the gaps spelled out; no percentages anywhere. */
export function ReadinessView() {
  const { state, hydrated } = useProgress();
  const rows = useMemo(() => (hydrated ? moduleReadiness(state) : []), [hydrated, state]);
  if (!hydrated) return null;
  const complete = rows.filter((r) => r.status === "evidence complete").length;
  return (
    <section aria-labelledby="readiness-heading" data-testid="readiness">
      <SectionTitle className="mb-2">
        <span id="readiness-heading">Readiness by module, explained</span>
      </SectionTitle>
      <p className="mb-2 text-sm text-ink-2" data-testid="readiness-summary">
        {complete} of {rows.length} modules have complete evidence: every lesson completed, every mission solved with evidence, every interview question rated confident, no open wrong answers. The rest list exactly what is missing.
      </p>
      <Card>
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li key={r.moduleId} className="px-4 py-3" data-testid={`readiness-${r.moduleId}`}>
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1 text-[15px] font-semibold">
                  {r.number}. {r.title}
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone[r.status]}`}>{r.status}</span>
              </div>
              <p className="mt-1 text-xs text-ink-3">
                Lessons {r.lessons.completed}/{r.lessons.total} completed · missions {r.missions.solved}/{r.missions.total} solved · interview {r.interview.confident}/{r.interview.total} confident ({r.interview.rated} rated)
                {r.openWrong ? ` · ${r.openWrong} open wrong` : ""}
              </p>
              {r.gaps.length > 0 && <p className="mt-1 text-xs text-ink-2">Missing: {r.gaps.join("; ")}.</p>}
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
