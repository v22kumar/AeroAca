"use client";

import type { ReactNode } from "react";
import { Markdown } from "@/components/ui/Markdown";
import { Disclosure } from "@/components/ui/Disclosure";
import { Icon } from "@/components/ui/Icon";
import type { GradeResult } from "@/lib/learning/grading";

export function ExerciseFrame({
  objective,
  prompt,
  context,
  hint,
  children,
  result,
  attempts,
  solvedEarlier,
}: {
  objective: string;
  prompt: string;
  context?: string;
  hint?: string;
  children: ReactNode;
  result: GradeResult | null;
  attempts: number;
  solvedEarlier: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-accent/30 bg-accent-soft/50 px-3 py-2 text-sm">
        <span className="font-semibold text-accent">Objective · </span>
        <span className="text-ink-2">{objective}</span>
      </div>
      {context && (
        <div className="rounded-xl border border-line bg-surface-2/60 px-3 py-2">
          <Markdown size="sm">{context}</Markdown>
        </div>
      )}
      <Markdown>{prompt}</Markdown>
      {solvedEarlier && !result && (
        <p className="flex items-center gap-2 rounded-lg bg-ok-soft px-3 py-2 text-sm text-ok">
          <Icon name="check" size={16} /> Solved on a previous visit. Answer again to refresh it, or continue.
        </p>
      )}
      {children}
      {hint && attempts > 0 && !result?.correct && (
        <Disclosure title="Hint">
          <Markdown size="sm">{hint}</Markdown>
        </Disclosure>
      )}
      {result && <FeedbackPanel result={result} />}
    </div>
  );
}

const praise = ["Correct", "Nicely reasoned", "That is it", "Exactly right"];

export function FeedbackPanel({ result }: { result: GradeResult }) {
  const label = result.correct ? praise[result.feedback.length % praise.length] : "Not yet. Here is why";
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="exercise-feedback"
      data-correct={result.correct ? "true" : "false"}
      className={`animate-fade-up rounded-xl border px-4 py-3 ${result.correct ? "border-ok/40 bg-ok-soft" : "border-amber/40 bg-amber-soft"}`}
    >
      <p className={`mb-1 flex items-center gap-2 text-sm font-bold ${result.correct ? "text-ok" : "text-amber"}`}>
        <Icon name={result.correct ? "check" : "info"} size={16} />
        {label}
      </p>
      <Markdown size="sm">{result.feedback}</Markdown>
    </div>
  );
}
