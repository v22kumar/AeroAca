"use client";

import Link from "next/link";
import { useState } from "react";
import { diagnostic } from "@/content/diagnostic";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { diagnosticMinutes, nextUnanswered, startHere } from "@/lib/progress/diagnostic";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ExerciseView } from "@/components/lesson/exercises/ExerciseView";
import { StartHereList } from "./StartHereList";

/**
 * The starting-level diagnostic. One question at a time, the first answer counts, no
 * score. At the end the "Start here" list names the foundation lessons behind each wrong
 * answer. The learner can skip it and still use everything; nothing is gated on it.
 */
export function DiagnosticView() {
  const { state, store, hydrated } = useProgress();
  const [answeredNow, setAnsweredNow] = useState(false);

  if (!hydrated) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4" aria-busy="true">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const sh = startHere(state);
  const index = nextUnanswered(state);
  const answered = Object.keys(state.diagnostic?.answers ?? {}).length;

  if (sh.status === "done") {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Header />
        <Card className="p-5" data-testid="diagnostic-result">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Your starting point</p>
          <h2 className="mt-1 text-xl font-bold leading-snug">
            {sh.lessons.length === 0 ? "Day 1 of the fast track is the right start." : `${sh.lessons.length === 1 ? "One lesson" : `${sh.lessons.length} lessons`} to take before day 1.`}
          </h2>
          <p className="mt-2 text-sm text-ink-2">
            {sh.correct} of {sh.questions} answered correctly on the first try. The list below comes only from the questions you missed; each line names the foundation the question tested. Nothing here is a score or a level.
          </p>
          <StartHereList lessons={sh.lessons} />
          <div className="mt-4 flex flex-wrap gap-2">
            <LinkButton href="/" data-testid="diagnostic-to-today">
              Go to Today
            </LinkButton>
            <Button variant="secondary" onClick={() => store.resetDiagnostic()} data-testid="diagnostic-retake">
              Retake
            </Button>
          </div>
        </Card>
        <Honesty />
      </div>
    );
  }

  if (index === null) {
    // every question answered but not yet marked complete (reload between the last answer and the summary)
    store.completeDiagnostic();
    return null;
  }

  const q = diagnostic[index]!;
  const isLast = index === diagnostic.length - 1;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Header />
      <p className="text-xs text-ink-3" data-testid="diagnostic-progress">
        Question {answered + 1} of {diagnostic.length} · {q.topic} · about {diagnosticMinutes()} min in total
      </p>
      <Card className="p-4" data-testid="diagnostic-question">
        <ExerciseView
          key={q.exercise.id}
          exercise={q.exercise}
          solvedEarlier={false}
          onResult={(correct) => {
            if (!state.diagnostic?.answers[q.exercise.id]) store.recordDiagnosticAnswer(q.exercise.id, correct);
            setAnsweredNow(true);
          }}
        />
        <div className="mt-4 flex items-center justify-between gap-3">
          <button type="button" className="text-sm font-semibold text-ink-3 underline underline-offset-2" onClick={() => store.skipDiagnostic()} data-testid="diagnostic-skip">
            Skip the diagnostic
          </button>
          <Button
            disabled={!answeredNow}
            data-testid="diagnostic-next"
            onClick={() => {
              setAnsweredNow(false);
              if (isLast) store.completeDiagnostic();
            }}
          >
            {isLast ? "See your starting point" : "Next question"}
          </Button>
        </div>
        {!answeredNow && <p className="mt-2 text-xs text-ink-3">Your first answer is the one that counts; the explanation after it is already teaching.</p>}
      </Card>
      <Honesty />
    </div>
  );
}

function Header() {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Find your starting level</p>
      <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-tight md:text-3xl">Fourteen questions, then a starting point.</h1>
      <p className="mt-2 text-[15px] text-ink-2">
        The 30-day fast track assumes some foundations: circuit laws, logic levels, C integers and pointers, UART and I2C basics, the two bench instruments, what a testable requirement is. This checks each one once. Wrong answers point at the lesson that teaches that foundation; right answers mean day 1 is your start.
      </p>
    </div>
  );
}

function Honesty() {
  return (
    <p className="text-xs text-ink-3">
      No score, no level, no ranking. The result is a list of lessons and the reasons for each, stored on this device like everything else. You can retake it from the result page, or skip it and start at day 1;{" "}
      <Link href="/" className="font-semibold text-accent underline underline-offset-2">
        back to Today
      </Link>
      .
    </p>
  );
}
