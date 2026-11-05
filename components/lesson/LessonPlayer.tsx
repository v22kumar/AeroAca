"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Lesson, LessonStep } from "@/lib/content/schema";
import { getInterviewQuestion, getModule, learningPath, lessonCards, lessonExerciseIds } from "@/lib/content";
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
  interview: "Interview question",
  recap: "Recap",
};

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const { state, store, hydrated } = useProgress();
  const steps = lesson.steps;
  // `override` is null until the learner navigates; before that the index is
  // derived from saved progress so an in-progress lesson resumes where it was.
  const [override, setOverride] = useState<number | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const lp = state.lessons[lesson.slug];
  const resumeIndex = hydrated && lp && !lp.completedAt ? Math.min(lp.lastStep, steps.length - 1) : 0;
  const index = override ?? resumeIndex;
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

  const path = learningPath();
  const pathIdx = path.findIndex((p) => p.kind === "lesson" && p.slug === lesson.slug);
  const nextItem = pathIdx >= 0 ? path[pathIdx + 1] : undefined;
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
          solvedEarlier={step.type === "exercise" ? isSolved(step.exercise.id) : false}
          onExerciseResult={(id, correct) => store.recordAttempt(lesson.slug, id, correct)}
          allSolved={allSolved}
          solvedCount={solvedCount}
          exerciseTotal={exerciseIds.length}
          unsolvedSteps={steps.map((s, i) => ({ s, i })).filter(({ s }) => s.type === "exercise" && !isSolved(s.exercise.id)).map(({ i }) => i)}
          goTo={go}
          nextHref={nextItem ? `/${nextItem.kind === "lesson" ? "lessons" : "missions"}/${nextItem.slug}` : undefined}
          nextTitle={nextItem?.title}
          nextKind={nextItem?.kind}
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
      {!canAdvance && <p className="mt-2 text-center text-xs text-ink-3">Solve this exercise to unlock the next step. You can retry as often as you like.</p>}
    </div>
  );
}

function StepBody({
  step,
  lesson,
  solvedEarlier,
  onExerciseResult,
  allSolved,
  solvedCount,
  exerciseTotal,
  unsolvedSteps,
  goTo,
  nextHref,
  nextTitle,
  nextKind,
}: {
  step: LessonStep;
  lesson: Lesson;
  solvedEarlier: boolean;
  onExerciseResult: (id: string, correct: boolean) => void;
  allSolved: boolean;
  solvedCount: number;
  exerciseTotal: number;
  unsolvedSteps: number[];
  goTo: (i: number) => void;
  nextHref?: string;
  nextTitle?: string;
  nextKind?: "lesson" | "mission";
}) {
  switch (step.type) {
    case "scenario":
      return (
        <section>
          <h2 className="mb-3 text-xl font-bold">{step.title}</h2>
          <Markdown>{step.body}</Markdown>
          <div className="mt-5 rounded-xl border border-line bg-surface-2/60 p-3 text-sm">
            <p className="font-semibold">In this lesson you will be able to</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-ink-2">
              {lesson.objectives.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </div>
        </section>
      );
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
            <InterviewCard question={q} />
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
                <Icon name="check" size={18} /> Lesson complete
              </p>
              <p className="mt-1 text-sm text-ink-2">
                All {exerciseTotal} exercises solved. {lessonCards(lesson).length} review cards from this lesson are now in your spaced review queue.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {nextHref && nextTitle && (
                  <LinkButton href={nextHref} data-testid="next-item">
                    Next {nextKind === "mission" ? "mission" : "lesson"}: {nextTitle}
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
