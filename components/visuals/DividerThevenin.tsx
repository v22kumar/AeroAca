"use client";

import { useState } from "react";

/** Voltage divider, its Thévenin equivalent and the effect of a load or meter. Resistors treated as exact; illustrative. */
export function DividerThevenin() {
  const [vin, setVin] = useState(3.3);
  const [r1k, setR1k] = useState(100);
  const [r2k, setR2k] = useState(100);
  const [loadk, setLoadk] = useState(100);
  const r1 = r1k * 1000, r2 = r2k * 1000, load = loadk * 1000;
  const vOpen = (vin * r2) / (r1 + r2);
  const rth = (r1 * r2) / (r1 + r2);
  const vLoaded = (vOpen * load) / (rth + load);
  const errPct = ((vOpen - vLoaded) / vOpen) * 100;
  const standing = vin / (r1 + r2);
  const fmtR = (ohms: number) => (ohms >= 1e6 ? `${(ohms / 1e6).toFixed(2)} MΩ` : ohms >= 1000 ? `${(ohms / 1000).toFixed(1)} kΩ` : `${ohms.toFixed(0)} Ω`);
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm"><span>Supply V_in: {vin.toFixed(1)} V</span><input type="range" min={1} max={12} step={0.1} value={vin} onChange={(e) => setVin(Number(e.target.value))} data-testid="div-vin" className="accent-accent" /></label>
        <label className="flex flex-col gap-1 text-sm"><span>R1 (top): {fmtR(r1)}</span><input type="range" min={1} max={1000} step={1} value={r1k} onChange={(e) => setR1k(Number(e.target.value))} data-testid="div-r1" className="accent-accent" /></label>
        <label className="flex flex-col gap-1 text-sm"><span>R2 (to ground): {fmtR(r2)}</span><input type="range" min={1} max={1000} step={1} value={r2k} onChange={(e) => setR2k(Number(e.target.value))} data-testid="div-r2" className="accent-accent" /></label>
        <label className="flex flex-col gap-1 text-sm"><span>Load or meter across R2: {fmtR(load)}</span><input type="range" min={1} max={10000} step={1} value={loadk} onChange={(e) => setLoadk(Number(e.target.value))} data-testid="div-load" className="accent-accent" /></label>
      </div>
      <svg viewBox="0 0 320 120" width="100%" role="img" aria-label="Divider circuit: V_in through R1, node, R2 to ground, with a load across R2" className="max-h-36">
        <line x1="20" y1="20" x2="20" y2="100" stroke="currentColor" strokeWidth="1.5" />
        <text x="6" y="64" fontSize="10" fill="currentColor">V_in</text>
        <line x1="20" y1="20" x2="120" y2="20" stroke="currentColor" strokeWidth="1.5" />
        <rect x="120" y="12" width="40" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <text x="122" y="8" fontSize="9" fill="currentColor">R1</text>
        <line x1="160" y1="20" x2="200" y2="20" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="200" cy="20" r="3" fill="var(--c-accent)" />
        <text x="206" y="16" fontSize="9" fill="var(--c-accent)">node</text>
        <line x1="200" y1="20" x2="200" y2="40" stroke="currentColor" strokeWidth="1.5" />
        <rect x="192" y="40" width="16" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <text x="212" y="64" fontSize="9" fill="currentColor">R2</text>
        <line x1="200" y1="80" x2="200" y2="100" stroke="currentColor" strokeWidth="1.5" />
        <line x1="200" y1="20" x2="270" y2="20" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1="270" y1="20" x2="270" y2="40" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
        <rect x="262" y="40" width="16" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
        <text x="282" y="64" fontSize="9" fill="currentColor">load</text>
        <line x1="270" y1="80" x2="270" y2="100" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1="20" y1="100" x2="270" y2="100" stroke="currentColor" strokeWidth="1.5" />
        <text x="130" y="112" fontSize="9" fill="currentColor">ground</text>
      </svg>
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <p className="rounded-lg bg-surface-2 px-3 py-2" data-testid="div-open">Unloaded: {vin.toFixed(2)} × {fmtR(r2)} / ({fmtR(r1)} + {fmtR(r2)}) = <strong>{vOpen.toFixed(3)} V</strong></p>
        <p className="rounded-lg bg-surface-2 px-3 py-2" data-testid="div-rth">Thévenin resistance R1 ∥ R2 = <strong>{fmtR(rth)}</strong>; standing current {standing * 1e6 >= 1000 ? `${(standing * 1e3).toFixed(2)} mA` : `${(standing * 1e6).toFixed(0)} µA`}</p>
        <p className="rounded-lg bg-surface-2 px-3 py-2" data-testid="div-loaded">Loaded: {vOpen.toFixed(3)} × {fmtR(load)} / ({fmtR(rth)} + {fmtR(load)}) = <strong>{vLoaded.toFixed(3)} V</strong></p>
        <p className={`rounded-lg px-3 py-2 ${errPct > 5 ? "bg-amber-soft text-amber" : "bg-ok-soft text-ok"}`} data-testid="div-error">Error from loading: <strong>{errPct.toFixed(1)} %</strong> {errPct > 5 ? "(the load is comparable to R_th: buffer it or lower the divider's resistance)" : "(acceptable for most inputs)"}</p>
      </div>
      <p className="text-xs text-ink-3">Illustrative calculator. The node is &quot;{vOpen.toFixed(2)} V behind {fmtR(rth)}&quot;; any load forms a second divider against that resistance.</p>
    </div>
  );
}
