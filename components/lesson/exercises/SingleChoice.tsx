"use client";

import { useState } from "react";
import type { SingleChoiceExercise } from "@/lib/content/schema";
import { gradeSingle, type GradeResult } from "@/lib/learning/grading";
import { Button } from "@/components/ui/Button";
import { InlineMarkdown } from "@/components/ui/Markdown";
import { ExerciseFrame } from "./ExerciseFrame";

export function SingleChoice({ exercise, onResult, solvedEarlier }: { exercise: SingleChoiceExercise; onResult: (correct: boolean) => void; solvedEarlier: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const locked = result?.correct === true;

  const check = () => {
    if (!selected) return;
    const r = gradeSingle(exercise, selected);
    setResult(r);
    setAttempts((a) => a + 1);
    onResult(r.correct);
  };

  return (
    <ExerciseFrame objective={exercise.objective} prompt={exercise.prompt} context={exercise.context} hint={exercise.hint} result={result} attempts={attempts} solvedEarlier={solvedEarlier}>
      <div role="radiogroup" aria-label="Answer options" className="flex flex-col gap-2">
        {exercise.options.map((o, i) => {
          const isSel = selected === o.id;
          const showState = result && isSel;
          return (
            <label
              key={o.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-[15px] transition-colors ${
                showState ? (o.correct ? "border-ok bg-ok-soft" : "border-amber bg-amber-soft") : isSel ? "border-accent bg-accent-soft/60" : "border-line bg-surface hover:bg-surface-2"
              } ${locked ? "cursor-default" : ""}`}
            >
              <input
                type="radio"
                name={exercise.id}
                value={o.id}
                checked={isSel}
                disabled={locked}
                onChange={() => {
                  setSelected(o.id);
                  setResult(null);
                }}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--c-accent)]"
              />
              <span className="min-w-0">
                <span className="mr-1.5 font-mono text-xs text-ink-3">{String.fromCharCode(65 + i)}.</span>
                <InlineMarkdown>{o.text}</InlineMarkdown>
              </span>
            </label>
          );
        })}
      </div>
      {!locked && (
        <div>
          <Button onClick={check} disabled={!selected} data-testid="check-answer">
            Check answer
          </Button>
        </div>
      )}
    </ExerciseFrame>
  );
}
