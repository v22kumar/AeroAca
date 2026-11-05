"use client";

import { useState } from "react";
import type { NumericExercise as NumericExerciseT } from "@/lib/content/schema";
import { gradeNumeric, type GradeResult } from "@/lib/learning/grading";
import { Button } from "@/components/ui/Button";
import { ExerciseFrame } from "./ExerciseFrame";

export function NumericExercise({ exercise, onResult, solvedEarlier }: { exercise: NumericExerciseT; onResult: (correct: boolean) => void; solvedEarlier: boolean }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<GradeResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const locked = result?.correct === true;

  const check = () => {
    const value = Number(text.replace(",", "."));
    const r = gradeNumeric(exercise, value);
    setResult(r);
    setAttempts((a) => a + 1);
    onResult(r.correct);
  };

  return (
    <ExerciseFrame objective={exercise.objective} prompt={exercise.prompt} context={exercise.context} hint={exercise.hint} result={result} attempts={attempts} solvedEarlier={solvedEarlier}>
      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!locked) check();
        }}
      >
        <label className="flex flex-1 flex-col gap-1 text-xs font-semibold text-ink-2">
          Your answer ({exercise.unit})
          <input
            type="text"
            inputMode="decimal"
            value={text}
            disabled={locked}
            onChange={(e) => {
              setText(e.target.value);
              setResult(null);
            }}
            className="min-h-11 rounded-lg border border-line bg-surface px-3 font-mono text-base text-ink"
            aria-describedby={`${exercise.id}-unit`}
            data-testid="numeric-input"
          />
        </label>
        <span id={`${exercise.id}-unit`} className="sr-only">
          Unit: {exercise.unit}
        </span>
        {!locked && (
          <Button type="submit" disabled={text.trim() === ""} data-testid="check-answer">
            Check
          </Button>
        )}
      </form>
    </ExerciseFrame>
  );
}
