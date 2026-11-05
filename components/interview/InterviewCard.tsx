"use client";

import { useState } from "react";
import type { InterviewQuestion } from "@/lib/content/schema";
import type { Confidence } from "@/lib/progress/schema";
import { useProgress } from "@/lib/progress/ProgressProvider";
import { Markdown } from "@/components/ui/Markdown";
import { Button } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
import { Icon } from "@/components/ui/Icon";

const confidenceOptions: { value: Confidence; label: string; hint: string }[] = [
  { value: "not-yet", label: "Not yet", hint: "I could not give a structured answer" },
  { value: "shaky", label: "Shaky", hint: "I covered some points, missed others" },
  { value: "confident", label: "Confident", hint: "I covered the strong-answer points in order" },
];

export function InterviewCard({ question, compact = false }: { question: InterviewQuestion; compact?: boolean }) {
  const { state, store, hydrated } = useProgress();
  const [revealed, setRevealed] = useState(false);
  const rating = hydrated ? state.interview[question.id]?.confidence : undefined;

  return (
    <div className="flex flex-col gap-4" data-testid={`interview-${question.id}`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">{question.topic}</p>
        <div className="mt-1 text-[17px] font-semibold leading-snug">
          <Markdown>{question.question}</Markdown>
        </div>
      </div>
      {!revealed ? (
        <div className="rounded-xl border border-dashed border-line-2 p-4 text-sm text-ink-2">
          <p>Answer out loud or in writing first, in about 90 seconds. Then reveal what a strong answer covers and rate yourself honestly.</p>
          <div className="mt-3">
            <Button variant="secondary" onClick={() => setRevealed(true)} data-testid="reveal-rubric">
              Reveal rubric
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 animate-fade-up">
          <div className="rounded-xl border border-ok/30 bg-ok-soft/50 p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ok">A strong answer covers</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {question.rubric.strong.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-amber/30 bg-amber-soft/50 p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber">Weak answers tend to</p>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {question.rubric.weak.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <Disclosure title="Follow-up probes an interviewer may ask">
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {question.probes.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Disclosure>
          <Disclosure title="One way to say it">
            <Markdown size="sm">{question.sampleAnswer}</Markdown>
          </Disclosure>
          {question.industries && question.industries.length > 0 && (
            <Disclosure title="The same question in other industries">
              <ul className="flex flex-col gap-2 text-sm">
                {question.industries.map((ind) => (
                  <li key={ind.sector} className="flex gap-2">
                    <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-ink-2">{ind.sector}</span>
                    <span className="text-ink-2">{ind.note}</span>
                  </li>
                ))}
              </ul>
            </Disclosure>
          )}
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">How did your answer compare?</legend>
            <div className={`grid gap-2 ${compact ? "grid-cols-3" : "grid-cols-1 sm:grid-cols-3"}`}>
              {confidenceOptions.map((o) => {
                const active = rating === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => store.rateInterview(question.id, o.value)}
                    className={`flex min-h-12 flex-col items-start justify-center rounded-xl border px-3 py-2 text-left transition-colors ${
                      active ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface hover:bg-surface-2"
                    }`}
                    data-testid={`rate-${o.value}`}
                  >
                    <span className="flex items-center gap-1 text-sm font-semibold">
                      {active && <Icon name="check" size={14} />}
                      {o.label}
                    </span>
                    {!compact && <span className="text-xs text-ink-3">{o.hint}</span>}
                  </button>
                );
              })}
            </div>
            {rating && <p className="mt-2 text-xs text-ink-3">Saved on this device. Ratings feed the weak-area list on the Progress page.</p>}
          </fieldset>
        </div>
      )}
    </div>
  );
}
