"use client";

import Link from "next/link";
import { useQueryParam } from "@/lib/hooks/useQueryParam";
import { interviewItemFor, interviewKey, journeyState, nextItem } from "@/lib/progress/journey";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Lesson, LessonStep } from "@/lib/content/schema";
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
  exercise: "Exercise",
  lab: "Run it yourself",
  interview: "Interview question",
  recap: "Recap",
};

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const { state, store, hydrated } = useProgress();
  const steps = lesson.steps;
  const requestedStep = Number(useQueryParam("step"));
  const deepLink = Number.isInteger(requestedStep) && requestedStep >= 1 && requestedStep <= steps.length ? requestedStep - 1 : null;
  // `override` is null until the learner navigates; before that the index is
  // derived from saved progress so an in-progress lesson resumes where it was.
  const [override, setOverride] = useState<number | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const lp = state.lessons[lesson.slug];
  const resumeIndex = hydrated && lp && !lp.completedAt ? Math.min(lp.lastStep, steps.length - 1) : 0;
  const index = override ?? deepLink ?? resumeIndex;
  const exerciseIds = useMemo(() => lessonExerciseIds(lesson), [lesson]);
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

  const step = steps[index]!;
  const isSolved = useCallback((id: string) => Boolean(lp?.exercises[id]?.solvedAt), [lp]);
  const solvedCount = exerciseIds.filter(isSolved).length;
  const allSolved = solvedCount === exerciseIds.length;
  const canAdvance = step.type !== "exercise" || isSolved(step.exercise.id);

  // Complete the lesson when the recap is reached with every exercise solved.
  useEffect(() => {
    if (!hydrated || step.type !== "recap") return;
    store.completeLesson(lesson.slug, exerciseIds, cardIds);
  }, [hydrated, step.type, lesson.slug, exerciseIds, cardIds, store, allSolved]);

  const go = (next: number) => {
    setOverride(Math.max(0, Math.min(steps.length - 1, next)));
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: "start", behavior: "auto" }));
  };

  // The next step comes from the journey, so the recap and Today agree.
  const js = useMemo(() => (hydrated ? journeyState(state) : null), [hydrated, state]);
  const journeyNext = js ? nextItem(js) : null;
  const nextIsOther = journeyNext && !(journeyNext.item.item.kind === "lesson" && journeyNext.item.item.slug === lesson.slug);
  const nextHref = nextIsOther ? (journeyNext.item.href ?? "/") : undefined;
  const nextTitle = nextIsOther ? (journeyNext.item.href ? journeyNext.item.title : `Day ${journeyNext.day.day} checklist`) : undefined;
  const completed = Boolean(lp?.completedAt);

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
        </div>
      </div>

      <ol className="mb-5 flex gap-1" aria-label="Lesson steps">
        {steps.map((s, i) => {
          const seen = lp?.stepsSeen.includes(i);
          const current = i === index;
          const solved = s.type === "exercise" ? isSolved(s.exercise.id) : undefined;
          return (
            <li key={i} className="flex-1">
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Step ${i + 1}: ${stepLabel[s.type]}${current ? " (current)" : ""}${solved ? " (solved)" : ""}`}
                aria-current={current ? "step" : undefined}
                className={`block h-2 w-full rounded-full transition-colors ${current ? "bg-accent" : solved ? "bg-ok" : seen ? "bg-accent/40" : "bg-surface-2"} ${s.type === "exercise" ? "h-2.5" : ""}`}
              />
            </li>
          );
        })}
      </ol>

      <div key={index} className="animate-fade-up">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
          Step {index + 1} of {steps.length} · {stepLabel[step.type]}
        </p>
        <StepBody
          step={step}
          lesson={lesson}
          progress={hydrated ? state : null}
          solvedEarlier={step.type === "exercise" ? isSolved(step.exercise.id) : false}
          onExerciseResult={(id, correct) => store.recordAttempt(lesson.slug, id, correct)}
          allSolved={allSolved}
          solvedCount={solvedCount}
          exerciseTotal={exerciseIds.length}
          unsolvedSteps={steps.map((s, i) => ({ s, i })).filter(({ s }) => s.type === "exercise" && !isSolved(s.exercise.id)).map(({ i }) => i)}
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
        <Button variant="secondary" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous step">
          <Icon name="chevron-left" size={18} /> Back
        </Button>
        <span className="text-xs text-ink-3" aria-live="polite">
          {solvedCount}/{exerciseIds.length} solved
        </span>
        {index < steps.length - 1 ? (
          <Button onClick={() => go(index + 1)} disabled={!canAdvance} aria-label="Next step" data-testid="next-step" title={canAdvance ? undefined : "Solve the exercise to continue"}>
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
    </div>
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
  onExerciseResult: (id: string, correct: boolean) => void;
  allSolved: boolean;
  solvedCount: number;
  exerciseTotal: number;
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
    case "exercise":
      return (
        <section>
          <ExerciseView key={step.exercise.id} exercise={step.exercise} solvedEarlier={solvedEarlier} onResult={(correct) => onExerciseResult(step.exercise.id, correct)} />
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
                <Icon name="check" size={18} /> Lesson complete. Nicely reasoned.
              </p>
              <p className="mt-1 text-sm text-ink-2">
                All {exerciseTotal} exercises solved, every one of them by working it out. {lessonCards(lesson).length} review cards from this lesson are now in your spaced review queue.
              </p>
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
