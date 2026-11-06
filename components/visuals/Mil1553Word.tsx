"use client";

import { useState } from "react";

const bitsOf = (v: number, n: number) => Array.from({ length: n }, (_, i) => (v >> (n - 1 - i)) & 1);

/**
 * Build a MIL-STD-1553B command word field by field and watch the 16 data bits and the parity bit
 * change. Encoding per MIL-STD-1553B: 3 bit-times of sync, 16 bits, 1 odd-parity bit; command
 * word fields: RT address (5), T/R (1), subaddress or mode (5), word count or mode code (5).
 */
export function Mil1553Word() {
  const [rt, setRt] = useState(5);
  const [tr, setTr] = useState(1);
  const [sa, setSa] = useState(3);
  const [wc, setWc] = useState(4);
  const value = (rt << 11) | (tr << 10) | (sa << 5) | wc;
  const bits = bitsOf(value, 16);
  const ones = bits.reduce((a, b) => a + b, 0);
  const parity = ones % 2 === 0 ? 1 : 0; // odd parity: total ones including the parity bit must be odd
  const fields = [
    { name: "RT address", from: 0, to: 4, color: "var(--c-accent-soft)" },
    { name: "T/R", from: 5, to: 5, color: "var(--c-amber-soft)" },
    { name: "Subaddress", from: 6, to: 10, color: "var(--c-ok-soft)" },
    { name: "Word count", from: 11, to: 15, color: "var(--c-surface-2)" },
  ];
  const W = 640;
  const cell = 30;
  const left = 40;
  const wcMeaning = sa === 0 || sa === 31 ? `mode code ${wc}` : wc === 0 ? "32 data words" : `${wc} data word${wc === 1 ? "" : "s"}`;
  return (
    <div className="flex flex-col gap-3">
      <svg viewBox={`0 0 ${W} 120`} className="w-full" role="img" aria-label={`Command word ${value.toString(16).toUpperCase().padStart(4, "0")} hex with parity bit ${parity}`}>
        <rect x={2} y={30} width={34} height={cell} fill="var(--c-line-2)" rx={3} />
        <text x={19} y={50} textAnchor="middle" className="fill-ink text-[10px] font-semibold">sync</text>
        {fields.map((f) => (
          <rect key={f.name} x={left + f.from * cell} y={28} width={(f.to - f.from + 1) * cell} height={cell + 4} fill={f.color} rx={4} />
        ))}
        {bits.map((b, i) => (
          <text key={i} x={left + i * cell + cell / 2} y={51} textAnchor="middle" className="fill-ink font-mono text-[15px] font-semibold">
            {b}
          </text>
        ))}
        <rect x={left + 16 * cell + 4} y={28} width={cell} height={cell + 4} fill={parity ? "var(--c-amber-soft)" : "var(--c-surface-2)"} stroke="var(--c-amber)" rx={4} />
        <text x={left + 16 * cell + 4 + cell / 2} y={51} textAnchor="middle" className="fill-ink font-mono text-[15px] font-semibold">{parity}</text>
        <text x={left + 16 * cell + 4 + cell / 2} y={20} textAnchor="middle" className="fill-ink-3 text-[10px]">P</text>
        {fields.map((f) => (
          <text key={f.name} x={left + f.from * cell + ((f.to - f.from + 1) * cell) / 2} y={80} textAnchor="middle" className="fill-ink-2 text-[11px]">
            {f.name}
          </text>
        ))}
        {bits.map((_, i) => (
          <text key={i} x={left + i * cell + cell / 2} y={100} textAnchor="middle" className="fill-ink-3 text-[9px]">
            {i + 4}
          </text>
        ))}
        <text x={left} y={115} className="fill-ink-3 text-[9px]">bit times 4 to 19 (1 to 3 are the sync); 20 is parity</text>
      </svg>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          <span>RT address: {rt}</span>
          <input type="range" min={0} max={31} value={rt} onChange={(e) => setRt(Number(e.target.value))} data-testid="w1553-rt" className="accent-accent" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={tr === 1} onChange={(e) => setTr(e.target.checked ? 1 : 0)} data-testid="w1553-tr" className="h-5 w-5 accent-accent" />
          T/R = 1 (RT transmits)
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Subaddress: {sa}</span>
          <input type="range" min={0} max={31} value={sa} onChange={(e) => setSa(Number(e.target.value))} data-testid="w1553-sa" className="accent-accent" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span>Word count: {wc}</span>
          <input type="range" min={0} max={31} value={wc} onChange={(e) => setWc(Number(e.target.value))} data-testid="w1553-wc" className="accent-accent" />
        </label>
      </div>
      <p className="rounded-lg bg-surface-2 px-3 py-2 text-sm" data-testid="w1553-readout">
        16 data bits = <strong>0x{value.toString(16).toUpperCase().padStart(4, "0")}</strong>, {ones} ones, so the parity bit is <strong>{parity}</strong> to make the total odd. Meaning: {tr ? "the bus controller asks RT " + rt + " to transmit" : "the bus controller will send RT " + rt} {sa === 0 || sa === 31 ? `a mode command (${wcMeaning})` : `subaddress ${sa}, ${wcMeaning}`}.
      </p>
    </div>
  );
}
