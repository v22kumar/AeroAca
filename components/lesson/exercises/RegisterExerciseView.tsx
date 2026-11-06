"use client";

import { useState } from "react";
import type { RegisterExercise } from "@/lib/content/schema";
import { gradeRegister, toHex, type GradeResult } from "@/lib/learning/grading";
import { Button } from "@/components/ui/Button";
import { BitGrid, cExpression } from "@/components/visuals/BitGrid";
import { ExerciseFrame } from "./ExerciseFrame";

export function RegisterExerciseView({ exercise, onResult, solvedEarlier }: { exercise: RegisterExercise; onResult: (correct: boolean, hints: number) => void; solvedEarlier: boolean }) {
  const [value, setValue] = useState(exercise.initial);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const locked = result?.correct === true;

  const check = () => {
    const r = gradeRegister(exercise, value);
    setResult(r);
    setAttempts((a) => a + 1);
    onResult(r.correct, hintsUsed);
  };

  return (
    <ExerciseFrame objective={exercise.objective} prompt={exercise.prompt} context={exercise.context} hint={exercise.hint} hints={exercise.hints} hintsUsed={hintsUsed} onHint={() => setHintsUsed((h) => h + 1)} result={result} attempts={attempts} solvedEarlier={solvedEarlier}>
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-3">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-3">
          <span>{exercise.registerName}</span>
          <span className="font-mono normal-case tracking-normal text-ink">initial {toHex(exercise.initial, exercise.width)}</span>
        </div>
        <BitGrid
          width={exercise.width}
          value={value}
          initial={exercise.initial}
          fields={exercise.fields}
          protectedBits={exercise.protectedBits}
          label={exercise.registerName}
          onToggle={
            locked
              ? undefined
              : (bit) => {
                  setResult(null);
                  setValue((v) => (v ^ (1 << bit)) >>> 0);
                }
          }
        />
        <pre className="overflow-x-auto rounded-lg bg-code-bg p-3 text-xs text-code-ink">
          <code>{cExpression("MODER", exercise.initial, value)}</code>
        </pre>
      </div>
      {!locked && (
        <div className="flex gap-2">
          <Button onClick={check} data-testid="check-answer">
            Check register
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setValue(exercise.initial);
              setResult(null);
            }}
          >
            Reset
          </Button>
        </div>
      )}
    </ExerciseFrame>
  );
}
