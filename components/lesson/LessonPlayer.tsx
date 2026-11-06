"use client";

import Link from "next/link";
import { useQueryParam } from "@/lib/hooks/useQueryParam";
import { interviewItemFor, interviewKey, journeyState, nextItem } from "@/lib/progress/journey";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEPTHS, STAGES, depthRank, type Depth, type Lesson, type LessonStep, type Stage } from "@/lib/content/schema";
import { depthBlurb, depthLabel, depthOfStep, exerciseIdsAt, hiddenAbove, lessonHasDepths, stageLabel, stageOf, visibleStepIndices } from "@/lib/content/depth";
import { getInterviewQuestion, getLesson, getModule, lessonCards, lessonExerciseIds } from "@/lib/content";
import { getLab } from "@/lib/labs/generated";
import { lessonStatus } from "@/lib/progress/selectors";
import type { ProgressState } from "@/lib/progress/schema";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { Markdown } from "@/components/ui/Markdown";
import { Button, LinkButton } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
import { Icon } from "@/components/ui/Icon";
import { StatusPill } from "@/components/ui/StatusPill";
import { Visual } from "@/components/visuals/Visual";
import { ExerciseView } from "./exercises/ExerciseView";
import { InterviewCard } from "@/components/interview/InterviewCard";
import { Card } from "@/components/ui/Card";

const stepLabel: Record<LessonStep["type"], string> = {
  scenario: "Scenario",
  concept: "Concept",
  visual: "Interactive",
  example: "Worked example",
  walkthrough: "Code walkthrough",
  exercise: "Exercise",
  lab: "Run it yourself",
  interview: "Interview question",
  recap: "Recap",
};

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const { state, store, hydrated } = useProgress();
  const steps = lesson.steps;
  const hasDepths = useMemo(() => lessonHasDepths(lesson), [lesson]);
  const requestedStep = Number(useQueryParam("step"));
  const deepLink = Number.isInteger(requestedStep) && requestedStep >= 1 && requestedStep <= steps.length ? requestedStep - 1 : null;
  const requestedDepth = useQueryParam("depth");
  // `override` is null until the learner navigates; before that the index is
  // derived from saved progress so an in-progress lesson resumes where it was.
  const [override, setOverride] = useState<number | null>(null);
  // Depth: the query string wins (links from Today), then a per-lesson choice, then the profile preference.
  const [depthChoice, setDepthChoice] = useState<Depth | null>(null);
  const preferred = state.profile?.depth ?? "understand";
  const queryDepth = requestedDepth === "understand" || requestedDepth === "apply" || requestedDepth === "master" ? (requestedDepth as Depth) : null;
  const deepLinkDepth = deepLink !== null ? depthOfStep(steps[deepLink]!) : null;
  const baseDepth: Depth = hasDepths ? (depthChoice ?? queryDepth ?? preferred) : "master";
  // A deep link into a hidden step raises the depth so the step can be shown.
  const depth: Depth = deepLinkDepth && depthChoice === null && depthRank[deepLinkDepth] > depthRank[baseDepth] ? deepLinkDepth : baseDepth;
  const visible = useMemo(() => visibleStepIndices(lesson, depth), [lesson, depth]);
  const topRef = useRef<HTMLDivElement>(null);
  const lp = state.lessons[lesson.slug];
  const resumeIndex = hydrated && lp && !lp.completedAt ? Math.min(lp.lastStep, steps.length - 1) : 0;
  const rawIndex = override ?? deepLink ?? resumeIndex;
  // If the current step is hidden at this depth, show the nearest visible step before it.
  const index = visible.includes(rawIndex) ? rawIndex : (visible.filter((i) => i <= rawIndex).at(-1) ?? visible[0] ?? 0);
  const position = visible.indexOf(index);
  const exerciseIds = useMemo(() => exerciseIdsAt(lesson, depth), [lesson, depth]);
  const allExerciseIds = useMemo(() => lessonExerciseIds(lesson), [lesson]);
  const cardIds = useMemo(() => lessonCards(lesson).map((c) => c.id), [lesson]);
  const mod = getModule(lesson.moduleId);

  // Register the lesson as started once progress is available.
  useEffect(() => {
    if (hydrated) store.startLesson(lesson.slug);
  }, [hydrated, lesson.slug, store]);

  // Record step views.
  useEffect(() => {
    if (!hydrated) return;
    store.seeStep(lesson.slug, index);
  }, [hydrated, index, lesson.slug, store]);

  // Record time on each step (device-local), so the learner can see real durations and a pilot can learn from them.
  useEffect(() => {
    if (!hydrated) return;
    const started = Date.now();
    const flush = () => store.addStepTime(lesson.slug, index, (Date.now() - started) / 1000);
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      if (document.visibilityState !== "hidden") flush();
    };
  }, [hydrated, index, lesson.slug, store]);

  const step = steps[index]!;
  const isSolved = useCallback((id: string) => Boolean(lp?.exercises[id]?.solvedAt), [lp]);
  const solvedCount = exerciseIds.filter(isSolved).length;
  const allSolved = solvedCount === exerciseIds.length;
  const canAdvance = step.type !== "exercise" || isSolved(step.exercise.id);

  // Complete the lesson when the recap is reached with every exercise at this depth solved.
  useEffect(() => {
    if (!hydrated || step.type !== "recap") return;
    store.completeLesson(lesson.slug, exerciseIds, cardIds, hasDepths ? depth : undefined);
  }, [hydrated, step.type, lesson.slug, exerciseIds, cardIds, store, allSolved, depth, hasDepths]);

  const go = (next: number) => {
    setOverride(Math.max(0, Math.min(steps.length - 1, next)));
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start", behavior: "auto" }));
  };
  const goVisible = (delta: number) => {
    const target = visible[Math.max(0, Math.min(visible.length - 1, position + delta))];
    if (target !== undefined) go(target);
  };
  const chooseDepth = (d: Depth) => {
    setDepthChoice(d);
    store.setDepth(d);
  };

  // The next step comes from the journey, so the recap and Today agree.
  const js = useMemo(() => (hydrated ? journeyState(state) : null), [hydrated, state]);
  const journeyNext = js ? nextItem(js) : null;
  const nextIsOther = journeyNext && !(journeyNext.item.item.kind === "lesson" && journeyNext.item.item.slug === lesson.slug);
  const nextHref = nextIsOther ? (journeyNext.item.href ?? "/") : undefined;
  const nextTitle = nextIsOther ? (journeyNext.item.href ? journeyNext.item.title : `Day ${journeyNext.day.day} checklist`) : undefined;
  const completed = Boolean(lp?.completedAt);
  const hidden = hasDepths ? hiddenAbove(lesson, depth) : [];
  const stage = stageOf(step);
  const label = hasDepths && stage ? stageLabel[stage] : stepLabel[step.type];

  return (
    <div className="mx-auto max-w-2xl" ref={topRef}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/curriculum" className="inline-flex min-w-0 items-center gap-1 text-sm font-semibold text-ink-2 hover:text-ink">
          <Icon name="chevron-left" size={16} className="shrink-0" /> <span className="truncate">{mod?.title ?? "Curriculum"}</span>
        </Link>
        <span className="shrink-0 whitespace-nowrap text-xs text-ink-3">
          {lesson.durationMinutes} min · {exerciseIds.length} exercises
        </span>
      </div>

      <div className="mb-5">
        <h1 className="text-[22px] font-bold leading-tight tracking-tight md:text-2xl">{lesson.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusPill kind={lesson.review.status === "technically-reviewed" ? "reviewed" : "draft"} />
          {hydrated && completed && <StatusPill kind="completed" />}
          {hydrated && completed && hasDepths && lp?.completedDepth && (
            <span className="text-xs text-ink-3" data-testid="completed-depth">
              at {depthLabel[lp.completedDepth]} depth
            </span>
          )}
        </div>
      </div>

      {hasDepths && <DepthSelector depth={depth} onChange={chooseDepth} />}

      <ol className="mb-2 flex gap-1" aria-label="Lesson steps">
        {visible.map((i) => {
          const s = steps[i]!;
          const seen = lp?.stepsSeen.includes(i);
          const current = i === index;
          const solved = s.type === "exercise" ? isSolved(s.exercise.id) : undefined;
          return (
            <li key={i} className="flex-1">
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Step ${visible.indexOf(i) + 1}: ${hasDepths && stageOf(s) ? stageLabel[stageOf(s)!] : stepLabel[s.type]}${current ? " (current)" : ""}${solved ? " (solved)" : ""}`}
                aria-current={current ? "step" : undefined}
                className={`block h-2 w-full rounded-full transition-colors ${current ? "bg-accent" : solved ? "bg-ok" : seen ? "bg-accent/40" : "bg-surface-2"} ${s.type === "exercise" ? "h-2.5" : ""}`}
              />
            </li>
          );
        })}
      </ol>
      {hasDepths && <LessonMap lesson={lesson} visible={visible} index={index} goTo={go} />}

      <div key={index} className="mt-4 animate-fade-up">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent" data-testid="step-heading">
          Step {position + 1} of {visible.length} · {label}
        </p>
        <StepBody
          step={step}
          lesson={lesson}
          progress={hydrated ? state : null}
          solvedEarlier={step.type === "exercise" ? isSolved(step.exercise.id) : false}
          onExerciseResult={(id, correct, hints) => store.recordAttempt(lesson.slug, id, correct, hints)}
          allSolved={allSolved}
          solvedCount={solvedCount}
          exerciseTotal={exerciseIds.length}
          depth={hasDepths ? depth : undefined}
          hiddenExercises={allExerciseIds.length - exerciseIds.length}
          onDeeper={hasDepths ? chooseDepth : undefined}
          unsolvedSteps={visible.filter((i) => steps[i]!.type === "exercise" && !isSolved((steps[i] as Extract<LessonStep, { type: "exercise" }>).exercise.id))}
          goTo={go}
          nextHref={nextHref}
          nextTitle={nextTitle}
          interviewJourneyKey={(() => {
            if (!js) return undefined;
            const current = js.currentDay;
            return lesson.steps.some((s) => s.type === "interview" && interviewItemFor(js, current, s.questionId)) ? interviewKey(current) : undefined;
          })()}
        />
      </div>

      <div className="sticky bottom-16 z-30 mt-8 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface/95 p-2 shadow-card backdrop-blur md:bottom-4">
        <Button variant="secondary" onClick={() => goVisible(-1)} disabled={position === 0} aria-label="Previous step">
          <Icon name="chevron-left" size={18} /> Back
        </Button>
        <span className="text-xs text-ink-3" aria-live="polite">
          {solvedCount}/{exerciseIds.length} solved
        </span>
        {position < visible.length - 1 ? (
          <Button onClick={() => goVisible(1)} disabled={!canAdvance} aria-label="Next step" data-testid="next-step" title={canAdvance ? undefined : "Solve the exercise to continue"}>
            Next <Icon name="chevron-right" size={18} />
          </Button>
        ) : (
          <LinkButton href="/" variant="secondary">
            Today
          </LinkButton>
        )}
      </div>
      {!canAdvance && <p className="mt-2 text-center text-xs text-ink-3">Solve this exercise to unlock the next step. Retry as often as you like; every attempt is practice, not a penalty.</p>}
      {index === 0 && <p className="mt-2 text-center text-xs text-ink-3">Dotted words open a plain-language definition. Tap any of them when something is unclear.</p>}
      {hidden.length > 0 && (
        <p className="mt-2 text-center text-xs text-ink-3" data-testid="hidden-steps">
          {hidden.map((h) => `${h.steps} more ${h.steps === 1 ? "step" : "steps"} at ${depthLabel[h.depth]} depth`).join(" · ")}. Switch depth above whenever you want them.
        </p>
      )}
    </div>
  );
}

/** Understand → Apply → Master. Switching keeps the step and every solved exercise. */
function DepthSelector({ depth, onChange }: { depth: Depth; onChange: (d: Depth) => void }) {
  return (
    <div className="mb-4 rounded-2xl border border-line bg-surface p-3" data-testid="depth-selector">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">Depth</p>
        <p className="text-xs text-ink-3">Switch any time; nothing you solved is lost.</p>
      </div>
      <div role="radiogroup" aria-label="Lesson depth" className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1">
        {DEPTHS.map((d) => (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={d === depth}
            data-testid={`depth-${d}`}
            onClick={() => onChange(d)}
            className={`min-h-10 rounded-lg px-2 text-sm font-semibold transition-colors ${d === depth ? "bg-surface text-accent shadow-card" : "text-ink-2 hover:text-ink"}`}
          >
            {depthLabel[d]}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-ink-2" data-testid="depth-blurb">
        {depthBlurb[depth]}
      </p>
    </div>
  );
}

/** The nine-stage arc as a row of chips: where this lesson is going and where the learner is now. */
function LessonMap({ lesson, visible, index, goTo }: { lesson: Lesson; visible: number[]; index: number; goTo: (i: number) => void }) {
  const current = stageOf(lesson.steps[index]!);
  const firstOf = (stage: Stage) => visible.find((i) => stageOf(lesson.steps[i]!) === stage);
  const present = STAGES.filter((st) => firstOf(st) !== undefined);
  return (
    <ol className="mb-1 flex flex-wrap gap-1.5" aria-label="Lesson map" data-testid="lesson-map">
      {present.map((st) => {
        const i = firstOf(st)!;
        const active = st === current;
        return (
          <li key={st}>
            <button
              type="button"
              onClick={() => goTo(i)}
              aria-current={active ? "step" : undefined}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${active ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-ink-3 hover:text-ink"}`}
            >
              {stageLabel[st]}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function StepBody({
  step,
  lesson,
  progress,
  solvedEarlier,
  onExerciseResult,
  allSolved,
  solvedCount,
  exerciseTotal,
  depth,
  hiddenExercises,
  onDeeper,
  unsolvedSteps,
  goTo,
  nextHref,
  nextTitle,
  interviewJourneyKey,
}: {
  step: LessonStep;
  lesson: Lesson;
  progress: ProgressState | null;
  solvedEarlier: boolean;
  onExerciseResult: (id: string, correct: boolean, hints: number) => void;
  allSolved: boolean;
  solvedCount: number;
  exerciseTotal: number;
  depth?: Depth;
  hiddenExercises: number;
  onDeeper?: (d: Depth) => void;
  unsolvedSteps: number[];
  goTo: (i: number) => void;
  nextHref?: string;
  nextTitle?: string;
  interviewJourneyKey?: string;
}) {
  switch (step.type) {
    case "scenario":
      return (
        <section>
          <h2 className="mb-3 text-xl font-bold">{step.title}</h2>
          <Markdown>{step.body}</Markdown>
          <div className="mt-5 flex gap-3 rounded-xl border border-accent/25 bg-accent-soft/60 p-3 text-sm">
            <span className="mt-0.5 shrink-0 text-accent" aria-hidden>
              <Icon name="spark" size={18} />
            </span>
            <div>
              <p className="font-semibold text-accent">Why this matters for your next role</p>
              <p className="mt-0.5 text-ink">{lesson.whyItMatters}</p>
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-line bg-surface-2/60 p-3 text-sm">
            <p className="font-semibold">In this lesson you will be able to</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-ink-2">
              {lesson.objectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
          <Prerequisites lesson={lesson} progress={progress} />
        </section>
      );
    case "lab":
      return <LabStep step={step} />;
    case "concept":
      return (
        <section>
          <h2 className="mb-3 text-xl font-bold">{step.title}</h2>
          <Markdown>{step.body}</Markdown>
          {step.deeper && (
            <Disclosure title={`Go deeper: ${step.deeper.title}`} className="mt-4">
              <Markdown size="sm">{step.deeper.body}</Markdown>
            </Disclosure>
          )}
        </section>
      );
    case "visual":
      return (
        <section>
          <h2 className="mb-3 text-xl font-bold">{step.title}</h2>
          {step.body && (
            <div className="mb-3">
              <Markdown>{step.body}</Markdown>
            </div>
          )}
          <Card className="p-3 sm:p-4">
            <Visual id={step.visual} />
          </Card>
          <div className="mt-2 text-xs text-ink-3">
            <Markdown size="sm">{step.caption}</Markdown>
          </div>
        </section>
      );
    case "example":
      return (
        <section>
          <h2 className="mb-3 text-xl font-bold">{step.title}</h2>
          <Markdown>{step.body}</Markdown>
        </section>
      );
    case "walkthrough":
      return <WalkthroughStep step={step} />;
    case "exercise":
      return (
        <section>
          <ExerciseView key={step.exercise.id} exercise={step.exercise} solvedEarlier={solvedEarlier} onResult={(correct, hints) => onExerciseResult(step.exercise.id, correct, hints)} />
        </section>
      );
    case "interview": {
      const q = getInterviewQuestion(step.questionId);
      if (!q) return <p className="text-danger">Interview question missing.</p>;
      return (
        <section>
          {step.intro && (
            <div className="mb-4 text-ink-2">
              <Markdown>{step.intro}</Markdown>
            </div>
          )}
          <Card className="p-4">
            <InterviewCard question={q} journeyKey={interviewJourneyKey} />
          </Card>
        </section>
      );
    }
    case "recap":
      return (
        <section className="flex flex-col gap-5">
          {allSolved ? (
            <Card className="border-ok/40 bg-ok-soft/40 p-4" data-testid="lesson-complete">
              <p className="flex items-center gap-2 text-base font-bold text-ok">
                <Icon name="check" size={18} /> {depth ? `Lesson complete at ${depthLabel[depth]} depth.` : "Lesson complete."} Nicely reasoned.
              </p>
              <p className="mt-1 text-sm text-ink-2">
                All {exerciseTotal} {depth ? `${depthLabel[depth]}-depth ` : ""}exercises solved, every one of them by working it out. {lessonCards(lesson).length} review cards from this lesson are now in your spaced review queue.
                {depth && hiddenExercises > 0 && ` ${hiddenExercises} more ${hiddenExercises === 1 ? "exercise waits" : "exercises wait"} at a deeper level; nothing here claims you have done them.`}
              </p>
              {depth && depth !== "master" && onDeeper && (
                <div className="mt-2">
                  <Button size="sm" variant="secondary" onClick={() => onDeeper(depth === "understand" ? "apply" : "master")} data-testid="go-deeper">
                    Continue at {depthLabel[depth === "understand" ? "apply" : "master"]} depth
                  </Button>
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {nextHref && nextTitle && (
                  <LinkButton href={nextHref} data-testid="next-item">
                    Next: {nextTitle}
                  </LinkButton>
                )}
                <LinkButton href="/review" variant="secondary">
                  Review cards
                </LinkButton>
              </div>
            </Card>
          ) : (
            <Card className="border-amber/40 bg-amber-soft/40 p-4" data-testid="lesson-incomplete">
              <p className="text-base font-bold text-amber">Not complete yet</p>
              <p className="mt-1 text-sm text-ink-2">
                {solvedCount} of {exerciseTotal} exercises solved. The lesson is marked complete only when every exercise has been answered correctly.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {unsolvedSteps.map((i) => (
                  <Button key={i} size="sm" variant="secondary" onClick={() => goTo(i)}>
                    Go to step {i + 1}
                  </Button>
                ))}
              </div>
            </Card>
          )}
          <div>
            <h2 className="mb-2 text-xl font-bold">Recap</h2>
            <Markdown>{step.summary}</Markdown>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">Review cards</h3>
            <ul className="flex flex-col gap-2">
              {step.cards.map((c) => (
                <li key={c.id}>
                  <Disclosure title={c.front}>
                    <Markdown size="sm">{c.back}</Markdown>
                  </Disclosure>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-3">References</h3>
            <ul className="flex flex-col gap-2 text-sm">
              {lesson.references.map((r) => (
                <li key={r.title} className="rounded-lg border border-line bg-surface px-3 py-2">
                  {r.url ? (
                    <a href={r.url} target="_blank" rel="noreferrer noopener" className="font-semibold text-accent underline underline-offset-2">
                      {r.title}
                    </a>
                  ) : (
                    <span className="font-semibold">{r.title}</span>
                  )}
                  {r.id && <span className="ml-2 font-mono text-xs text-ink-3">{r.id}</span>}
                  {r.note && <p className="mt-0.5 text-xs text-ink-2">{r.note}</p>}
                </li>
              ))}
            </ul>
            {lesson.review.note && <p className="mt-2 text-xs text-ink-3">Review note: {lesson.review.note}</p>}
          </div>
        </section>
      );
  }
}

/**
 * "Before this lesson": the lessons this one rests on, each with its completion state, so a
 * learner who lands here from a recommendation or a search has a path back to the basics.
 * Nothing is locked; the card informs, it does not gate.
 */
function Prerequisites({ lesson, progress }: { lesson: Lesson; progress: ProgressState | null }) {
  const pre = (lesson.prerequisites ?? []).map((slug) => getLesson(slug)).filter((l): l is Lesson => Boolean(l));
  if (pre.length === 0) {
    return (
      <p className="mt-3 text-sm text-ink-3" data-testid="prerequisites-none">
        No prerequisites: this lesson is a starting point.
      </p>
    );
  }
  return (
    <div className="mt-3 rounded-xl border border-line bg-surface p-3 text-sm" data-testid="prerequisites">
      <p className="font-semibold">Before this lesson</p>
      <p className="mt-0.5 text-xs text-ink-3">This lesson builds on these. Open any you have not completed if a step here feels like a jump.</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {pre.map((p) => {
          const status = progress ? lessonStatus(progress, p) : "not-started";
          return (
            <li key={p.slug} className="flex items-center justify-between gap-3">
              <Link href={`/lessons/${p.slug}`} className="min-w-0 flex-1 truncate font-medium text-accent underline underline-offset-2">
                {p.title}
              </Link>
              <StatusPill kind={status} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const languageLabel: Record<string, string> = { c: "C", cpp: "C++", python: "Python 3", bash: "shell" };

/** A runnable lab: the exact source, the command, and the output the learner should see. */
function LabStep({ step }: { step: Extract<LessonStep, { type: "lab" }> }) {
  const lab = getLab(step.lab);
  if (!lab) return <p className="text-danger">Lab {step.lab} is missing from labs/manifest.json.</p>;
  return (
    <section className="flex flex-col gap-4" data-testid="lab-step">
      <h2 className="text-xl font-bold">{step.title}</h2>
      <Markdown>{step.body}</Markdown>
      <div className="rounded-xl border border-accent/25 bg-accent-soft/50 px-3 py-2 text-sm">
        <span className="font-semibold text-accent">Runs on your PC · </span>
        <span className="text-ink-2">
          {languageLabel[lab.language] ?? lab.language}. Save the file as <code>{lab.file}</code>, run the command from that folder, compare with the expected output. The same program is built and run in the academy&apos;s CI, so the expected output is verified, not a promise. Set-up for Windows, macOS and Linux is in the <a href="https://github.com/v22kumar/AeroAca/blob/main/docs/LOCAL_LAB.md" target="_blank" rel="noreferrer noopener" className="font-semibold text-accent underline underline-offset-2">local lab guide</a>.
        </span>
      </div>
      <CodeBlock code={lab.code} label={lab.file} language={lab.language} testId="lab-code" />
      <CodeBlock code={lab.command} label="Command" language="bash" testId="lab-command" />
      <CodeBlock code={lab.expectedOutput} label="Expected output" testId="lab-expected" />
      {step.tryNext && (
        <Disclosure title="Try next: change one thing and predict the result">
          <Markdown size="sm">{step.tryNext}</Markdown>
        </Disclosure>
      )}
    </section>
  );
}


/** Code with a line-by-line account: the code block, then each note against the lines it explains. */
function WalkthroughStep({ step }: { step: Extract<LessonStep, { type: "walkthrough" }> }) {
  const lines = step.code.split("\n");
  const range = (spec: string) => {
    const [a, b] = spec.split("-").map(Number);
    return [a!, b ?? a!] as const;
  };
  return (
    <section className="flex flex-col gap-4" data-testid="walkthrough">
      <h2 className="text-xl font-bold">{step.title}</h2>
      {step.intro && <Markdown>{step.intro}</Markdown>}
      <CodeBlock code={step.code} label={`${languageLabel[step.language] ?? step.language}, ${lines.length} lines`} language={step.language} testId="walkthrough-code" />
      <ol className="flex flex-col gap-2" aria-label="Line by line">
        {step.notes.map((n) => {
          const [a, b] = range(n.lines);
          const excerpt = lines.slice(a - 1, b).join("\n");
          return (
            <li key={n.lines} className="rounded-xl border border-line bg-surface p-3" data-testid="walkthrough-note">
              <p className="mb-1 font-mono text-xs font-semibold text-accent">
                {a === b ? `Line ${a}` : `Lines ${a} to ${b}`}
              </p>
              <pre
                className="mb-2 overflow-x-auto rounded-lg bg-surface-2 px-3 py-2 font-mono text-[12.5px] leading-relaxed text-ink-2 focus:outline-2 focus:outline-accent"
                tabIndex={0}
                role="region"
                aria-label={a === b ? `Code, line ${a}` : `Code, lines ${a} to ${b}`}
              >
                <code>{excerpt}</code>
              </pre>
              <Markdown size="sm">{n.text}</Markdown>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
