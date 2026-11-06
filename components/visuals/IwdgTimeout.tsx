"use client";

import { useState } from "react";

const prescalers = [4, 8, 16, 32, 64, 128, 256];

function fmt(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms.toFixed(1)} ms`;
}

export function IwdgTimeout() {
  const [pr, setPr] = useState(3);
  const [rl, setRl] = useState(999);
  const div = prescalers[pr]!;
  const ms = (div * (rl + 1)) / 32;
  const msMin = (div * (rl + 1)) / 47;
  const msMax = (div * (rl + 1)) / 17;
  const maxMs = (256 * 4096) / 32;
  const pct = Math.min(100, (ms / maxMs) * 100);
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-2">
          Prescaler code {pr} (÷{div})
          <input type="range" min={0} max={6} value={pr} onChange={(e) => setPr(Number(e.target.value))} className="accent-[var(--c-accent)]" aria-label="IWDG prescaler code" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-2">
          Reload value {rl}
          <input type="range" min={0} max={4095} value={rl} onChange={(e) => setRl(Number(e.target.value))} className="accent-[var(--c-accent)]" aria-label="IWDG reload value" />
        </label>
      </div>
      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="font-mono text-sm text-ink-2">
          timeout = {div} × ({rl} + 1) ÷ 32 000 Hz
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums" data-testid="iwdg-timeout">
          {fmt(ms)}
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-2" aria-hidden>
          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-sm text-ink-2">
          At the datasheet’s LSI limits: <span className="font-semibold tabular-nums">{fmt(msMin)}</span> (47 kHz) to <span className="font-semibold tabular-nums">{fmt(msMax)}</span> (17 kHz).
        </p>
      </div>
      <p className="text-xs text-ink-3">The longest possible timeout is ÷256 × 4096 ÷ 32 kHz ≈ 32.8 s. Choose values so the <em>shortest</em> possible timeout still exceeds your longest healthy loop cycle.</p>
    </div>
  );
}
