"use client";

import { useProgress } from "@/lib/progress/ProgressProvider";
import { startHere } from "@/lib/progress/diagnostic";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { StartHereList } from "./StartHereList";

/**
 * On Today: offers the diagnostic to a new learner, then shows the "Start here" lessons
 * until they are completed. Disappears once there is nothing to say.
 */
export function StartHereCard() {
  const { state, store, hydrated } = useProgress();
  if (!hydrated) return null;
  const sh = startHere(state);
  const anyLessonCompleted = Object.values(state.lessons).some((l) => l.completedAt);

  if (sh.status === "not-taken" && !anyLessonCompleted) {
    return (
      <Card className="p-4" data-testid="start-here-offer">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">New here?</p>
        <h2 className="mt-1 text-lg font-bold leading-snug">Find your starting level in about {sh.minutes} minutes.</h2>
        <p className="mt-1 text-sm text-ink-2">
          {sh.questions} short questions on the foundations the 30 days assume. Wrong answers become a short list of lessons to take first; right answers confirm day 1. No score is kept.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <LinkButton href="/start" data-testid="start-here-cta">
            Start the diagnostic
          </LinkButton>
          <Button variant="secondary" onClick={() => store.skipDiagnostic()} data-testid="start-here-skip">
            Skip, begin at day 1
          </Button>
        </div>
      </Card>
    );
  }

  if (sh.status === "in-progress") {
    return (
      <Card className="p-4" data-testid="start-here-resume">
        <p className="text-sm">
          Diagnostic in progress: {sh.answered} of {sh.questions} answered.{" "}
          <LinkButton href="/start" size="sm" variant="secondary" className="ml-2">
            Continue
          </LinkButton>
        </p>
      </Card>
    );
  }

  if (sh.status === "done" && sh.lessons.length > 0) {
    return (
      <Card className="p-4" data-testid="start-here">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Start here</p>
        <h2 className="mt-1 text-lg font-bold leading-snug">
          {sh.lessons.length === 1 ? "One foundation lesson" : `${sh.lessons.length} foundation lessons`} before day 1, from your diagnostic.
        </h2>
        <StartHereList lessons={sh.lessons} />
        <p className="mt-2 text-xs text-ink-3">Each disappears when you complete it. Day 1 is waiting below whenever you prefer to start there.</p>
      </Card>
    );
  }

  return null;
}
