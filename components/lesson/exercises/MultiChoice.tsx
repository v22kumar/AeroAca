"use client";

import { useState } from "react";
import type { MultiChoiceExercise } from "@/lib/content/schema";
import { gradeMulti, type GradeResult } from "@/lib/learning/grading";
import { Button } from "@/components/ui/Button";
import { InlineMarkdown, Markdown } from "@/components/ui/Markdown";
import { ExerciseFrame } from "./ExerciseFrame";

export function MultiChoice({ exercise, onResult, solvedEarlier }: { exercise: MultiChoiceExercise; onResult: (correct: boolean, hints: number) => void; solvedEarlier: boolean }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const locked = result?.correct === true;

  const toggle = (id: string) => {
    setResult(null);
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };
  const check = () => {
    const r = gradeMulti(exercise, selected);
    setResult(r);
    setAttempts((a) => a + 1);
    onResult(r.correct, hintsUsed);
  };

  return (
    <ExerciseFrame objective={exercise.objective} prompt={exercise.prompt} context={exercise.context} hint={exercise.hint} hints={exercise.hints} hintsUsed={hintsUsed} onHint={() => setHintsUsed((h) => h + 1)} result={result} attempts={attempts} solvedEarlier={solvedEarlier}>
      <div role="group" aria-label="Select all that apply" className="flex flex-col gap-2">
        {exercise.options.map((o, i) => {
          const isSel = selected.includes(o.id);
          const note = result?.notes?.[o.id];
          const tone = result && note ? (isSel === o.correct ? "ok" : "amber") : null;
          return (
            <div key={o.id} className={`rounded-xl border transition-colors ${tone === "ok" ? "border-ok bg-ok-soft/60" : tone === "amber" ? "border-amber bg-amber-soft/70" : isSel ? "border-accent bg-accent-soft/60" : "border-line bg-surface"}`}>
              <label className={`flex items-start gap-3 px-3 py-3 text-[15px] ${locked ? "" : "cursor-pointer"}`}>
                <input type="checkbox" checked={isSel} disabled={locked} onChange={() => toggle(o.id)} className="mt-1 h-4 w-4 shrink-0 accent-[var(--c-accent)]" />
                <span className="min-w-0">
                  <span className="mr-1.5 font-mono text-xs text-ink-3">{String.fromCharCode(65 + i)}.</span>
                  <InlineMarkdown>{o.text}</InlineMarkdown>
                </span>
              </label>
              {note && (
                <div className="border-t border-line/60 px-3 py-2">
                  <Markdown size="sm">{note}</Markdown>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!locked && (
        <div>
          <Button onClick={check} disabled={selected.length === 0} data-testid="check-answer">
            Check answer
          </Button>
        </div>
      )}
    </ExerciseFrame>
  );
}
