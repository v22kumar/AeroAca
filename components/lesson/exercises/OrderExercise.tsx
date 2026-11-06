"use client";

import { useMemo, useState } from "react";
import type { OrderExercise as OrderExerciseT } from "@/lib/content/schema";
import { gradeOrder, type GradeResult } from "@/lib/learning/grading";
import { Button } from "@/components/ui/Button";
import { InlineMarkdown, Markdown } from "@/components/ui/Markdown";
import { Icon } from "@/components/ui/Icon";
import { ExerciseFrame } from "./ExerciseFrame";

/** Tap-to-order: tap an item in the pool to append it; tap a placed item to send it back. Works with keyboard and touch, no drag needed. */
export function OrderExercise({ exercise, onResult, solvedEarlier }: { exercise: OrderExerciseT; onResult: (correct: boolean, hints: number) => void; solvedEarlier: boolean }) {
  // Present the pool in a deterministic shuffled order (seeded by id) so it is never already correct.
  const pool = useMemo(() => {
    const items = [...exercise.items];
    const seed = exercise.id.split("").reduce((n, c) => n + c.charCodeAt(0), 0);
    for (let i = items.length - 1; i > 0; i--) {
      const j = (seed * (i + 7) + i * 13) % (i + 1);
      [items[i], items[j]] = [items[j]!, items[i]!];
    }
    if (items.map((i) => i.id).join() === exercise.correctOrder.join()) items.reverse();
    return items;
  }, [exercise]);
  const [placed, setPlaced] = useState<string[]>([]);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const locked = result?.correct === true;
  const remaining = pool.filter((i) => !placed.includes(i.id));

  const check = () => {
    const r = gradeOrder(exercise, placed);
    setResult(r);
    setAttempts((a) => a + 1);
    onResult(r.correct, hintsUsed);
  };

  return (
    <ExerciseFrame objective={exercise.objective} prompt={exercise.prompt} context={exercise.context} hint={exercise.hint} hints={exercise.hints} hintsUsed={hintsUsed} onHint={() => setHintsUsed((h) => h + 1)} result={result} attempts={attempts} solvedEarlier={solvedEarlier}>
      <div className="flex flex-col gap-3">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-3">Your sequence</p>
          <ol className="flex min-h-12 flex-col gap-2 rounded-xl border border-dashed border-line-2 p-2" aria-label="Your sequence">
            {placed.length === 0 && <li className="px-2 py-2 text-sm text-ink-3">Tap items below in the order you would do them.</li>}
            {placed.map((id, i) => {
              const item = exercise.items.find((x) => x.id === id)!;
              const note = result?.notes?.[id];
              return (
                <li key={id} className={`rounded-lg border ${note ? "border-amber bg-amber-soft/60" : result?.correct ? "border-ok bg-ok-soft/60" : "border-line bg-surface"}`}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => {
                      setResult(null);
                      setPlaced((p) => p.filter((x) => x !== id));
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-[15px]"
                    aria-label={`Step ${i + 1}: ${item.text}. Remove from sequence`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-bold">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <InlineMarkdown>{item.text}</InlineMarkdown>
                    </span>
                    {!locked && <Icon name="x" size={16} className="shrink-0 text-ink-3" />}
                  </button>
                  {note && (
                    <div className="border-t border-line/60 px-3 py-2">
                      <Markdown size="sm">{note}</Markdown>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
        {remaining.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-3">Available</p>
            <ul className="flex flex-col gap-2" aria-label="Available items">
              {remaining.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setResult(null);
                      setPlaced((p) => [...p, item.id]);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5 text-left text-[15px] hover:bg-surface-2"
                    aria-label={`Add: ${item.text}`}
                  >
                    <span className="text-accent">
                      <Icon name="chevron-right" size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <InlineMarkdown>{item.text}</InlineMarkdown>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {!locked && (
        <div className="flex gap-2">
          <Button onClick={check} disabled={placed.length !== exercise.items.length} data-testid="check-answer">
            Check order
          </Button>
          {placed.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                setPlaced([]);
                setResult(null);
              }}
            >
              Clear
            </Button>
          )}
        </div>
      )}
    </ExerciseFrame>
  );
}
