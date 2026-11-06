"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Mission, MissionAction } from "@/lib/content/schema";
import { getLesson, getModule } from "@/lib/content";
import { journeyState, nextItem } from "@/lib/progress/journey";
import { availableActions, collectedEvidence, evaluateMission, initialMissionState, missionReducer, type MissionEvent, type MissionState } from "@/lib/learning/mission";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { nowMs } from "@/lib/time";
import { Markdown } from "@/components/ui/Markdown";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { Disclosure } from "@/components/ui/Disclosure";

const categoryLabel: Record<MissionAction["category"], string> = {
  inspect: "Inspect",
  measure: "Measure",
  scope: "Scope / analyser",
  firmware: "Firmware / tools",
  rework: "Rework",
  document: "Documents",
};

const assessmentStyle: Record<MissionAction["assessment"], { label: string; cls: string }> = {
  key: { label: "Key evidence", cls: "bg-ok-soft text-ok" },
  useful: { label: "Useful", cls: "bg-accent-soft text-accent" },
  neutral: { label: "Low information", cls: "bg-surface-2 text-ink-2" },
  wasteful: { label: "Wasteful", cls: "bg-amber-soft text-amber" },
  risky: { label: "Risky", cls: "bg-danger-soft text-danger" },
};

export function MissionPlayer({ mission }: { mission: Mission }) {
  const { store, hydrated, state: progress } = useProgress();
  // The run in progress lives in the progress store, so a reload (common on phones) resumes it.
  const active = hydrated ? progress.activeRuns?.[mission.slug] : undefined;
  const state: MissionState = useMemo(
    () =>
      active
        ? { phase: active.phase, performed: active.performed, minutesUsed: active.minutesUsed, diagnosisId: active.diagnosisId, fixId: active.fixId }
        : initialMissionState,
    [active],
  );
  const topRef = useRef<HTMLDivElement>(null);
  const mod = getModule(mission.moduleId);
  const related = mission.relatedLesson ? getLesson(mission.relatedLesson) : undefined;
  const runs = progress.missions[mission.slug]?.runs ?? [];

  useEffect(() => {
    if (hydrated) store.startMission(mission.slug);
  }, [hydrated, mission.slug, store]);

  const outcome = useMemo(() => (state.phase === "debrief" ? evaluateMission(mission, state) : null), [mission, state]);

  // Append a finished run to history exactly once, even across reloads.
  useEffect(() => {
    if (!outcome || !active || active.recorded) return;
    store.recordMissionRun(mission.slug, {
      startedAt: active.startedAt,
      actions: state.performed,
      minutesUsed: state.minutesUsed,
      diagnosisId: state.diagnosisId ?? "",
      fixId: state.fixId,
      correct: outcome.correct,
      evidenceBacked: outcome.evidenceBacked,
      score: outcome.score,
    });
  }, [outcome, active, store, mission.slug, state]);

  const send = (e: MissionEvent) => {
    if (!hydrated) return;
    if (e.type === "reset") {
      store.clearActiveRun(mission.slug);
    } else {
      const next = missionReducer(mission, state, e);
      if (next === state) return;
      store.setActiveRun(mission.slug, { ...next, startedAt: active?.startedAt ?? nowMs() });
    }
    if (e.type !== "perform") requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start" }));
  };

  const restart = () => send({ type: "reset" });

  const performed = state.performed.map((id) => mission.actions.find((a) => a.id === id)!).filter(Boolean);
  const available = availableActions(mission, state);
  const overBudget = state.minutesUsed > mission.budgetMinutes;
  const js = useMemo(() => (hydrated ? journeyState(progress) : null), [hydrated, progress]);
  const journeyNext = js ? nextItem(js) : null;
  const nextIsOther = journeyNext && !(journeyNext.item.item.kind === "mission" && journeyNext.item.item.slug === mission.slug);
  const nextHrefJ = nextIsOther ? (journeyNext.item.href ?? "/") : undefined;
  const nextTitleJ = nextIsOther ? (journeyNext.item.href ? journeyNext.item.title : `Day ${journeyNext.day.day} checklist`) : undefined;

  return (
    <div className="mx-auto max-w-2xl" ref={topRef}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/curriculum" className="inline-flex min-w-0 items-center gap-1 text-sm font-semibold text-ink-2 hover:text-ink">
          <Icon name="chevron-left" size={16} className="shrink-0" /> <span className="truncate">{mod?.title ?? "Curriculum"}</span>
        </Link>
        <span className="shrink-0 whitespace-nowrap text-xs text-ink-3">Mission · {mission.durationMinutes} min</span>
      </div>
      <div className="mb-4">
        <h1 className="text-[22px] font-bold leading-tight tracking-tight md:text-2xl">{mission.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusPill kind="simulated" />
          {hydrated && runs.some((r) => r.correct && r.evidenceBacked) && <StatusPill kind="completed" />}
          {hydrated && runs.length > 0 && <span className="text-xs text-ink-3">{runs.length} previous run{runs.length > 1 ? "s" : ""}</span>}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2 text-sm" aria-live="polite">
        <span className="flex items-center gap-2 font-semibold">
          <Icon name="clock" size={16} className={overBudget ? "text-amber" : "text-accent"} />
          Bench time
        </span>
        <span className={`font-mono ${overBudget ? "text-amber" : ""}`} data-testid="bench-time">
          {state.minutesUsed} / {mission.budgetMinutes} min
        </span>
      </div>

      {state.phase === "investigate" && (
        <div className="flex flex-col gap-5">
          {performed.length === 0 ? (
            <Card className="p-4">
              <Markdown>{mission.scenario}</Markdown>
              <p className="mt-3 flex gap-2 text-sm text-ink-2">
                <span className="mt-0.5 shrink-0 text-accent" aria-hidden>
                  <Icon name="spark" size={16} />
                </span>
                <span>{mission.whyItMatters}</span>
              </p>
              <div className="mt-3 rounded-lg bg-accent-soft/60 px-3 py-2 text-sm">
                <span className="font-semibold text-accent">Goal · </span>
                <Markdown size="sm" className="inline">
                  {mission.goal}
                </Markdown>
              </div>
            </Card>
          ) : (
            <Disclosure title="Scenario and goal">
              <Markdown size="sm">{mission.scenario}</Markdown>
              <div className="mt-2 text-sm">
                <Markdown size="sm">{mission.goal}</Markdown>
              </div>
            </Disclosure>
          )}

          {performed.length > 0 && (
            <section aria-labelledby="log-heading">
              <h2 id="log-heading" className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">
                Bench log
              </h2>
              <ol className="flex flex-col gap-2">
                {performed.map((a, i) => (
                  <li key={a.id} className="animate-fade-up rounded-xl border border-line bg-surface p-3" data-testid={`log-${a.id}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold">
                        <span className="mr-1 font-mono text-xs text-ink-3">{i + 1}.</span>
                        {a.label}
                      </p>
                      <span className="shrink-0 font-mono text-xs text-ink-3">{a.costMinutes} min</span>
                    </div>
                    <div className="mt-1 text-sm">
                      <Markdown size="sm">{a.result}</Markdown>
                    </div>
                    <div className="mt-2 flex flex-col gap-1 rounded-lg bg-surface-2/70 px-2.5 py-2 text-sm">
                      <span className={`inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-bold ${assessmentStyle[a.assessment].cls}`}>{assessmentStyle[a.assessment].label}</span>
                      <Markdown size="sm">{a.assessmentNote}</Markdown>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section aria-labelledby="actions-heading">
            <h2 id="actions-heading" className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">
              What do you do next?
            </h2>
            {available.length === 0 ? (
              <p className="text-sm text-ink-2">You have exhausted the bench. Time to commit to a diagnosis.</p>
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {available.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => send({ type: "perform", actionId: a.id })}
                      className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5 text-left hover:border-accent hover:bg-surface-2"
                      data-testid={`action-${a.id}`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-medium leading-snug">{a.label}</span>
                        <span className="block text-xs text-ink-3">{categoryLabel[a.category]}</span>
                      </span>
                      <span className="shrink-0 font-mono text-xs text-ink-3">{a.costMinutes} min</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="sticky bottom-16 z-30 rounded-2xl border border-line bg-surface/95 p-2 shadow-card backdrop-blur md:bottom-4">
            <Button size="lg" className="w-full" disabled={performed.length === 0} onClick={() => send({ type: "go-diagnose" })} data-testid="go-diagnose">
              I am ready to diagnose <Icon name="chevron-right" size={18} />
            </Button>
          </div>
        </div>
      )}

      {state.phase === "diagnose" && (
        <DiagnosePhase mission={mission} state={state} onBack={() => send({ type: "back-to-investigate" })} onSubmit={(id) => send({ type: "diagnose", diagnosisId: id })} />
      )}

      {state.phase === "fix" && <FixPhase mission={mission} state={state} onSubmit={(id) => send({ type: "fix", fixId: id })} />}

      {state.phase === "debrief" && outcome && (
        <Debrief
          mission={mission}
          state={state}
          outcome={outcome}
          onRestart={restart}
          nextHref={nextHrefJ}
          nextTitle={nextTitleJ}
          relatedLessonTitle={related?.title}
          relatedLessonHref={related ? `/lessons/${related.slug}` : undefined}
        />
      )}
    </div>
  );
}

function DiagnosePhase({ mission, state, onBack, onSubmit }: { mission: Mission; state: MissionState; onBack: () => void; onSubmit: (id: string) => void }) {
  const [choice, setChoice] = useState<string | null>(null);
  const evidence = collectedEvidence(mission, state);
  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      <Card className="p-4">
        <h2 className="text-lg font-bold">What is the root cause?</h2>
        <p className="mt-1 text-sm text-ink-2">
          You have {state.performed.length} observation{state.performed.length > 1 ? "s" : ""} and {evidence.size} piece{evidence.size === 1 ? "" : "s"} of evidence after {state.minutesUsed} bench-minutes. A reviewer will ask what supports your diagnosis.
        </p>
      </Card>
      <div role="radiogroup" aria-label="Diagnosis" className="flex flex-col gap-2">
        {mission.diagnoses.map((d) => (
          <label key={d.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-[15px] ${choice === d.id ? "border-accent bg-accent-soft/60" : "border-line bg-surface hover:bg-surface-2"}`}>
            <input type="radio" name="diagnosis" value={d.id} checked={choice === d.id} onChange={() => setChoice(d.id)} className="mt-1 h-4 w-4 shrink-0 accent-[var(--c-accent)]" data-testid={`diagnosis-${d.id}`} />
            <span>{d.label}</span>
          </label>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => choice && onSubmit(choice)} disabled={!choice} data-testid="submit-diagnosis">
          Commit to this diagnosis
        </Button>
        <Button variant="secondary" onClick={onBack}>
          Back to the bench
        </Button>
      </div>
    </div>
  );
}

function FixPhase({ mission, state, onSubmit }: { mission: Mission; state: MissionState; onSubmit: (id: string) => void }) {
  const [choice, setChoice] = useState<string | null>(null);
  const diagnosis = mission.diagnoses.find((d) => d.id === state.diagnosisId)!;
  const evidence = collectedEvidence(mission, state);
  const missing = (diagnosis.requiresEvidence ?? []).filter((e) => !evidence.has(e));
  return (
    <div className="flex flex-col gap-4 animate-fade-up">
      <Card className={`p-4 ${diagnosis.correct ? "border-ok/40 bg-ok-soft/40" : "border-amber/40 bg-amber-soft/40"}`} data-testid="diagnosis-feedback" data-correct={diagnosis.correct ? "true" : "false"}>
        <p className={`flex items-center gap-2 text-base font-bold ${diagnosis.correct ? "text-ok" : "text-amber"}`}>
          <Icon name={diagnosis.correct ? "check" : "info"} size={18} />
          {diagnosis.correct ? (missing.length ? "Right answer, thin evidence" : "Correct diagnosis") : "That is not the root cause"}
        </p>
        <div className="mt-1 text-sm">
          <Markdown size="sm">{diagnosis.feedback}</Markdown>
        </div>
        {diagnosis.correct && missing.length > 0 && (
          <p className="mt-2 text-sm text-ink-2">
            You committed without the measurements that justify it. In a design review, &ldquo;I had a feeling&rdquo; does not pass. The debrief will show which actions were missing.
          </p>
        )}
      </Card>
      <div>
        <h2 className="text-lg font-bold">{diagnosis.correct ? "How do you fix it?" : "Suppose the real cause is found. Which fix would you propose?"}</h2>
        <div role="radiogroup" aria-label="Fix" className="mt-2 flex flex-col gap-2">
          {mission.fixes.map((f) => (
            <label key={f.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-[15px] ${choice === f.id ? "border-accent bg-accent-soft/60" : "border-line bg-surface hover:bg-surface-2"}`}>
              <input type="radio" name="fix" value={f.id} checked={choice === f.id} onChange={() => setChoice(f.id)} className="mt-1 h-4 w-4 shrink-0 accent-[var(--c-accent)]" data-testid={`fix-${f.id}`} />
              <span>{f.label}</span>
            </label>
          ))}
        </div>
      </div>
      <Button onClick={() => choice && onSubmit(choice)} disabled={!choice} data-testid="submit-fix">
        Propose this fix
      </Button>
    </div>
  );
}

function Debrief({
  mission,
  state,
  outcome,
  onRestart,
  nextHref,
  nextTitle,
  relatedLessonTitle,
  relatedLessonHref,
}: {
  mission: Mission;
  state: MissionState;
  outcome: ReturnType<typeof evaluateMission>;
  onRestart: () => void;
  nextHref?: string;
  nextTitle?: string;
  relatedLessonTitle?: string;
  relatedLessonHref?: string;
}) {
  const fix = mission.fixes.find((f) => f.id === state.fixId);
  const missingActions = outcome.missingEvidence.map((e) => mission.actions.find((a) => a.evidence === e)?.label ?? e);
  const verdictText = {
    solved: "Solved, with evidence",
    "solved-unjustified": "Right diagnosis, unjustified",
    "not-solved": "Not solved",
  }[outcome.verdict];
  const tone = outcome.verdict === "solved" ? "ok" : outcome.verdict === "solved-unjustified" ? "amber" : "danger";
  return (
    <div className="flex flex-col gap-5 animate-fade-up">
      <Card className={`p-4 ${tone === "ok" ? "border-ok/40 bg-ok-soft/40" : tone === "amber" ? "border-amber/40 bg-amber-soft/40" : "border-danger/40 bg-danger-soft/40"}`} data-testid="mission-outcome" data-verdict={outcome.verdict}>
        <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${tone === "ok" ? "text-ok" : tone === "amber" ? "text-amber" : "text-danger"}`}>Debrief</p>
        <h2 className="mt-1 text-xl font-bold">{verdictText}</h2>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <Metric label="Score" value={`${outcome.score}/100`} />
          <Metric label="Bench time" value={`${outcome.minutesUsed}/${outcome.budgetMinutes} min`} warn={!outcome.withinBudget} />
          <Metric label="Key evidence" value={`${outcome.keyActionsHit}/${outcome.keyActionsTotal}`} />
          <Metric label="Fix" value={outcome.fixQuality === "best" ? "Best" : outcome.fixQuality === "acceptable" ? "Acceptable" : outcome.fixQuality === "wrong" ? "Wrong" : "None"} warn={outcome.fixQuality === "wrong"} />
        </dl>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-2">
          <li>Diagnosis: {outcome.correct ? "correct (50)" : "incorrect (0)"}; evidence: {outcome.evidenceBacked ? "complete (20)" : "incomplete (0)"}.</li>
          <li>Fix quality: {outcome.fixQuality === "best" ? "15" : outcome.fixQuality === "acceptable" ? "8" : "0"}; budget: {outcome.withinBudget ? "within (10)" : "exceeded"}; completion bonus: 5.</li>
          {outcome.riskyActions.length > 0 && <li>Risky actions: {outcome.riskyActions.length} × −10.</li>}
          {outcome.wastefulActions.length > 0 && <li>Wasteful actions: {outcome.wastefulActions.length} × −3.</li>}
        </ul>
        {missingActions.length > 0 && (
          <p className="mt-3 text-sm">
            <span className="font-semibold">Evidence you did not collect:</span> {missingActions.join("; ")}.
          </p>
        )}
      </Card>

      {fix && (
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Your proposed fix</p>
          <p className="mt-1 text-[15px] font-semibold">{fix.label}</p>
          <div className="mt-2 text-sm">
            <Markdown size="sm">{fix.feedback}</Markdown>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Your path vs. an efficient path</p>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="text-sm font-semibold">You ({state.minutesUsed} min)</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-ink-2">
              {state.performed.map((id) => {
                const a = mission.actions.find((x) => x.id === id)!;
                return (
                  <li key={id}>
                    {a.label} <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${assessmentStyle[a.assessment].cls}`}>{assessmentStyle[a.assessment].label}</span>
                  </li>
                );
              })}
            </ol>
          </div>
          <div>
            <p className="text-sm font-semibold">
              Senior engineer ({mission.optimalPath.reduce((n, id) => n + (mission.actions.find((a) => a.id === id)?.costMinutes ?? 0), 0)} min)
            </p>
            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-ink-2">
              {mission.optimalPath.map((id) => (
                <li key={id}>{mission.actions.find((a) => a.id === id)?.label}</li>
              ))}
            </ol>
          </div>
        </div>
      </Card>

      <div>
        <h3 className="mb-2 text-lg font-bold">What this mission teaches</h3>
        <Markdown>{mission.debrief}</Markdown>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">References</h3>
        <ul className="flex flex-col gap-2 text-sm">
          {mission.references.map((r) => (
            <li key={r.title} className="rounded-lg border border-line bg-surface px-3 py-2">
              {r.url ? (
                <a href={r.url} target="_blank" rel="noreferrer noopener" className="font-semibold text-accent underline underline-offset-2">
                  {r.title}
                </a>
              ) : (
                <span className="font-semibold">{r.title}</span>
              )}
              {r.note && <p className="mt-0.5 text-xs text-ink-2">{r.note}</p>}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onRestart} data-testid="mission-restart">
          <Icon name="refresh" size={16} /> Run it again
        </Button>
        {outcome.verdict !== "solved" && relatedLessonHref && (
          <LinkButton href={relatedLessonHref} variant="secondary">
            Revisit: {relatedLessonTitle}
          </LinkButton>
        )}
        {nextHref && (
          <LinkButton href={nextHref} data-testid="next-item">
            Next: {nextTitle}
          </LinkButton>
        )}
        <LinkButton href="/" variant="ghost">
          Today
        </LinkButton>
      </div>
    </div>
  );
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">{label}</dt>
      <dd className={`font-mono font-semibold ${warn ? "text-amber" : ""}`}>{value}</dd>
    </div>
  );
}
