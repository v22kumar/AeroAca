"use client";

import { useState } from "react";

/** PWM arithmetic for a general-purpose timer: f = f_TIM / ((PSC+1)(ARR+1)); duty = CCR / (ARR+1). */
export function PwmTimer() {
  const [ftim, setFtim] = useState(84);
  const [psc, setPsc] = useState(41);
  const [arr, setArr] = useState(99);
  const [ccr, setCcr] = useState(25);
  const f = (ftim * 1e6) / ((psc + 1) * (arr + 1));
  const duty = Math.min(1, ccr / (arr + 1));
  const fmt = f >= 1e6 ? `${(f / 1e6).toFixed(3)} MHz` : f >= 1e3 ? `${(f / 1e3).toFixed(3)} kHz` : `${f.toFixed(1)} Hz`;
  const W = 600;
  const period = W - 40;
  const high = period * duty;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm"><span>Timer clock f_TIM: {ftim} MHz</span><input type="range" min={1} max={200} value={ftim} onChange={(e) => setFtim(Number(e.target.value))} data-testid="pwm-ftim" className="accent-accent" /></label>
        <label className="flex flex-col gap-1 text-sm"><span>Prescaler PSC: {psc} (÷{psc + 1})</span><input type="range" min={0} max={999} value={psc} onChange={(e) => setPsc(Number(e.target.value))} data-testid="pwm-psc" className="accent-accent" /></label>
        <label className="flex flex-col gap-1 text-sm"><span>Period ARR: {arr} ({arr + 1} steps)</span><input type="range" min={1} max={9999} value={arr} onChange={(e) => { const v = Number(e.target.value); setArr(v); setCcr((c) => Math.min(c, v + 1)); }} data-testid="pwm-arr" className="accent-accent" /></label>
        <label className="flex flex-col gap-1 text-sm"><span>Compare CCR: {ccr}</span><input type="range" min={0} max={arr + 1} value={ccr} onChange={(e) => setCcr(Number(e.target.value))} data-testid="pwm-ccr" className="accent-accent" /></label>
      </div>
      <svg viewBox={`0 0 ${W} 70`} className="w-full" role="img" aria-label="One PWM period">
        <polyline points={`20,55 20,15 ${20 + high},15 ${20 + high},55 ${20 + period},55 ${20 + period},15`} fill="none" stroke="var(--c-accent)" strokeWidth="3" />
        <line x1={20} x2={20 + period} y1={62} y2={62} stroke="var(--c-line-2)" />
        <text x={20 + period / 2} y={68} textAnchor="middle" className="fill-ink-3 text-[10px]">one period = {(1e6 / f).toFixed(2)} µs</text>
      </svg>
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
        <p className="rounded-lg bg-surface-2 px-3 py-2" data-testid="pwm-freq">f_PWM = {ftim} MHz ÷ ({psc + 1} × {arr + 1}) = <strong>{fmt}</strong></p>
        <p className="rounded-lg bg-surface-2 px-3 py-2" data-testid="pwm-duty">duty = {ccr} ÷ {arr + 1} = <strong>{(duty * 100).toFixed(2)} %</strong></p>
        <p className="rounded-lg bg-surface-2 px-3 py-2">resolution: {arr + 1} steps ({(100 / (arr + 1)).toFixed(3)} % per step)</p>
      </div>
      <p className="text-xs text-ink-3">Edge-aligned PWM mode 1: output high from the start of the period until the counter reaches CCR. CCR = ARR + 1 gives 100 %.</p>
    </div>
  );
}
