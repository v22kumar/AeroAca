"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

const PER_QUESTION_S = 4 * 60;

/** A timed mock-interview pacer: N questions, four minutes each, no notes. Pure client state; nothing is stored. */
export function MockTimer({ count }: { count: number }) {
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(PER_QUESTION_S);
  const [question, setQuestion] = useState(1);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const mm = String(Math.floor(remaining / 60)).padStart(1, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const next = () => {
    if (question >= count) {
      setFinished(true);
      setRunning(false);
      return;
    }
    setQuestion((q) => q + 1);
    setRemaining(PER_QUESTION_S);
    setRunning(true);
  };
  const reset = () => {
    setFinished(false);
    setQuestion(1);
    setRemaining(PER_QUESTION_S);
    setRunning(false);
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-4" data-testid="mock-timer" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Timed mock interview</p>
          <p className="text-sm text-ink-2">
            {count} question{count > 1 ? "s" : ""}, four minutes each, no notes. Answer out loud; reveal the rubric only when the time is up.
          </p>
        </div>
        <p className={`font-mono text-3xl font-bold tabular-nums ${remaining === 0 ? "text-amber" : ""}`} data-testid="mock-clock">
          {mm}:{ss}
        </p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {finished ? (
          <>
            <span className="text-sm font-semibold" data-testid="mock-done">All {count} answered. Now reveal each rubric and rate yourself honestly.</span>
            <Button size="sm" variant="secondary" onClick={reset}>Start again</Button>
          </>
        ) : (
          <>
            <span className="text-sm" data-testid="mock-progress">Question {question} of {count}</span>
            {!running && remaining === PER_QUESTION_S && (
              <Button size="sm" onClick={() => setRunning(true)} data-testid="mock-start">
                {question === 1 ? "Start" : "Start this question"}
              </Button>
            )}
            {running && (
              <Button size="sm" variant="secondary" onClick={() => setRunning(false)} data-testid="mock-pause">Pause</Button>
            )}
            {!running && remaining !== PER_QUESTION_S && remaining > 0 && (
              <Button size="sm" onClick={() => setRunning(true)}>Resume</Button>
            )}
            {remaining === 0 && <span className="text-sm font-semibold text-amber">Time. Finish your sentence.</span>}
            <Button size="sm" variant="secondary" onClick={next} data-testid="mock-next">
              {question >= count ? "Finish" : "Next question"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
