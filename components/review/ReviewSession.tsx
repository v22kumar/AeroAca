"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQueryParam } from "@/lib/hooks/useQueryParam";
import { journeyState, reviewKey } from "@/lib/progress/journey";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { dueCards, enrolledCards } from "@/lib/progress/selectors";
import { targetedReview } from "@/lib/progress/targeted";
import { TargetedReview } from "./TargetedReview";
import { Card } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { Markdown } from "@/components/ui/Markdown";
import { Skeleton } from "@/components/ui/Skeleton";

export function ReviewSession() {
  const { state, store, hydrated } = useProgress();
  // The queue is frozen on the first answer so cards do not reshuffle mid-session
  // (answering a card moves its due date, which would otherwise drop it from the list).
  const [sessionStart] = useState(() => Date.now());
  const [frozenIds, setFrozenIds] = useState<string[] | null>(null);
  const liveQueue = useMemo(() => (hydrated ? dueCards(state, sessionStart) : []), [hydrated, state, sessionStart]);
  const queue = useMemo(() => {
    if (!frozenIds) return liveQueue;
    const all = enrolledCards(state);
    return frozenIds.map((id) => all.find((c) => c.card.id === id)).filter((c): c is (typeof all)[number] => Boolean(c));
  }, [frozenIds, liveQueue, state]);
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState<{ good: number; again: number }>({ good: 0, again: 0 });
  const targets = useMemo(() => targetedReview(state), [state]);
  const dayParam = Number(useQueryParam("day"));

  // A review session counts for the journey once the queue is empty with cards enrolled:
  // either the learner answered every due card, or checked in when nothing was due.
  useEffect(() => {
    if (!hydrated) return;
    if (enrolledCards(state).length === 0 || queue[pos]) return;
    const js = journeyState(state, sessionStart);
    const day = dayParam || js.currentDay;
    if (js.days[day - 1]?.items.some((i) => i.item.kind === "review")) store.setJourneyDone(reviewKey(day));
  }, [hydrated, state, queue, pos, dayParam, sessionStart, store]);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-2xl" aria-busy="true">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-4 h-48 w-full" />
      </div>
    );
  }

  const enrolled = enrolledCards(state).length;
  const current = queue[pos];

  const header = (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Spaced review</p>
      <h1 className="mt-1 text-[26px] font-bold leading-tight tracking-tight md:text-3xl">Recall, then check.</h1>
    </div>
  );

  if (enrolled === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        {header}
        <Card className="p-5 text-sm text-ink-2">
          <p>No cards yet. Review cards are added when you complete a lesson, so finish one first.</p>
          <LinkButton href="/curriculum" className="mt-4" variant="secondary">
            Go to the curriculum
          </LinkButton>
        </Card>
        <TargetedReview groups={targets} />
      </div>
    );
  }

  if (!current) {
    const nextDue = enrolledCards(state)
      .map(({ card }) => state.review[card.id]?.due ?? 0)
      .filter((d) => d > sessionStart)
      .sort((a, b) => a - b)[0];
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        {header}
        <Card className="p-5 text-sm" data-testid="review-done">
          {done.good + done.again > 0 ? (
            <p className="font-semibold">Session finished: {done.good} recalled, {done.again} to see again soon.</p>
          ) : (
            <p className="font-semibold">Nothing due right now.</p>
          )}
          <p className="mt-1 text-ink-2">
            {enrolled} cards enrolled.{nextDue ? ` Next card due ${new Date(nextDue).toLocaleString()}.` : ""}
          </p>
          <div className="mt-4 flex gap-2">
            <LinkButton href="/" variant="secondary">
              Today
            </LinkButton>
            <LinkButton href="/progress" variant="ghost">
              Progress
            </LinkButton>
          </div>
        </Card>
        <TargetedReview groups={targets} />
      </div>
    );
  }

  const answer = (result: "again" | "good") => {
    if (!frozenIds) setFrozenIds(queue.map((c) => c.card.id));
    store.reviewCard(current.card.id, result);
    setDone((d) => ({ ...d, [result]: d[result] + 1 }));
    setFlipped(false);
    setPos((p) => p + 1);
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      {header}
      <p className="text-sm text-ink-3">
        Card {pos + 1} of {queue.length} · from{" "}
        <Link href={`/lessons/${current.lessonSlug}`} className="text-accent underline underline-offset-2">
          {current.lessonTitle}
        </Link>
      </p>
      <Card className="p-5" data-testid="review-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Question</p>
        <div className="mt-1 text-lg font-semibold">
          <Markdown>{current.card.front}</Markdown>
        </div>
        {flipped ? (
          <div className="mt-4 border-t border-line pt-4 animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Answer</p>
            <div className="mt-1">
              <Markdown>{current.card.back}</Markdown>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-ink-2">Say the answer to yourself before revealing it.</p>
        )}
      </Card>
      {!flipped ? (
        <Button size="lg" onClick={() => setFlipped(true)} data-testid="reveal-card">
          Reveal answer
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" size="lg" onClick={() => answer("again")} data-testid="card-again">
            Again
          </Button>
          <Button size="lg" onClick={() => answer("good")} data-testid="card-good">
            Got it
          </Button>
        </div>
      )}
    </div>
  );
}
