"use client";

import { useState } from "react";

function band(s: number, o: number, d: number): { label: string; cls: string } {
  // Simplified action-priority banding: severity first, then occurrence, then detection.
  if (s >= 9 && (o >= 3 || d >= 4)) return { label: "High: action required (safety severity)", cls: "bg-danger-soft text-danger" };
  if (s >= 9) return { label: "Medium: review controls (safety severity, rare and detected)", cls: "bg-amber-soft text-amber" };
  if (s >= 7 && (o >= 4 || d >= 6)) return { label: "High: action required", cls: "bg-danger-soft text-danger" };
  if (s >= 4 && o >= 4 && d >= 5) return { label: "Medium: action recommended", cls: "bg-amber-soft text-amber" };
  return { label: "Low: monitor", cls: "bg-ok-soft text-ok" };
}

export function FmeaWorksheet() {
  const [s, setS] = useState(9);
  const [o, setO] = useState(4);
  const [d, setD] = useState(10);
  const [rangeCheck, setRangeCheck] = useState(false);
  const [lockConn, setLockConn] = useState(false);
  const dEff = rangeCheck ? Math.min(d, 2) : d;
  const oEff = lockConn ? Math.min(o, 2) : o;
  const rpn = s * oEff * dEff;
  const b = band(s, oEff, dEff);
  const slider = (label: string, value: number, set: (n: number) => void, testid: string, hint: string) => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="flex justify-between"><span>{label}</span><strong>{value}</strong></span>
      <input type="range" min={1} max={10} value={value} onChange={(e) => set(Number(e.target.value))} data-testid={testid} className="accent-accent" />
      <span className="text-xs text-ink-3">{hint}</span>
    </label>
  );
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-line bg-surface p-3 text-sm">
        <p><strong>Item:</strong> thermistor input · <strong>Failure mode:</strong> open circuit · <strong>Effect:</strong> reads −40 °C, heater 100 %, housing &gt; 90 °C · <strong>Cause:</strong> loose connector</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {slider("Severity (S)", s, setS, "fmea-s", "How bad the effect is. 9 to 10: safety hazard.")}
        {slider("Occurrence (O)", o, setO, "fmea-o", "How often the cause produces the mode.")}
        {slider("Detection (D)", d, setD, "fmea-d", "10 = nothing detects it before the user. High is bad.")}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={rangeCheck} onChange={(e) => setRangeCheck(e.target.checked)} data-testid="fmea-range-check" className="h-5 w-5 accent-accent" />
          Add firmware range and plausibility check + open-sensor test (detection → 2)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={lockConn} onChange={(e) => setLockConn(e.target.checked)} data-testid="fmea-lock" className="h-5 w-5 accent-accent" />
          Specify a locking connector (occurrence → 2)
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm" data-testid="fmea-rpn">
          RPN = {s} × {oEff} × {dEff} = <strong>{rpn}</strong>
        </p>
        <p className={`rounded-lg px-3 py-2 text-sm ${b.cls}`} data-testid="fmea-band">{b.label}</p>
      </div>
      <p className="text-xs text-ink-3">Severity never moves with a detection or prevention action: the effect, should it occur, is as harmful as before. Only a design change to the effect (a thermal fuse) would lower S.</p>
    </div>
  );
}
