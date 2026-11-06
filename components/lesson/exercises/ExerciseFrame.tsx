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
  hints,
  hintsUsed = 0,
  onHint,
  children,
  result,
  attempts,
  solvedEarlier,
}: {
  objective: string;
  prompt: string;
  context?: string;
  hint?: string;
  /** Guided practice: revealed one at a time on request; the count is recorded with the attempt. */
  hints?: string[];
  hintsUsed?: number;
  onHint?: () => void;
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
      {hints && hints.length > 0 && !result?.correct && (
        <div className="flex flex-col gap-2" data-testid="hints">
          {hints.slice(0, hintsUsed).map((h, i) => (
            <div key={i} className="rounded-xl border border-accent/25 bg-accent-soft/50 px-3 py-2 text-sm" data-testid="hint-shown">
              <span className="font-semibold text-accent">Hint {i + 1} · </span>
              <Markdown size="sm" className="inline">{h}</Markdown>
            </div>
          ))}
          {hintsUsed < hints.length && (
            <button type="button" onClick={onHint} className="self-start text-sm font-semibold text-accent underline underline-offset-2" data-testid="show-hint">
              {hintsUsed === 0 ? `Need a hint? (${hints.length} available)` : `Another hint (${hintsUsed} of ${hints.length} shown)`}
            </button>
          )}
        </div>
      )}
      {children}
      {hint && attempts > 0 && !result?.correct && (
        <Disclosure title="Hint">
          <Markdown size="sm">{hint}</Markdown>
        </Disclosure>
      )}
      {result && <FeedbackPanel result={result} hints={hintsUsed} />}
    </div>
  );
}

const praise = ["Correct", "Nicely reasoned", "That is it", "Exactly right"];

export function FeedbackPanel({ result, hints = 0 }: { result: GradeResult; hints?: number }) {
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
        {result.correct && hints > 0 && <span className="text-xs font-semibold text-ink-3" data-testid="solved-with-hints">(solved with {hints} {hints === 1 ? "hint" : "hints"})</span>}
      </p>
      <Markdown size="sm">{result.feedback}</Markdown>
    </div>
  );
}
