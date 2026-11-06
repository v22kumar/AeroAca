"use client";

import { useState } from "react";

export function Aliasing() {
  const [fMHz, setF] = useState(10);
  const [fsMSps, setFs] = useState(12);
  const W = 640;
  const H = 180;
  const mid = 90;
  const amp = 60;
  const windowUs = 1; // 1 µs window
  const n = 400;
  const truePts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * windowUs;
    const y = mid - amp * Math.sin(2 * Math.PI * fMHz * t);
    truePts.push(`${(i / n) * W},${y}`);
  }
  const samples: { x: number; y: number }[] = [];
  const dt = 1 / fsMSps; // µs
  for (let t = 0; t <= windowUs + 1e-9; t += dt) {
    samples.push({ x: (t / windowUs) * W, y: mid - amp * Math.sin(2 * Math.PI * fMHz * t) });
  }
  const nyquistOk = fsMSps >= 2 * fMHz;
  const k = Math.round(fMHz / fsMSps);
  const apparent = Math.abs(fMHz - k * fsMSps);
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-2">
          Signal: {fMHz} MHz sine
          <input type="range" min={1} max={20} value={fMHz} onChange={(e) => setF(Number(e.target.value))} className="accent-[var(--c-accent)]" aria-label="Signal frequency in MHz" />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-2">
          Sample rate: {fsMSps} MS/s
          <input type="range" min={5} max={100} value={fsMSps} onChange={(e) => setFs(Number(e.target.value))} className="accent-[var(--c-accent)]" aria-label="Sample rate in megasamples per second" />
        </label>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border border-line bg-surface" role="img" aria-label={`${fMHz} MHz signal sampled at ${fsMSps} megasamples per second, ${nyquistOk ? "adequately sampled" : "aliased"}`}>
        <polyline points={truePts.join(" ")} fill="none" stroke="var(--c-line-2)" strokeWidth="1.5" />
        <polyline points={samples.map((s) => `${s.x},${s.y}`).join(" ")} fill="none" stroke={nyquistOk ? "var(--c-ok)" : "var(--c-danger)"} strokeWidth="2" />
        {samples.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={3.5} fill={nyquistOk ? "var(--c-ok)" : "var(--c-danger)"} />
        ))}
        <text x={8} y={H - 8} fontSize="11" fill="var(--c-ink-3)">
          1 µs window · grey: true signal · dots: what the scope records
        </text>
      </svg>
      <div className={`rounded-lg px-3 py-2 text-sm ${nyquistOk ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger"}`} data-testid="alias-readout">
        {nyquistOk
          ? `${(fsMSps / fMHz).toFixed(1)} samples per period: above the Nyquist limit, the shape is recoverable${fsMSps / fMHz < 5 ? " but coarse; aim for 5 to 10 per period to see detail" : ""}.`
          : `Only ${(fsMSps / fMHz).toFixed(1)} samples per period: below the Nyquist limit. The scope would draw a false ${apparent.toFixed(1)} MHz waveform.`}
      </div>
    </div>
  );
}
