"use client";

import { useProgress } from "@/lib/progress/ProgressProvider";
import { journeyState } from "@/lib/progress/journey";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { JourneySessionChecklist } from "./JourneySessionCard";
import { CareerLadder } from "./CareerLadder";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";

export function JourneyView() {
  const { state, hydrated } = useProgress();
  const [now] = useState(() => Date.now());
  const js = useMemo(() => journeyState(state, now), [state, now]);
  if (!hydrated) {
    return (
      <div className="mx-auto max-w-2xl" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    );
  }
  const total = js.sessions.length;
  const withPlanned = js.sessions.filter((s) => s.plannedCount > 0).length;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Career track</p>
        <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-tight md:text-3xl">Stage by stage, in the right order.</h1>
        <p className="mt-2 text-[15px] text-ink-2">
          Six stages, {total} sessions of 15 to 45 minutes, no calendar. Each stage ends with something you can defend in an interview, and names the rung of the career ladder that evidence belongs to. You are in stage {js.currentStage}, session {js.currentSession}; {js.completedStages} stage{js.completedStages === 1 ? "" : "s"} and {js.completedSessions} session{js.completedSessions === 1 ? "" : "s"} complete.
        </p>
        <p className="mt-1 text-xs text-ink-3" data-testid="journey-published">
          {js.lastFullyPublishedSession >= total ? `All ${total} sessions are published.` : `Sessions 1 to ${js.lastFullyPublishedSession} are fully published. ${withPlanned} of ${total} sessions still reference lessons that are being written.`}
        </p>
      </div>

      {js.stages.map((st) => (
        <section key={st.stage.stage} aria-labelledby={`stage-${st.stage.stage}`} data-testid={`journey-stage-${st.stage.stage}`}>
          <Card className={`mb-2 overflow-hidden ${st.current ? "border-accent" : ""}`}>
            <div className="px-4 py-3">
              <h2 id={`stage-${st.stage.stage}`} className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${st.complete ? "bg-ok-soft text-ok" : st.current ? "bg-accent text-on-accent" : "bg-surface-2 text-ink-3"}`} aria-hidden>
                  {st.complete ? <Icon name="check" size={14} /> : st.stage.stage}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold">
                    Stage {st.stage.stage}: {st.stage.title}
                  </span>
                  <span className="block text-xs text-ink-3">
                    Sessions {st.first} to {st.last} · {st.completedSessions}/{st.sessions.length} complete{st.current ? " · you are here" : ""}
                  </span>
                </span>
              </h2>
              <p className="mt-2 text-sm text-ink-2">{st.stage.focus}</p>
              <div className="mt-2">
                <ProgressBar value={st.completedSessions} max={st.sessions.length} label={`Stage ${st.stage.stage} progress`} />
              </div>
              <p className="mt-3 text-sm">
                <span className="font-semibold">After this stage:</span> <span className="text-ink-2">{st.stage.outcome}</span>
              </p>
              <p className="mt-1 text-xs text-ink-3">
                Evidence for <a href="#ladder-heading" className="font-semibold text-accent underline underline-offset-2">{ladderTitle(st.stage.ladderLevel)}</a> on the career ladder.
              </p>
            </div>
          </Card>
          <div className="flex flex-col gap-2 pl-2 sm:pl-4">
            {st.sessions.map((ss) => {
              const current = ss.session.session === js.currentSession;
              return (
                <Card key={ss.session.session} className={`overflow-hidden ${current ? "border-accent" : ""}`} data-testid={`journey-session-${ss.session.session}`}>
                  <details open={current} className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${ss.complete ? "bg-ok-soft text-ok" : current ? "bg-accent text-on-accent" : "bg-surface-2 text-ink-3"}`} aria-hidden>
                        {ss.complete ? <Icon name="check" size={16} /> : ss.session.session}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold">
                          Session {ss.session.session}: {ss.session.title}
                        </span>
                        <span className="block text-xs text-ink-3">
                          {ss.doneCount}/{ss.availableCount} done · about {ss.minutes} min{ss.plannedCount ? ` · ${ss.plannedCount} coming soon` : ""}
                        </span>
                      </span>
                      <span aria-hidden className="text-ink-3 transition-transform group-open:rotate-90">
                        <Icon name="chevron-right" size={18} />
                      </span>
                    </summary>
                    <p className="border-t border-line px-4 py-2 text-sm text-ink-2">{ss.session.focus}</p>
                    <div className="border-t border-line">
                      <JourneySessionChecklist ss={ss} compact />
                    </div>
                  </details>
                </Card>
              );
            })}
          </div>
        </section>
      ))}

      <CareerLadder />
    </div>
  );
}

function ladderTitle(id: string) {
  const n = id.replace("level-", "");
  return `level ${n}`;
}
