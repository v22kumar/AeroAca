"use client";

import { useState } from "react";

/** RC step response and the same RC as a first-order low-pass filter. Illustrative: ideal step, ideal components. */
export function RcStep() {
  const [rk, setRk] = useState(10); // kΩ
  const [cn, setCn] = useState(100); // nF
  const [fHz, setFHz] = useState(1000);
  const r = rk * 1000, c = cn * 1e-9;
  const tau = r * c;
  const fc = 1 / (2 * Math.PI * r * c);
  const gain = 1 / Math.sqrt(1 + (fHz / fc) ** 2);
  const db = 20 * Math.log10(gain);
  const fmtT = (s: number) => (s >= 1 ? `${s.toFixed(2)} s` : s >= 1e-3 ? `${(s * 1e3).toFixed(2)} ms` : `${(s * 1e6).toFixed(1)} µs`);
  const fmtF = (f: number) => (f >= 1e6 ? `${(f / 1e6).toFixed(2)} MHz` : f >= 1e3 ? `${(f / 1e3).toFixed(2)} kHz` : `${f.toFixed(1)} Hz`);
  // curve: 0..6 tau across 300 px, height 80
  const pts = Array.from({ length: 61 }, (_, i) => {
    const t = (i / 60) * 6;
    const v = 1 - Math.exp(-t);
    return `${20 + i * 5},${95 - v * 80}`;
  }).join(" ");
  const mark = (k: number, label: string) => (
    <g key={label}>
      <line x1={20 + k * 50} y1={95} x2={20 + k * 50} y2={95 - (1 - Math.exp(-k)) * 80} stroke="var(--c-accent)" strokeDasharray="2 2" />
      <text x={20 + k * 50 - 8} y={108} fontSize="9" fill="currentColor">{label}</text>
      <text x={20 + k * 50 + 3} y={95 - (1 - Math.exp(-k)) * 80 - 3} fontSize="9" fill="var(--c-accent)">{((1 - Math.exp(-k)) * 100).toFixed(0)}%</text>
    </g>
  );
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm"><span>R: {rk} kΩ</span><input type="range" min={1} max={1000} step={1} value={rk} onChange={(e) => setRk(Number(e.target.value))} data-testid="rc-r" className="accent-accent" /></label>
        <label className="flex flex-col gap-1 text-sm"><span>C: {cn} nF</span><input type="range" min={1} max={1000} step={1} value={cn} onChange={(e) => setCn(Number(e.target.value))} data-testid="rc-c" className="accent-accent" /></label>
        <label className="flex flex-col gap-1 text-sm"><span>Signal: {fmtF(fHz)}</span><input type="range" min={1} max={5} step={0.01} value={Math.log10(fHz)} onChange={(e) => setFHz(Math.round(10 ** Number(e.target.value)))} data-testid="rc-f" className="accent-accent" /></label>
      </div>
      <svg viewBox="0 0 330 115" width="100%" role="img" aria-label="Charging curve of a capacitor through a resistor, marked at one, three and five time constants" className="max-h-40">
        <line x1="20" y1="95" x2="320" y2="95" stroke="currentColor" strokeWidth="1" />
        <line x1="20" y1="10" x2="20" y2="95" stroke="currentColor" strokeWidth="1" />
        <line x1="20" y1="15" x2="320" y2="15" stroke="currentColor" strokeDasharray="4 4" opacity="0.4" />
        <text x="24" y="12" fontSize="9" fill="currentColor">V_in (final)</text>
        <polyline points={pts} fill="none" stroke="var(--c-accent)" strokeWidth="2" />
        {mark(1, "1τ")}
        {mark(3, "3τ")}
        {mark(5, "5τ")}
      </svg>
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <p className="rounded-lg bg-surface-2 px-3 py-2" data-testid="rc-tau">τ = R × C = <strong>{fmtT(tau)}</strong>; settled (99 %) after about {fmtT(5 * tau)}</p>
        <p className="rounded-lg bg-surface-2 px-3 py-2" data-testid="rc-thresholds">Reaches 50 % at {fmtT(0.693 * tau)}, 70 % at {fmtT(1.204 * tau)}</p>
        <p className="rounded-lg bg-surface-2 px-3 py-2" data-testid="rc-fc">As a low-pass filter: f_c = 1 / (2πRC) = <strong>{fmtF(fc)}</strong> (−3 dB)</p>
        <p className={`rounded-lg px-3 py-2 ${db < -20 ? "bg-ok-soft text-ok" : db < -3 ? "bg-amber-soft text-amber" : "bg-surface-2"}`} data-testid="rc-gain">At {fmtF(fHz)}: output is <strong>{(gain * 100).toFixed(1)} %</strong> of input ({db.toFixed(1)} dB)</p>
      </div>
      <p className="text-xs text-ink-3">Illustrative: ideal step and ideal parts. A real supply&apos;s own rise time adds to the curve; a class 2 ceramic&apos;s value depends on bias and temperature.</p>
    </div>
  );
}
