"use client";

import { journeyBlocks } from "@/lib/content";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { journeyState } from "@/lib/progress/journey";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { JourneyDayChecklist } from "./JourneyDayCard";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

export function JourneyView() {
  const { state, hydrated } = useProgress();
  const [now] = useState(() => Date.now());
  if (!hydrated) {
    return (
      <div className="mx-auto max-w-2xl" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    );
  }
  const js = journeyState(state, now);
  const blocks = [1, 2, 3, 4, 5, 6] as const;
  const daysWithPlanned = js.days.filter((d) => d.plannedCount > 0).length;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">30-day journey</p>
        <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-tight md:text-3xl">One day at a time, in the right order.</h1>
        <p className="mt-2 text-[15px] text-ink-2">
          Each day is a 20 to 40 minute session built around interview readiness. You are on day {js.currentDay}; {js.completedDays} day{js.completedDays === 1 ? "" : "s"} complete. Days with content still to be published are marked, and their lessons are never counted as done.
        </p>
        <p className="mt-1 text-xs text-ink-3">Days 1 to 10 are fully published. {daysWithPlanned} of 30 days still reference lessons that are being written.</p>
      </div>
      {blocks.map((b) => {
        const days = js.days.filter((d) => d.day.block === b);
        const meta = journeyBlocks[b]!;
        return (
          <section key={b} aria-labelledby={`block-${b}`}>
            <h2 id={`block-${b}`} className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">
              Block {b} · Days {meta.days} · {meta.focus}
            </h2>
            <div className="flex flex-col gap-2">
              {days.map((ds) => {
                const current = ds.day.day === js.currentDay;
                return (
                  <Card key={ds.day.day} className={`overflow-hidden ${current ? "border-accent" : ""}`} data-testid={`journey-day-${ds.day.day}`}>
                    <details open={current} className="group">
                      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${ds.complete ? "bg-ok-soft text-ok" : current ? "bg-accent text-on-accent" : "bg-surface-2 text-ink-3"}`} aria-hidden>
                          {ds.complete ? <Icon name="check" size={16} /> : ds.day.day}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-semibold">
                            Day {ds.day.day}: {ds.day.title}
                          </span>
                          <span className="block text-xs text-ink-3">
                            {ds.doneCount}/{ds.availableCount} done · about {ds.minutes} min{ds.plannedCount ? ` · ${ds.plannedCount} coming soon` : ""}
                          </span>
                        </span>
                        <span aria-hidden className="text-ink-3 transition-transform group-open:rotate-90">
                          <Icon name="chevron-right" size={18} />
                        </span>
                      </summary>
                      <p className="border-t border-line px-4 py-2 text-sm text-ink-2">{ds.day.focus}</p>
                      <div className="border-t border-line">
                        <JourneyDayChecklist ds={ds} compact />
                      </div>
                    </details>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
