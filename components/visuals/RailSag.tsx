"use client";

import { useState } from "react";

/**
 * A rail seen from two places: the regulator's output pin and the load's supply pin, with the
 * trace and connector resistance between them. Sag = I × R; a bulk capacitor at the load supplies
 * the burst locally. Illustrative, not a circuit simulation.
 */
export function RailSag() {
  const [burstMa, setBurstMa] = useState(800);
  const [pathOhm, setPathOhm] = useState(0.4);
  const [bulk, setBulk] = useState(false);
  const vReg = 3.3;
  const reset = 3.0;
  // With a bulk capacitor at the load, the trace carries the average current while the capacitor
  // supplies most of the burst; we show that as a quarter of the burst flowing through the path.
  const effectiveA = (bulk ? burstMa / 4 : burstMa) / 1000;
  const sag = effectiveA * pathOhm;
  const vLoad = vReg - sag;
  const resets = vLoad < reset;
  const W = 640;
  return (
    <div className="flex flex-col gap-3">
      <svg viewBox={`0 0 ${W} 150`} className="w-full" role="img" aria-label={`Rail from regulator to load. Regulator reads ${vReg.toFixed(2)} volts, load sees ${vLoad.toFixed(2)} volts during the burst.`}>
        <rect x={20} y={45} width={130} height={60} rx={8} fill="var(--c-surface-2)" stroke="var(--c-line-2)" />
        <text x={85} y={70} textAnchor="middle" className="fill-ink text-[13px] font-semibold">Regulator</text>
        <text x={85} y={90} textAnchor="middle" className="fill-ink-2 text-[12px]">out = {vReg.toFixed(2)} V</text>
        <line x1={150} y1={75} x2={240} y2={75} stroke="var(--c-ink-3)" strokeWidth={3} />
        <rect x={240} y={60} width={160} height={30} rx={4} fill="var(--c-amber-soft)" stroke="var(--c-amber)" />
        <text x={320} y={80} textAnchor="middle" className="fill-ink text-[12px] font-semibold">trace + connector {pathOhm.toFixed(2)} Ω</text>
        <line x1={400} y1={75} x2={490} y2={75} stroke="var(--c-ink-3)" strokeWidth={3} />
        {bulk && (
          <g>
            <line x1={470} y1={75} x2={470} y2={112} stroke="var(--c-accent)" strokeWidth={3} />
            <line x1={456} y1={112} x2={484} y2={112} stroke="var(--c-accent)" strokeWidth={3} />
            <line x1={456} y1={120} x2={484} y2={120} stroke="var(--c-accent)" strokeWidth={3} />
            <text x={470} y={140} textAnchor="middle" className="fill-accent text-[11px] font-semibold">47 µF at the load</text>
          </g>
        )}
        <rect x={490} y={45} width={130} height={60} rx={8} fill={resets ? "var(--c-amber-soft)" : "var(--c-surface-2)"} stroke={resets ? "var(--c-amber)" : "var(--c-line-2)"} />
        <text x={555} y={70} textAnchor="middle" className="fill-ink text-[13px] font-semibold">Radio + sensor</text>
        <text x={555} y={90} textAnchor="middle" className="fill-ink-2 text-[12px]">sees {vLoad.toFixed(2)} V</text>
        <text x={320} y={30} textAnchor="middle" className="fill-ink-3 text-[11px]">burst current {burstMa} mA for 20 ms, {bulk ? "mostly from the capacitor" : "all through the trace"}</text>
        <text x={320} y={125} textAnchor="middle" className="fill-ink text-[12px]">sag = I × R = {effectiveA.toFixed(2)} A × {pathOhm.toFixed(2)} Ω = {sag.toFixed(2)} V</text>
      </svg>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span>Burst current: {burstMa} mA</span>
          <input type="range" min={100} max={1500} step={50} value={burstMa} onChange={(e) => setBurstMa(Number(e.target.value))} data-testid="sag-current" className="accent-accent" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Path resistance: {pathOhm.toFixed(2)} Ω</span>
          <input type="range" min={0.05} max={1} step={0.05} value={pathOhm} onChange={(e) => setPathOhm(Number(e.target.value))} data-testid="sag-resistance" className="accent-accent" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={bulk} onChange={(e) => setBulk(e.target.checked)} data-testid="sag-bulk" className="h-5 w-5 accent-accent" />
          Bulk capacitor at the load
        </label>
      </div>
      <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm" data-testid="sag-readout">
        A multimeter on the regulator pin reads <strong>{vReg.toFixed(2)} V</strong> all day. A scope on the load pin during the burst shows <strong>{vLoad.toFixed(2)} V</strong>
        {resets ? ", below the sensor's 3.0 V reset threshold: the sensor resets." : ", above the sensor's 3.0 V reset threshold: the sensor keeps running."}
      </p>
    </div>
  );
}
